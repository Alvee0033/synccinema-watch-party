"use client";
import { useState } from "react";
import { Search, Film, Tv, Play } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MovieSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;
        setLoading(true);

        try {
            const { searchMovies } = await import('@/lib/himoviesClient');
            const data = await searchMovies(query);
            setResults(data);
        } catch (err) {
            console.error('Search error:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const startWithMovie = (movie: any) => {
        // Generate a room ID
        const roomId = Math.random().toString(36).substring(7);
        // Encode the movie URL/ID to pass to the room
        // Ideally we store this in DB, but query param works for MVP
        router.push(`/room?id=${roomId}\u0026movieHref=${encodeURIComponent(movie.href)}\u0026title=${encodeURIComponent(movie.title)}`);
    };

    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-4">Search Movies</h3>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Avengers, Inception..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="p-2 bg-purple-600/20 hover:bg-purple-600/40 rounded-lg border border-purple-500/50 transition-colors"
                >
                    <Search className="w-5 h-5 text-purple-200" />
                </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {results.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-purple-500/30 transition-all group">
                        <div className="p-3 bg-black/40 rounded-lg text-purple-400">
                            {item.type === 'movie' ? <Film size={20} /> : <Tv size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold truncate group-hover:text-purple-300 transition-colors">{item.title}</h4>
                            <p className="text-xs text-white/40">{item.info} • {item.type.toUpperCase()}</p>
                        </div>
                        <button
                            onClick={() => startWithMovie(item)}
                            className="p-2 bg-white/5 hover:bg-green-500 hover:text-white rounded-full transition-colors"
                        >
                            <Play size={16} fill="currentColor" />
                        </button>
                    </div>
                ))}
                {results.length === 0 && !loading && <p className="text-center text-white/20 mt-10">Search for 4K movies & TV shows</p>}
                {loading && <p className="text-center text-purple-400/60 animate-pulse mt-10">Scanning database...</p>}
            </div>
        </div>
    );
}
