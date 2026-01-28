'use client';

import { PlayerStats } from "@/lib/data";
import { clsx } from 'clsx';
import { Skull, Target } from 'lucide-react';
import Link from 'next/link';

interface Props {
    player: PlayerStats;
    isTarget?: boolean;
}

export default function WantedPosterCard({ player, isTarget }: Props) {
    return (
        <div className={clsx(
            "relative group hover:-translate-y-2 transition-transform duration-300",
            isTarget ? "z-10" : "z-0"
        )}>
            {/* Poster Frame */}
            <Link href={`/scouting/${encodeURIComponent(player.name)}`} className="block relative z-10">
                <div className="bg-[#e4dccb] text-[#3e3221] p-1 rounded-sm shadow-xl transform rotate-1 group-hover:rotate-0 transition-transform duration-300">
                    <div className="border-[3px] border-[#3e3221] p-4 flex flex-col items-center relative overflow-hidden">

                        {/* Texture Overlay */}
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none mix-blend-multiply"></div>

                        <h3 className="text-3xl font-extrabold tracking-widest uppercase mb-1 z-10" style={{ fontFamily: 'serif' }}>Wanted</h3>
                        <div className="text-xs font-bold uppercase tracking-widest mb-3 border-b-2 border-[#3e3221] pb-1 w-full text-center z-10">
                            {player.nickname}
                        </div>

                        <div className="w-48 h-48 bg-zinc-900 mb-3 border-2 border-[#3e3221] flex items-center justify-center overflow-hidden relative z-10 group-hover:grayscale-0 transition-all duration-500 grayscale contrast-125">
                            <img
                                src={player.avatarUrl || "/avatars/avatar_hoodie.png"}
                                alt={player.name}
                                className="w-full h-full object-cover"
                            />
                            {/* Rank Stamped on Image */}
                            <div className="absolute bottom-0 right-0 bg-[#3e3221] text-[#e4dccb] px-2 py-1 text-xs font-bold uppercase">
                                Rank #{player.rank}
                            </div>
                        </div>

                        <h2 className="text-xl font-bold uppercase mb-0 text-center leading-none z-10">{player.name}</h2>

                        <div className="w-full border-t-2 border-b-2 border-[#3e3221] py-2 my-3 text-center z-10 bg-[#e4dccb]/80">
                            <div className="text-[10px] uppercase font-bold">Reward (Points)</div>
                            <div className="text-2xl font-extrabold flex items-center justify-center gap-2">
                                <Skull size={18} /> {player.points}
                            </div>
                        </div>

                        <div className="w-full text-left z-10">
                            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#3e3221]/70 border-b border-[#3e3221]/20 pb-1 mb-1">
                                <span>K.O.s: {player.knockOuts}</span>
                                <span>Wins: {player.wins}</span>
                            </div>
                            {player.rivalPlayer && player.rivalPlayer !== 'None' && (
                                <div className="text-[9px] uppercase font-bold mt-1 text-red-800">
                                    Rival: {player.rivalPlayer.split(' ')[0]}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>

            {/* Nail Effect */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-zinc-800 shadow-sm border border-zinc-600 z-20"></div>
        </div>
    );
}
