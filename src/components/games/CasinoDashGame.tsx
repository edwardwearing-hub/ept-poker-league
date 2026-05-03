'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onWin: () => void;
    onFail: () => void;
    targetScore: number;
    playerName?: string;
}

const GRID_ROWS = 7;
const GRID_COLS = 5;
const CELL_SIZE = 52; // 52px per cell
const BOARD_WIDTH = GRID_COLS * CELL_SIZE;
const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE;

interface Enemy {
    id: number;
    row: number;
    col: number;
    direction: 1 | -1;
    speed: number;
    speedMod: number;
}

const AVATARS = [
    '/avatars/avatar_chris_daly_1772222942062.png',
    '/avatars/avatar_daniel_horne_1772222954376.png',
    '/avatars/avatar_darren_daly_1772222979758.png',
    '/avatars/avatar_dave_taylor_1772223007740.png',
    '/avatars/avatar_edward_wearing_1772222877224.png',
    '/avatars/avatar_georgina_wearing_1772223035422.png',
    '/avatars/avatar_liam_duxbury_1772223048076.png',
    '/avatars/avatar_luke_daly_1772223102669.png',
    '/avatars/avatar_nathen_benson_1772223077518.png',
    '/avatars/avatar_stephen_flood_1772223088474.png',
];

export default function CasinoDashGame({ onWin, onFail, targetScore, playerName }: Props) {
    const [playerRow, setPlayerRow] = useState(GRID_ROWS - 1);
    const [playerCol, setPlayerCol] = useState(Math.floor(GRID_COLS / 2));
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [isInvincible, setIsInvincible] = useState(false);
    const [round, setRound] = useState(0);
    const [score, setScore] = useState(0);
    const [playerAvatar, setPlayerAvatar] = useState(AVATARS[0]);

    // Initialize round
    const startRound = useCallback(() => {
        setPlayerRow(GRID_ROWS - 1);
        setPlayerCol(Math.floor(GRID_COLS / 2));
        setGameOver(false);
        setWon(false);
        setIsInvincible(false);
        
        let assignedAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
        if (playerName) {
            const formattedName = playerName.toLowerCase().replace(/\s+/g, '_');
            const foundAvatar = AVATARS.find(a => a.includes(formattedName));
            if (foundAvatar) assignedAvatar = foundAvatar;
        }
        setPlayerAvatar(assignedAvatar);

        const initialEnemies: Enemy[] = [];
        for (let r = 1; r < GRID_ROWS - 1; r++) {
            const startCol = Math.floor(Math.random() * GRID_COLS);
            const dir = Math.random() > 0.5 ? 1 : -1;
            const speedMod = 0.8 + Math.random() * 0.7;
            initialEnemies.push({
                id: r,
                row: r,
                col: startCol,
                direction: dir as 1 | -1,
                speed: 1,
                speedMod,
            });
        }
        setEnemies(initialEnemies);
    }, []);

    useEffect(() => {
        startRound();
    }, [round, startRound]);

    // Game tick — move enemies
    useEffect(() => {
        if (gameOver || won) return;

        // Speed up slightly based on round
        const baseInterval = Math.max(200, 500 - (score * 30));

        const intervals = enemies.map(enemy => {
            const enemySpeed = baseInterval * (enemy.speedMod || 1);
            return setInterval(() => {
                setEnemies(prev => prev.map(e => {
                    if (e.id !== enemy.id) return e; // Only move this specific enemy
                    
                    let newCol = e.col + e.direction * e.speed;
                    let newDir = e.direction;
                    if (newCol >= GRID_COLS) {
                        newCol = GRID_COLS - 1;
                        newDir = -1 as const;
                    } else if (newCol < 0) {
                        newCol = 0;
                        newDir = 1 as const;
                    }
                    return { ...e, col: newCol, direction: newDir };
                }));
            }, enemySpeed);
        });

        return () => intervals.forEach(clearInterval);
    }, [gameOver, won, score, enemies.length]);

    // Collision detection
    useEffect(() => {
        if (gameOver || won || isInvincible) return;

        const hit = enemies.some(e => e.row === playerRow && e.col === playerCol);
        if (hit) {
            setGameOver(true);
            setTimeout(() => onFail(), 1500);
        }

        // Win condition: reach row 0
        if (playerRow === 0) {
            setWon(true);
            const newScore = score + 1;
            setScore(newScore);
            setTimeout(() => {
                if (newScore >= targetScore) {
                    onWin();
                } else {
                    setRound(r => r + 1);
                }
            }, 1500);
        }
    }, [playerRow, playerCol, enemies, gameOver, won, isInvincible, onWin, onFail, score, targetScore]);

    const moveUp = useCallback(() => {
        if (gameOver || won) return;
        setPlayerRow(r => Math.max(0, r - 1));
    }, [gameOver, won]);

    const moveDown = useCallback(() => {
        if (gameOver || won) return;
        setPlayerRow(r => Math.min(GRID_ROWS - 1, r + 1));
    }, [gameOver, won]);

    const moveLeft = useCallback(() => {
        if (gameOver || won) return;
        setPlayerCol(c => Math.max(0, c - 1));
    }, [gameOver, won]);

    const moveRight = useCallback(() => {
        if (gameOver || won) return;
        setPlayerCol(c => Math.min(GRID_COLS - 1, c + 1));
    }, [gameOver, won]);

    // Keyboard support for testing/desktop
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') moveUp();
            if (e.key === 'ArrowDown') moveDown();
            if (e.key === 'ArrowLeft') moveLeft();
            if (e.key === 'ArrowRight') moveRight();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [moveUp, moveDown, moveLeft, moveRight]);

    // Touch swipe detection
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const dx = e.changedTouches[0].clientX - touchStart.x;
        const dy = e.changedTouches[0].clientY - touchStart.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) moveRight();
            else if (dx < -30) moveLeft();
        } else {
            if (dy < -30) moveUp();
            else if (dy > 30) moveDown();
        }
        setTouchStart(null);
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative min-h-[650px] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Background Image */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <img 
                    src="/dingy_betting_shop_bg_1777824805865.png" 
                    alt="Dark Casino Alley" 
                    className="w-full h-full object-cover opacity-60 blur-[4px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-zinc-950 mix-blend-multiply" />
            </div>

            {/* Title */}
            <div className="text-center mb-4 sm:mb-6 relative z-10 bg-black/60 backdrop-blur-md px-8 py-3 rounded-xl border border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                    Casino Vault Heist
                </h3>
                <p className="text-[#00FF41] text-[10px] uppercase font-black tracking-widest animate-pulse">
                    Evade Security & Reach The Vault
                </p>
            </div>

            {/* Arcade Cabinet Frame */}
            <div className="relative z-10 w-full max-w-[340px] bg-gradient-to-b from-zinc-800 to-black p-3 sm:p-4 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_2px_5px_rgba(255,255,255,0.2)] border-4 border-zinc-700">
                
                {/* Inner Screen Bezel */}
                <div className="bg-zinc-950 p-2 sm:p-3 rounded-[24px] shadow-[inset_0_10px_30px_rgba(0,0,0,1)] border-b-2 border-white/10 relative">
                    
                    {/* Security Camera Indicator */}
                    <div className="absolute top-2 right-4 flex items-center gap-2 z-30">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
                        <span className="text-[8px] font-mono text-red-500 font-bold tracking-widest">REC</span>
                    </div>

                    {/* The Game Board (Security Floor) */}
                    <div 
                        className="bg-[#050B14] rounded-xl border border-cyan-900/50 shadow-[inset_0_0_40px_rgba(0,0,0,1)] relative overflow-hidden mx-auto mt-4"
                        style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
                    >
                        {/* Floor Grid Lines */}
                        <div 
                            className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: `
                                    linear-gradient(to right, #0891b2 1px, transparent 1px),
                                    linear-gradient(to bottom, #0891b2 1px, transparent 1px)
                                `,
                                backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
                            }}
                        />

                        {/* Scanline CRT Effect */}
                        <div className="absolute inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />

                        {/* Top Row: Poker Table Edge & Chairs */}
                        {Array.from({ length: GRID_COLS }).map((_, col) => (
                            <div 
                                key={`chair-${col}`}
                                className="absolute flex flex-col items-center justify-end overflow-hidden"
                                style={{ width: CELL_SIZE, height: CELL_SIZE, left: col * CELL_SIZE, top: 0 }}
                            >
                                {/* The Green Felt Table Edge */}
                                <div className="absolute top-0 w-full h-[40%] bg-gradient-to-b from-green-800 to-green-900 border-b-4 border-amber-900 shadow-[0_4px_10px_rgba(0,0,0,0.8)] z-10 flex justify-between px-2 items-center">
                                    <div className="w-2 h-2 rounded-full border border-black/40 bg-white shadow-inner" />
                                    <div className="w-2 h-2 rounded-full border border-black/40 bg-red-600 shadow-inner" />
                                </div>
                                
                                {/* The Leather Chair */}
                                <motion.div 
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ repeat: Infinity, duration: 3, delay: col * 0.3 }}
                                    className="w-[70%] h-[70%] rounded-t-xl bg-gradient-to-b from-red-800 to-red-950 border-2 border-red-900 shadow-[0_5px_15px_rgba(0,0,0,0.8)] relative z-0 flex flex-col items-center justify-start pt-1.5"
                                >
                                    <div className="w-[60%] h-1 bg-black/40 rounded-full" />
                                    <div className="w-[80%] h-2 bg-red-700/50 rounded-full mt-1" />
                                </motion.div>
                            </div>
                        ))}

                        {/* Player Character */}
                        <motion.div
                            initial={false}
                            animate={{
                                x: playerCol * CELL_SIZE,
                                y: playerRow * CELL_SIZE,
                                scale: gameOver ? 0 : won ? [1, 1.2, 0] : 1,
                                rotate: gameOver ? 180 : 0
                            }}
                            transition={{ 
                                default: { type: "spring", stiffness: 400, damping: 25 },
                                scale: { type: "tween", duration: 0.5 }
                            }}
                            className={`absolute z-30 flex items-center justify-center ${isInvincible ? 'opacity-50' : ''}`}
                            style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        >
                            <div className="w-[80%] h-[80%] relative drop-shadow-[0_4px_10px_rgba(0,255,65,0.5)]">
                                <img src={playerAvatar} alt="Player" className="w-full h-full object-contain pixelated" />
                                {isInvincible && (
                                    <div className="absolute inset-0 border-2 border-cyan-400 rounded shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-ping" />
                                )}
                            </div>
                        </motion.div>

                        {/* Enemies (Security Drones) */}
                        {enemies.map((enemy) => (
                            <motion.div
                                key={enemy.id}
                                initial={false}
                                animate={{
                                    x: enemy.col * CELL_SIZE,
                                    y: enemy.row * CELL_SIZE,
                                }}
                                transition={{ type: "tween", ease: "linear", duration: Math.max(0.15, 0.4 - (score * 0.03)) * (enemy.speedMod || 1) }}
                                className="absolute z-20 flex items-center justify-center"
                                style={{ width: CELL_SIZE, height: CELL_SIZE }}
                            >
                                {/* Glowing Laser Drone */}
                                <div className="relative w-[60%] h-[60%] rounded-full bg-red-600 shadow-[0_0_20px_rgba(239,68,68,1)] flex items-center justify-center">
                                    <div className="w-[40%] h-[40%] bg-white rounded-full animate-pulse" />
                                    {/* Scan cone */}
                                    <motion.div 
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ repeat: Infinity, duration: 4 * (enemy.speedMod || 1), ease: "linear" }}
                                        className="absolute w-[200%] h-[200%] border-t-4 border-red-500/30 rounded-full opacity-50"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Result Display Overlay */}
                    <AnimatePresence>
                        {(gameOver || won) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 rounded-[24px] backdrop-blur-sm"
                            >
                                <div className={`font-black text-2xl uppercase tracking-widest text-center ${
                                    won ? 'text-[#00FF41] drop-shadow-[0_0_15px_rgba(0,255,65,0.8)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                                }`}>
                                    {won ? 'AT THE TABLE!' : 'SYSTEM ALARM!'}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Arcade D-Pad Controls */}
                <div className="mt-6 flex flex-col items-center gap-2 mb-2 relative z-20">
                    <button
                        onClick={moveUp}
                        disabled={gameOver || won}
                        className="w-14 h-14 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-xl border-b-4 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center hover:brightness-125 disabled:opacity-50"
                    >
                        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={moveLeft}
                            disabled={gameOver || won}
                            className="w-14 h-14 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-xl border-b-4 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center hover:brightness-125 disabled:opacity-50"
                        >
                            <div className="w-0 h-0 border-y-[10px] border-y-transparent border-r-[14px] border-r-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                        </button>
                        <button
                            onClick={moveDown}
                            disabled={gameOver || won}
                            className="w-14 h-14 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-xl border-b-4 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center hover:brightness-125 disabled:opacity-50"
                        >
                            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                        </button>
                        <button
                            onClick={moveRight}
                            disabled={gameOver || won}
                            className="w-14 h-14 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-xl border-b-4 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center hover:brightness-125 disabled:opacity-50"
                        >
                            <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[14px] border-l-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Score */}
            <div className="mt-8 relative z-10 bg-black/80 px-6 py-2 rounded-full border border-zinc-800">
                <div className="text-xs text-zinc-400 uppercase font-black tracking-widest">
                    Round <span className="text-white">{score + 1}</span> of <span className="text-white">{targetScore}</span>
                </div>
            </div>
        </div>
    );
}
