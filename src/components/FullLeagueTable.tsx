'use client';

import { clsx } from 'clsx';
import { PlayerStats } from '@/lib/data';
import { ArrowRight, Sparkles } from 'lucide-react';

interface Props {
    data: PlayerStats[];
}

export default function FullLeagueTable({ data }: Props) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full py-16 text-center text-zinc-500 font-mono text-xs border border-white/5 rounded-2xl bg-black/20">
                No league standings recorded yet.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Mobile swipe helper badge */}
            <div className="md:hidden flex items-center justify-between px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-[10px] text-gold font-mono font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-gold animate-pulse" />
                    <span>Swipe horizontally for all stats</span>
                </span>
                <span className="text-zinc-400">→</span>
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-black/40 backdrop-blur-md touch-momentum shadow-xl">
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                    <thead className="text-[10px] sm:text-xs uppercase bg-white/5 text-zinc-400">
                        <tr>
                            <th className="sticky left-0 bg-[#161616] z-30 px-2.5 sm:px-4 py-3 font-bold text-white text-center w-9 sm:w-12 border-b border-white/10">#</th>
                            <th className="sticky left-9 sm:left-12 bg-[#161616] z-30 px-3 sm:px-4 py-3 font-bold text-white border-b border-r border-white/10 shadow-[4px_0_8px_rgba(0,0,0,0.4)] whitespace-nowrap min-w-[130px] sm:min-w-[170px]">Player</th>
                            <th className="px-3 sm:px-4 py-3 text-center whitespace-nowrap border-b border-white/10">Gms</th>
                            <th className="px-3 sm:px-4 py-3 text-center whitespace-nowrap border-b border-white/10">Wins</th>
                            <th className="px-3 sm:px-4 py-3 text-center text-gold font-bold whitespace-nowrap border-b border-white/10">Pts</th>
                            <th className="px-3 sm:px-4 py-3 text-center whitespace-nowrap border-b border-white/10">Rebuys</th>
                            <th className="px-3 sm:px-4 py-3 text-center whitespace-nowrap border-b border-white/10">Add-On</th>
                            <th className="px-3 sm:px-4 py-3 text-center whitespace-nowrap border-b border-white/10">Paid</th>
                            <th className="px-3 sm:px-4 py-3 text-center whitespace-nowrap border-b border-white/10">Won</th>
                            <th className="px-3 sm:px-4 py-3 text-center whitespace-nowrap border-b border-white/10">Profit</th>
                            <th className="px-3 sm:px-4 py-3 text-center whitespace-nowrap border-b border-white/10">Bonus</th>
                            <th className="px-3 sm:px-4 py-3 text-center text-ept-red font-bold whitespace-nowrap border-b border-white/10">KOs</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((player) => (
                            <tr key={player.name} className="hover:bg-white/5 transition-colors group">
                                <td className="sticky left-0 bg-[#141414] group-hover:bg-[#1a1a1a] z-20 px-2.5 sm:px-4 py-3 font-mono text-zinc-400 text-center font-bold">
                                    <span className={clsx(
                                        player.rank === 1 ? "text-gold font-black" :
                                        player.rank === 2 ? "text-zinc-200 font-black" :
                                        player.rank === 3 ? "text-amber-600 font-black" : ""
                                    )}>
                                        {player.rank}
                                    </span>
                                </td>
                                <td className="sticky left-9 sm:left-12 bg-[#141414] group-hover:bg-[#1a1a1a] z-20 px-3 sm:px-4 py-3 font-bold text-white whitespace-nowrap border-r border-white/10 shadow-[4px_0_8px_rgba(0,0,0,0.4)]">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate group-hover:text-gold transition-colors">{player.name}</span>
                                        {player.rank === 1 && (
                                            <span className="text-gold text-xs leading-none" title="Championship Leader">♛</span>
                                        )}
                                        {player.badges && player.badges.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                {player.badges.map(b => (
                                                    <span 
                                                        key={b.id} 
                                                        title={`${b.label}: ${b.description}`}
                                                        className="cursor-help text-xs opacity-85 hover:opacity-100 transition-opacity"
                                                    >
                                                        {b.icon}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-center text-zinc-400 font-mono">{player.gamesPlayed}</td>
                                <td className="px-3 sm:px-4 py-3 text-center text-zinc-400 font-mono">{player.wins}</td>
                                <td className="px-3 sm:px-4 py-3 text-center font-bold text-gold text-sm sm:text-base font-mono">{player.points}</td>
                                <td className="px-3 sm:px-4 py-3 text-center text-zinc-400 font-mono">{player.rebuys}</td>
                                <td className="px-3 sm:px-4 py-3 text-center text-zinc-400 font-mono">{player.addOns}</td>
                                <td className="px-3 sm:px-4 py-3 text-center text-zinc-400 font-mono">£{player.cashPaid}</td>
                                <td className="px-3 sm:px-4 py-3 text-center text-green-400 font-bold font-mono">£{player.winnings}</td>
                                <td className={clsx("px-3 sm:px-4 py-3 text-center font-bold font-mono", player.profit >= 0 ? "text-green-500" : "text-ept-red")}>
                                    {player.profit >= 0 ? `+£${player.profit}` : `-£${Math.abs(player.profit)}`}
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-center text-zinc-400 font-mono">{player.bonusChips}</td>
                                <td className="px-3 sm:px-4 py-3 text-center text-ept-red font-bold font-mono">{player.knockOuts}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
