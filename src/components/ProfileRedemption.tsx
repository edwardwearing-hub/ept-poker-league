'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Props {
    playerName: string;
    enemyQueue: string[];
    onSuccess: () => void;
}

const AVATAR_MAP: Record<string, string> = {
    'edward wearing': 'avatar_edward_wearing_1772222877224.png',
    'georgina wearing': 'avatar_georgina_wearing_1772223035422.png',
    'luke daly': 'avatar_luke_daly_1772223102669.png',
    'daniel horne': 'avatar_daniel_horne_1772222954376.png',
    'darren daly': 'avatar_darren_daly_1772222979758.png',
    'chris daly': 'avatar_chris_daly_1772222942062.png',
    'stephen flood': 'avatar_stephen_flood_1772223088474.png',
    // Phil doesn't have an avatar in the directory yet, fallback to hoodie
    'phil landsberger': 'avatar_hoodie.png',
    'liam duxbury': 'avatar_liam_duxbury_1772223048076.png',
    'nathen benson': 'avatar_nathen_benson_1772223077518.png',
    'dave taylor': 'avatar_dave_taylor_1772223007740.png',
    'unknown hacker': 'avatar_bounty.png'
};

const getAvatarFilename = (name: string) => {
    const key = name.toLowerCase().trim();
    return AVATAR_MAP[key] || 'avatar_hoodie.png';
};

