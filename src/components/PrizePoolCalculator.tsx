'use client';

import React, { useState } from 'react';
import { Calculator, Coins, Trophy, Award, Users, RefreshCw } from 'lucide-react';

export default function PrizePoolCalculator() {
    const [players, setPlayers] = useState(8);
    const [rebuys, setRebuys] = useState(4);
    const buyIn = 10; // £10 standard E.P.T. buy-in

    const totalBuyIns = players * buyIn;
    const totalRebuys = rebuys * buyIn;
    const totalPrizePool = totalBuyIns + totalRebuys;

    // Dynamic payout breakdown
    const isTopThree = players >= 8;
    let firstPlace = 0;
    let secondPlace = 0;
    let thirdPlace = 0;

    if (isTopThree) {
        firstPlace = Math.round(totalPrizePool * 0.50);
        secondPlace = Math.round(totalPrizePool * 0.30);
        thirdPlace = Math.max(0, totalPrizePool - firstPlace - secondPlace);
    } else {
        firstPlace = Math.round(totalPrizePool * 0.70);
        secondPlace = Math.max(0, totalPrizePool - firstPlace);
        thirdPlace = 0;
    }

    return (
        <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-gold/30 shadow-[0_10px_30px_rgba(212,175,55,0.08)] relative overflow-hidden">
            {/* Background Accent Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gold/15 text-gold border border-gold/40 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                                Game Night Prize Pool Calculator
                            </h3>
                            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                                £10 Buy-In
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-400">
                            Simulate attendance and rebuys to forecast official 1st, 2nd, and 3rd place cash payouts.
                        </p>
                    </div>
                </div>

                <div className="flex items-baseline gap-2 bg-black/40 px-5 py-3 rounded-2xl border border-white/10 self-start md:self-auto">
                    <span className="text-xs uppercase font-mono font-bold text-zinc-400">Total Pool:</span>
                    <span className="text-2xl sm:text-3xl font-black text-gold font-mono tracking-tight drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                        £{totalPrizePool}
                    </span>
                </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Expected Attendance Slider */}
                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-bold text-zinc-300 flex items-center gap-2">
                            <Users size={16} className="text-cyan-400" />
                            <span>Expected Players</span>
                        </label>
                        <span className="text-lg font-black font-mono text-cyan-300 px-3 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                            {players} Players
                        </span>
                    </div>
                    <input
                        type="range"
                        min="6"
                        max="11"
                        step="1"
                        value={players}
                        onChange={(e) => setPlayers(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                        <span>6 Min</span>
                        <span>Full League (11 Max)</span>
                    </div>
                </div>

                {/* Expected Rebuys Slider */}
                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-bold text-zinc-300 flex items-center gap-2">
                            <RefreshCw size={16} className="text-rose-400" />
                            <span>Estimated Re-buys (£10 each)</span>
                        </label>
                        <span className="text-lg font-black font-mono text-rose-300 px-3 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                            {rebuys} Rebuys (£{totalRebuys})
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="15"
                        step="1"
                        value={rebuys}
                        onChange={(e) => setRebuys(Number(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                        <span>0 None</span>
                        <span>15 Action Night</span>
                    </div>
                </div>
            </div>

            {/* Payout Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* 1st Place */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-black to-black border-2 border-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.15)] flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gold px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/40 flex items-center gap-1">
                            <Trophy size={11} /> 1st Place
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-400">
                            {isTopThree ? '50%' : '70%'}
                        </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                        £{firstPlace}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">Champion Cash + 20 League Pts</div>
                </div>

                {/* 2nd Place */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-400/15 via-black to-black border border-slate-400/40 shadow-md flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 px-2.5 py-0.5 rounded-full bg-white/10 border border-slate-400/30 flex items-center gap-1">
                            <Award size={11} /> 2nd Place
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-400">
                            30%
                        </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                        £{secondPlace}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">Runner-up Cash + 14 League Pts</div>
                </div>

                {/* 3rd Place */}
                <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between transition-opacity ${
                    isTopThree
                        ? 'bg-gradient-to-br from-amber-700/15 via-black to-black border-amber-600/40 opacity-100'
                        : 'bg-black/30 border-white/5 opacity-50'
                }`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 px-2.5 py-0.5 rounded-full bg-amber-600/10 border border-amber-600/30 flex items-center gap-1">
                            <Coins size={11} /> 3rd Place
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-400">
                            {isTopThree ? '20%' : '0%'}
                        </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                        {isTopThree ? `£${thirdPlace}` : '£0'}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                        {isTopThree ? 'Podium Finish + 10 League Pts' : 'Requires 8+ players for 3 payouts'}
                    </div>
                </div>
            </div>
        </section>
    );
}
