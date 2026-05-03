'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onWin: () => void;
    onFail: () => void;
    targetScore: number;
}

function generateCard() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const labels = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const valIdx = Math.floor(Math.random() * values.length);
    const suitIdx = Math.floor(Math.random() * suits.length);
    return {
        value: values[valIdx],
        label: labels[valIdx],
        suit: suits[suitIdx],
        isRed: suits[suitIdx] === '♥' || suits[suitIdx] === '♦'
    };
}

export default function HigherLowerGame({ onWin, onFail, targetScore }: Props) {
    const [currentCard, setCurrentCard] = useState(generateCard());
    const [nextCard, setNextCard] = useState<{ value: number; suit: string; label: string; isRed: boolean } | null>(null);
    const [score, setScore] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

    const handleGuess = useCallback((guess: 'higher' | 'lower') => {
        if (animating) return;

        let newCard = generateCard();
        
        // Game is now purely chance based, no helpers.

        setNextCard(newCard);
        setAnimating(true);

        setTimeout(() => {
            const isCorrect =
                (guess === 'higher' && newCard.value >= currentCard.value) ||
                (guess === 'lower' && newCard.value <= currentCard.value);

            if (isCorrect) {
                const newScore = score + 1;
                setScore(newScore);
                setResult('correct');
                setCurrentCard(newCard);
                setNextCard(null);

                setTimeout(() => {
                    setResult(null);
                    if (newScore >= targetScore) {
                        onWin();
                    }
                }, 400);
            } else {
                setResult('wrong');
                setTimeout(() => onFail(), 800);
            }
            setAnimating(false);
        }, 1200);
    }, [animating, currentCard, score, targetScore, onWin, onFail]);

    return (
        <div className="flex-1 flex flex-col items-center justify-between relative p-4 overflow-hidden gap-4 min-h-[500px]">
            {/* Luxury Casino Background */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/luxury_casino_interior_1777820455628.png" 
                    alt="Casino Background" 
                    className="w-full h-full object-cover opacity-60 mix-blend-screen scale-110 blur-[1px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/80" />
                <div className="absolute top-[-10%] right-[-10%] w-1/2 h-1/2 bg-gold/10 blur-[100px] rounded-full pointer-events-none" />
            </div>

            {/* Glamorous Dealer Character */}
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-[60%] z-10 pointer-events-none"
            >
                <img 
                    src="/glamorous_casino_dealer_1777820473994.png" 
                    alt="Dealer" 
                    className="w-full h-full object-contain object-top drop-shadow-[0_0_40px_rgba(0,0,0,0.9)]"
                />
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-black/40 blur-3xl -z-10" />
            </motion.div>

            {/* Dealer Speech Bubble */}
            <AnimatePresence>
                {!animating && !result && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="relative z-20 mt-32 mb-2"
                    >
                        <div className="bg-black/80 backdrop-blur-md border border-gold/30 px-6 py-3 rounded-2xl shadow-2xl relative">
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black border-l border-t border-gold/30 rotate-45" />
                            <p className="text-gold text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-center animate-pulse">
                                "The next card... Higher or Lower?"
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result Display Overlay */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className={`absolute top-[40%] z-50 px-10 py-4 font-black text-3xl sm:text-4xl uppercase tracking-[0.4em] skew-x-[-10deg] ${
                            result === 'correct'
                                ? 'bg-green-500 text-black shadow-[0_0_70px_rgba(34,197,94,0.6)]'
                                : 'bg-ept-red text-white shadow-[0_0_70px_rgba(220,38,38,0.6)]'
                        }`}
                    >
                        {result === 'correct' ? '✓ WINNER' : '✗ BUSTED'}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Card Interaction Area */}
            <div className="relative flex-1 w-full max-w-[200px] sm:max-w-[240px] z-20 flex items-center justify-center mt-auto mb-8">
                <div className="relative w-full aspect-[2.5/3.5] perspective-[1000px]">
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-10 bg-black/60 blur-2xl rounded-full" />

                    <motion.div
                        animate={{ 
                            rotateY: result === 'wrong' ? 15 : 0,
                            z: result === 'wrong' ? -50 : 0
                        }}
                        className={`absolute inset-0 bg-white rounded-xl flex flex-col justify-between p-5 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(0,0,0,0.1)] border-t border-white/60 transition-transform ${currentCard.isRed ? 'text-red-600' : 'text-zinc-900'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-xl" />
                        <div className="text-3xl sm:text-4xl font-black leading-none">{currentCard.label}<br /><span className="text-2xl">{currentCard.suit}</span></div>
                        <div className="flex-1 flex items-center justify-center relative">
                            <div className="text-7xl sm:text-8xl font-black drop-shadow-lg relative z-10">{currentCard.suit}</div>
                            <img 
                                src="/avatars/avatar_edward_wearing_1772222877224.png" 
                                alt="Watermark" 
                                className="absolute inset-0 w-full h-full object-contain opacity-[0.07] scale-125 grayscale"
                            />
                        </div>
                        <div className="text-3xl sm:text-4xl font-black leading-none text-right rotate-180">{currentCard.label}<br /><span className="text-2xl">{currentCard.suit}</span></div>
                    </motion.div>

                    <AnimatePresence>
                        {nextCard && (
                            <motion.div
                                initial={{ rotateY: -180, opacity: 0, x: 300, y: -50, scale: 0.5 }}
                                animate={{ rotateY: 0, opacity: 1, x: 0, y: 0, scale: 1 }}
                                transition={{ duration: 0.6, type: 'spring', damping: 15 }}
                                className={`absolute inset-0 bg-white rounded-xl flex flex-col justify-between p-5 shadow-[0_40px_80px_rgba(0,0,0,1),inset_0_0_30px_rgba(0,0,0,0.1)] border-t border-white/60 ${nextCard.isRed ? 'text-red-600' : 'text-zinc-900'} z-30`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-xl" />
                                <div className="text-3xl sm:text-4xl font-black leading-none">{nextCard.label}<br /><span className="text-2xl">{nextCard.suit}</span></div>
                                <div className="flex-1 flex items-center justify-center relative">
                                    <div className="text-7xl sm:text-8xl font-black drop-shadow-lg relative z-10">{nextCard.suit}</div>
                                    <img 
                                        src="/avatars/avatar_edward_wearing_1772222877224.png" 
                                        alt="Watermark" 
                                        className="absolute inset-0 w-full h-full object-contain opacity-[0.07] scale-125 grayscale"
                                    />
                                </div>
                                <div className="text-3xl sm:text-4xl font-black leading-none text-right rotate-180">{nextCard.label}<br /><span className="text-2xl">{nextCard.suit}</span></div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Control Panel */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-4 pb-6 relative z-30">
                <button
                    disabled={animating || result !== null}
                    onClick={() => handleGuess('higher')}
                    className="group relative h-16 sm:h-20 bg-gradient-to-b from-green-500 to-green-700 rounded-2xl border-b-8 border-green-900 shadow-[0_10px_30px_rgba(34,197,94,0.3)] active:border-b-0 active:translate-y-2 transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                    <span className="relative z-10 text-black font-black text-xl sm:text-2xl uppercase italic tracking-tighter">Higher</span>
                </button>
                <button
                    disabled={animating || result !== null}
                    onClick={() => handleGuess('lower')}
                    className="group relative h-16 sm:h-20 bg-gradient-to-b from-ept-red to-red-800 rounded-2xl border-b-8 border-red-950 shadow-[0_10px_30px_rgba(220,38,38,0.3)] active:border-b-0 active:translate-y-2 transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                    <span className="relative z-10 text-white font-black text-xl sm:text-2xl uppercase italic tracking-tighter">Lower</span>
                </button>

                <div className="col-span-2 flex justify-center mt-2">
                    <div className="bg-black/60 backdrop-blur border border-white/10 px-4 py-1 rounded-full flex gap-3 items-center">
                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Streak</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                        <span className="text-white font-black text-sm">{score}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
