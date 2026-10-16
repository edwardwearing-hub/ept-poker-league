import {
  CareerTrackerStats,
  CoachFeedback,
  DecisionGrade,
  GameMode,
  LeakCategory,
  PlayStyleArchetype,
  PositionName,
  PositionStats,
  ScenarioPreset,
} from './types';

const ALL_POSITIONS: PositionName[] = [
  'BTN',
  'SB',
  'BB',
  'UTG',
  'UTG+1',
  'MP',
  'LJ',
  'HJ',
  'CO',
];

function createEmptyPositionStats(): PositionStats {
  return {
    hands: 0,
    vpipCount: 0,
    pfrCount: 0,
    handsWon: 0,
    netBB: 0,
    optimalDecisions: 0,
    totalDecisions: 0,
  };
}

export function getInitialTrackerStats(): CareerTrackerStats {
  const byPosition = {} as Record<PositionName, PositionStats>;
  for (const pos of ALL_POSITIONS) {
    byPosition[pos] = createEmptyPositionStats();
  }

  return {
    handsPlayed: 0,
    handsWon: 0,
    showdownsReached: 0,
    showdownsWon: 0,
    netChipsWon: 0,
    netBBWon: 0,
    bountiesClaimed: 0,
    bountyCashWon: 0,
    bankruptcyCount: 0,
    bailoutChipsReceived: 0,

    vpipOpportunities: 0,
    vpipCount: 0,
    pfrCount: 0,
    threeBetOpportunities: 0,
    threeBetCount: 0,
    limpCount: 0,

    postflopBetsAndRaises: 0,
    postflopCalls: 0,
    postflopFolds: 0,
    cbetOpportunities: 0,
    cbetCount: 0,

    totalDecisionsGraded: 0,
    gradeCounts: {
      'A+': 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    },
    leakCounts: {
      'limping-preflop': 0,
      'calling-without-odds': 0,
      'overfolding-equity': 0,
      'passive-value-miss': 0,
      'positional-looseness': 0,
      'pot-limit-sizing': 0,
      'bounty-miscalculation': 0,
      'aof-push-fold-error': 0,
    },
    handsByMode: {
      'no-limit': 0,
      'pot-limit': 0,
      'bounty-hunter': 0,
      'all-in-or-fold': 0,
      'icm-bubble': 0,
      'bomb-pot': 0,
      'tournament-eliminator': 0,
    },
    byPosition,
    recentFeedback: [],
  };
}

export const BASE_STORAGE_KEY = 'ept_academy_tracker_v2';

export function getActivePlayerName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('ept_active_player_v2') || null;
  } catch {
    return null;
  }
}

export function isGuestPlayer(playerName?: string | null): boolean {
  if (!playerName) return true;
  const lower = playerName.toLowerCase().trim();
  return lower === 'guest' || lower === 'guest trainee' || lower.startsWith('guest');
}

export function getStorageKeyForPlayer(playerName?: string | null): string {
  const target = playerName !== undefined ? playerName : getActivePlayerName();
  if (!target || !target.trim() || isGuestPlayer(target)) return BASE_STORAGE_KEY;
  const sanitized = target.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
  return `${BASE_STORAGE_KEY}_${sanitized}`;
}

export function loadTrackerStatsForPlayer(playerName?: string | null): CareerTrackerStats {
  if (typeof window === 'undefined') return getInitialTrackerStats();
  if (isGuestPlayer(playerName)) {
    return getInitialTrackerStats();
  }
  const key = getStorageKeyForPlayer(playerName);
  try {
    let raw = localStorage.getItem(key);
    if (!raw) return getInitialTrackerStats();
    const parsed = JSON.parse(raw);
    const initial = getInitialTrackerStats();
    return {
      ...initial,
      ...parsed,
      gradeCounts: { ...initial.gradeCounts, ...(parsed.gradeCounts || {}) },
      leakCounts: { ...initial.leakCounts, ...(parsed.leakCounts || {}) },
      handsByMode: { ...initial.handsByMode, ...(parsed.handsByMode || {}) },
      byPosition: { ...initial.byPosition, ...(parsed.byPosition || {}) },
      recentFeedback: Array.isArray(parsed.recentFeedback) ? parsed.recentFeedback : [],
    };
  } catch {
    return getInitialTrackerStats();
  }
}

