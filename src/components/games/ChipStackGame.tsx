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
    colorClass: string;
}

// Progressive chip values (White -> Red -> Blue -> Green -> Black -> Purple -> Yellow -> Orange -> Pink -> Gold)
// Progressive chip values (White -> Red -> Blue -> Green -> Black -> Purple -> Yellow -> Orange -> Pink -> Gold)
const CHIP_STYLES = [
    { face: 'from-gray-100 to-gray-300', edge: 'bg-gray-400' }, // White
    { face: 'from-red-500 to-red-600', edge: 'bg-red-800' },    // Red
    { face: 'from-blue-500 to-blue-600', edge: 'bg-blue-800' }, // Blue
    { face: 'from-green-500 to-green-600', edge: 'bg-green-800' },// Green
    { face: 'from-zinc-700 to-zinc-900', edge: 'bg-black' },    // Black
    { face: 'from-purple-500 to-purple-600', edge: 'bg-purple-900' }, // Purple
    { face: 'from-yellow-400 to-yellow-500', edge: 'bg-yellow-700' }, // Yellow
    { face: 'from-orange-400 to-orange-500', edge: 'bg-orange-700' }, // Orange
    { face: 'from-pink-400 to-pink-500', edge: 'bg-pink-700' }, // Pink
    { face: 'from-yellow-200 to-yellow-500', edge: 'bg-amber-700' }, // Gold
];

const getChipClass = (index: number) => {
    return CHIP_STYLES[Math.min(index, CHIP_STYLES.length - 1)];
};

