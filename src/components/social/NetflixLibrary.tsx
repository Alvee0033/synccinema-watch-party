"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, ChevronLeft, ChevronRight, Info, Star, TrendingUp } from "lucide-react";

interface Movie {
    id: string;
    title: string;
    href: string;
    poster: string;
    type: string;
    quality?: string;
    year?: string;
    info: string;
}

interface Category {
    title: string;
    endpoint: string;
    icon: any;
    gradient: string;
}

const categories: Category[] = [
    {
        title: "Trending Now",
        endpoint: "/api/himovies/movies?section=trending",
        icon: TrendingUp,
        gradient: "from-red-500 via-purple-500 to-pink-500"
    },
    {
        title: "Latest Movies",
        endpoint: "/api/himovies/movies?section=latest-movies",
        icon: Star,
        gradient: "from-blue-500 via-cyan-500 to-teal-500"
    },
    {
        title: "Latest TV Shows",
        endpoint: "/api/himovies/movies?section=latest-tv",
        icon: Play,
        gradient: "from-orange-500 via-yellow-500 to-amber-500"
    },
];

function MovieRow({ title, movies, router, icon: Icon, gradient }: { title: string; movies: Movie[]; router: any; icon: any; gradient: string }) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const scroll = (direction: 'left' | 'right') => {
        if (rowRef.current) {
            const scrollAmount = rowRef.current.clientWidth * 0.8;
            rowRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handleScroll = () => {
        if (rowRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
            setShowLeft(scrollLeft > 0);
            setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const startWatching = (movie: Movie) => {
        const roomId = Math.random().toString(36).substring(7);
        router.push(`/room/${roomId}?movieId=${movie.id}&movieHref=${encodeURIComponent(movie.href)}&title=${encodeURIComponent(movie.title)}`);
    };

    return (
        <div className="mb-12 group/row">
            {/* Section Header with Icon */}
            <div className="flex items-center gap-3 mb-6 px-12">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} bg-opacity-20`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <h2 className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                    {title}
                </h2>
            </div>

            <div className="relative">
                {/* Left Arrow */}
                {showLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all">
                            <ChevronLeft className="w-6 h-6" />
                        </div>
                    </button>
                )}

                {/* Movie Row */}
                <div
                    ref={rowRef}
                    onScroll={handleScroll}
                    className="flex gap-3 overflow-x-auto scrollbar-hide px-12 scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {movies.map((movie, idx) => (
                        <div
                            key={idx}
                            className="relative flex-shrink-0 w-[280px] group/card transition-all duration-500 hover:scale-110 hover:z-20"
                            style={{ transformOrigin: 'center center' }}
                        >
                            {/* Card Container */}
                            <div className="relative h-[420px] rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/20 via-black/40 to-black/60 border border-white/10 shadow-2xl transition-all duration-500 group-hover/card:border-purple-500/50 group-hover/card:shadow-purple-500/20">

                                {/* Poster */}
                                <div className="relative h-[300px] overflow-hidden">
                                    {movie.poster ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={movie.poster}
                                                alt={movie.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                                            />
                                            {/* Animated gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity duration-500" />

                                            {/* Glow effect on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-purple-600/0 via-purple-600/0 to-purple-600/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-black/50">
                                            <Play size={64} className="text-white/30" />
                                        </div>
                                    )}

                                    {/* Quality badge with animation */}
                                    {movie.quality && (
                                        <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg transform transition-transform duration-300 group-hover/card:scale-110">
                                            {movie.quality}
                                        </div>
                                    )}

                                    {/* Type badge */}
                                    <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-semibold border border-white/20">
                                        {movie.type === 'movie' ? '🎬 Movie' : '📺 TV'}
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className="p-4 space-y-2">
                                    <h3 className="font-bold text-base line-clamp-2 text-white group-hover/card:text-purple-300 transition-colors duration-300">
                                        {movie.title}
                                    </h3>
                                    <p className="text-xs text-white/50 flex items-center gap-2">
                                        <span className="flex items-center gap-1">
                                            <Star size={12} className="text-yellow-500" />
                                            {movie.year}
                                        </span>
                                    </p>

                                    {/* Action buttons - visible on hover */}
                                    <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/card:translate-y-0">
                                        <button
                                            onClick={() => startWatching(movie)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-purple-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-purple-500/50 hover:scale-105"
                                        >
                                            <Play size={16} fill="currentColor" />
                                            Watch
                                        </button>
                                        <button className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 hover:border-purple-500/50 transition-all duration-300 hover:scale-110">
                                            <Info size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                {showRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-[#050505] via-[#050505]/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all">
                            <ChevronRight className="w-6 h-6" />
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}

export default function NetflixLibrary() {
    const [categoryMovies, setCategoryMovies] = useState<{ [key: string]: Movie[] }>({});
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchAllCategories();
    }, []);

    const fetchAllCategories = async () => {
        setLoading(true);
        const results: { [key: string]: Movie[] } = {};

        await Promise.all(
            categories.map(async (cat) => {
                try {
                    const res = await fetch(cat.endpoint);
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        results[cat.title] = data;
                    } else {
                        results[cat.title] = [];
                    }
                } catch (err) {
                    console.error(`Failed to fetch ${cat.title}:`, err);
                    results[cat.title] = [];
                }
            })
        );

        setCategoryMovies(results);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050505] via-purple-950/10 to-[#050505]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
                        <div className="absolute inset-0 w-16 h-16 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
                    </div>
                    <p className="text-white/60 font-medium">Loading amazing content...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050505] via-purple-950/5 to-[#050505] text-white pt-8 pb-20">
            {/* Animated background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10">
                {categories.map((cat) => (
                    <MovieRow
                        key={cat.title}
                        title={cat.title}
                        movies={categoryMovies[cat.title] || []}
                        router={router}
                        icon={cat.icon}
                        gradient={cat.gradient}
                    />
                ))}
            </div>

            {Object.values(categoryMovies).every(arr => arr.length === 0) && (
                <div className="text-center mt-32">
                    <div className="inline-block p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                        <p className="text-xl mb-2 font-semibold">No movies available</p>
                        <p className="text-sm text-white/50">The movie source might be temporarily unavailable</p>
                    </div>
                </div>
            )}
        </div>
    );
}
