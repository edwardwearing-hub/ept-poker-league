'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onWin: () => void;
    onFail: () => void;
    targetScore: number;
}

export default function ThreeCardMonteGame({ onWin, onFail, targetScore }: Props) {
    const [phase, setPhase] = useState<'show' | 'shuffle' | 'pick' | 'reveal'>('show');
    const [acePosition, setAcePosition] = useState(1); // 0, 1, 2
    const [shuffledPositions, setShuffledPositions] = useState([0, 1, 2]);
    const [picked, setPicked] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(0);

    const startRound = useCallback(() => {
        const newAce = Math.floor(Math.random() * 3);
        setAcePosition(newAce);
        setShuffledPositions([0, 1, 2]);
        setPicked(null);
        setPhase('show');

        // Show the ace for 1.5s, then shuffle
        setTimeout(() => {
            setPhase('shuffle');
            // Perform rapid shuffles
            let positions = [0, 1, 2];
            let step = 0;
            const shuffleInterval = setInterval(() => {
                const a = Math.floor(Math.random() * 3);
                const b = Math.floor(Math.random() * 3);
                const temp = positions[a];
                positions[a] = positions[b];
                positions[b] = temp;
                setShuffledPositions([...positions]);
                step++;
                if (step >= 6) {
                    clearInterval(shuffleInterval);
                    setPhase('pick');
                }
            }, 300);
        }, 1500);
    }, []);

    useEffect(() => {
        startRound();
    }, [round, startRound]);

    const handlePick = (visualIndex: number) => {
        if (phase !== 'pick') return;
        setPicked(visualIndex);
        setPhase('reveal');

        // The ace's visual position is where acePosition ended up after shuffling
        const aceVisualPosition = shuffledPositions.indexOf(acePosition);
        const isCorrect = visualIndex === aceVisualPosition;

        setTimeout(() => {
            if (isCorrect) {
                const newScore = score + 1;
                setScore(newScore);
                if (newScore >= targetScore) {
                    onWin();
                } else {
                    setRound(r => r + 1);
                }
            } else {
                onFail();
            }
        }, 1500);
    };

    const aceVisualPosition = shuffledPositions.indexOf(acePosition);

    const getCardContent = (visualIndex: number) => {
        const isAce = visualIndex === aceVisualPosition;
        const isRevealed = phase === 'show' || phase === 'reveal';
        const isPicked = picked === visualIndex;

        return (
            <motion.button
                key={visualIndex}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={() => handlePick(visualIndex)}
                disabled={phase !== 'pick'}
                className={`relative aspect-[2.5/3.5] rounded-xl border-4 flex items-center justify-center text-4xl sm:text-5xl font-black transition-all overflow-hidden
                    ${isPicked && phase === 'reveal'
                        ? (isAce ? 'border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.6)]' : 'border-ept-red shadow-[0_0_30px_rgba(220,38,38,0.6)]')
                        : 'border-zinc-600 hover:border-gold'
                    }
                    ${phase === 'pick' ? 'cursor-pointer active:scale-95' : 'cursor-default'}
                `}
            >
                {isRevealed ? (
                    <div className={`w-full h-full flex items-center justify-center ${isAce ? 'bg-white text-red-500' : 'bg-white text-zinc-800'}`}>
                        {isAce ? (
                            <div className="text-center">
                                <div className="text-5xl sm:text-6xl">A</div>
                                <div className="text-3xl sm:text-4xl">♠</div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="text-4xl sm:text-5xl text-zinc-400">?</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-800 rounded-lg flex items-center justify-center">
                        <div className="text-3xl sm:text-4xl text-blue-700 font-black rotate-45">♦</div>
                    </div>
                )}
            </motion.button>
        );
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
            {/* Instructions */}
            <div className="text-center mb-6 sm:mb-8">
                <p className="text-zinc-400 text-xs sm:text-sm uppercase font-bold tracking-widest">
                    {phase === 'show' && '👀 Watch the Ace...'}
                    {phase === 'shuffle' && '🔀 Shuffling...'}
                    {phase === 'pick' && '👆 Find the Ace!'}
                    {phase === 'reveal' && (picked === aceVisualPosition ? '✓ Got it!' : '✗ Wrong Card!')}
                </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-sm">
                {[0, 1, 2].map(i => getCardContent(i))}
            </div>

            {/* Score */}
            <div className="mt-6 sm:mt-8 text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                    Round {score + 1} of {targetScore}
                </div>
            </div>
        </div>
    );
}
