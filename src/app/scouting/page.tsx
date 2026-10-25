import type { Metadata } from 'next';
import { getLeaderboardData } from "@/lib/data";
import Link from 'next/link';
import WantedVideo from "@/components/WantedVideo";
import { getAvatarFilename } from "@/lib/avatars";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Player Scouting Reports & Rival Intelligence',
    description: 'Detailed dossiers, play-style tendencies, nemesis matchups, re-buy averages, bubble finishes, and head-to-head records for all league contenders.',
    openGraph: {
        title: 'Player Scouting Reports | E.P.T. 2026',
        description: 'Detailed dossiers, play-style tendencies, and head-to-head records for all league contenders.',
        url: '/scouting',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'EPT Scouting Reports' }],
    },
};

export default async function ScoutingPage() {
    const players = await getLeaderboardData();

    return (
        <div className="space-y-8">
            <header className="border-b border-white/10 pb-6">
                <h1 className="text-4xl font-extrabold text-white">Scouting <span className="text-gold">Reports</span></h1>
                <p className="text-zinc-400 mt-2">
                    Analyze your rivals. Official Google Sheet dossiers including £10 unit financials, re-buy averages, dynamic bubble finishes, and head-to-head knockout records.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.map((player) => {
                    const avgRebuys =
                        player.gamesPlayed > 0
                            ? ((player.rebuys || 0) / player.gamesPlayed).toFixed(2)
                            : '0.00';

                    return (
                        <Link key={player.name} href={`/scouting/${encodeURIComponent(player.name)}`}>
                            <div className="glass-panel p-6 rounded-xl hover:bg-white/5 transition-all group flex items-start gap-4 border border-white/5 hover:border-gold/30">
                                <div className="relative h-20 w-20 shrink-0">
                                    <div className="relative h-20 w-20 rounded-2xl bg-charcoal-dark border-2 border-white/15 group-hover:border-gold overflow-hidden transition-colors shadow-lg">
                                        <WantedVideo
                                            playerName={player.name}
                                            className="absolute inset-0 w-full h-full object-cover object-top z-10"
                                        />
                                        <img
                                            src={getAvatarFilename(player.name)}
                                            alt={player.name}
                                            className="w-full h-full object-cover object-top"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-lg bg-zinc-950 border border-gold/60 overflow-hidden z-20 shadow-md">
                                        <img
                                            src={getAvatarFilename(player.name)}
                                            alt={`${player.name} 8-bit`}
                                            className="w-full h-full object-cover object-top"
                                            style={{ imageRendering: 'pixelated' }}
                                        />
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors truncate">{player.name}</h3>
                                    <div className="text-xs text-zinc-400 mt-0.5">
                                        Rank #{player.rank} • {player.gamesPlayed} Gms {player.nickname ? `• "${player.nickname}"` : ''}
                                    </div>
                                    <div className="flex flex-wrap gap-2.5 mt-3 text-xs font-mono">
                                        <span className="text-gold font-bold">{player.points} Pts</span>
                                        <span className="text-green-400">W: {player.wins}</span>
                                        <span className="text-ept-red font-bold">KO: {player.knockOuts}</span>
                                        <span className={player.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                            {player.profit >= 0 ? `+£${player.profit}` : `-£${Math.abs(player.profit)}`}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-400">
                                        <span className="text-blue-300">
                                            Reb: {player.rebuys || 0} (Max {player.mostRebuysSingle || 0} • {avgRebuys}/gm)
                                        </span>
                                        <span>•</span>
                                        <span className="text-purple-300">
                                            Bubbles: {player.bubbleFinishes || 0} 🫧
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
