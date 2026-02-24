'use client';

import React, { useState, useEffect } from 'react';

export default function NextGameCountdown() {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    const [targetDate, setTargetDate] = useState<Date | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        fetch('/api/admin/countdown')
            .then(res => res.json())
            .then(data => {
                if (data.targetDate) {
                    setTargetDate(new Date(data.targetDate));
                }
            })
            .catch(console.error);
    }, [isMounted]);

    useEffect(() => {
        if (!targetDate) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <section className="relative w-full overflow-hidden rounded-3xl border border-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.1)] py-20 px-4 bg-[#111]">
            {/* Background styling */}
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ept-red-dark/10 via-charcoal-dark to-[#0a0a0a]" />

            {/* Decorative Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent" />

            {/* Content */}
            <div className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center">
                <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-gold/50 bg-gold/5 backdrop-blur-sm mb-10 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                    <span className="w-3 h-3 rounded-full bg-ept-red animate-pulse shadow-[0_0_10px_rgba(255,7,58,0.8)]" />
                    <span className="text-gold font-bold uppercase tracking-[0.2em] text-sm md:text-base">Next Game Countdown</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black mb-16 uppercase tracking-widest drop-shadow-[0_0_20px_rgba(212,175,55,0.4)] bg-gradient-to-r from-[#cfb53b] via-white to-[#cfb53b] bg-clip-text text-transparent" style={{ fontFamily: 'serif' }}>
                    The E.P.T. Ledger of Legends
                </h1>

                {/* The Clock Grid */}
                <div className="flex flex-wrap justify-center gap-6 md:gap-12 w-full">
                    {/* Days */}
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-28 md:w-36 md:h-44 bg-gradient-to-b from-gray-900 to-black rounded-2xl flex items-center justify-center border-t-2 border-l-2 border-gray-700/50 border-r border-b border-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-1/2 pointer-events-none" />
                            <span className="text-6xl md:text-8xl font-black text-[#ffd700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] font-mono tabular-nums tracking-tighter transition-all">
                                {isMounted ? timeLeft.days.toString().padStart(2, '0') : '00'}
                            </span>
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/50" />
                        </div>
                        <span className="mt-4 text-gray-400 font-bold uppercase tracking-[0.3em] text-sm md:text-base">Days</span>
                    </div>

                    {/* Separator */}
                    <div className="hidden md:flex flex-col justify-center items-center pb-8 pt-4">
                        <span className="text-4xl md:text-6xl text-gray-700 font-black animate-pulse">:</span>
                    </div>

                    {/* Hours */}
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-28 md:w-36 md:h-44 bg-gradient-to-b from-gray-900 to-black rounded-2xl flex items-center justify-center border-t-2 border-l-2 border-gray-700/50 border-r border-b border-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-1/2 pointer-events-none" />
                            <span className="text-6xl md:text-8xl font-black text-white drop-shadow-lg font-mono tabular-nums tracking-tighter">
                                {isMounted ? timeLeft.hours.toString().padStart(2, '0') : '00'}
                            </span>
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/50" />
                        </div>
                        <span className="mt-4 text-gray-400 font-bold uppercase tracking-[0.3em] text-sm md:text-base">Hours</span>
                    </div>

                    {/* Separator */}
                    <div className="hidden md:flex flex-col justify-center items-center pb-8 pt-4">
                        <span className="text-4xl md:text-6xl text-gray-700 font-black animate-pulse">:</span>
                    </div>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-28 md:w-36 md:h-44 bg-gradient-to-b from-gray-900 to-black rounded-2xl flex items-center justify-center border-t-2 border-l-2 border-gray-700/50 border-r border-b border-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-1/2 pointer-events-none" />
                            <span className="text-6xl md:text-8xl font-black text-white drop-shadow-lg font-mono tabular-nums tracking-tighter">
                                {isMounted ? timeLeft.minutes.toString().padStart(2, '0') : '00'}
                            </span>
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/50" />
                        </div>
                        <span className="mt-4 text-gray-400 font-bold uppercase tracking-[0.3em] text-sm md:text-base">Mins</span>
                    </div>

                    {/* Separator */}
                    <div className="hidden md:flex flex-col justify-center items-center pb-8 pt-4">
                        <span className="text-4xl md:text-6xl text-gray-700 font-black animate-pulse">:</span>
                    </div>

                    {/* Seconds */}
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-28 md:w-36 md:h-44 bg-gradient-to-b from-gray-900 to-black rounded-2xl flex items-center justify-center border-t-2 border-l-2 border-gray-700/50 border-r border-b border-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent h-1/2 pointer-events-none" />
                            <span className="text-6xl md:text-8xl font-black text-ept-red drop-shadow-[0_0_15px_rgba(230,57,70,0.6)] font-mono tabular-nums tracking-tighter">
                                {isMounted ? timeLeft.seconds.toString().padStart(2, '0') : '00'}
                            </span>
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/50" />
                        </div>
                        <span className="mt-4 text-gray-400 font-bold uppercase tracking-[0.3em] text-sm md:text-base text-ept-red">Secs</span>
                    </div>
                </div>

            </div>
        </section>
    );
}
