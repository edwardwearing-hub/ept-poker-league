import { BotProfile, GameMode, PositionName, Rank, ScenarioPreset, Suit } from './types';

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};

export const GAME_MODES_INFO: Record<
  GameMode,
  {
    id: GameMode;
    name: string;
    shortBadge: string;
    tagline: string;
    description: string;
    rulesSummary: string[];
    defaultBB: number;
    accentColor: string;
  }
> = {
  'no-limit': {
    id: 'no-limit',
    name: "No-Limit Hold'em",
    shortBadge: 'NLHE',
    tagline: 'Standard Cash & League Tournament Play',
    description:
      'The flagship E.P.T. format. Bet any amount up to your entire chip stack on any street. Focuses on positional ranges, C-betting, value sizing, and river bluff catching.',
    rulesSummary: [
      'Minimum raise is at least the size of the previous bet/raise.',
      'Maximum bet is your entire stack (All-In) at any time.',
      'Coach evaluates VPIP/PFR balance, pot odds, and street-by-street EV.',
    ],
    defaultBB: 100,
    accentColor: '#D4AF37',
  },
  'pot-limit': {
    id: 'pot-limit',
    name: 'Pot Limit Hold’em',
    shortBadge: 'POT LIMIT',
    tagline: 'Geometric Sizing & Post-Flop Equity Mastery',
    description:
      'Bets and raises are capped at the exact size of the pot. Prevents pre-flop all-in bullying and forces deep post-flop skill, draw math, and multi-street pot geometry.',
    rulesSummary: [
      'Max Bet/Raise = Current Total Pot + (2 × Call Amount) - Current Bet.',
      'You cannot open-shove 100BB pre-flop; you must build the pot geometrically across streets.',
      'Coach evaluates Pot-Limit sizing efficiency, draw equity, and SPR control.',
    ],
    defaultBB: 100,
    accentColor: '#06B6D4',
  },
  'bounty-hunter': {
    id: 'bounty-hunter',
    name: 'Bounty Hunter (PKO)',
    shortBadge: 'BOUNTY PKO',
    tagline: 'Knockout Math, Chip Conversion & Headhunting',
    description:
      'Every player carries a cash bounty on their head. Knocking out an all-in player claims 50% of their bounty immediately and adds 50% to your own bounty—dramatically widening calling ranges!',
    rulesSummary: [
      'Each player begins with a Bounty worth 50 BB (£50 equivalent).',
      'Covering an opponent’s all-in adds Bounty Chip Equity to the pot odds calculation.',
      'Coach calculates exact Bounty-Adjusted Pot Odds when facing short-stack shoves.',
    ],
    defaultBB: 50,
    accentColor: '#E63946',
  },
  'all-in-or-fold': {
    id: 'all-in-or-fold',
    name: 'All-In or Fold (AoF)',
    shortBadge: 'PUSH / FOLD',
    tagline: 'High-Voltage Short-Stack Nash Equilibrium',
    description:
      'Players sit with 10 BB stacks and have only two choices: Shove All-In or Fold. The ultimate drill for late-stage tournament survival, blind stealing, and Nash push/call charts.',
    rulesSummary: [
      'Starting stacks are locked at 8–12 Big Blinds.',
      'Only two actions exist: All-In (Push) or Fold.',
      'Coach grades every decision against short-stack Nash Equilibrium Push/Fold charts.',
    ],
    defaultBB: 10,
    accentColor: '#F59E0B',
  },
  'icm-bubble': {
    id: 'icm-bubble',
    name: 'ICM Final Table Bubble',
    shortBadge: 'ICM BUBBLE',
    tagline: 'Pay-Jump Survival vs. Big-Stack Bullying',
    description:
      'Simulates the E.P.T. Final Table money bubble with uneven stacks. Chips lost are worth more than chips won—requiring tighter calling ranges against big stacks and ruthless pressure on medium stacks.',
    rulesSummary: [
      'Asymmetric stack depths simulate real tournament bubble pressure.',
      'Risk premium (+8% to +12% extra equity required) applies when calling all-ins.',
      'Coach grades your ICM discipline and bubble pressure spots.',
    ],
    defaultBB: 25,
    accentColor: '#A855F7',
  },
  'bomb-pot': {
    id: 'bomb-pot',
    name: 'Bomb Pot Frenzy',
    shortBadge: 'BOMB POT',
    tagline: 'Skip Pre-Flop — Pure Multiway Board Reading',
    description:
      'Every player posts a mandatory 4 BB Bomb Ante and jumps straight to the Flop with random holdings! Tests pure post-flop board texture reading, nut-advantage, and multiway caution.',
    rulesSummary: [
      'All players pay 4 BB pre-flop and see the Flop immediately with 100% range width.',
      'Top pair is rarely good multiway; focus on two-pair+, nut draws, and board texture.',
      'Coach evaluates multiway discipline and nut-draw aggression.',
    ],
    defaultBB: 100,
    accentColor: '#22C55E',
  },
  'tournament-eliminator': {
    id: 'tournament-eliminator',
    name: 'Full Game (Winner Takes All)',
    shortBadge: 'ELIMINATOR',
    tagline: 'Auto-Play Elimination • Blinds Escalation • Winner Takes All',
    description:
      'A complete Sit & Go tournament from start to finish. When players hit 0 chips, they are knocked out! Hands deal and advance automatically with zero interruptions. Battle down to heads-up to become champion, then receive your full tournament master report.',
    rulesSummary: [
      'Winner Takes All: Last player standing with all chips wins the tournament championship trophy.',
      'Player Knockouts: No rebuys. When any bot or player reaches 0 chips, they are eliminated.',
      'Auto-Hand Flow: Hands deal and progress automatically without asking you to start the next hand.',
    ],
    defaultBB: 100,
    accentColor: '#F43F5E',
  },
};

