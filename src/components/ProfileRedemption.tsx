'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MiniGameEngine from './games/MiniGameEngine';

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
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'next_enemy' | 'won' | 'lost' | 'locked'>('intro');
    const [lockoutTimer, setLockoutTimer] = useState<string>('');

    // Gauntlet State
    const [parsedQueue, setParsedQueue] = useState<{ name: string, isNemesis: boolean, requiredWins: number }[]>([]);
    const [currentEnemyIndex, setCurrentEnemyIndex] = useState(0);

    // Key to force re-mount the MiniGameEngine for each enemy
    const [gameKey, setGameKey] = useState(0);

    // Initial Queue Parsing & Checkpoint Filtering
    useEffect(() => {
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
            if (!defeatedList.includes("Unknown Hacker")) {
                setParsedQueue([{ name: "Unknown Hacker", isNemesis: false, requiredWins: 3 }]);
            } else {
                onSuccess();
            }
            return;
        }

        const counts: Record<string, number> = {};
        enemyQueue.forEach(e => counts[e] = (counts[e] || 0) + 1);

        const newQueue: { name: string, isNemesis: boolean, requiredWins: number }[] = [];
        Object.entries(counts).forEach(([name, count]) => {
            if (!defeatedList.includes(name)) {
                if (count > 1) {
                    newQueue.push({ name, isNemesis: true, requiredWins: 6 });
                } else {
                    newQueue.push({ name, isNemesis: false, requiredWins: 3 });
                }
            }
        });

        newQueue.sort(() => Math.random() - 0.5);

        if (newQueue.length === 0) {
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
                localStorage.removeItem(key);
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

    // --- Game Callbacks ---
    const handleGameWin = () => {
        // Save checkpoint
        const enemyName = parsedQueue[currentEnemyIndex].name;
        const savedDefeated = localStorage.getItem(`hijack_defeated_${playerName}`);
        let defeatedList: string[] = [];
        if (savedDefeated) {
            try { defeatedList = JSON.parse(savedDefeated); } catch (e) { }
        }
        defeatedList.push(enemyName);
        localStorage.setItem(`hijack_defeated_${playerName}`, JSON.stringify(defeatedList));

        if (currentEnemyIndex + 1 < parsedQueue.length) {
            // More enemies — show transition, then load next enemy with a new random game
            setGameState('next_enemy');
            setTimeout(() => {
                setCurrentEnemyIndex(prev => prev + 1);
                setGameKey(k => k + 1); // Force new random game
                setGameState('playing');
            }, 2500);
        } else {
            // Entire queue defeated!
            setGameState('won');
            localStorage.removeItem(`hijack_defeated_${playerName}`);

            fetch('/api/player/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName })
            }).catch(e => console.error('Failed to notify server of redemption', e));

            setTimeout(() => onSuccess(), 3000);
        }
    };

    const handleGameFail = () => {
        setGameState('lost');
        const unlockTime = Date.now() + (12 * 60 * 60 * 1000);
        localStorage.setItem(`hijack_lockout_${playerName}`, unlockTime.toString());
    };

    // --- LOCKED SCREEN ---
    if (gameState === 'locked') {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center font-mono select-none overflow-hidden touch-none pointer-events-auto">
                <div className="absolute inset-0 bg-black/80 backdrop-grayscale backdrop-blur-sm pointer-events-none" />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[150vw] flex justify-center transform -rotate-[15deg] pointer-events-none z-10 opacity-30 select-none">
                    <span style={{ fontSize: 'clamp(150px, 25vw, 400px)' }} className="font-black text-ept-red uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,1)] whitespace-nowrap">
                        LOCKED LOCKED
                    </span>
                </div>

                <div className="relative z-30 border-4 border-ept-red bg-black/90 p-8 text-center max-w-sm w-full mx-auto shadow-[0_0_40px_rgba(220,38,38,0.5)] backdrop-blur-md">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-20 pointer-events-none" />
                    <h1 className="text-4xl text-ept-red font-black uppercase mb-4 animate-pulse drop-shadow-[0_0_10px_rgba(220,38,38,1)]">SYSTEM LOCKED</h1>
                    <p className="text-white text-sm mb-6 font-bold uppercase tracking-widest">Profile rescue failed.</p>
                    <div className="text-3xl font-black text-white bg-ept-red/20 border-2 border-ept-red py-4 relative z-10">
                        {lockoutTimer}
                    </div>
                    <p className="text-zinc-500 text-[10px] mt-4 mb-8 uppercase font-bold tracking-widest">Lockout Sequence Active</p>

                    <button
                        onClick={() => router.back()}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black py-4 uppercase border-b-4 border-black active:border-b-0 active:mt-1 transition-all rounded-lg relative z-10"
                    >
                        Retreat to Safety
                    </button>
                </div>
            </div>
        );
    }

    // --- INTRO SCREEN ---
    if (gameState === 'intro') {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center font-mono select-none overflow-hidden touch-none pointer-events-auto">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none" />

                {/* Retro Spray Paint Background */}
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
                    {/* Hijacker Avatars */}
                    <div className="relative mb-8">
                        <div className="absolute -top-16 -right-16 bg-white text-black font-black text-sm px-4 py-2 rounded-xl rounded-bl-none z-40 transform rotate-6 border-4 border-black border-b-8 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                            GG EZ
                        </div>

                        <div className="flex justify-center items-center drop-shadow-[0_0_25px_rgba(34,197,94,0.4)]">
                            <div className="flex -space-x-8 mr-4 z-20">
                                {parsedQueue.slice(0, 3).map((enemy, idx) => (
                                    <img
                                        key={idx}
                                        src={`/avatars/${getAvatarFilename(enemy.name)}`}
                                        alt={enemy.name}
                                        className={`w-32 h-32 md:w-40 md:h-40 object-contain filter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] ${enemy.isNemesis ? 'animate-pulse' : ''} border-b-4 border-ept-red bg-black/80 rounded-full ${idx % 2 === 0 ? 'animate-float' : 'animate-float-delayed'}`}
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
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-black/20 rounded-full" />
                        <span className="block drop-shadow-[0_2px_0_rgba(255,255,255,0.4)] group-hover:animate-pulse">
                            Insert Coin to Redeem
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    // --- GAME PLAYING: Delegate to MiniGameEngine ---
    if (gameState === 'playing') {
        const currentEnemy = parsedQueue[currentEnemyIndex] || { name: 'Unknown', isNemesis: false, requiredWins: 3 };

        return (
            <MiniGameEngine
                key={gameKey}
                playerName={playerName}
                enemyName={currentEnemy.name}
                isNemesis={currentEnemy.isNemesis}
                targetScore={currentEnemy.requiredWins}
                gauntletCurrent={currentEnemyIndex + 1}
                gauntletTotal={parsedQueue.length}
                onWin={handleGameWin}
                onFail={handleGameFail}
            />
        );
    }

    // --- RESULT SCREENS ---
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-mono select-none bg-black">
            {gameState === 'won' && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center"
                >
                    <h2 className="text-5xl text-green-500 font-black uppercase mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]">Override<br />Success</h2>
                    <p className="text-white text-sm">Returning to profile...</p>
                </motion.div>
            )}

            {gameState === 'lost' && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center"
                >
                    <h2 className="text-6xl text-ept-red font-black uppercase mb-4 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">Game<br />Over</h2>
                    <p className="text-zinc-500 text-sm">Lockout protocols engaged.</p>
                </motion.div>
            )}

            {gameState === 'next_enemy' && (
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
            )}
        </div>
    );
}
