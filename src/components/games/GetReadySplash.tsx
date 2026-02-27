'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    gameName: string;
    onComplete: () => void;
}

export default function GetReadySplash({ gameName, onComplete }: Props) {
    const [count, setCount] = useState(3);

    useEffect(() => {
        if (count <= 0) {
            onComplete();
            return;
        }
        const timer = setTimeout(() => setCount(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [count, onComplete]);

    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black font-mono select-none overflow-hidden">
            {/* Retro Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(0,255,255,0.15) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,255,255,0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    perspective: '500px',
                    transform: 'rotateX(45deg)',
                    transformOrigin: 'center 120%'
                }}
            />

            {/* Neon Glow Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-ept-red/10 rounded-full blur-[100px]" />
            </div>

            {/* Title Image */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="relative z-10 mb-8 w-full max-w-md px-4"
            >
                <img
                    src="/images/hijack-hustle-title.png"
                    alt="The Hijack Hustle"
                    className="w-full object-contain"
                />
            </motion.div>

            {/* Game Name */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="relative z-10 mb-12 text-center"
            >
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em] mb-2">
                    Loading Mini-Game
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    {gameName}
                </h2>
            </motion.div>

            {/* Countdown */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={count}
                    initial={{ scale: 3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 300 }}
                    className="relative z-10"
                >
                    {count > 0 ? (
                        <span className="text-9xl font-black text-gold drop-shadow-[0_0_40px_rgba(250,204,21,0.8)]">
                            {count}
                        </span>
                    ) : (
                        <span className="text-6xl font-black text-green-400 uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(34,197,94,0.8)] animate-pulse">
                            GO!
                        </span>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                }}
            />
        </div>
    );
}
