"use client";
import React, { useState } from "react";
import { Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff } from "lucide-react";

export default function ControlDeck() {
    const [mic, setMic] = useState(false);
    const [cam, setCam] = useState(false);
    const [screen, setScreen] = useState(false);

    return (
        <div className="glass-panel p-4 flex justify-center gap-6 mt-4">
            <button
                onClick={() => setMic(!mic)}
                className={`p-4 rounded-full transition-all duration-300 ${mic ? 'bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.6)] scale-110' : 'bg-white/5 hover:bg-white/10'}`}
            >
                {mic ? <Mic className="text-white" /> : <MicOff className="text-white/40" />}
            </button>
            <button
                onClick={() => setCam(!cam)}
                className={`p-4 rounded-full transition-all duration-300 ${cam ? 'bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.6)] scale-110' : 'bg-white/5 hover:bg-white/10'}`}
            >
                {cam ? <Camera className="text-white" /> : <CameraOff className="text-white/40" />}
            </button>
            <button
                onClick={() => setScreen(!screen)}
                className={`p-4 rounded-full transition-all duration-300 ${screen ? 'bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.6)] scale-110' : 'bg-white/5 hover:bg-white/10'}`}
            >
                {screen ? <Monitor className="text-white" /> : <MonitorOff className="text-white/40" />}
            </button>
        </div>
    );
}
