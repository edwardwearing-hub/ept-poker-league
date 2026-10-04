'use client';

import React, { useState, useEffect } from 'react';
import { 
    Play, 
    Pause, 
    RotateCcw, 
    ChevronRight, 
    ChevronLeft, 
    Maximize, 
    Volume2, 
    VolumeX, 
    Trophy, 
    Crown, 
    Flame, 
    Skull, 
    ArrowLeft,
    Sparkles,
    Target
} from 'lucide-react';
import Link from 'next/link';

interface Player {
    name: string;
    rank: number;
    points: number;
    profit: number;
    knockOuts: number;
    rebuys: number;
}

interface Props {
    players: Player[];
    totalPot: number;
}

const BLIND_LEVELS = [
    { level: 1, sb: 25, bb: 50, ante: 0, duration: 900 },
    { level: 2, sb: 50, bb: 100, ante: 0, duration: 900 },
    { level: 3, sb: 75, bb: 150, ante: 25, duration: 900 },
    { level: 4, sb: 100, bb: 200, ante: 50, duration: 900 },
    { level: 5, sb: 150, bb: 300, ante: 75, duration: 900 },
    { level: 6, sb: 200, bb: 400, ante: 100, duration: 900 },
    { level: 7, sb: 300, bb: 600, ante: 150, duration: 900 },
    { level: 8, sb: 500, bb: 1000, ante: 250, duration: 900 },
    { level: 9, sb: 750, bb: 1500, ante: 500, duration: 900 },
    { level: 10, sb: 1000, bb: 2000, ante: 1000, duration: 900 },
];

