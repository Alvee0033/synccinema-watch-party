import axios from 'axios';
import * as cheerio from 'cheerio';
import { ref, get, set } from 'firebase/database';
import { rtdb } from './firebase';

const BASE_URL = "https://himovies.sx";

const createClient = () => axios.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
});

interface CacheData {
    data: any;
    timestamp: number;
    expiresAt: number;
}

/**
 * Get cached data from Firebase Realtime Database
 */
async function getCached(cacheKey: string, cachePath: string = 'movies'): Promise<any | null> {
    if (!rtdb) return null;

    try {
        const cacheRef = ref(rtdb, `cache/${cachePath}/${cacheKey}`);
        const snapshot = await get(cacheRef);

        if (snapshot.exists()) {
            const cached: CacheData = snapshot.val();
            const now = Date.now();

            // Check if cache is still valid
            if (cached.expiresAt > now) {
                console.log(`Cache hit for ${cacheKey}`);
                return cached.data;
            } else {
                console.log(`Cache expired for ${cacheKey}`);
            }
        }
    } catch (error) {
        console.error('Cache read error:', error);
    }

    return null;
}

/**
 * Set cached data in Firebase Realtime Database
 */
async function setCached(cacheKey: string, data: any, ttlMinutes: number, cachePath: string = 'movies'): Promise<void> {
    if (!rtdb) return;

    try {
        const now = Date.now();
        const cacheData: CacheData = {
            data,
            timestamp: now,
            expiresAt: now + (ttlMinutes * 60 * 1000)
        };

        const cacheRef = ref(rtdb, `cache/${cachePath}/${cacheKey}`);
        await set(cacheRef, cacheData);
        console.log(`Cached ${cacheKey} for ${ttlMinutes} minutes`);
    } catch (error) {
        console.error('Cache write error:', error);
    }
}

/**
 * Search for movies/TV shows
 */
export async function searchMovies(query: string): Promise<any[]> {
    const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;

    // Try cache first
    const cached = await getCached(cacheKey, 'search');
    if (cached) return cached;

    try {
        const client = createClient();
        const { data } = await client.get(`${BASE_URL}/search/${encodeURIComponent(query)}`);

        const $ = cheerio.load(data);
        const results: any[] = [];

        $('.film_list-wrap .flw-item').each((i, el) => {
            const $item = $(el);
            const $link = $item.find('.film-poster a');
            const $detail = $item.find('.film-detail');

            const href = $link.attr('href') || '';
            const title = $link.attr('title') || $detail.find('.film-name a').text().trim();
            const poster = $item.find('.film-poster img').attr('data-src') || $item.find('.film-poster img').attr('src') || '';
            const year = $detail.find('.fd-infor .fdi-item:first').text().trim();

            const id = href.split('-').pop() || '';
            const type = href.includes('/tv/') ? 'tv' : 'movie';

            results.push({
                id,
                title,
                href,
                poster: poster.startsWith('http') ? poster : `${BASE_URL}${poster}`,
                type,
                year,
                info: year
            });
        });

        // Cache for 1 hour
        await setCached(cacheKey, results, 60, 'search');

        return results;
    } catch (error: any) {
        console.error('Search error:', error.message);
        throw new Error(`Search failed: ${error.message}`);
    }
}

/**
 * Get trending, latest movies, or latest TV shows
 */
export async function getMovies(section: 'trending' | 'latest-movies' | 'latest-tv' = 'trending'): Promise<any[]> {
    const cacheKey = `movies_${section}`;

    // Try cache first
    const cached = await getCached(cacheKey, 'movies');
    if (cached) return cached;

    try {
        const client = createClient();
        const { data } = await client.get(`${BASE_URL}/home`);

        const $ = cheerio.load(data);
        const movies: any[] = [];

        // Find the appropriate section
        let sectionSelector = '';
        if (section === 'trending') {
            sectionSelector = '.block_area:has(h2:contains("Trending"))';
        } else if (section === 'latest-movies') {
            sectionSelector = '.block_area:has(h2:contains("Latest Movies"))';
        } else if (section === 'latest-tv') {
            sectionSelector = '.block_area:has(h2:contains("Latest TV Shows"))';
        }

        $(sectionSelector).find('.film_list-wrap .flw-item').each((i, el) => {
            const $item = $(el);
            const $link = $item.find('.film-poster a');
            const $detail = $item.find('.film-detail');

            const href = $link.attr('href') || '';
            const title = $link.attr('title') || $detail.find('.film-name a').text().trim();
            const poster = $item.find('.film-poster img').attr('data-src') || $item.find('.film-poster img').attr('src') || '';
            const quality = $item.find('.film-poster .fdi-item:first').text().trim();
            const year = $detail.find('.fd-infor .fdi-item:first').text().trim();

            const id = href.split('-').pop() || '';
            const type = href.includes('/tv/') ? 'tv' : 'movie';

            movies.push({
                id,
                title,
                href,
                poster: poster.startsWith('http') ? poster : `${BASE_URL}${poster}`,
                type,
                quality,
                year,
                info: `${year} ${quality}`.trim()
            });
        });

        const results = movies.slice(0, 20);

        // Cache for 24 hours
        await setCached(cacheKey, results, 1440, 'movies');

        return results;
    } catch (error: any) {
        console.error('Movies fetch error:', error.message);
        throw new Error(`Failed to fetch movies: ${error.message}`);
    }
}

