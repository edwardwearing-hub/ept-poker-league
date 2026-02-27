'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onWin: () => void;
    onFail: () => void;
    targetScore: number;
}

interface Chip {
    id: number;
    x: number;    // horizontal position (% from left)
    landed: boolean;
    color: string;
}

const CHIP_COLORS = [
    'bg-red-500 border-red-700',
    'bg-blue-500 border-blue-700',
    'bg-green-500 border-green-700',
    'bg-yellow-400 border-yellow-600',
    'bg-purple-500 border-purple-700',
];

export default function ChipStackGame({ onWin, onFail }: Props) {
    const [chips, setChips] = useState<Chip[]>([]);
    const [currentChipX, setCurrentChipX] = useState(50);
    const [direction, setDirection] = useState(1);
    const [dropping, setDropping] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [speed, setSpeed] = useState(1.5);
    const animRef = useRef<number>(0);
    const TARGET_CHIPS = 10;
    const TOLERANCE = 18; // % tolerance for centering

    // Oscillate the current chip back and forth
    useEffect(() => {
        if (dropping || gameOver) return;

        const animate = () => {
            setCurrentChipX(prev => {
                let newX = prev + direction * speed;
                if (newX >= 90) {
                    setDirection(-1);
                    newX = 90;
                } else if (newX <= 10) {
                    setDirection(1);
                    newX = 10;
                }
                return newX;
            });
            animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [dropping, gameOver, direction, speed]);

    const handleDrop = useCallback(() => {
        if (dropping || gameOver) return;
        setDropping(true);

        const landedX = currentChipX;
        const isCentered = Math.abs(landedX - 50) <= TOLERANCE;

        const newChip: Chip = {
            id: chips.length,
            x: landedX,
            landed: true,
            color: CHIP_COLORS[chips.length % CHIP_COLORS.length],
        };

        setTimeout(() => {
            if (isCentered) {
                const newChips = [...chips, newChip];
                setChips(newChips);
                setDropping(false);
                // Increase difficulty
                setSpeed(1.5 + newChips.length * 0.2);

                if (newChips.length >= TARGET_CHIPS) {
                    setGameOver(true);
                    setTimeout(() => onWin(), 800);
                }
            } else {
                // Stack topples!
                setGameOver(true);
                setTimeout(() => onFail(), 1200);
            }
        }, 600);
    }, [dropping, gameOver, currentChipX, chips, onWin, onFail]);

    return (
        <div className="flex-1 flex flex-col items-center justify-between px-4 py-4">
            {/* Title */}
            <div className="text-center mb-2">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tighter">Stack 10 Chips</h3>
                <p className="text-zinc-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest">
                    Tap to drop — keep it centered!
                </p>
            </div>

            {/* Game Area */}
            <div className="relative w-full max-w-xs flex-1 min-h-0 bg-zinc-950/50 border-2 border-zinc-800 rounded-lg overflow-hidden">
                {/* Center Guide Lines */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-zinc-800 opacity-50" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 border-l-2 border-r-2 border-dashed border-green-900/30"
                    style={{ width: `${TOLERANCE * 2}%`, marginLeft: `-${TOLERANCE}%` }}
                />

                {/* Moving Chip (pre-drop) */}
                {!dropping && !gameOver && (
                    <div
                        className={`absolute top-4 w-16 h-5 sm:w-20 sm:h-6 rounded-full border-b-4 ${CHIP_COLORS[chips.length % CHIP_COLORS.length]} shadow-lg -translate-x-1/2 z-20`}
                        style={{ left: `${currentChipX}%` }}
                    />
                )}

                {/* Dropping Chip Animation */}
                {dropping && (
                    <motion.div
                        initial={{ top: 16, left: `${currentChipX}%` }}
                        animate={{ top: `${85 - chips.length * 6}%` }}
                        transition={{ duration: 0.5, type: 'spring', damping: 15 }}
                        className={`absolute w-16 h-5 sm:w-20 sm:h-6 rounded-full border-b-4 ${CHIP_COLORS[chips.length % CHIP_COLORS.length]} shadow-lg -translate-x-1/2 z-20`}
                        style={{ left: `${currentChipX}%` }}
                    />
                )}

                {/* Stacked Chips */}
                {chips.map((chip, i) => (
                    <motion.div
                        key={chip.id}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: gameOver && !chip.landed ? 0 : 1,
                            rotate: gameOver && Math.abs(chip.x - 50) > TOLERANCE ? (Math.random() > 0.5 ? 45 : -45) : 0,
                            x: gameOver && Math.abs(chip.x - 50) > TOLERANCE ? (Math.random() > 0.5 ? 80 : -80) : 0,
                        }}
                        className={`absolute w-16 h-5 sm:w-20 sm:h-6 rounded-full border-b-4 ${chip.color} shadow-md -translate-x-1/2`}
                        style={{
                            left: `${chip.x}%`,
                            bottom: `${10 + i * 6}%`,
                        }}
                    />
                ))}

                {/* Table/Surface */}
                <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-gradient-to-t from-zinc-800 to-zinc-900 border-t-2 border-zinc-700" />
            </div>

            {/* Counter */}
            <div className="text-center my-2">
                <span className="text-zinc-400 text-xs font-bold">{chips.length} / {TARGET_CHIPS}</span>
            </div>

            {/* Drop Button */}
            <button
                onClick={handleDrop}
                disabled={dropping || gameOver}
                className="w-full max-w-xs bg-gold hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black text-xl sm:text-2xl py-5 sm:py-6 uppercase border-b-8 border-yellow-700 active:border-b-0 active:mt-2 transition-all disabled:border-zinc-900 rounded-lg"
            >
                {gameOver ? (chips.length >= TARGET_CHIPS ? '✓ STACKED!' : '💀 TOPPLED') : 'DROP!'}
            </button>
        </div>
    );
}
