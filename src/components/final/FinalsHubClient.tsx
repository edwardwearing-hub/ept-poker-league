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
    HelpCircle,
    ArrowRight,
    Search,
    AlertTriangle,
    Ghost,
    DollarSign,
    Zap,
    TrendingDown,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAvatarFilename } from '@/lib/avatars';

interface Player {
    name: string;
    rank: number;
    nickname?: string;
    points: number;
    profit: number;
    winnings: number;
    cashPaid?: number;
    gamesPlayed: number;
    wins?: number;
    knockOuts: number;
    rebuys: number;
    addOns?: number;
    bonusChips?: number;
    winPercentage?: number;
    avgKnockouts?: number;
    avgFinishPosition?: number;
    avgWinnings?: number;
    avgPoints?: number;
    bubbleFinishes?: number;
    mostRebuysSingle?: number;
    rivalPlayer?: string;
    bulliedPlayer?: string;
    totalHistoricalKOs?: number;
    totalTimesKnockedOut?: number;
    uniquePlayersHijacked?: string[];
    nemesis?: string;
    victim?: string;
    form?: string[];
    cashFlowHistory?: { date: string; profit: number }[];
}

interface Props {
    players: Player[];
    totalPot: number;
    history?: any[];
}

export default function FinalsHubClient({ players, totalPot, history = [] }: Props) {
    const router = useRouter();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState('Just now');
    const [activeTab, setActiveTab] = useState<'dossiers' | 'scenarios' | 'awards' | 'odds' | 'payouts'>('dossiers');
    const [filterCategory, setFilterCategory] = useState<'all' | 'contenders' | 'afraid'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [userVote, setUserVote] = useState<string | null>(null);
    const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

    // Dynamic Season Progress tied directly to Google Sheets
    const gamesPlayedOverall = Math.max(...players.map(p => p.gamesPlayed || 0), 0);
    const totalRegularGames = 9;
    const gamesRemaining = Math.max(0, totalRegularGames - gamesPlayedOverall);
    const latestGame = history && history.length > 0 ? history[history.length - 1] : null;

    const handleSync = () => {
        setIsSyncing(true);
        router.refresh();
        setTimeout(() => {
            setIsSyncing(false);
            setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 1200);
    };

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
    const grimReaper = [...players].sort((a, b) => (b.totalHistoricalKOs || b.knockOuts || 0) - (a.totalHistoricalKOs || a.knockOuts || 0))[0] || players[0];
    const chiefSponsor = [...players].sort((a, b) => (b.rebuys || 0) - (a.rebuys || 0))[0] || players[0];
    const brickWall = [...players]
        .filter(p => p.gamesPlayed > 0)
        .sort((a, b) => ((a.totalTimesKnockedOut || 1) / a.gamesPlayed) - ((b.totalTimesKnockedOut || 1) / b.gamesPlayed))[0] || players[0];
    const highRoller = [...players].sort((a, b) => (b.profit || 0) - (a.profit || 0))[0] || players[0];
    const riverRat = players[Math.floor(Math.sin(1) * players.length) % players.length] || players[1] || players[0];

    // Estimated Payouts based on total pot
    const effectivePot = totalPot > 0 ? totalPot : 600;
    const firstPayout = Math.round(effectivePot * 0.50);
    const secondPayout = Math.round(effectivePot * 0.30);
    const thirdPayout = Math.round(effectivePot * 0.15);
    const bountyBonus = Math.round(effectivePot * 0.05);

    // Rivalry leaders
    const rival1 = players[0];
    const rival2 = players[1];

    // Dynamic Sarcastic Roasts and In-Depth Dossier Generator
    const getPlayerDossier = (p: Player) => {
        const nameLower = p.name.toLowerCase();

        // 1. Missing in Action / Zero games played (e.g. Stephen Flood)
        if (p.gamesPlayed === 0) {
            return {
                statusBadge: "🚨 M.I.A. / COWARDICE PROTOCOL",
                statusColor: "border-red-500 bg-red-950/50 text-red-400 animate-pulse",
                fearLevel: "100% Extreme Fear",
                attendanceRate: "0.0% (Ghost Mode)",
                nemesis: "The £20 Entry Fee & His Alarm Clock",
                bulliedTarget: "His Own Living Room Sofa",
                quote: "You can't lose chips if you're too terrified to turn up.",
                verdict: "Rumour has it Stephen is so utterly paralyzed by the fear of facing the Wearing Dynasty and Daly Clan that he hasn't dared set foot near a poker table all season. Zero games, zero buy-ins, zero cards dealt. Currently undefeated in the 'Staying in Bed' division.",
                isZero: true,
                isAfraid: true
            };
        }

        // 2. Darren Daly (1 game, -£20, 0 KOs)
        if (p.gamesPlayed === 1) {
            return {
                statusBadge: "🎒 WITNESS PROTECTION / TOURIST",
                statusColor: "border-orange-500 bg-orange-950/40 text-orange-400",
                fearLevel: "85% Mildly Traumatized",
                attendanceRate: "14.3% (One and Done)",
                nemesis: "The Entire Poker Table",
                bulliedTarget: "His Lone £20 Note",
                quote: "Showed up once, saw the blood on the felt, never came back.",
                verdict: "Showed up for a single session, realized in horror what the sharks in this league do to casuals, dropped £20, and promptly entered the Witness Protection Program. Decided preserving his emotional well-being was worth more than chasing points.",
                isZero: false,
                isAfraid: true
            };
        }

        // 3. Luke Daly (high rebuys, big pot donor)
        if (p.rebuys >= 3 || (p.profit <= -60 && p.gamesPlayed >= 5)) {
            return {
                statusBadge: "🏦 VIP LEAGUE ATM",
                statusColor: "border-blue-500 bg-blue-950/40 text-blue-400",
                fearLevel: "0% (Fearless to a fault)",
                attendanceRate: `${Math.round((p.gamesPlayed / 7) * 100)}% (Dedicated)`,
                nemesis: p.rivalPlayer && p.rivalPlayer !== 'None' ? p.rivalPlayer : "Liam Duxbury",
                bulliedTarget: p.bulliedPlayer && p.bulliedPlayer !== 'None' ? p.bulliedPlayer : "The Rebuy Button",
                quote: "Another £10 rebuy? Stick it on my tab.",
                verdict: `Tied for the league lead in rebuys! Has pumped £${p.cashPaid || 170} into the prize vault and watched £${Math.abs(p.profit)} vanish into thin air. Eliminated 7 souls with high aggression, but rebuys faster than a runaway train. Still sitting 3rd through pure stubborn refusal to quit.`,
                isZero: false,
                isAfraid: false
            };
        }

        // 4. Liam Duxbury (Apex Predator)
        if (p.rank === 1 || p.knockOuts >= 12) {
            return {
                statusBadge: "🦈 LEAGUE APEX PREDATOR",
                statusColor: "border-gold bg-gold/20 text-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]",
                fearLevel: "Causes Terror in Everyone Else",
                attendanceRate: "100% (Relentless)",
                nemesis: p.rivalPlayer && p.rivalPlayer !== 'None' ? p.rivalPlayer : "Edward Wearing",
                bulliedTarget: p.bulliedPlayer && p.bulliedPlayer !== 'None' ? p.bulliedPlayer : "Luke Daly",
                quote: "I didn't come to play cards, I came to collect bounties.",
                verdict: `A ruthless killing machine with ${p.knockOuts} knockouts (more than double the rest of the table) and a mountain of ${p.bonusChips?.toLocaleString() || '31,000'} bonus chips. Cashes £70 on average and bullies Luke Daly for breakfast. If the table doesn't orchestrate a coup against him in Game 8, the trophy is already his.`,
                isZero: false,
                isAfraid: false
            };
        }

        // 5. Edward Wearing (Break-even bounty warlord)
        if (nameLower.includes('edward')) {
            return {
                statusBadge: "⚖️ THE BREAK-EVEN WARLORD",
                statusColor: "border-gold/60 bg-black text-gold",
                fearLevel: "Ice Cold",
                attendanceRate: "100% (Flawless)",
                nemesis: p.rivalPlayer && p.rivalPlayer !== 'None' ? p.rivalPlayer : "Liam Duxbury",
                bulliedTarget: p.bulliedPlayer && p.bulliedPlayer !== 'None' ? p.bulliedPlayer : "Anyone with chips",
                quote: "Exactly £140 in, exactly £140 out. Zero financial bleeding.",
                verdict: "The absolute master of equilibrium. Exactly £140 spent, exactly £140 recouped. Zero financial risk, maximum psychological warfare. The reigning bounty boss who refuses to die, trailing Liam by just 15 points with everything on the line.",
                isZero: false,
                isAfraid: false
            };
        }

        // 6. Dave Blackburn (Cheat Code)
        if (nameLower.includes('blackburn')) {
            return {
                statusBadge: "🧠 THE POKER CHEAT CODE",
                statusColor: "border-emerald-500 bg-emerald-950/40 text-emerald-400",
                fearLevel: "Terrifyingly Efficient",
                attendanceRate: "42.9% (Selective Sniper)",
                nemesis: "Full-Time Commitment",
                bulliedTarget: "The Entire Pot",
                quote: "3 games, 2 tournament trophies, +£100 in the bag.",
                verdict: "An absurd 66.7% tournament victory rate and +£100 pure financial profit in only 3 appearances. If Dave actually showed up to every game, the rest of the league would have to take out a second mortgage to pay him.",
                isZero: false,
                isAfraid: false
            };
        }

        // 7. Georgina Wearing (Iron Duchess)
        if (nameLower.includes('georgina')) {
            return {
                statusBadge: "🛡️ THE IRON DUCHESS",
                statusColor: "border-purple-500 bg-purple-950/40 text-purple-300",
                fearLevel: "Unshakable",
                attendanceRate: "100% (Iron Discipline)",
                nemesis: p.rivalPlayer && p.rivalPlayer !== 'None' ? p.rivalPlayer : "The Final Table Bubble",
                bulliedTarget: "Reckless Bluffers",
                quote: "100% attendance, max add-ons, waiting for the boys to crash.",
                verdict: "Flawless 100% season attendance and max add-ons every single month. Patiently floating in 4th place without making reckless blunders, poised to claim a podium spot the moment the leaders overplay their hands.",
                isZero: false,
                isAfraid: false
            };
        }

        // 8. Daniel Horne (Hitman)
        if (nameLower.includes('horne')) {
            return {
                statusBadge: "🎯 THE GHOST HITMAN",
                statusColor: "border-cyan-500 bg-cyan-950/40 text-cyan-400",
                fearLevel: "Silent Danger",
                attendanceRate: "42.9% (Precision Sniper)",
                nemesis: "Calendar Conflicts",
                bulliedTarget: "Mid-Stacks",
                quote: "3 games, 1 win, +£40. In, out, nobody gets hurt.",
                verdict: "Shows up once in a blue moon, stacks 5 people, collects a tournament trophy and £40 in clean cash, then vanishes back into thin air. Surgical efficiency with zero emotional baggage.",
                isZero: false,
                isAfraid: false
            };
        }

        // 9. Chris Daly (Wildcard)
        if (nameLower.includes('chris')) {
            return {
                statusBadge: "🎲 THE LOOSE CANNON",
                statusColor: "border-amber-500 bg-amber-950/40 text-amber-300",
                fearLevel: "Chaotic Neutral",
                attendanceRate: "71.4% (Frequent Flyer)",
                nemesis: "Discipline",
                bulliedTarget: "Tight Folders",
                quote: "If I have two cards, I have a chance.",
                verdict: "Maximum table volume and zero fear. Will gladly fire two rebuys and call off your stack with 7-2 offsuit just to see if the poker gods are feeling funny. A lethal wildcard with a trophy under his belt.",
                isZero: false,
                isAfraid: false
            };
        }

        // 10. Dave Taylor (Grinder)
        if (nameLower.includes('taylor')) {
            return {
                statusBadge: "⛏️ THE BLUE-COLLAR GRINDER",
                statusColor: "border-zinc-500 bg-zinc-900/60 text-zinc-300",
                fearLevel: "Patient & Resilient",
                attendanceRate: "71.4% (Reliable Veteran)",
                nemesis: "Bad River Cards",
                bulliedTarget: "Table Donators",
                quote: "5 games in, max add-ons paid, waiting for the heater.",
                verdict: "Quiet, dedicated, and never misses an add-on. Has spent £100 and recouped £60. A solid veteran who just needs one hot deck on final night to spoil everyone else's plans.",
                isZero: false,
                isAfraid: false
            };
        }

        // 11. Nathen Benson (Philanthropist)
        if (nameLower.includes('nathen') || nameLower.includes('nathan')) {
            return {
                statusBadge: "❤️ THE CHARITY PHILANTHROPIST",
                statusColor: "border-rose-500 bg-rose-950/40 text-rose-300",
                fearLevel: "Harmless (For Now)",
                attendanceRate: "57.1% (Generous Patron)",
                nemesis: "Showdowns",
                bulliedTarget: "His Wallet (-£80)",
                quote: "I'm not losing, I'm investing in my friends' happiness.",
                verdict: "Four games played, zero wins, 1 knockout, and an incredibly generous £80 donated directly into his friends' pockets. A beloved patron of the league whose optimism defies all mathematical reality.",
                isZero: false,
                isAfraid: false
            };
        }

        // Default Fallback
        const profitSign = p.profit >= 0 ? `+£${p.profit}` : `-£${Math.abs(p.profit)}`;
        return {
            statusBadge: p.profit >= 0 ? "📈 SOLID OPERATOR" : "📉 UNDERCOVER AGENT",
            statusColor: p.profit >= 0 ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300" : "border-zinc-700 bg-zinc-900 text-zinc-400",
            fearLevel: "Moderate",
            attendanceRate: `${Math.round((p.gamesPlayed / 7) * 100)}%`,
            nemesis: p.rivalPlayer || "The Deck",
            bulliedTarget: p.bulliedPlayer || "Unknown",
            quote: `Fought through ${p.gamesPlayed} games for ${p.points} points.`,
            verdict: `${p.name} sits at #${p.rank} with ${p.gamesPlayed} games played and ${profitSign} profit. Still mathematically dangerous with 2 games left.`,
            isZero: p.gamesPlayed === 0,
            isAfraid: p.gamesPlayed <= 1
        };
    };

    // Filter players for Dossiers
    const filteredPlayers = players.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (filterCategory === 'contenders') {
            return p.rank <= 4;
        }
        if (filterCategory === 'afraid') {
            return p.gamesPlayed <= 1;
        }
        return true;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Header Hero with Championship Trophy Visual */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-gold/50 bg-black shadow-[0_0_90px_rgba(212,175,55,0.25)]">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-luminosity hover:scale-105 transition-all duration-1000 pointer-events-none"
                    style={{ backgroundImage: `url('/images/final/championship_trophy.jpg')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/70 pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="max-w-2xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-ept-red text-xs font-black uppercase tracking-widest animate-pulse">
                            <Flame className="w-4 h-4 fill-current" />
                            <span>
                                {gamesRemaining > 1
                                    ? `Round ${gamesPlayedOverall} of ${totalRegularGames} Complete • ${gamesRemaining} Regular Games Remaining`
                                    : gamesRemaining === 1
                                    ? `Round ${gamesPlayedOverall} of ${totalRegularGames} Complete • 1 Final Regular Game Left — BUBBLE WEEK!`
                                    : `Regular Season Concluded (${totalRegularGames}/${totalRegularGames}) • Grand Final Table Locked In!`}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-ept-red" />
                            <span className="text-gold font-mono">December Grand Final</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight italic flex items-center gap-3">
                            <span>Championship Hub</span>
                            <Crown className="w-10 h-10 text-gold fill-gold/20 inline-block drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]" />
                        </h1>

                        <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                            The 2026 season championship approaches. Deep-dive into official spreadsheet dossiers, player roasts, qualification scenarios, award superlatives, and Vegas championship odds.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-black/80 border border-gold/40 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                                <div className="p-2 bg-gold/15 rounded-xl text-gold border border-gold/30">
                                    <Coins className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Estimated Final Pot:</span>
                                    <span className="text-base font-black text-gold font-mono">£{effectivePot}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="flex items-center gap-2 px-4 py-3 bg-black/80 hover:bg-zinc-900 border border-gold/40 hover:border-gold rounded-2xl text-xs font-black uppercase tracking-wider text-gold shadow-lg transition-all transform hover:scale-105"
                                title="Fetch latest game records and calculations from Google Sheets"
                            >
                                <RefreshCw className={`w-4 h-4 text-gold ${isSyncing ? 'animate-spin' : ''}`} />
                                <span>{isSyncing ? 'Syncing...' : 'Sync Live Sheet'}</span>
                                <span className="text-[9px] font-mono text-zinc-400 font-normal">({lastSyncTime})</span>
                            </button>

                            <Link
                                href="/presentation"
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 border border-white/20 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:scale-105"
                            >
                                <span>📺 TV Presentation Mode</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Top 3 Podium Avatars Preview */}
                    {players.length >= 3 && (
                        <div className="bg-black/80 border border-gold/40 rounded-2xl p-5 shadow-2xl backdrop-blur-md shrink-0 lg:w-80">
                            <div className="text-[11px] font-black uppercase tracking-widest text-gold mb-4 text-center flex items-center justify-center gap-2">
                                <Trophy className="w-4 h-4 text-gold" />
                                <span>Current Title Contenders</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                {/* 2nd Place */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-zinc-400 p-0.5 bg-zinc-900 shadow-md">
                                        <img 
                                            src={getAvatarFilename(players[1]?.name)} 
                                            alt={players[1]?.name} 
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        <span className="absolute bottom-0 right-0 bg-zinc-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-tl-lg">
                                            #2
                                        </span>
                                    </div>
                                    <span className="text-xs font-black text-white uppercase mt-2 truncate max-w-[80px]">
                                        {players[1]?.name.split(' ')[0]}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-400">{players[1]?.points} pts</span>
                                </div>

                                {/* 1st Place */}
                                <div className="flex flex-col items-center -mt-3">
                                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-gold p-0.5 bg-black shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                        <img 
                                            src={getAvatarFilename(players[0]?.name)} 
                                            alt={players[0]?.name} 
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        <span className="absolute top-0 right-0 bg-gold text-black text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg flex items-center gap-0.5">
                                            <Crown className="w-2.5 h-2.5 fill-black" /> #1
                                        </span>
                                    </div>
                                    <span className="text-xs font-black text-gold uppercase mt-2 truncate max-w-[90px]">
                                        {players[0]?.name.split(' ')[0]}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-gold">{players[0]?.points} pts</span>
                                </div>

                                {/* 3rd Place */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-700 p-0.5 bg-zinc-900 shadow-md">
                                        <img 
                                            src={getAvatarFilename(players[2]?.name)} 
                                            alt={players[2]?.name} 
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        <span className="absolute bottom-0 right-0 bg-amber-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-tl-lg">
                                            #3
                                        </span>
                                    </div>
                                    <span className="text-xs font-black text-white uppercase mt-2 truncate max-w-[80px]">
                                        {players[2]?.name.split(' ')[0]}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-400">{players[2]?.points} pts</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 custom-scrollbar">
                {[
                    { id: 'dossiers', label: '🔍 In-Depth Player Dossiers', icon: Search, badge: 'SHEET STATS' },
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
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                                isActive
                                    ? 'bg-gold text-black shadow-[0_0_25px_rgba(212,175,55,0.4)] scale-[1.02]'
                                    : 'bg-black/60 text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                    isActive ? 'bg-black/20 text-black' : 'bg-gold/20 text-gold'
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: IN-DEPTH PLAYER DOSSIERS & ROASTS */}
            {activeTab === 'dossiers' && (
                <div className="space-y-6">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-zinc-950 border border-white/10 rounded-2xl">
                        <div>
                            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                                <Search className="w-5 h-5 text-gold" />
                                Official Spreadsheet Dossiers &amp; Player Roasts
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Unfiltered statistics, attendance rates, cash flow, rivals, and psychological verdicts straight from the league ledger.
                            </p>
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { id: 'all', label: `All Players (${players.length})` },
                                { id: 'contenders', label: 'Top 4 Contenders' },
                                { id: 'afraid', label: 'Too Afraid to Show Up (0-1 Games)' },
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilterCategory(f.id as any)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                        filterCategory === f.id
                                            ? 'bg-gold text-black shadow-md'
                                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dossiers Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {filteredPlayers.map((player) => {
                            const dossier = getPlayerDossier(player);
                            const profitSign = player.profit > 0 ? `+£${player.profit}` : player.profit < 0 ? `-£${Math.abs(player.profit)}` : `£0.00`;
                            const profitColor = player.profit > 0 ? 'text-emerald-400' : player.profit < 0 ? 'text-red-400' : 'text-zinc-400';
                            const winRatePercent = player.winPercentage !== undefined ? `${(player.winPercentage * 100).toFixed(1)}%` : `${player.wins && player.gamesPlayed ? ((player.wins / player.gamesPlayed) * 100).toFixed(1) : 0}%`;

                            return (
                                <div
                                    key={player.name}
                                    className={`rounded-3xl border-2 p-6 flex flex-col justify-between space-y-5 transition-all shadow-2xl ${
                                        dossier.isZero
                                            ? 'border-red-600/50 bg-gradient-to-b from-red-950/20 via-black to-black'
                                            : player.rank === 1
                                            ? 'border-gold bg-gradient-to-b from-gold/15 via-black to-black shadow-[0_0_35px_rgba(212,175,55,0.2)]'
                                            : 'border-white/10 bg-zinc-950/90 hover:border-white/20'
                                    }`}
                                >
                                    {/* Dossier Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            {/* 8-bit Avatar */}
                                            <div className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 bg-zinc-900 shadow-lg ${
                                                dossier.isZero ? 'border-red-600 grayscale' : player.rank === 1 ? 'border-gold' : 'border-white/20'
                                            }`}>
                                                <img 
                                                    src={getAvatarFilename(player.name)} 
                                                    alt={player.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                                <span className={`absolute bottom-0 right-0 text-[9px] font-black px-1.5 py-0.5 leading-none rounded-tl ${
                                                    player.rank === 1 ? 'bg-gold text-black' : 'bg-black/80 text-white'
                                                }`}>
                                                    #{player.rank}
                                                </span>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xl font-black uppercase text-white tracking-tight">
                                                        {player.name}
                                                    </h4>
                                                    {player.rank === 1 && <Crown className="w-5 h-5 text-gold fill-gold" />}
                                                </div>
                                                <span className="text-xs text-zinc-400 font-mono font-bold block">
                                                    {player.nickname || "The Contender"} • {player.points} League Points
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`self-start text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl border ${dossier.statusColor}`}>
                                            {dossier.statusBadge}
                                        </span>
                                    </div>

                                    {/* In-Depth Spreadsheet Metrics Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-black/60 border border-white/5 rounded-2xl text-center">
                                        {/* Attendance */}
                                        <div className="p-2 bg-white/5 rounded-xl">
                                            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Attendance</span>
                                            <span className={`text-sm font-black font-mono ${dossier.isZero ? 'text-red-400' : 'text-white'}`}>
                                                {player.gamesPlayed}/7 ({dossier.attendanceRate})
                                            </span>
                                        </div>

                                        {/* Tournament Wins */}
                                        <div className="p-2 bg-white/5 rounded-xl">
                                            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Tourney Wins</span>
                                            <span className="text-sm font-black text-gold font-mono">
                                                {player.wins || 0} Wins ({winRatePercent})
                                            </span>
                                        </div>

                                        {/* Financial Profit / Loss */}
                                        <div className="p-2 bg-white/5 rounded-xl">
                                            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Net Profit / ROI</span>
                                            <span className={`text-sm font-black font-mono ${profitColor}`}>
                                                {profitSign}
                                            </span>
                                        </div>

                                        {/* Knockouts */}
                                        <div className="p-2 bg-white/5 rounded-xl">
                                            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Total Knockouts</span>
                                            <span className="text-sm font-black text-ept-red font-mono">
                                                {player.knockOuts || 0} KOs
                                            </span>
                                        </div>

                                        {/* Average Finish */}
                                        <div className="p-2 bg-white/5 rounded-xl">
                                            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Avg Finish</span>
                                            <span className="text-sm font-black text-zinc-300 font-mono">
                                                {player.avgFinishPosition && player.avgFinishPosition > 0 ? `${player.avgFinishPosition}th Place` : dossier.isZero ? 'Did Not Show' : 'N/A'}
                                            </span>
                                        </div>

                                        {/* Total Cash Paid in Buy-ins */}
                                        <div className="p-2 bg-white/5 rounded-xl">
                                            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Total Invested</span>
                                            <span className="text-sm font-black text-zinc-300 font-mono">
                                                £{player.cashPaid || 0}
                                            </span>
                                        </div>

                                        {/* Rebuys & Addons */}
                                        <div className="p-2 bg-white/5 rounded-xl">
                                            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Rebuys / Addons</span>
                                            <span className="text-sm font-black text-blue-400 font-mono">
                                                {player.rebuys || 0} Reb / {player.addOns || 0} Add
                                            </span>
                                        </div>

                                        {/* Bonus Chip Stack */}
                                        <div className="p-2 bg-white/5 rounded-xl">
                                            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Bonus Chips</span>
                                            <span className="text-sm font-black text-gold font-mono">
                                                {player.bonusChips ? player.bonusChips.toLocaleString() : '0'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Rival & Victim Radar */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-center justify-between">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase">Nemesis / Biggest Threat:</span>
                                            <span className="text-xs font-black text-ept-red uppercase truncate max-w-[160px]">
                                                {dossier.nemesis}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl flex items-center justify-between">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase">Favorite Prey:</span>
                                            <span className="text-xs font-black text-blue-400 uppercase truncate max-w-[160px]">
                                                {dossier.bulliedTarget}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Finals Scouting Verdict & Sarcastic Commentary Box */}
                                    <div className="p-4 bg-zinc-900/90 border border-white/10 rounded-2xl space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase">
                                            <span className="text-gold flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Official Finals Scouting Verdict
                                            </span>
                                            <span className="text-zinc-500 italic">
                                                "{dossier.quote}"
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                                            {dossier.verdict}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: BUBBLE WATCH & SCENARIOS */}
            {activeTab === 'scenarios' && (
                <div className="space-y-6">
                    {/* Monthly Ledger Connection Banner */}
                    <div className="p-4 bg-gradient-to-r from-blue-950/30 via-zinc-950 to-blue-950/30 border border-blue-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-bold text-white uppercase flex items-center gap-2">
                                    <span>Dynamically Linked to Google Sheets Ledger</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                                </div>
                                <p className="text-zinc-400 mt-0.5">
                                    As each monthly session is recorded, all qualification points, podium bubble watch statuses, and mathematical eliminations instantly recalculate.
                                </p>
                            </div>
                        </div>
                        {latestGame && (
                            <div className="px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl shrink-0 text-left md:text-right">
                                <span className="text-[10px] text-zinc-500 font-mono block">Last Session Recorded</span>
                                <span className="text-xs font-black text-gold font-mono">{latestGame.date} • £{latestGame.prizePot} Pot</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-5 bg-zinc-950 border border-white/10 rounded-2xl">
                        <div>
                            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-ept-red" />
                                2026 Qualification &amp; Playoff Scenarios
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                {gamesRemaining > 0 
                                    ? `Live mathematical requirements with ${gamesRemaining} regular season game(s) remaining before table lockdown.`
                                    : `Regular season complete! Final seeding is locked for the December Grand Final table.`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-mono font-bold uppercase">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/40 text-gold rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                                Contender (1-3)
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/40 text-blue-400 rounded-lg">
                                In The Hunt (4-6)
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {players.map((player, idx) => {
                            const rank = idx + 1;
                            const ptsBehind = leaderPoints - player.points;
                            const isLeader = rank === 1;
                            const isPodium = rank <= 3;
                            const isHunting = rank > 3 && rank <= 6;
                            const maxPossiblePoints = player.points + (gamesRemaining * 10);
                            const runnerUpMax = (players[1]?.points || 0) + (gamesRemaining * 10);
                            const canReachFirst = maxPossiblePoints >= leaderPoints;
                            const hasClenchedFirst = isLeader && gamesRemaining > 0 && player.points > runnerUpMax;

                            let statusText = 'Contender';
                            let statusColor = 'border-gold/40 bg-gold/5 text-gold';
                            let scenario = `Can score up to ${maxPossiblePoints} points. Control your own destiny.`;

                            if (player.gamesPlayed === 0) {
                                statusText = 'Hiding in Bunker';
                                statusColor = 'border-red-500 bg-red-950/40 text-red-400 animate-pulse';
                                scenario = 'Too afraid to show up (0.0% attendance). Must attend a game before points can be awarded.';
                            } else if (gamesRemaining === 0) {
                                statusText = isLeader ? '🏆 Regular Season Champion' : isPodium ? `Podium Seed #${rank}` : `Final Table Qualifier #${rank}`;
                                statusColor = isLeader ? 'border-gold bg-gold/20 text-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'border-zinc-700 bg-zinc-900 text-zinc-300';
                                scenario = 'Regular season complete! Final seeding is locked for the December Grand Final table.';
                            } else if (hasClenchedFirst) {
                                statusText = '🏆 CLINCHED #1 SEED';
                                statusColor = 'border-gold bg-gold/20 text-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]';
                                scenario = `Mathematically untouchable! No player can overcome ${player.name}'s lead even with ${gamesRemaining} game(s) remaining.`;
                            } else if (isLeader) {
                                statusText = `Current #1 Seed (+${leaderPoints - (players[1]?.points || 0)} pts)`;
                                statusColor = 'border-gold bg-gold/15 text-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]';
                                scenario = gamesRemaining === 1 
                                    ? `One game left! Needs ${Math.max(1, (players[1]?.points || 0) + 11 - player.points)} points in Game 9 to mathematically clinch the 2026 Crown.`
                                    : `Controls own destiny. A single win or top-3 finish over the remaining ${gamesRemaining} games locks in the crown.`;
                            } else if (canReachFirst) {
                                statusText = `Championship Contender (-${ptsBehind} pts)`;
                                statusColor = 'border-amber-500/50 bg-amber-500/10 text-amber-300';
                                scenario = `Can reach a maximum of ${maxPossiblePoints} points. Needs to gain ${ptsBehind + 1} points over the remaining ${gamesRemaining} game(s) to claim #1.`;
                            } else if (isPodium || isHunting) {
                                statusText = `Podium Battle (-${ptsBehind} pts)`;
                                statusColor = 'border-blue-500/50 bg-blue-500/10 text-blue-400';
                                scenario = `Mathematically eliminated from #1, but alive for Top 3 Podium cash and a favorable final table seat.`;
                            } else {
                                statusText = `Spoiler Role (-${ptsBehind} pts)`;
                                statusColor = 'border-zinc-800 bg-zinc-900/50 text-zinc-500';
                                scenario = `Play spoiler over the final ${gamesRemaining} game(s), hunt leader bounties, and secure bragging rights.`;
                            }

                            return (
                                <div
                                    key={player.name}
                                    className={`relative rounded-3xl border p-5 transition-all hover:scale-[1.01] ${
                                        isLeader 
                                            ? 'border-gold bg-gradient-to-b from-gold/10 to-black/90 shadow-[0_0_30px_rgba(212,175,55,0.2)]' 
                                            : isPodium
                                            ? 'border-amber-500/40 bg-black/80'
                                            : 'border-white/10 bg-black/60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            {/* 8-bit Avatar */}
                                            <div className={`relative w-12 h-12 rounded-2xl overflow-hidden border-2 shrink-0 bg-zinc-900 ${
                                                isLeader ? 'border-gold' : 'border-white/20'
                                            }`}>
                                                <img 
                                                    src={getAvatarFilename(player.name)} 
                                                    alt={player.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                                <span className={`absolute bottom-0 right-0 text-[8px] font-black px-1 leading-none rounded-tl ${
                                                    isLeader ? 'bg-gold text-black' : 'bg-black/80 text-white'
                                                }`}>
                                                    #{rank}
                                                </span>
                                            </div>

                                            <div>
                                                <h4 className="text-base font-black uppercase text-white truncate max-w-[150px]">
                                                    {player.name}
                                                </h4>
                                                <span className="text-xs text-zinc-400 font-mono font-bold block">
                                                    {player.points} Pts • £{player.profit}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusColor}`}>
                                            {statusText}
                                        </span>
                                    </div>

                                    <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-1.5 text-xs text-zinc-300">
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

            {/* TAB 3: AWARDS & SUPERLATIVES */}
            {activeTab === 'awards' && (
                <div className="space-y-6">
                    <div className="p-5 bg-zinc-950 border border-white/10 rounded-2xl">
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
                        <div className="rounded-3xl border-2 border-red-500/40 bg-black overflow-hidden shadow-2xl group flex flex-col justify-between">
                            <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
                                <img 
                                    src="/images/final/award_grim_reaper.jpg" 
                                    alt="The Grim Reaper" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest text-ept-red bg-black/80 border border-red-500/40 px-2.5 py-1 rounded-full">
                                    💀 Most Dangerous
                                </span>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <div>
                                    <h4 className="text-xl font-black uppercase text-white tracking-tight">The Grim Reaper</h4>
                                    <p className="text-xs text-zinc-400 mt-1">Most total eliminations delivered all year.</p>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-red-500/60 bg-zinc-900 shrink-0">
                                            <img 
                                                src={getAvatarFilename(grimReaper?.name)} 
                                                alt={grimReaper?.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Leading Bounty Hunter</span>
                                            <span className="text-sm font-black text-white uppercase">{grimReaper?.name}</span>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-ept-red font-mono">
                                        {grimReaper?.totalHistoricalKOs || grimReaper?.knockOuts} KOs
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. The Chief Sponsor / ATM */}
                        <div className="rounded-3xl border-2 border-blue-500/40 bg-black overflow-hidden shadow-2xl group flex flex-col justify-between">
                            <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
                                <img 
                                    src="/images/final/award_atm_sponsor.jpg" 
                                    alt="The ATM Award" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-black/80 border border-blue-500/40 px-2.5 py-1 rounded-full">
                                    🏦 Chief Sponsor
                                </span>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <div>
                                    <h4 className="text-xl font-black uppercase text-white tracking-tight">The ATM Award</h4>
                                    <p className="text-xs text-zinc-400 mt-1">Most rebuy and add-on contributions to the pot.</p>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-blue-500/60 bg-zinc-900 shrink-0">
                                            <img 
                                                src={getAvatarFilename(chiefSponsor?.name)} 
                                                alt={chiefSponsor?.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Pot Benefactor</span>
                                            <span className="text-sm font-black text-white uppercase">{chiefSponsor?.name}</span>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-blue-400 font-mono">
                                        {chiefSponsor?.rebuys} Rebuys
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. The Brick Wall */}
                        <div className="rounded-3xl border-2 border-emerald-500/40 bg-black overflow-hidden shadow-2xl group flex flex-col justify-between">
                            <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
                                <img 
                                    src="/images/final/award_brick_wall.jpg" 
                                    alt="The Brick Wall" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-black/80 border border-emerald-500/40 px-2.5 py-1 rounded-full">
                                    🧱 Survivor
                                </span>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <div>
                                    <h4 className="text-xl font-black uppercase text-white tracking-tight">The Brick Wall</h4>
                                    <p className="text-xs text-zinc-400 mt-1">Lowest knockout rate per game played.</p>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-emerald-500/60 bg-zinc-900 shrink-0">
                                            <img 
                                                src={getAvatarFilename(brickWall?.name)} 
                                                alt={brickWall?.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Iron Fortress</span>
                                            <span className="text-sm font-black text-white uppercase">{brickWall?.name}</span>
                                        </div>
                                    </div>
                                    <span className="text-base font-black text-emerald-400 font-mono">
                                        Iron Defense
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 4. High Roller */}
                        <div className="rounded-3xl border-2 border-gold/50 bg-black overflow-hidden shadow-2xl group flex flex-col justify-between">
                            <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
                                <img 
                                    src="/images/final/award_high_roller.jpg" 
                                    alt="The High Roller" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest text-gold bg-black/80 border border-gold/50 px-2.5 py-1 rounded-full">
                                    💎 Profit Leader
                                </span>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <div>
                                    <h4 className="text-xl font-black uppercase text-white tracking-tight">The High Roller</h4>
                                    <p className="text-xs text-zinc-400 mt-1">Highest pure financial profit across the season.</p>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-gold/60 bg-zinc-900 shrink-0">
                                            <img 
                                                src={getAvatarFilename(highRoller?.name)} 
                                                alt={highRoller?.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Cash Crown</span>
                                            <span className="text-sm font-black text-white uppercase">{highRoller?.name}</span>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-gold font-mono">
                                        +£{highRoller?.profit}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 5. River Rat */}
                        <div className="rounded-3xl border-2 border-purple-500/40 bg-black overflow-hidden shadow-2xl group flex flex-col justify-between">
                            <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
                                <img 
                                    src="/images/final/award_river_rat.jpg" 
                                    alt="River Rat of the Year" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest text-purple-400 bg-black/80 border border-purple-500/40 px-2.5 py-1 rounded-full">
                                    🌊 Miracle Maker
                                </span>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <div>
                                    <h4 className="text-xl font-black uppercase text-white tracking-tight">River Rat of 2026</h4>
                                    <p className="text-xs text-zinc-400 mt-1">Most heart-stopping bad beats and river suck-outs.</p>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-purple-500/60 bg-zinc-900 shrink-0">
                                            <img 
                                                src={getAvatarFilename(riverRat?.name)} 
                                                alt={riverRat?.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Lucky 1-Outer</span>
                                            <span className="text-sm font-black text-white uppercase">{riverRat?.name}</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-purple-400 font-mono">
                                        River Magic
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 6. Blood Feud */}
                        <div className="rounded-3xl border-2 border-orange-500/40 bg-black overflow-hidden shadow-2xl group flex flex-col justify-between">
                            <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
                                <img 
                                    src="/images/final/award_blood_feud.jpg" 
                                    alt="Blood Feud of 2026" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest text-orange-400 bg-black/80 border border-orange-500/40 px-2.5 py-1 rounded-full">
                                    ⚔️ Title Rivalry
                                </span>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <div>
                                    <h4 className="text-xl font-black uppercase text-white tracking-tight">Blood Feud of 2026</h4>
                                    <p className="text-xs text-zinc-400 mt-1">The fiercest head-to-head title collision at the table.</p>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-orange-500 bg-zinc-900" title={rival1?.name}>
                                            <img 
                                                src={getAvatarFilename(rival1?.name)} 
                                                alt={rival1?.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <span className="text-xs font-black text-orange-400">VS</span>
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-blue-500 bg-zinc-900" title={rival2?.name}>
                                            <img 
                                                src={getAvatarFilename(rival2?.name)} 
                                                alt={rival2?.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-orange-400 font-mono">
                                        Title Showdown
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: BETTING ODDS & FAN POLL */}
            {activeTab === 'odds' && (
                <div className="space-y-6">
                    <div className="p-5 bg-zinc-950 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                                <Vote className="w-5 h-5 text-gold" />
                                Championship Odds &amp; Community Predictions Poll
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Cast your vote for who takes home the 2026 Crown. Vegas odds calculated on live season form.
                            </p>
                        </div>
                        {userVote && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/40 text-green-400 rounded-lg text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Your Pick: {userVote}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {players.map((p, idx) => {
                            const rank = idx + 1;
                            const oddsNumerator = Math.max(1, Math.round(rank * 1.5));
                            const odds = p.gamesPlayed === 0 ? '500/1 (Ghost)' : rank === 1 ? 'Evens (1/1)' : `${oddsNumerator}/1`;
                            const votes = voteCounts[p.name] || 0;
                            const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0) || 1;
                            const votePercent = Math.round((votes / totalVotes) * 100);
                            const hasVoted = userVote === p.name;

                            return (
                                <div
                                    key={p.name}
                                    className={`p-5 rounded-3xl border transition-all ${
                                        hasVoted
                                            ? 'border-gold bg-gradient-to-r from-gold/15 to-black'
                                            : 'border-white/10 bg-black/60 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {/* 8-bit Avatar */}
                                            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/20 bg-zinc-900 shrink-0">
                                                <img 
                                                    src={getAvatarFilename(p.name)} 
                                                    alt={p.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                                <span className="absolute bottom-0 right-0 bg-black/80 text-white text-[8px] font-black px-1 leading-none rounded-tl">
                                                    #{rank}
                                                </span>
                                            </div>

                                            <div>
                                                <h4 className="text-base font-black uppercase text-white">{p.name}</h4>
                                                <span className="text-xs font-mono text-zinc-400 font-bold block">
                                                    Vegas Odds: <span className="text-gold">{odds}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleVote(p.name)}
                                            disabled={!!userVote}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                                hasVoted
                                                    ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                                    : userVote
                                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                                    : 'bg-zinc-800 hover:bg-gold hover:text-black text-white hover:scale-105'
                                            }`}
                                        >
                                            {hasVoted ? 'Your Pick' : 'Vote'}
                                        </button>
                                    </div>

                                    {/* Vote meter */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                                            <span>Community Confidence</span>
                                            <span className="text-gold">{votePercent}% ({votes} votes)</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-yellow-600 via-gold to-yellow-400 rounded-full transition-all duration-500"
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

            {/* TAB 5: PRIZE VAULT */}
            {activeTab === 'payouts' && (
                <div className="space-y-6">
                    <div className="p-5 bg-zinc-950 border border-white/10 rounded-2xl">
                        <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                            <Coins className="w-5 h-5 text-gold" />
                            Grand Final Prize Vault &amp; Payout Structure
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Estimated distributions for the December championship final table based on total league funds.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* 1st Place */}
                        <div className="p-6 rounded-3xl border-2 border-gold bg-gradient-to-b from-gold/20 to-black text-center relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.25)] flex flex-col justify-between">
                            <div>
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-gold mx-auto mb-3 bg-zinc-900 shadow-md">
                                    <img 
                                        src={getAvatarFilename(players[0]?.name)} 
                                        alt={players[0]?.name} 
                                        className="w-full h-full object-cover" 
                                    />
                                    <span className="absolute top-0 right-0 bg-gold text-black text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg">
                                        #1
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gold block mb-1">
                                    1st Place Champion
                                </span>
                                <div className="text-4xl font-black text-white font-mono mb-2">
                                    ~£{firstPayout}
                                </div>
                                <p className="text-xs text-zinc-400">
                                    50% of Season Pot + Official Trophy &amp; Crown.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gold/30 text-[11px] text-gold font-bold">
                                Projected: {players[0]?.name}
                            </div>
                        </div>

                        {/* 2nd Place */}
                        <div className="p-6 rounded-3xl border border-white/20 bg-zinc-950 text-center relative overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-zinc-400 mx-auto mb-3 bg-zinc-900 shadow-md">
                                    <img 
                                        src={getAvatarFilename(players[1]?.name)} 
                                        alt={players[1]?.name} 
                                        className="w-full h-full object-cover" 
                                    />
                                    <span className="absolute top-0 right-0 bg-zinc-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg">
                                        #2
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">
                                    2nd Place Runner-Up
                                </span>
                                <div className="text-4xl font-black text-white font-mono mb-2">
                                    ~£{secondPayout}
                                </div>
                                <p className="text-xs text-zinc-400">
                                    30% of Season Pot.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-zinc-300 font-bold">
                                Projected: {players[1]?.name}
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="p-6 rounded-3xl border border-amber-800/50 bg-zinc-950 text-center relative overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-700 mx-auto mb-3 bg-zinc-900 shadow-md">
                                    <img 
                                        src={getAvatarFilename(players[2]?.name)} 
                                        alt={players[2]?.name} 
                                        className="w-full h-full object-cover" 
                                    />
                                    <span className="absolute top-0 right-0 bg-amber-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg">
                                        #3
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-1">
                                    3rd Place Podium
                                </span>
                                <div className="text-4xl font-black text-white font-mono mb-2">
                                    ~£{thirdPayout}
                                </div>
                                <p className="text-xs text-zinc-400">
                                    15% of Season Pot.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-amber-500 font-bold">
                                Projected: {players[2]?.name}
                            </div>
                        </div>

                        {/* Bounty Bonus */}
                        <div className="p-6 rounded-3xl border border-red-500/40 bg-zinc-950 text-center relative overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-red-500 mx-auto mb-3 bg-zinc-900 shadow-md">
                                    <img 
                                        src={getAvatarFilename(grimReaper?.name)} 
                                        alt={grimReaper?.name} 
                                        className="w-full h-full object-cover" 
                                    />
                                    <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg">
                                        KO
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-ept-red block mb-1">
                                    Top Bounty Hunter
                                </span>
                                <div className="text-4xl font-black text-white font-mono mb-2">
                                    ~£{bountyBonus}
                                </div>
                                <p className="text-xs text-zinc-400">
                                    5% Bonus Golden Bounty Pool.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-ept-red font-bold">
                                Projected: {grimReaper?.name}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
