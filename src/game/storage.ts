import { GameState } from './types';
import { 
  DEFAULT_GAME_STATE, 
  INITIAL_TABLES, 
  INITIAL_STAFF, 
  INITIAL_UPGRADES, 
  INITIAL_BUSINESSES, 
  INITIAL_PRESTIGE_PERKS,
  INITIAL_TOURNAMENTS,
  INITIAL_PROS,
  INITIAL_RELICS,
  INITIAL_DISTRICTS,
  INITIAL_ACHIEVEMENTS,
  INITIAL_SPORTSBOOK_MATCHES,
  INITIAL_BLACK_MARKET_CONTRACTS,
  INITIAL_HEIST_MISSIONS,
  INITIAL_SHADOW_CABINET
} from './constants';

const SAVE_KEY = 'casino_syndicate_save_v1';

export function saveGame(state: GameState): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave: GameState = {
      ...state,
      lastSaveTime: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Failed to save game state to localStorage:', err);
  }
}

export function loadGame(): GameState {
  if (typeof window === 'undefined') return DEFAULT_GAME_STATE;

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return DEFAULT_GAME_STATE;

    const parsed = JSON.parse(raw);

    // Migrate tables: preserve level and unlocked, adopt updated costs & stats
    const migratedTables: Record<string, any> = {};
    for (const [id, defaultTable] of Object.entries(INITIAL_TABLES)) {
      const saved = parsed.tables?.[id];
      migratedTables[id] = {
        ...defaultTable,
        level: typeof saved?.level === 'number' ? saved.level : defaultTable.level,
        unlocked: typeof saved?.unlocked === 'boolean' ? saved.unlocked : defaultTable.unlocked,
      };
    }

    // Migrate staff: preserve hired, adopt updated cost & stats
    const migratedStaff: Record<string, any> = {};
    for (const [id, defaultStaff] of Object.entries(INITIAL_STAFF)) {
      const saved = parsed.staff?.[id];
      migratedStaff[id] = {
        ...defaultStaff,
        hired: typeof saved?.hired === 'boolean' ? saved.hired : defaultStaff.hired,
      };
    }

    // Migrate upgrades: preserve purchased status, adopt updated costs & multipliers
    const migratedUpgrades: Record<string, any> = {};
    for (const [id, defaultUpgrade] of Object.entries(INITIAL_UPGRADES)) {
      const saved = parsed.upgrades?.[id];
      migratedUpgrades[id] = {
        ...defaultUpgrade,
        purchased: typeof saved?.purchased === 'boolean' ? saved.purchased : defaultUpgrade.purchased,
      };
    }

    // Migrate front businesses: preserve level and unlocked, adopt updated costs & wash rates
    const migratedBusinesses: Record<string, any> = {};
    for (const [id, defaultBiz] of Object.entries(INITIAL_BUSINESSES)) {
      const saved = parsed.businesses?.[id];
      migratedBusinesses[id] = {
        ...defaultBiz,
        level: typeof saved?.level === 'number' ? saved.level : defaultBiz.level,
        unlocked: typeof saved?.unlocked === 'boolean' ? saved.unlocked : defaultBiz.unlocked,
      };
    }

    // Migrate districts: preserve unlocked, adopt updated costs & multipliers
    const migratedDistricts: Record<string, any> = {};
    for (const [id, defaultDist] of Object.entries(INITIAL_DISTRICTS)) {
      const saved = parsed.districts?.[id];
      migratedDistricts[id] = {
        ...defaultDist,
        unlocked: typeof saved?.unlocked === 'boolean' ? saved.unlocked : defaultDist.unlocked,
      };
    }

    // Migrate tournaments: preserve status and runtime state, adopt updated buy-ins & prizes
    const migratedTournaments: Record<string, any> = {};
    for (const [id, defaultTourney] of Object.entries(INITIAL_TOURNAMENTS)) {
      const saved = parsed.tournaments?.[id];
      migratedTournaments[id] = {
        ...defaultTourney,
        status: saved?.status || defaultTourney.status,
        startedAt: saved?.startedAt,
        sponsoredProId: saved?.sponsoredProId,
      };
    }

    // Migrate sponsored pros: preserve hired, adopt updated salary & bonus
    const migratedPros: Record<string, any> = {};
    for (const [id, defaultPro] of Object.entries(INITIAL_PROS)) {
      const saved = parsed.sponsoredPros?.[id];
      migratedPros[id] = {
        ...defaultPro,
        hired: typeof saved?.hired === 'boolean' ? saved.hired : defaultPro.hired,
      };
    }

    // Migrate relics: preserve unlocked, adopt updated chip costs & bonuses
    const migratedRelics: Record<string, any> = {};
    for (const [id, defaultRelic] of Object.entries(INITIAL_RELICS)) {
      const saved = parsed.relics?.[id];
      migratedRelics[id] = {
        ...defaultRelic,
        unlocked: typeof saved?.unlocked === 'boolean' ? saved.unlocked : defaultRelic.unlocked,
      };
    }

    // Migrate black market contracts: preserve unlocked
    const migratedContracts: Record<string, any> = {};
    for (const [id, defaultContract] of Object.entries(INITIAL_BLACK_MARKET_CONTRACTS)) {
      const saved = parsed.blackMarketContracts?.[id];
      migratedContracts[id] = {
        ...defaultContract,
        unlocked: typeof saved?.unlocked === 'boolean' ? saved.unlocked : defaultContract.unlocked,
      };
    }

    // Migrate heist missions: preserve status and timing
    const migratedHeists: Record<string, any> = {};
    for (const [id, defaultHeist] of Object.entries(INITIAL_HEIST_MISSIONS)) {
      const saved = parsed.heistMissions?.[id];
      migratedHeists[id] = {
        ...defaultHeist,
        status: saved?.status || defaultHeist.status,
        startedAt: saved?.startedAt,
        cooldownUntil: saved?.cooldownUntil,
      };
    }

    // Migrate shadow cabinet: preserve bribed
    const migratedCabinet: Record<string, any> = {};
    for (const [id, defaultOfficial] of Object.entries(INITIAL_SHADOW_CABINET)) {
      const saved = parsed.shadowCabinet?.[id];
      migratedCabinet[id] = {
        ...defaultOfficial,
        bribed: typeof saved?.bribed === 'boolean' ? saved.bribed : defaultOfficial.bribed,
      };
    }

    // Deep merge with default state to prevent schema migration crashes
    const state: GameState = {
      ...DEFAULT_GAME_STATE,
      ...parsed,
      tables: migratedTables,
      staff: migratedStaff,
      upgrades: migratedUpgrades,
      businesses: migratedBusinesses,
      perks: {
        ...INITIAL_PRESTIGE_PERKS,
        ...(parsed.perks || {}),
      },
      stats: {
        ...DEFAULT_GAME_STATE.stats,
        ...(parsed.stats || {}),
        equityEarnedThisRun: typeof parsed.stats?.equityEarnedThisRun === 'number'
          ? parsed.stats.equityEarnedThisRun
          : Math.max(parsed.equity || 0, Math.floor((parsed.stats?.totalLaundered || 0) / 100)),
        totalEquityEarned: typeof parsed.stats?.totalEquityEarned === 'number'
          ? parsed.stats.totalEquityEarned
          : Math.max(parsed.equity || 0, Math.floor((parsed.stats?.totalLaundered || 0) / 100)),
      },
      settings: {
        ...DEFAULT_GAME_STATE.settings,
        ...(parsed.settings || {}),
      },
      padlockedTables: parsed.padlockedTables || {},
      detainedStaff: parsed.detainedStaff || {},
      activeTableBoosts: parsed.activeTableBoosts || {},
      activeFloorEvent: parsed.activeFloorEvent || null,
      lastFloorEventCheckTime: parsed.lastFloorEventCheckTime || Date.now(),
      vaultLevel: parsed.vaultLevel || 0,

      // Expanded systems
      tournaments: migratedTournaments,
      sponsoredPros: migratedPros,
      wonTrophies: parsed.wonTrophies || [],
      sportsbookMatches: parsed.sportsbookMatches && parsed.sportsbookMatches.length > 0 ? parsed.sportsbookMatches : INITIAL_SPORTSBOOK_MATCHES,
      totalVigCollected: parsed.totalVigCollected || 0,
      relics: migratedRelics,
      equippedRelicIds: parsed.equippedRelicIds || [],
      currentDistrictId: parsed.currentDistrictId || 'downtown',
      districts: migratedDistricts,
      achievements: {
        ...INITIAL_ACHIEVEMENTS,
        ...(parsed.achievements || {}),
      },

      // Post-Reset Systems
      blackMarketContracts: migratedContracts,
      lastWheelSpinTime: parsed.lastWheelSpinTime || 0,
      heistMissions: migratedHeists,
      shadowCabinet: migratedCabinet,
    };

    return state;
  } catch (err) {
    console.error('Failed to parse save game:', err);
    return DEFAULT_GAME_STATE;
  }
}

export function exportSaveString(state: GameState): string {
  try {
    const json = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return '';
  }
}

export function importSaveString(encoded: string): GameState | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded.trim())));
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object' && parsed.cash !== undefined) {
      return {
        ...DEFAULT_GAME_STATE,
        ...parsed,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function resetGame(): GameState {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SAVE_KEY);
  }
  return DEFAULT_GAME_STATE;
}