export const SCENARIO_PRESETS_INFO: Record<
  ScenarioPreset,
  {
    id: ScenarioPreset;
    name: string;
    description: string;
    recommendedMode: GameMode;
    recommendedPlayers: number;
    recommendedBB: number;
  }
> = {
  'free-play': {
    id: 'free-play',
    name: 'Standard Session (Free Play)',
    description: 'Deal natural hands across rotating positions with your chosen game mode and table size.',
    recommendedMode: 'no-limit',
    recommendedPlayers: 6,
    recommendedBB: 100,
  },
  'btn-vs-bb-3bet': {
    id: 'btn-vs-bb-3bet',
    name: 'Spot Drill: Button vs. Blind Pressure',
    description: 'Practice high-frequency late-position steals, 3-bet defense, and post-flop C-betting.',
    recommendedMode: 'no-limit',
    recommendedPlayers: 4,
    recommendedBB: 100,
  },
  'bounty-short-stack': {
    id: 'bounty-short-stack',
    name: 'Spot Drill: Bounty Hunter Short-Stack Shoves',
    description: 'Opponents have volatile short stacks and juicy bounties. Learn when bounty odds justify a wide call!',
    recommendedMode: 'bounty-hunter',
    recommendedPlayers: 6,
    recommendedBB: 40,
  },
  'wet-board-defense': {
    id: 'wet-board-defense',
    name: 'Spot Drill: Wet & Coordinated Flops',
    description: 'Deals coordinated flops rich in straight and flush draws to test your equity and pot-odds math.',
    recommendedMode: 'no-limit',
    recommendedPlayers: 4,
    recommendedBB: 100,
  },
  'push-fold-clinic': {
    id: 'push-fold-clinic',
    name: 'Spot Drill: 10BB Push/Fold Clinic',
    description: 'Rapid-fire short-stack training to master pre-flop shove and call ranges under blind pressure.',
    recommendedMode: 'all-in-or-fold',
    recommendedPlayers: 6,
    recommendedBB: 10,
  },
  'multiway-pot-limit': {
    id: 'multiway-pot-limit',
    name: 'Spot Drill: Pot-Limit Post-Flop Geometry',
    description: 'Practice sizing pot-limit bets and drawing to the nuts without over-committing on marginal one-pair hands.',
    recommendedMode: 'pot-limit',
    recommendedPlayers: 6,
    recommendedBB: 100,
  },
};

