export type CostType = 'cash' | 'chips' | 'equity' | 'mobTokens';

export interface GameTable {
  id: string;
  name: string;
  category: 'Underground' | 'Speakeasy' | 'Casino Floor' | 'VIP Penthouse';
  description: string;
  baseCost: number;
  costMultiplier: number;
  baseRevenue: number; // Cash per second
  baseChips: number;   // Chips per second
  baseHeat: number;    // Heat generated per second
  iconName: string;
  image?: string;
  accentColor: string;
  level: number;
  unlocked: boolean;
  unlockCost: number;
}

export interface SyndicateStaff {
  id: string;
  name: string;
  role: string;
  avatar: string;
  description: string;
  cost: number;
  costType: CostType;
  targetTableId?: string; // If tied to a specific table
  tableMultiplier?: number;
  heatReductionRate?: number; // Reduces heat passively
  chipBonusRate?: number;     // Multiplies chip yield
  critChanceBonus?: number;   // Bonus for active table clicks
  hired: boolean;
}

export interface CasinoUpgrade {
  id: string;
  name: string;
  category: 'Equipment' | 'Hospitality' | 'Underworld' | 'Security';
  description: string;
  cost: number;
  costType: CostType;
  effectLabel: string;
  purchased: boolean;
  requiresUpgradeId?: string;
  tableId?: string;
  multiplier?: number;
  globalCashMultiplier?: number;
  globalChipMultiplier?: number;
  heatMultiplier?: number;
}

export interface FrontBusiness {
  id: string;
  name: string;
  type: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  washRate: number; // Dollars of dirty cash converted to Clean Equity per second
  heatSuppression: number; // Passive heat drop per second
  level: number;
  unlocked: boolean;
  unlockCost: number;
  accentColor: string;
  iconName: string;
}

export interface PrestigePerk {
  id: string;
  name: string;
  description: string;
  cost: number; // in Mob Tokens
  level: number;
  maxLevel: number;
  bonusType: 'globalCash' | 'globalChips' | 'startingCash' | 'heatResistance' | 'launderingSpeed' | 'critMultiplier';
  valuePerLevel: number;
  minPrestigeResets?: number; // Requires N resets to unlock
}

export interface GameStats {
  totalClicks: number;
  handsWon: number;
  blackjacksHit: number;
  totalCashEarned: number;
  totalChipsEarned: number;
  totalLaundered: number;
  equityEarnedThisRun?: number;
  totalEquityEarned?: number;
  raidsAvoided: number;
  prestigeResets: number;
  timePlayedSeconds: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  scientificNotation: boolean;
  particlesEnabled: boolean;
}

export interface GameState {
  version: number;
  cash: number;
  chips: number;
  equity: number;       // Clean Laundered Equity (Used for high-tier tech)
  heat: number;         // 0 to 100
  mobTokens: number;    // Prestige currency
  reputation: number;   // Level / Tier of your criminal syndicate

  tables: Record<string, GameTable>;
  staff: Record<string, SyndicateStaff>;
  upgrades: Record<string, CasinoUpgrade>;
  businesses: Record<string, FrontBusiness>;
  perks: Record<string, PrestigePerk>;

  stats: GameStats;
  settings: GameSettings;
  lastSaveTime: number;
  lastTickTime: number;

  // New Underworld Systems
  vaultLevel: number;
  padlockedTables: Record<string, PadlockStatus>;
  detainedStaff: Record<string, DetainedStatus>;
  activeTableBoosts: Record<string, TableBoostStatus>;
  activeFloorEvent: FloorEvent | null;
  lastFloorEventCheckTime: number;

  // Major Longevity Expansions
  tournaments: Record<string, Tournament>;
  sponsoredPros: Record<string, SponsoredPro>;
  wonTrophies: string[];
  sportsbookMatches: SportsbookMatch[];
  totalVigCollected: number;
  relics: Record<string, Relic>;
  equippedRelicIds: string[]; // max 3
  currentDistrictId: string;
  districts: Record<string, District>;
  achievements: Record<string, Achievement>;

  // Post-Reset Progressive Feature Unlocks
  blackMarketContracts: Record<string, BlackMarketContract>;
  lastWheelSpinTime: number;
  heistMissions: Record<string, HeistMission>;
  shadowCabinet: Record<string, ShadowCabinetOfficial>;
}

