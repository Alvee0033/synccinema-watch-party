import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ref, onChildAdded, push, set, remove } from "firebase/database";
import { rtdb } from "@/lib/firebase";
// @ts-ignore
import SimplePeer from "simple-peer";

export function useWebRTC(roomId: string) {
    const { user } = useAuth();
    const [peers, setPeers] = useState<any[]>([]);
    const peersRef = useRef<any[]>([]); // Keep track of peer objects
    const localStreamRef = useRef<MediaStream | null>(null);

    // Initialize Local Stream (Fake for now or getUserMedia)
    const startStream = async (video: boolean, audio: boolean) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
            localStreamRef.current = stream;
            // Add track to existing peers? Logic gets complex here.
            // For MVP: Restart connection if stream changes or use replaceTrack
            return stream;
        } catch (err) {
            console.error("Failed to get local stream", err);
            return null;
        }
    };

    useEffect(() => {
        if (!user || !roomId) return;

        // Signaling Logic
        // 1. Join Room: Announce presence
        const presenceRef = ref(rtdb, `rooms/${roomId}/peers/${user.uid}`);
        set(presenceRef, {
            name: user.displayName,
            joined: Date.now()
        });

        // 2. Listen for other peers joining (Initiator logic)
        // This is a simplified mesh. 
        // For a true mesh, we need a refined signaling handshake.
        // Given complexity, we'll implement a "Call" button approach initially or auto-connect.

        // Clean up on unmount
        return () => {
            remove(presenceRef);
            peersRef.current.forEach(p => p.destroy());
        };
    }, [roomId, user]);

    return { peers, startStream };
}
