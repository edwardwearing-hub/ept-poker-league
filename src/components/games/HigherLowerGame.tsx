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

        const newCard = generateCard();
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
        <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* Result Flash */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute top-4 z-20 px-6 py-2 font-black text-xl uppercase tracking-widest ${result === 'correct'
                                ? 'bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.6)]'
                                : 'bg-ept-red text-white shadow-[0_0_30px_rgba(220,38,38,0.6)]'
                            }`}
                    >
                        {result === 'correct' ? '✓ CORRECT' : '✗ WRONG'}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Card Area */}
            <div className="relative w-full aspect-[2.5/3.5] max-w-[240px] sm:max-w-[280px]">
                {/* Current Card */}
                <div
                    className={`absolute inset-0 bg-white border-8 border-zinc-200 rounded-xl flex flex-col justify-between p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${currentCard.isRed ? 'text-red-500' : 'text-black'}`}
                >
                    <div className="text-3xl sm:text-4xl font-black leading-none">{currentCard.label}<br /><span className="text-2xl sm:text-3xl">{currentCard.suit}</span></div>
                    <div className="flex-1 flex items-center justify-center text-7xl sm:text-8xl font-black">{currentCard.suit}</div>
                    <div className="text-3xl sm:text-4xl font-black leading-none text-right rotate-180">{currentCard.label}<br /><span className="text-2xl sm:text-3xl">{currentCard.suit}</span></div>
                </div>

                {/* Next Card (Animating in) */}
                <AnimatePresence>
                    {nextCard && (
                        <motion.div
                            initial={{ rotateY: -180, opacity: 0, x: 100 }}
                            animate={{ rotateY: 0, opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                            className={`absolute inset-0 bg-white border-8 border-zinc-200 rounded-xl flex flex-col justify-between p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${nextCard.isRed ? 'text-red-500' : 'text-black'} z-10`}
                        >
                            <div className="text-3xl sm:text-4xl font-black leading-none">{nextCard.label}<br /><span className="text-2xl sm:text-3xl">{nextCard.suit}</span></div>
                            <div className="flex-1 flex items-center justify-center text-7xl sm:text-8xl font-black">{nextCard.suit}</div>
                            <div className="text-3xl sm:text-4xl font-black leading-none text-right rotate-180">{nextCard.label}<br /><span className="text-2xl sm:text-3xl">{nextCard.suit}</span></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Buttons */}
            <div className="w-full grid grid-cols-2 gap-4 mt-8 px-4">
                <button
                    disabled={animating}
                    onClick={() => handleGuess('higher')}
                    className="w-full bg-green-500 hover:bg-green-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black text-xl sm:text-2xl py-5 sm:py-6 uppercase border-b-8 border-green-700 active:border-b-0 active:mt-2 transition-all disabled:border-zinc-900"
                >
                    Higher
                </button>
                <button
                    disabled={animating}
                    onClick={() => handleGuess('lower')}
                    className="w-full bg-ept-red hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black text-xl sm:text-2xl py-5 sm:py-6 uppercase border-b-8 border-red-800 active:border-b-0 active:mt-2 transition-all disabled:border-zinc-900"
                >
                    Lower
                </button>
            </div>
        </div>
    );
}
