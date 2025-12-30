"use client";
import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useFirebaseSync } from "@/hooks/useFirebaseSync";

// Dynamic import to avoid SSR issues with ReactPlayer
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export default function VideoPlayer({ roomId, url }: { roomId: string, url: string }) {
    const playerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const { isPlaying, updatePlayback } = useFirebaseSync(roomId, playerRef);
    const [hasWindow, setHasWindow] = useState(false);
    const [isIframe, setIsIframe] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        setHasWindow(true); // eslint-disable-line react-hooks/set-state-in-effect

        // Detect if URL should be rendered as iframe
        setIsIframe(
            url.includes('himovies.sx') ||
            url.includes('embed') ||
            url.includes('vidsrc') ||
            url.includes('vidplay') ||
            url.includes('iframe')
        );

        console.log('VideoPlayer URL:', url);
        console.log('Is Iframe:', url.includes('himovies.sx') || url.includes('embed'));
    }, [url]);

    if (!hasWindow) return <div className="w-full pt-[56.25%] bg-gray-900 animate-pulse rounded-xl" />;

    return (
        <div className="relative w-full pt-[56.25%] bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl group">
            {/* Debug button */}
            <button
                onClick={() => setShowDebug(!showDebug)}
                className="absolute top-2 right-2 z-50 px-2 py-1 bg-black/50 text-white/60 text-xs rounded hover:bg-black/70"
            >
                Debug
            </button>

            {showDebug && (
                <div className="absolute top-10 right-2 z-50 max-w-md p-3 bg-black/90 text-white/80 text-xs rounded border border-white/20 overflow-auto max-h-32">
                    <div className="mb-1"><strong>URL:</strong></div>
                    <div className="break-all mb-2">{url}</div>
                    <div><strong>Type:</strong> {isIframe ? 'Iframe' : 'ReactPlayer'}</div>
                </div>
            )}

            <div className="absolute top-0 left-0 w-full h-full">
                {isIframe ? (
                    // Render as iframe for embedded players
                    <iframe
                        src={url}
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        sandbox="allow-same-origin allow-scripts allow-presentation"
                        title="Movie Player"
                    />
                ) : (
                    // Render ReactPlayer for direct video URLs
                    <ReactPlayer
                        ref={playerRef}
                        url={url}
                        playing={isPlaying}
                        controls={true}
                        width="100%"
                        height="100%"
                        onPlay={() => updatePlayback(true, playerRef.current?.getCurrentTime() || 0)}
                        onPause={() => updatePlayback(false, playerRef.current?.getCurrentTime() || 0)}
                        onSeek={(seconds: number) => updatePlayback(true, seconds)}
                        style={{ position: 'absolute', top: 0, left: 0 }}
                        {...({} as any)}
                    />
                )}
            </div>
        </div>
    );
}