export const BOT_ROSTER: BotProfile[] = [
  {
    id: 'bot-edward',
    name: 'Edward Wearing',
    nickname: 'The Bounty Boss',
    avatar: '/avatars/avatar_edward_wearing_1772222877224.png',
    persona: 'bounty-hunter',
    vpipTarget: 32,
    pfrTarget: 26,
    aggression: 82,
    bluffFreq: 35,
    foldToPressure: 30,
    bio: 'Relentless big-stack bully who targets short stacks and hunts bounties with wide suited-connector and Ace-x shoves.',
    signatureMove: 'The Bounty Push — maximum pressure on medium/short stacks near the bubble.',
  },
  {
    id: 'bot-georgina',
    name: 'Georgina Wearing',
    nickname: 'The Silent Trap',
    avatar: '/avatars/avatar_georgina_wearing_1772223035422.png',
    persona: 'tight-passive',
    vpipTarget: 21,
    pfrTarget: 13,
    aggression: 48,
    bluffFreq: 14,
    foldToPressure: 55,
    bio: 'Patient and deceptive. Checks monster hands on the turn to feign weakness before unleashing a devastating river check-raise.',
    signatureMove: 'The Georgina Trap — slow-playing sets and full houses until the river.',
  },
  {
    id: 'bot-liam',
    name: 'Liam Duxbury',
    nickname: 'The Disciplined TAG',
    avatar: '/avatars/avatar_liam_duxbury_1772223048076.png',
    persona: 'tag-shark',
    vpipTarget: 23,
    pfrTarget: 19,
    aggression: 68,
    bluffFreq: 22,
    foldToPressure: 62,
    bio: 'Fundamentally sound Tight-Aggressive grinder. Enters pots with a raise, C-bets dry boards, and folds one-pair to heavy river heat.',
    signatureMove: 'The Liam Test — disciplined laydowns when facing polarized river raises.',
  },
  {
    id: 'bot-luke',
    name: 'Luke Daly',
    nickname: 'Dynasty Aggressor',
    avatar: '/avatars/avatar_luke_daly_1772223102669.png',
    persona: 'lag-maniac',
    vpipTarget: 38,
    pfrTarget: 30,
    aggression: 86,
    bluffFreq: 42,
    foldToPressure: 28,
    bio: 'High-tempo Loose-Aggressive pressure machine. 3-bets wide from the button and barrels scare cards relentlessly.',
    signatureMove: 'Triple-Barrel Heat — forces you to make hero calls for your entire stack.',
  },
  {
    id: 'bot-dave-b',
    name: 'Dave Blackburn',
    nickname: 'The Iron Rock',
    avatar: '/avatars/avatar_dave_blackburn_1787685845732.png',
    persona: 'nit-rock',
    vpipTarget: 15,
    pfrTarget: 12,
    aggression: 52,
    bluffFreq: 8,
    foldToPressure: 74,
    bio: 'Ultra-selective pre-flop fortress. If Dave 3-bets you pre-flop, expect QQ+, AK, or an elite holding.',
    signatureMove: 'Nut Peddler — folds marginal spots and waits for premium equity.',
  },
  {
    id: 'bot-daniel',
    name: 'Daniel Horne',
    nickname: 'The Wildcard Station',
    avatar: '/avatars/avatar_daniel_horne_1772222954376.png',
    persona: 'calling-station',
    vpipTarget: 46,
    pfrTarget: 11,
    aggression: 32,
    bluffFreq: 18,
    foldToPressure: 20,
    bio: 'Loves seeing flops with any suited card or pair. Rarely believes you have it—bluff him at your own peril!',
    signatureMove: 'Sticky Calldown — calls three streets with middle pair to "keep you honest".',
  },
  {
    id: 'bot-stephen',
    name: 'Stephen Flood',
    nickname: 'The Solver Professor',
    avatar: '/avatars/avatar_stephen_flood_1772223088474.png',
    persona: 'gto-solver',
    vpipTarget: 25,
    pfrTarget: 21,
    aggression: 72,
    bluffFreq: 28,
    foldToPressure: 45,
    bio: 'Balanced, mathematical, and unexploitable. Mixes value bets and bluffs at optimal pot-odds frequencies.',
    signatureMove: 'Minimum Defense Frequency — never over-folds and punishes sizing errors.',
  },
  {
    id: 'bot-chris',
    name: 'Chris Daly',
    nickname: 'The Pot-Limit Specialist',
    avatar: '/avatars/avatar_chris_daly_1772222942062.png',
    persona: 'tag-shark',
    vpipTarget: 26,
    pfrTarget: 20,
    aggression: 70,
    bluffFreq: 25,
    foldToPressure: 48,
    bio: 'Excels in multiway pots and drawing textures. Calculates exact pot-limit geometry to maximize value when hitting draws.',
    signatureMove: 'Geometric Pot Press — sets up exact turn bets for a river pot-sized shove.',
  },
  {
    id: 'bot-jack',
    name: 'Jack Spencer',
    nickname: 'The Math Grinder',
    avatar: '/avatars/avatar_shark.png',
    persona: 'tag-shark',
    vpipTarget: 22,
    pfrTarget: 18,
    aggression: 65,
    bluffFreq: 24,
    foldToPressure: 55,
    bio: 'Analytical player who relies on strict odds and ranges. Rarely makes emotional plays.',
    signatureMove: 'Expected Value Calldown — makes decisions purely based on positive EV calculations.',
  },
];