export default function ProfileRedemption({ playerName, enemyQueue, onSuccess }: Props) {
    const router = useRouter();

    // Game States
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'animating' | 'next_enemy' | 'won' | 'lost' | 'locked'>('intro');
    const [score, setScore] = useState(0);
    const [currentCard, setCurrentCard] = useState(generateCard());
    const [nextCard, setNextCard] = useState<{ value: number, suit: string, label: string, isRed: boolean } | null>(null);
    const [lockoutTimer, setLockoutTimer] = useState<string>('');

    // Gauntlet State
    const [parsedQueue, setParsedQueue] = useState<{ name: string, isNemesis: boolean, requiredWins: number }[]>([]);
    const [currentEnemyIndex, setCurrentEnemyIndex] = useState(0);

    // Initial Queue Parsing & Checkpoint Filtering
    useEffect(() => {
        // 1. Load Checkpoints (who have we already beaten?)
        const savedDefeated = localStorage.getItem(`hijack_defeated_${playerName}`);
        let defeatedList: string[] = [];
        if (savedDefeated) {
            try {
                defeatedList = JSON.parse(savedDefeated);
            } catch (e) {
                console.error("Failed to parse defeated enemies checkpoint");
            }
        }

        if (!enemyQueue || enemyQueue.length === 0) {
            // Fallback default enemy if queue is empty
            if (!defeatedList.includes("Unknown Hacker")) {
                setParsedQueue([{ name: "Unknown Hacker", isNemesis: false, requiredWins: 3 }]);
            } else {
                // If they bizarrely defeated the fallback, clear the hijack
                onSuccess();
            }
            return;
        }

        // 2. Count occurrences to spawn Nemesis bosses
        const counts: Record<string, number> = {};
        enemyQueue.forEach(e => counts[e] = (counts[e] || 0) + 1);

        const newQueue: { name: string, isNemesis: boolean, requiredWins: number }[] = [];
        Object.entries(counts).forEach(([name, count]) => {
            // 3. Filter out if this SPECIFIC enemy name is in the defeated checkpoint map
            if (!defeatedList.includes(name)) {
                if (count > 1) {
                    newQueue.push({ name, isNemesis: true, requiredWins: 6 });
                } else {
                    newQueue.push({ name, isNemesis: false, requiredWins: 3 });
                }
            }
        });

        // Randomize the queue order for variation
        newQueue.sort(() => Math.random() - 0.5);

        if (newQueue.length === 0) {
            // If the queue is 0 after filtering, they won! Un-hijack them.
            onSuccess();
        } else {
            setParsedQueue(newQueue);
        }
    }, [enemyQueue, playerName, onSuccess]);

    // Load LocalStorage Lockout state on mount
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

                const targetWins = parsedQueue[currentEnemyIndex]?.requiredWins || 3;

                if (newScore >= targetWins) {
                    // Defeated this enemy!

                    // Save Checkpoint to LocalStorage
                    const enemyName = parsedQueue[currentEnemyIndex].name;
                    const savedDefeated = localStorage.getItem(`hijack_defeated_${playerName}`);
                    let defeatedList: string[] = [];
                    if (savedDefeated) {
                        try { defeatedList = JSON.parse(savedDefeated); } catch (e) { }
                    }
                    defeatedList.push(enemyName);
                    localStorage.setItem(`hijack_defeated_${playerName}`, JSON.stringify(defeatedList));

                    if (currentEnemyIndex + 1 < parsedQueue.length) {
                        // More enemies left in queue
                        setGameState('next_enemy');
                        setTimeout(() => {
                            setCurrentEnemyIndex(prev => prev + 1);
                            setScore(0);
                            setGameState('playing');
                        }, 2500);
                    } else {
                        // Entire queue defeated!
                        setGameState('won');
                        localStorage.removeItem(`hijack_defeated_${playerName}`); // Clear checkpoints
                        setTimeout(() => onSuccess(), 3000);
                    }
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
                    <p className="text-zinc-500 text-xs mt-4 mb-8 uppercase">Lockout Sequence Ending Soon</p>

                    <button
                        onClick={() => router.back()}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 uppercase border-b-4 border-zinc-900 active:border-b-0 active:mt-1 transition-all rounded-lg"
                    >
                        Retreat to Safety
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'intro') {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center font-mono select-none overflow-hidden touch-none pointer-events-auto">
                {/* Darken the underlying profile but keep it visible */}
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none" />

                {/* Retro Spray Paint Background Details */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ept-red/30 rounded-full blur-[100px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/30 rounded-full blur-[100px]" />
                </div>

                {/* Graffiti Stamp */}
                <div className="absolute top-[20%] right-[10%] md:right-[20%] transform rotate-[15deg] border-4 border-ept-red p-2 opacity-80 z-20 pointer-events-none drop-shadow-[0_0_15px_rgba(220,38,38,1)]">
                    <div className="border-4 border-ept-red px-6 py-2">
                        <span className="text-5xl md:text-7xl font-black text-ept-red uppercase tracking-tighter">OWNED</span>
                    </div>
                </div>

                {/* Secondary Stamp */}
                <div className="absolute bottom-[20%] left-[5%] md:left-[15%] transform -rotate-[25deg] bg-yellow-400 text-black px-6 py-2 uppercase font-black text-2xl md:text-4xl shadow-[0_5px_0_#b45309] z-20 pointer-events-none">
                    CAUTION: HIJACKED
                </div>

                {/* Center Content */}
                <div className="relative z-30 flex flex-col items-center w-full max-w-lg p-6">
                    {/* The Squatters (Hijackers) */}
                    <div className="relative mb-8">
                        {/* Speech Bubble */}
                        <div className="absolute -top-16 -right-16 bg-white text-black font-black text-sm px-4 py-2 rounded-xl rounded-bl-none z-40 transform rotate-6 border-4 border-black border-b-8 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                            GG EZ
                        </div>

                        {/* Avatar Cluster */}
                        <div className="flex justify-center items-center drop-shadow-[0_0_25px_rgba(34,197,94,0.4)]">
                            <div className="flex -space-x-8 mr-4 z-20">
                                {parsedQueue.slice(0, 3).map((enemy, idx) => (
                                    <img
                                        key={idx}
                                        src={`/avatars/${getAvatarFilename(enemy.name)}`}
                                        alt={enemy.name}
                                        className={`w-32 h-32 md:w-40 md:h-40 object-contain filter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] ${enemy.isNemesis ? 'animate-pulse' : ''} border-b-4 border-ept-red bg-black/80 rounded-full`}
                                        style={{ zIndex: 10 - idx }}
                                    />
                                ))}
                                {parsedQueue.length > 3 && (
                                    <div className="w-24 h-24 bg-zinc-900 border-4 border-ept-red rounded-full flex items-center justify-center text-ept-red font-black text-3xl z-0 shadow-inner inline-block relative -ml-8">
                                        +{parsedQueue.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl text-green-500 font-black uppercase mb-4 drop-shadow-[0_0_10px_rgba(34,197,94,1)] animate-pulse">
                            Profile Defaced
                        </h1>
                        <p className="text-white text-sm md:text-base font-bold bg-black/50 p-2 border border-white/10 uppercase tracking-widest">
                            Defeat the Gauntlet to recover your data.
                        </p>
                    </div>

                    <button
                        onClick={() => setGameState('playing')}
                        className="w-full max-w-sm bg-gradient-to-b from-yellow-300 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-black font-black text-xl md:text-2xl py-6 px-4 uppercase border-4 border-yellow-700 shadow-[0_10px_0_#a16207,0_15px_20px_rgba(0,0,0,0.5)] active:translate-y-2 active:shadow-[0_2px_0_#a16207,0_5px_10px_rgba(0,0,0,0.5)] transition-all rounded-xl relative overflow-hidden group"
                    >
                        {/* Coin slot effect line */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-black/20 rounded-full" />
                        <span className="block drop-shadow-[0_2px_0_rgba(255,255,255,0.4)] group-hover:animate-pulse">
                            Insert Coin to Redeem
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    const currentEnemy = parsedQueue[currentEnemyIndex] || { name: 'Unknown', isNemesis: false, requiredWins: 3 };

    return (
        // Enforce Mobile Aspect Ratio constraints (max-w-md mx-auto)
        <div className="min-h-screen bg-black flex flex-col font-mono select-none overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-[0.15] pointer-events-none" />

            <div className="max-w-md w-full mx-auto flex-1 flex flex-col border-x-4 border-zinc-900 bg-[#0a0a0a] relative z-10">
                {/* Header Avatars */}
                <div className="flex justify-between items-center p-4 border-b-4 border-zinc-900 bg-black">
                    <div className="text-center">
                        <img src={`/avatars/${getAvatarFilename(playerName)}`} alt="Player" className="w-16 h-16 object-contain filter drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]" />
                        <span className="text-[10px] text-green-500 font-bold uppercase block mt-1">Player</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-1">
                            Gauntlet: {currentEnemyIndex + 1} / {parsedQueue.length}
                        </span>
                        <div className="flex space-x-1">
                            {Array.from({ length: currentEnemy.requiredWins }).map((_, i) => (
                                <div key={i} className={`w-3 h-3 md:w-4 md:h-4 border-2 ${i < score ? 'bg-green-500 border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-black border-zinc-700'}`} />
                            ))}
                        </div>
                    </div>

                    <div className="text-center">
                        <img src={`/avatars/${getAvatarFilename(currentEnemy.name)}`} alt={currentEnemy.name} className={`w-16 h-16 object-contain ${currentEnemy.isNemesis ? 'filter drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : ''} ${gameState === 'next_enemy' ? 'opacity-0' : 'opacity-100'}`} />
                        <span className={`text-[10px] ${currentEnemy.isNemesis ? 'text-ept-red animate-pulse' : 'text-zinc-400'} font-bold uppercase block mt-1`}>
                            {currentEnemy.isNemesis ? 'Nemesis Boss' : 'Hijacker'}
                        </span>
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
                        ) : gameState === 'next_enemy' ? (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center"
                            >
                                <h2 className="text-3xl text-gold font-black uppercase mb-4 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-pulse">
                                    Target<br />Destroyed
                                </h2>
                                <p className="text-white text-sm">Loading next opponent...</p>
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

                {/* Battle Characters */}
                {(gameState === 'playing' || gameState === 'animating' || gameState === 'next_enemy') && (
                    <div className="flex justify-between items-end px-8 pb-4 relative z-20">
                        {/* Player */}
                        <div className="flex flex-col items-center">
                            <img src={`/avatars/${getAvatarFilename(playerName)}`} alt="Player" className="w-24 h-24 md:w-32 md:h-32 object-contain filter drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] transform scale-x-[-1]" />
                        </div>

                        <div className="text-3xl md:text-4xl font-black text-white italic absolute left-1/2 -translate-x-1/2 bottom-12 opacity-50">VS</div>

                        {/* Enemy */}
                        <div className="flex flex-col items-center">
                            <img src={`/avatars/${getAvatarFilename(currentEnemy.name)}`} alt={currentEnemy.name} className={`w-28 h-28 md:w-36 md:h-36 object-contain filter ${currentEnemy.isNemesis ? 'drop-shadow-[0_0_20px_rgba(220,38,38,0.9)] animate-pulse' : 'drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]'}`} />
                        </div>
                    </div>
                )}

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