export default function TVPresentationClient({ players, totalPot }: Props) {
    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(BLIND_LEVELS[0].duration);
    const [isRunning, setIsRunning] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [eliminatedPlayers, setEliminatedPlayers] = useState<Record<string, boolean>>({});

    const currentLevel = BLIND_LEVELS[currentLevelIdx] || BLIND_LEVELS[0];
    const nextLevel = BLIND_LEVELS[currentLevelIdx + 1];

    // Timer effect
    useEffect(() => {
        let interval: any = null;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            // Level complete chime
            if (soundEnabled) {
                try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.setValueAtTime(880, ctx.currentTime);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.5);
                } catch {}
            }
            if (currentLevelIdx < BLIND_LEVELS.length - 1) {
                setCurrentLevelIdx(prev => prev + 1);
                setTimeLeft(BLIND_LEVELS[currentLevelIdx + 1].duration);
            } else {
                setIsRunning(false);
            }
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, currentLevelIdx, soundEnabled]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleNextLevel = () => {
        if (currentLevelIdx < BLIND_LEVELS.length - 1) {
            setCurrentLevelIdx(prev => prev + 1);
            setTimeLeft(BLIND_LEVELS[currentLevelIdx + 1].duration);
        }
    };

    const handlePrevLevel = () => {
        if (currentLevelIdx > 0) {
            setCurrentLevelIdx(prev => prev - 1);
            setTimeLeft(BLIND_LEVELS[currentLevelIdx - 1].duration);
        }
    };

    const handleResetLevel = () => {
        setTimeLeft(currentLevel.duration);
    };

    const toggleEliminate = (name: string) => {
        setEliminatedPlayers(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    const remainingCount = players.length - Object.values(eliminatedPlayers).filter(Boolean).length;

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col justify-between p-4 sm:p-8 select-none">
            
            {/* Top Bar: League Branding & Utility */}
            <header className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-zinc-500 hover:text-white p-2 bg-zinc-900 border border-white/5 rounded-xl transition-colors"
                        title="Exit TV Mode"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-ept-red">
                                Live Championship Final Table
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                            <span>E.P.T. 2026 Grand Final</span>
                            <Crown className="w-5 h-5 text-gold" />
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-gold/30 rounded-xl">
                        <Trophy className="w-4 h-4 text-gold" />
                        <span className="text-xs text-zinc-400 font-bold uppercase">Prize Vault:</span>
                        <span className="text-sm font-black text-gold font-mono">£{totalPot > 0 ? totalPot : '600+'}</span>
                    </div>

                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-colors"
                        title={soundEnabled ? "Mute Timer Chime" : "Enable Timer Chime"}
                    >
                        {soundEnabled ? <Volume2 className="w-5 h-5 text-gold" /> : <VolumeX className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={handleFullscreen}
                        className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-colors"
                        title="Toggle TV Fullscreen"
                    >
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Middle Section: Giant Timer & Blind Level HUD */}
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-6 items-center">
                
                {/* Timer Clock (Center Left) */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-zinc-950 to-black rounded-3xl border-2 border-gold/30 shadow-[0_0_100px_rgba(212,175,55,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
                    
                    <span className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">
                        Level {currentLevel.level} of {BLIND_LEVELS.length}
                    </span>

                    {/* Giant Digital Clock */}
                    <div className="text-6xl sm:text-8xl md:text-9xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,215,0,0.3)] my-2">
                        {formatTime(timeLeft)}
                    </div>

                    {/* Current Blinds Banner */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-lg mt-4 text-center">
                        <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-2xl">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase block">Small Blind</span>
                            <span className="text-xl sm:text-2xl font-black text-gold font-mono">{currentLevel.sb}</span>
                        </div>
                        <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-2xl">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase block">Big Blind</span>
                            <span className="text-xl sm:text-2xl font-black text-gold font-mono">{currentLevel.bb}</span>
                        </div>
                        <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-2xl">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase block">Ante</span>
                            <span className="text-xl sm:text-2xl font-black text-amber-500 font-mono">{currentLevel.ante || '-'}</span>
                        </div>
                    </div>

                    {/* Next Level Indicator */}
                    {nextLevel && (
                        <div className="mt-4 text-xs font-mono text-zinc-500 font-bold">
                            Next Level: <span className="text-zinc-300 font-black">{nextLevel.sb} / {nextLevel.bb}</span> (Ante: {nextLevel.ante || 0})
                        </div>
                    )}

                    {/* Timer Controls */}
                    <div className="flex items-center gap-3 mt-6">
                        <button
                            onClick={handlePrevLevel}
                            disabled={currentLevelIdx === 0}
                            className="p-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-xl text-zinc-300 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all transform active:scale-95 shadow-lg ${
                                isRunning
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                                    : 'bg-gold hover:bg-yellow-400 text-black shadow-gold/30'
                            }`}
                        >
                            {isRunning ? (
                                <>
                                    <Pause className="w-5 h-5 fill-current" />
                                    <span>Pause Clock</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 fill-current" />
                                    <span>Start Clock</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleResetLevel}
                            className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-zinc-300 transition-colors"
                            title="Reset Level Timer"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleNextLevel}
                            disabled={currentLevelIdx === BLIND_LEVELS.length - 1}
                            className="p-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-xl text-zinc-300 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Final Table Seating & Live Elimination Tracker (Center Right) */}
                <div className="lg:col-span-5 p-6 bg-zinc-950 border border-white/10 rounded-3xl flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-ept-red" />
                            <h3 className="text-sm font-black uppercase text-white tracking-wider">Final Table Roster</h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-gold">
                            {remainingCount} / {players.length} In Play
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                        {players.map((p, i) => {
                            const isOut = !!eliminatedPlayers[p.name];
                            return (
                                <div
                                    key={p.name}
                                    onClick={() => toggleEliminate(p.name)}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                        isOut
                                            ? 'bg-zinc-900/40 border-zinc-800 opacity-40 line-through'
                                            : i === 0
                                            ? 'bg-gold/10 border-gold/40'
                                            : 'bg-zinc-900/80 border-white/5 hover:border-white/20'
                                    }`}
                                    title="Click to toggle Eliminated / Active"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`text-xs font-mono font-bold ${i === 0 ? 'text-gold' : 'text-zinc-600'}`}>
                                            #{i + 1}
                                        </span>
                                        <span className="text-xs font-bold uppercase text-white truncate max-w-[140px]">
                                            {p.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-right">
                                        <span className="text-[10px] font-mono text-zinc-400 font-bold">
                                            {p.points}pts
                                        </span>
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                            isOut ? 'bg-red-950 text-red-400' : 'bg-green-950 text-green-400'
                                        }`}>
                                            {isOut ? 'BUSTED' : 'LIVE'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-[10px] text-zinc-600 italic text-center">
                        Tip: Click any player's name as they are knocked out to update the live board.
                    </p>
                </div>
            </main>

            {/* Bottom Footer Ticker */}
            <footer className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 font-mono gap-2">
                <span>E.P.T. POKER LEAGUE 2026 • OFFICIAL GRAND FINAL ENGINE</span>
                <span className="text-gold font-bold">CAST TO LIVING ROOM TV FOR MAXIMUM HYPE</span>
            </footer>

        </div>
    );
}
