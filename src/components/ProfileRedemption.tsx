'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    playerName: string;
    onSuccess: () => void;
}

// Ensure the name matches the generated filename logic
const getAvatarFilename = (name: string) => `avatar_${name.toLowerCase().replace(' ', '_')}.png`;

export default function ProfileRedemption({ playerName, onSuccess }: Props) {
    // Game States
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'animating' | 'won' | 'lost' | 'locked'>('intro');
    const [score, setScore] = useState(0);
    const [currentCard, setCurrentCard] = useState(generateCard());
    const [nextCard, setNextCard] = useState<{ value: number, suit: string, label: string, isRed: boolean } | null>(null);
    const [lockoutTimer, setLockoutTimer] = useState<string>('');

    // Load LocalStorage state on mount
    useEffect(() => {
        const key = `hijack_lockout_${playerName}`;
        const savedLockout = localStorage.getItem(key);
        if (savedLockout) {
            const unlockTime = parseInt(savedLockout, 10);
            if (Date.now() < unlockTime) {
                setGameState('locked');
                updateTimer(unlockTime);
                const interval = setInterval(() => updateTimer(unlockTime), 1000);
                return () => clearInterval(interval);
            } else {
                localStorage.removeItem(key); // Lockout expired
            }
        }
    }, [playerName]);

    function updateTimer(unlockTime: number) {
        const diff = unlockTime - Date.now();
        if (diff <= 0) {
            setGameState('intro');
            return;
        }
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setLockoutTimer(`${h}h ${m}m ${s}s`);
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

    const handleGuess = (guess: 'higher' | 'lower') => {
        if (gameState !== 'playing') return;

        const newCard = generateCard();
        setNextCard(newCard);
        setGameState('animating');

        setTimeout(() => {
            const isCorrect =
                (guess === 'higher' && newCard.value >= currentCard.value) ||
                (guess === 'lower' && newCard.value <= currentCard.value);

            if (isCorrect) {
                const newScore = score + 1;
                setScore(newScore);
                setCurrentCard(newCard);
                setNextCard(null);

                if (newScore >= 3) {
                    setGameState('won');
                    setTimeout(() => onSuccess(), 3000); // Trigger success callback after 3s
                } else {
                    setGameState('playing');
                }
            } else {
                setGameState('lost');
                const unlockTime = Date.now() + (12 * 60 * 60 * 1000); // 12 hours from now
                localStorage.setItem(`hijack_lockout_${playerName}`, unlockTime.toString());
            }
        }, 1500); // Give time for card flip animation
    };

    if (gameState === 'locked') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-mono select-none">
                <div className="border-4 border-ept-red bg-black p-8 text-center max-w-sm w-full mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-20 pointer-events-none" />
                    <h1 className="text-4xl text-ept-red font-black uppercase mb-4 animate-pulse">SYSTEM LOCKED</h1>
                    <p className="text-white text-sm mb-6">Profile rescue operation failed. Security protocols active.</p>
                    <div className="text-3xl font-black text-white bg-ept-red/20 border-2 border-ept-red py-4">
                        {lockoutTimer}
                    </div>
                    <p className="text-zinc-500 text-xs mt-4 uppercase">Lockout Sequence Ending Soon</p>
                </div>
            </div>
        );
    }

    if (gameState === 'intro') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-mono select-none">
                <div className="max-w-md w-full border-4 border-green-500 bg-black p-6 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-20 pointer-events-none" />
                    <div className="text-center relative z-10">
                        <h1 className="text-3xl text-green-500 font-black uppercase mb-2">Profile Hijacked</h1>
                        <p className="text-white text-xs mb-8">Execute override command to recover data.</p>

                        <div className="flex justify-center mb-8">
                            <img src={`/avatars/${getAvatarFilename(playerName)}`} alt={playerName} className="w-32 h-32 object-contain filter drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        </div>

                        <button
                            onClick={() => setGameState('playing')}
                            className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 uppercase border-b-4 border-green-700 active:border-b-0 active:mt-1 transition-all"
                        >
                            Start Override
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        // Enforce Mobile Aspect Ratio constraints (max-w-md mx-auto)
        <div className="min-h-screen bg-black flex flex-col font-mono select-none overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-[0.15] pointer-events-none" />

            <div className="max-w-md w-full mx-auto flex-1 flex flex-col border-x-4 border-zinc-900 bg-[#0a0a0a] relative z-10">
                {/* Header Avatars */}
                <div className="flex justify-between items-center p-4 border-b-4 border-zinc-900 bg-black">
                    <div className="text-center">
                        <img src={`/avatars/${getAvatarFilename(playerName)}`} alt="Player" className="w-16 h-16 object-contain" />
                        <span className="text-[10px] text-green-500 font-bold uppercase block mt-1">Player</span>
                    </div>

                    <div className="flex space-x-2">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className={`w-4 h-4 border-2 ${i < score ? 'bg-green-500 border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-black border-zinc-700'}`} />
                        ))}
                    </div>

                    <div className="text-center">
                        {/* Generic skull/hacker icon for hijacker */}
                        <div className="w-16 h-16 flex items-center justify-center text-4xl text-ept-red font-black">?</div>
                        <span className="text-[10px] text-ept-red font-bold uppercase block mt-1">Hijacker</span>
                    </div>
                </div>

                {/* Massive Active Playing Card */}
                <div className="flex-1 flex items-center justify-center p-8 relative">
                    <AnimatePresence mode="wait">
                        {gameState === 'won' ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-center"
                            >
                                <h2 className="text-5xl text-green-500 font-black uppercase mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]">Override<br />Success</h2>
                                <p className="text-white text-sm">Returning to profile...</p>
                            </motion.div>
                        ) : gameState === 'lost' ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-center"
                            >
                                <h2 className="text-6xl text-ept-red font-black uppercase mb-4 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">Game<br />Over</h2>
                                <p className="text-zinc-500 text-sm">Lockout protocols engaged.</p>
                            </motion.div>
                        ) : (
                            <div className="relative w-full aspect-[2.5/3.5] max-w-[280px]">
                                {/* Current Card */}
                                <motion.div
                                    key={currentCard.label + currentCard.suit}
                                    className={`absolute inset-0 bg-white border-8 border-zinc-200 rounded-xl flex flex-col justify-between p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${currentCard.isRed ? 'text-red-500' : 'text-black'}`}
                                >
                                    <div className="text-4xl font-black leading-none">{currentCard.label}<br /><span className="text-3xl">{currentCard.suit}</span></div>
                                    <div className="flex-1 flex items-center justify-center text-8xl font-black">{currentCard.suit}</div>
                                    <div className="text-4xl font-black leading-none text-right rotate-180">{currentCard.label}<br /><span className="text-3xl">{currentCard.suit}</span></div>
                                </motion.div>

                                {/* Next Card (Animating in on top) */}
                                {nextCard && (
                                    <motion.div
                                        initial={{ rotateY: -180, opacity: 0, x: 100 }}
                                        animate={{ rotateY: 0, opacity: 1, x: 0 }}
                                        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                                        className={`absolute inset-0 bg-white border-8 border-zinc-200 rounded-xl flex flex-col justify-between p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${nextCard.isRed ? 'text-red-500' : 'text-black'} z-10`}
                                    >
                                        <div className="text-4xl font-black leading-none">{nextCard.label}<br /><span className="text-3xl">{nextCard.suit}</span></div>
                                        <div className="flex-1 flex items-center justify-center text-8xl font-black">{nextCard.suit}</div>
                                        <div className="text-4xl font-black leading-none text-right rotate-180">{nextCard.label}<br /><span className="text-3xl">{nextCard.suit}</span></div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Chunky 8-bit Buttons */}
                <div className="p-4 grid grid-cols-2 gap-4 border-t-4 border-zinc-900 bg-black">
                    <button
                        disabled={gameState !== 'playing'}
                        onClick={() => handleGuess('higher')}
                        className={`w-full bg-green-500 hover:bg-green-400 disabled:bg-zinc-800 disabled:border-zinc-900 disabled:text-zinc-600 text-black font-black text-2xl py-6 uppercase border-b-8 border-green-700 active:border-b-0 active:mt-2 transition-all`}
                    >
                        Higher
                    </button>
                    <button
                        disabled={gameState !== 'playing'}
                        onClick={() => handleGuess('lower')}
                        className={`w-full bg-ept-red hover:bg-red-500 disabled:bg-zinc-800 disabled:border-zinc-900 disabled:text-zinc-600 text-black font-black text-2xl py-6 uppercase border-b-8 border-red-800 active:border-b-0 active:mt-2 transition-all`}
                    >
                        Lower
                    </button>
                </div>
            </div>
        </div>
    );
}
