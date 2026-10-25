import type { Metadata } from "next";
import StatCorner from "@/components/StatCorner";
import LeagueSubNav from "@/components/LeagueSubNav";
import { getLeaderboardData, getGlobalStats, getGameHistory } from "@/lib/data";
import Link from "next/link";
import {
    Coins,
    Trophy,
    Skull,
    TrendingUp,
    Users,
    RefreshCw,
    AlertCircle,
    Award,
    Target,
    Layers,
    BarChart3,
} from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Player Statistics & League Analytics",
    description:
        "Deep-dive statistical graphs, season highs, knockout ratios, re-buy averages, bubble finishes, and profit trajectories for the E.P.T. 2026 Season.",
    openGraph: {
        title: "Player Statistics & League Analytics | E.P.T. 2026",
        description:
            "Deep-dive statistical graphs, season highs, re-buy averages, bubble finishes, and knockout ratios for the E.P.T. 2026 Season.",
        images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "EPT League Statistics" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Player Statistics & League Analytics | E.P.T. 2026",
        description:
            "Deep-dive statistical graphs, season highs, re-buy averages, bubble finishes, and knockout ratios for the E.P.T. 2026 Season.",
        images: ["/og-image.jpg"],
    },
};

export default async function StatsPage() {
    const [players, globalStats, history] = await Promise.all([
        getLeaderboardData(),
        getGlobalStats(),
        getGameHistory(),
    ]);

    const gamesCompleted = history.length || Math.max(...players.map((p) => p.gamesPlayed || 0), 0);
    const totalEntries = players.reduce((acc, p) => acc + (p.gamesPlayed || 0), 0);
    const totalRebuys = players.reduce((acc, p) => acc + (p.rebuys || 0), 0);
    const totalAddOns = players.reduce((acc, p) => acc + (p.addOns || 0), 0);
    const totalMoneySpent = players.reduce((acc, p) => acc + (p.cashPaid || 0), 0);
    const totalWinningsPaid = players.reduce((acc, p) => acc + (p.winnings || 0), 0);
    const totalNightlyPots = history.reduce((acc, g) => acc + (g.prizePot || 0), 0) || totalWinningsPaid;
    const totalKOs = players.reduce((acc, p) => acc + (p.knockOuts || 0), 0);
    const totalPoints = players.reduce((acc, p) => acc + (p.points || 0), 0);
    const totalBonusChips = players.reduce((acc, p) => acc + (p.bonusChips || 0), 0);
    const totalBubbles = players.reduce((acc, p) => acc + (p.bubbleFinishes || 0), 0);

    const avgPlayersPerGame = gamesCompleted > 0 ? (totalEntries / gamesCompleted).toFixed(1) : "0.0";
    const avgPotPerGame = gamesCompleted > 0 ? Math.round(totalNightlyPots / gamesCompleted) : 0;
    const avgKOsPerGame = gamesCompleted > 0 ? (totalKOs / gamesCompleted).toFixed(1) : "0.0";
    const avgRebuysPerGameLeague = gamesCompleted > 0 ? (totalRebuys / gamesCompleted).toFixed(2) : "0.00";
    const addOnRate = totalEntries > 0 ? Math.round((totalAddOns / totalEntries) * 100) : 0;

    // Season Highs from history + players
    let biggestPot = 0;
    let biggestPotDate = "";
    let smallestPot = Infinity;
    let smallestPotDate = "";
    let highestSingleWin = 0;
    let highestSingleWinner = "";
    let mostKOsSingleGame = 0;
    let mostKOsSinglePlayer = "";

    history.forEach((session) => {
        if (session.prizePot > biggestPot) {
            biggestPot = session.prizePot;
            biggestPotDate = session.date;
        }
        if (session.prizePot > 0 && session.prizePot < smallestPot) {
            smallestPot = session.prizePot;
            smallestPotDate = session.date;
        }
        session.results.forEach((r) => {
            if (r.winnings > highestSingleWin) {
                highestSingleWin = r.winnings;
                highestSingleWinner = `${r.name} (${session.date})`;
            }
            if ((r.kos || 0) > mostKOsSingleGame) {
                mostKOsSingleGame = r.kos || 0;
                mostKOsSinglePlayer = `${r.name} (${session.date})`;
            }
        });
    });
    if (smallestPot === Infinity) smallestPot = 0;

    const profitLeader = [...players].sort((a, b) => b.profit - a.profit)[0];
    const koLeader = [...players].sort((a, b) => b.knockOuts - a.knockOuts)[0];
    const bubbleLeader = [...players].sort((a, b) => (b.bubbleFinishes || 0) - (a.bubbleFinishes || 0))[0];
    const rebuyLeader = [...players].sort((a, b) => (b.rebuys || 0) - (a.rebuys || 0))[0];

    return (
        <div className="space-y-8 animate-in float-in-from-bottom-4 duration-700">
            <LeagueSubNav />

            <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono font-bold uppercase tracking-widest">
                    <BarChart3 className="w-3.5 h-3.5" /> Official Master Sheet Telemetry
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    League <span className="text-gold">Statistics &amp; Analytics</span>
                </h1>
                <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
                    Live macro-economic totals, £10 unit breakdown, re-buy averages, dynamic bubble finishes, and week-by-week knockout telemetry from the E.P.T. 2026 Google Sheet.
                </p>
            </div>

            {/* Top Row: StatCorner + Season Highs & Macro Economy */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-1">
                    <StatCorner />
                </div>

                {/* Macro League Financial & Action Ledger */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 bg-zinc-900/60 flex flex-col justify-between space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <Coins className="w-5 h-5 text-gold" />
                                Season Macro Economy (@ £10 Fixed Unit Pricing)
                            </h2>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Every Buy-In, Re-Buy, and Add-On is fixed at £10 each across all {gamesCompleted} completed games.
                            </p>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                            {gamesCompleted} / 10 Games Complete
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                                Total Money Spent
                            </span>
                            <div className="text-2xl font-black font-mono text-white mt-1">
                                £{totalMoneySpent.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                                {totalEntries + totalRebuys + totalAddOns} × £10 units
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                                Buy-Ins (@ £10)
                            </span>
                            <div className="text-2xl font-black font-mono text-sky-400 mt-1">
                                £{(totalEntries * 10).toLocaleString()}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                                {totalEntries} Seats ({avgPlayersPerGame}/gm)
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                                Re-Buys (@ £10)
                            </span>
                            <div className="text-2xl font-black font-mono text-orange-400 mt-1">
                                £{(totalRebuys * 10).toLocaleString()}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                                {totalRebuys} Re-Buys ({avgRebuysPerGameLeague}/gm)
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                                Add-Ons (@ £10)
                            </span>
                            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                                £{(totalAddOns * 10).toLocaleString()}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                                {totalAddOns} Add-Ons ({addOnRate}% uptake)
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-500/25">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                                Nightly Pots Paid
                            </span>
                            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                                £{totalWinningsPaid.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                                Avg £{avgPotPerGame}/night (77.1%)
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/50 border border-gold/30">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                                Grand Final Vault
                            </span>
                            <div className="text-2xl font-black font-mono text-gold mt-1">
                                £{globalStats.totalPot.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                                Side Pot Reserve (22.9%)
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/50 border border-ept-red/30">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-ept-red block">
                                Total Knockouts
                            </span>
                            <div className="text-2xl font-black font-mono text-ept-red mt-1">
                                {totalKOs} ☠️
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                                Avg {avgKOsPerGame} KOs / Game
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/50 border border-purple-500/30">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                                League Points &amp; Bonus
                            </span>
                            <div className="text-2xl font-black font-mono text-purple-300 mt-1">
                                {totalPoints} Pts
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                                {(totalBonusChips / 1000).toFixed(0)}k Bonus Chips
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Season Highs & Record Holders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-gold/30 bg-zinc-900/50">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gold mb-2">
                        <span>Biggest Nightly Pot</span>
                        <Trophy className="w-4 h-4" />
                    </div>
                    <div className="text-3xl font-black font-mono text-white">£{biggestPot}</div>
                    <p className="text-xs text-zinc-400 mt-1 font-mono">
                        {biggestPotDate} • Min Pot: £{smallestPot} ({smallestPotDate})
                    </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-zinc-900/50">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                        <span>Highest Single-Game Payout</span>
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="text-3xl font-black font-mono text-emerald-400">£{highestSingleWin}</div>
                    <p className="text-xs text-zinc-400 mt-1 font-mono truncate">
                        {highestSingleWinner} • Top Net Profit: {profitLeader?.name} (+£{profitLeader?.profit})
                    </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-ept-red/30 bg-zinc-900/50">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ept-red mb-2">
                        <span>Most KOs (Single Game)</span>
                        <Skull className="w-4 h-4" />
                    </div>
                    <div className="text-3xl font-black font-mono text-ept-red">{mostKOsSingleGame} KOs ☠️</div>
                    <p className="text-xs text-zinc-400 mt-1 font-mono truncate">
                        {mostKOsSinglePlayer} • Season Leader: {koLeader?.name} ({koLeader?.knockOuts})
                    </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 bg-zinc-900/50">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                        <span>Bubble &amp; Re-Buy Records</span>
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="text-3xl font-black font-mono text-purple-300">
                        {bubbleLeader?.bubbleFinishes || 0} Bubbles 🫧
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 font-mono truncate">
                        {bubbleLeader?.name} ({bubbleLeader?.bubbleFinishes}x) • Most Re-Buys: {rebuyLeader?.name} ({rebuyLeader?.rebuys})
                    </p>
                </div>
            </div>

            {/* Complete 11-Player Statistical Matrix */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-zinc-950/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <Layers className="w-5 h-5 text-gold" />
                            Complete Player Statistical Telemetry
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Includes Re-Buy Averages (Total Re-Buys ÷ Games Played), Max Single-Game Re-Buys (Row 23 ÷ £10), Dynamic Bubble Finishes (1 spot outside the money), and KO Logs (Rows 17–21 &amp; 27–37).
                        </p>
                    </div>
                    <Link
                        href="/presentation"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/15 border border-gold/40 text-gold text-xs font-black uppercase tracking-wider hover:bg-gold hover:text-black transition-all self-start"
                    >
                        <span>📺 Launch TV Presentation</span>
                    </Link>
                </div>

                <div className="w-full overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="text-[10px] uppercase bg-white/5 text-zinc-400 border-b border-white/10">
                            <tr>
                                <th className="px-3 py-3 text-center font-bold text-white">#</th>
                                <th className="px-3 py-3 font-bold text-white whitespace-nowrap">Player</th>
                                <th className="px-2.5 py-3 text-center">Gms</th>
                                <th className="px-2.5 py-3 text-center">Wins (Win%)</th>
                                <th className="px-2.5 py-3 text-center text-gold font-bold">Pts (Avg)</th>
                                <th className="px-2.5 py-3 text-center">Avg Pos</th>
                                <th className="px-2.5 py-3 text-center text-purple-300 font-bold" title="Finished 1 position after money cutoff">
                                    Bubbles 🫧
                                </th>
                                <th className="px-2.5 py-3 text-center text-blue-300 font-bold" title="Total Re-Buys, Max in Single Game (Row 23), and Avg Re-Buys / Game">
                                    Re-Buys (Max • Avg/Gm)
                                </th>
                                <th className="px-2.5 py-3 text-center">Add-Ons</th>
                                <th className="px-2.5 py-3 text-center">Paid (@£10)</th>
                                <th className="px-2.5 py-3 text-center text-emerald-400 font-bold">Won (Avg)</th>
                                <th className="px-2.5 py-3 text-center font-bold">Profit (ROI)</th>
                                <th className="px-2.5 py-3 text-center text-ept-red font-bold">KOs (Avg)</th>
                                <th className="px-2.5 py-3 text-center">KO&apos;d</th>
                                <th className="px-3 py-3 whitespace-nowrap">Rival / Target</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                            {players.map((p) => {
                                const avgRebuys =
                                    p.gamesPlayed > 0 ? ((p.rebuys || 0) / p.gamesPlayed).toFixed(2) : "0.00";
                                const winPct =
                                    p.winPercentage !== undefined
                                        ? `${(p.winPercentage * 100).toFixed(1)}%`
                                        : p.gamesPlayed > 0
                                        ? `${(((p.wins || 0) / p.gamesPlayed) * 100).toFixed(1)}%`
                                        : "0.0%";
                                const avgPts =
                                    p.avgPoints !== undefined
                                        ? p.avgPoints.toFixed(1)
                                        : p.gamesPlayed > 0
                                        ? (p.points / p.gamesPlayed).toFixed(1)
                                        : "0.0";
                                const avgWon =
                                    p.avgWinnings !== undefined
                                        ? Math.round(p.avgWinnings)
                                        : p.gamesPlayed > 0
                                        ? Math.round((p.winnings || 0) / p.gamesPlayed)
                                        : 0;
                                const avgKOs =
                                    p.avgKnockouts !== undefined
                                        ? p.avgKnockouts.toFixed(2)
                                        : p.gamesPlayed > 0
                                        ? ((p.knockOuts || 0) / p.gamesPlayed).toFixed(2)
                                        : "0.00";
                                const roi =
                                    (p.cashPaid || 0) > 0
                                        ? `${p.profit >= 0 ? "+" : ""}${Math.round((p.profit / (p.cashPaid || 1)) * 100)}%`
                                        : "0%";

                                return (
                                    <tr key={p.name} className="hover:bg-white/5 transition-colors">
                                        <td className="px-3 py-3 text-center font-bold text-gold">{p.rank}</td>
                                        <td className="px-3 py-3 font-sans font-bold text-white whitespace-nowrap">
                                            <Link
                                                href={`/scouting/${encodeURIComponent(p.name)}`}
                                                className="hover:text-gold transition-colors"
                                            >
                                                {p.name}
                                            </Link>
                                        </td>
                                        <td className="px-2.5 py-3 text-center text-zinc-300">{p.gamesPlayed}</td>
                                        <td className="px-2.5 py-3 text-center text-zinc-300">
                                            {p.wins || 0} <span className="text-[10px] text-zinc-500">({winPct})</span>
                                        </td>
                                        <td className="px-2.5 py-3 text-center font-bold text-gold">
                                            {p.points} <span className="text-[10px] text-zinc-500">({avgPts})</span>
                                        </td>
                                        <td className="px-2.5 py-3 text-center text-cyan-300">
                                            {p.avgFinishPosition && p.avgFinishPosition > 0
                                                ? p.avgFinishPosition.toFixed(1)
                                                : "-"}
                                        </td>
                                        <td className="px-2.5 py-3 text-center font-bold text-purple-300">
                                            {p.bubbleFinishes || 0}
                                        </td>
                                        <td className="px-2.5 py-3 text-center text-blue-300">
                                            <span className="font-bold">{p.rebuys || 0}</span>{" "}
                                            <span className="text-[10px] text-zinc-400">
                                                (Max {p.mostRebuysSingle || 0} • {avgRebuys}/gm)
                                            </span>
                                        </td>
                                        <td className="px-2.5 py-3 text-center text-zinc-300">{p.addOns || 0}</td>
                                        <td className="px-2.5 py-3 text-center text-zinc-300">£{p.cashPaid || 0}</td>
                                        <td className="px-2.5 py-3 text-center font-bold text-emerald-400">
                                            £{p.winnings || 0}{" "}
                                            <span className="text-[10px] text-zinc-500">(£{avgWon})</span>
                                        </td>
                                        <td
                                            className={`px-2.5 py-3 text-center font-bold ${
                                                p.profit > 0
                                                    ? "text-green-400"
                                                    : p.profit < 0
                                                    ? "text-ept-red"
                                                    : "text-zinc-400"
                                            }`}
                                        >
                                            {p.profit >= 0 ? `+£${p.profit}` : `-£${Math.abs(p.profit)}`}{" "}
                                            <span className="text-[10px] opacity-75">({roi})</span>
                                        </td>
                                        <td className="px-2.5 py-3 text-center font-bold text-ept-red">
                                            {p.knockOuts || 0}{" "}
                                            <span className="text-[10px] text-zinc-500">({avgKOs})</span>
                                        </td>
                                        <td className="px-2.5 py-3 text-center text-zinc-400">
                                            {p.totalTimesKnockedOut || 0}
                                        </td>
                                        <td className="px-3 py-3 font-sans text-[11px] whitespace-nowrap">
                                            <span className="text-ept-red font-semibold">
                                                {p.rivalPlayer && p.rivalPlayer !== "None"
                                                    ? p.rivalPlayer.split(" ")[0]
                                                    : "-"}
                                            </span>
                                            <span className="text-zinc-600 mx-1">/</span>
                                            <span className="text-emerald-400 font-semibold">
                                                {p.bulliedPlayer && p.bulliedPlayer !== "None"
                                                    ? p.bulliedPlayer.split(" ")[0]
                                                    : "-"}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-white/5 border-t-2 border-gold/40 font-mono text-xs font-black text-white">
                            <tr>
                                <td className="px-3 py-3 text-center text-gold">Σ</td>
                                <td className="px-3 py-3 font-sans uppercase text-gold">League Totals</td>
                                <td className="px-2.5 py-3 text-center">{totalEntries}</td>
                                <td className="px-2.5 py-3 text-center">{gamesCompleted} Wins</td>
                                <td className="px-2.5 py-3 text-center text-gold">{totalPoints} Pts</td>
                                <td className="px-2.5 py-3 text-center">-</td>
                                <td className="px-2.5 py-3 text-center text-purple-300">{totalBubbles}</td>
                                <td className="px-2.5 py-3 text-center text-blue-300">
                                    {totalRebuys} ({avgRebuysPerGameLeague}/gm)
                                </td>
                                <td className="px-2.5 py-3 text-center">{totalAddOns}</td>
                                <td className="px-2.5 py-3 text-center">£{totalMoneySpent}</td>
                                <td className="px-2.5 py-3 text-center text-emerald-400">£{totalWinningsPaid}</td>
                                <td className="px-2.5 py-3 text-center text-gold">
                                    -£{globalStats.totalPot} (Side Pot)
                                </td>
                                <td className="px-2.5 py-3 text-center text-ept-red">{totalKOs} KOs</td>
                                <td className="px-2.5 py-3 text-center">{totalKOs}</td>
                                <td className="px-3 py-3 text-zinc-400 font-sans text-[10px]">
                                    {(totalBonusChips / 1000).toFixed(0)}k Bonus Chips
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Week-by-Week Session Breakdown (Dynamic Payout Cutoffs, Bubble Finishes & KOs) */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-zinc-950/80 space-y-4">
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Target className="w-5 h-5 text-ept-red" />
                        Week-by-Week Session Breakdown &amp; Bubble Ledger
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Shows each game&apos;s exact payout depth (Top 3 vs Top 2 paid), the resulting Bubble position (4th vs 3rd place), and weekly knockouts from Row 37 of the player sheets.
                    </p>
                </div>

                <div className="w-full overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="text-[10px] uppercase bg-white/5 text-zinc-400 border-b border-white/10">
                            <tr>
                                <th className="px-3 py-3 font-bold text-white">Game</th>
                                <th className="px-3 py-3 font-bold text-white">Date</th>
                                <th className="px-3 py-3 text-center">Players</th>
                                <th className="px-3 py-3 text-center text-emerald-400 font-bold">Prize Pot</th>
                                <th className="px-3 py-3 text-center">Places Paid</th>
                                <th className="px-3 py-3 font-bold text-gold">1st Place Winner</th>
                                <th className="px-3 py-3">2nd &amp; 3rd Cashing</th>
                                <th className="px-3 py-3 font-bold text-purple-300">
                                    Bubble Finish (1 Spot Outside Money)
                                </th>
                                <th className="px-3 py-3 text-center text-ept-red font-bold">Total KOs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                            {history.map((session, idx) => {
                                const getPos = (r: { place: string }) => {
                                    const p = parseInt(r.place, 10);
                                    return !isNaN(p) && p > 0 ? p : 99;
                                };
                                const paidResults = session.results.filter((r) => r.winnings > 0);
                                const lastPaidPos =
                                    paidResults.length > 0
                                        ? Math.max(...paidResults.map((r) => getPos(r)))
                                        : 3;
                                const bubblePos = lastPaidPos + 1;
                                const bubblePlayer = session.results.find(
                                    (r) => getPos(r) === bubblePos && r.winnings === 0
                                );
                                const winner = session.results.find((r) => getPos(r) === 1) || session.results[0];
                                const second = session.results.find((r) => getPos(r) === 2);
                                const third = session.results.find((r) => getPos(r) === 3);
                                const sessionKOs = session.results.reduce((s, r) => s + (r.kos || 0), 0);

                                return (
                                    <tr key={session.date} className="hover:bg-white/5 transition-colors">
                                        <td className="px-3 py-3 font-bold text-gold">G{idx + 1}</td>
                                        <td className="px-3 py-3 text-white whitespace-nowrap">{session.date}</td>
                                        <td className="px-3 py-3 text-center text-zinc-300">
                                            {session.results.length}
                                        </td>
                                        <td className="px-3 py-3 text-center font-bold text-emerald-400">
                                            £{session.prizePot}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                                                Top {lastPaidPos} Paid
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 font-sans font-bold text-white whitespace-nowrap">
                                            {winner ? `${winner.name} (£${winner.winnings})` : "-"}
                                        </td>
                                        <td className="px-3 py-3 font-sans text-zinc-300 text-[11px]">
                                            {second ? `2nd: ${second.name} (£${second.winnings})` : ""}
                                            {third && third.winnings > 0
                                                ? ` • 3rd: ${third.name} (£${third.winnings})`
                                                : ""}
                                        </td>
                                        <td className="px-3 py-3 font-sans">
                                            {bubblePlayer ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
                                                    <span>🫧 {bubblePlayer.name}</span>
                                                    <span className="text-[10px] font-mono opacity-80">
                                                        ({bubblePos === 3 ? "3rd" : "4th"} Place • £0)
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-zinc-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-center font-bold text-ept-red">
                                            {sessionKOs} ☠️
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
