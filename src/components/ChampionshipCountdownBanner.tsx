'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Flame, ArrowRight, Trophy, Tv, Coins } from 'lucide-react';
import { getAvatarFilename } from '@/lib/avatars';

interface Contender {
    name: string;
    points: number;
    rank: number;
}

interface Props {
    totalPot?: number;
    topContenders?: Contender[];
    gamesPlayed?: number;
    gamesRemaining?: number;
}

export default function ChampionshipCountdownBanner({ 
    totalPot = 0, 
    topContenders = [],
    gamesPlayed = 7,
    gamesRemaining = 2
}: Props) {
    return (
        <div className="relative overflow-hidden rounded-3xl border-2 border-gold/50 bg-black shadow-[0_0_60px_rgba(212,175,55,0.25)] group">
            {/* Background championship image with atmospheric overlay */}
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity group-hover:scale-105 group-hover:opacity-40 transition-all duration-700 pointer-events-none"
                style={{ backgroundImage: `url('/images/final/championship_trophy.jpg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/75 pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 p-5 sm:p-7 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                
                {/* Left: Headline & Hype text */}
                <div className="space-y-3 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-ept-red text-[11px] font-black uppercase tracking-widest animate-pulse">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>
                            {gamesRemaining > 1
                                ? `Round ${gamesPlayed} of 9 Complete • ${gamesRemaining} Games Left`
                                : gamesRemaining === 1
                                ? `Round ${gamesPlayed} of 9 Complete • 1 Final Game Left!`
                                : `Regular Season Complete • Table Locked!`}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-ept-red" />
                        <span className="text-gold font-mono">December Grand Final</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase text-white tracking-tight italic flex items-center gap-3">
                        <span>The Road to the 2026 Crown</span>
                        <Crown className="w-8 h-8 text-gold fill-gold/20 inline-block drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]" />
                    </h2>

                    <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                        The regular season points race is nearing the finish line. Explore the qualification scenarios, award superlatives, Vegas odds, and community championship predictions.
                    </p>

                    {/* Top Contenders 8-bit Avatar Lineup */}
                    {topContenders.length > 0 && (
                        <div className="pt-2 flex items-center gap-3 flex-wrap">
                            <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 tracking-wider">
                                Title Race Leaders:
                            </span>
                            <div className="flex items-center -space-x-2 sm:space-x-2">
                                {topContenders.slice(0, 4).map((c) => (
                                    <div 
                                        key={c.name}
                                        className="flex items-center gap-1.5 bg-black/80 border border-gold/40 px-2 py-1 rounded-xl shadow-md"
                                        title={`${c.name} (#${c.rank} • ${c.points} pts)`}
                                    >
                                        <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-gold/60 bg-zinc-900 shrink-0">
                                            <img 
                                                src={getAvatarFilename(c.name)} 
                                                alt={c.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                            <span className="absolute bottom-0 right-0 bg-gold text-black text-[8px] font-black px-1 leading-none rounded-tl">
                                                #{c.rank}
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold text-white uppercase hidden sm:inline truncate max-w-[80px]">
                                            {c.name.split(' ')[0]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Pot & Navigation Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto shrink-0">
                    {totalPot > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-black/80 border border-gold/40 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                            <div className="p-2.5 bg-gold/15 rounded-xl text-gold border border-gold/30">
                                <Coins className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest block">Season Vault</span>
                                <span className="text-xl font-black text-gold font-mono tracking-tight">£{totalPot}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                            href="/final"
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-gold via-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all transform hover:scale-[1.03]"
                        >
                            <Trophy className="w-4 h-4 fill-black" />
                            <span>Championship Hub</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <Link
                            href="/presentation"
                            title="TV Presentation Mode for Game Night"
                            className="flex items-center justify-center p-3.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/20 rounded-xl transition-all hover:scale-105"
                        >
                            <Tv className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
