"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Film, Tv } from "lucide-react";

export default function MovieLibrary() {
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState<'movie' | 'tv'>('movie');
    const router = useRouter();

    useEffect(() => {
        fetchMovies();
    }, [type]);

    const fetchMovies = async () => {
        setLoading(true);
        try {
            const { getMovies } = await import('@/lib/himoviesClient');
            const section = type === 'movie' ? 'latest-movies' : 'latest-tv';
            const data = await getMovies(section as any);
            setMovies(data);
        } catch (err) {
            console.error('Fetch movies error:', err);
            setMovies([]);
        } finally {
            setLoading(false);
        }
    };

    const startWatching = (movie: any) => {
        const roomId = Math.random().toString(36).substring(7);
        router.push(`/room?id=${roomId}&movieHref=${encodeURIComponent(movie.href)}&title=${encodeURIComponent(movie.title)}`);
    };

    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Library</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setType('movie')}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${type === 'movie' ? 'bg-purple-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                        Movies
                    </button>
                    <button
                        onClick={() => setType('tv')}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${type === 'tv' ? 'bg-purple-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                        TV Shows
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 min-h-[300px]">
                    {movies.map((movie, idx) => (
                        <div key={idx} className="group relative aspect-[2/3] bg-black/40 rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all">
                            {movie.poster ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <Film className="text-white/20" size={32} />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                            <div className="absolute bottom-0 left-0 w-full p-3">
                                <h4 className="font-bold text-sm truncate text-white">{movie.title}</h4>
                                <p className="text-[10px] text-white/50">{movie.info}</p>
                            </div>

                            <button
                                onClick={() => startWatching(movie)}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all shadow-lg shadow-purple-900/40"
                            >
                                <Play size={20} fill="currentColor" />
                            </button>
                        </div>
                    ))}
                    {movies.length === 0 && <p className="col-span-full text-center text-white/30">No items found.</p>}
                </div>
            )}
        </div>
    );
}
