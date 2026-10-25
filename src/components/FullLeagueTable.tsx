'use client';

import { clsx } from 'clsx';
import { PlayerStats } from '@/lib/data';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

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

    const totalGamesEntries = data.reduce((s, p) => s + (p.gamesPlayed || 0), 0);
    const totalWins = data.reduce((s, p) => s + (p.wins || 0), 0);
    const totalPoints = data.reduce((s, p) => s + (p.points || 0), 0);
    const totalBubbles = data.reduce((s, p) => s + (p.bubbleFinishes || 0), 0);
    const totalRebuys = data.reduce((s, p) => s + (p.rebuys || 0), 0);
    const totalAddOns = data.reduce((s, p) => s + (p.addOns || 0), 0);
    const totalCashPaid = data.reduce((s, p) => s + (p.cashPaid || 0), 0);
    const totalWinnings = data.reduce((s, p) => s + (p.winnings || 0), 0);
    const totalProfit = data.reduce((s, p) => s + (p.profit || 0), 0);
    const totalBonus = data.reduce((s, p) => s + (p.bonusChips || 0), 0);
    const totalKOs = data.reduce((s, p) => s + (p.knockOuts || 0), 0);
    const totalKOd = data.reduce((s, p) => s + (p.totalTimesKnockedOut || 0), 0);

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
                            <th className="px-2.5 sm:px-3.5 py-3 text-center whitespace-nowrap border-b border-white/10">Gms</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center whitespace-nowrap border-b border-white/10">Wins</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center text-gold font-bold whitespace-nowrap border-b border-white/10">Pts</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center whitespace-nowrap border-b border-white/10" title="Average Finish Position">Avg Pos</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center text-purple-300 font-bold whitespace-nowrap border-b border-white/10" title="Finished 1 Spot Outside the Money">Bubbles</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center text-blue-300 font-bold whitespace-nowrap border-b border-white/10" title="Total Re-Buys (Max in Single Game • Avg Re-Buys/Game)">Rebuys (Max • Avg)</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center whitespace-nowrap border-b border-white/10" title="Add-Ons (@ £10 each)">Add-On</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center whitespace-nowrap border-b border-white/10" title="Total Cash Paid (@ £10 per Buy-In, Re-Buy & Add-On)">Paid</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center whitespace-nowrap border-b border-white/10">Won</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center whitespace-nowrap border-b border-white/10">Profit</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center whitespace-nowrap border-b border-white/10">Bonus</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center text-ept-red font-bold whitespace-nowrap border-b border-white/10">KOs</th>
                            <th className="px-2.5 sm:px-3.5 py-3 text-center whitespace-nowrap border-b border-white/10" title="Times Knocked Out">KO&apos;d</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((player) => {
                            const avgRebuys =
                                player.gamesPlayed > 0
                                    ? ((player.rebuys || 0) / player.gamesPlayed).toFixed(2)
                                    : '0.00';

                            return (
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
                                            <Link
                                                href={`/scouting/${encodeURIComponent(player.name)}`}
                                                className="truncate group-hover:text-gold transition-colors"
                                            >
                                                {player.name}
                                            </Link>
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
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center text-zinc-400 font-mono">{player.gamesPlayed}</td>
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center text-zinc-400 font-mono">{player.wins}</td>
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center font-bold text-gold text-sm sm:text-base font-mono">{player.points}</td>
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center text-cyan-300 font-mono">
                                        {player.avgFinishPosition && player.avgFinishPosition > 0
                                            ? player.avgFinishPosition.toFixed(1)
                                            : '-'}
                                    </td>
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center text-purple-300 font-bold font-mono">
                                        {player.bubbleFinishes || 0}
                                    </td>
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center text-blue-300 font-mono whitespace-nowrap">
                                        <span className="font-bold">{player.rebuys || 0}</span>{' '}
                                        <span className="text-[10px] text-zinc-500">
                                            (Max {player.mostRebuysSingle || 0} • {avgRebuys}/gm)
                                        </span>
                                    </td>
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center text-zinc-400 font-mono">{player.addOns}</td>
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center text-zinc-400 font-mono">£{player.cashPaid}</td>
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center text-green-400 font-bold font-mono">£{player.winnings}</td>
                                    <td className={clsx("px-2.5 sm:px-3.5 py-3 text-center font-bold font-mono", player.profit >= 0 ? "text-green-500" : "text-ept-red")}>
                                        {player.profit >= 0 ? `+£${player.profit}` : `-£${Math.abs(player.profit)}`}
                                    </td>
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center text-zinc-400 font-mono">{player.bonusChips?.toLocaleString()}</td>
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center text-ept-red font-bold font-mono">{player.knockOuts}</td>
                                    <td className="px-2.5 sm:px-3.5 py-3 text-center text-zinc-400 font-mono">{player.totalTimesKnockedOut || 0}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-white/5 border-t-2 border-gold/40 font-mono text-xs font-black text-white">
                        <tr>
                            <td className="sticky left-0 bg-[#181818] z-20 px-2.5 sm:px-4 py-3 text-center text-gold">Σ</td>
                            <td className="sticky left-9 sm:left-12 bg-[#181818] z-20 px-3 sm:px-4 py-3 font-sans uppercase text-gold border-r border-white/10">League Totals</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center">{totalGamesEntries}</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center">{totalWins}</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center text-gold">{totalPoints}</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center text-zinc-500">-</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center text-purple-300">{totalBubbles}</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center text-blue-300">{totalRebuys} (£{totalRebuys * 10})</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center">{totalAddOns} (£{totalAddOns * 10})</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center">£{totalCashPaid}</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center text-green-400">£{totalWinnings}</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center text-gold">
                                {totalProfit >= 0 ? `+£${totalProfit}` : `-£${Math.abs(totalProfit)}`}
                            </td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center text-zinc-300">{totalBonus.toLocaleString()}</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center text-ept-red">{totalKOs}</td>
                            <td className="px-2.5 sm:px-3.5 py-3 text-center text-zinc-400">{totalKOd}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
