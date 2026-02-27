import { getLeaderboardData } from "@/lib/data";
import Link from "next/link";
import { ArrowLeft, Target, ShieldAlert, Skull, Crosshair } from 'lucide-react';
import Image from "next/image";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const getAvatarFilename = (name: string) => `/avatars/avatar_${name.toLowerCase().replace(' ', '_')}.png`;

export default async function BountyBoard() {
    const players = await getLeaderboardData();

    // The Executioner: Most total KOs
    const executioners = [...players].sort((a, b) => (b.totalHistoricalKOs || 0) - (a.totalHistoricalKOs || 0)).slice(0, 3);

    // The Apex Predator: Highest KO-to-Game ratio
    const predators = [...players].sort((a, b) => (b.koToGameRatio || 0) - (a.koToGameRatio || 0)).slice(0, 3);

    // The Bullet Sponge: Most times knocked out
    const sponges = [...players].sort((a, b) => (b.totalTimesKnockedOut || 0) - (a.totalTimesKnockedOut || 0)).slice(0, 3);

    // The Hijack King: Most unique players hijacked
    const hijackKings = [...players].sort((a, b) => (b.uniquePlayersHijacked?.length || 0) - (a.uniquePlayersHijacked?.length || 0)).slice(0, 3);

    return (
        <div className="min-h-screen bg-black text-white font-mono p-4 md:p-8 animate-in fade-in duration-700">
            <div className="max-w-6xl mx-auto space-y-12">
                <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-ept-red transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Link>

                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-ept-red via-red-500 to-orange-500 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        Bounty Board
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base border-y border-zinc-800 py-4">
                        LIVE GLOBAL ASSASSINATION TRACKING. ONLY THE RUTHLESS SURVIVE.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                        <span className={`text-2xl font-black ${i === 0 ? 'text-gold drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-zinc-500'}`}>{p.koToGameRatio}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase block">Per Game</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* The Hijack King */}
                    <div className="border-4 border-green-500 bg-black p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-10 pointer-events-none" />
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Skull size={120} />
                        </div>
                        <h2 className="text-2xl font-black text-green-500 uppercase mb-6 flex items-center gap-2">
                            <Skull className="w-6 h-6" /> The Hijack King
                        </h2>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-900 pb-2">Most UNIQUE Profiles Hijacked</p>

                        <div className="space-y-4 relative z-10">
                            {hijackKings.map((p, i) => (
                                <div key={p.name} className={`flex items-center justify-between p-3 ${i === 0 ? 'bg-green-500/10 border border-green-500/30 rounded-lg' : 'border-b border-zinc-900'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xl font-black ${i === 0 ? 'text-green-500' : 'text-zinc-600'}`}>#{i + 1}</span>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border-2 ${i === 0 ? 'border-green-500' : 'border-zinc-800'}`}>
                                                <img src={getAvatarFilename(p.name)} alt={p.name} className="w-full h-full object-cover" />
                                            </div>
                                            <span className={`font-bold uppercase ${i === 0 ? 'text-white' : 'text-zinc-400'}`}>{p.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-2xl font-black ${i === 0 ? 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'text-zinc-500'}`}>{p.uniquePlayersHijacked?.length || 0}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase block">Victims</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* The Bullet Sponge */}
                    <div className="border-4 border-blue-500 bg-black p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-10 pointer-events-none" />
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldAlert size={120} />
                        </div>
                        <h2 className="text-2xl font-black text-blue-500 uppercase mb-6 flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6" /> The Bullet Sponge
                        </h2>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-900 pb-2">Most Times Knocked Out (Total)</p>

                        <div className="space-y-4 relative z-10">
                            {sponges.map((p, i) => (
                                <div key={p.name} className={`flex items-center justify-between p-3 ${i === 0 ? 'bg-blue-500/10 border border-blue-500/30 rounded-lg' : 'border-b border-zinc-900'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xl font-black ${i === 0 ? 'text-blue-500' : 'text-zinc-600'}`}>#{i + 1}</span>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border-2 ${i === 0 ? 'border-blue-500' : 'border-zinc-800'}`}>
                                                <img src={getAvatarFilename(p.name)} alt={p.name} className="w-full h-full object-cover grayscale" />
                                            </div>
                                            <span className={`font-bold uppercase ${i === 0 ? 'text-white' : 'text-zinc-400'}`}>{p.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-2xl font-black ${i === 0 ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-zinc-500'}`}>{p.totalTimesKnockedOut || 0}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase block">Deaths</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
