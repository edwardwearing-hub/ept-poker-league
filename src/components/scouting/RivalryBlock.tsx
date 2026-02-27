'use client';

import { useState } from 'react';
import { Skull, Target, UserX, UserCheck, Flame } from 'lucide-react';
import { PlayerStats } from '@/lib/data';

interface Props {
    player: PlayerStats;
    allPlayers: PlayerStats[];
}

const getAvatarFilename = (name: string) => `/avatars/avatar_${name.toLowerCase().replace(' ', '_')}.png`;

export default function RivalryBlock({ player, allPlayers }: Props) {
    const [selectedOpponent, setSelectedOpponent] = useState(allPlayers.find(p => p.name !== player.name)?.name || '');

    const rival = allPlayers.find(p => p.name === player.rivalPlayer);
    const victim = allPlayers.find(p => p.name === player.bulliedPlayer);
    const h2h = allPlayers.find(p => p.name === selectedOpponent);

    // Escape Artist % = (Games won / Times Hijacked)*100
    // Time Spent Hostage = (Total Times Knocked Out * 12 hours)
    const timesHijacked = player.totalTimesKnockedOut || 0;
    const gauntletWins = player.gamesPlayed; // Rough proxy without discrete event tracking
    const escapeRate = timesHijacked > 0 ? Math.min(100, Math.round((gauntletWins / timesHijacked) * 100)) : 100;
    const hostageHours = timesHijacked * 12;

    return (
        <div className="space-y-6">

            {/* The Arch-Nemesis */}
            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group border-2 border-ept-red/30 hover:border-ept-red transition-colors">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-10 pointer-events-none" />
                <h3 className="text-xl font-black text-ept-red mb-6 flex items-center gap-2 uppercase">
                    <Skull className="animate-pulse" /> Arch-Nemesis
                </h3>

                {rival ? (
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex flex-col items-center">
                            <img src={getAvatarFilename(player.name)} alt="Player" className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                            <span className="text-xs font-bold text-zinc-400 mt-2">You</span>
                        </div>

                        <div className="text-4xl font-black text-ept-red italic px-4 animate-pulse">VS</div>

                        <div className="flex flex-col items-center">
                            <img src={getAvatarFilename(rival.name)} alt="Rival" className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                            <span className="text-sm font-black text-ept-red mt-2 uppercase">{rival.name}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-zinc-500 font-bold italic text-center py-8">NO SIGNIFICANT RIVALS DETECTED</div>
                )}
            </div>

            {/* Favorite Victim */}
            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group border-2 border-green-500/30 hover:border-green-500 transition-colors">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-10 pointer-events-none" />
                <h3 className="text-base font-black text-green-500 mb-4 flex items-center gap-2 uppercase z-10 relative">
                    <Target className="w-5 h-5" /> Favorite Victim
                </h3>

                {victim ? (
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 bg-black rounded-lg border-2 border-green-500 p-1">
                            <img src={getAvatarFilename(victim.name)} alt="Victim" className="w-full h-full object-contain grayscale opacity-50" />
                        </div>
                        <div>
                            <div className="font-black text-white text-xl uppercase tracking-wider">{victim.name}</div>
                            <div className="text-xs text-zinc-400 uppercase font-bold mt-1">Most Frequently Hijacked Player</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-zinc-500 font-bold italic relative z-10 pl-2">NO CONSISTENT TARGETS</div>
                )}
            </div>

            {/* Head-to-Head Tracker */}
            <div className="glass-panel p-6 rounded-xl">
                <h3 className="text-base font-black text-gold mb-4 flex items-center gap-2 uppercase">
                    <Flame /> Head-to-Head Data
                </h3>

                <select
                    value={selectedOpponent}
                    onChange={(e) => setSelectedOpponent(e.target.value)}
                    className="w-full bg-black border-2 border-zinc-800 text-white p-3 font-bold uppercase cursor-pointer hover:border-gold transition-colors mb-4 appearance-none"
                >
                    {allPlayers.filter(p => p.name !== player.name).map(p => (
                        <option key={p.name} value={p.name}>VS. {p.name}</option>
                    ))}
                </select>

                {h2h && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black border border-zinc-800 p-3 text-center">
                            <div className="text-xs text-zinc-500 font-bold mb-1">Their Rank</div>
                            <div className="text-xl font-black text-white">#{h2h.rank}</div>
                        </div>
                        <div className="bg-black border border-zinc-800 p-3 text-center">
                            <div className="text-xs text-zinc-500 font-bold mb-1">Their Total KOs</div>
                            <div className="text-xl font-black text-gold">{h2h.totalHistoricalKOs}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Meta Game Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-xl text-center border border-zinc-800">
                    <div className="text-xs text-zinc-500 uppercase font-bold mb-2">Escape Artist</div>
                    <div className="text-2xl font-black text-green-400">{escapeRate}%</div>
                </div>
                <div className="glass-panel p-4 rounded-xl text-center border border-zinc-800">
                    <div className="text-xs text-zinc-500 uppercase font-bold mb-2">Time Hostage</div>
                    <div className="text-2xl font-black text-ept-red">{hostageHours}H</div>
                </div>
            </div>

        </div>
    );
}
