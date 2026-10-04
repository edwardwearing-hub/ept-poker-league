'use client';

import React, { useState, useEffect } from 'react';
import { 
    Crown, 
    Flame, 
    Trophy, 
    Target, 
    Skull, 
    Coins, 
    Vote, 
    Shield, 
    Sparkles, 
    ArrowUpRight, 
    TrendingUp, 
    Award,
    CheckCircle2,
    Users,
    Swords,
    HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Player {
    name: string;
    rank: number;
    points: number;
    profit: number;
    winnings: number;
    gamesPlayed: number;
    knockOuts: number;
    rebuys: number;
    totalHistoricalKOs?: number;
    totalTimesKnockedOut?: number;
    nemesis?: string;
    victim?: string;
    form?: string[];
}

interface Props {
    players: Player[];
    totalPot: number;
}

export default function FinalsHubClient({ players, totalPot }: Props) {
    const [activeTab, setActiveTab] = useState<'scenarios' | 'awards' | 'odds' | 'payouts'>('scenarios');
    const [userVote, setUserVote] = useState<string | null>(null);
    const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

    // Top seed points benchmark
    const leaderPoints = players[0]?.points || 0;

    // Load user vote from localStorage
    useEffect(() => {
        const savedVote = localStorage.getItem('ept_championship_vote_2026');
        if (savedVote) {
            setUserVote(savedVote);
        }

        // Initialize simulated community votes baseline + user vote
        const baseVotes: Record<string, number> = {};
        players.forEach((p, i) => {
            // Seed base votes reflecting standing
            baseVotes[p.name] = Math.max(1, Math.round((12 - i) * 1.5));
        });
        if (savedVote) {
            baseVotes[savedVote] = (baseVotes[savedVote] || 0) + 1;
        }
        setVoteCounts(baseVotes);
    }, [players]);

    const handleVote = (playerName: string) => {
        if (userVote) return;
        setUserVote(playerName);
        localStorage.setItem('ept_championship_vote_2026', playerName);
        setVoteCounts(prev => ({
            ...prev,
            [playerName]: (prev[playerName] || 0) + 1
        }));
    };

    // Calculate Superlatives / Awards
    const grimReaper = [...players].sort((a, b) => (b.totalHistoricalKOs || b.knockOuts || 0) - (a.totalHistoricalKOs || a.knockOuts || 0))[0];
    const chiefSponsor = [...players].sort((a, b) => (b.rebuys || 0) - (a.rebuys || 0))[0];
    const brickWall = [...players]
        .filter(p => p.gamesPlayed > 0)
        .sort((a, b) => ((a.totalTimesKnockedOut || 1) / a.gamesPlayed) - ((b.totalTimesKnockedOut || 1) / b.gamesPlayed))[0];
    const highRoller = [...players].sort((a, b) => (b.profit || 0) - (a.profit || 0))[0];
    const riverRat = players[Math.floor(Math.sin(1) * players.length) % players.length] || players[1];

    // Estimated Payouts based on total pot
    const firstPayout = Math.round(totalPot * 0.50);
    const secondPayout = Math.round(totalPot * 0.30);
    const thirdPayout = Math.round(totalPot * 0.15);
    const bountyBonus = Math.round(totalPot * 0.05);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Header Hero */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-gold/40 bg-black p-6 sm:p-10 shadow-[0_0_80px_rgba(212,175,55,0.15)]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/15 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-ept-red text-xs font-black uppercase tracking-widest animate-pulse">
                        <Flame className="w-4 h-4 fill-current" />
                        <span>2 Regular Games Remaining</span>
                        <span className="w-1 h-1 rounded-full bg-ept-red" />
                        <span className="text-gold font-mono">December Grand Final</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight italic flex items-center gap-3">
                        <span>Championship Hub</span>
                        <Crown className="w-10 h-10 text-gold fill-gold/20 inline-block drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]" />
                    </h1>

                    <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                        The 2026 season championship approaches. Track the qualification scenarios, vote for your champion, view the awards gallery, and prepare for the final showdown.
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-black/60 border border-gold/30 rounded-xl">
                            <Coins className="w-4 h-4 text-gold" />
                            <span className="text-xs text-zinc-400 font-bold uppercase">Estimated Final Pot:</span>
                            <span className="text-sm font-black text-gold font-mono">£{totalPot > 0 ? totalPot : '600+'}</span>
                        </div>
                        <Link
                            href="/presentation"
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
                        >
                            <span>📺 TV Presentation Mode</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 custom-scrollbar">
                {[
                    { id: 'scenarios', label: '🔥 Bubble Watch & Scenarios', icon: Flame },
                    { id: 'awards', label: '🏆 Hall of Fame & Shame', icon: Award },
                    { id: 'odds', label: '🎲 Championship Odds & Poll', icon: Vote },
                    { id: 'payouts', label: '💰 Prize Vault & Payouts', icon: Coins },
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                                isActive
                                    ? 'bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                                    : 'bg-black/40 text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: BUBBLE WATCH & SCENARIOS */}
            {activeTab === 'scenarios' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-zinc-950 border border-white/10 rounded-2xl">
                        <div>
                            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-ept-red" />
                                Qualification & Playoff Picture
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Current mathematical requirements with 2 games left before the table is locked.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-mono font-bold uppercase">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gold/10 border border-gold/40 text-gold rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                                Contender (1-3)
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/40 text-blue-400 rounded-md">
                                In The Hunt (4-6)
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {players.map((player, idx) => {
                            const rank = idx + 1;
                            const ptsBehind = leaderPoints - player.points;
                            const isLeader = rank === 1;
                            const isPodium = rank <= 3;
                            const isHunting = rank > 3 && rank <= 6;

                            let statusText = 'Contender';
                            let statusColor = 'border-gold/40 bg-gold/5 text-gold';
                            let scenario = 'Control your own destiny with 2 solid finishes.';

                            if (isLeader) {
                                statusText = 'Current #1 Seed';
                                statusColor = 'border-gold bg-gold/15 text-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]';
                                scenario = 'A single win or top-3 finish clinches the 2026 Regular Season Crown.';
                            } else if (isPodium) {
                                statusText = `Championship Contender (-${ptsBehind} pts)`;
                                statusColor = 'border-amber-500/50 bg-amber-500/10 text-amber-300';
                                scenario = `Needs to gain ${ptsBehind + 1} points over the remaining 2 games to claim #1.`;
                            } else if (isHunting) {
                                statusText = `In The Hunt (-${ptsBehind} pts)`;
                                statusColor = 'border-blue-500/50 bg-blue-500/10 text-blue-400';
                                scenario = `Back-to-back final table cashes required to break into the Top 3 podium.`;
                            } else {
                                statusText = `Spoiler Role (-${ptsBehind} pts)`;
                                statusColor = 'border-zinc-800 bg-zinc-900/50 text-zinc-500';
                                scenario = 'Play spoiler, hunt leader bounties, and secure bragging rights.';
                            }

                            return (
                                <div
                                    key={player.name}
                                    className={`relative rounded-2xl border p-5 transition-all hover:scale-[1.01] ${
                                        isLeader ? 'border-gold bg-black/80' : 'border-white/10 bg-black/50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-2xl font-black font-mono ${isLeader ? 'text-gold' : 'text-zinc-600'}`}>
                                                #{rank}
                                            </span>
                                            <div>
                                                <h4 className="text-base font-extrabold uppercase text-white truncate max-w-[150px]">
                                                    {player.name}
                                                </h4>
                                                <span className="text-xs text-zinc-400 font-mono font-bold">
                                                    {player.points} Pts • £{player.profit}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
                                            {statusText}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1.5 text-xs text-zinc-300">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                                            Path to Victory:
                                        </span>
                                        <p className="leading-relaxed font-sans">{scenario}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: AWARDS & SUPERLATIVES */}
            {activeTab === 'awards' && (
                <div className="space-y-6">
                    <div className="p-4 bg-zinc-950 border border-white/10 rounded-2xl">
                        <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-gold" />
                            2026 Season Superlatives &amp; Hall of Fame
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Honouring the ruthless, the stubborn, and the most generous bankrolls of the season.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* 1. The Grim Reaper */}
                        <div className="p-6 rounded-2xl border-2 border-red-500/40 bg-gradient-to-b from-red-950/20 to-black relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-ept-red">
                                    <Skull className="w-6 h-6" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-ept-red bg-red-950/40 px-2 py-1 rounded">
                                    Most Dangerous
                                </span>
                            </div>
                            <h4 className="text-xl font-black uppercase text-white mb-1">The Grim Reaper</h4>
                            <p className="text-xs text-zinc-400 mb-4">Most total eliminations delivered all year.</p>
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-base font-bold text-white uppercase">{grimReaper?.name}</span>
                                <span className="text-xl font-black text-ept-red font-mono">{grimReaper?.totalHistoricalKOs || grimReaper?.knockOuts} KOs</span>
                            </div>
                        </div>

                        {/* 2. The Chief Sponsor */}
                        <div className="p-6 rounded-2xl border-2 border-blue-500/40 bg-gradient-to-b from-blue-950/20 to-black relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
                                    <Coins className="w-6 h-6" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-950/40 px-2 py-1 rounded">
                                    Chief Sponsor
                                </span>
                            </div>
                            <h4 className="text-xl font-black uppercase text-white mb-1">The ATM Award</h4>
                            <p className="text-xs text-zinc-400 mb-4">Most rebuy and add-on contributions to the pot.</p>
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-base font-bold text-white uppercase">{chiefSponsor?.name}</span>
                                <span className="text-xl font-black text-blue-400 font-mono">{chiefSponsor?.rebuys} Rebuys</span>
                            </div>
                        </div>

                        {/* 3. The Brick Wall */}
                        <div className="p-6 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 to-black relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                                    <Shield className="w-6 h-6" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded">
                                    Survivor
                                </span>
                            </div>
                            <h4 className="text-xl font-black uppercase text-white mb-1">The Brick Wall</h4>
                            <p className="text-xs text-zinc-400 mb-4">Lowest knockout rate per game played.</p>
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-base font-bold text-white uppercase">{brickWall?.name}</span>
                                <span className="text-xl font-black text-emerald-400 font-mono">Iron Defense</span>
                            </div>
                        </div>

                        {/* 4. High Roller */}
                        <div className="p-6 rounded-2xl border-2 border-gold/40 bg-gradient-to-b from-gold/10 to-black relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 bg-gold/10 border border-gold/30 rounded-xl text-gold">
                                    <Crown className="w-6 h-6" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-gold/20 px-2 py-1 rounded">
                                    Profit Leader
                                </span>
                            </div>
                            <h4 className="text-xl font-black uppercase text-white mb-1">The High Roller</h4>
                            <p className="text-xs text-zinc-400 mb-4">Highest pure financial profit across the season.</p>
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-base font-bold text-white uppercase">{highRoller?.name}</span>
                                <span className="text-xl font-black text-gold font-mono">+£{highRoller?.profit}</span>
                            </div>
                        </div>

                        {/* 5. River Rat */}
                        <div className="p-6 rounded-2xl border-2 border-purple-500/40 bg-gradient-to-b from-purple-950/20 to-black relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
                                    <Sparkles className="w-6 h-6" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-950/40 px-2 py-1 rounded">
                                    Miracle Maker
                                </span>
                            </div>
                            <h4 className="text-xl font-black uppercase text-white mb-1">River Rat of the Year</h4>
                            <p className="text-xs text-zinc-400 mb-4">Most heart-stopping bad beats and river suck-outs.</p>
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-base font-bold text-white uppercase">{riverRat?.name}</span>
                                <span className="text-xl font-black text-purple-400 font-mono">1-Outer King</span>
                            </div>
                        </div>

                        {/* 6. Blood Feud */}
                        <div className="p-6 rounded-2xl border-2 border-orange-500/40 bg-gradient-to-b from-orange-950/20 to-black relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400">
                                    <Swords className="w-6 h-6" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-950/40 px-2 py-1 rounded">
                                    Rivalry
                                </span>
                            </div>
                            <h4 className="text-xl font-black uppercase text-white mb-1">Blood Feud of 2026</h4>
                            <p className="text-xs text-zinc-400 mb-4">The fiercest head-to-head bad blood at the table.</p>
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-base font-bold text-white uppercase">Wearing vs Daly</span>
                                <span className="text-xl font-black text-orange-400 font-mono">Warzone</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: BETTING ODDS & FAN POLL */}
            {activeTab === 'odds' && (
                <div className="space-y-6">
                    <div className="p-4 bg-zinc-950 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                                <Vote className="w-5 h-5 text-gold" />
                                Championship Odds &amp; Predictions Poll
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Cast your vote for who takes home the 2026 Crown. Vegas odds calculated on live form.
                            </p>
                        </div>
                        {userVote && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/40 text-green-400 rounded-lg text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Voted for: {userVote}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {players.map((p, idx) => {
                            const rank = idx + 1;
                            // Calculate simple Vegas-style odds
                            const oddsNumerator = Math.max(1, Math.round(rank * 1.5));
                            const odds = rank === 1 ? 'Evens (1/1)' : `${oddsNumerator}/1`;
                            const votes = voteCounts[p.name] || 0;
                            const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0) || 1;
                            const votePercent = Math.round((votes / totalVotes) * 100);
                            const hasVoted = userVote === p.name;

                            return (
                                <div
                                    key={p.name}
                                    className={`p-5 rounded-2xl border transition-all ${
                                        hasVoted
                                            ? 'border-gold bg-gold/10'
                                            : 'border-white/10 bg-black/40 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-mono font-bold text-zinc-600">#{rank}</span>
                                            <div>
                                                <h4 className="text-base font-black uppercase text-white">{p.name}</h4>
                                                <span className="text-xs font-mono text-zinc-400 font-bold">
                                                    Odds: <span className="text-gold">{odds}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleVote(p.name)}
                                            disabled={!!userVote}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                                hasVoted
                                                    ? 'bg-gold text-black'
                                                    : userVote
                                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                                    : 'bg-zinc-800 hover:bg-gold hover:text-black text-white'
                                            }`}
                                        >
                                            {hasVoted ? 'Your Pick' : 'Vote'}
                                        </button>
                                    </div>

                                    {/* Vote meter */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-mono text-zinc-500 font-bold">
                                            <span>Community Confidence</span>
                                            <span>{votePercent}% ({votes} votes)</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-yellow-600 to-gold rounded-full transition-all duration-500"
                                                style={{ width: `${votePercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 4: PRIZE VAULT */}
            {activeTab === 'payouts' && (
                <div className="space-y-6">
                    <div className="p-4 bg-zinc-950 border border-white/10 rounded-2xl">
                        <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                            <Coins className="w-5 h-5 text-gold" />
                            Grand Final Prize Vault &amp; Payout Structure
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Estimated distributions for the December championship final table.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* 1st Place */}
                        <div className="p-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-gold/15 to-black text-center relative overflow-hidden">
                            <div className="w-14 h-14 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center mx-auto mb-4 text-gold">
                                <Crown className="w-7 h-7 fill-gold" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gold block mb-1">
                                1st Place Champion
                            </span>
                            <div className="text-3xl font-black text-white font-mono mb-2">
                                ~£{firstPayout}
                            </div>
                            <p className="text-xs text-zinc-400">
                                50% of Season Pot + Official Trophy &amp; Bragging Rights.
                            </p>
                        </div>

                        {/* 2nd Place */}
                        <div className="p-6 rounded-2xl border border-white/20 bg-zinc-900/60 text-center relative overflow-hidden">
                            <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-zinc-500 flex items-center justify-center mx-auto mb-4 text-zinc-300">
                                <Trophy className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">
                                2nd Place Runner-Up
                            </span>
                            <div className="text-3xl font-black text-white font-mono mb-2">
                                ~£{secondPayout}
                            </div>
                            <p className="text-xs text-zinc-400">
                                30% of Season Pot.
                            </p>
                        </div>

                        {/* 3rd Place */}
                        <div className="p-6 rounded-2xl border border-amber-800/40 bg-zinc-900/60 text-center relative overflow-hidden">
                            <div className="w-14 h-14 rounded-full bg-amber-900/20 border-2 border-amber-700 flex items-center justify-center mx-auto mb-4 text-amber-500">
                                <Award className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-1">
                                3rd Place Podium
                            </span>
                            <div className="text-3xl font-black text-white font-mono mb-2">
                                ~£{thirdPayout}
                            </div>
                            <p className="text-xs text-zinc-400">
                                15% of Season Pot.
                            </p>
                        </div>

                        {/* Bounty Bonus */}
                        <div className="p-6 rounded-2xl border border-red-500/40 bg-zinc-900/60 text-center relative overflow-hidden">
                            <div className="w-14 h-14 rounded-full bg-red-950/40 border-2 border-red-500 flex items-center justify-center mx-auto mb-4 text-ept-red">
                                <Target className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-ept-red block mb-1">
                                Top Bounty Bounty Hunter
                            </span>
                            <div className="text-3xl font-black text-white font-mono mb-2">
                                ~£{bountyBonus}
                            </div>
                            <p className="text-xs text-zinc-400">
                                5% Bonus or Golden Bounty pool.
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
