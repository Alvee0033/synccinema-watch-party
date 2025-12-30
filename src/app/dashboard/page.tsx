"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, Sparkles, Users, Film } from "lucide-react";
import UserSearch from "@/components/social/UserSearch";
import RequestList from "@/components/social/RequestList";
import FriendList from "@/components/social/FriendList";
import MovieSearch from "@/components/social/MovieSearch";
import NetflixLibrary from "@/components/social/NetflixLibrary";

export default function Dashboard() {
    const { user, signOut, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050505] via-purple-950/10 to-[#050505]">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
                    <div className="absolute inset-0 w-16 h-16 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
                </div>
                <p className="text-white/60">Loading...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050505] via-purple-950/5 to-[#050505] flex flex-col relative overflow-hidden">

            {/* Animated background blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute -bottom-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            {/* Header */}
            <header className="relative z-10 flex justify-between items-center p-6 md:p-10 max-w-7xl w-full mx-auto">
                <div className="space-y-1 animate-fade-in-down">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/50">
                            <Film className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                            SyncCinema
                        </h1>
                        <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    </div>
                    <p className="text-white/60 ml-14 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Welcome back, <span className="text-white font-semibold">{user.displayName}</span>
                    </p>
                </div>
                <button
                    onClick={signOut}
                    className="group flex items-center gap-2 text-sm text-white/60 hover:text-white transition-all px-5 py-3 rounded-xl hover:bg-white/5 border border-white/0 hover:border-white/10 backdrop-blur-sm"
                >
                    <LogOut size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                    <span className="hidden sm:inline">Sign Out</span>
                </button>
            </header>

            {/* Main Content */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 px-6 md:px-10 max-w-7xl w-full mx-auto mb-12">

                {/* Left Column: Social Features */}
                <div className="md:col-span-12 lg:col-span-4 space-y-6">
                    <div className="space-y-6 lg:sticky lg:top-6">

                        {/* Movie Search Card */}
                        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-transparent border border-purple-500/20 backdrop-blur-xl shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative p-1">
                                <div className="h-[400px]">
                                    <MovieSearch />
                                </div>
                            </div>
                        </div>

                        {/* User Search Card */}
                        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/20 via-blue-800/10 to-transparent border border-blue-500/20 backdrop-blur-xl shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative">
                                <UserSearch />
                            </div>
                        </div>

                        {/* Request List Card */}
                        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-900/20 via-pink-800/10 to-transparent border border-pink-500/20 backdrop-blur-xl shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative">
                                <RequestList />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Friends List */}
                <div className="md:col-span-12 lg:col-span-8">
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-900/20 via-cyan-800/10 to-transparent border border-cyan-500/20 backdrop-blur-xl shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 hover:scale-[1.01]">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Header */}
                        <div className="relative p-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-600/20 to-blue-600/20">
                                    <Users className="w-5 h-5 text-cyan-400" />
                                </div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                    Your Squad
                                </h2>
                            </div>
                        </div>

                        <div className="relative">
                            <FriendList />
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-width Movie Library */}
            <div className="relative z-10 flex-1">
                <NetflixLibrary />
            </div>
        </div>
    );
}