export default function ChipStackGame({ onWin, onFail }: Props) {
    const [chips, setChips] = useState<Chip[]>([]);
    const [currentChipX, setCurrentChipX] = useState(50);
    const [direction, setDirection] = useState(1);
    const [dropping, setDropping] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [speed, setSpeed] = useState(1.5);
    const [wobbleTrigger, setWobbleTrigger] = useState(0);
    const animRef = useRef<number>(0);
    const TARGET_CHIPS = 10;
    const TOLERANCE = 25; // % tolerance for centering

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
            colorClass: getChipClass(chips.length) as any, // Bypass TS since we changed the shape
        };

        setTimeout(() => {
            if (isCentered) {
                const newChips = [...chips, newChip];
                setChips(newChips);
                setDropping(false);
                setWobbleTrigger(prev => prev + 1); // Trigger the wobble
                
                // Increase difficulty (speed)
                setSpeed(1.5 + newChips.length * 0.15);

                if (newChips.length >= TARGET_CHIPS) {
                    setGameOver(true);
                    setTimeout(() => onWin(), 1000);
                }
            } else {
                // Stack topples!
                setGameOver(true);
                setTimeout(() => onFail(), 1200);
            }
        }, 500);
    }, [dropping, gameOver, currentChipX, chips, onWin, onFail]);

    // Helper to render a pseudo-3D poker chip
    const renderPokerChip = (style: any, isFlat = false) => (
        <div className="relative w-16 h-[32px] sm:w-[72px] sm:h-[36px]">
            {/* Shadow for dropping/moving chips */}
            {isFlat && <div className="absolute -bottom-4 left-2 right-2 h-4 bg-black/60 blur-md rounded-[100%]" />}

            {/* Edge (Thickness) - The vertical wall */}
            <div className={`absolute top-[16px] sm:top-[18px] left-0 right-0 h-[10px] sm:h-[12px] ${style.edge} overflow-hidden`}>
                <div className="absolute inset-0 opacity-40" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 15%, #fff 15%, #fff 25%)' }} />
            </div>

            {/* Edge (Thickness) - The bottom curve */}
            <div className={`absolute top-[10px] sm:top-[12px] left-0 right-0 h-[32px] sm:h-[36px] rounded-[100%] ${style.edge} overflow-hidden shadow-[inset_0_-5px_15px_rgba(0,0,0,0.6)]`}>
                <div className="absolute inset-0 opacity-40" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 15%, #fff 15%, #fff 25%)' }} />
            </div>
            
            {/* Top Face */}
            <div className={`absolute top-0 left-0 right-0 h-[32px] sm:h-[36px] rounded-[100%] bg-gradient-to-br ${style.face} flex items-center justify-center border-t border-white/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.4)] overflow-hidden`}>
                {/* Top Stripes */}
                <div className="absolute inset-0 opacity-40"
                    style={{
                        background: 'conic-gradient(from 0deg, transparent 0 20deg, #fff 20deg 40deg, transparent 40deg 80deg, #fff 80deg 100deg, transparent 100deg 140deg, #fff 140deg 160deg, transparent 160deg 200deg, #fff 200deg 220deg, transparent 220deg 260deg, #fff 260deg 280deg, transparent 280deg 320deg, #fff 320deg 340deg, transparent 340deg 360deg)'
                    }}
                />
                {/* Inner Ring */}
                <div className="w-[50%] h-[50%] rounded-[100%] border border-white/40 border-dashed bg-black/10 backdrop-blur-[1px]" />
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col items-center justify-between px-4 py-6 relative overflow-hidden gap-6 min-h-[600px]">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/poker_chips_stacks_background_1777823828761.png" 
                    alt="Poker Chips" 
                    className="w-full h-full object-cover opacity-50 scale-110 blur-[2px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/90" />
            </div>

            {/* Title */}
            <div className="text-center relative z-10 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 shadow-2xl">
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter drop-shadow-md">Stack {TARGET_CHIPS} Chips</h3>
                <p className="text-gold text-[10px] sm:text-xs uppercase font-black tracking-widest animate-pulse">
                    Tap to drop — Keep it steady!
                </p>
            </div>

            {/* Game Area */}
            <div className="relative w-full max-w-sm flex-1 min-h-[400px] bg-zinc-950/80 backdrop-blur-sm border-2 border-zinc-800/80 rounded-2xl overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.9),0_20px_50px_rgba(0,0,0,0.5)] z-10">
                
                {/* Center Guide Beam */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-12 bg-gradient-to-b from-gold/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 border-l border-r border-dashed border-gold/20"
                    style={{ width: `${TOLERANCE * 2}%`, marginLeft: `-${TOLERANCE}%` }}
                />

                {/* Moving Chip (pre-drop) */}
                {!dropping && !gameOver && (
                    <motion.div
                        className="absolute -translate-x-1/2 z-40"
                        style={{ left: `${currentChipX}%`, top: '4%' }}
                    >
                        {renderPokerChip(getChipClass(chips.length), true)}
                    </motion.div>
                )}

                {/* Dropping Chip Animation */}
                {dropping && (
                    <motion.div
                        initial={{ y: -300 }}
                        animate={{ y: 0 }} 
                        transition={{ duration: 0.35, ease: "easeIn" }}
                        className="absolute -translate-x-1/2 z-30"
                        style={{ 
                            left: `${currentChipX}%`,
                            bottom: `calc(10% + ${chips.length * 12}px)`
                        }}
                    >
                        {renderPokerChip(getChipClass(chips.length), true)}
                    </motion.div>
                )}

                {/* Stacked Chips with Stack Wobble Effect */}
                <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    animate={wobbleTrigger > 0 && !gameOver ? { x: [0, -6, 6, -3, 3, 0] } : {}}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    {chips.map((chip, i) => (
                        <motion.div
                            key={chip.id}
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: gameOver && !chip.landed ? 0 : 1,
                                x: gameOver && Math.abs(chip.x - 50) > TOLERANCE ? (Math.random() > 0.5 ? 100 : -100) : 0,
                                y: gameOver && Math.abs(chip.x - 50) > TOLERANCE ? 200 : 0,
                                rotate: gameOver && Math.abs(chip.x - 50) > TOLERANCE ? (Math.random() > 0.5 ? 45 : -45) : 0,
                            }}
                            transition={{ duration: gameOver ? 0.8 : 0 }}
                            className="absolute -translate-x-1/2"
                            style={{
                                left: `${chip.x}%`,
                                bottom: `calc(10% + ${i * 12}px)`,
                                zIndex: i
                            }}
                        >
                            {renderPokerChip(chip.colorClass, false)}
                        </motion.div>
                    ))}
                </motion.div>

                {/* Table/Surface */}
                <div className="absolute bottom-0 left-0 right-0 h-[12%] bg-gradient-to-t from-emerald-900/60 to-emerald-900/20 border-t border-emerald-500/30 backdrop-blur-md z-0" />
            </div>

            {/* Counter and Drop Button */}
            <div className="w-full flex flex-col items-center gap-4 relative z-10 pb-4">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 px-8 py-2 rounded-full shadow-xl">
                    <div className="text-zinc-400 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-3">
                        <span>CHIPS STACKED</span>
                        <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
                        <span className="text-white text-base">{chips.length} <span className="text-zinc-600 text-[10px]">/ {TARGET_CHIPS}</span></span>
                    </div>
                </div>
                
                <button
                    onClick={handleDrop}
                    disabled={dropping || gameOver}
                    className="w-full max-w-sm bg-gradient-to-b from-gold to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:from-zinc-800 disabled:to-zinc-900 disabled:text-zinc-600 text-black font-black text-2xl sm:text-3xl py-6 uppercase border-b-8 border-yellow-800 active:border-b-0 active:mt-2 transition-all disabled:border-zinc-900 rounded-xl shadow-[0_15px_40px_rgba(212,175,55,0.3)]"
                >
                    {gameOver ? (chips.length >= TARGET_CHIPS ? '🎉 PAYOUT!' : '💀 TOPPLED') : 'DROP CHIP!'}
                </button>
            </div>
        </div>
    );
}
