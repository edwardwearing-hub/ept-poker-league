// ============================================================================
// E.P.T. Fruit Machine Platform - Modular Cartridge Architecture Types
// Supports 16-square perimeter loop, cash ladder rungs, paytables, MPU4 state,
// and responsive mobile view states.
// ============================================================================

/**
 * MPU4 Compensated Payout Mode based on internal ledger (Target RTP vs Actual Out)
 */
export type MachineMode = 'TIGHT' | 'NEUTRAL' | 'GIVING';

/**
 * Dynamic stage view controller mode & responsive mobile viewport focus state
 */
export type StageViewMode = 'BASE_REELS' | 'FEATURE_BOARD';
export type MobileViewState = 'BASE_REELS' | 'FEATURE_BOARD' | 'REELS' | 'BOARD' | 'PAYTABLE' | 'CABINET';

/**
 * Action/feature categories for the 16-square clockwise perimeter board
 */
export type BoardTileType =
  | 'go'
  | 'cash'
  | 'nudge'
  | 'mystery'
  | 'skill'
  | 'roulette'
  | 'life'
  | 'jail'
  | 'parking'
  | 'hazard'
  | 'repeat'
  | 'jackpot';

/**
 * Individual square on the 16-tile (5x5 hollow perimeter) top-glass feature board
 */
export interface BoardTile {
  /** 0-15 clockwise perimeter index starting at Top-Left (GO = 0) */
  id: number;
  /** Primary uppercase property or feature title (e.g., 'MAGICIAN', 'CARD SHARK') */
  title: string;
  /** Secondary subtitle or E.P.T. player name (e.g., 'CHRIS DALY', 'DAVE B') */
  subtext: string;
  /** Bottom banner price/award tag (e.g., '£25 CASH', 'MYSTERY ?') */
  priceTag: string;
  /** Tailwind CSS background class for the Monopoly property color header bar */
  colorBar: string;
  /** Fallback or primary emoji icon when no player avatar is used */
  icon?: string;
  /** E.P.T. player avatar image path (e.g., '/avatars/avatar_dave_blackburn_1787685845732.png') */
  avatarImg?: string;
  /** Functional tile behavior when landed on */
  type: BoardTileType;
  /** Base numeric multiplier/value (scaled by stake for cash/go/parking/jackpot, or raw count for nudges/lives) */
  val: number;
  /** True for the 4 corner squares (indices 0, 4, 8, 12) */
  isCorner?: boolean;
  /** Tailwind CSS grid row placement class (row-start-1 to row-start-5) */
  row: string;
  /** Tailwind CSS grid column placement class (col-start-1 to col-start-5) */
  col: string;
}

/**
 * Reel symbol & paytable definition for the 3-reel stepper mechanism
 */
export interface CartridgeSymbol {
  /** Unique symbol identifier (e.g., 'edward_boss', 'dave_blackburn') */
  id: string;
  /** Display name on reel & paytable */
  name: string;
  /** Emoji icon for classic fruit/bell/trophy symbols */
  icon?: string;
  /** E.P.T. player avatar asset path for high-roller character symbols */
  avatarImg?: string;
  /** Character nickname/title in the E.P.T. universe (e.g., 'The Pit Boss', 'The Card Shark') */
  characterRole?: string;
  /** Payout multiplier (times stake) for 3 matching symbols on the center winline */
  payout3: number;
  /** Optional payout multiplier for 2 matching symbols on left+center reels (e.g., 2x Cherries) */
  payout2?: number;
  /** Optional payout multiplier for 1 symbol on the left reel (e.g., 1x Cherry) */
  payout1?: number;
  /** Relative weighting on virtual reel calculations / roulette */
  weight: number;
  /** Tailwind CSS classes for the symbol's comic pill badge */
  badgeColor: string;
  /** Short arcade label printed under the symbol on the reel tape */
  comicLabel: string;
  /** Whether 3-of-a-kind triggers direct entry to the top-glass feature board */
  triggersDirectFeature?: boolean;
  /** Whether 3-of-a-kind triggers the direct top jackpot + repeater mini-game */
  triggersDirectJackpot?: boolean;
}

/**
 * Structured rung on the vertical British Cash Ladder (£1 up to £100 Jackpot)
 */
export interface CashLadderRung {
  /** 0-based index from bottom rung to top jackpot rung */
  index: number;
  /** Cash value at £1 base stake */
  value: number;
  /** Formatted display label (e.g., 'STEP 1', '🏆 JACKPOT') */
  label: string;
  /** True if this is the top jackpot rung */
  isJackpot?: boolean;
  /** Skill-stopper oscillation delay in ms at this rung (faster near top) */
  stopperDelayMs: number;
}

/**
 * Explicit paytable line item for rendering paytable modals and mobile paytable views
 */
