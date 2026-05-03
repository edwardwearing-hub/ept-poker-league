'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GetReadySplash from './GetReadySplash';
import GameHUD from './GameHUD';
import HigherLowerGame from './HigherLowerGame';
import ThreeCardMonteGame from './ThreeCardMonteGame';
import RiverRatMeterGame from './RiverRatMeterGame';
import ChipStackGame from './ChipStackGame';
import SlotMachineGame from './SlotMachineGame';
import CasinoDashGame from './CasinoDashGame';

interface Props {
    playerName: string;
    enemyName: string;
    isNemesis: boolean;
    targetScore: number;
    gauntletCurrent: number;
    gauntletTotal: number;
    onWin: () => void;
    onFail: () => void;
    arcadeMode?: boolean;
    initialGameId?: string;
}

const GAMES = [
    { id: 'higher-lower', name: 'Higher or Lower', component: HigherLowerGame },
    { id: 'three-card-monte', name: '3-Card Monte', component: ThreeCardMonteGame },
    { id: 'river-rat', name: 'Poker Heartbeat', component: RiverRatMeterGame },
    { id: 'chip-stack', name: 'Chip Stack Balancer', component: ChipStackGame },
    { id: 'slot-machine', name: 'Slot Machine Stop', component: SlotMachineGame },
    { id: 'casino-dash', name: 'Casino Dash', component: CasinoDashGame },
];

export default function MiniGameEngine({
    playerName,
    enemyName,
    isNemesis,
    targetScore,
    gauntletCurrent,
    gauntletTotal,
    onWin,
    onFail,
    arcadeMode = false,
    initialGameId,
}: Props) {
    const [phase, setPhase] = useState<'splash' | 'playing'>('splash');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameKey, setGameKey] = useState(0);

    // Randomly select a game on mount
    const selectedGame = useMemo(() => {
        if (initialGameId) {
            const found = GAMES.find(g => g.id === initialGameId);
            if (found) return found;
        }
        const idx = Math.floor(Math.random() * GAMES.length);
        return GAMES[idx];
    }, [initialGameId]);

    const handleSplashComplete = useCallback(() => {
        setPhase('playing');
    }, []);

    // For games that track their own internal score (Higher/Lower, Monte, River Rat, Slots),
    // the targetScore is passed through. Each correct answer = 1 point toward the target.
    // For one-shot games (Chip Stack, Casino Dash), they resolve with a single win/fail.

    const handleGameWin = useCallback(() => {
        const newScore = score + 1;
        setScore(newScore);
        onWin();
    }, [score, onWin]);

    const handleGameFail = useCallback(() => {
        setLives(prev => {
            const nextLives = prev - 1;
            if (nextLives <= 0) {
                onFail();
            } else {
                setGameKey(k => k + 1); // Remount game component to try again
            }
            return nextLives;
        });
    }, [onFail]);

    if (phase === 'splash') {
        return <GetReadySplash gameName={selectedGame.name} onComplete={handleSplashComplete} />;
    }

    const GameComponent = selectedGame.component;

    return (
        <div className="min-h-screen bg-black flex flex-col font-mono select-none overflow-hidden relative">
            {/* Retro Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.15]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(212,175,55,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(212,175,55,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-20" />

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                }}
            />

            <div className="max-w-md w-full mx-auto flex-1 flex flex-col border-x-4 border-zinc-900 bg-[#0a0a0a] relative z-10 overflow-hidden">
                {/* HUD */}
                {!arcadeMode && (
                    <GameHUD
                        playerName={playerName}
                        enemyName={enemyName}
                        isNemesis={isNemesis}
                        score={score}
                        targetScore={targetScore}
                        gauntletCurrent={gauntletCurrent}
                        gauntletTotal={gauntletTotal}
                        lives={lives}
                    />
                )}

                {arcadeMode && (
                    <div className="px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md flex justify-between items-center relative z-20 overflow-hidden">
                        {/* Animated Gradient Line */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                        
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                                <span className="text-[9px] text-gold font-black uppercase tracking-[0.2em]">Live Arcade</span>
                            </div>
                            <span className="text-lg text-white font-black uppercase tracking-tighter leading-tight">{selectedGame.name}</span>
                            
                            {/* Lives Indicator for Arcade */}
                            <div className="flex gap-1 mt-1.5">
                                {[...Array(3)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-2 h-2 rounded-full border ${i < lives ? 'bg-ept-red border-red-400 shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'bg-transparent border-zinc-700'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-0.5">Session Score</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl text-white font-black tabular-nums">{score}</span>
                                <span className="text-[10px] text-zinc-600 font-bold">PTS</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Game Area */}
                <GameComponent
                    key={gameKey}
                    onWin={handleGameWin}
                    onFail={handleGameFail}
                    targetScore={targetScore}
                    playerName={playerName}
                />
            </div>
        </div>
    );
}
