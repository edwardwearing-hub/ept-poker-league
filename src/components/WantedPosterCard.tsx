'use client';

import { useState, useEffect } from 'react';
import { PlayerStats } from "@/lib/data";
import { clsx } from 'clsx';
import { Skull, Target, Lock } from 'lucide-react';
import Link from 'next/link';
import WantedVideo from './WantedVideo';

const AVATAR_MAP: Record<string, string> = {
    'edward wearing': 'avatar_edward_wearing_1772222877224.png',
    'georgina wearing': 'avatar_georgina_wearing_1772223035422.png',
    'luke daly': 'avatar_luke_daly_1772223102669.png',
    'daniel horne': 'avatar_daniel_horne_1772222954376.png',
    'darren daly': 'avatar_darren_daly_1772222979758.png',
    'chris daly': 'avatar_chris_daly_1772222942062.png',
    'stephen flood': 'avatar_stephen_flood_1772223088474.png',
    'phil landsberger': 'avatar_hoodie.png',
    'liam duxbury': 'avatar_liam_duxbury_1772223048076.png',
    'nathen benson': 'avatar_nathen_benson_1772223077518.png',
    'dave taylor': 'avatar_dave_taylor_1772223007740.png',
    'unknown hacker': 'avatar_bounty.png'
};

const getAvatarFilename = (name: string) => {
    const key = name.toLowerCase().trim();
    return AVATAR_MAP[key] || 'avatar_hoodie.png';
};

interface Props {
    player: PlayerStats;
    isTarget?: boolean;
}

export default function WantedPosterCard({ player, isTarget }: Props) {
    const [isHijacked, setIsHijacked] = useState(false);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const hijacked = localStorage.getItem(`hijack_active_${player.name}`) === 'true';
        setIsHijacked(hijacked);

        const lockout = localStorage.getItem(`hijack_lockout_${player.name}`);
        if (lockout) {
            setLockoutTime(parseInt(lockout, 10));
        }
    }, [player.name]);

    useEffect(() => {
        if (!lockoutTime) return;

        const tick = () => {
            const now = Date.now();
            if (now >= lockoutTime) {
                setLockoutTime(null);
                localStorage.removeItem(`hijack_lockout_${player.name}`);
            } else {
                const diff = lockoutTime - now;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${mins}m ${secs}s`);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [lockoutTime, player.name]);

    const isLockedOut = lockoutTime !== null;
    const hijackerName = player.enemyQueue && player.enemyQueue.length > 0 ? player.enemyQueue[0] : 'UNKNOWN HACKER';

    return (
        <div className={clsx(
            "relative group hover:-translate-y-2 transition-transform duration-300",
            isTarget ? "z-10" : "z-0",
            isLockedOut ? "opacity-90" : ""
        )}>
            {/* Massive Locked Scrawl (Outside Grayscale) */}
            {isLockedOut && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[150%] flex justify-center transform -rotate-[20deg] pointer-events-none z-50 opacity-60 select-none">
                    <span className="text-[80px] leading-none font-black text-ept-red uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(220,38,38,1)] whitespace-nowrap">
                        LOCKED
                    </span>
                </div>
            )}

            {/* Poster Frame */}
            <Link href={`/scouting/${encodeURIComponent(player.name)}`} className="block relative z-10">
                <div className={clsx(
                    "bg-[#e4dccb] text-[#3e3221] p-1 rounded-sm shadow-xl transform rotate-1 group-hover:rotate-0 transition-transform duration-300",
                    isLockedOut ? "grayscale" : ""
                )}>
                    <div className="border-[3px] border-[#3e3221] p-4 flex flex-col items-center relative overflow-hidden">

                        {/* Texture Overlay */}


                        <h3 className="text-3xl font-extrabold tracking-widest uppercase mb-1 z-10" style={{ fontFamily: 'serif' }}>Wanted</h3>
                        <div className="text-xs font-bold uppercase tracking-widest mb-3 border-b-2 border-[#3e3221] pb-1 w-full text-center z-10">
                            {player.nickname}
                        </div>

                        <div className="w-48 h-48 bg-zinc-900 mb-3 border-2 border-[#3e3221] flex items-center justify-center overflow-hidden relative z-10 group-hover:grayscale-0 transition-all duration-500 grayscale contrast-125">
                            <WantedVideo playerName={player.name} />
                            <img
                                src={player.avatarUrl || "/avatars/avatar_hoodie.png"}
                                alt={player.name}
                                className="w-full h-full object-cover"
                            />
                            {/* Rank Stamped on Image */}
                            <div className="absolute bottom-0 right-0 bg-[#3e3221] text-[#e4dccb] px-2 py-1 text-xs font-bold uppercase z-20">
                                Rank #{player.rank}
                            </div>

                            {/* Hijack Graffiti & Avatar Overlay */}
                            {(isHijacked || isLockedOut) && (
                                <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                                    {/* Semi-transparent dark overlay */}
                                    <div className="absolute inset-0 bg-black/40" />

                                    {/* Spray Paint */}
                                    <div className="absolute top-2 left-2 w-24 h-24 bg-ept-red/30 rounded-full blur-[20px]" />
                                    <div className="absolute bottom-2 right-2 w-24 h-24 bg-green-500/30 rounded-full blur-[20px]" />

                                    {/* Hijacker Avatar */}
                                    <img
                                        src={`/avatars/${getAvatarFilename(hijackerName)}`}
                                        alt={hijackerName}
                                        className="w-24 h-24 object-contain filter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] border-b-4 border-ept-red bg-black/80 rounded-full z-40 relative mt-4 animate-breathe"
                                    />
                                </div>
                            )}

                            {/* Locked Out Stamp */}
                            {isLockedOut && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/60 z-40">
                                </div>
                            )}
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

                        {/* Status Banners */}
                        {isLockedOut ? (
                            <div className="absolute bottom-0 left-0 w-full bg-black border-t-2 border-[#3e3221] p-1 flex items-center justify-center gap-2 z-20">
                                <Lock className="w-3 h-3 text-ept-red animate-pulse" />
                                <span className="text-[10px] font-black font-mono text-ept-red uppercase tracking-widest">{timeLeft}</span>
                            </div>
                        ) : isHijacked ? (
                            <div className="absolute bottom-0 left-0 w-full bg-green-500 border-t-2 border-green-700 p-1 flex items-center justify-center text-center z-20 overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-30 pointer-events-none" />
                                <span className="text-[9px] font-black font-mono text-black uppercase tracking-widest relative z-10 w-full truncate px-1">
                                    WANTED BY: {hijackerName}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </Link>

            {/* Nail Effect */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-zinc-800 shadow-sm border border-zinc-600 z-20"></div>
        </div>
    );
}
