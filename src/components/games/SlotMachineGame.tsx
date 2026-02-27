'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onWin: () => void;
    onFail: () => void;
    targetScore: number;
}

const SYMBOLS = ['♠', '♥', '♦', '♣', '🃏', '💰'];
const SYMBOL_COLORS: Record<string, string> = {
    '♠': 'text-white',
    '♥': 'text-red-500',
    '♦': 'text-blue-400',
    '♣': 'text-green-400',
    '🃏': 'text-gold',
    '💰': 'text-yellow-300',
};

export default function SlotMachineGame({ onWin, onFail, targetScore }: Props) {
    const [reels, setReels] = useState([0, 0, 0]); // current symbol index for each reel
    const [spinning, setSpinning] = useState([false, false, false]);
    const [stopped, setStopped] = useState([false, false, false]);
    const [score, setScore] = useState(0);
    const [result, setResult] = useState<'match' | 'miss' | null>(null);
    const [round, setRound] = useState(0);
    const intervals = useRef<(NodeJS.Timeout | null)[]>([null, null, null]);

    const startSpin = useCallback(() => {
        setResult(null);
        setStopped([false, false, false]);
        setSpinning([true, true, true]);

        // Each reel spins at a different speed
        const speeds = [80, 100, 120];

        for (let i = 0; i < 3; i++) {
            intervals.current[i] = setInterval(() => {
                setReels(prev => {
                    const newReels = [...prev];
                    newReels[i] = (newReels[i] + 1) % SYMBOLS.length;
                    return newReels;
                });
            }, speeds[i]);
        }
    }, []);

    useEffect(() => {
        // Start spinning on mount and each round
        const timer = setTimeout(() => startSpin(), 500);
        return () => {
            clearTimeout(timer);
            intervals.current.forEach(interval => {
                if (interval) clearInterval(interval);
            });
        };
    }, [round, startSpin]);

    const stopReel = (reelIndex: number) => {
        if (stopped[reelIndex] || !spinning[reelIndex]) return;

        // Stop this reel
        if (intervals.current[reelIndex]) {
            clearInterval(intervals.current[reelIndex]!);
            intervals.current[reelIndex] = null;
        }

        const newStopped = [...stopped];
        newStopped[reelIndex] = true;
        setStopped(newStopped);

        const newSpinning = [...spinning];
        newSpinning[reelIndex] = false;
        setSpinning(newSpinning);

        // Check if all reels are stopped
        if (newStopped.every(s => s)) {
            // All stopped — check for match
            setTimeout(() => {
                const allMatch = reels[0] === reels[1] && reels[1] === reels[2];
                if (allMatch) {
                    setResult('match');
                    const newScore = score + 1;
                    setScore(newScore);
                    setTimeout(() => {
                        if (newScore >= targetScore) {
                            onWin();
                        } else {
                            setRound(r => r + 1);
                        }
                    }, 1200);
                } else {
                    setResult('miss');
                    setTimeout(() => onFail(), 1200);
                }
            }, 300);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
            {/* Title */}
            <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tighter mb-1">Match All 3 Reels</h3>
                <p className="text-zinc-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest">
                    Tap each reel to stop it
                </p>
            </div>

            {/* Slot Machine Frame */}
            <div className="bg-zinc-900 border-4 border-gold rounded-2xl p-4 sm:p-6 w-full max-w-sm shadow-[0_0_40px_rgba(250,204,21,0.2)]">
                {/* Top Bar */}
                <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-t-lg px-4 py-2 text-center mb-4">
                    <span className="text-white text-xs sm:text-sm font-black uppercase tracking-widest">⭐ Hijack Slots ⭐</span>
                </div>

                {/* Reels */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                    {reels.map((symbolIdx, reelIdx) => (
                        <button
                            key={reelIdx}
                            onClick={() => stopReel(reelIdx)}
                            disabled={stopped[reelIdx]}
                            className={`relative aspect-square bg-black border-4 rounded-xl flex items-center justify-center overflow-hidden transition-all
                                ${stopped[reelIdx]
                                    ? result === 'match'
                                        ? 'border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.6)]'
                                        : result === 'miss'
                                            ? 'border-ept-red'
                                            : 'border-zinc-600'
                                    : 'border-gold hover:border-yellow-300 cursor-pointer active:scale-95'
                                }`}
                        >
                            <motion.span
                                key={`${reelIdx}-${symbolIdx}`}
                                initial={{ y: -30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className={`text-5xl sm:text-6xl ${SYMBOL_COLORS[SYMBOLS[symbolIdx]] || 'text-white'}`}
                            >
                                {SYMBOLS[symbolIdx]}
                            </motion.span>

                            {/* Spinning Overlay */}
                            {spinning[reelIdx] && (
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
                            )}

                            {/* Stop indicator */}
                            {!stopped[reelIdx] && spinning[reelIdx] && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                                    <span className="text-[8px] sm:text-[9px] text-gold font-black uppercase animate-pulse">TAP</span>
                                </div>
                            )}

                            {stopped[reelIdx] && (
                                <div className="absolute top-1 right-1">
                                    <span className="text-[8px] text-green-400 font-black">✓</span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Result */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`text-center py-3 font-black text-lg sm:text-xl uppercase ${result === 'match' ? 'text-green-400' : 'text-ept-red'
                                }`}
                        >
                            {result === 'match' ? '🎰 JACKPOT!' : '💀 NO MATCH'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Score */}
            <div className="mt-4 sm:mt-6 text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                    Round {score + 1} of {targetScore}
                </div>
            </div>
        </div>
    );
}
