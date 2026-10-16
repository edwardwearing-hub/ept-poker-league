export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 2..14
}

export type GameMode =
  | 'no-limit'
  | 'pot-limit'
  | 'bounty-hunter'
  | 'all-in-or-fold'
  | 'icm-bubble'
  | 'bomb-pot'
  | 'tournament-eliminator';

export type DifficultyLevel = 'rookie' | 'regular' | 'shark' | 'gto';

export type ScenarioPreset =
  | 'free-play'
  | 'btn-vs-bb-3bet'
  | 'bounty-short-stack'
  | 'wet-board-defense'
  | 'push-fold-clinic'
  | 'multiway-pot-limit';

export type PositionName = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'MP' | 'LJ' | 'HJ' | 'CO';

export type BotPersonaType =
  | 'tag-shark'
  | 'lag-maniac'
  | 'tight-passive'
  | 'calling-station'
  | 'bounty-hunter'
  | 'nit-rock'
  | 'gto-solver';

export interface BotProfile {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  persona: BotPersonaType;
  vpipTarget: number; // 0..100
  pfrTarget: number;  // 0..100
  aggression: number; // 0..100
  bluffFreq: number;  // 0..100
  foldToPressure: number; // 0..100
  bio: string;
  signatureMove: string;
}

export interface TrainerPlayer {
  id: string;
  name: string;
  isHero: boolean;
  avatar: string;
  persona?: BotPersonaType;
  nickname?: string;
  position: PositionName;
  seatIndex: number;
  chips: number;
  startingChips: number;
  currentBet: number;
  totalCommitted: number;
  cards: Card[];
  folded: boolean;
  isAllIn: boolean;
  bountyValue: number; // For Bounty Hunter mode (in chips/cash equivalent)
  bountiesWon: number;
  lastAction?: string;
  lastActionReasoning?: string;
}

export type Street = 'Waiting' | 'Pre-flop' | 'Flop' | 'Turn' | 'River' | 'Showdown';

export type DecisionGrade = 'A+' | 'B' | 'C' | 'D' | 'F';

export interface CoachFeedback {
  id: string;
  timestamp: number;
  street: Street;
  position: PositionName;
  heroCards: Card[];
  communityCards: Card[];
  actionTaken: string;
  recommendedAction: string;
  grade: DecisionGrade;
  evDelta: number; // Estimated BB impact (e.g. +1.2 or -2.5)
  handEquity: number; // 0..100
  potOdds: number; // 0..100
  outs: number;
  boardTexture: string;
  headline: string;
  explanation: string;
  strategicTip: string;
  gameMode: GameMode;
  leakCategory?: LeakCategory;
}

export type LeakCategory =
  | 'limping-preflop'
  | 'calling-without-odds'
  | 'overfolding-equity'
  | 'passive-value-miss'
  | 'positional-looseness'
  | 'pot-limit-sizing'
  | 'bounty-miscalculation'
  | 'aof-push-fold-error';

export interface HandEvaluation {
  rankCategory: number; // 1 (High Card) to 10 (Royal Flush)
  rankName: string;
  exactScore: number;
  bestFiveDescription: string;
}

export interface DrawInfo {
  flushDraw: boolean;
  backdoorFlushDraw: boolean;
  openEndedStraightDraw: boolean;
  gutshotStraightDraw: boolean;
  overcards: number;
  totalOuts: number;
  drawDescription: string[];
  boardTexture: 'Dry / Rainbow' | 'Semi-Wet' | 'Wet / Coordinated' | 'Paired Board' | 'Monotone Danger';
}

export interface ScenarioConfig {
  gameMode: GameMode;
  difficulty: DifficultyLevel;
  numPlayers: number; // 2 to 9 (Hero + 1 to 8 bots)
  startingBigBlinds: number; // e.g., 10, 20, 50, 100, 200
  smallBlind: number;
  bigBlind: number;
  preset: ScenarioPreset;
  liveCoachHints: boolean;
  autoRebuy: boolean;
  botsAutoRebuy?: boolean;
  heroAutoRebuy?: boolean;
  autoShowDebrief?: boolean;
}

export type PlayStyleArchetype =
  | 'TAG Shark (Tight-Aggressive)'
  | 'LAG Crusher (Loose-Aggressive)'
  | 'The Nit / Rock (Tight-Passive)'
  | 'Calling Station (Loose-Passive)'
  | 'Balanced GTOHybrid'
  | 'Unclassified Rookie';

export interface PositionStats {
  hands: number;
  vpipCount: number;
  pfrCount: number;
  handsWon: number;
  netBB: number;
  optimalDecisions: number;
  totalDecisions: number;
}

export interface CareerTrackerStats {
  handsPlayed: number;
  handsWon: number;
  showdownsReached: number;
  showdownsWon: number;
  netChipsWon: number;
  netBBWon: number;
  bountiesClaimed: number;
  bountyCashWon: number;
  bankruptcyCount?: number; // Times player went bankrupt / lost all chips
  bailoutChipsReceived?: number; // Total bailout chips granted (e.g. 1,000 per bankruptcy)

  // Pre-flop counters
  vpipOpportunities: number;
  vpipCount: number;
  pfrCount: number;
  threeBetOpportunities: number;
  threeBetCount: number;
  limpCount: number;

  // Post-flop counters
  postflopBetsAndRaises: number;
  postflopCalls: number;
  postflopFolds: number;
  cbetOpportunities: number;
  cbetCount: number;

  // Decision Grading
  totalDecisionsGraded: number;
  gradeCounts: Record<DecisionGrade, number>;
  leakCounts: Record<LeakCategory, number>;

  // Mode specific counters
  handsByMode: Record<GameMode, number>;

  // Position breakdown
  byPosition: Record<PositionName, PositionStats>;

  // Recent Coach Feedback History (last 40 decisions)
  recentFeedback: CoachFeedback[];
}
