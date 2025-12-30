import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = "https://himovies.sx";

// Helper for axios instance with proper headers
const createClient = () => axios.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'trending'; // trending, latest-movies, latest-tv

    try {
        const client = createClient();
        const { data } = await client.get(`${BASE_URL}/home`);

        const $ = cheerio.load(data);
        const movies: any[] = [];

        // Find the appropriate section based on request
        let sectionSelector = '';
        if (section === 'trending') {
            sectionSelector = '.block_area:has(h2:contains("Trending"))';
        } else if (section === 'latest-movies') {
            sectionSelector = '.block_area:has(h2:contains("Latest Movies"))';
        } else if (section === 'latest-tv') {
            sectionSelector = '.block_area:has(h2:contains("Latest TV Shows"))';
        } else {
            sectionSelector = '.block_area:has(h2:contains("Trending"))';
        }

        // Parse movie items
        $(sectionSelector).find('.film_list-wrap .flw-item').each((i, el) => {
            const $item = $(el);
            const $link = $item.find('.film-poster a');
            const $detail = $item.find('.film-detail');

            const href = $link.attr('href') || '';
            const title = $link.attr('title') || $detail.find('.film-name a').text().trim();
            const poster = $item.find('.film-poster img').attr('data-src') || $item.find('.film-poster img').attr('src') || '';
            const quality = $item.find('.film-poster .fdi-item:first').text().trim();
            const year = $detail.find('.fd-infor .fdi-item:first').text().trim();

            // Extract ID from href (e.g., /movie/avatar-19690 => 19690)
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

        return NextResponse.json(movies.slice(0, 20)); // Limit to 20 items
    } catch (e: any) {
        console.error('Scraping error:', e.message);
        return NextResponse.json({ error: e.message || "Scraping failed" }, { status: 500 });
    }
}
