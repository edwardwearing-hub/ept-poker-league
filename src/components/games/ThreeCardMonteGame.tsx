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
    const [acePosition, setAcePosition] = useState(1); // The original index of the Ace card (0, 1, or 2)
    const [shuffledPositions, setShuffledPositions] = useState([0, 1, 2]); // Current layout order of cards by their original indices
    const [picked, setPicked] = useState<number | null>(null); // The original index of the card picked by the user
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
            let positions = [0, 1, 2];
            let step = 0;
            const shuffleInterval = setInterval(() => {
                // Perform a random swap
                const a = Math.floor(Math.random() * 3);
                let b = Math.floor(Math.random() * 3);
                while (b === a) b = Math.floor(Math.random() * 3);
                
                const nextPositions = [...positions];
                [nextPositions[a], nextPositions[b]] = [nextPositions[b], nextPositions[a]];
                positions = nextPositions;
                
                setShuffledPositions(nextPositions);
                step++;
                
                if (step >= 8) {
                    clearInterval(shuffleInterval);
                    setPhase('pick');
                }
            }, 400);
        }, 1500);
    }, []);

    useEffect(() => {
        startRound();
    }, [round, startRound]);

    const handlePick = (cardId: number) => {
        if (phase !== 'pick') return;
        setPicked(cardId);
        setPhase('reveal');

        const isCorrect = cardId === acePosition;

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

    const getCardContent = (cardId: number) => {
        const isAce = cardId === acePosition;
        const isRevealed = phase === 'show' || phase === 'reveal';
        const isPicked = picked === cardId;

        return (
            <motion.button
                onClick={() => handlePick(cardId)}
                disabled={phase !== 'pick'}
                className={`relative w-full aspect-[2.5/3.5] rounded-2xl border-4 flex items-center justify-center text-4xl sm:text-5xl font-black transition-all overflow-hidden shadow-2xl
                    ${isPicked && phase === 'reveal'
                        ? (isAce ? 'border-green-400 shadow-[0_0_40px_rgba(34,197,94,0.8)]' : 'border-ept-red shadow-[0_0_40px_rgba(220,38,38,0.8)]')
                        : 'border-white/10 hover:border-gold/50'
                    }
                    ${phase === 'pick' ? 'cursor-pointer active:scale-95' : 'cursor-default'}
                `}
            >
                {isRevealed ? (
                    <div className={`w-full h-full flex flex-col items-center justify-center relative ${isAce ? 'bg-white text-red-600' : 'bg-white text-zinc-900'}`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                        {isAce ? (
                            <div className="text-center">
                                <div className="text-6xl sm:text-7xl font-black drop-shadow-sm">A</div>
                                <div className="text-4xl sm:text-5xl drop-shadow-sm">♠</div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="text-5xl sm:text-6xl text-zinc-200 font-black drop-shadow-sm">?</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 border-2 border-white/20 rounded-xl flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-30"
                            style={{
                                backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 0, transparent 50%)`,
                                backgroundSize: '12px 12px'
                            }}
                        />
                        <img 
                            src="/avatars/avatar_edward_wearing_1772222877224.png" 
                            alt="Character" 
                            className="w-[70%] h-[70%] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                )}
            </motion.button>
        );
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-between px-4 py-6 relative overflow-hidden gap-6 min-h-[600px]">
            {/* High Rollers Room Background */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/luxury_casino_high_rollers_1777821349616.png" 
                    alt="High Rollers Room" 
                    className="w-full h-full object-cover opacity-60 mix-blend-screen scale-110 blur-[1px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/80" />
                <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />
            </div>

            {/* Red-Haired Dealer Character */}
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-[55%] z-10 pointer-events-none"
            >
                <img 
                    src="/glamorous_casino_dealer_2_1777821331859.png" 
                    alt="Dealer" 
                    className="w-full h-full object-contain object-top drop-shadow-[0_0_40px_rgba(0,0,0,0.9)]"
                />
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-black/40 blur-3xl -z-10" />
            </motion.div>

            {/* Dealer Speech Bubble */}
            <AnimatePresence>
                {phase !== 'shuffle' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="relative z-20 mt-32 mb-2"
                    >
                        <div className="bg-black/90 backdrop-blur-xl border border-yellow-500/40 px-8 py-4 rounded-3xl shadow-2xl relative">
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black border-l border-t border-yellow-500/40 rotate-45" />
                            <p className="text-yellow-500 text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-center italic">
                                {phase === 'show' && "👀 Focus on the Ace..."}
                                {phase === 'pick' && "👆 Your choice, darling."}
                                {phase === 'reveal' && (picked === acePosition ? "🎯 Exquisite! A natural winner." : "💀 House wins this time.")}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cards Area - Large and centered */}
            <div className="flex justify-center items-center w-full max-w-3xl flex-1 relative z-30 mt-auto mb-16 px-4">
                <div className="grid grid-cols-3 gap-6 sm:gap-12 w-full items-center">
                    {shuffledPositions.map((cardId) => (
                        <motion.div
                            key={cardId}
                            layout
                            transition={{ 
                                type: 'spring', 
                                stiffness: phase === 'shuffle' ? 400 : 250, 
                                damping: 25,
                                mass: 1.2
                            }}
                            className="relative"
                        >
                            {getCardContent(cardId)}
                            
                            {/* Dramatic movement during shuffle */}
                            <AnimatePresence>
                                {phase === 'shuffle' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 pointer-events-none"
                                    >
                                        <motion.div
                                            animate={{ 
                                                y: [0, -50, 50, 0],
                                                rotate: [0, 15, -15, 0],
                                                scale: [1, 1.15, 0.85, 1]
                                            }}
                                            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                                            className="w-full h-full border-4 border-yellow-500/20 rounded-2xl"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="relative z-20 bg-black/80 backdrop-blur-xl border border-white/10 px-10 py-3 rounded-full mb-8 shadow-2xl">
                <div className="text-[10px] sm:text-xs text-zinc-500 uppercase font-black tracking-widest flex gap-8 items-center">
                    <span className="flex items-center gap-3">ROUND <span className="text-white text-base">{score + 1}</span></span>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                    <span className="flex items-center gap-3">TARGET <span className="text-yellow-500 text-base">{targetScore}</span></span>
                </div>
            </div>

            {/* Win/Fail Particles Overlay */}
            <AnimatePresence>
                {phase === 'reveal' && picked === acePosition && (
                    <div className="absolute inset-0 pointer-events-none z-50">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0, x: '50%', y: '60%' }}
                                animate={{ 
                                    opacity: [0, 1, 0], 
                                    scale: [0, 2, 0.5],
                                    x: `${5 + Math.random() * 90}%`,
                                    y: `${5 + Math.random() * 90}%`
                                }}
                                transition={{ duration: 2, delay: i * 0.02 }}
                                className="absolute w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_30px_#d4af37]"
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
