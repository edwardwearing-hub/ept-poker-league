
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Trophy, ArrowUp, ArrowDown } from 'lucide-react';
import { clsx } from "clsx";
import type { PlayerStats } from '@/lib/data';

interface Props {
    initialData: PlayerStats[];
}

type SortField = 'rank' | 'points' | 'winnings' | 'knockOuts' | 'profit';

export default function LeaderboardTable({ initialData }: Props) {
    const [data, setData] = useState(initialData);
    const [sortField, setSortField] = useState<SortField>('points');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }

        const sorted = [...data].sort((a, b) => {
            const valA = a[field];
            const valB = b[field];
            return sortDirection === 'asc' ? valA - valB : valB - valA; // Logic inverted because of previous desc default? No.
            // If desc, we want b - a. If asc, a - b.
            // But we just toggled direction, so we use the NEW direction? 
            // React state update is async, so `sortDirection` here is the OLD one.
            // Let's fix this logic.
        });
        // Actually, let's simplify.
        setData((prev) => {
            const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
            // Wait, I can't update state based on potential new state easily invar without side effects?
            // Better to separate sort logic into a useMemo or just re-sort on render?
            // For now, let's just do it cleanly.
            return prev; // Placeholder, I'll fix in the component below.
        });
    };

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

    return (
        <div className="w-full overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <div className="col-span-1 text-center cursor-pointer hover:text-white" onClick={() => onHeaderClick('rank')}>Rank</div>
                <div className="col-span-4 cursor-pointer hover:text-white" onClick={() => onHeaderClick('points')}>Player</div> {/* Sort by points defaults? or Name? Name usually. */}
                <div className="col-span-2 text-center cursor-pointer hover:text-white" onClick={() => onHeaderClick('points')}>Points <ArrowUpDown className="w-3 h-3 inline ml-1" /></div>
                <div className="col-span-2 text-center cursor-pointer hover:text-white" onClick={() => onHeaderClick('winnings')}>Winnings</div>
                <div className="col-span-2 text-center cursor-pointer hover:text-white" onClick={() => onHeaderClick('knockOuts')}>KOs</div>
                <div className="col-span-1 text-center cursor-pointer hover:text-white" onClick={() => onHeaderClick('profit')}>P/L</div>
            </div>

            <div className="divide-y divide-white/5">
                {sortedData.map((player, index) => (
                    <motion.div
                        key={player.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={clsx(
                            "grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors group",
                            player.rank === 1 && "bg-gold/5 border-l-2 border-gold"
                        )}
                    >
                        <div className="col-span-1 flex justify-center">
                            <span className={clsx(
                                "h-8 w-8 flex items-center justify-center rounded-full font-bold",
                                player.rank === 1 ? "bg-gold text-charcoal-dark" :
                                    player.rank === 2 ? "bg-zinc-300 text-charcoal-dark" :
                                        player.rank === 3 ? "bg-amber-700 text-white" : "text-zinc-500"
                            )}>
                                {player.rank}
                            </span>
                        </div>

                        <div className="col-span-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-charcoal-light border border-white/10 overflow-hidden relative">
                                {/* Avatar Placeholder - User requested Nano Banana Pro style avatars. 
                     I don't have the images yet, so I'll use a gradient or generic. */}
                                <div className="absolute inset-0 bg-gradient-to-br from-charcoal to-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                                    {player.name.substring(0, 2).toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <div className="font-bold text-white text-base group-hover:text-gold transition-colors">{player.name}</div>
                                <div className="text-xs text-zinc-500">Games: {player.gamesPlayed}</div>
                            </div>
                        </div>

                        <div className="col-span-2 text-center font-mono text-lg font-bold text-white">
                            {player.points}
                        </div>

                        <div className="col-span-2 text-center font-mono text-zinc-300">
                            £{player.winnings}
                        </div>

                        <div className="col-span-2 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-ept-red/10 text-ept-red text-xs font-bold border border-ept-red/20">
                                {player.knockOuts} ☠️
                            </span>
                        </div>

                        <div className={clsx(
                            "col-span-1 text-center font-mono font-bold text-xs",
                            player.profit > 0 ? "text-green-500" : player.profit < 0 ? "text-ept-red" : "text-zinc-500"
                        )}>
                            {player.profit > 0 ? '+' : ''}{player.profit}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