export interface Tournament {
  id: string;
  name: string;
  tier: 'Underground' | 'Regional' | 'Championship' | 'High Roller' | 'World Championship';
  description: string;
  buyIn: number;
  chipsEntry: number;
  durationSeconds: number;
  prizePool: number;
  firstPlacePrize: number;
  chipsReward: number;
  trophy: string;
  trophyIcon: string;
  status: 'idle' | 'running' | 'completed';
  startedAt?: number;
  sponsoredProId?: string | null;
  winChance: number;
  image: string;
}

export interface SponsoredPro {
  id: string;
  name: string;
  alias: string;
  salary: number;
  cutPercent: number;
  winBonus: number;
  hired: boolean;
  avatar: string;
  specialty: string;
  quote: string;
}

export interface SportsbookMatch {
  id: string;
  sport: 'Boxing' | 'Horse Racing' | 'Football';
  eventTitle: string;
  teamA: string;
  teamB: string;
  oddsA: number;
  oddsB: number;
  status: 'open' | 'simulating' | 'settled';
  endsAt: number;
  activeBet?: {
    side: 'A' | 'B';
    amount: number;
  };
  winner?: 'A' | 'B';
  fixedByMob?: boolean;
}

export interface Relic {
  id: string;
  name: string;
  type: 'deck' | 'charm';
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Mythic';
  description: string;
  costChips: number;
  unlocked: boolean;
  effectDescription: string;
  bonusType: 'cashMultiplier' | 'chipMultiplier' | 'heatReduction' | 'bribeBonus' | 'tournamentBonus' | 'laundrySpeed';
  bonusValue: number;
  iconName: string;
}

export interface District {
  id: string;
  name: string;
  tagline: string;
  description: string;
  unlockCostCash: number;
  unlockCostEquity: number;
  unlocked: boolean;
  revenueMultiplier: number;
  heatModifier: number;
  bossName: string;
  accentColor: string;
  image: string;
}

export interface Achievement {
  id: string;
  title: string;
  category: 'Wealth' | 'Underworld' | 'Poker' | 'Empire';
  description: string;
  rewardTokens: number;
  unlocked: boolean;
  claimed: boolean;
  iconName: string;
}

export interface FloorEvent {
  id: string;
  type: 'snitch' | 'vip' | 'heist';
  title: string;
  description: string;
  expiresAt: number;
  durationSeconds: number;
  targetTableId?: string;
  tableTitle?: string;
  lootAmount?: number;
}

export interface PadlockStatus {
  tableId: string;
  until: number;
  reason: string;
}

export interface DetainedStatus {
  staffId: string;
  until: number;
  reason: string;
}

export interface TableBoostStatus {
  tableId: string;
  multiplier: number;
  until: number;
  label: string;
}

export interface ActiveClickResult {
  cashGained: number;
  chipsGained: number;
  heatGained: number;
  isCrit: boolean;
  handName: string;
}

export interface OfflineProgressSummary {
  secondsOffline: number;
  cashEarned: number;
  chipsEarned: number;
  equityLaundered: number;
}

export interface BlackMarketContract {
  id: string;
  name: string;
  codename: string;
  description: string;
  costTokens: number;
  costEquity: number;
  unlocked: boolean;
  category: 'Operations' | 'Bribery' | 'Laundering' | 'VIP';
  effectLabel: string;
  iconName: string;
}

export interface HeistMission {
  id: string;
  targetName: string;
  targetType: 'Corrupt Bank' | 'Rival Mafia Vault' | 'Offshore Casino Liner' | 'Federal Reserve Truck' | 'Swiss Depository' | 'Megayacht Safe';
  description: string;
  cashReward: number;
  tokensReward: number;
  heatPenalty: number;
  durationSeconds: number;
  riskPercent: number;
  status: 'ready' | 'in_progress' | 'completed' | 'cooldown';
  startedAt?: number;
  cooldownUntil?: number;
}

export interface ShadowCabinetOfficial {
  id: string;
  officeName: string;
  incumbent: string;
  description: string;
  costEquity: number;
  bribed: boolean;
  benefitLabel: string;
  iconName: string;
}

export interface WheelReward {
  id: string;
  label: string;
  type: 'cash' | 'chips' | 'equity' | 'tokens' | 'frenzy';
  value: number;
  color: string;
}