// Position order by table size (seat 0 is always BTN, seat 1 SB, seat 2 BB, etc.)
export function getPositionsForTableSize(numPlayers: number): PositionName[] {
  switch (numPlayers) {
    case 2:
      return ['BTN', 'BB']; // Heads-up: BTN is SB
    case 3:
      return ['BTN', 'SB', 'BB'];
    case 4:
      return ['BTN', 'SB', 'BB', 'CO'];
    case 5:
      return ['BTN', 'SB', 'BB', 'MP', 'CO'];
    case 6:
      return ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'];
    case 7:
      return ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO'];
    case 8:
      return ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'];
    default:
      return (['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO'] as PositionName[]).slice(0, numPlayers);
  }
}

// Pre-flop 169 hand percentile rankings (0 = best like AA, 100 = worst like 72o)
// Used for accurate GTO preflop range evaluation, Push/Fold charts, and Bot AI!
export function getPreflopHandNotation(c1: { rank: Rank; suit: Suit; value: number }, c2: { rank: Rank; suit: Suit; value: number }): string {
  const high = c1.value >= c2.value ? c1 : c2;
  const low = c1.value >= c2.value ? c2 : c1;
  const r1 = high.rank === '10' ? 'T' : high.rank;
  const r2 = low.rank === '10' ? 'T' : low.rank;
  if (high.value === low.value) return `${r1}${r2}`;
  const suited = high.suit === low.suit ? 's' : 'o';
  return `${r1}${r2}${suited}`;
}

// Returns a strength score from 0 to 100 for any 2 hole cards (Chen-inspired + GTO Playability)
export function getPreflopHandPercentileScore(c1: { rank: Rank; suit: Suit; value: number }, c2: { rank: Rank; suit: Suit; value: number }): number {
  const high = Math.max(c1.value, c2.value);
  const low = Math.min(c1.value, c2.value);
  const isPair = high === low;
  const isSuited = c1.suit === c2.suit;
  const gap = high - low;

  let score = 0;

  if (isPair) {
    // Pairs: 22 is ~52, TT is ~84, AA is 100
    score = 46 + (high - 2) * 4.5;
    return Math.min(100, Math.round(score));
  }

  // High card base value
  score = high * 3.8 + low * 1.9;

  // Suited bonus
  if (isSuited) score += 9;

  // Connectedness bonus
  if (gap === 1) score += 7;
  else if (gap === 2) score += 4;
  else if (gap === 3) score += 1;
  else if (gap >= 5) score -= 5;

  // Broadway synergy (both >= 10)
  if (high >= 10 && low >= 10) score += 8;

  // Ace-x suited wheel/nut flush bonus
  if (high === 14 && isSuited) score += 6;

  return Math.max(5, Math.min(96, Math.round(score)));
}

