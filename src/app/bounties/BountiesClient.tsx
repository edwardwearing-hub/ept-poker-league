'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PlayerStats } from '@/lib/data';
import WantedPosterCard from '@/components/WantedPosterCard';
import { Target, Skull, Crosshair, ShieldAlert, Award, Zap } from 'lucide-react';
import Link from 'next/link';

interface Props {
    players: PlayerStats[];
    initialView?: 'rankings' | 'wanted';
}

const getAvatarFilename = (name: string) => `/avatars/avatar_${name.toLowerCase().replace(' ', '_')}.png`;

export default function BountiesClient({ players, initialView = 'rankings' }: Props) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const viewParam = searchParams.get('view');
    const [activeTab, setActiveTab] = useState<'rankings' | 'wanted'>(
        viewParam === 'wanted' ? 'wanted' : initialView
    );

    useEffect(() => {
        if (viewParam === 'wanted') {
            setActiveTab('wanted');
        } else if (viewParam === 'rankings') {
            setActiveTab('rankings');
        }
    }, [viewParam]);

    const handleTabChange = (tab: 'rankings' | 'wanted') => {
        setActiveTab(tab);
        const url = tab === 'wanted' ? '/bounties?view=wanted' : '/bounties?view=rankings';
        router.replace(url, { scroll: false });
    };

    // The Executioner: Most total KOs
    const executioners = [...players].sort((a, b) => (b.totalHistoricalKOs || 0) - (a.totalHistoricalKOs || 0)).slice(0, 3);

    // The Apex Predator: Highest KO-to-Game ratio
    const predators = [...players].sort((a, b) => (b.koToGameRatio || 0) - (a.koToGameRatio || 0)).slice(0, 3);

    // The Bullet Sponge: Most times knocked out
    const sponges = [...players].sort((a, b) => (b.totalTimesKnockedOut || 0) - (a.totalTimesKnockedOut || 0)).slice(0, 3);

    // The Hijack King: Most unique players hijacked
    const hijackKings = [...players].sort((a, b) => (b.uniquePlayersHijacked?.length || 0) - (a.uniquePlayersHijacked?.length || 0)).slice(0, 3);

    // Sorted players for Wanted posters (by rank / points)
    const sortedForWanted = [...players].sort((a, b) => a.rank - b.rank);

    return (
        <div className="space-y-6">
            {/* View Switcher Sub-Tabs */}
            <div className="flex items-center justify-center">
                <div className="inline-flex p-1.5 bg-zinc-950/90 border border-white/10 rounded-2xl shadow-xl">
                    <button
                        onClick={() => handleTabChange('rankings')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all cursor-pointer ${
                            activeTab === 'rankings'
                                ? 'bg-gradient-to-r from-ept-red to-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <Target size={15} />
                        <span>Leaderboard Rankings</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('wanted')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all cursor-pointer ${
                            activeTab === 'wanted'
                                ? 'bg-gradient-to-r from-gold to-yellow-500 text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <Skull size={15} />
                        <span>Wanted Posters ({players.length})</span>
                    </button>
                </div>
            </div>

            {/* VIEW 1: RANKINGS */}
            {activeTab === 'rankings' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                        {/* The Executioner */}
                        <div className="border-4 border-ept-red bg-black p-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-10 pointer-events-none" />
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Target size={120} />
                            </div>
                            <h2 className="text-2xl font-black text-ept-red uppercase mb-6 flex items-center gap-2">
                                <Target className="w-6 h-6" /> The Executioner
                            </h2>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-900 pb-2">Most Total Knockouts</p>

                            <div className="space-y-4 relative z-10">
                                {executioners.map((p, i) => (
                                    <div key={p.name} className={`flex items-center justify-between p-3 ${i === 0 ? 'bg-ept-red/20 border border-ept-red/30 rounded-lg' : 'border-b border-zinc-900'}`}>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xl font-black ${i === 0 ? 'text-ept-red' : 'text-zinc-600'}`}>#{i + 1}</span>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border-2 ${i === 0 ? 'border-ept-red' : 'border-zinc-800'}`}>
                                                    <img src={getAvatarFilename(p.name)} alt={p.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className={`font-bold uppercase ${i === 0 ? 'text-white' : 'text-zinc-400'}`}>{p.name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-2xl font-black ${i === 0 ? 'text-ept-red drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'text-zinc-500'}`}>{p.totalHistoricalKOs}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase block">KOs</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* The Apex Predator */}
                        <div className="border-4 border-gold bg-black p-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-10 pointer-events-none" />
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Crosshair size={120} />
                            </div>
                            <h2 className="text-2xl font-black text-gold uppercase mb-6 flex items-center gap-2">
                                <Crosshair className="w-6 h-6" /> The Apex Predator
                            </h2>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-900 pb-2">Highest KO-To-Game Ratio</p>

                            <div className="space-y-4 relative z-10">
                                {predators.map((p, i) => (
                                    <div key={p.name} className={`flex items-center justify-between p-3 ${i === 0 ? 'bg-gold/10 border border-gold/30 rounded-lg' : 'border-b border-zinc-900'}`}>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xl font-black ${i === 0 ? 'text-gold' : 'text-zinc-600'}`}>#{i + 1}</span>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border-2 ${i === 0 ? 'border-gold' : 'border-zinc-800'}`}>
                                                    <img src={getAvatarFilename(p.name)} alt={p.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className={`font-bold uppercase ${i === 0 ? 'text-white' : 'text-zinc-400'}`}>{p.name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-2xl font-black ${i === 0 ? 'text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]' : 'text-zinc-500'}`}>{p.koToGameRatio}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase block">KO / Game</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* The Bullet Sponge */}
                        <div className="border-4 border-zinc-700 bg-black p-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-10 pointer-events-none" />
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ShieldAlert size={120} />
                            </div>
                            <h2 className="text-2xl font-black text-zinc-400 uppercase mb-6 flex items-center gap-2">
                                <ShieldAlert className="w-6 h-6" /> The Bullet Sponge
                            </h2>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-900 pb-2">Most Times Knocked Out</p>

                            <div className="space-y-4 relative z-10">
                                {sponges.map((p, i) => (
                                    <div key={p.name} className={`flex items-center justify-between p-3 ${i === 0 ? 'bg-zinc-800/40 border border-zinc-700 rounded-lg' : 'border-b border-zinc-900'}`}>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xl font-black ${i === 0 ? 'text-zinc-300' : 'text-zinc-600'}`}>#{i + 1}</span>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border-2 ${i === 0 ? 'border-zinc-500' : 'border-zinc-800'}`}>
                                                    <img src={getAvatarFilename(p.name)} alt={p.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className={`font-bold uppercase ${i === 0 ? 'text-white' : 'text-zinc-400'}`}>{p.name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-2xl font-black ${i === 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>{p.totalTimesKnockedOut}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase block">Times KO'd</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* The Hijack King */}
                        <div className="border-4 border-purple-800 bg-black p-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-10 pointer-events-none" />
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Zap size={120} />
                            </div>
                            <h2 className="text-2xl font-black text-purple-400 uppercase mb-6 flex items-center gap-2">
                                <Zap className="w-6 h-6" /> The Hijack King
                            </h2>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-900 pb-2">Most Rival Lockouts</p>

                            <div className="space-y-4 relative z-10">
                                {hijackKings.map((p, i) => (
                                    <div key={p.name} className={`flex items-center justify-between p-3 ${i === 0 ? 'bg-purple-950/40 border border-purple-500/40 rounded-lg' : 'border-b border-zinc-900'}`}>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xl font-black ${i === 0 ? 'text-purple-400' : 'text-zinc-600'}`}>#{i + 1}</span>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border-2 ${i === 0 ? 'border-purple-500' : 'border-zinc-800'}`}>
                                                    <img src={getAvatarFilename(p.name)} alt={p.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className={`font-bold uppercase ${i === 0 ? 'text-white' : 'text-zinc-400'}`}>{p.name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-2xl font-black ${i === 0 ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-zinc-500'}`}>{p.uniquePlayersHijacked?.length || 0}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase block">Targets</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 2: WANTED POSTERS */}
            {activeTab === 'wanted' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black uppercase text-gold tracking-wider flex items-center gap-2">
                                <Skull className="w-6 h-6 text-ept-red" />
                                <span>Western Hit List &amp; Bounty Posters</span>
                            </h2>
                            <p className="text-xs text-zinc-400 mt-1">
                                Click any poster to view bounty target details, points reward, and live lockout status.
                            </p>
                        </div>
                        <span className="hidden sm:inline-block px-3 py-1 bg-gold/10 border border-gold/40 rounded-full text-gold font-mono text-xs font-bold">
                            {sortedForWanted.length} Targets Active
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                        {sortedForWanted.map((player) => (
                            <WantedPosterCard 
                                key={player.name} 
                                player={player} 
                                isTarget={player.name.includes('Edward') || player.rank === 1} 
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