/**
 * Get player URL for a movie/TV show
 */
export async function getPlayerUrl(movieHref: string): Promise<any> {
    const cacheKey = `player_${movieHref.replace(/\//g, '_')}`;

    // Try cache first
    const cached = await getCached(cacheKey, 'player');
    if (cached) return cached;

    try {
        const client = createClient();

        // Convert to watch URL format
        const slug = movieHref.replace(/^\//, '');
        const isMovie = slug.startsWith('movie/');
        const isTv = slug.startsWith('tv/');

        let watchUrl = '';
        if (isMovie) {
            watchUrl = slug.replace('movie/', 'watch-movie/');
        } else if (isTv) {
            watchUrl = slug.replace('tv/', 'watch-tv/') + '.1';
        } else {
            watchUrl = movieHref.replace(/^\//, '');
        }

        const fullUrl = `${BASE_URL}/${watchUrl}`;
        const { data } = await client.get(fullUrl);
        const $ = cheerio.load(data);

        let embedUrl = '';

        // Strategy 1: Look for iframe
        const iframe = $('#iframe-embed, #player-iframe, .player-iframe, iframe[data-src]').first();
        if (iframe.length > 0) {
            embedUrl = iframe.attr('src') || iframe.attr('data-src') || '';
        }

        // Strategy 2: Search scripts
        if (!embedUrl) {
            const scripts = $('script').map((i, el) => $(el).html()).get();
            for (const script of scripts) {
                if (!script) continue;

                const vidsrcMatch = script.match(/(?:vidsrc|vidplay|embed)\.(?:to|pro|net|cc)\/[^\s"']+/i);
                if (vidsrcMatch) {
                    embedUrl = vidsrcMatch[0].startsWith('http') ? vidsrcMatch[0] : `https://${vidsrcMatch[0]}`;
                    break;
                }

                const m3u8Match = script.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/);
                if (m3u8Match) {
                    const result = {
                        success: true,
                        playerUrl: m3u8Match[1],
                        type: 'hls',
                        watchUrl: fullUrl
                    };
                    await setCached(cacheKey, result, 1440, 'player');
                    return result;
                }

                const mp4Match = script.match(/(https?:\/\/[^\s"']+\.mp4[^\s"']*)/);
                if (mp4Match) {
                    const result = {
                        success: true,
                        playerUrl: mp4Match[1],
                        type: 'video',
                        watchUrl: fullUrl
                    };
                    await setCached(cacheKey, result, 1440, 'player');
                    return result;
                }
            }
        }

        // Strategy 3: Data attributes
        if (!embedUrl) {
            const dataEmbedUrl = $('[data-embed-url], [data-src], [data-player]').first().attr('data-embed-url')
                || $('[data-embed-url], [data-src], [data-player]').first().attr('data-src')
                || $('[data-embed-url], [data-src], [data-player]').first().attr('data-player');
            if (dataEmbedUrl) {
                embedUrl = dataEmbedUrl;
            }
        }

        // Strategy 4: All iframes
        if (!embedUrl) {
            $('iframe').each((i, el) => {
                const src = $(el).attr('src') || $(el).attr('data-src');
                if (src && (src.includes('embed') || src.includes('player') || src.includes('vidsrc'))) {
                    embedUrl = src;
                    return false;
                }
            });
        }

        if (embedUrl) {
            const fullEmbedUrl = embedUrl.startsWith('http') ? embedUrl :
                embedUrl.startsWith('//') ? `https:${embedUrl}` :
                    embedUrl.startsWith('/') ? `${BASE_URL}${embedUrl}` :
                        `https://${embedUrl}`;

            const result = {
                success: true,
                playerUrl: fullEmbedUrl,
                type: 'iframe',
                watchUrl: fullUrl
            };

            // Cache for 24 hours
            await setCached(cacheKey, result, 1440, 'player');

            return result;
        }

        // Fallback
        const result = {
            success: true,
            message: "Could not find embedded player, using watch page",
            playerUrl: fullUrl,
            type: 'page',
            watchUrl: fullUrl
        };

        // Cache fallback for shorter time (1 hour)
        await setCached(cacheKey, result, 60, 'player');

        return result;
    } catch (error: any) {
        console.error('Player extraction error:', error.message);
        throw new Error(`Failed to extract player: ${error.message}`);
    }
}
