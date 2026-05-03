'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Gamepad2, 
    ArrowLeft, 
    TrendingUp, 
    Layers, 
    Activity, 
    Dices, 
    Zap,
    MousePointer2
} from 'lucide-react';
import MiniGameEngine from '@/components/games/MiniGameEngine';

const GAMES = [
    { 
        id: 'higher-lower', 
        name: 'Higher or Lower', 
        description: 'Test your intuition with the next card.',
        icon: TrendingUp,
        color: 'from-green-500 to-emerald-700'
    },
    { 
        id: 'three-card-monte', 
        name: '3-Card Monte', 
        description: 'Keep your eyes on the Ace.',
        icon: Dices,
        color: 'from-blue-500 to-indigo-700'
    },
    { 
        id: 'river-rat', 
        name: 'River Rat Meter', 
        description: 'Hit the one-outer on the river.',
        icon: Activity,
        color: 'from-cyan-400 to-blue-600'
    },
    { 
        id: 'chip-stack', 
        name: 'Chip Stack Balancer', 
        description: 'Stack them high, keep them centered.',
        icon: Layers,
        color: 'from-red-500 to-rose-700'
    },
    { 
        id: 'slot-machine', 
        name: 'Slot Machine Stop', 
        description: 'Match all three for the jackpot.',
        icon: Zap,
        color: 'from-gold to-yellow-600'
    },
    { 
        id: 'casino-dash', 
        name: 'Casino Dash', 
        description: 'Escape the casino before they catch you.',
        icon: MousePointer2,
        color: 'from-purple-500 to-fuchsia-700'
    },
];

export default function ArcadePage() {
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [gameKey, setGameKey] = useState(0);
    const [playerName, setPlayerName] = useState<string>("Guest");

    React.useEffect(() => {
        const savedPlayer = localStorage.getItem('ept_active_player_v2');
        if (savedPlayer) {
            setPlayerName(savedPlayer);
        }
    }, []);

    const handleBack = () => {
        setSelectedGameId(null);
    };

    const handleRestart = () => {
        setGameKey(prev => prev + 1);
    };

    if (selectedGameId) {
        return (
            <div className="min-h-screen bg-black relative">
                <MiniGameEngine
                    key={gameKey}
                    playerName={playerName}
                    enemyName="Arcade"
                    isNemesis={false}
                    targetScore={10} // Endless-ish for arcade
                    gauntletCurrent={1}
                    gauntletTotal={1}
                    arcadeMode={true}
                    initialGameId={selectedGameId}
                    onWin={handleRestart}
                    onFail={handleRestart}
                />
                
                {/* Back Button Overlay */}
                <button
                    onClick={handleBack}
                    className="fixed top-6 left-6 z-[100] group"
                >
                    <div className="absolute inset-0 bg-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                    <div className="relative bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 hover:border-gold/50 text-zinc-400 hover:text-gold px-5 py-2.5 rounded-full flex items-center gap-2 font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Arcade
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono relative overflow-hidden">
            {/* Retro Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(212,175,55,0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(212,175,55,0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-3 text-gold mb-2">
                            <Gamepad2 className="w-8 h-8" />
                            <span className="text-sm font-black uppercase tracking-[0.3em]">EPT Mini-Games</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                            The Arcade
                        </h1>
                    </div>
                    <p className="text-zinc-500 max-w-sm text-sm font-bold leading-relaxed uppercase">
                        Practice the Hustle. No tokens required. No consequences for failure. Just pure skill.
                    </p>
                </div>

                {/* Game Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {GAMES.map((game) => (
                        <motion.button
                            key={game.id}
                            whileHover={{ scale: 1.02, translateY: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedGameId(game.id)}
                            className="relative group text-left h-64 rounded-2xl overflow-hidden border-2 border-white/5 bg-zinc-900/50 hover:border-gold/50 transition-all shadow-2xl"
                        >
                            {/* Background Glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                            
                            <div className="p-8 h-full flex flex-col justify-between relative z-10">
                                <div className="flex justify-between items-start">
                                    <div className={`p-4 rounded-xl bg-gradient-to-br ${game.color} shadow-lg`}>
                                        <game.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-600 group-hover:text-gold uppercase tracking-[0.2em] border border-zinc-800 px-2 py-1 rounded">
                                        Practice
                                    </span>
                                </div>
                                
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 group-hover:text-gold transition-colors">
                                        {game.name}
                                    </h3>
                                    <p className="text-zinc-500 text-xs font-bold uppercase leading-snug">
                                        {game.description}
                                    </p>
                                </div>
                            </div>

                            {/* Scanlines Overlay */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity"
                                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)' }}
                            />
                        </motion.button>
                    ))}

                    {/* Random Game Card */}
                    <motion.button
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedGameId(GAMES[Math.floor(Math.random() * GAMES.length)].id)}
                        className="relative group text-left h-64 rounded-2xl overflow-hidden border-2 border-dashed border-white/10 bg-zinc-900/20 hover:border-gold/50 transition-all"
                    >
                        <div className="p-8 h-full flex flex-col items-center justify-center text-center relative z-10">
                            <div className="w-16 h-16 rounded-full border-2 border-zinc-700 flex items-center justify-center mb-4 group-hover:border-gold group-hover:bg-gold/10 transition-all">
                                <Zap className="w-8 h-8 text-zinc-700 group-hover:text-gold group-hover:animate-pulse" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-widest text-zinc-600 group-hover:text-white">
                                Random Shuffle
                            </h3>
                            <p className="text-[10px] text-zinc-700 font-bold uppercase mt-2">
                                Test your luck
                            </p>
                        </div>
                    </motion.button>
                </div>

                {/* Footer Link */}
                <div className="mt-16 text-center">
                    <Link 
                        href="/"
                        className="inline-flex items-center gap-2 text-zinc-600 hover:text-gold text-xs font-black uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Return to League Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
