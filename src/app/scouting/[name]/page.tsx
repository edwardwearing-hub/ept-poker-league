
import { getLeaderboardData } from "@/lib/data";
import { generateScoutingReport } from "@/lib/report-generator";
import { ArrowLeft, Target, Trophy, Skull, TrendingUp } from 'lucide-react';
import CashFlowChart from "@/components/CashFlowChart";
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 0;

interface Props {
    params: Promise<{ name: string }>;
}

export default async function PlayerProfile({ params }: Props) {
    // Await the params object
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const players = await getLeaderboardData();
    const player = players.find(p => p.name === decodedName);

    if (!player) {
        notFound();
    }

    const report = generateScoutingReport(player);

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <Link href="/scouting" className="inline-flex items-center text-zinc-500 hover:text-gold transition-colors mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scouting
            </Link>

            {/* Header Profile */}
            <div className="glass-panel p-8 rounded-2xl border-t-4 border-gold relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-9xl text-white select-none pointer-events-none">
                    {player.rank}
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                    <div className="h-32 w-32 rounded-full bg-charcoal-dark border-4 border-gold/20 flex items-center justify-center text-5xl font-bold text-zinc-600">
                        {player.name.charAt(0)}
                    </div>

                    <div className="text-center md:text-left">
                        <div className="inline-block px-3 py-1 bg-gold/10 text-gold text-xs font-bold uppercase tracking-wider rounded-full mb-2">
                            Rank #{player.rank}
                        </div>
                        <h1 className="text-5xl font-extrabold text-white mb-2">{player.name}</h1>
                        <div className="grid grid-cols-3 gap-8 mt-6">
                            <div>
                                <div className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Points</div>
                                <div className="text-3xl font-bold text-white">{player.points}</div>
                            </div>
                            <div>
                                <div className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Winnings</div>
                                <div className="text-3xl font-bold text-green-400">£{player.winnings}</div>
                            </div>
                            <div>
                                <div className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Profit</div>
                                <div className={`text-3xl font-bold ${player.profit >= 0 ? 'text-green-500' : 'text-ept-red'}`}>
                                    {player.profit >= 0 ? '+' : ''}{player.profit}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Combat Stats */}
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Target className="text-ept-red" /> Aggression Stats
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-zinc-400">Knock Outs</span>
                            <span className="text-xl font-bold text-white">{player.knockOuts} ☠️</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-zinc-400">Games Played</span>
                            <span className="text-xl font-bold text-white">{player.gamesPlayed}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-zinc-400">Survival Rate</span>
                            <span className="text-xl font-bold text-white">
                                {player.gamesPlayed > 0 ? Math.round(((player.gamesPlayed - player.rebuys) / player.gamesPlayed) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Rivals */}
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Skull className="text-zinc-400" /> Rivalries
                    </h3>
                    <div className="space-y-4">
                        {/* Primary Rival */}
                        <div className="p-4 bg-ept-red/10 border border-ept-red/20 rounded-lg">
                            <div className="text-xs font-bold uppercase tracking-widest text-ept-red mb-2">My Nemesis</div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-white">{player.rivalPlayer || "None"}</span>
                            </div>
                        </div>

                        {/* Bullied Player */}
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="text-xs font-bold uppercase tracking-widest text-green-500 mb-2">My Pigeon (Bullied)</div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-white">{player.bulliedPlayer || "None"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* End 2-col Grid */}

            {/* Analyst Report */}
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Trophy size={120} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-gold">★</span> The Analyst's Take
                    </h3>
                    <div className="prose prose-invert max-w-none">
                        <h4 className="text-2xl font-black text-white italic tracking-tight mb-4">"{report.headline}"</h4>
                        <p className="text-lg text-zinc-300 leading-relaxed">
                            {report.body}
                        </p>
                    </div>
                </div>
            </div>

            {/* Cash Flow Chart */}
            <div className="glass-panel p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="text-gold" /> Season Cash Flow
                </h3>
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                    <CashFlowChart data={player.cashFlowHistory || []} />
                </div>
            </div>
        </div >
    );
}
