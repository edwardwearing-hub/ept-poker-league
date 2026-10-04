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
    Target,
    Coins,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { getAvatarFilename } from '@/lib/avatars';

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
        } else if (isRunning && timeLeft === 0) {
            // Play chime sound via Web Audio API
            if (soundEnabled && typeof window !== 'undefined') {
                try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2); // A5
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 1.2);
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
        <div className="relative min-h-screen bg-black text-white font-sans flex flex-col justify-between p-4 sm:p-8 select-none overflow-hidden">
            
            {/* Background Atmosphere Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none filter blur-sm"
                style={{ backgroundImage: `url('/images/final/championship_trophy.jpg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/80 pointer-events-none" />

            {/* Top Bar: League Branding & Utility */}
            <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-zinc-400 hover:text-white p-2.5 bg-zinc-900 border border-white/10 rounded-2xl transition-colors hover:scale-105"
                        title="Exit TV Mode"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-ept-red">
                                Live Championship Broadcast
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-3xl font-black uppercase text-white tracking-tight flex items-center gap-2.5 italic">
                            <span>E.P.T. 2026 Grand Final Table</span>
                            <Crown className="w-6 h-6 text-gold fill-gold/20" />
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-black/80 border border-gold/40 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                        <Trophy className="w-5 h-5 text-gold" />
                        <div>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Championship Vault</span>
                            <span className="text-base font-black text-gold font-mono">£{totalPot > 0 ? totalPot : '600+'}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-3 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-2xl transition-all"
                        title={soundEnabled ? "Mute Timer Chime" : "Enable Timer Chime"}
                    >
                        {soundEnabled ? <Volume2 className="w-5 h-5 text-gold" /> : <VolumeX className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={handleFullscreen}
                        className="p-3 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-2xl transition-all hover:scale-105"
                        title="Toggle TV Fullscreen"
                    >
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Middle Section: Giant Timer & Blind Level HUD */}
            <main className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 items-center">
                
                {/* Timer Clock (Center Left) */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 sm:p-12 bg-gradient-to-b from-zinc-950/95 to-black rounded-3xl border-2 border-gold/40 shadow-[0_0_100px_rgba(212,175,55,0.2)] relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/40 rounded-full mb-3 text-gold text-xs font-black uppercase tracking-widest">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>Level {currentLevel.level} of {BLIND_LEVELS.length}</span>
                    </div>

                    {/* Giant Digital Clock */}
                    <div className="text-7xl sm:text-9xl md:text-[10rem] font-black font-mono tracking-tighter text-white drop-shadow-[0_0_50px_rgba(255,215,0,0.35)] my-2">
                        {formatTime(timeLeft)}
                    </div>

                    {/* Current Blinds Banner */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-xl mt-4 text-center">
                        <div className="p-4 bg-zinc-900/90 border border-gold/30 rounded-2xl shadow-md">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Small Blind</span>
                            <span className="text-2xl sm:text-3xl font-black text-gold font-mono">{currentLevel.sb}</span>
                        </div>
                        <div className="p-4 bg-zinc-900/90 border border-gold/30 rounded-2xl shadow-md">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Big Blind</span>
                            <span className="text-2xl sm:text-3xl font-black text-gold font-mono">{currentLevel.bb}</span>
                        </div>
                        <div className="p-4 bg-zinc-900/90 border border-white/10 rounded-2xl shadow-md">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Ante</span>
                            <span className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">{currentLevel.ante || '-'}</span>
                        </div>
                    </div>

                    {/* Next Level Indicator */}
                    {nextLevel && (
                        <div className="mt-5 text-xs font-mono text-zinc-400 font-bold">
                            Next Level: <span className="text-gold font-black">{nextLevel.sb} / {nextLevel.bb}</span> (Ante: {nextLevel.ante || 0})
                        </div>
                    )}

                    {/* Timer Controls */}
                    <div className="flex items-center gap-3 mt-8">
                        <button
                            onClick={handlePrevLevel}
                            disabled={currentLevelIdx === 0}
                            className="p-3.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-2xl text-zinc-300 transition-all hover:scale-105"
                            title="Previous Level"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black uppercase text-sm tracking-wider transition-all transform hover:scale-105 ${
                                isRunning
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.5)]'
                                    : 'bg-gold hover:bg-yellow-400 text-black shadow-[0_0_30px_rgba(212,175,55,0.5)]'
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
                            className="p-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-2xl text-zinc-300 transition-all hover:scale-105"
                            title="Reset Level Timer"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleNextLevel}
                            disabled={currentLevelIdx === BLIND_LEVELS.length - 1}
                            className="p-3.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-2xl text-zinc-300 transition-all hover:scale-105"
                            title="Next Level"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Final Table Seating & Live 8-Bit Elimination Tracker (Center Right) */}
                <div className="lg:col-span-5 p-6 bg-zinc-950/95 border border-white/10 rounded-3xl flex flex-col justify-between h-full space-y-4 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-gold" />
                            <h3 className="text-base font-black uppercase text-white tracking-wider">Final Table Roster</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-xs font-mono font-bold text-green-400">
                                {remainingCount} / {players.length} Remaining
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                        {players.map((p, i) => {
                            const isOut = !!eliminatedPlayers[p.name];
                            return (
                                <div
                                    key={p.name}
                                    onClick={() => toggleEliminate(p.name)}
                                    className={`relative flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                        isOut
                                            ? 'bg-zinc-950/80 border-red-950/50 opacity-40'
                                            : i === 0
                                            ? 'bg-gradient-to-r from-gold/15 to-black/80 border-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                            : 'bg-zinc-900/80 border-white/10 hover:border-white/20'
                                    }`}
                                    title="Click to toggle Busted / Active"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* 8-Bit Player Avatar with Status Overlay */}
                                        <div className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 bg-zinc-900 ${
                                            isOut ? 'border-red-600 grayscale' : i === 0 ? 'border-gold' : 'border-white/20'
                                        }`}>
                                            <img 
                                                src={getAvatarFilename(p.name)} 
                                                alt={p.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                            {isOut && (
                                                <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center">
                                                    <Skull className="w-5 h-5 text-red-500 drop-shadow-md" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-xs font-mono font-bold ${i === 0 ? 'text-gold' : 'text-zinc-500'}`}>
                                                    #{i + 1}
                                                </span>
                                                <span className={`text-sm font-extrabold uppercase truncate max-w-[130px] ${
                                                    isOut ? 'line-through text-zinc-500' : 'text-white'
                                                }`}>
                                                    {p.name}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-mono text-zinc-400 font-semibold block">
                                                {p.points} Pts • {p.knockOuts} KOs
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-right shrink-0">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                                            isOut 
                                                ? 'bg-red-950/80 text-red-400 border-red-800' 
                                                : 'bg-green-950/80 text-green-400 border-green-700/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                                        }`}>
                                            {isOut ? 'BUSTED' : 'IN PLAY'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-2.5 bg-black/60 border border-white/5 rounded-xl text-center">
                        <p className="text-[11px] text-zinc-400 italic">
                            💡 Click any player card as they are knocked out to update the table live.
                        </p>
                    </div>
                </div>
            </main>

            {/* Bottom Footer Ticker */}
            <footer className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 font-mono gap-2">
                <span>E.P.T. POKER LEAGUE 2026 • OFFICIAL GRAND FINAL ENGINE</span>
                <span className="text-gold font-bold">READY FOR TV MIRRORING &amp; PROJECTOR CASTING</span>
            </footer>

        </div>
    );
}