export interface PaytableEntry {
  /** Unique paytable rule ID */
  id: string;
  /** Display combination title (e.g., '3x Edward (The Pit Boss)') */
  combination: string;
  /** Symbol IDs involved in this win combination */
  symbolIds: string[];
  /** Match count required (1, 2, or 3) */
  matchCount: 1 | 2 | 3;
  /** Base multiplier of stake paid out */
  multiplier: number;
  /** Optional special feature triggered instead of or in addition to cash */
  specialReward?: string;
  /** Badge or category tag */
  badge: string;
}

/**
 * Mystery square reward definition
 */
export interface MysteryRewardConfig {
  id: string;
  text: string;
  type: 'lives' | 'cash' | 'nudges' | 'equal_wins';
  value: number;
}

/**
 * Visual & audio theme configuration for a swappable cartridge
 */
export interface CartridgeTheme {
  /** Backdrop watermark image URL */
  backdropUrl: string;
  /** Active board walker token emoji or icon */
  boardTokenIcon: string;
  /** Hostess/Dealer character metadata */
  hostess: {
    name: string;
    title: string;
    avatarImg: string;
    defaultComment: string;
    aiGameContext: string;
  };
  /** Featured E.P.T. player cast cameos displayed in the marquee */
  castCameos: {
    name: string;
    role: string;
    avatarImg: string;
    borderColorClass: string;
  }[];
  /** Default dot-matrix attract mode ticker message */
  defaultTickerMessage: string;
}

/**
 * Core mechanical & mathematical parameters for a cartridge
 */
export interface CartridgeMechanics {
  /** Target Return-To-Player ratio for the MPU4 compensated ledger (e.g., 0.74 = 74%) */
  targetRTP: number;
  /** Initial seeded totalIn for the compensated ledger */
  initialLedgerIn: number;
  /** Initial seeded totalOut for the compensated ledger */
  initialLedgerOut: number;
  /** Available stake denominations in GBP */
  stakes: number[];
  /** Default selected stake in GBP */
  defaultStake: number;
  /** Base jackpot payout at £1 stake */
  maxJackpot: number;
  /** Number of steps on the lower number trail to trigger the feature board (default: 8) */
  trailLength: number;
  /** Step index on the number trail that awards a mid-trail reel bonus (default: 4) */
  trailBonusStep: number;
  /** Base bonus cash awarded every time the player passes GO (tile 15 -> 0) */
  passGoBonus: number;
  /** Symbol ID that triggers direct feature board entry on 3-of-a-kind */
  directFeatureSymbolId: string;
  /** Board tile ID where direct feature entry lands the player (e.g., 8 = Pit Boss Free Parking) */
  directFeatureStartTile: number;
  /** Starting pot multiplier (times stake) on direct feature entry */
  directFeatureStartingPotMultiplier: number;
  /** Starting extra lives on direct feature entry */
  directFeatureStartingLives: number;
  /** Symbol ID that triggers direct jackpot + repeater chance on 3-of-a-kind */
  directJackpotSymbolId: string;
}

/**
 * Complete swappable Fruit Machine Cartridge configuration
 */
export interface FruityCartridge {
  /** Unique cartridge identifier (e.g., '01-vegas-strip') */
  id: string;
  /** URL-friendly slug */
  slug: string;
  /** Short cartridge title (e.g., 'The Vegas Strip Fruity') */
  title: string;
  /** Upper feature board marquee title (e.g., 'MONOPOLY VEGAS STRIP') */
  boardTitle: string;
  /** Main cabinet header title */
  cabinetTitle: string;
  /** Machine category badge label */
  hardwareBadge: string;
  /** Visual, hostess, and branding theme */
  theme: CartridgeTheme;
  /** Mathematical, RTP, and rule parameters */
  mechanics: CartridgeMechanics;
  /** Master list of reel symbols */
  symbols: CartridgeSymbol[];
  /** Structured paytable entries for UI display and evaluation */
  paytable: PaytableEntry[];
  /** Physical stepper reel tapes (16 stops per reel across 3 reels) */
  reelTapes: [CartridgeSymbol[], CartridgeSymbol[], CartridgeSymbol[]];
  /** 16-square clockwise perimeter feature board tiles (5x5 grid) */
  boardTiles: BoardTile[];
  /** Numeric cash ladder values from lowest rung to top jackpot */
  cashLadder: number[];
  /** Detailed cash ladder rung configurations with skill-stopper speeds */
  cashLadderRungs: CashLadderRung[];
  /** Mid-trail (Step 4) bonus outcomes */
  reelBonuses: string[];
  /** Mystery tile (Chris Daly) possible rewards */
  mysteryRewards: MysteryRewardConfig[];
  /** Dot-matrix Oracle cycling tips and predictions */
  oracleTips: string[];
}

/**
 * Pending winline exchange offer (Collect Cash vs. Exchange to Feature Board)
 */
