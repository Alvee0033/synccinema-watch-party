import { useEffect, useState } from "react";
import { ref, onValue, set, serverTimestamp } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export function useFirebaseSync(roomId: string, playerRef: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const [isPlaying, setIsPlaying] = useState(false);
    // const [remoteTime, setRemoteTime] = useState(0); // Removing unused variables

    useEffect(() => {
        if (!roomId) return;
        const playbackRef = ref(rtdb, `rooms/${roomId}/playback`);

        const unsub = onValue(playbackRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setIsPlaying(data.isPlaying);
                // We don't always seek, only if significant drift
                // But simplified: trust remote
                if (Math.abs(data.timestamp - (playerRef.current?.getCurrentTime() || 0)) > 2) {
                    playerRef.current?.seekTo(data.timestamp, 'seconds');
                }
            }
        });

        return () => unsub();
    }, [roomId, playerRef]);

    const updatePlayback = (playing: boolean, time: number) => {
        // Debounce or check if update is needed could happen here
        set(ref(rtdb, `rooms/${roomId}/playback`), {
            isPlaying: playing,
            timestamp: time,
            lastUpdated: serverTimestamp()
        });
    };

    return { isPlaying, updatePlayback };
}
