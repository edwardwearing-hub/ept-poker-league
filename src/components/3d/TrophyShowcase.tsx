'use client';

import React, { useState } from 'react';
import CanvasContainer from './CanvasContainer';
import Trophy from './models/Trophy';
import { Crown, Rotate3d, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

export default function TrophyShowcase() {
    const [autoRotate, setAutoRotate] = useState(true);

    const toggleRotate = () => {
        triggerHaptic(12);
        setAutoRotate(prev => !prev);
    };

    return (
        <div className="relative w-full max-w-xl mx-auto rounded-3xl border border-[#cfb53b]/30 bg-gradient-to-b from-zinc-950/90 via-black to-zinc-950 p-6 shadow-[0_0_50px_rgba(212,175,55,0.12)] overflow-hidden">
            {/* Ambient Gold Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold">
                        <Crown size={16} />
                    </span>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">
                            Championship Trophy
                        </h3>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                            Official 2026 Season Cup
                        </p>
                    </div>
                </div>

                <button
                    onClick={toggleRotate}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border transition active:scale-95 ${autoRotate ? 'bg-gold/10 border-gold/40 text-gold' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}
                    title="Toggle 360° Auto Rotation"
                >
                    <Rotate3d size={13} className={autoRotate ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
                    <span className="text-[10px] font-bold">{autoRotate ? 'Rotating' : 'Paused'}</span>
                </button>
            </div>

            {/* 3D WebGL Canvas */}
            <div className="relative my-2 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-center">
                <CanvasContainer
                    className="w-full h-72 sm:h-80"
                    autoRotate={autoRotate}
                    autoRotateSpeed={1.8}
                    intensity={0.65}
                >
                    <Trophy scale={1.15} />
                </CanvasContainer>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                    Drag to inspect 360°
                </div>
            </div>

            {/* Trophy Pedestal Specs */}
            <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-zinc-900/50 border border-white/5">
                    <div className="text-[9px] font-mono text-zinc-500 uppercase">Finish</div>
                    <div className="text-xs font-bold text-gold flex items-center justify-center gap-1 mt-0.5">
                        <Sparkles size={11} /> 24k Gold
                    </div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/50 border border-white/5">
                    <div className="text-[9px] font-mono text-zinc-500 uppercase">Base</div>
                    <div className="text-xs font-bold text-white mt-0.5">Black Obsidian</div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/50 border border-white/5">
                    <div className="text-[9px] font-mono text-zinc-500 uppercase">Awarded</div>
                    <div className="text-xs font-bold text-gold mt-0.5">Season Finale</div>
                </div>
            </div>
        </div>
    );
}
