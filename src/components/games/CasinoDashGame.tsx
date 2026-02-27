'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Props {
    onWin: () => void;
    onFail: () => void;
    targetScore: number;
}

const GRID_ROWS = 7;
const GRID_COLS = 5;

interface Enemy {
    row: number;
    col: number;
    direction: 1 | -1;
    speed: number; // cells per tick
}

export default function CasinoDashGame({ onWin, onFail }: Props) {
    const [playerRow, setPlayerRow] = useState(GRID_ROWS - 1);
    const [playerCol, setPlayerCol] = useState(Math.floor(GRID_COLS / 2));
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [tick, setTick] = useState(0);

    // Initialize enemies on rows 1-5 (not row 0 = exit, not row 6 = start)
    useEffect(() => {
        const initialEnemies: Enemy[] = [];
        for (let r = 1; r < GRID_ROWS - 1; r++) {
            const startCol = Math.floor(Math.random() * GRID_COLS);
            const dir = r % 2 === 0 ? 1 : -1;
            initialEnemies.push({
                row: r,
                col: startCol,
                direction: dir as 1 | -1,
                speed: 1,
            });
        }
        setEnemies(initialEnemies);
    }, []);

    // Game tick — move enemies
    useEffect(() => {
        if (gameOver || won) return;

        const interval = setInterval(() => {
            setEnemies(prev => prev.map(e => {
                let newCol = e.col + e.direction * e.speed;
                if (newCol >= GRID_COLS) {
                    newCol = GRID_COLS - 1;
                    return { ...e, col: newCol, direction: -1 as const };
                }
                if (newCol < 0) {
                    newCol = 0;
                    return { ...e, col: newCol, direction: 1 as const };
                }
                return { ...e, col: newCol };
            }));
            setTick(t => t + 1);
        }, 500);

        return () => clearInterval(interval);
    }, [gameOver, won]);

    // Collision detection
    useEffect(() => {
        if (gameOver || won) return;

        const hit = enemies.some(e => e.row === playerRow && e.col === playerCol);
        if (hit) {
            setGameOver(true);
            setTimeout(() => onFail(), 1000);
        }

        // Win condition: reach row 0
        if (playerRow === 0) {
            setWon(true);
            setTimeout(() => onWin(), 1000);
        }
    }, [playerRow, playerCol, enemies, gameOver, won, onWin, onFail]);

    const moveUp = useCallback(() => {
        if (gameOver || won) return;
        setPlayerRow(r => Math.max(0, r - 1));
    }, [gameOver, won]);

    const moveLeft = useCallback(() => {
        if (gameOver || won) return;
        setPlayerCol(c => Math.max(0, c - 1));
    }, [gameOver, won]);

    const moveRight = useCallback(() => {
        if (gameOver || won) return;
        setPlayerCol(c => Math.min(GRID_COLS - 1, c + 1));
    }, [gameOver, won]);

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
            // Horizontal swipe
            if (dx > 30) moveRight();
            else if (dx < -30) moveLeft();
        } else {
            // Vertical swipe — only up
            if (dy < -30) moveUp();
        }
        setTouchStart(null);
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Title */}
            <div className="text-center mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tighter">Reach the Exit!</h3>
                <p className="text-zinc-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest">
                    Swipe to move · Dodge the hijackers
                </p>
            </div>

            {/* Game Grid */}
            <div className="w-full max-w-xs">
                {Array.from({ length: GRID_ROWS }).map((_, row) => (
                    <div key={row} className="grid grid-cols-5 gap-1 mb-1">
                        {Array.from({ length: GRID_COLS }).map((_, col) => {
                            const isPlayer = playerRow === row && playerCol === col;
                            const isEnemy = enemies.some(e => e.row === row && e.col === col);
                            const isExit = row === 0;
                            const isStart = row === GRID_ROWS - 1;

                            return (
                                <div
                                    key={col}
                                    className={`aspect-square rounded-sm flex items-center justify-center text-xl sm:text-2xl font-black transition-all duration-200
                                        ${isExit ? 'bg-green-900/30 border border-green-700/50' :
                                            isStart ? 'bg-blue-900/30 border border-blue-700/50' :
                                                'bg-zinc-900/50 border border-zinc-800/50'}
                                        ${isPlayer && isEnemy ? 'bg-red-900/80 border-ept-red' : ''}
                                    `}
                                >
                                    {isPlayer && (
                                        <motion.span
                                            key={`p-${playerRow}-${playerCol}`}
                                            initial={{ scale: 0.5 }}
                                            animate={{ scale: gameOver ? [1, 0] : 1 }}
                                            className="drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                                        >
                                            🏃
                                        </motion.span>
                                    )}
                                    {isEnemy && !isPlayer && (
                                        <motion.span
                                            animate={{ x: [-2, 2, -2] }}
                                            transition={{ repeat: Infinity, duration: 0.5 }}
                                            className="drop-shadow-[0_0_5px_rgba(220,38,38,0.6)]"
                                        >
                                            💀
                                        </motion.span>
                                    )}
                                    {isExit && !isPlayer && !isEnemy && (
                                        <span className="text-green-500 text-sm sm:text-base">🚪</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Control Buttons */}
            <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 w-full max-w-[200px]">
                <div /> {/* empty */}
                <button
                    onClick={moveUp}
                    disabled={gameOver || won}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-white font-black text-xl py-3 rounded border-b-4 border-zinc-950 active:border-b-0 transition-all"
                >
                    ▲
                </button>
                <div /> {/* empty */}
                <button
                    onClick={moveLeft}
                    disabled={gameOver || won}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-white font-black text-xl py-3 rounded border-b-4 border-zinc-950 active:border-b-0 transition-all"
                >
                    ◄
                </button>
                <div className="flex items-center justify-center text-[8px] text-zinc-600 font-bold uppercase">
                    Move
                </div>
                <button
                    onClick={moveRight}
                    disabled={gameOver || won}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-white font-black text-xl py-3 rounded border-b-4 border-zinc-950 active:border-b-0 transition-all"
                >
                    ►
                </button>
            </div>

            {/* Result */}
            {(gameOver || won) && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mt-4 px-6 py-2 font-black text-lg uppercase ${won ? 'text-green-400' : 'text-ept-red'
                        }`}
                >
                    {won ? '🏆 ESCAPED!' : '💀 CAUGHT!'}
                </motion.div>
            )}
        </div>
    );
}
