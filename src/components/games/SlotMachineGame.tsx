'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
    onWin: () => void;
    onFail: () => void;
    targetScore: number;
}

const AVATARS = [
    '/avatars/avatar_chris_daly_1772222942062.png',
    '/avatars/avatar_daniel_horne_1772222954376.png',
    '/avatars/avatar_darren_daly_1772222979758.png',
    '/avatars/avatar_dave_taylor_1772223007740.png',
    '/avatars/avatar_edward_wearing_1772222877224.png',
    '/avatars/avatar_georgina_wearing_1772223035422.png',
    '/avatars/avatar_liam_duxbury_1772223048076.png',
    '/avatars/avatar_luke_daly_1772223102669.png',
    '/avatars/avatar_nathen_benson_1772223077518.png',
    '/avatars/avatar_stephen_flood_1772223088474.png',
];

const SYMBOL_HEIGHT = 80;
const STRIP_HEIGHT = AVATARS.length * SYMBOL_HEIGHT; // 480px

// Slower 50% speeds
const REEL_SPEEDS = [200, 300, 400]; 

export default function SlotMachineGame({ onWin, onFail, targetScore }: Props) {
    const [stopped, setStopped] = useState([false, false, false]);
    const [finalIndexes, setFinalIndexes] = useState<number[]>([0, 0, 0]);
    const [score, setScore] = useState(0);
    const [result, setResult] = useState<'match' | 'miss' | null>(null);
    const [round, setRound] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);

    // Use raw DOM refs for native high-performance Web Animations API
    const stripRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

    const startSpin = useCallback(() => {
        setResult(null);
        setStopped([false, false, false]);
        setFinalIndexes([0, 0, 0]);
        setIsSpinning(true);

        stripRefs.current.forEach(el => {
            if (el) {
                // Clear any inline styles left over from the previous snap so CSS animation takes over
                el.style.transform = ''; 
                // Randomize start position within the CSS animation cycle
                el.style.animationDelay = `-${Math.random() * 2}s`;
            }
        });
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => startSpin(), 500);
        return () => clearTimeout(timer);
    }, [round, startSpin]);

    const stopReel = (reelIndex: number) => {
        if (stopped[reelIndex] || !isSpinning) return;

        const el = stripRefs.current[reelIndex];
        if (!el) return;

        // 1. Read exact current position from the running CSS animation
        const computedStyle = window.getComputedStyle(el);
        const transformMatch = computedStyle.transform.match(/matrix\((.+)\)/);
        let currentY = 0;
        if (transformMatch) {
            const values = transformMatch[1].split(', ');
            currentY = parseFloat(values[5]);
        }

        // 2. Lock the current visual transform in place as an inline style so the CSS animation can be removed seamlessly
        el.style.transform = `translateY(${currentY}px)`;

        // 3. Mark as stopped (This removes the CSS animation class)
        const newStopped = [...stopped];
        newStopped[reelIndex] = true;
        setStopped(newStopped);

        // 4. Exact math to center a symbol on the 120px payline
        const exactN = (SYMBOL_HEIGHT - currentY) / SYMBOL_HEIGHT;
        let nearestN = Math.round(exactN);
        let nearestIndex = nearestN % AVATARS.length;
        if (nearestIndex < 0) nearestIndex += AVATARS.length;

        const newFinalIndexes = [...finalIndexes];
        newFinalIndexes[reelIndex] = nearestIndex;

        const isLastReel = newStopped.filter(Boolean).length === 3;
        // Game is now purely chance based.

        setFinalIndexes(newFinalIndexes);

        // 5. Native smooth mechanical snap using Web Animations API (bypasses React)
        const finalSnapY = SYMBOL_HEIGHT - (nearestN * SYMBOL_HEIGHT);

        const snapAnim = el.animate([
            { transform: `translateY(${currentY}px)` },
            { transform: `translateY(${finalSnapY}px)` }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // backOut equivalent
            fill: 'forwards'
        });

        snapAnim.onfinish = () => {
            el.style.transform = `translateY(${finalSnapY}px)`;
            
            if (isLastReel) {
                setIsSpinning(false);
                const allMatch = newFinalIndexes[0] === newFinalIndexes[1] && newFinalIndexes[1] === newFinalIndexes[2];
                
                setTimeout(() => {
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
                        }, 1500);
                    } else {
                        setResult('miss');
                        setTimeout(() => onFail(), 1500);
                    }
                }, 500);
            }
        };
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative min-h-[650px] overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <img 
                    src="/dingy_betting_shop_bg_1777824805865.png" 
                    alt="Dingy Betting Shop" 
                    className="w-full h-full object-cover opacity-80 blur-[2px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/60 to-zinc-900/80 mix-blend-multiply" />
            </div>

            {/* Title */}
            <div className="text-center mb-4 sm:mb-6 relative z-10 bg-black/60 backdrop-blur-md px-8 py-3 rounded-xl border border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                    Match All 3 Reels
                </h3>
                <p className="text-gold text-[10px] uppercase font-black tracking-widest animate-pulse">
                    Tap each reel to stop it
                </p>
            </div>

            {/* Vintage Slot Machine Frame */}
            <div className="relative z-10 w-full max-w-sm bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-500 p-2 sm:p-3 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_2px_5px_rgba(255,255,255,0.8)] border-2 border-zinc-500">
                
                {/* Inner Cabinet */}
                <div className="bg-gradient-to-b from-zinc-900 to-black p-4 sm:p-5 rounded-[24px] shadow-[inset_0_10px_30px_rgba(0,0,0,1)] border-b-2 border-white/20 relative">
                    
                    {/* Top Bar / Marquee */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-700 via-red-500 to-red-700 px-6 py-1.5 rounded-full border-2 border-gold shadow-[0_0_20px_rgba(220,38,38,0.6)]">
                        <span className="text-white text-[10px] sm:text-xs font-black uppercase tracking-widest drop-shadow-md whitespace-nowrap">⭐ EPT SLOTS ⭐</span>
                    </div>

                    {/* The Reels Container - NOW SHOWING 3 ROWS */}
                    <div className="bg-zinc-950 p-2 rounded-xl border-4 border-zinc-800 shadow-[inset_0_0_40px_rgba(0,0,0,1)] relative mt-4">
                        
                        {/* Pure CSS Animation Styles injected for perfect hardware-accelerated looping */}
                        <style>{`
                            @keyframes spinReel {
                                0% { transform: translateY(0px); }
                                100% { transform: translateY(-${STRIP_HEIGHT}px); }
                            }
                            .spinning-reel-0 { animation: spinReel ${STRIP_HEIGHT / REEL_SPEEDS[0]}s linear infinite; }
                            .spinning-reel-1 { animation: spinReel ${STRIP_HEIGHT / REEL_SPEEDS[1]}s linear infinite; }
                            .spinning-reel-2 { animation: spinReel ${STRIP_HEIGHT / REEL_SPEEDS[2]}s linear infinite; }
                        `}</style>

                        {/* The Payline (Center red line) */}
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,1)] -translate-y-1/2 z-30 pointer-events-none" />

                        {/* Reels Grid */}
                        <div className="grid grid-cols-3 gap-2 relative z-10 overflow-hidden rounded-lg">
                            {/* We need the container to show exactly 3 symbols: 3 * 80px = 240px height */}
                            {[0, 1, 2].map((reelIdx) => (
                                <button
                                    key={reelIdx}
                                    onClick={() => stopReel(reelIdx)}
                                    disabled={stopped[reelIdx] || !isSpinning}
                                    className={`relative w-full rounded bg-white overflow-hidden cursor-pointer transition-all ${
                                        stopped[reelIdx] 
                                            ? 'brightness-75' 
                                            : 'hover:brightness-110 active:scale-95 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'
                                    }`}
                                    style={{
                                        height: SYMBOL_HEIGHT * 3, // 240px tall window
                                        boxShadow: 'inset 0 40px 30px -20px rgba(0,0,0,0.9), inset 0 -40px 30px -20px rgba(0,0,0,0.9)'
                                    }}
                                >
                                    {/* The Scrolling Strip using PURE DOM / CSS for maximum performance */}
                                    <div
                                        ref={(el) => { stripRefs.current[reelIdx] = el; }}
                                        className={`absolute top-0 left-0 right-0 flex flex-col will-change-transform ${
                                            isSpinning && !stopped[reelIdx] ? `spinning-reel-${reelIdx}` : ''
                                        }`}
                                    >
                                        {/* 3 sets is exactly enough to infinitely loop without any blank spots */}
                                        {[...AVATARS, ...AVATARS, ...AVATARS].map((avatar, i) => (
                                            <div key={i} style={{ height: SYMBOL_HEIGHT }} className="flex items-center justify-center p-2">
                                                <img 
                                                    src={avatar} 
                                                    alt="Avatar Symbol" 
                                                    className="w-full h-full object-contain pixelated"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tap indicator */}
                                    {!stopped[reelIdx] && isSpinning && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded backdrop-blur-sm z-40 border border-white/20">
                                            <span className="text-[10px] text-gold font-black uppercase animate-pulse">TAP</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Glass Reflection Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none rounded-xl z-20 mix-blend-overlay" />
                    </div>

                    {/* Result Display */}
                    <div className="mt-4 h-10 flex items-center justify-center bg-black border-2 border-zinc-800 rounded-lg shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
                        <AnimatePresence mode="wait">
                            {result && (
                                <motion.div
                                    key={result}
                                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(5px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.2, filter: 'blur(5px)' }}
                                    className={`font-black text-lg sm:text-xl uppercase tracking-widest ${
                                        result === 'match' 
                                            ? 'text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]' 
                                            : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                                    }`}
                                >
                                    {result === 'match' ? '🎰 JACKPOT! 🎰' : '💀 NO MATCH 💀'}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Score */}
            <div className="mt-6 relative z-10 bg-black/80 px-6 py-2 rounded-full border border-zinc-800">
                <div className="text-xs text-zinc-400 uppercase font-black tracking-widest">
                    Round <span className="text-white">{score + 1}</span> of <span className="text-white">{targetScore}</span>
                </div>
            </div>
        </div>
    );
}
