'use client';

import { clsx } from 'clsx';
import { PlayerStats } from '@/lib/data';

interface Props {
    data: PlayerStats[];
}

export default function FullLeagueTable({ data }: Props) {
    return (
        <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm">
            <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-white/5 text-zinc-400">
                    <tr>
                        <th className="px-4 py-3 font-bold text-white">#</th>
                        <th className="px-4 py-3 font-bold text-white">Player</th>
                        <th className="px-4 py-3 text-center">Gms</th>
                        <th className="px-4 py-3 text-center">Wins</th>
                        <th className="px-4 py-3 text-center text-gold">Pts</th>
                        <th className="px-4 py-3 text-center">Rebuys</th>
                        <th className="px-4 py-3 text-center">Add-On</th>
                        <th className="px-4 py-3 text-center">Paid</th>
                        <th className="px-4 py-3 text-center">Won</th>
                        <th className="px-4 py-3 text-center">Profit</th>
                        <th className="px-4 py-3 text-center">Bonus</th>
                        <th className="px-4 py-3 text-center text-ept-red">KOs</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.map((player) => (
                        <tr key={player.name} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-mono text-zinc-500">{player.rank}</td>
                            <td className="px-4 py-3 font-bold text-white">{player.name}</td>
                            <td className="px-4 py-3 text-center text-zinc-400">{player.gamesPlayed}</td>
                            <td className="px-4 py-3 text-center text-zinc-400">{player.wins}</td>
                            <td className="px-4 py-3 text-center font-bold text-gold text-lg">{player.points}</td>
                            <td className="px-4 py-3 text-center text-zinc-400">{player.rebuys}</td>
                            <td className="px-4 py-3 text-center text-zinc-400">{player.addOns}</td>
                            <td className="px-4 py-3 text-center text-zinc-400">£{player.cashPaid}</td>
                            <td className="px-4 py-3 text-center text-green-400 font-bold">£{player.winnings}</td>
                            <td className={clsx("px-4 py-3 text-center font-bold", player.profit >= 0 ? "text-green-500" : "text-ept-red")}>
                                {player.profit}
                            </td>
                            <td className="px-4 py-3 text-center text-zinc-400">{player.bonusChips}</td>
                            <td className="px-4 py-3 text-center text-ept-red font-bold">{player.knockOuts}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
