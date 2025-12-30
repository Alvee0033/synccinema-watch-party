"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Chat from "@/components/room/Chat";
import ControlDeck from "@/components/room/ControlDeck";
import { useFirebaseSync } from "@/hooks/useFirebaseSync";
import { Play, Pause, ExternalLink, Video, VideoOff, Phone, PhoneOff, MonitorUp, MonitorOff, Loader2 } from "lucide-react";

export default function Room() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') || 'default';
    const [loading, setLoading] = useState(true);
    const [watchUrl, setWatchUrl] = useState("");
    const [videoEnabled, setVideoEnabled] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [screenSharing, setScreenSharing] = useState(false);

    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

    const cameraRef = useRef<HTMLVideoElement>(null);
    const screenRef = useRef<HTMLVideoElement>(null);

    const movieHref = searchParams.get('movieHref');
    const movieTitle = searchParams.get('title') || 'Movie';

    const { isPlaying, updatePlayback } = useFirebaseSync(id as string, { current: null });

    useEffect(() => {
        if (movieHref) {
            fetchPlayerUrl();
        } else {
            setLoading(false);
        }
    }, [movieHref]);

    // Handle webcam/audio
    useEffect(() => {
        if (videoEnabled || audioEnabled) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [videoEnabled, audioEnabled]);

    // Update screen video element when stream changes
    useEffect(() => {
        if (screenRef.current && screenStream) {
            console.log('Setting screen stream to video element');
            screenRef.current.srcObject = screenStream;
            screenRef.current.play().catch(err => {
                console.error('Error playing screen share video:', err);
            });
        }
    }, [screenStream]);

    // Update camera video element when stream changes
    useEffect(() => {
        if (cameraRef.current && cameraStream && videoEnabled) {
            console.log('Setting camera stream to video element');
            cameraRef.current.srcObject = cameraStream;
            cameraRef.current.play().catch(err => {
                console.error('Error playing camera video:', err);
            });
        }
    }, [cameraStream, videoEnabled]);

    const fetchPlayerUrl = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/himovies/player?href=${encodeURIComponent(movieHref!)}`);
            const data = await res.json();
            setWatchUrl(data.watchUrl || `https://himovies.sx${movieHref}`);
        } catch (err) {
            console.error('Failed to fetch player:', err);
            setWatchUrl(`https://himovies.sx${movieHref}`);
        } finally {
            setLoading(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoEnabled,
                audio: audioEnabled
            });

            console.log('Camera stream started:', stream.getTracks());
            setCameraStream(stream);
        } catch (err) {
            console.error('Error accessing camera/mic:', err);
            alert('Could not access camera/microphone. Please grant permissions.');
            setVideoEnabled(false);
            setAudioEnabled(false);
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            console.log('Stopping camera stream');
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        if (cameraRef.current) {
            cameraRef.current.srcObject = null;
        }
    };

    const startScreenShare = async () => {
        try {
            console.log('Requesting screen share...');
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    displaySurface: "browser",
                } as any,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } as any
            });

            console.log('Screen share stream started:', stream.getTracks());
            console.log('Video track settings:', stream.getVideoTracks()[0]?.getSettings());

            setScreenStream(stream);
            setScreenSharing(true);

            // Handle when user stops sharing via browser UI
            stream.getVideoTracks()[0].onended = () => {
                console.log('Screen share ended by user');
                stopScreenShare();
            };
        } catch (err: any) {
            console.error('Error starting screen share:', err);
            if (err.name === 'NotAllowedError') {
                alert('Screen sharing was denied. Please allow screen sharing and try again.');
            } else if (err.name === 'NotFoundError') {
                alert('No screen/window selected. Please select a screen or window to share.');
            } else {
                alert('Could not start screen sharing: ' + err.message);
            }
            setScreenSharing(false);
        }
    };

    const stopScreenShare = () => {
        console.log('Stopping screen share');
        if (screenStream) {
            screenStream.getTracks().forEach(track => {
                console.log('Stopping track:', track.kind, track.label);
                track.stop();
            });
            setScreenStream(null);
        }
        if (screenRef.current) {
            screenRef.current.srcObject = null;
        }
        setScreenSharing(false);
    };

    const toggleScreenShare = () => {
        if (screenSharing) {
            stopScreenShare();
        } else {
            startScreenShare();
        }
    };

    const openInNewTab = () => {
        if (watchUrl) {
            window.open(watchUrl, '_blank', 'noopener,noreferrer');
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    <p className="text-white/60">Loading {movieTitle}...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-background overflow-hidden flex flex-col md:flex-row">

            {/* Desktop: Main Area */}
            <div className="hidden md:flex flex-1 flex-col p-6 gap-6 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="flex-1 min-h-0 z-10 flex flex-col gap-6">
                    {/* Screen Share Display (Large) */}
                    {screenSharing ? (
                        <div className="flex-1 min-h-0 bg-black rounded-2xl overflow-hidden border border-purple-500/50 shadow-2xl shadow-purple-500/20">
                            <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    <span className="text-sm font-bold">Screen Sharing Active</span>
                                </div>
                                <span className="text-xs opacity-80">
                                    {screenStream?.getVideoTracks()[0]?.label || 'Screen'}
                                </span>
                            </div>
                            <div className="relative w-full h-[calc(100%-48px)] bg-gray-900">
                                <video
                                    ref={screenRef}
                                    autoPlay
                                    playsInline
                                    muted={false}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    style={{ backgroundColor: '#000' }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 bg-gradient-to-br from-purple-900/20 via-black/40 to-black/60 rounded-2xl border border-purple-500/20 flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <MonitorOff size={64} className="mx-auto text-white/20" />
                                <p className="text-white/40">Click "Share Screen" to start sharing</p>
                            </div>
                        </div>
                    )}

                    {/* Control Panel */}
                    <div className="flex gap-6">
                        {/* Movie Info & Controls */}
                        <div className="flex-1 bg-gradient-to-br from-purple-900/30 via-black/40 to-black/60 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl p-6">
                            <div className="space-y-4">
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        {movieTitle}
                                    </h1>
                                    <p className="text-sm text-white/60">Room: <span className="font-mono text-purple-400">{id}</span></p>
                                </div>

                                {/* Play Movie Button */}
                                <button
                                    onClick={openInNewTab}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/50 hover:scale-105"
                                >
                                    <ExternalLink size={20} />
                                    Open Movie in New Tab
                                </button>

                                {/* WebRTC Controls */}
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-xs text-white/60 mb-3">Sharing Controls</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {/* Screen Share */}
                                        <button
                                            onClick={toggleScreenShare}
                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all ${screenSharing
                                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/50'
                                                : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'
                                                }`}
                                        >
                                            {screenSharing ? <MonitorUp size={24} /> : <MonitorOff size={24} />}
                                            <span className="text-xs">{screenSharing ? 'Stop Share' : 'Share Screen'}</span>
                                        </button>

                                        {/* Camera */}
                                        <button
                                            onClick={() => setVideoEnabled(!videoEnabled)}
                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all ${videoEnabled
                                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/50'
                                                : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'
                                                }`}
                                        >
                                            {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                                            <span className="text-xs">{videoEnabled ? 'Cam On' : 'Cam Off'}</span>
                                        </button>

                                        {/* Audio */}
                                        <button
                                            onClick={() => setAudioEnabled(!audioEnabled)}
                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all ${audioEnabled
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50'
                                                : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'
                                                }`}
                                        >
                                            {audioEnabled ? <Phone size={24} /> : <PhoneOff size={24} />}
                                            <span className="text-xs">{audioEnabled ? 'Mic On' : 'Mic Off'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Camera Preview */}
                        {videoEnabled && (
                            <div className="w-64 flex-shrink-0">
                                <div className="bg-black rounded-xl overflow-hidden border border-green-500/50 shadow-xl">
                                    <div className="p-2 bg-green-600 flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                        <span className="font-bold">Your Camera</span>
                                    </div>
                                    <video
                                        ref={cameraRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full aspect-video bg-black"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="z-10">
                    <ControlDeck />
                </div>
            </div>

            {/* Desktop: Sidebar Chat */}
            <div className="hidden md:block w-[400px] border-l border-white/5 bg-glass p-0">
                <Chat roomId={id as string} />
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col h-full bg-background">
                <div className="p-4 bg-purple-900/10 border-b border-purple-500/10">
                    <span className="font-bold text-purple-200">{movieTitle}</span>
                </div>

                {/* Screen Share Preview (Mobile) */}
                {screenSharing && (
                    <div className="p-4 flex-1">
                        <div className="bg-black rounded-xl overflow-hidden border border-purple-500/50 h-full flex flex-col">
                            <div className="p-2 bg-purple-600 text-sm font-bold flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                Screen Sharing
                            </div>
                            <video
                                ref={screenRef}
                                autoPlay
                                playsInline
                                className="flex-1 bg-black object-contain"
                            />
                        </div>
                    </div>
                )}

                {/* Camera Preview (Mobile) */}
                {videoEnabled && !screenSharing && (
                    <div className="p-4">
                        <div className="bg-black rounded-xl overflow-hidden border border-green-500/50">
                            <div className="p-2 bg-green-600 text-sm font-bold flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                Camera
                            </div>
                            <video
                                ref={cameraRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full aspect-video bg-black"
                            />
                        </div>
                    </div>
                )}

                <div className="p-4 space-y-3 border-t border-white/5">
                    <button
                        onClick={openInNewTab}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold shadow-lg"
                    >
                        <ExternalLink size={20} />
                        Open Movie
                    </button>

                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={toggleScreenShare}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium ${screenSharing ? 'bg-purple-600' : 'bg-white/5 border border-white/10'
                                }`}
                        >
                            {screenSharing ? <MonitorUp size={20} /> : <MonitorOff size={20} />}
                            <span>Screen</span>
                        </button>
                        <button
                            onClick={() => setVideoEnabled(!videoEnabled)}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium ${videoEnabled ? 'bg-green-600' : 'bg-white/5 border border-white/10'
                                }`}
                        >
                            {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                            <span>Camera</span>
                        </button>
                        <button
                            onClick={() => setAudioEnabled(!audioEnabled)}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium ${audioEnabled ? 'bg-blue-600' : 'bg-white/5 border border-white/10'
                                }`}
                        >
                            {audioEnabled ? <Phone size={20} /> : <PhoneOff size={20} />}
                            <span>Mic</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 border-t border-white/5">
                    <Chat roomId={id as string} />
                </div>
            </div>
        </div>
    );
}
