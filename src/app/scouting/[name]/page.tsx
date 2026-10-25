
import type { Metadata } from 'next';
import { getLeaderboardData } from "@/lib/data";
import { generateScoutingReport } from "@/lib/report-generator";
import { ArrowLeft, Target, Trophy, Skull, TrendingUp } from 'lucide-react';
import CashFlowChart from "@/components/CashFlowChart";
import Link from 'next/link';
import { notFound } from 'next/navigation';
import HijackWrapper from "@/components/HijackWrapper";
import AttackButton from "@/components/AttackButton";
import PlayerAcademyCoachingProfile from "@/components/scouting/PlayerAcademyCoachingProfile";
import WantedVideo from "@/components/WantedVideo";
import { getAvatarFilename } from "@/lib/avatars";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    return {
        title: `${decodedName} - Scouting Report`,
        description: `Career statistics, nemesis matchups, finish positions, and telemetry for ${decodedName} in the E.P.T. 2026 Poker League.`,
        openGraph: {
            title: `${decodedName} | E.P.T. 2026 Scouting Dossier`,
            description: `Career statistics, nemesis matchups, and telemetry for ${decodedName}.`,
            images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `${decodedName} Scouting Report` }],
        },
    };
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
        <HijackWrapper
            playerName={player.name}
            enemyQueue={player.enemyQueue || []}
            hijackerQueue={player.hijackerQueue || []}
            isServerHijacked={player.isHijacked || false}
        >
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <Link href="/scouting" className="inline-flex items-center text-zinc-500 hover:text-gold transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scouting
                </Link>

                {/* Header Profile */}
                <div className="glass-panel p-4 sm:p-8 rounded-2xl border-t-4 border-gold relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-7xl sm:text-9xl text-white select-none pointer-events-none">
                        {player.rank}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 sm:gap-8 items-center md:items-start relative z-10">
                        {/* Dual Media Showcase: AI Video + 8-Bit Character */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="relative h-28 w-28 sm:h-40 sm:w-40 rounded-2xl bg-charcoal-dark border-4 border-gold/60 overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.35)]">
                                <WantedVideo
                                    playerName={player.name}
                                    className="absolute inset-0 w-full h-full object-cover object-top z-10"
                                />
                                <img
                                    src={getAvatarFilename(player.name)}
                                    alt={player.name}
                                    className="w-full h-full object-cover object-top"
                                />
                                <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-black/80 border border-gold/40 text-[9px] font-mono font-black uppercase tracking-wider text-gold">
                                    🎬 AI Video
                                </span>
                            </div>

                            <div className="relative h-24 w-24 sm:h-36 sm:w-32 rounded-2xl bg-zinc-950 border-2 border-amber-400/50 overflow-hidden shadow-lg">
                                <img
                                    src={getAvatarFilename(player.name)}
                                    alt={`${player.name} 8-Bit Character`}
                                    className="w-full h-full object-cover object-top"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                <span className="absolute bottom-1.5 inset-x-1.5 z-20 px-1.5 py-0.5 rounded bg-black/85 border border-amber-400/40 text-[8px] font-mono font-black uppercase tracking-wider text-amber-300 text-center">
                                    👾 8-Bit Avatar
                                </span>
                            </div>
                        </div>

                        <div className="text-center md:text-left w-full">
                            <div className="inline-block px-3 py-1 bg-gold/10 text-gold text-xs font-bold uppercase tracking-wider rounded-full mb-2">
                                Rank #{player.rank}
                            </div>
                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 break-words">{player.name}</h1>

                            {/* Dynamic Season Telemetry Badges (Feature 1) */}
                            {player.badges && player.badges.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {player.badges.map(badge => (
                                        <span
                                            key={badge.id}
                                            title={badge.description}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${badge.color}`}
                                        >
                                            <span>{badge.icon}</span>
                                            <span>{badge.label}</span>
                                        </span>
                                    ))}
                                    {player.vpip !== undefined && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white/5 border border-white/10 text-zinc-300">
                                            <span className="text-zinc-500">VPIP:</span> {player.vpip}%
                                        </span>
                                    )}
                                    {player.aggressionFactor !== undefined && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white/5 border border-white/10 text-zinc-300">
                                            <span className="text-zinc-500">AF:</span> {player.aggressionFactor}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-2 sm:gap-8 mt-4 sm:mt-6 bg-black/30 md:bg-transparent p-3 md:p-0 rounded-xl border border-white/5 md:border-none">
                                <div>
                                    <div className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider font-bold">Points</div>
                                    <div className="text-lg sm:text-3xl font-bold text-white">{player.points}</div>
                                </div>
                                <div>
                                    <div className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider font-bold">Winnings</div>
                                    <div className="text-lg sm:text-3xl font-bold text-green-400">£{player.winnings}</div>
                                </div>
                                <div>
                                    <div className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider font-bold">Profit</div>
                                    <div className={`text-lg sm:text-3xl font-bold ${player.profit >= 0 ? 'text-green-500' : 'text-ept-red'}`}>
                                        {player.profit >= 0 ? '+' : ''}{player.profit}
                                    </div>
                                </div>
                            </div>

                            {/* Module 2: Attack Button */}
                            <div className="mt-6 sm:mt-8 flex justify-center md:justify-start">
                                <AttackButton targetName={player.name} isTargetHijacked={player.isHijacked || false} />
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

                    {/* Arch-Nemesis & Rivalries Card */}
                    <div className="glass-panel p-6 rounded-xl border-l-4 border-ept-red">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Skull className="text-ept-red" /> Arch-Nemesis & Rivalries
                            </span>
                            <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 tracking-wider">
                                Head-to-Head
                            </span>
                        </h3>
                        <div className="space-y-4">
                            {/* Arch-Nemesis Highlight Card */}
                            {player.archNemesis && player.archNemesis.name !== 'None' ? (
                                <div className="p-4 bg-gradient-to-r from-red-950/40 via-charcoal-card to-red-950/20 border border-ept-red/40 rounded-xl relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-ept-red flex items-center gap-1">
                                            <span>⚔️</span> Arch-Nemesis
                                        </span>
                                        <span className="text-xs font-mono font-black text-ept-red px-2 py-0.5 rounded bg-ept-red/20 border border-ept-red/40">
                                            {player.archNemesis.knockouts} Eliminating KOs
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <img
                                            src={getAvatarFilename(player.archNemesis.name)}
                                            alt={player.archNemesis.name}
                                            className="w-10 h-10 rounded-lg border border-ept-red/50 object-cover bg-zinc-900"
                                        />
                                        <div className="text-xl font-black text-white">
                                            {player.archNemesis.name}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-white/10">
                                        <span className="text-zinc-400">Head-to-Head Record:</span>
                                        <span className={`font-mono font-bold ${player.archNemesis.chipDifferential >= 0 ? 'text-green-400' : 'text-ept-red'}`}>
                                            {player.archNemesis.headToHeadNotes}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-ept-red/10 border border-ept-red/20 rounded-lg">
                                    <div className="text-xs font-bold uppercase tracking-widest text-ept-red mb-2">My Nemesis</div>
                                    <div className="flex items-center gap-3">
                                        {player.rivalPlayer && player.rivalPlayer !== 'None' && (
                                            <img
                                                src={getAvatarFilename(player.rivalPlayer)}
                                                alt={player.rivalPlayer}
                                                className="w-10 h-10 rounded-lg border border-ept-red/40 object-cover bg-zinc-900"
                                            />
                                        )}
                                        <span className="text-lg font-bold text-white">{player.rivalPlayer || "None"}</span>
                                    </div>
                                </div>
                            )}

                            {/* Bullied Player */}
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <div className="text-xs font-bold uppercase tracking-widest text-green-500 mb-1">My Pigeon (Favorite Target)</div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {player.bulliedPlayer && player.bulliedPlayer !== 'None' && (
                                            <img
                                                src={getAvatarFilename(player.bulliedPlayer)}
                                                alt={player.bulliedPlayer}
                                                className="w-9 h-9 rounded-lg border border-green-500/40 object-cover bg-zinc-900"
                                            />
                                        )}
                                        <span className="text-base font-bold text-white">{player.bulliedPlayer || "None"}</span>
                                    </div>
                                    <span className="text-xs font-mono text-green-400 font-bold">Exploited Target</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* End 2-col Grid */}

                {/* AI Poker Academy & Personalized Game Improvement Plan */}
                <PlayerAcademyCoachingProfile playerName={player.name} />

                {/* Analyst Report */}
                <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Trophy size={120} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-gold">★</span> The Analyst&apos;s Take
                        </h3>
                        <div className="prose prose-invert max-w-none">
                            <h4 className="text-2xl font-black text-white italic tracking-tight mb-4">&quot;{report.headline}&quot;</h4>
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
        </HijackWrapper>
    );
}
