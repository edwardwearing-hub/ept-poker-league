import { getLeaderboardData } from "@/lib/data";
import WantedPosterCard from "@/components/WantedPosterCard";
import { Users } from "lucide-react";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function WantedPage() {
    const players = await getLeaderboardData();

    // Sort by points desc (Leaderboard order)
    const sortedPlayers = [...players].sort((a, b) => a.rank - b.rank);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                <div className="p-3 bg-ept-red/10 rounded-lg text-ept-red border border-ept-red/20">
                    <Users size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase mb-1">Most Wanted</h1>
                    <p className="text-zinc-400 text-sm max-w-xl">
                        The official bounty board of E.P.T. 2026. Rewards are issued in points.
                        Hunt them down.
                    </p>
                </div>
                <div className="hidden md:block ml-auto text-right">
                    <div className="text-gold font-bold text-lg">Total Targets</div>
                    <div className="text-3xl font-black text-white">{players.length}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4 pb-12">
                {sortedPlayers.map((player) => (
                    <WantedPosterCard key={player.name} player={player} isTarget={player.name.includes('Edward')} />
                ))}
            </div>
        </div>
    );
}