// Recommended opening threshold (minimum hand score 0..100) by position
export const POSITION_OPEN_THRESHOLDS: Record<PositionName, number> = {
  'UTG': 72,   // Top ~14% of hands
  'UTG+1': 70, // Top ~16%
  'MP': 66,    // Top ~20%
  'LJ': 64,    // Top ~23%
  'HJ': 60,    // Top ~27%
  'CO': 54,    // Top ~34%
  'BTN': 45,   // Top ~48%
  'SB': 50,    // Top ~40%
  'BB': 42,    // Defense threshold
};

export const POSITION_INFO: Record<
  PositionName,
  { title: string; description: string; rangeTip: string }
> = {
  UTG: {
    title: 'UTG (Under the Gun)',
    description:
      'First player to act pre-flop. Because every other player acts after you, this is the tightest seat at the table.',
    rangeTip: 'Play only the top ~14% of hands (Pocket Pairs 77+, AQ+, suited broadways).',
  },
  'UTG+1': {
    title: 'UTG+1 (Early Position)',
    description:
      'Second player to act pre-flop in full-ring games. Still requires strong pre-flop discipline.',
    rangeTip: 'Play top ~16% of hands; avoid easily dominated offsuit Aces or Kings.',
  },
  MP: {
    title: 'MP (Middle Position)',
    description:
      'Seated between Early Position and the Cutoff. You can begin adding mid pocket pairs and suited connectors.',
    rangeTip: 'Open-raise roughly the top ~20% of hands when folded to you.',
  },
  LJ: {
    title: 'LJ (Lojack)',
    description:
      'First seat of late-middle position (6-Max UTG equivalent). Good spot to start pressuring tight blinds.',
    rangeTip: 'Open-raise ~23% of hands including suited Aces (A2s–A5s).',
  },
  HJ: {
    title: 'HJ (Hijack)',
    description:
      'Two seats to the right of the Dealer Button. Strong stealing seat when the Cutoff and Button are tight.',
    rangeTip: 'Open-raise ~27% of hands; apply pressure to passive players.',
  },
  CO: {
    title: 'CO (Cutoff)',
    description:
      'Directly to the right of the Dealer Button. Second most profitable seat in poker—only the Button has position on you post-flop.',
    rangeTip: 'Open-raise ~34% of hands when unopened.',
  },
  BTN: {
    title: 'BTN (Dealer Button)',
    description:
      'The best seat at the table! You act LAST on the Flop, Turn, and River, giving you maximum information on every street.',
    rangeTip: 'Open-raise ~45%–48% of hands to steal blinds and play pots in position.',
  },
  SB: {
    title: 'SB (Small Blind)',
    description:
      'Posts half a big blind pre-flop. Despite the discount, you act FIRST on every post-flop street (out of position).',
    rangeTip: 'Raise or fold when folded to you (~40% range); avoid limping into aggressive Big Blinds.',
  },
  BB: {
    title: 'BB (Big Blind)',
    description:
      'Posts 1 full big blind and acts LAST pre-flop. Because you already have 1 BB invested, you get favorable pot odds to defend.',
    rangeTip: 'Defend wide against single late-position raises, but play carefully out of position post-flop.',
  },
};

export const BOARD_TEXTURE_INFO: Record<
  string,
  { title: string; description: string; strategyTip: string }
