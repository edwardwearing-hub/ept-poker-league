'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Flame, ArrowRight, Trophy, Tv, Sparkles, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    totalPot?: number;
}

export default function ChampionshipCountdownBanner({ totalPot = 0 }: Props) {
    return (
        <div className="relative overflow-hidden rounded-2xl border-2 border-gold/40 bg-gradient-to-r from-black via-zinc-950 to-black p-4 sm:p-6 shadow-[0_0_50px_rgba(212,175,55,0.15)] group">
            {/* Background animated shine */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
                
                {/* Left: Hype Headline */}
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-ept-red text-[10px] font-black uppercase tracking-widest animate-pulse">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>2 Regular Season Games Left</span>
                        <span className="w-1 h-1 rounded-full bg-ept-red" />
                        <span className="text-gold font-mono">December Grand Final</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase text-white tracking-tight italic flex items-center gap-2">
                        <span>The Road to the 2026 Crown</span>
                        <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-gold fill-gold/20 inline-block drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]" />
                    </h2>

                    <p className="text-zinc-400 text-xs sm:text-sm max-w-xl leading-relaxed">
                        Points are locked in. The bubble is heating up. Check the qualification scenarios, cast your champion predictions, and view the end-of-season awards.
                    </p>
                </div>

                {/* Right: Pot & Navigation Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0">
                    {totalPot > 0 && (
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-black/60 border border-gold/30 rounded-xl">
                            <div className="p-2 bg-gold/10 rounded-lg text-gold">
                                <Coins className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Season Vault</span>
                                <span className="text-lg font-black text-gold font-mono">£{totalPot}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                            href="/final"
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-gold via-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all transform hover:scale-[1.02]"
                        >
                            <Trophy className="w-4 h-4 fill-black" />
                            <span>Championship Hub</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <Link
                            href="/presentation"
                            title="TV Presentation Mode for Game Night"
                            className="flex items-center justify-center p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-colors"
                        >
                            <Tv className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
