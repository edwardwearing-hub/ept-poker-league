'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Trophy,
  Coins,
  Crown,
  Medal,
  TrendingUp,
  Brain,
  Play,
  ArrowRight,
  ExternalLink,
  ChevronUp,
  Flame,
  Award,
  Zap,
  Swords,
  Search,
  Sparkles,
  Users,
  Shield,
  HelpCircle,
  Dices,
  Gamepad2,
} from 'lucide-react';
import {
  AcademyLeaderboardEntry,
  AcademyTrainingLevel,
  BASE_ACADEMY_BANKROLL,
  computeTotalAcademyChips,
} from '@/lib/poker-trainer/leaderboard';
import {
  loadTrackerStatsForPlayer,
  getUnclaimedGuestWinnings,
  transferGuestChipsToPlayer,
} from '@/lib/poker-trainer/tracker';
import { ScenarioPreset } from '@/lib/poker-trainer/types';
import InfoTooltip from './InfoTooltip';

interface Props {
  activePlayerName: string;
  onLaunchPresetDrill: (preset: ScenarioPreset) => void;
}

export type GameDiscipline =
  | 'all'
  | 'poker'
  | 'slots'
  | 'blackjack'
  | 'roulette-craps'
  | 'sportsbook';

export interface DisciplineMeta {
  id: GameDiscipline;
  label: string;
  shortLabel: string;
  icon: string;
  tagline: string;
  description: string;
  badge: string;
  bgActive: string;
  playUrl: string;
  playLabel: string;
}

export const DISCIPLINE_TABS: DisciplineMeta[] = [
  {
    id: 'all',
    label: 'Overall High Roller',
    shortLabel: 'All Games',
    icon: '👑',
    badge: 'Master',
    tagline: 'Combined Multi-Game Championship',
    description:
      'Master standings combining Poker Arena, Slot Machines, VIP Table Games, and Sportsbook wagering.',
    bgActive: 'bg-gradient-to-r from-[#ffd700] via-[#cfb53b] to-amber-600 text-black font-black',
    playUrl: '/vegas',
    playLabel: 'Open Casino Floor',
  },
  {
    id: 'poker',
    label: 'Poker Academy League',
    shortLabel: 'Poker Arena',
    icon: '♠️',
    badge: "Hold'em",
    tagline: "AI Bot Arena & Virtual Coach Accuracy",
    description:
      "Tracked strictly across Hold'em Bot Arena sessions, GTO Decision Accuracy, and poker tournament earnings.",
    bgActive: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-black',
    playUrl: '/academy?tab=arena',
    playLabel: 'Play Bot Arena',
  },
  {
    id: 'slots',
    label: 'Slots & Fruity League',
    shortLabel: 'Slots & Fruity',
    icon: '🎰',
    badge: 'Jackpots',
    tagline: 'Mega Wild Diamond & Authentic Pub Fruit Machines',
    description:
      'Standings ranked by net profit on Las Vegas 5-Line Slots and English Pub Fruit Machines.',
    bgActive: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 text-white font-black',
    playUrl: '/vegas?game=slots',
    playLabel: 'Spin Slots Now',
  },
  {
    id: 'blackjack',
    label: 'Blackjack & Table Games',
    shortLabel: 'Blackjack & Tables',
    icon: '🃏',
    badge: '21 Natural',
    tagline: 'Vegas Blackjack, Baccarat & Table Classics',
    description:
      'Standings ranked by table card performance against AI Hostess & Dealer Sarah.',
    bgActive: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 text-white font-black',
    playUrl: '/vegas?game=blackjack',
    playLabel: 'Play Blackjack Table',
  },
  {
    id: 'roulette-craps',
    label: 'Roulette & Craps League',
    shortLabel: 'Roulette & Craps',
    icon: '🎲',
    badge: 'Dice & Wheel',
    tagline: 'European Single-Zero Wheel & Vegas Craps Dice',
    description:
      'Standings ranked by wheel spins and dice rolls on the high-roller casino felt.',
    bgActive: 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-500 text-black font-black',
    playUrl: '/vegas?game=roulette',
    playLabel: 'Spin Roulette Wheel',
  },
  {
    id: 'sportsbook',
    label: 'EPT Sportsbook League',
    shortLabel: 'Sportsbook',
    icon: '⚽',
    badge: 'Handicappers',
    tagline: 'Sports Wagering Odds, Slips & Multi-Leg Parlays',
    description:
      'Standings ranked by sports handicapping profit and multi-leg parlay cashouts.',
    bgActive: 'bg-gradient-to-r from-cyan-600 via-blue-600 to-sky-500 text-white font-black',
    playUrl: '/vegas?game=sportsbook',
    playLabel: 'Place Sportsbook Bets',
  },
];

export interface PlayerDisciplineStats {
  netWon: number;
  bankroll: number;
  plays: number;
  playsLabel: string;
  primaryStatLabel: string;
  primaryStatValue: string;
  secondaryStatLabel: string;
  secondaryStatValue: string;
  isEligible: boolean;
}