> = {
  'Dry / Rainbow': {
    title: 'Dry / Rainbow Board',
    description:
      'Three different suits (no flush draw possible on the flop) and uncoordinated ranks (few straight draws).',
    strategyTip: 'Great board for small (33% pot) continuation bets—opponents miss dry flops 67% of the time!',
  },
  'Semi-Wet': {
    title: 'Semi-Wet Board',
    description:
      'Contains either a two-flush draw or connected cards that allow straight draws.',
    strategyTip: 'Size up your value bets to 55%–65% pot to charge drawing hands.',
  },
  'Wet / Coordinated': {
    title: 'Wet / Coordinated Board',
    description:
      'Heavily connected community cards with flush draws and multiple straight possibilities (e.g., 8♥ 9♥ J♣).',
    strategyTip: 'Bet larger (70%–80% pot) with strong made hands to deny equity, and avoid bluffing without outs!',
  },
  'Paired Board': {
    title: 'Paired Board',
    description:
      'Two of the community cards share the same rank (e.g., K♠ K♦ 4♣). Makes Full Houses and Trips possible, but reduces the number of combinations opponents can hold.',
    strategyTip: 'High-card dry paired boards heavily favor the pre-flop raiser; C-bet small at high frequency.',
  },
  'Monotone Danger': {
    title: 'Monotone Board (3 of One Suit)',
    description:
      'All three flop cards have the exact same suit! Anyone with two cards of that suit already has a made Flush, and single-card flush draws have 9 outs.',
    strategyTip: 'Proceed with caution if you do not hold a high card of the board suit; avoid bloating the pot with bare one-pair hands.',
  },
};

// ==========================================
// 7. PLAIN-ENGLISH + PRO-TERM BRIDGE LABELS
// ==========================================

export const POSITION_BRIDGE_LABELS: Record<
  PositionName,
  { shortBridge: string; fullBridge: string }
> = {
  BTN: {
    shortBridge: 'Dealer (BTN)',
    fullBridge: 'Dealer / Act Last (BTN)',
  },
  SB: {
    shortBridge: 'Half Blind (SB)',
    fullBridge: 'Small Blind / Half Forced Bet (SB)',
  },
  BB: {
    shortBridge: 'Big Blind (BB)',
    fullBridge: 'Big Blind / Full Forced Bet (BB)',
  },
  UTG: {
    shortBridge: '1st to Act (UTG)',
    fullBridge: '1st to Act / Under the Gun (UTG)',
  },
  'UTG+1': {
    shortBridge: '2nd to Act (UTG+1)',
    fullBridge: 'Early Seat / 2nd to Act (UTG+1)',
  },
  MP: {
    shortBridge: 'Middle (MP)',
    fullBridge: 'Middle Seat (MP)',
  },
  LJ: {
    shortBridge: 'Mid-Late (LJ)',
    fullBridge: 'Lojack / Mid-Late Seat (LJ)',
  },
  HJ: {
    shortBridge: 'Hijack (HJ)',
    fullBridge: 'Hijack / 2 Seats off Dealer (HJ)',
  },
  CO: {
    shortBridge: 'Late Seat (CO)',
    fullBridge: 'Cutoff / 1 Seat off Dealer (CO)',
  },
};

// ==========================================
// 8. 10-STEP POKER HAND RANKING LADDER (FOR BEGINNERS)
// ==========================================

export interface HandLadderRung {
  rankNumber: number; // #1 (best) to #10 (lowest)
  rankCategory: number; // Matches evaluateHand().rankCategory (10 down to 1)
  plainName: string;
  proSlang: string;
  exampleCards: string[];
  whatItIs: string;
  beginnerAdvice: string;
}