export function saveTrackerStatsForPlayer(
  stats: CareerTrackerStats,
  playerName?: string | null
): void {
  if (typeof window === 'undefined') return;
  // If player is guest, do NOT save their stats!
  if (isGuestPlayer(playerName)) return;

  const key = getStorageKeyForPlayer(playerName);
  try {
    const serialized = JSON.stringify(stats);
    localStorage.setItem(key, serialized);
  } catch {
    // Ignore storage quota errors
  }
}

export function loadTrackerStats(): CareerTrackerStats {
  return loadTrackerStatsForPlayer();
}

export function saveTrackerStats(stats: CareerTrackerStats): void {
  saveTrackerStatsForPlayer(stats);
}

export function resetTrackerStats(playerName?: string | null): CareerTrackerStats {
  const fresh = getInitialTrackerStats();
  saveTrackerStatsForPlayer(fresh, playerName);
  return fresh;
}

export interface DiagnosedLeak {
  id: string;
  severity: 'High' | 'Medium' | 'Low' | 'Strength';
  title: string;
  metricBadge: string;
  diagnosis: string;
  fixAction: string;
  recommendedPreset: string;
}

export interface DerivedTrackerMetrics {
  vpipPercent: number;
  pfrPercent: number;
  threeBetPercent: number;
  limpPercent: number;
  aggressionFactor: number;
  wtsdPercent: number;
  wsdPercent: number;
  winRatePercent: number;
  bbPer100: number;
  decisionAccuracyPercent: number;
  foldToPressurePercent: number;
  archetype: PlayStyleArchetype;
  archetypeDescription: string;
  loosenessScore: number; // 0 (Ultra Tight) .. 100 (Ultra Loose)
  aggressionScore: number; // 0 (Ultra Passive) .. 100 (Ultra Aggressive)
  diagnosedLeaks: DiagnosedLeak[];
  bankruptcyCount: number;
  bailoutChipsReceived: number;
}