export function getPlayerDisciplineStats(
  entry: AcademyLeaderboardEntry,
  discipline: GameDiscipline
): PlayerDisciplineStats {
  const gNet = entry.gameNetChips || {};
  const gPlays = entry.gamePlaysCount || {};

  if (discipline === 'slots') {
    const net = (gNet.slots || 0) + (gNet['pub-fruity'] || 0);
    const plays = (gPlays.slots || 0) + (gPlays['pub-fruity'] || 0);
    return {
      netWon: net,
      bankroll: 10000 + net,
      plays,
      playsLabel: 'Spins',
      primaryStatLabel: 'Slot Profit',
      primaryStatValue: `${net >= 0 ? '+' : ''}£${net.toLocaleString()}`,
      secondaryStatLabel: 'Spins Taken',
      secondaryStatValue: `${plays} Spins`,
      isEligible: plays > 0 || net !== 0,
    };
  }

  if (discipline === 'blackjack') {
    const net =
      (gNet.blackjack || 0) +
      (gNet.baccarat || 0) +
      (gNet['ultimate-holdem'] || 0) +
      (gNet['pai-gow'] || 0) +
      (gNet['video-poker'] || 0);
    const plays =
      (gPlays.blackjack || 0) +
      (gPlays.baccarat || 0) +
      (gPlays['ultimate-holdem'] || 0) +
      (gPlays['pai-gow'] || 0) +
      (gPlays['video-poker'] || 0);
    return {
      netWon: net,
      bankroll: 10000 + net,
      plays,
      playsLabel: 'Hands',
      primaryStatLabel: 'Table Profit',
      primaryStatValue: `${net >= 0 ? '+' : ''}£${net.toLocaleString()}`,
      secondaryStatLabel: 'Hands Dealt',
      secondaryStatValue: `${plays} Hands`,
      isEligible: plays > 0 || net !== 0,
    };
  }

  if (discipline === 'roulette-craps') {
    const net = (gNet.roulette || 0) + (gNet.craps || 0);
    const plays = (gPlays.roulette || 0) + (gPlays.craps || 0);
    return {
      netWon: net,
      bankroll: 10000 + net,
      plays,
      playsLabel: 'Rounds',
      primaryStatLabel: 'Wheel & Dice Net',
      primaryStatValue: `${net >= 0 ? '+' : ''}£${net.toLocaleString()}`,
      secondaryStatLabel: 'Rounds Played',
      secondaryStatValue: `${plays} Rounds`,
      isEligible: plays > 0 || net !== 0,
    };
  }

  if (discipline === 'sportsbook') {
    const net = gNet.sportsbook || 0;
    const plays = gPlays.sportsbook || 0;
    return {
      netWon: net,
      bankroll: 10000 + net,
      plays,
      playsLabel: 'Bets',
      primaryStatLabel: 'Sportsbook Net',
      primaryStatValue: `${net >= 0 ? '+' : ''}£${net.toLocaleString()}`,
      secondaryStatLabel: 'Slips Settled',
      secondaryStatValue: `${plays} Bets`,
      isEligible: plays > 0 || net !== 0,
    };
  }

  if (discipline === 'poker') {
    const casinoNet =
      (gNet.slots || 0) +
      (gNet['pub-fruity'] || 0) +
      (gNet.blackjack || 0) +
      (gNet.baccarat || 0) +
      (gNet['ultimate-holdem'] || 0) +
      (gNet['pai-gow'] || 0) +
      (gNet['video-poker'] || 0) +
      (gNet.roulette || 0) +
      (gNet.craps || 0) +
      (gNet.sportsbook || 0);
    const net = gNet.poker ?? (entry.netChipsWon - casinoNet);
    const plays = entry.handsPlayed;
    return {
      netWon: net,
      bankroll: 10000 + net,
      plays,
      playsLabel: 'Hands',
      primaryStatLabel: 'Poker Net',
      primaryStatValue: `${net >= 0 ? '+' : ''}£${net.toLocaleString()}`,
      secondaryStatLabel: 'Coach Grade',
      secondaryStatValue: `${entry.coachGrade}% Accuracy`,
      isEligible: plays > 0 || net !== 0,
    };
  }

  // All (Master combined)
  const totalCasinoPlays = Object.values(gPlays).reduce((a, b) => a + b, 0);
  return {
    netWon: entry.netChipsWon,
    bankroll: entry.chips,
    plays: entry.handsPlayed + totalCasinoPlays,
    playsLabel: 'Plays',
    primaryStatLabel: 'Overall Profit',
    primaryStatValue: `${entry.netChipsWon >= 0 ? '+' : ''}£${entry.netChipsWon.toLocaleString()}`,
    secondaryStatLabel: 'Total Balance',
    secondaryStatValue: `£${entry.chips.toLocaleString()}`,
    isEligible: true,
  };
}

type SortField = 'chips' | 'netChipsWon' | 'coachGrade' | 'handsPlayed';
type LeagueDivision = 'challengers' | 'veterans';
type ChallengerFilter = 'all' | 'veterans' | 'contenders';

