import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = "https://himovies.sx";

const createClient = () => axios.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": BASE_URL,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    }
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const movieHref = searchParams.get('href'); // e.g., /movie/avatar-19690

    if (!movieHref) {
        return NextResponse.json({ error: "Missing 'href' parameter" }, { status: 400 });
    }

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
            watchUrl = slug.replace('tv/', 'watch-tv/') + '.1'; // Default to episode 1
        } else {
            watchUrl = movieHref.replace(/^\//, '');
        }

        const fullUrl = `${BASE_URL}/${watchUrl}`;
        console.log('Fetching player from:', fullUrl);

        const { data } = await client.get(fullUrl);
        const $ = cheerio.load(data);

        // Strategy 1: Look for the actual embed iframe in the page source
        let embedUrl = '';

        // Check for iframe with specific IDs or classes
        const iframe = $('#iframe-embed, #player-iframe, .player-iframe, iframe[data-src]').first();
        if (iframe.length > 0) {
            embedUrl = iframe.attr('src') || iframe.attr('data-src') || '';
        }

        // Strategy 2: Search in script tags for server URLs or embed links
        if (!embedUrl) {
            const scripts = $('script').map((i, el) => $(el).html()).get();
            for (const script of scripts) {
                if (!script) continue;

                // Look for VidSrc or similar embed patterns
                const vidsrcMatch = script.match(/(?:vidsrc|vidplay|embed)\.(?:to|pro|net|cc)\/[^\s"']+/i);
                if (vidsrcMatch) {
                    embedUrl = vidsrcMatch[0].startsWith('http') ? vidsrcMatch[0] : `https://${vidsrcMatch[0]}`;
                    break;
                }

                // Look for direct video URLs
                const m3u8Match = script.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/);
                if (m3u8Match) {
                    return NextResponse.json({
                        success: true,
                        playerUrl: m3u8Match[1],
                        type: 'hls',
                        watchUrl: fullUrl
                    });
                }

                const mp4Match = script.match(/(https?:\/\/[^\s"']+\.mp4[^\s"']*)/);
                if (mp4Match) {
                    return NextResponse.json({
                        success: true,
                        playerUrl: mp4Match[1],
                        type: 'video',
                        watchUrl: fullUrl
                    });
                }
            }
        }

        // Strategy 3: Look for data attributes on the page
        if (!embedUrl) {
            const dataEmbedUrl = $('[data-embed-url], [data-src], [data-player]').first().attr('data-embed-url')
                || $('[data-embed-url], [data-src], [data-player]').first().attr('data-src')
                || $('[data-embed-url], [data-src], [data-player]').first().attr('data-player');
            if (dataEmbedUrl) {
                embedUrl = dataEmbedUrl;
            }
        }

        // Strategy 4: Check all iframes on the page
        if (!embedUrl) {
            $('iframe').each((i, el) => {
                const src = $(el).attr('src') || $(el).attr('data-src');
                if (src && (src.includes('embed') || src.includes('player') || src.includes('vidsrc'))) {
                    embedUrl = src;
                    return false; // Break the loop
                }
            });
        }

        if (embedUrl) {
            // Normalize the URL
            const fullEmbedUrl = embedUrl.startsWith('http') ? embedUrl :
                embedUrl.startsWith('//') ? `https:${embedUrl}` :
                    embedUrl.startsWith('/') ? `${BASE_URL}${embedUrl}` :
                        `https://${embedUrl}`;

            return NextResponse.json({
                success: true,
                playerUrl: fullEmbedUrl,
                type: 'iframe',
                watchUrl: fullUrl
            });
        }

        // Fallback: Return watch page URL
        console.log('No embed URL found, falling back to watch page');
        return NextResponse.json({
            success: true,
            message: "Could not find embedded player, using watch page",
            playerUrl: fullUrl,
            type: 'page',
            watchUrl: fullUrl
        });

    } catch (e: any) {
        console.error('Player extraction error:', e.message);
        return NextResponse.json({
            error: e.message || "Failed to extract player",
            success: false
        }, { status: 500 });
    }
}
