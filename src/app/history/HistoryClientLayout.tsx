'use client';

import React, { useState } from 'react';
import { GameHistorySession } from '@/lib/data';
import { ChevronDown, Trophy, Users, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function HistoryClientLayout({ initialSessions }: { initialSessions: GameHistorySession[] }) {
    // Track which card is expanded by its Date string
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    // If no data, show empty state
    if (!initialSessions || initialSessions.length === 0) {
        return (
            <div className="p-8 text-center text-zinc-500 border border-white/5 bg-white/5 rounded-2xl glass-panel">
                No game history found on the Master Spreadsheet. E.P.T 2026 is waiting to begin.
            </div>
        );
    }

    // Sort chronologically (newest first, assuming the spreadsheet is left-to-right chronological, we reverse it)
    const reversedSessions = [...initialSessions].reverse();

    return (
        <div className="space-y-6 relative">
            {/* Minimal left timeline border */}
            <div className="absolute left-6 md:left-12 top-8 bottom-8 w-[2px] bg-gradient-to-b from-gold/50 via-ept-red/20 to-transparent z-0" />

            {reversedSessions.map((session, index) => {
                const isExpanded = expandedCard === session.date;
                const playerCount = session.results.length;

                // Sort results by points/winnings for the expanded view
                const sortedResults = [...session.results].sort((a, b) => b.points - a.points);
                const winner = sortedResults.length > 0 ? sortedResults[0] : null;

                // Dynamic banner message at the bottom of the card
                const statBanner = winner && winner.winnings > 0
                    ? `${winner.name} took home £${winner.winnings} on ${session.date}!`
                    : winner
                        ? `${winner.name} secured the win with ${winner.points} pts!`
                        : "A quiet night on the felt.";

                return (
                    <motion.div
                        key={session.date}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative z-10 pl-16 md:pl-28 pr-0"
                    >
                        {/* Timeline Node */}
                        <div className="absolute left-4 md:left-[2.6rem] top-6 w-5 h-5 rounded-full bg-[#1c1c1c] border-2 border-gold shadow-[0_0_10px_rgba(212,175,55,0.5)] z-20 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>

                        {/* Interactive Metric Card */}
                        <div
                            className={clsx(
                                "glass-panel rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer group",
                                isExpanded ? "border-gold shadow-[0_0_30px_rgba(212,175,55,0.15)]" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                            )}
                            onClick={() => setExpandedCard(isExpanded ? null : session.date)}
                        >
                            {/* Header (Always Visible) */}
                            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-widest text-white flex items-center gap-3">
                                        {session.date}
                                        {index === 0 && (
                                            <span className="bg-ept-red/20 text-ept-red text-[10px] px-2 py-0.5 rounded border border-ept-red/30 tracking-widest uppercase">
                                                Latest
                                            </span>
                                        )}
                                    </h2>
                                    <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-2 flex items-center gap-4">
                                        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {playerCount} Players</span>
                                        {winner && (
                                            <span className="flex items-center gap-1 text-gold/80"><Trophy className="w-4 h-4" /> {winner.name}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Prize Pot</div>
                                        <div className="text-2xl font-black font-mono text-white">£{session.prizePot}</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition">
                                        <ChevronDown className={clsx("w-5 h-5 text-zinc-400 transition-transform duration-300", isExpanded && "rotate-180 text-gold")} />
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content (Leaderboard) */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-t border-white/5 bg-black/40"
                                    >
                                        <div className="px-6 py-4">
                                            {/* Table Headers */}
                                            <div className="grid grid-cols-5 md:grid-cols-12 gap-4 pb-3 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                                <div className="col-span-1 text-center">Rnk</div>
                                                <div className="col-span-2 md:col-span-4">Player</div>
                                                <div className="col-span-1 md:col-span-2 text-center">KOs</div>
                                                <div className="col-span-1 md:col-span-2 text-center">Points</div>
                                                <div className="hidden md:block col-span-3 text-right">Winnings</div>
                                            </div>

                                            {/* Table Rows */}
                                            <div className="py-2 space-y-1">
                                                {sortedResults.map((player, idx) => {
                                                    const isWinner = idx === 0;
                                                    return (
                                                        <div key={idx} className={clsx(
                                                            "grid grid-cols-5 md:grid-cols-12 gap-4 py-3 items-center rounded-lg px-2 transition-colors",
                                                            isWinner ? "bg-gold/10 border border-gold/20" : "hover:bg-white/5 border border-transparent"
                                                        )}>
                                                            <div className={clsx("col-span-1 font-black font-mono text-center", isWinner ? "text-gold" : "text-white")}>
                                                                #{idx + 1}
                                                            </div>
                                                            <div className="col-span-2 md:col-span-4 font-bold uppercase tracking-widest flex items-center gap-2">
                                                                {isWinner && <Trophy className="w-3 h-3 text-gold" />}
                                                                <span className={clsx("truncate", isWinner ? "text-white" : "text-zinc-300")}>{player.name}</span>
                                                            </div>
                                                            <div className="col-span-1 md:col-span-2 font-mono text-center text-zinc-400 font-bold">
                                                                {player.kos !== undefined && player.kos > 0 ? player.kos : '-'}
                                                            </div>
                                                            <div className="col-span-1 md:col-span-2 font-mono text-center text-zinc-400 font-bold">
                                                                {player.points}
                                                            </div>
                                                            <div className={clsx("hidden md:block col-span-3 font-mono text-right font-black", player.winnings > 0 ? "text-green-400" : "text-zinc-600")}>
                                                                {player.winnings > 0 ? `+£${player.winnings}` : '-'}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Dynamic "Stat of the Night" Footer Banner */}
                                        <div className="px-6 py-4 bg-gradient-to-r from-ept-red/20 to-transparent border-t border-ept-red/30 flex items-center gap-3">
                                            <Coins className="w-5 h-5 text-gold" />
                                            <span className="text-sm font-bold tracking-wide text-zinc-200 uppercase">
                                                {statBanner}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