export default function AcademyChipLeaderboard({
  activePlayerName,
  onLaunchPresetDrill,
}: Props) {
  const searchParams = useSearchParams();
  const initialDiscipline = (searchParams.get('discipline') as GameDiscipline) || 'all';

  const [leaderboard, setLeaderboard] = useState<AcademyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [discipline, setDiscipline] = useState<GameDiscipline>(
    ['all', 'poker', 'slots', 'blackjack', 'roulette-craps', 'sportsbook'].includes(
      initialDiscipline
    )
      ? initialDiscipline
      : 'all'
  );
  const [sortField, setSortField] = useState<SortField>('chips');
  const [leagueDivision, setLeagueDivision] = useState<LeagueDivision>('challengers');
  const [challengerFilter, setChallengerFilter] = useState<ChallengerFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasLocalUnsyncedWinnings, setHasLocalUnsyncedWinnings] = useState(false);
  const [localChipDelta, setLocalChipDelta] = useState(0);
  const [unclaimedGuestChips, setUnclaimedGuestChips] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Sync state if query param changes
  useEffect(() => {
    const param = searchParams.get('discipline') as GameDiscipline | null;
    if (
      param &&
      ['all', 'poker', 'slots', 'blackjack', 'roulette-craps', 'sportsbook'].includes(param)
    ) {
      setDiscipline(param);
    }
  }, [searchParams]);

  const activeDisciplineMeta = useMemo(() => {
    return (
      DISCIPLINE_TABS.find((d) => d.id === discipline) || DISCIPLINE_TABS[0]
    );
  }, [discipline]);

  const handleSelectDiscipline = (newDisc: GameDiscipline) => {
    setDiscipline(newDisc);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'leaderboard');
      if (newDisc === 'all') {
        url.searchParams.delete('discipline');
      } else {
        url.searchParams.set('discipline', newDisc);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const isGuest =
    !activePlayerName ||
    activePlayerName.toLowerCase().trim() === 'guest trainee' ||
    activePlayerName.toLowerCase().startsWith('guest');

  const loadLeaderboardData = () => {
    fetch(`/api/player/academy-leaderboard?name=${encodeURIComponent(activePlayerName)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.leaderboard)) {
          let list: AcademyLeaderboardEntry[] = [...data.leaderboard];

          // Check if local device has un-synced winnings (e.g. from slot machine or offline play)
          if (activePlayerName && !isGuest) {
            const localStats = loadTrackerStatsForPlayer(activePlayerName);
            const localChips = computeTotalAcademyChips(localStats);
            const matchIdx = list.findIndex(
              (e) => e.name.toLowerCase().trim() === activePlayerName.toLowerCase().trim()
            );

            if (matchIdx !== -1 && localChips > list[matchIdx].chips) {
              const delta = localChips - list[matchIdx].chips;
              setHasLocalUnsyncedWinnings(true);
              setLocalChipDelta(delta);
              list[matchIdx] = {
                ...list[matchIdx],
                chips: localChips,
                netChipsWon: (localStats.netChipsWon || 0) + (localStats.bountyCashWon || 0),
                gameNetChips: localStats.gameNetChips || list[matchIdx].gameNetChips,
                gamePlaysCount: localStats.gamePlaysCount || list[matchIdx].gamePlaysCount,
              };
              // Re-sort with local chips
              list.sort((a, b) => {
                if (b.chips !== a.chips) return b.chips - a.chips;
                if (b.handsPlayed !== a.handsPlayed) return b.handsPlayed - a.handsPlayed;
                return b.coachGrade - a.coachGrade;
              });
              list.forEach((entry, idx) => {
                entry.rank = idx + 1;
              });
            } else {
              setHasLocalUnsyncedWinnings(false);
              setLocalChipDelta(0);
            }
          }

          setLeaderboard(list);
        }
      })
      .catch((err) => console.error('Failed to load academy leaderboard:', err))
      .finally(() => setLoading(false));

    setUnclaimedGuestChips(getUnclaimedGuestWinnings());
  };

  useEffect(() => {
    loadLeaderboardData();
  }, [activePlayerName]);

  const handleClaimGuestChips = () => {
    if (!activePlayerName || isGuest) {
      window.dispatchEvent(new CustomEvent('ept_open_login'));
      return;
    }
    const res = transferGuestChipsToPlayer(activePlayerName);
    setUnclaimedGuestChips(0);
    setSyncFeedback(
      `🎉 Claimed +£${res.transferredChips.toLocaleString()} in guest session winnings to ${activePlayerName}! Total Bankroll: £${res.newTotalChips.toLocaleString()}.`
    );
    loadLeaderboardData();
    window.dispatchEvent(new Event('storage'));
  };

  const handleSyncToCloud = async () => {
    if (!activePlayerName || isGuest) {
      window.dispatchEvent(new CustomEvent('ept_open_login'));
      return;
    }
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const localStats = loadTrackerStatsForPlayer(activePlayerName);
      const res = await fetch('/api/player/academy-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ name: activePlayerName, stats: localStats }),
      });
      if (res.status === 401) {
        setSyncFeedback(
          'PIN authentication required: enter your 4-digit PIN to authorize saving to the public leaderboard.'
        );
        window.dispatchEvent(new CustomEvent('ept_open_login'));
      } else if (res.ok) {
        setHasLocalUnsyncedWinnings(false);
        setSyncFeedback('✅ Successfully published bankroll to the public Academy Leaderboard!');
        loadLeaderboardData();
      } else {
        setSyncFeedback('Could not sync to cloud. Please check connection and try again.');
      }
    } catch {
      setSyncFeedback('Network error while syncing to cloud.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Filter by League Division & Sub-filter
  const divisionPlayers = useMemo(() => {
    if (leagueDivision === 'veterans') {
      return leaderboard.filter((p) => p.isRosterPlayer);
    }
    // Challenger division (Open Benchmark League)
    if (challengerFilter === 'veterans') {
      return leaderboard.filter((p) => p.isRosterPlayer);
    }
    if (challengerFilter === 'contenders') {
      return leaderboard.filter((p) => !p.isRosterPlayer);
    }
    return leaderboard;
  }, [leaderboard, leagueDivision, challengerFilter]);

  // 2. Filter by Search Query
  const searchedPlayers = useMemo(() => {
    if (!searchQuery.trim()) return divisionPlayers;
    const q = searchQuery.toLowerCase().trim();
    return divisionPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nickname.toLowerCase().includes(q)
    );
  }, [divisionPlayers, searchQuery]);

  // 3. Attach Discipline Stats & Sort Players for Selected League
  const sortedPlayers = useMemo(() => {
    const list = searchedPlayers.map((player) => {
      const stats = getPlayerDisciplineStats(player, discipline);
      return {
        ...player,
        disciplineStats: stats,
      };
    });

    list.sort((a, b) => {
      if (discipline === 'all') {
        if (sortField === 'chips') return b.chips - a.chips;
        if (sortField === 'netChipsWon') return b.netChipsWon - a.netChipsWon;
        if (sortField === 'coachGrade') return b.coachGrade - a.coachGrade;
        if (sortField === 'handsPlayed') return b.handsPlayed - a.handsPlayed;
        return b.chips - a.chips;
      }

      if (discipline === 'poker') {
        if (sortField === 'coachGrade') return b.coachGrade - a.coachGrade;
        if (sortField === 'handsPlayed') return b.handsPlayed - a.handsPlayed;
        if (b.disciplineStats.netWon !== a.disciplineStats.netWon) {
          return b.disciplineStats.netWon - a.disciplineStats.netWon;
        }
        return b.coachGrade - a.coachGrade;
      }

      // Casino game leagues (slots, blackjack, roulette-craps, sportsbook)
      // Rank by game-specific net profit first!
      if (b.disciplineStats.netWon !== a.disciplineStats.netWon) {
        return b.disciplineStats.netWon - a.disciplineStats.netWon;
      }
      if (b.disciplineStats.plays !== a.disciplineStats.plays) {
        return b.disciplineStats.plays - a.disciplineStats.plays;
      }
      return b.chips - a.chips;
    });

    return list.map((item, idx) => ({
      ...item,
      divisionRank: idx + 1,
    }));
  }, [searchedPlayers, discipline, sortField]);

  const top3 = sortedPlayers.slice(0, 3);

  const userEntry = useMemo(() => {
    return sortedPlayers.find(
      (e) => e.name.toLowerCase().trim() === activePlayerName.toLowerCase().trim()
    );
  }, [sortedPlayers, activePlayerName]);

  const userIdx = useMemo(() => {
    return sortedPlayers.findIndex(
      (e) => e.name.toLowerCase().trim() === activePlayerName.toLowerCase().trim()
    );
  }, [sortedPlayers, activePlayerName]);

  const nextRankEntry = userIdx > 0 ? sortedPlayers[userIdx - 1] : null;
  const chipsToNextRank =
    nextRankEntry && userEntry
      ? Math.max(
          0,
          (discipline === 'all'
            ? nextRankEntry.chips
            : nextRankEntry.disciplineStats.netWon) -
            (discipline === 'all'
              ? userEntry.chips
              : userEntry.disciplineStats.netWon)
        )
      : 0;

  // Total counts
  const totalVeterans = useMemo(
    () => leaderboard.filter((p) => p.isRosterPlayer).length,
    [leaderboard]
  );
  const totalContenders = useMemo(
    () => leaderboard.filter((p) => !p.isRosterPlayer).length,
    [leaderboard]
  );

  const veteransBeaten = useMemo(() => {
    if (!userEntry) return 0;
    const userVal =
      discipline === 'all'
        ? userEntry.chips
        : userEntry.disciplineStats.netWon;
    return sortedPlayers.filter((p) => {
      const pVal =
        discipline === 'all' ? p.chips : p.disciplineStats.netWon;
      return p.isRosterPlayer && pVal < userVal;
    }).length;
  }, [sortedPlayers, userEntry, discipline]);

  const getTierBadgeStyle = (tier: AcademyTrainingLevel) => {
    switch (tier) {
      case 'GTO Master':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]';
      case 'Pro Shark':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
      case 'EPT Regular':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'Rookie Trainee':
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Academy Chip Economy & Status Box */}
      <div className="glass-panel-gold rounded-2xl p-6 border border-gold/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-black uppercase tracking-widest">
            <Coins size={14} />
            <span>Academy Bankroll & Multi-Game Leagues</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>{activeDisciplineMeta.icon}</span>
            <span>{activeDisciplineMeta.label}</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {activeDisciplineMeta.description} Every player starts with £
            {BASE_ACADEMY_BANKROLL.toLocaleString()} baseline chips. Winnings are tracked across games with real-time league rankings.
          </p>
        </div>

        {/* Logged-in Player Quick Status Box */}
        {userEntry ? (
          <div className="bg-black/70 border border-gold/40 rounded-xl p-4 flex flex-col items-center sm:items-start gap-2 shrink-0 min-w-[270px]">
            <div className="text-[10px] text-zinc-400 uppercase font-bold flex items-center justify-between w-full">
              <span>{activeDisciplineMeta.shortLabel} Standing:</span>
              <span className="font-mono text-gold font-black">
                Rank #{userEntry.divisionRank} of {sortedPlayers.length}
              </span>
            </div>
            <div className="flex items-center gap-3 w-full">
              <img
                src={userEntry.avatar}
                alt={userEntry.name}
                className="w-10 h-10 rounded-full border border-gold object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-white leading-tight truncate flex items-center gap-1.5">
                  <span>{userEntry.name}</span>
                  {userEntry.isRosterPlayer ? (
                    <span className="px-1 py-0.2 rounded bg-amber-500/20 text-gold border border-gold/40 text-[8px] font-black uppercase">
                      Veteran
                    </span>
                  ) : (
                    <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[8px] font-black uppercase">
                      Contender
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono font-black text-gold">
                  {userEntry.disciplineStats.primaryStatLabel}:{' '}
                  <span className="text-emerald-400 font-bold">
                    {userEntry.disciplineStats.primaryStatValue}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-zinc-400">
                  Total Bankroll: £{userEntry.chips.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Benchmark Indicator */}
            {!userEntry.isRosterPlayer && (
              <div className="w-full text-[10px] font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2 py-1 rounded-lg flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Swords size={11} className="text-cyan-400" /> Veteran Benchmark:
                </span>
                <span className="text-white font-mono font-black">
                  {veteransBeaten > 0
                    ? `Ahead of ${veteransBeaten}/${totalVeterans} 🏆`
                    : `Chasing the 11 Veterans`}
                </span>
              </div>
            )}

            {userEntry.bankruptcyCount > 0 && (
              <div className="w-full text-[10px] font-black text-red-300 bg-red-950/80 border border-red-500/60 px-2 py-1 rounded-lg flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>🤡</span> Bankrupt Status:
                </span>
                <span className="text-red-200">
                  Felted ×{userEntry.bankruptcyCount} (+£
                  {(
                    userEntry.bailoutChipsReceived ||
                    userEntry.bankruptcyCount * 1000
                  ).toLocaleString()}{' '}
                  loan)
                </span>
              </div>
            )}

            {chipsToNextRank > 0 && nextRankEntry && (
              <div className="text-[11px] text-zinc-300 bg-white/5 px-2.5 py-1 rounded-lg w-full border border-white/5">
                <span className="text-emerald-400 font-bold">
                  +£{chipsToNextRank.toLocaleString()}
                </span>{' '}
                to pass #{nextRankEntry.divisionRank}{' '}
                {nextRankEntry.name.split(' ')[0]}!
              </div>
            )}

            {discipline === 'poker' || discipline === 'all' ? (
              <button
                onClick={() => onLaunchPresetDrill('free-play')}
                className="w-full mt-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow hover:brightness-110 transition"
              >
                <Play size={12} fill="currentColor" /> Play in Bot Arena
              </button>
            ) : (
              <Link
                href={activeDisciplineMeta.playUrl}
                className="w-full mt-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow hover:brightness-110 transition text-center"
              >
                <Play size={12} fill="currentColor" /> {activeDisciplineMeta.playLabel} →
              </Link>
            )}
          </div>
        ) : isGuest ? (
          <div className="bg-black/70 border border-amber-500/40 rounded-xl p-4 flex flex-col items-center sm:items-start gap-2 shrink-0 min-w-[270px]">
            <div className="text-[10px] text-amber-400 uppercase font-black flex items-center gap-1">
              <span>👁️</span> Guest Trainee Mode
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              You are playing unranked. Claim a player handle to save your bankroll and join the Open Challenger League!
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('ept_open_login'))}
              className="w-full mt-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:brightness-110 transition"
            >
              <Sparkles size={12} /> Claim Handle & Join League
            </button>
          </div>
        ) : null}
      </div>

      {/* MULTI-GAME LEAGUE DISCIPLINE SELECTOR STRIP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Trophy size={14} className="text-gold" />
            <span>Select Game League Championship:</span>
          </span>
          <span className="text-[10px] text-gold font-mono font-bold">
            {activeDisciplineMeta.tagline}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {DISCIPLINE_TABS.map((tab) => {
            const isSelected = discipline === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectDiscipline(tab.id)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 relative overflow-hidden ${
                  isSelected
                    ? `${tab.bgActive} border-white/50 shadow-lg scale-[1.02] ring-1 ring-gold/40`
                    : 'bg-black/60 hover:bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg">{tab.icon}</span>
                  <span
                    className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded ${
                      isSelected
                        ? 'bg-black/40 text-white border border-white/20'
                        : 'bg-white/5 text-zinc-400 border border-white/10'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </div>
                <div>
                  <div
                    className={`text-xs font-black tracking-tight leading-tight ${
                      isSelected ? 'text-inherit' : 'text-zinc-200'
                    }`}
                  >
                    {tab.shortLabel}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isSelected ? 'opacity-85' : 'text-zinc-500'
                    }`}
                  >
                    {tab.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="bg-gradient-to-r from-blue-950/90 via-black to-blue-950/90 border border-blue-500/60 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-blue-200 shadow-lg animate-in fade-in">
          <span>{syncFeedback}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-white/10 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Local Device Bankroll Ahead Banner: Reconciles offline/Vegas slot winnings */}
      {hasLocalUnsyncedWinnings && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-black to-emerald-950/90 border-2 border-emerald-500/70 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in fade-in">
          <div className="flex items-center gap-3.5 text-xs text-emerald-100">
            <span className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center justify-center text-lg font-black shrink-0 shadow">
              ⚡
            </span>
            <div>
              <div className="font-black text-sm uppercase text-emerald-300 flex items-center gap-2">
                <span>Local Device Winnings Reconciled</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  +£{localChipDelta.toLocaleString()} CHIPS
                </span>
              </div>
              <p className="text-zinc-300 text-xs mt-0.5">
                Your device has{' '}
                <strong className="text-gold font-mono">
                  £{(userEntry?.chips || 0).toLocaleString()}
                </strong>{' '}
                total chips (including Slot Machine & Vegas play). Your updated position is shown below! Publish now to lock in your rank on the cloud server.
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncToCloud}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs tracking-wider shadow hover:brightness-110 active:scale-95 transition whitespace-nowrap disabled:opacity-50 shrink-0"
          >
            {isSyncing ? 'Syncing...' : 'Publish to Cloud Leaderboard →'}
          </button>
        </div>
      )}

      {/* Unclaimed Guest Vegas Winnings Banner */}
      {unclaimedGuestChips > 0 && (
        <div className="bg-gradient-to-r from-purple-950/90 via-black to-purple-950/90 border-2 border-purple-500/70 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(168,85,247,0.3)] animate-in fade-in">
          <div className="flex items-center gap-3.5 text-xs text-purple-100">
            <span className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/50 flex items-center justify-center text-lg font-black shrink-0 shadow">
              🎰
            </span>
            <div>
              <div className="font-black text-sm uppercase text-purple-300 flex items-center gap-2">
                <span>Unclaimed Vegas Slot Winnings</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                  +£{unclaimedGuestChips.toLocaleString()}
                </span>
              </div>
              <p className="text-zinc-300 text-xs mt-0.5">
                You accumulated winnings on the Slot Machine during an unlinked session. Claim them now to add them directly to{' '}
                <strong className="text-gold">{isGuest ? 'your player profile' : activePlayerName}</strong>!
              </p>
            </div>
          </div>
          <button
            onClick={handleClaimGuestChips}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black uppercase text-xs tracking-wider shadow hover:brightness-110 active:scale-95 transition whitespace-nowrap shrink-0"
          >
            Claim +£{unclaimedGuestChips.toLocaleString()} to {isGuest ? 'My Player' : activePlayerName} →
          </button>
        </div>
      )}

      {/* 2-League Navigation Tabs */}
      <div className="bg-black/60 p-2 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Tab 1: Open Challenger League */}
          <button
            onClick={() => {
              setLeagueDivision('challengers');
              setChallengerFilter('all');
            }}
            className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center sm:justify-start gap-2.5 transition relative overflow-hidden ${
              leagueDivision === 'challengers'
                ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Swords size={18} className={leagueDivision === 'challengers' ? 'text-white' : 'text-cyan-400'} />
            <div className="text-left">
              <div className="leading-tight flex items-center gap-1.5">
                <span>Open Challenger League</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-cyan-200 border border-white/10">
                  Benchmark
                </span>
              </div>
              <div className="text-[10px] font-normal lowercase tracking-normal text-cyan-100 opacity-90">
                All players vs EPT veterans ({leaderboard.length})
              </div>
            </div>
          </button>

          {/* Tab 2: EPT Veterans Roster */}
          <button
            onClick={() => {
              setLeagueDivision('veterans');
              setChallengerFilter('all');
            }}
            className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center sm:justify-start gap-2.5 transition relative overflow-hidden ${
              leagueDivision === 'veterans'
                ? 'bg-gradient-to-r from-[#ffd700] via-[#cfb53b] to-amber-600 text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-white/50'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Crown size={18} className={leagueDivision === 'veterans' ? 'text-black' : 'text-gold'} />
            <div className="text-left">
              <div className="leading-tight flex items-center gap-1.5">
                <span>EPT Veterans Roster</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/30 text-amber-200 border border-black/20">
                  Core 11
                </span>
              </div>
              <div className="text-[10px] font-normal lowercase tracking-normal opacity-90">
                Founding league members ({totalVeterans})
              </div>
            </div>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              leagueDivision === 'veterans'
                ? 'Search veteran...'
                : 'Search players or veterans...'
            }
            className="pl-8 pr-3 py-2 rounded-xl bg-black/80 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition w-full sm:w-64"
          />
        </div>
      </div>

      {/* Promotional / Explainer Banner depending on Active League */}
      {leagueDivision === 'challengers' ? (
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-blue-950/80 via-black to-cyan-950/70 p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Swords size={12} />
                  Open Benchmark Division
                </span>
                <span className="text-zinc-400 text-xs">
                  {activeDisciplineMeta.shortLabel} Division
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>See How You Rank in {activeDisciplineMeta.label}! ⚔️</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
                Every player starts with a baseline £10,000 bankroll. Compare your {activeDisciplineMeta.shortLabel} net profit and achievements directly against the founding 11 EPT League veterans.
              </p>
            </div>

            {/* Benchmark Quick Stats */}
            <div className="flex items-center gap-3 shrink-0 bg-black/70 border border-cyan-500/30 rounded-xl p-3 shadow-inner">
              <div className="text-center px-2">
                <div className="text-[10px] font-bold uppercase text-zinc-400">EPT Veterans</div>
                <div className="text-base font-black text-gold font-mono">{totalVeterans}</div>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="text-center px-2">
                <div className="text-[10px] font-bold uppercase text-zinc-400">Contenders</div>
                <div className="text-base font-black text-cyan-300 font-mono">{totalContenders}</div>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="text-center px-2">
                <div className="text-[10px] font-bold uppercase text-zinc-400">Starting Roll</div>
                <div className="text-base font-black text-emerald-400 font-mono">£10k</div>
              </div>
            </div>
          </div>

          {/* Sub-Filters for Challenger League */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-zinc-400 font-bold uppercase mr-1">Filter View:</span>
            <button
              onClick={() => setChallengerFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                challengerFilter === 'all'
                  ? 'bg-cyan-500 text-black shadow font-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              All Competitors ({leaderboard.length})
            </button>
            <button
              onClick={() => setChallengerFilter('contenders')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                challengerFilter === 'contenders'
                  ? 'bg-cyan-500 text-black shadow font-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles size={12} />
              <span>Contenders Only ({totalContenders})</span>
            </button>
            <button
              onClick={() => setChallengerFilter('veterans')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                challengerFilter === 'veterans'
                  ? 'bg-gold text-black shadow font-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Crown size={12} />
              <span>Veterans Only ({totalVeterans})</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-r from-amber-950/80 via-black to-zinc-950 p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-gold/20 text-gold border border-gold/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Crown size={12} />
                  Official EPT Roster
                </span>
                <span className="text-zinc-400 text-xs">The 11 Original League Members</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                EPT Veterans {activeDisciplineMeta.shortLabel} Championship 🏆
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
                Exclusive standings for the founding 11 EPT League players in {activeDisciplineMeta.label}.
              </p>
            </div>
            <div className="text-right shrink-0 hidden md:block">
              <div className="text-xs font-black uppercase text-gold">Official League Roster</div>
              <div className="text-xs text-zinc-400">11 Verified Members</div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium Display */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          {/* Rank #2 Silver Podium */}
          <div className="order-2 md:order-1 glass-panel p-5 rounded-2xl border border-zinc-400/40 flex flex-col items-center text-center relative bg-gradient-to-b from-zinc-800/40 via-black to-zinc-950 shadow-xl">
            <div className="w-8 h-8 rounded-full bg-zinc-400 text-black font-black text-sm flex items-center justify-center mb-2 shadow">
              #2
            </div>
            <div className="relative mb-2">
              <img
                src={top3[1].avatar}
                alt={top3[1].name}
                className="w-16 h-16 rounded-full border-2 border-zinc-300 object-cover shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-zinc-800 text-[9px] font-black text-zinc-200 border border-zinc-500">
                🥈 Silver
              </span>
            </div>
            <h4 className="text-base font-black text-white flex items-center gap-1.5 justify-center">
              <span>{top3[1].name}</span>
            </h4>
            <div className="text-[11px] text-zinc-400 font-bold mb-1">
              &quot;{top3[1].nickname}&quot;
            </div>

            {/* League Badge */}
            <div className="mb-2">
              {top3[1].isRosterPlayer ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-gold/40 text-gold text-[9px] font-black uppercase">
                  <Crown size={10} /> EPT Veteran
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[9px] font-black uppercase">
                  <Sparkles size={10} /> Contender
                </span>
              )}
            </div>

            <div className="text-xl font-mono font-black text-zinc-200">
              {discipline === 'all'
                ? `£${top3[1].chips.toLocaleString()}`
                : `£${top3[1].disciplineStats.bankroll.toLocaleString()}`}
            </div>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
              {top3[1].disciplineStats.primaryStatLabel}:{' '}
              <span className="text-zinc-200 font-bold">
                {top3[1].disciplineStats.primaryStatValue}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {top3[1].disciplineStats.secondaryStatValue}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getTierBadgeStyle(
                  top3[1].level.tier
                )}`}
              >
                {top3[1].level.tier}
              </span>
              {top3[1].bankruptcyCount > 0 && (
                <span
                  title={`Bankrupt ${top3[1].bankruptcyCount}x! Bailed out by league with £${(
                    top3[1].bailoutChipsReceived ||
                    top3[1].bankruptcyCount * 1000
                  ).toLocaleString()}`}
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-950/90 text-red-300 border border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)] flex items-center gap-1"
                >
                  <span>🤡</span> Bankrupt ×{top3[1].bankruptcyCount}
                </span>
              )}
            </div>
          </div>

          {/* Rank #1 Gold Champion Podium */}
          <div className="order-1 md:order-2 glass-panel p-6 rounded-3xl border-2 border-gold flex flex-col items-center text-center relative bg-gradient-to-b from-amber-950/60 via-black to-amber-950/40 shadow-[0_0_35px_rgba(212,175,55,0.3)] md:-translate-y-2">
            <div className="absolute -top-4 w-9 h-9 rounded-full bg-gradient-to-b from-[#ffd700] to-[#cfb53b] text-black font-black text-base flex items-center justify-center shadow-[0_0_15px_#ffd700] border-2 border-white">
              👑
            </div>
            <div className="mt-2 text-xs font-black uppercase tracking-widest text-gold mb-1">
              {discipline === 'all'
                ? leagueDivision === 'veterans'
                  ? 'Veteran Champion'
                  : 'High Roller Champion'
                : `${activeDisciplineMeta.shortLabel} Champion`}
            </div>
            <div className="relative mb-2">
              <img
                src={top3[0].avatar}
                alt={top3[0].name}
                className="w-20 h-20 rounded-full border-4 border-gold object-cover shadow-[0_0_20px_rgba(212,175,55,0.5)]"
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gold text-[10px] font-black text-black border border-white">
                🥇 Champion
              </span>
            </div>
            <h4 className="text-lg font-black text-white flex items-center gap-1.5 justify-center">
              <span>{top3[0].name}</span>
            </h4>
            <div className="text-xs text-gold font-bold mb-1">
              &quot;{top3[0].nickname}&quot;
            </div>

            {/* League Badge */}
            <div className="mb-2">
              {top3[0].isRosterPlayer ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-gold/40 text-gold text-[9px] font-black uppercase">
                  <Crown size={10} /> EPT Veteran
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[9px] font-black uppercase">
                  <Sparkles size={10} /> Contender
                </span>
              )}
            </div>

            <div className="text-2xl font-mono font-black text-gold">
              {discipline === 'all'
                ? `£${top3[0].chips.toLocaleString()}`
                : `£${top3[0].disciplineStats.bankroll.toLocaleString()}`}
            </div>
            <div className="text-xs font-mono text-emerald-400 mt-0.5">
              {top3[0].disciplineStats.primaryStatLabel}:{' '}
              <span className="font-bold">{top3[0].disciplineStats.primaryStatValue}</span>
            </div>
            <div className="text-[11px] text-zinc-300 font-mono mt-0.5">
              {top3[0].disciplineStats.secondaryStatValue}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase border ${getTierBadgeStyle(
                  top3[0].level.tier
                )}`}
              >
                {top3[0].level.tier}
              </span>
              {top3[0].bankruptcyCount > 0 && (
                <span
                  title={`Bankrupt ${top3[0].bankruptcyCount}x! Bailed out by league with £${(
                    top3[0].bailoutChipsReceived ||
                    top3[0].bankruptcyCount * 1000
                  ).toLocaleString()}`}
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-950/90 text-red-300 border border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)] flex items-center gap-1"
                >
                  <span>🤡</span> Bankrupt ×{top3[0].bankruptcyCount}
                </span>
              )}
            </div>
          </div>

          {/* Rank #3 Bronze Podium */}
          <div className="order-3 glass-panel p-5 rounded-2xl border border-amber-800/40 flex flex-col items-center text-center relative bg-gradient-to-b from-amber-950/30 via-black to-zinc-950 shadow-xl">
            <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center mb-2 shadow">
              #3
            </div>
            <div className="relative mb-2">
              <img
                src={top3[2].avatar}
                alt={top3[2].name}
                className="w-16 h-16 rounded-full border-2 border-amber-700 object-cover shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-900 text-[9px] font-black text-amber-200 border border-amber-600">
                🥉 Bronze
              </span>
            </div>
            <h4 className="text-base font-black text-white flex items-center gap-1.5 justify-center">
              <span>{top3[2].name}</span>
            </h4>
            <div className="text-[11px] text-zinc-400 font-bold mb-1">
              &quot;{top3[2].nickname}&quot;
            </div>

            {/* League Badge */}
            <div className="mb-2">
              {top3[2].isRosterPlayer ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-gold/40 text-gold text-[9px] font-black uppercase">
                  <Crown size={10} /> EPT Veteran
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[9px] font-black uppercase">
                  <Sparkles size={10} /> Contender
                </span>
              )}
            </div>

            <div className="text-xl font-mono font-black text-amber-300">
              {discipline === 'all'
                ? `£${top3[2].chips.toLocaleString()}`
                : `£${top3[2].disciplineStats.bankroll.toLocaleString()}`}
            </div>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
              {top3[2].disciplineStats.primaryStatLabel}:{' '}
              <span className="text-amber-200 font-bold">
                {top3[2].disciplineStats.primaryStatValue}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {top3[2].disciplineStats.secondaryStatValue}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getTierBadgeStyle(
                  top3[2].level.tier
                )}`}
              >
                {top3[2].level.tier}
              </span>
              {top3[2].bankruptcyCount > 0 && (
                <span
                  title={`Bankrupt ${top3[2].bankruptcyCount}x! Bailed out by league with £${(
                    top3[2].bailoutChipsReceived ||
                    top3[2].bankruptcyCount * 1000
                  ).toLocaleString()}`}
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-950/90 text-red-300 border border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)] flex items-center gap-1"
                >
                  <span>🤡</span> Bankrupt ×{top3[2].bankruptcyCount}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Leaderboard Table Section */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
        {/* Sort Controls & Table Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="text-gold" size={18} />
              <span>
                {leagueDivision === 'veterans'
                  ? `EPT Veterans ${activeDisciplineMeta.shortLabel} Standings`
                  : `Open ${activeDisciplineMeta.shortLabel} Benchmarking Table`}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {discipline === 'all'
                ? 'All games combined master bankroll. Ranked by overall chips & career performance.'
                : `Specialized ${activeDisciplineMeta.label} standings. Ranked by net profit in ${activeDisciplineMeta.shortLabel}.`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 overflow-x-auto">
            <span className="text-[10px] text-zinc-400 uppercase font-bold ml-1 mr-1">
              Sort:
            </span>
            {[
              { id: 'chips', label: 'Bankroll' },
              { id: 'netChipsWon', label: 'Net Profit' },
              { id: 'coachGrade', label: 'Coach Accuracy' },
              { id: 'handsPlayed', label: 'Hands / Plays' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortField(s.id as SortField)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  sortField === s.id
                    ? 'bg-gold text-black shadow font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Player / Division</th>
                <th className="py-2.5 px-3">
                  {discipline === 'all'
                    ? 'Bankroll (Chips)'
                    : `${activeDisciplineMeta.shortLabel} Bankroll`}
                </th>
                <th className="py-2.5 px-3">
                  {discipline === 'all' ? 'Net Profit' : `${activeDisciplineMeta.shortLabel} Net`}
                </th>
                <th className="py-2.5 px-3">Training Level</th>
                <th className="py-2.5 px-3">
                  {discipline === 'all' || discipline === 'poker'
                    ? 'Hands (Win %)'
                    : `${activeDisciplineMeta.shortLabel} Volume`}
                </th>
                <th className="py-2.5 px-3">
                  {discipline === 'poker' || discipline === 'all'
                    ? 'Coach Accuracy'
                    : 'Game Activity'}
                </th>
                <th className="py-2.5 px-3">Trophies</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {sortedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-400 font-sans">
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                sortedPlayers.map((entry) => {
                  const isUser =
                    entry.name.toLowerCase().trim() ===
                    activePlayerName.toLowerCase().trim();

                  return (
                    <tr
                      key={entry.name}
                      className={`transition ${
                        isUser
                          ? 'bg-gold/10 hover:bg-gold/15 border-l-4 border-l-gold'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 font-black text-sm">
                        {entry.divisionRank === 1 ? (
                          <span className="text-gold flex items-center gap-1">
                            🥇 #1
                          </span>
                        ) : entry.divisionRank === 2 ? (
                          <span className="text-zinc-300 flex items-center gap-1">
                            🥈 #2
                          </span>
                        ) : entry.divisionRank === 3 ? (
                          <span className="text-amber-600 flex items-center gap-1">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="text-zinc-500">#{entry.divisionRank}</span>
                        )}
                      </td>

                      {/* Player Name, Avatar & Division Badge */}
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={entry.avatar}
                            alt={entry.name}
                            className={`w-8 h-8 rounded-full object-cover border shrink-0 ${
                              entry.isRosterPlayer
                                ? 'border-gold/60'
                                : 'border-cyan-500/50'
                            }`}
                          />
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                              <span>{entry.name}</span>

                              {/* Division Tag */}
                              {entry.isRosterPlayer ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-950/80 border border-gold/40 text-gold text-[9px] font-black uppercase">
                                  <Crown size={9} />
                                  <span>Veteran</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[9px] font-black uppercase">
                                  <Sparkles size={9} />
                                  <span>Contender</span>
                                </span>
                              )}

                              {isUser && (
                                <span className="px-1.5 py-0.2 rounded bg-gold text-black text-[9px] font-black uppercase">
                                  YOU
                                </span>
                              )}

                              {entry.bankruptcyCount > 0 && (
                                <InfoTooltip
                                  title={`💥 Loser Badge: Bankrupt ×${entry.bankruptcyCount}`}
                                  description={`This player lost all their chips and went broke ${entry.bankruptcyCount} time${entry.bankruptcyCount > 1 ? 's' : ''}! The League Treasury bailed them out with £${(entry.bailoutChipsReceived || entry.bankruptcyCount * 1000).toLocaleString()} in emergency chips so they could keep playing.`}
                                  example="Maintain solid bankroll management and avoid high-variance punts!"
                                  size={10}
                                >
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-red-950/90 border border-red-500/80 text-red-300 text-[9px] font-black uppercase tracking-tight shadow-[0_0_8px_rgba(239,68,68,0.4)] cursor-help">
                                    <span>🤡</span>
                                    <span>Bankrupt ×{entry.bankruptcyCount}</span>
                                  </span>
                                </InfoTooltip>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              &quot;{entry.nickname}&quot; • {entry.archetype.split(' ')[0]}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Chip Bankroll */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-yellow-300 to-amber-600 border border-black flex items-center justify-center text-[7px] text-black font-black">
                            ●
                          </span>
                          <span className="text-sm font-black text-gold">
                            £
                            {(discipline === 'all'
                              ? entry.chips
                              : entry.disciplineStats.bankroll
                            ).toLocaleString()}
                          </span>
                        </div>
                        {discipline !== 'all' && (
                          <div className="text-[10px] text-zinc-500 font-mono">
                            Total: £{entry.chips.toLocaleString()}
                          </div>
                        )}
                        {entry.bankruptcyCount > 0 && (
                          <div className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-0.5">
                            <span>⚠️ Bailed Out</span>
                            <span className="text-zinc-500 font-mono font-normal">
                              (+£
                              {(
                                entry.bailoutChipsReceived ||
                                entry.bankruptcyCount * 1000
                              ).toLocaleString()}
                              )
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Net Profit */}
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold ${
                            entry.disciplineStats.netWon >= 0
                              ? 'text-emerald-400'
                              : 'text-ept-red'
                          }`}
                        >
                          {entry.disciplineStats.primaryStatValue}
                        </span>
                        {discipline === 'poker' && (
                          <div className="text-[10px] text-zinc-500">
                            {entry.netBBWon >= 0 ? '+' : ''}
                            {entry.netBBWon} BB
                          </div>
                        )}
                      </td>

                      {/* Level Tier */}
                      <td className="py-3 px-3 font-sans">
                        <InfoTooltip
                          title={`Training Level: ${entry.level.tier}`}
                          description={entry.level.description}
                          example={entry.level.nextLevelRequirement}
                          size={10}
                        >
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border cursor-help ${getTierBadgeStyle(
                              entry.level.tier
                            )}`}
                          >
                            {entry.level.tier}
                          </span>
                        </InfoTooltip>
                      </td>

                      {/* Hands / Volume */}
                      <td className="py-3 px-3 text-zinc-300">
                        {discipline === 'all' || discipline === 'poker' ? (
                          <>
                            <div>{entry.handsPlayed} Hands</div>
                            <div className="text-[10px] text-zinc-500">
                              {entry.winRatePercent}% Win Rate
                            </div>
                          </>
                        ) : (
                          <>
                            <div>{entry.disciplineStats.secondaryStatValue}</div>
                            <div className="text-[10px] text-zinc-500">
                              {entry.disciplineStats.plays > 0
                                ? 'Active Tracker'
                                : 'Awaiting First Play'}
                            </div>
                          </>
                        )}
                      </td>

                      {/* Coach Accuracy / Activity */}
                      <td className="py-3 px-3">
                        {discipline === 'all' || discipline === 'poker' ? (
                          <span className="font-bold text-emerald-400">
                            {entry.coachGrade}%
                          </span>
                        ) : (
                          <span
                            className={`font-bold ${
                              entry.disciplineStats.plays > 0
                                ? 'text-emerald-400'
                                : 'text-zinc-600'
                            }`}
                          >
                            {entry.disciplineStats.plays > 0 ? 'Active ⚡' : 'Idle —'}
                          </span>
                        )}
                      </td>

                      {/* Trophies */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[11px]">
                          {entry.medals.gold > 0 && (
                            <span title={`${entry.medals.gold} Gold Medals`}>
                              🥇{entry.medals.gold}
                            </span>
                          )}
                          {entry.medals.silver > 0 && (
                            <span title={`${entry.medals.silver} Silver Medals`}>
                              🥈{entry.medals.silver}
                            </span>
                          )}
                          {entry.medals.bronze > 0 && (
                            <span title={`${entry.medals.bronze} Bronze Medals`}>
                              🥉{entry.medals.bronze}
                            </span>
                          )}
                          {entry.medals.total === 0 && (
                            <span className="text-zinc-600">—</span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right font-sans">
                        <Link
                          href={`/scouting/${encodeURIComponent(entry.name)}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
                        >
                          <span>Scout</span>
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Academy Level & Tier Explainer Guide */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="text-gold" size={18} />
          <h4 className="text-sm font-black uppercase tracking-wider text-white">
            Academy Level & Tier System
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-1.5">
            <div className="text-xs font-black uppercase text-purple-300 flex items-center justify-between">
              <span>Tier 4: GTO Master</span>
              <span>🟣</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              40+ hands evaluated, 85%+ Coach Decision Accuracy, and positive chip earnings. Unlocks GTO Solver bots.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5">
            <div className="text-xs font-black uppercase text-emerald-300 flex items-center justify-between">
              <span>Tier 3: Pro Shark</span>
              <span>🟢</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              20+ hands evaluated with 75%+ Coach Decision Accuracy. Bots actively read your HUD to exploit your habits.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1.5">
            <div className="text-xs font-black uppercase text-amber-300 flex items-center justify-between">
              <span>Tier 2: EPT Regular</span>
              <span>🟡</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              8+ hands evaluated with 60%+ Coach Decision Accuracy. Standard league members mimicking live playstyles.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 space-y-1.5">
            <div className="text-xs font-black uppercase text-zinc-400 flex items-center justify-between">
              <span>Tier 1: Rookie Trainee</span>
              <span>⚪</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Calibrating baseline VPIP, PFR, and basic decision accuracy. Loose-passive bots for relaxed practice.
            </p>
          </div>
        </div>

        {/* League Bankruptcy & £1,000 Bailout Rule Banner */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-950/50 via-black to-zinc-900 border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-950 border border-red-500/70 flex items-center justify-center text-xl shrink-0 shadow-[0_0_14px_rgba(239,68,68,0.45)]">
              🤡
            </div>
            <div>
              <div className="text-xs font-black uppercase text-red-300 flex items-center gap-2">
                <span>The League Bankruptcy & £1,000 Bailout Rule</span>
                <span className="px-1.5 py-0.2 rounded bg-red-900/60 border border-red-500/50 text-[9px] text-red-200">
                  Official Rule
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                If a player loses all their chips and goes completely broke, the E.P.T. League Treasury automatically awards them a free <span className="text-gold font-bold">£1,000 chip bailout</span> so they can continue training. However, they are marked with the humiliating <span className="text-red-300 font-bold">&quot;Bankrupt ×N&quot;</span> Loser Badge on the public leaderboard!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
