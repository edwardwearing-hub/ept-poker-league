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
    const [speed, setSpeed] = useState(2.5);
    const [zoneStart, setZoneStart] = useState(40);
    const animRef = useRef<number>(0);

    // Fake medical stats
    const [bpm, setBpm] = useState(0);
    const [spo2, setSpo2] = useState(60);

    const ZONE_SIZE = 20; // %

    const resetRound = useCallback(() => {
        // Randomize zone position for each round
        const newZoneStart = 15 + Math.floor(Math.random() * 65);
        setZoneStart(newZoneStart);
        setPosition(0);
        setDirection(1);
        setStopped(false);
        setResult(null);
        // Increase speed slightly each round
        setSpeed(2.5 + score * 0.2);
    }, [score]);

    useEffect(() => {
        resetRound();
    }, [score, resetRound]);

    // Fluctuate fake stats
    useEffect(() => {
        if (stopped && result === 'hit') {
            setBpm(85 + Math.floor(Math.random() * 10));
            setSpo2(98 + Math.floor(Math.random() * 2));
            return;
        } else if (stopped && result === 'miss') {
            setBpm(0);
            setSpo2(0);
            return;
        }

        const interval = setInterval(() => {
            setBpm(30 + Math.floor(Math.random() * 15)); // dangerously low
            setSpo2(70 + Math.floor(Math.random() * 8)); // dangerously low
        }, 800);
        return () => clearInterval(interval);
    }, [stopped, result]);

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
            }, 1200);
        } else {
            setResult('miss');
            setTimeout(() => onFail(), 1200);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-between px-4 py-8 relative overflow-hidden gap-6 min-h-[600px]">
            {/* Resuscitation Background */}
            <div className="absolute inset-0 bg-black z-0">
                <img 
                    src="/poker_heartbeat_resuscitation_1777823211904.png"
                    alt="Medical Emergency"
                    className="w-full h-full object-cover opacity-30 mix-blend-screen grayscale-[50%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
            </div>
            
            {/* Medical Title */}
            <div className="text-center relative z-10 w-full max-w-md bg-black/60 backdrop-blur-sm border border-emerald-500/30 py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <h3 className="text-xl sm:text-2xl font-black text-emerald-400 uppercase tracking-[0.1em] mb-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                    {result === 'miss' ? 'FLATLINE...' : result === 'hit' ? 'PULSE RESTORED!' : 'FLATLINE DETECTED!'}
                </h3>
                <p className="text-emerald-200/70 text-[10px] sm:text-xs uppercase font-bold tracking-[0.2em] animate-pulse">
                    {result ? 'Analyzing rhythm...' : 'Deliver shock in the Revival Zone'}
                </p>
            </div>

            {/* ECG Monitor Screen */}
            <div className="w-full max-w-md relative z-10 flex-1 flex flex-col justify-center">
                <div className="w-full bg-[#05110d] border-2 border-emerald-500/50 rounded-xl shadow-[0_0_40px_rgba(16,185,129,0.15)] flex overflow-hidden">
                    
                    {/* Left: Waveform Area */}
                    <div className="flex-1 relative p-4 flex flex-col justify-center min-h-[120px] border-r border-emerald-500/30">
                        {/* Monitor Grid */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
                            style={{ 
                                backgroundImage: `
                                    linear-gradient(to right, #10b981 1px, transparent 1px),
                                    linear-gradient(to bottom, #10b981 1px, transparent 1px)
                                `,
                                backgroundSize: '20px 20px'
                            }}
                        />
                        
                        {/* The ECG Trace Line (Background line) */}
                        <div className="absolute left-4 right-4 h-[2px] bg-emerald-900/40 top-1/2 -translate-y-1/2" />

                        {/* Revival Zone */}
                        <div
                            className="absolute top-2 bottom-2 bg-emerald-400/20 border-x-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)] z-10"
                            style={{
                                left: `calc(1rem + ${zoneStart}% * 0.8)`, // 0.8 adjusts for padding
                                width: `${ZONE_SIZE}%`,
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(16,185,129,0.8)] -rotate-90 sm:rotate-0 whitespace-nowrap">
                                    REVIVAL
                                </span>
                            </div>
                        </div>

                        {/* Moving Pulse Indicator */}
                        <motion.div
                            className={`absolute top-1/2 -translate-y-1/2 w-4 h-16 rounded-full z-20 ${
                                result === 'hit' ? 'bg-white shadow-[0_0_30px_rgba(255,255,255,1)]' :
                                result === 'miss' ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,1)]' :
                                'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)]'
                            }`}
                            style={{ left: `calc(1rem + ${position}% * 0.8)` }}
                            animate={result === 'hit' ? { scaleY: [1, 1.5, 0.5, 1.2, 1] } : result === 'miss' ? { scaleY: 0.1 } : {}}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Pulse Trail */}
                            {!stopped && (
                                <div className={`absolute top-1/2 -translate-y-1/2 h-[2px] w-24 ${direction > 0 ? 'right-full bg-gradient-to-r' : 'left-full bg-gradient-to-l'} from-transparent to-emerald-400 pointer-events-none`} />
                            )}
                        </motion.div>
                    </div>

                    {/* Right: Vitals Column */}
                    <div className="w-24 bg-black/60 p-2 flex flex-col gap-2 justify-center z-10 font-mono">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-emerald-500 font-bold">HR BPM ♥</span>
                            <span className={`text-3xl font-black ${result === 'miss' ? 'text-red-500' : 'text-emerald-400'}`}>
                                {bpm}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-cyan-500 font-bold">SpO2 %</span>
                            <span className={`text-2xl font-black ${result === 'miss' ? 'text-red-500' : 'text-cyan-400'}`}>
                                {spo2}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Result Message Overlay */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                        >
                            <div className={`px-6 py-2 rounded-lg backdrop-blur-md border-2 font-black text-3xl uppercase tracking-widest ${
                                result === 'hit' ? 'bg-emerald-900/80 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.8)]' : 
                                'bg-red-900/80 border-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.8)]'
                            }`}>
                                {result === 'hit' ? 'CLEAR!' : 'LOST HIM'}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls and Score (relative z-10 fixes the bug!) */}
            <div className="w-full flex flex-col items-center gap-4 pb-4 relative z-10">
                <button
                    onClick={handleTap}
                    disabled={stopped}
                    className={`w-full max-w-sm font-black text-2xl sm:text-3xl py-6 sm:py-7 uppercase rounded-xl transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-b-8 active:border-b-0 active:mt-2
                        ${stopped 
                            ? 'bg-zinc-800 text-zinc-600 border-zinc-900' 
                            : 'bg-gradient-to-b from-orange-400 to-red-600 hover:from-orange-300 hover:to-red-500 text-white border-red-800'
                        }`}
                >
                    {stopped ? (result === 'hit' ? 'SHOCK DELIVERED' : 'CHARGING...') : '⚡ SHOCK!'}
                </button>
                
                <div className="bg-black/60 backdrop-blur-md border border-emerald-500/20 px-6 py-2 rounded-xl">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest flex gap-4">
                        <span>ATTEMPT <span className="text-white">{score + 1}</span></span>
                        <span className="text-zinc-700">|</span>
                        <span>TARGET <span className="text-emerald-400">{targetScore}</span></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
