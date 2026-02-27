'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onWin: () => void;
    onFail: () => void;
    targetScore: number;
}

export default function RiverRatMeterGame({ onWin, onFail, targetScore }: Props) {
    const [position, setPosition] = useState(0); // 0-100
    const [direction, setDirection] = useState(1);
    const [stopped, setStopped] = useState(false);
    const [score, setScore] = useState(0);
    const [result, setResult] = useState<'hit' | 'miss' | null>(null);
    const [speed, setSpeed] = useState(2);
    const [zoneStart, setZoneStart] = useState(40);
    const animRef = useRef<number>(0);

    const ZONE_SIZE = 15; // %

    const resetRound = useCallback(() => {
        // Randomize zone position for each round
        const newZoneStart = 15 + Math.floor(Math.random() * 60);
        setZoneStart(newZoneStart);
        setPosition(0);
        setDirection(1);
        setStopped(false);
        setResult(null);
        // Increase speed slightly each round
        setSpeed(2 + score * 0.3);
    }, [score]);

    useEffect(() => {
        resetRound();
    }, [score, resetRound]);

    // Animation loop
    useEffect(() => {
        if (stopped) return;

        const animate = () => {
            setPosition(prev => {
                let newPos = prev + direction * speed;
                if (newPos >= 100) {
                    setDirection(-1);
                    newPos = 100;
                } else if (newPos <= 0) {
                    setDirection(1);
                    newPos = 0;
                }
                return newPos;
            });
            animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [stopped, direction, speed]);

    const handleTap = () => {
        if (stopped) return;
        setStopped(true);

        const inZone = position >= zoneStart && position <= zoneStart + ZONE_SIZE;

        if (inZone) {
            setResult('hit');
            const newScore = score + 1;
            setTimeout(() => {
                if (newScore >= targetScore) {
                    onWin();
                } else {
                    setScore(newScore);
                }
            }, 800);
        } else {
            setResult('miss');
            setTimeout(() => onFail(), 800);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
            {/* Title */}
            <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter mb-1">Hit the One-Outer!</h3>
                <p className="text-zinc-500 text-[10px] sm:text-xs uppercase font-bold tracking-widest">
                    Tap to stop in the green zone
                </p>
            </div>

            {/* Meter Bar */}
            <div className="w-full max-w-sm relative">
                {/* Background Bar */}
                <div className="w-full h-16 sm:h-20 bg-zinc-900 border-4 border-zinc-700 relative overflow-hidden rounded-lg">
                    {/* Danger zones (red) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-900/50 via-red-800/30 to-red-900/50" />

                    {/* Green Zone (One-Outer) */}
                    <div
                        className="absolute top-0 bottom-0 bg-green-500/40 border-x-2 border-green-400"
                        style={{
                            left: `${zoneStart}%`,
                            width: `${ZONE_SIZE}%`,
                        }}
                    >
                        <div className="absolute inset-0 bg-green-500/20 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[8px] sm:text-[10px] font-black text-green-300 uppercase tracking-widest rotate-0">
                                ONE-OUTER
                            </span>
                        </div>
                    </div>

                    {/* Bouncing Indicator */}
                    <motion.div
                        className={`absolute top-1 bottom-1 w-2 sm:w-3 rounded-full z-10 ${result === 'hit' ? 'bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.8)]' :
                            result === 'miss' ? 'bg-ept-red shadow-[0_0_20px_rgba(220,38,38,0.8)]' :
                                'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                            }`}
                        style={{ left: `${position}%` }}
                        animate={result === 'hit' ? { scale: [1, 1.5, 1] } : result === 'miss' ? { opacity: [1, 0.3, 1] } : {}}
                        transition={{ duration: 0.3, repeat: result ? 2 : 0 }}
                    />

                    {/* Scanlines */}
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }}
                    />
                </div>

                {/* Result Label */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`text-center mt-4 text-xl font-black uppercase ${result === 'hit' ? 'text-green-400' : 'text-ept-red'
                                }`}
                        >
                            {result === 'hit' ? '🎯 NAILED IT!' : '💀 MISSED!'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* TAP Button */}
            <button
                onClick={handleTap}
                disabled={stopped}
                className="mt-8 sm:mt-12 w-full max-w-sm bg-gold hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black text-2xl sm:text-3xl py-6 sm:py-8 uppercase border-b-8 border-yellow-700 active:border-b-0 active:mt-2 transition-all disabled:border-zinc-900 rounded-lg"
            >
                {stopped ? (result === 'hit' ? '✓' : '✗') : 'TAP!'}
            </button>

            {/* Score */}
            <div className="mt-4 text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                    Round {score + 1} of {targetScore}
                </div>
            </div>
        </div>
    );
}