export function computeDerivedMetrics(stats: CareerTrackerStats): DerivedTrackerMetrics {
  const vpipOpps = Math.max(1, stats.vpipOpportunities);
  const vpipPercent = Math.round((stats.vpipCount / vpipOpps) * 100);
  const pfrPercent = Math.round((stats.pfrCount / vpipOpps) * 100);
  const limpPercent = Math.round((stats.limpCount / vpipOpps) * 100);

  const threeBetOpps = Math.max(1, stats.threeBetOpportunities);
  const threeBetPercent = Math.round((stats.threeBetCount / threeBetOpps) * 100);

  const aggressionFactor = Number(
    (stats.postflopBetsAndRaises / Math.max(1, stats.postflopCalls)).toFixed(1)
  );

  const handsPlayed = Math.max(1, stats.handsPlayed);
  const wtsdPercent = Math.round((stats.showdownsReached / handsPlayed) * 100);
  const wsdPercent =
    stats.showdownsReached > 0
      ? Math.round((stats.showdownsWon / stats.showdownsReached) * 100)
      : 0;
  const winRatePercent = Math.round((stats.handsWon / handsPlayed) * 100);
  const bbPer100 = Math.round((stats.netBBWon / handsPlayed) * 100);

  const totalPostflopActions =
    stats.postflopBetsAndRaises + stats.postflopCalls + stats.postflopFolds;
  const foldToPressurePercent =
    totalPostflopActions > 0
      ? Math.round((stats.postflopFolds / totalPostflopActions) * 100)
      : 35;

  // Weighted accuracy score across graded decisions
  const totalGraded = Math.max(1, stats.totalDecisionsGraded);
  const weightedPoints =
    stats.gradeCounts['A+'] * 100 +
    stats.gradeCounts.B * 82 +
    stats.gradeCounts.C * 60 +
    stats.gradeCounts.D * 30 +
    stats.gradeCounts.F * 0;
  const decisionAccuracyPercent =
    stats.totalDecisionsGraded > 0 ? Math.round(weightedPoints / totalGraded) : 100;

  // 2D Matrix Coordinates (0..100)
  // VPIP of 24% maps near center (50); 50%+ maps to 95 (Loose); 10% maps to 15 (Tight)
  const loosenessScore = Math.max(8, Math.min(95, Math.round((vpipPercent / 50) * 100)));

  // PFR/VPIP ratio + Aggression Factor determines Aggression Y-axis
  const pfrRatio = stats.vpipCount > 0 ? (stats.pfrCount / stats.vpipCount) * 100 : 65;
  const afNorm = Math.min(100, (aggressionFactor / 3.5) * 100);
  const aggressionScore = Math.max(
    8,
    Math.min(95, Math.round(pfrRatio * 0.55 + afNorm * 0.45))
  );

  let archetype: PlayStyleArchetype = 'Unclassified Rookie';
  let archetypeDescription =
    'Play at least 3–5 hands in the AI Bot Arena so the Virtual Coach can map your VPIP, PFR, and post-flop aggression profile.';

  if (stats.handsPlayed >= 2) {
    if (vpipPercent >= 20 && vpipPercent <= 30 && aggressionScore >= 56 && decisionAccuracyPercent >= 80) {
      archetype = 'Balanced GTOHybrid';
      archetypeDescription =
        'Elite balance between positional pre-flop tightness, high raise-first-in frequency, and calculated post-flop aggression.';
    } else if (loosenessScore <= 58 && aggressionScore >= 52) {
      archetype = 'TAG Shark (Tight-Aggressive)';
      archetypeDescription =
        'Selective pre-flop hand selection combined with strong raising and continuation-bet pressure. The gold standard for E.P.T. League profitability.';
    } else if (loosenessScore > 58 && aggressionScore >= 52) {
      archetype = 'LAG Crusher (Loose-Aggressive)';
      archetypeDescription =
        'Wide range profile that applies relentless pressure across streets. Dangerous and unpredictable when backed by strong post-flop reading.';
    } else if (loosenessScore <= 58 && aggressionScore < 52) {
      archetype = 'The Nit / Rock (Tight-Passive)';
      archetypeDescription =
        'Risk-averse style waiting for premium holdings. Easy for observant sharks to steal blinds from unless you increase late-position aggression.';
    } else {
      archetype = 'Calling Station (Loose-Passive)';
      archetypeDescription =
        'Entering too many pots without raising and calling down post-flop without proper pot odds. High vulnerability to value-betting sharks.';
    }
  }

  // Generate automated leak diagnostics & coach advice
  const diagnosedLeaks: DiagnosedLeak[] = [];

  if (stats.vpipOpportunities >= 3 && vpipPercent - pfrPercent > 12) {
    diagnosedLeaks.push({
      id: 'leak-limp-gap',
      severity: 'High',
      title: 'Excessive VPIP / PFR Gap (Open-Limping Leak)',
      metricBadge: `${vpipPercent}% VPIP vs ${pfrPercent}% PFR`,
      diagnosis: `Your gap between entering pots (${vpipPercent}%) and raising (${pfrPercent}%) is ${vpipPercent - pfrPercent}%. Winning TAG players keep this gap under 6% by raising instead of limping.`,
      fixAction: 'Stop open-limping pre-flop. If a hand is strong enough to play when unopened, enter with a 2.5x–3x BB raise.',
      recommendedPreset: 'btn-vs-bb-3bet',
    });
  }

  if (stats.leakCounts['calling-without-odds'] >= 2) {
    diagnosedLeaks.push({
      id: 'leak-pot-odds',
      severity: 'High',
      title: 'Chasing Draws / Pairs Without Pot Odds',
      metricBadge: `${stats.leakCounts['calling-without-odds']} Bad Calls`,
      diagnosis:
        'You have called multiple bets where your hand/draw equity was significantly lower than the required pot-odds percentage.',
      fixAction:
        'Check the Live Coach HUD before calling: multiply your Outs by 4 on the Flop (or by 2 on the Turn) and compare directly against Pot Odds %.',
      recommendedPreset: 'wet-board-defense',
    });
  }

  if (stats.leakCounts['passive-value-miss'] >= 2 || (stats.postflopCalls >= 3 && aggressionFactor < 1.3)) {
    diagnosedLeaks.push({
      id: 'leak-passive-postflop',
      severity: 'Medium',
      title: 'Passive Post-Flop Check/Calling',
      metricBadge: `AF: ${aggressionFactor}`,
      diagnosis: `Your Post-Flop Aggression Factor is ${aggressionFactor} (Pro target is 2.0–3.5). Checking strong pairs or high-equity draws gives opponents free cards to outdraw you.`,
      fixAction:
        'Bet 50%–75% of the pot when holding top pair+ or 8+ out semi-bluff draws on wet boards.',
      recommendedPreset: 'multiway-pot-limit',
    });
  }

  if (stats.leakCounts['bounty-miscalculation'] >= 1) {
    diagnosedLeaks.push({
      id: 'leak-bounty-math',
      severity: 'Medium',
      title: 'Missing Bounty Chip-Equity Adjustments',
      metricBadge: 'PKO Math',
      diagnosis:
        'In Bounty Hunter mode, covering an all-in player adds immediate bounty value to the pot, lowering the equity required to call.',
      fixAction:
        'Widen your calling range by ~8–12% equity whenever you cover a short-stack shove with a large bounty.',
      recommendedPreset: 'bounty-short-stack',
    });
  }

  if (stats.leakCounts['aof-push-fold-error'] >= 1) {
    diagnosedLeaks.push({
      id: 'leak-aof-nash',
      severity: 'Medium',
      title: 'Short-Stack Push/Fold Range Deviation',
      metricBadge: `${stats.leakCounts['aof-push-fold-error']} AoF Errors`,
      diagnosis:
        'Under 12 BB, either folding profitable late-position shoves or pushing dominated offsuit trash costs massive tournament equity.',
      fixAction:
        'Use the Pre-Flop Range Lab (15BB Push/Fold mode) to memorize Nash shove thresholds from CO, BTN, and SB.',
      recommendedPreset: 'push-fold-clinic',
    });
  }

  if (diagnosedLeaks.length === 0 && stats.handsPlayed >= 2) {
    diagnosedLeaks.push({
      id: 'strength-solid',
      severity: 'Strength',
      title: 'Sharp Fundamentals & Positive EV Discipline',
      metricBadge: `${decisionAccuracyPercent}% Coach Grade`,
      diagnosis:
        'Your VPIP/PFR balance and post-flop pot-odds decisions are tracking cleanly inside the E.P.T. Pro Shark corridor!',
      fixAction:
        'Step up difficulty to Pro Shark or GTO Solver and test your edge in Pot-Limit and Bounty Hunter scenarios.',
      recommendedPreset: 'bounty-short-stack',
    });
  }

  return {
    vpipPercent,
    pfrPercent,
    threeBetPercent,
    limpPercent,
    aggressionFactor,
    wtsdPercent,
    wsdPercent,
    winRatePercent,
    bbPer100,
    decisionAccuracyPercent,
    foldToPressurePercent,
    archetype,
    archetypeDescription,
    loosenessScore,
    aggressionScore,
    diagnosedLeaks,
    bankruptcyCount: stats.bankruptcyCount || 0,
    bailoutChipsReceived: stats.bailoutChipsReceived || 0,
  };
}

