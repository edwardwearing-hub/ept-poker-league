import { CareerTrackerStats, GameMode, PlayStyleArchetype } from './types';
import { computeDerivedMetrics, getInitialTrackerStats } from './tracker';
import { getAvatarFilename } from '@/lib/avatars';
import { ACADEMY_LICENSE_TESTS } from './console-aesthetics-db';

export const BASE_ACADEMY_BANKROLL = 10000;

export function computeTotalAcademyChips(stats: CareerTrackerStats): number {
  const recordedBailout = stats.bailoutChipsReceived || 0;
  const total =
    BASE_ACADEMY_BANKROLL +
    (stats.netChipsWon || 0) +
    (stats.bountyCashWon || 0) +
    recordedBailout;
  return Math.max(0, total);
}

import { CANONICAL_PLAYER_NAMES } from '@/lib/roster';

export const LEAGUE_PLAYERS = CANONICAL_PLAYER_NAMES;

export const PLAYER_NICKNAMES: Record<string, string> = {
  'Edward Wearing': 'The Bounty',
  'Liam Duxbury': 'The Shark',
  'Luke Daly': 'The Duke',
  'Georgina Wearing': 'The Queen',
  'Daniel Horne': 'The Joker',
  'Darren Daly': 'Double D',
  'Chris Daly': 'The Wildcard',
  'Stephen Flood': 'The Flash',
  'Phil Landsberger': 'The Grinder',
  'Dave Blackburn': 'The Professor',
  'Nathen Benson': 'Big Stack',
  'Dave Taylor': 'The Ace',
};

export type AcademyTrainingLevel =
  | 'GTO Master'
  | 'Pro Shark'
  | 'EPT Regular'
  | 'Rookie Trainee';

export interface LevelInfo {
  tier: AcademyTrainingLevel;
  tierNumber: number; // 4 (highest) .. 1 (lowest)
  badgeColor: string;
  borderColor: string;
  bgGradient: string;
  description: string;
  nextLevelRequirement?: string;
}

export function computePlayerLevel(stats: CareerTrackerStats): LevelInfo {
  const derived = computeDerivedMetrics(stats);
  const hands = stats.handsPlayed;
  const grade = derived.decisionAccuracyPercent;

  if (hands >= 40 && grade >= 85 && stats.netChipsWon >= 0) {
    return {
      tier: 'GTO Master',
      tierNumber: 4,
      badgeColor: 'text-purple-300',
      borderColor: 'border-purple-500/60',
      bgGradient: 'from-purple-950/80 to-indigo-950/80',
      description:
        'Elite Tier: 40+ hands, 85%+ Coach Decision Accuracy, and positive net chip profitability.',
    };
  }

  if (hands >= 20 && grade >= 75) {
    return {
      tier: 'Pro Shark',
      tierNumber: 3,
      badgeColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/60',
      bgGradient: 'from-emerald-950/80 to-teal-950/80',
      description:
        'Advanced Tier: 20+ hands evaluated with 75%+ Coach Decision Accuracy.',
      nextLevelRequirement: 'Reach 40 hands & 85% Coach Accuracy with positive chips for GTO Master',
    };
  }

  if (hands >= 8 && grade >= 60) {
    return {
      tier: 'EPT Regular',
      tierNumber: 2,
      badgeColor: 'text-gold',
      borderColor: 'border-gold/50',
      bgGradient: 'from-amber-950/70 to-zinc-900',
      description:
        'Standard League Tier: 8+ hands evaluated with solid basic fundamentals.',
      nextLevelRequirement: 'Reach 20 hands & 75% Coach Accuracy for Pro Shark',
    };
  }

  return {
    tier: 'Rookie Trainee',
    tierNumber: 1,
    badgeColor: 'text-zinc-400',
    borderColor: 'border-zinc-700',
    bgGradient: 'from-zinc-900 to-black',
    description:
      'Foundational Tier: Calibrating baseline VPIP, PFR, and basic decision accuracy.',
    nextLevelRequirement: 'Play 8 hands & maintain 60%+ Coach Accuracy for EPT Regular',
  };
}

