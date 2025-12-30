"use client";
import { useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Search, UserPlus, Check } from "lucide-react";

export default function UserSearch() {
    const { user } = useAuth();
    const [email, setEmail] = useState("");
    const [result, setResult] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        setResult(null);
        setSent(false);

        try {
            const q = query(collection(db, "users"), where("email", "==", email));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                if (doc.id !== user?.uid) {
                    setResult({ id: doc.id, ...doc.data() });
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const sendInvite = async () => {
        if (!user || !result) return;
        try {
            await addDoc(collection(db, "invites"), {
                fromUser: {
                    uid: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                },
                toUser: {
                    uid: result.id,
                    displayName: result.displayName,
                    photoURL: result.photoURL
                }, // Storing invitee details might be redundant but useful if we query by toUser.uid
                toUserUid: result.id, // Better for querying
                status: "pending",
                createdAt: serverTimestamp(),
            });
            setSent(true);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xl font-semibold mb-4">Find Friends</h3>
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Friend's email..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                    type="submit"
                    className="p-2 bg-purple-600/20 hover:bg-purple-600/40 rounded-lg border border-purple-500/50 transition-colors"
                >
                    <Search className="w-5 h-5 text-purple-200" />
                </button>
            </form>

            {loading && <p className="text-sm text-white/40">Searching...</p>}

            {result && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={result.photoURL || "/default-avatar.png"} alt={result.displayName} className="w-10 h-10 rounded-full" />
                        <div>
                            <p className="font-medium">{result.displayName}</p>
                            <p className="text-xs text-white/40">{result.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={sendInvite}
                        disabled={sent}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        {sent ? <Check className="w-5 h-5 text-green-400" /> : <UserPlus className="w-5 h-5" />}
                    </button>
                </div>
            )}
        </div>
    );
}
