'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Gamepad2, 
    ArrowLeft, 
    TrendingUp, 
    Layers, 
    Activity, 
    Dices, 
    Zap,
    MousePointer2,
    Flame,
    Play,
    Sparkles,
    Shield
} from 'lucide-react';
import MiniGameEngine from '@/components/games/MiniGameEngine';

const GAMES = [
    { 
        id: 'higher-lower', 
        name: 'Higher or Lower', 
        description: 'Test your intuition predicting the next card value.',
        icon: TrendingUp,
        color: 'from-green-500 to-emerald-700'
    },
    { 
        id: 'three-card-monte', 
        name: '3-Card Monte', 
        description: 'Keep your laser focus on the elusive Ace of Spades.',
        icon: Dices,
        color: 'from-blue-500 to-indigo-700'
    },
    { 
        id: 'river-rat', 
        name: 'River Rat Meter', 
        description: 'Time your reaction to spike the one-outer on the river.',
        icon: Activity,
        color: 'from-cyan-400 to-blue-600'
    },
    { 
        id: 'chip-stack', 
        name: 'Chip Stack Balancer', 
        description: 'Stack tournament chips high and keep them centered.',
        icon: Layers,
        color: 'from-red-500 to-rose-700'
    },
    { 
        id: 'slot-machine', 
        name: 'Slot Machine Stop', 
        description: 'Match all three spinning symbols for the instant jackpot.',
        icon: Zap,
        color: 'from-gold to-yellow-600'
    },
    { 
        id: 'casino-dash', 
        name: 'Casino Dash', 
        description: 'Escape the high-limit floor before the pit bosses catch you.',
        icon: MousePointer2,
        color: 'from-purple-500 to-fuchsia-700'
    },
];

interface Props {
    playerName?: string;
}

export default function VegasArcadeLounge({ playerName = 'Guest Trainee' }: Props) {
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [gameKey, setGameKey] = useState(0);

    const handleBack = () => {
        setSelectedGameId(null);
    };

    const handleRestart = () => {
        setGameKey(prev => prev + 1);
    };

    if (selectedGameId) {
        return (
            <div className="min-h-[600px] bg-black rounded-3xl overflow-hidden border border-gold/40 relative shadow-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-gold border border-white/10 transition text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                        <ArrowLeft size={14} />
                        <span>Back to Arcade Lounge</span>
                    </button>
                    <span className="text-xs font-mono font-bold text-gold uppercase">
                        {GAMES.find(g => g.id === selectedGameId)?.name || 'Arcade Game'}
                    </span>
                </div>

                <MiniGameEngine
                    key={gameKey}
                    playerName={playerName}
                    enemyName="Arcade Pit"
                    isNemesis={false}
                    targetScore={10}
                    gauntletCurrent={1}
                    gauntletTotal={1}
                    arcadeMode={true}
                    initialGameId={selectedGameId}
                    onWin={handleRestart}
                    onFail={handleRestart}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header / Intro */}
            <div className="p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div>
                    <div className="flex items-center gap-2 text-gold text-xs font-black uppercase tracking-widest mb-1">
                        <Gamepad2 size={16} />
                        <span>Retro Mini-Game Lounge</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                        Skill Drills &amp; Reflex Arcade
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mt-1">
                        Instant, zero-token practice minigames. Hone your hand reaction speed, card reading intuition, and stack balancing.
                    </p>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-black/60 border border-gold/30 text-right">
                    <span className="text-[10px] text-zinc-400 uppercase font-mono block">Available Drills</span>
                    <span className="text-xl font-black text-gold font-mono">{GAMES.length} Minigames</span>
                </div>
            </div>

            {/* Featured Meta-Game: Casino Syndicate Link */}
            <Link
                href="/syndicate"
                className="block relative rounded-3xl overflow-hidden border-2 border-gold/40 hover:border-gold shadow-[0_0_35px_rgba(212,175,55,0.25)] group transition-all"
            >
                <div className="relative w-full min-h-[220px] sm:h-56 overflow-hidden flex flex-col justify-between p-6">
                    <img 
                        src="/images/vegas_strip_resort.jpg" 
                        alt="Casino Syndicate Empire" 
                        className="absolute inset-0 w-full h-full object-cover filter brightness-75 group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                    
                    <div className="relative z-10 flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-gold/20 text-gold-glow border border-gold/40 text-[10px] font-black uppercase tracking-widest backdrop-blur-md flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-gold" />
                            Flagship Underworld Meta-Game
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-black/70 text-white border border-white/10 text-[10px] font-mono font-bold backdrop-blur-md">
                            18 Tables • Syndicate Heists
                        </span>
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pt-3">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white drop-shadow-md">
                                E.P.T. Casino Syndicate
                            </h3>
                            <p className="text-xs text-zinc-300 font-sans max-w-xl line-clamp-2 mt-0.5">
                                Build your underground gambling empire, sponsor real EPT pros, and launder cash through front businesses.
                            </p>
                        </div>

                        <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-gold to-yellow-400 text-black font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.5)] group-hover:brightness-110 shrink-0 flex items-center gap-1.5">
                            <span>Launch Syndicate RPG</span>
                            <span>→</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Minigames Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {GAMES.map((game) => {
                    const Icon = game.icon;
                    return (
                        <div
                            key={game.id}
                            onClick={() => setSelectedGameId(game.id)}
                            className="p-5 rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-white/10 hover:border-gold/60 transition-all duration-300 group cursor-pointer shadow-lg hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} p-2.5 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                                        <Icon size={24} />
                                    </div>
                                    <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                                        Arcade Drill
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-base font-black uppercase text-white group-hover:text-gold transition-colors">
                                        {game.name}
                                    </h4>
                                    <p className="text-xs text-zinc-400 mt-1 leading-snug">
                                        {game.description}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs">
                                <span className="text-zinc-500 font-mono text-[10px]">Instant Play</span>
                                <span className="text-gold font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    <Play size={12} fill="currentColor" />
                                    <span>Play Now</span>
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
