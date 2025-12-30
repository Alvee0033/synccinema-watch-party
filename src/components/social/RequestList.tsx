"use client";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Check, X } from "lucide-react";

export default function RequestList() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "invites"), where("toUserUid", "==", user.uid), where("status", "==", "pending"));
        const unsub = onSnapshot(q, (snap) => {
            setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [user]);

    const handleAccept = async (req: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!user) return;
        try {
            // Add self to sender's friend list
            await updateDoc(doc(db, "users", req.fromUser.uid), {
                friends: arrayUnion({ uid: user.uid, displayName: user.displayName, photoURL: user.photoURL })
            });

            // Add sender to my friend list
            await updateDoc(doc(db, "users", user.uid), {
                friends: arrayUnion(req.fromUser)
            });

            // Delete invite
            await deleteDoc(doc(db, "invites", req.id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDecline = async (id: string) => {
        await deleteDoc(doc(db, "invites", id));
    };

    if (requests.length === 0) return null;

    return (
        <div className="glass-panel p-6">
            <h3 className="text-xl font-semibold mb-4 text-purple-200">Pending Requests</h3>
            <div className="space-y-3">
                {requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={req.fromUser.photoURL || "/default-avatar.png"} alt={req.fromUser.displayName} className="w-8 h-8 rounded-full" />
                            <span className="text-sm">{req.fromUser.displayName}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleAccept(req)} className="p-1 hover:bg-green-500/20 rounded text-green-400"><Check size={16} /></button>
                            <button onClick={() => handleDecline(req.id)} className="p-1 hover:bg-red-500/20 rounded text-red-400"><X size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