export interface ExchangeOffer {
  amount: number;
  description: string;
  symName: string;
}

/**
 * Active win celebration splash modal payload
 */
export interface WinSplashState {
  amount: number;
  title: string;
  subtitle?: string;
  detail?: string;
  badge?: string;
}

/**
 * Complete runtime state interface (`GameState`) for the Fruit Machine engine
 */
export interface GameState {
  /** Active loaded cartridge ID */
  cartridgeId: string;
  /** Current stake per spin (£0.25, £0.50, £1.00, £2.00) */
  stake: number;
  /** Audio toggle state */
  soundOn: boolean;
  /** Active mobile viewport tab/mode for responsive switching */
  mobileView: MobileViewState;

  // MPU4 Compensated Ledger State
  /** Cumulative money inserted into the machine session */
  totalIn: number;
  /** Cumulative money paid out by the machine session */
  totalOut: number;
  /** Derived MPU4 compensator state ('TIGHT' | 'NEUTRAL' | 'GIVING') */
  machineMode: MachineMode;

  // Physical Stepper Reels State
  /** Current stop indices (0-15) for each of the 3 stepper reel tapes */
  tapeIndices: [number, number, number];
  /** Current sub-symbol trail number stickers (0, 1, or 2) on each reel's center winline */
  reelNumbers: [number, number, number];
  /** True while any stepper motor is actively spinning */
  isSpinning: boolean;
  /** Per-reel spinning state for staggered left-to-right reel stops */
  spinningReels: [boolean, boolean, boolean];
  /** Index of the reel currently executing its mechanical stop recoil bounce */
  recoilReelIndex: number | null;

  // Holds & Nudges State
  /** True when the player can lock/hold reels for the next spin */
  holdsAvailable: boolean;
  /** Locked state for each of the 3 reels */
  heldReels: [boolean, boolean, boolean];
  /** True when Hold-After-Nudge (HAN) exploit is triggered */
  holdAfterNudge: boolean;
  /** Remaining manual/auto stepper nudges available */
  nudgesRemaining: number;

  // Number Trail & Exchange State
  /** Current progress on the 1-8 number trail (4 = Bonus, 8 = Feature Board) */
  trailStep: number;
  /** True when the current trail progress is held over to the next spin */
  trailHeld: boolean;
  /** Pending winline payout eligible for Collect or Exchange to Feature */
  exchangePending: ExchangeOffer | null;

  // Top-Glass 16-Square Perimeter Feature Board State
  /** True when the top-glass Monopoly feature board is active */
  inFeatureBoard: boolean;
  /** Current token position (0-15) around the 16-square perimeter loop */
  boardPosition: number;
  /** True while the board token is stepping square-by-square */
  isWalkingBoard: boolean;
  /** Current highlighted rung index (-1 = unlit, 0-9 = active rung) on the Cash Ladder */
  cashLadderStep: number;

  // Hi-Lo Gamble & Feature Pot State
  /** Current number (1-12) displayed on the 3D Hi-Lo reel/dice cube */
  hiLoCurrent: number;
  /** True while the Hi-Lo number cube is tumbling */
  isRollingHiLo: boolean;
  /** True when 'Equal Wins' protection is active on Hi-Lo ties */
  equalWinsLit: boolean;
  /** Number of extra lives protecting against Hi-Lo busts or Jail hazards */
  extraLives: number;
  /** Accumulated cash pot inside the active feature board run */
  potCash: number;

  // Feature Mini-Games State
  /** Mini-Game 1: Dynamic-acceleration Skill Cash Stopper active flag */
  skillStopperActive: boolean;
  /** Currently lit rung index during Skill Cash Stopper */
  stopperHighlightRung: number;
  /** Mini-Game 2: Fast-reflex Reel Roulette active flag */
  reelRouletteActive: boolean;
  /** Currently highlighted symbol index during Reel Roulette */
  rouletteIndex: number;
  /** Mini-Game 3: Rapid 55ms YES/NO Jackpot Repeater active flag */
  repeaterActive: boolean;
  /** True when the Repeater light is currently on 'YES' */
  repeaterYesLit: boolean;
  /** Base jackpot win amount eligible to be doubled on Repeater hit */
  pendingJackpotWin: number;

  // Dot-Matrix Display, AI Hostess & Win Splash State
  /** Oracle countdown prediction for spins remaining until board entry */
  spinsUntilBoard: number;
  /** Timer counter for cycling dot-matrix attract/oracle messages */
  dotMatrixCycle: number;
  /** Primary amber LED dot-matrix ticker string */
  tickerMessage: string;
  /** Current banter line from Pub Landlady Sarah */
  aiHostessComment: string;
  /** True while fetching fresh AI commentary */
  isAiThinking: boolean;
  /** Active win splash overlay state (or null when hidden) */
  winSplash: WinSplashState | null;
}
