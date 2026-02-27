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
}

const GAMES = [
    { id: 'higher-lower', name: 'Higher or Lower', component: HigherLowerGame },
    { id: 'three-card-monte', name: '3-Card Monte', component: ThreeCardMonteGame },
    { id: 'river-rat', name: 'River Rat Meter', component: RiverRatMeterGame },
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
}: Props) {
    const [phase, setPhase] = useState<'splash' | 'playing'>('splash');
    const [score, setScore] = useState(0);

    // Randomly select a game on mount
    const selectedGame = useMemo(() => {
        const idx = Math.floor(Math.random() * GAMES.length);
        return GAMES[idx];
    }, []);

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
        onFail();
    }, [onFail]);

    if (phase === 'splash') {
        return <GetReadySplash gameName={selectedGame.name} onComplete={handleSplashComplete} />;
    }

    const GameComponent = selectedGame.component;

    return (
        <div className="min-h-screen bg-black flex flex-col font-mono select-none overflow-hidden relative">
            {/* Retro Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.08]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(0,255,255,0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,255,255,0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px',
                }}
            />

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                }}
            />

            <div className="max-w-md w-full mx-auto flex-1 flex flex-col border-x-4 border-zinc-900 bg-[#0a0a0a] relative z-10 overflow-hidden">
                {/* HUD */}
                <GameHUD
                    playerName={playerName}
                    enemyName={enemyName}
                    isNemesis={isNemesis}
                    score={score}
                    targetScore={targetScore}
                    gauntletCurrent={gauntletCurrent}
                    gauntletTotal={gauntletTotal}
                />

                {/* Game Area */}
                <GameComponent
                    onWin={handleGameWin}
                    onFail={handleGameFail}
                    targetScore={targetScore}
                />
            </div>
        </div>
    );
}
