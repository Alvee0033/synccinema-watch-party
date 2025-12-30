"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";

export default function FriendList() {
    const { user } = useAuth();
    const router = useRouter();
    const [friends, setFriends] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [statuses, setStatuses] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                setFriends(docSnap.data()?.friends || []);
            }
        });
        return () => unsub();
    }, [user]);

    // Listen to status of friends
    useEffect(() => {
        if (friends.length === 0) return;

        const unsubs = friends.map(f => {
            const statusRef = ref(rtdb, `status/${f.uid}/state`);
            return onValue(statusRef, (snap) => {
                setStatuses(prev => ({ ...prev, [f.uid]: snap.val() || 'offline' }));
            });
        });

        return () => unsubs.forEach(u => u());
    }, [friends]);

    const startRoom = () => {
        const roomId = Math.random().toString(36).substring(7);
        router.push(`/room/${roomId}`);
    };

    return (
        <div className="glass-panel p-6 h-full flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Friends ({friends.length})</h3>
                <button onClick={startRoom} className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-purple-500 transition-colors shadow-lg shadow-purple-900/20">
                    <Video size={14} /> Start Party
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {friends.length === 0 && <p className="text-white/30 text-center mt-10">No friends yet. Search above!</p>}
                {friends.map(friend => (
                    <div key={friend.uid} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-white/5">
                        <div className="relative">
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={friend.photoURL || "/default-avatar.png"} alt={friend.displayName} className="w-10 h-10 rounded-full" />
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#050505] ${statuses[friend.uid] === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'
                                }`} />
                        </div>
                        <div>
                            <p className="font-medium group-hover:text-purple-300 transition-colors">{friend.displayName}</p>
                            <p className="text-xs text-white/40">{statuses[friend.uid] === 'online' ? 'Online' : 'Offline'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
