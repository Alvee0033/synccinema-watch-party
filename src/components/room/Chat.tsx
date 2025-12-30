"use client";
import { useState, useEffect, useRef } from "react";
import { ref, onValue, push } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Send } from "lucide-react";

export default function Chat({ roomId }: { roomId: string }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const msgsRef = ref(rtdb, `rooms/${roomId}/messages`);

        // Listen to all messages (for simplicity)
        const unsub = onValue(msgsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, val]: [string, any]) => ({ id: key, ...val })); // eslint-disable-line @typescript-eslint/no-explicit-any
                setMessages(list);
            }
        });

        // Actually onChildAdded is better for performance but onValue simpler for "sync all"
        return () => unsub();
    }, [roomId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;
        push(ref(rtdb, `rooms/${roomId}/messages`), {
            senderId: user.uid,
            senderName: user.displayName,
            photoURL: user.photoURL,
            text: input,
            timestamp: Date.now()
        });
        setInput("");
    };

    return (
        <div className="glass-panel flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
                <h3 className="font-bold text-sm tracking-widest uppercase">Live Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.senderId === user?.uid ? 'flex-row-reverse' : ''}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.photoURL || "/default-avatar.png"} alt={msg.senderName} className="w-8 h-8 rounded-full self-end border border-white/10" />
                        <div className={`p-3 rounded-2xl max-w-[80%] ${msg.senderId === user?.uid ? 'bg-purple-600 rounded-br-none' : 'bg-white/10 rounded-bl-none'}`}>
                            {msg.senderId !== user?.uid && <p className="text-[10px] opacity-50 mb-1">{msg.senderName}</p>}
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <form onSubmit={sendMessage} className="p-3 bg-white/5 flex gap-2 border-t border-white/5">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Say something..."
                    className="flex-1 bg-black/20 rounded-full px-4 py-2 border border-white/10 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                />
                <button type="submit" className="p-2 bg-purple-600 rounded-full hover:bg-purple-500 transition-colors shadow-lg shadow-purple-900/40">
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
