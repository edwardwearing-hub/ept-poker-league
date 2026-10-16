
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { clsx } from "clsx";
import type { PlayerStats } from '@/lib/data';
import WantedVideo from './WantedVideo';

interface Props {
    initialData: PlayerStats[];
}

type SortField = 'rank' | 'points' | 'winnings' | 'knockOuts' | 'profit';

export default function LeaderboardTable({ initialData }: Props) {
    const [data, setData] = useState(initialData);
    const [sortField, setSortField] = useState<SortField>('points');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');



    // Real implementation of sort
    const sortedData = [...data].sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    const onHeaderClick = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    if (!sortedData || sortedData.length === 0) {
        return (
            <div className="w-full py-16 text-center text-zinc-500 font-mono text-xs border border-white/5 rounded-2xl bg-black/20">
                No player statistics recorded yet.
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            <div className="grid grid-cols-8 md:grid-cols-12 gap-2 md:gap-4 px-3 md:px-6 py-4 border-b border-white/10 text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-500">
                <div className="col-span-1 text-center cursor-pointer hover:text-white" onClick={() => onHeaderClick('rank')}>Rank</div>
                <div className="col-span-5 md:col-span-4 cursor-pointer hover:text-white" onClick={() => onHeaderClick('points')}>Player</div>
                <div className="col-span-2 text-center cursor-pointer hover:text-white" onClick={() => onHeaderClick('points')}>Points <ArrowUpDown className="w-3 h-3 inline md:ml-1" /></div>
                <div className="hidden md:block col-span-2 text-center cursor-pointer hover:text-white" onClick={() => onHeaderClick('winnings')}>Winnings</div>
                <div className="hidden md:block col-span-2 text-center cursor-pointer hover:text-white" onClick={() => onHeaderClick('knockOuts')}>KOs</div>
                <div className="hidden md:block col-span-1 text-center cursor-pointer hover:text-white" onClick={() => onHeaderClick('profit')}>P/L</div>
            </div>

            <div className="divide-y divide-white/5">
                {sortedData.map((player, index) => (
                    <motion.div
                        key={player.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={clsx(
                            "grid grid-cols-8 md:grid-cols-12 gap-2 md:gap-4 px-3 md:px-6 py-4 items-center hover:bg-white/5 transition-colors group",
                            player.rank === 1 && "bg-gold/5 border-l-2 border-gold"
                        )}
                    >
                        <div className="col-span-1 flex justify-center">
                            <span className={clsx(
                                "h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full font-bold text-xs sm:text-sm shrink-0",
                                player.rank === 1 ? "bg-gold text-charcoal-dark shadow-[0_0_8px_rgba(212,175,55,0.6)]" :
                                    player.rank === 2 ? "bg-zinc-300 text-charcoal-dark" :
                                        player.rank === 3 ? "bg-amber-700 text-white" : "text-zinc-500"
                            )}>
                                {player.rank}
                            </span>
                        </div>

                        <div className="col-span-5 md:col-span-4 flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-charcoal-light border border-white/10 overflow-hidden relative group-hover:border-[#cfb53b] transition-colors shrink-0">
                                {/* Video Profile layer */}
                                <WantedVideo playerName={player.name} />

                                <div className="absolute inset-0 bg-gradient-to-br from-charcoal to-zinc-800 flex items-center justify-center text-[10px] sm:text-xs font-bold text-zinc-500 z-0">
                                    {player.name.substring(0, 2).toUpperCase()}
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-white text-xs sm:text-base group-hover:text-gold transition-colors truncate">{player.name}</span>
                                    {player.rank === 1 && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-gold/20 text-gold border border-gold/40 text-[9px] font-black uppercase tracking-wider shrink-0">
                                            👑 Leader
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] sm:text-xs text-zinc-500 flex items-center gap-1.5 flex-wrap">
                                    <span>Games: {player.gamesPlayed}</span>
                                    <span className="md:hidden text-ept-red font-bold">· {player.knockOuts} ☠️</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 text-center font-mono text-sm sm:text-base md:text-lg font-bold text-white">
                            <span className="text-gold font-bold">{player.points}</span>
                            <span className="text-[9px] text-zinc-500 block md:hidden uppercase">pts</span>
                        </div>

                        <div className="hidden md:block col-span-2 text-center font-mono text-zinc-300">
                            £{player.winnings}
                        </div>

                        <div className="hidden md:flex col-span-2 justify-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-ept-red/10 text-ept-red text-xs font-bold border border-ept-red/20">
                                {player.knockOuts} ☠️
                            </span>
                        </div>

                        <div className={clsx(
                            "hidden md:block col-span-1 text-center font-mono font-bold text-xs",
                            player.profit > 0 ? "text-green-500" : player.profit < 0 ? "text-ept-red" : "text-zinc-500"
                        )}>
                            {player.profit > 0 ? `+£${player.profit}` : player.profit < 0 ? `-£${Math.abs(player.profit)}` : '£0'}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