export interface AcademyLeaderboardEntry {
  rank: number;
  name: string;
  nickname: string;
  avatar: string;
  chips: number;
  netChipsWon: number;
  netBBWon: number;
  handsPlayed: number;
  handsWon: number;
  winRatePercent: number;
  coachGrade: number;
  vpipPercent: number;
  pfrPercent: number;
  aggressionFactor: number;
  level: LevelInfo;
  archetype: PlayStyleArchetype;
  favoriteMode: GameMode;
  medals: { gold: number; silver: number; bronze: number; total: number };
  bankruptcyCount: number;
  bailoutChipsReceived: number;
  isRosterPlayer: boolean;
}

export function buildAcademyLeaderboard(
  storedProfiles: Record<string, CareerTrackerStats>
): AcademyLeaderboardEntry[] {
  const entries: AcademyLeaderboardEntry[] = [];

  const playerNames = [...LEAGUE_PLAYERS];
  const seenLower = new Set(LEAGUE_PLAYERS.map((p) => p.toLowerCase().trim()));

  for (const [key, profile] of Object.entries(storedProfiles)) {
    const rawName = (profile as any).playerName || (profile as any).name || key.replace(/_/g, ' ');
    const lower = rawName.toLowerCase().trim();
    if (lower === 'guest trainee' || lower === 'guest' || lower.startsWith('guest')) {
      continue; // Guests are never included on leaderboard
    }
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      playerNames.push(rawName);
    }
  }

  for (const name of playerNames) {
    const key = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    const stats: CareerTrackerStats = storedProfiles[key] || getInitialTrackerStats();
    const derived = computeDerivedMetrics(stats);
    const level = computePlayerLevel(stats);

    const recordedBailout = stats.bailoutChipsReceived || 0;
    let bankruptcyCount = stats.bankruptcyCount || 0;

    // Current Academy chip balance = starting bankroll + net chips won + bounty reward cash + bailout loans
    const totalChips = computeTotalAcademyChips(stats);
    if (totalChips <= 1000 && stats.handsPlayed > 0 && (stats.bankruptcyCount || 0) > 0 && bankruptcyCount === 0) {
      bankruptcyCount = stats.bankruptcyCount || 1;
    }

    // Identify favorite game mode
    let maxMode: GameMode = 'no-limit';
    let maxCount = -1;
    for (const [mode, count] of Object.entries(stats.handsByMode)) {
      if (count > maxCount) {
        maxCount = count;
        maxMode = mode as GameMode;
      }
    }

    // License medals
    let gold = 0;
    let silver = 0;
    let bronze = 0;
    for (const test of ACADEMY_LICENSE_TESTS) {
      const m = test.medalStatus(stats);
      if (m === 'Gold') gold++;
      else if (m === 'Silver') silver++;
      else if (m === 'Bronze') bronze++;
    }

    const isRosterPlayer = LEAGUE_PLAYERS.some(
      (p) => p.toLowerCase().trim() === name.toLowerCase().trim()
    );

    entries.push({
      rank: 0, // Assigned after sorting
      name,
      nickname: (stats as any).nickname || PLAYER_NICKNAMES[name] || 'The Grinder',
      avatar: (stats as any).avatarUrl || getAvatarFilename(name),
      chips: totalChips,
      netChipsWon: stats.netChipsWon + stats.bountyCashWon,
      netBBWon: stats.netBBWon,
      handsPlayed: stats.handsPlayed,
      handsWon: stats.handsWon,
      winRatePercent: derived.winRatePercent,
      coachGrade: derived.decisionAccuracyPercent,
      vpipPercent: derived.vpipPercent,
      pfrPercent: derived.pfrPercent,
      aggressionFactor: derived.aggressionFactor,
      level,
      archetype: derived.archetype,
      favoriteMode: maxMode,
      medals: { gold, silver, bronze, total: gold + silver + bronze },
      bankruptcyCount,
      bailoutChipsReceived: recordedBailout > 0 ? recordedBailout : bankruptcyCount * 1000,
      isRosterPlayer,
    });
  }

  // Sort by:
  // 1. Total Chips (Descending)
  // 2. Hands Played (Descending)
  // 3. Coach Grade (Descending)
  entries.sort((a, b) => {
    if (b.chips !== a.chips) return b.chips - a.chips;
    if (b.handsPlayed !== a.handsPlayed) return b.handsPlayed - a.handsPlayed;
    return b.coachGrade - a.coachGrade;
  });

  // Assign 1-indexed ranks
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return entries;
}
