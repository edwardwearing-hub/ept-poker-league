'use client';

import React, { useState } from 'react';
import CanvasContainer from './CanvasContainer';
import PokerChip from './models/PokerChip';
import { Sparkles, Dices, Layers } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { playChipClack } from '@/lib/felt-audio';

interface DenomConfig {
    label: string;
    value: number;
    primaryColor: string;
    secondaryColor: string;
    name: string;
}

const DENOMINATIONS: DenomConfig[] = [
    { label: '25', value: 25, primaryColor: '#16a34a', secondaryColor: '#ffffff', name: 'Forest Green' },
    { label: '100', value: 100, primaryColor: '#1f2937', secondaryColor: '#e5e7eb', name: 'Midnight Onyx' },
    { label: '500', value: 500, primaryColor: '#2563eb', secondaryColor: '#ffd700', name: 'Cobalt Royal' },
    { label: '1,000', value: 1000, primaryColor: '#cfb53b', secondaryColor: '#111827', name: 'Championship Gold' },
    { label: '5,000', value: 5000, primaryColor: '#dc2626', secondaryColor: '#ffffff', name: 'Crimson Baron' },
];

export default function ChipShowcase() {
    const [selectedIdx, setSelectedIdx] = useState(2); // default T500

    const selectDenom = (idx: number) => {
        triggerHaptic(15);
        playChipClack();
        setSelectedIdx(idx);
    };

    const current = DENOMINATIONS[selectedIdx];

    return (
        <div className="relative w-full max-w-xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-950/90 via-black to-zinc-950 p-6 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <Dices size={16} />
                    </span>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">
                            Ceramic Chip Inspector
                        </h3>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                            Official 14g Tournament Clay
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-xs font-mono font-bold text-gold">T{current.label}</span>
                </div>
            </div>

            {/* Denomination Selector Tabs */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4 p-1.5 rounded-2xl bg-zinc-900/80 border border-white/5">
                {DENOMINATIONS.map((d, idx) => {
                    const active = idx === selectedIdx;
                    return (
                        <button
                            key={d.value}
                            onClick={() => selectDenom(idx)}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 active:scale-95 border ${active ? 'bg-white/15 text-white border-white/30 shadow-lg' : 'bg-transparent text-zinc-400 border-transparent hover:text-white'}`}
                        >
                            <span
                                className="w-2.5 h-2.5 rounded-full border border-black/40 inline-block shrink-0"
                                style={{ backgroundColor: d.primaryColor }}
                            />
                            <span>{d.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* 3D WebGL Canvas */}
            <div className="relative my-2 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-center">
                <CanvasContainer
                    className="w-full h-64 sm:h-72"
                    autoRotate={true}
                    autoRotateSpeed={1.2}
                    intensity={0.6}
                >
                    <PokerChip
                        value={current.value}
                        label={current.label}
                        primaryColor={current.primaryColor}
                        secondaryColor={current.secondaryColor}
                        scale={1.35}
                    />
                </CanvasContainer>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                    Drag to rotate 3D chip
                </div>
            </div>

            {/* Chip Technical Specs */}
            <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-zinc-900/50 border border-white/5">
                    <div className="text-[9px] font-mono text-zinc-500 uppercase">Weight</div>
                    <div className="text-xs font-bold text-white mt-0.5">14.0 Grams</div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/50 border border-white/5">
                    <div className="text-[9px] font-mono text-zinc-500 uppercase">Material</div>
                    <div className="text-xs font-bold text-zinc-300 mt-0.5">Composite Clay</div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/50 border border-white/5">
                    <div className="text-[9px] font-mono text-zinc-500 uppercase">Edge Spots</div>
                    <div className="text-xs font-bold text-gold mt-0.5">8 Inlays</div>
                </div>
            </div>
        </div>
    );
}