export const POKER_HAND_RANKING_LADDER: HandLadderRung[] = [
  {
    rankNumber: 1,
    rankCategory: 10,
    plainName: 'Royal Flush',
    proSlang: 'The Nuts / Royal',
    exampleCards: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠'],
    whatItIs: 'A-K-Q-J-10 all of the exact same suit.',
    beginnerAdvice: 'Unbeatable! Bet and raise to get all your chips in the pot.',
  },
  {
    rankNumber: 2,
    rankCategory: 9,
    plainName: 'Straight Flush',
    proSlang: 'Straight Flush',
    exampleCards: ['9♥', '8♥', '7♥', '6♥', '5♥'],
    whatItIs: 'Any 5 cards in numerical order, all of the same suit.',
    beginnerAdvice: 'Nearly unbeatable! Build a huge pot for maximum value.',
  },
  {
    rankNumber: 3,
    rankCategory: 8,
    plainName: 'Four of a Kind',
    proSlang: 'Quads',
    exampleCards: ['A♠', 'A♥', 'A♦', 'A♣', 'K♠'],
    whatItIs: 'All 4 cards of the exact same rank.',
    beginnerAdvice: 'Monster hand! Let aggressive opponents bet into you or bet big.',
  },
  {
    rankNumber: 4,
    rankCategory: 7,
    plainName: 'Full House',
    proSlang: 'Boat / Full Boat',
    exampleCards: ['K♠', 'K♥', 'K♦', 'Q♠', 'Q♣'],
    whatItIs: 'Three of a Kind plus a Pair in the same 5-card hand.',
    beginnerAdvice: 'Beats Flushes and Straights! Bet strongly for value.',
  },
  {
    rankNumber: 5,
    rankCategory: 6,
    plainName: 'Flush',
    proSlang: 'Flush',
    exampleCards: ['A♦', 'J♦', '8♦', '5♦', '2♦'],
    whatItIs: 'Any 5 cards of the same suit (not in numerical order).',
    beginnerAdvice: 'Very strong! Watch out only if the table cards pair up (Full House risk).',
  },
  {
    rankNumber: 6,
    rankCategory: 5,
    plainName: 'Straight',
    proSlang: 'Broadway / Wheel',
    exampleCards: ['10♠', '9♣', '8♥', '7♦', '6♠'],
    whatItIs: '5 cards in numerical order of mixed suits (Ace can be high or low).',
    beginnerAdvice: 'Great made hand! Bet to charge opponents who are chasing a Flush.',
  },
  {
    rankNumber: 7,
    rankCategory: 4,
    plainName: 'Three of a Kind',
    proSlang: 'Set (Pocket Pair) / Trips',
    exampleCards: ['Q♠', 'Q♥', 'Q♦', '9♠', '4♣'],
    whatItIs: '3 cards of the same rank and 2 unrelated side cards.',
    beginnerAdvice: 'Strong hand! Bet 60%–75% of the pot to build value and protect against draws.',
  },
  {
    rankNumber: 8,
    rankCategory: 3,
    plainName: 'Two Pair',
    proSlang: 'Two Pair / Top Two',
    exampleCards: ['J♠', 'J♣', '8♥', '8♦', 'A♠'],
    whatItIs: '2 different pairs plus 1 fifth card (kicker).',
    beginnerAdvice: 'Solid value hand! Bet on safe boards, but be careful if 3 of one suit appear.',
  },
  {
    rankNumber: 9,
    rankCategory: 2,
    plainName: 'One Pair',
    proSlang: 'Top Pair / Overpair',
    exampleCards: ['10♠', '10♥', 'A♦', '7♣', '3♠'],
    whatItIs: '2 cards of the same rank. The most common winning hand at showdown!',
    beginnerAdvice: 'Pair of the highest board card (Top Pair) is good for 1–2 bets; weak bottom pairs should check/fold to heavy pressure.',
  },
  {
    rankNumber: 10,
    rankCategory: 1,
    plainName: 'High Card',
    proSlang: 'Air / Ace-High',
    exampleCards: ['A♠', 'K♦', '9♣', '6♥', '2♠'],
    whatItIs: 'No pair, straight, or flush—your highest single card plays.',
    beginnerAdvice: 'Weak unless you have Helpful Cards (Outs) to a Straight or Flush draw.',
  },
];