export function grantBankruptcyBailout(
  stats: CareerTrackerStats,
  bailoutAmount = 1000
): CareerTrackerStats {
  return {
    ...stats,
    bankruptcyCount: (stats.bankruptcyCount || 0) + 1,
    bailoutChipsReceived: (stats.bailoutChipsReceived || 0) + bailoutAmount,
  };
}

export interface PlayerActionStep {
  stepNumber: number;
  title: string;
  description: string;
  targetBenchmark: string;
  drillPreset: ScenarioPreset;
  drillLabel: string;
}

export interface PlayerImprovementAdvice {
  playerName: string;
  hasSufficientData: boolean;
  handsPlayed: number;
  archetype: PlayStyleArchetype;
  archetypeDescription: string;
  decisionAccuracyPercent: number;
  overallAssessment: string;
  keyStrengths: string[];
  priorityLeaks: DiagnosedLeak[];
  actionPlan: PlayerActionStep[];
  customPrescription: string;
}

export function generatePlayerImprovementAdvice(
  stats: CareerTrackerStats,
  playerName = 'Player'
): PlayerImprovementAdvice {
  const derived = computeDerivedMetrics(stats);
  const hasSufficientData = stats.handsPlayed >= 3;

  if (!hasSufficientData) {
    return {
      playerName,
      hasSufficientData: false,
      handsPlayed: stats.handsPlayed,
      archetype: derived.archetype,
      archetypeDescription: derived.archetypeDescription,
      decisionAccuracyPercent: derived.decisionAccuracyPercent,
      overallAssessment: `${playerName} needs to complete at least 5–10 hands in the AI Poker Arena so the Coach can calibrate your VPIP, PFR, and post-flop decision profile.`,
      keyStrengths: ['Ready to begin AI-guided coaching and license trials'],
      priorityLeaks: [],
      actionPlan: [
        {
          stepNumber: 1,
          title: 'Establish Your Play-Style Baseline',
          description:
            'Play a 6-player No-Limit Hold’em simulation against EPT Regular bots to establish your initial HUD stats.',
          targetBenchmark: 'Complete 10 hands in Arena',
          drillPreset: 'free-play',
          drillLabel: 'Start Free-Play Assessment',
        },
        {
          stepNumber: 2,
          title: 'Master Position & Pre-Flop Raising',
          description:
            'Practice opening with a 2.5x–3x raise when in Late Position (BTN/CO) rather than limping in.',
          targetBenchmark: 'Keep VPIP/PFR gap <= 6%',
          drillPreset: 'btn-vs-bb-3bet',
          drillLabel: 'Launch Button Steal Drill',
        },
      ],
      customPrescription:
        'Jump into the Poker Table Arena and play naturally. The Virtual Coach will silently record your decisions across streets and generate your personalized coaching plan.',
    };
  }

  const keyStrengths: string[] = [];
  const actionPlan: PlayerActionStep[] = [];

  // Identify strengths
  if (derived.vpipPercent >= 18 && derived.vpipPercent <= 30) {
    keyStrengths.push(
      `Disciplined Pre-Flop Selection: Playing ${derived.vpipPercent}% of hands is in the elite pro range.`
    );
  }
  if (derived.pfrPercent >= 15 && derived.vpipPercent - derived.pfrPercent <= 6) {
    keyStrengths.push(
      `Aggressive Pre-Flop Initiative: Low limping frequency (${derived.vpipPercent}% VPIP vs ${derived.pfrPercent}% PFR) forces opponents to react to you.`
    );
  }
  if (derived.aggressionFactor >= 2.0 && derived.aggressionFactor <= 3.5) {
    keyStrengths.push(
      `Balanced Post-Flop Drive: Aggression Factor of ${derived.aggressionFactor} indicates healthy value-betting without reckless over-bluffing.`
    );
  }
  if (derived.decisionAccuracyPercent >= 85) {
    keyStrengths.push(
      `High Coach Decision Accuracy: Graded at ${derived.decisionAccuracyPercent}% optimal EV actions across played streets.`
    );
  }
  if (stats.bountiesClaimed >= 2) {
    keyStrengths.push(
      `PKO Bounty Hunter Instincts: Successfully claimed ${stats.bountiesClaimed} knockouts (£${stats.bountyCashWon} bounty rewards).`
    );
  }
  if (keyStrengths.length === 0) {
    keyStrengths.push(
      'Active League Participation: Building hands and telemetry to discover your natural edge.'
    );
  }

  // Build tailored action plan based on diagnosed leaks
  let stepCounter = 1;

  if (derived.vpipPercent - derived.pfrPercent > 8) {
    actionPlan.push({
      stepNumber: stepCounter++,
      title: 'Eliminate Open-Limping Pre-Flop',
      description: `Your gap between hands played (${derived.vpipPercent}%) and hands raised (${derived.pfrPercent}%) is ${
        derived.vpipPercent - derived.pfrPercent
      }%. When nobody has entered the pot before you, either raise 2.5x–3x BB or fold. Never just limp in.`,
      targetBenchmark: 'VPIP/PFR gap under 6%',
      drillPreset: 'btn-vs-bb-3bet',
      drillLabel: 'Train BTN vs BB Raising',
    });
  }

  if (derived.aggressionFactor < 1.8) {
    actionPlan.push({
      stepNumber: stepCounter++,
      title: 'Transition from Check/Calling to Value-Betting',
      description: `Your Post-Flop Aggression Factor is ${derived.aggressionFactor} (Target: 2.0–3.5). Stop checking good top-pair hands on the flop and turn. Bet 50%–70% pot to deny equity to flush and straight draws.`,
      targetBenchmark: 'Aggression Factor >= 2.2',
      drillPreset: 'multiway-pot-limit',
      drillLabel: 'Train Pot-Limit Value Sizing',
    });
  }

  if (stats.leakCounts['calling-without-odds'] >= 2) {
    actionPlan.push({
      stepNumber: stepCounter++,
      title: 'Obey the Rule of 4 & 2 on Drawing Boards',
      description:
        'You have made multiple calls chasing draws without proper pot odds. On the flop, multiply clean outs by 4; on the turn, multiply clean outs by 2. Compare that Win Chance % directly to the Call Price % before clicking Call.',
      targetBenchmark: '0 calls without pot odds',
      drillPreset: 'wet-board-defense',
      drillLabel: 'Train Wet-Board Draw Math',
    });
  }

  if (derived.threeBetPercent < 6 && stats.handsPlayed >= 5) {
    actionPlan.push({
      stepNumber: stepCounter++,
      title: 'Expand 3-Bet Re-Raising Range from the Blinds',
      description: `Your 3-Bet frequency is only ${derived.threeBetPercent}%. Observant opponents know you only re-raise with AA/KK. Add suited broadways (KQs, AJs) and suited wheel aces (A5s, A4s) to your re-raise arsenal.`,
      targetBenchmark: '3-Bet % between 7% and 11%',
      drillPreset: 'btn-vs-bb-3bet',
      drillLabel: 'Train 3-Bet Defenses',
    });
  }

  if (actionPlan.length === 0) {
    actionPlan.push({
      stepNumber: 1,
      title: 'Sharpen Tournament Short-Stack Shove Precision',
      description:
        'Practice push/fold Nash equilibrium spots under 12 BB to maximize your survival and final table conversion.',
      targetBenchmark: '100% Nash Shove Accuracy',
      drillPreset: 'push-fold-clinic',
      drillLabel: 'Train Push/Fold Clinic',
    });
    actionPlan.push({
      stepNumber: 2,
      title: 'PKO Bounty Hunter Math',
      description:
        'Calculate adjusted pot odds when covering short-stack bounty all-ins to capture instant cash rewards.',
      targetBenchmark: 'Capture short-stack bounties profitably',
      drillPreset: 'bounty-short-stack',
      drillLabel: 'Train Bounty Hunter Mode',
    });
  }

  // Construct overall assessment
  let overallAssessment = `${playerName} is currently playing as a ${derived.archetype}. `;
  if (derived.decisionAccuracyPercent >= 85) {
    overallAssessment += `Your technical fundamentals are extremely sharp with an ${derived.decisionAccuracyPercent}% Virtual Coach rating. `;
  } else if (derived.decisionAccuracyPercent >= 70) {
    overallAssessment += `Your general instincts are solid (${derived.decisionAccuracyPercent}% Coach rating), but small leaks are bleeding chips in marginal spots. `;
  } else {
    overallAssessment += `Decision accuracy is currently at ${derived.decisionAccuracyPercent}%. Following the 3-step action plan below will immediately plug your biggest chip leaks. `;
  }

  const customPrescription =
    actionPlan.length > 0
      ? `Priority #1 Focus for ${playerName}: ${actionPlan[0].title}. ${actionPlan[0].description}`
      : `Keep maintaining your balanced TAG profile and practice against GTO Solver bots.`;

  return {
    playerName,
    hasSufficientData: true,
    handsPlayed: stats.handsPlayed,
    archetype: derived.archetype,
    archetypeDescription: derived.archetypeDescription,
    decisionAccuracyPercent: derived.decisionAccuracyPercent,
    overallAssessment,
    keyStrengths,
    priorityLeaks: derived.diagnosedLeaks,
    actionPlan,
    customPrescription,
  };
}
