
import { getLeaderboardData } from "@/lib/data";
import Link from 'next/link';

export const revalidate = 0;

export default async function ScoutingPage() {
    const players = await getLeaderboardData();

    return (
        <div className="space-y-8">
            <header className="border-b border-white/10 pb-6">
                <h1 className="text-4xl font-extrabold text-white">Scouting <span className="text-gold">Reports</span></h1>
                <p className="text-zinc-400 mt-2">Analyze your rivals. Know their weaknesses.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.map((player) => (
                    <Link key={player.name} href={`/scouting/${player.name}`}>
                        <div className="glass-panel p-6 rounded-xl hover:bg-white/5 transition-all group flex items-start gap-4">
                            <div className="h-16 w-16 rounded-full bg-charcoal-dark border border-white/10 flex items-center justify-center text-2xl font-bold text-zinc-600 group-hover:text-gold group-hover:border-gold transition-colors">
                                {player.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">{player.name}</h3>
                                <div className="text-sm text-zinc-500 mt-1">Rank #{player.rank}</div>
                                <div className="flex gap-3 mt-3 text-xs font-mono">
                                    <span className="text-green-500">W: {player.wins}</span>
                                    <span className="text-ept-red">KO: {player.knockOuts}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
