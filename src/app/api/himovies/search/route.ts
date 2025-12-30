import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = "https://himovies.sx";

const createClient = () => axios.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: "Missing query 'q'" }, { status: 400 });
    }

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

        return NextResponse.json(results);
    } catch (e: any) {
        console.error('Search error:', e.message);
        return NextResponse.json({ error: e.message || "Search failed" }, { status: 500 });
    }
}
