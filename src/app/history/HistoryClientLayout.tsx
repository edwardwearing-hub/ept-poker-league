'use client';

import React, { useState } from 'react';
import { GameHistorySession } from '@/lib/data';
import { ChevronDown, Trophy, Users, Coins, Skull } from 'lucide-react';
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
            <div className="absolute left-3.5 sm:left-6 md:left-12 top-8 bottom-8 w-[2px] bg-gradient-to-b from-gold/50 via-ept-red/20 to-transparent z-0" />

            {reversedSessions.map((session, index) => {
                const isExpanded = expandedCard === session.date;
                const playerCount = session.results.length;

                // Sort results by actual finishing position (fallback to points)
                const getPos = (r: { place: string }) => {
                    const p = parseInt(r.place, 10);
                    return !isNaN(p) && p > 0 ? p : 99;
                };
                const sortedResults = [...session.results].sort(
                    (a, b) => getPos(a) - getPos(b) || b.points - a.points
                );
                const winner = sortedResults.find(r => getPos(r) === 1) || sortedResults[0] || null;
                const paidResults = session.results.filter(r => r.winnings > 0);
                const lastPaidPos = paidResults.length > 0 ? Math.max(...paidResults.map(r => getPos(r))) : 3;
                const bubblePos = lastPaidPos + 1;
                const bubblePlayer = sortedResults.find(r => getPos(r) === bubblePos && r.winnings === 0);
                const sessionKOs = session.results.reduce((s, r) => s + (r.kos || 0), 0);

                // Dynamic banner message at the bottom of the card
                const statBanner = winner && winner.winnings > 0
                    ? `${winner.name} took home £${winner.winnings} on ${session.date}!${bubblePlayer ? ` (${bubblePlayer.name} finished on the ${bubblePos === 3 ? '3rd' : '4th'}-place Bubble 🫧)` : ''}`
                    : winner
                        ? `${winner.name} secured the win with ${winner.points} pts!`
                        : "A quiet night on the felt.";

                return (
                    <motion.div
                        key={session.date}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative z-10 pl-8 sm:pl-16 md:pl-28 pr-0"
                    >
                        {/* Timeline Node */}
                        <div className="absolute left-1.5 sm:left-4 md:left-[2.6rem] top-6 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#1c1c1c] border-2 border-gold shadow-[0_0_10px_rgba(212,175,55,0.5)] z-20 flex items-center justify-center">
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
                            <div className="p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                <div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-black italic uppercase tracking-widest text-white flex items-center gap-2 sm:gap-3">
                                        {session.date}
                                        {index === 0 && (
                                            <span className="bg-ept-red/20 text-ept-red text-[9px] sm:text-[10px] px-2 py-0.5 rounded border border-ept-red/30 tracking-widest uppercase">
                                                Latest
                                            </span>
                                        )}
                                    </h2>
                                    <div className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-widest mt-1.5 sm:mt-2 flex items-center gap-3 sm:gap-4 flex-wrap">
                                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {playerCount} Players</span>
                                        <span className="flex items-center gap-1 text-ept-red"><Skull className="w-3.5 h-3.5" /> {sessionKOs} KOs</span>
                                        <span className="text-emerald-400/80 font-mono text-[11px]">Top {lastPaidPos} Paid</span>
                                        {winner && (
                                            <span className="flex items-center gap-1 text-gold/80"><Trophy className="w-3.5 h-3.5" /> {winner.name}</span>
                                        )}
                                        {bubblePlayer && (
                                            <span className="text-purple-300 text-[11px] font-mono">
                                                🫧 Bubble ({bubblePos === 3 ? '3rd' : '4th'}): {bubblePlayer.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                                    <div className="text-left sm:text-right">
                                        <div className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Prize Pot</div>
                                        <div className="text-xl sm:text-2xl font-black font-mono text-white">£{session.prizePot}</div>
                                    </div>
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition shrink-0">
                                        <ChevronDown className={clsx("w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 transition-transform duration-300", isExpanded && "rotate-180 text-gold")} />
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
                                        <div className="px-3 sm:px-6 py-3 sm:py-4">
                                            {/* Table Headers */}
                                            <div className="grid grid-cols-5 md:grid-cols-12 gap-2 sm:gap-4 pb-2 sm:pb-3 border-b border-white/10 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                                <div className="col-span-1 text-center">Pos</div>
                                                <div className="col-span-2 md:col-span-4">Player</div>
                                                <div className="col-span-1 md:col-span-2 text-center">KOs</div>
                                                <div className="col-span-1 md:col-span-2 text-center">Points</div>
                                                <div className="hidden md:block col-span-3 text-right">Winnings</div>
                                            </div>

                                            {/* Table Rows */}
                                            <div className="py-2 space-y-1">
                                                {sortedResults.map((player, idx) => {
                                                    const pos = getPos(player) !== 99 ? getPos(player) : idx + 1;
                                                    const isWinner = pos === 1;
                                                    const isBubble = pos === bubblePos && player.winnings === 0;
                                                    return (
                                                        <div key={idx} className={clsx(
                                                            "grid grid-cols-5 md:grid-cols-12 gap-2 sm:gap-4 py-2 sm:py-3 items-center rounded-lg px-1.5 sm:px-2 transition-colors text-xs sm:text-sm",
                                                            isWinner
                                                                ? "bg-gold/10 border border-gold/20"
                                                                : isBubble
                                                                ? "bg-purple-950/25 border border-purple-500/30"
                                                                : "hover:bg-white/5 border border-transparent"
                                                        )}>
                                                            <div className={clsx(
                                                                "col-span-1 font-black font-mono text-center text-xs sm:text-sm",
                                                                isWinner ? "text-gold" : isBubble ? "text-purple-300" : "text-white"
                                                            )}>
                                                                #{pos}
                                                            </div>
                                                            <div className="col-span-2 md:col-span-4 font-bold uppercase tracking-widest flex items-center gap-1.5 min-w-0">
                                                                {isWinner && <Trophy className="w-3 h-3 text-gold shrink-0" />}
                                                                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                                                    <span className={clsx("truncate block", isWinner ? "text-white" : "text-zinc-300")}>
                                                                        {player.name}
                                                                    </span>
                                                                    {isBubble && (
                                                                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[9px] font-mono font-bold uppercase">
                                                                            🫧 Bubble
                                                                        </span>
                                                                    )}
                                                                    {player.winnings > 0 && (
                                                                        <span className="md:hidden text-[9px] text-green-400 font-mono font-bold block">+£{player.winnings}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="col-span-1 md:col-span-2 font-mono text-center text-ept-red font-bold text-xs sm:text-sm">
                                                                {player.kos !== undefined && player.kos > 0 ? `${player.kos} ☠️` : '-'}
                                                            </div>
                                                            <div className="col-span-1 md:col-span-2 font-mono text-center text-gold font-bold text-xs sm:text-sm">
                                                                {player.points}
                                                            </div>
                                                            <div className={clsx(
                                                                "hidden md:block col-span-3 font-mono text-right font-black",
                                                                player.winnings > 0 ? "text-green-400" : isBubble ? "text-purple-300" : "text-zinc-600"
                                                            )}>
                                                                {player.winnings > 0 ? `+£${player.winnings}` : isBubble ? '£0 (Bubble)' : '-'}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Dynamic "Stat of the Night" Footer Banner */}
                                        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-ept-red/20 to-transparent border-t border-ept-red/30 flex items-center gap-2 sm:gap-3">
                                            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-gold shrink-0" />
                                            <span className="text-xs sm:text-sm font-bold tracking-wide text-zinc-200 uppercase line-clamp-1">
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
