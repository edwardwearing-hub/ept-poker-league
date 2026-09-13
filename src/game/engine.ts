import { 
  GameState, 
  ActiveClickResult, 
  OfflineProgressSummary,
  SportsbookMatch,
  Tournament,
  SponsoredPro,
  Relic,
  District,
  Achievement,
  WheelReward,
  BlackMarketContract,
  HeistMission,
  ShadowCabinetOfficial
} from './types';
import { LUCKY_WHEEL_WEDGES } from './constants';

// ==========================================
// NUMBER & FORMATTING UTILITIES
// ==========================================

const SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 
  'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg'
];

export function formatNumber(num: number, scientific = false): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num === 0) return '0';
  if (num < 0) return '-' + formatNumber(Math.abs(num), scientific);

  if (scientific && num >= 1e6) {
    return num.toExponential(2).replace('+', '');
  }

  if (num < 1000) {
    return num >= 10 ? num.toFixed(0) : num.toFixed(1);
  }

  const exp = Math.floor(Math.log10(num) / 3);
  if (exp >= SUFFIXES.length) {
    return num.toExponential(2).replace('+', '');
  }

  const shortVal = num / Math.pow(10, exp * 3);
  return `${shortVal.toFixed(shortVal >= 100 ? 0 : 1)}${SUFFIXES[exp]}`;
}

export function formatMoney(amount: number, scientific = false): string {
  return `$${formatNumber(amount, scientific)}`;
}

export function formatChips(amount: number, scientific = false): string {
  return `🪙 ${formatNumber(amount, scientific)}`;
}

export function formatEquity(amount: number, scientific = false): string {
  return `💎 ${formatNumber(amount, scientific)}`;
}

export function formatTokens(amount: number): string {
  return `⭐ ${formatNumber(amount)}`;
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// ==========================================
// COST CALCULATORS
// ==========================================

export function getTableUpgradeCost(baseCost: number, multiplier: number, currentLevel: number): number {
  return Math.floor(baseCost * Math.pow(multiplier, currentLevel));
}

export function getBatchTableUpgradeCost(
  baseCost: number,
  multiplier: number,
  currentLevel: number,
  count: number
): number {
  if (count <= 0) return 0;
  if (count === 1) return getTableUpgradeCost(baseCost, multiplier, currentLevel);

  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(baseCost * Math.pow(multiplier, currentLevel + i));
  }
  return total;
}

export function getMaxAffordableTableUpgrades(
  baseCost: number,
  multiplier: number,
  currentLevel: number,
  availableCash: number
): { count: number; cost: number } {
  const cost1 = getTableUpgradeCost(baseCost, multiplier, currentLevel);
  if (availableCash < cost1) {
    return { count: 1, cost: cost1 };
  }

  const r = multiplier;
  const startCost = baseCost * Math.pow(r, currentLevel);
  let est = Math.floor(Math.log(1 + (Math.max(0, availableCash) * (r - 1)) / startCost) / Math.log(r));
  est = Math.max(1, est);

  let totalCost = 0;
  for (let i = 0; i < est; i++) {
    totalCost += Math.floor(baseCost * Math.pow(multiplier, currentLevel + i));
  }

  let count = est;
  // Step forward if cash remains
  while (count < 10000) {
    const nextCost = Math.floor(baseCost * Math.pow(multiplier, currentLevel + count));
    if (totalCost + nextCost <= availableCash) {
      totalCost += nextCost;
      count++;
    } else {
      break;
    }
  }

  // Step backward if over-budget
  while (count > 1 && totalCost > availableCash) {
    count--;
    totalCost -= Math.floor(baseCost * Math.pow(multiplier, currentLevel + count));
  }

  return { count, cost: totalCost };
}

export function getBusinessUpgradeCost(baseCost: number, multiplier: number, currentLevel: number): number {
  return Math.floor(baseCost * Math.pow(multiplier, currentLevel));
}

export function getBatchBusinessUpgradeCost(
  baseCost: number,
  multiplier: number,
  currentLevel: number,
  count: number
): number {
  if (count <= 0) return 0;
  if (count === 1) return getBusinessUpgradeCost(baseCost, multiplier, currentLevel);

  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(baseCost * Math.pow(multiplier, currentLevel + i));
  }
  return total;
}

export function getMaxAffordableBusinessUpgrades(
  baseCost: number,
  multiplier: number,
  currentLevel: number,
  availableCash: number
): { count: number; cost: number } {
  const cost1 = getBusinessUpgradeCost(baseCost, multiplier, currentLevel);
  if (availableCash < cost1) {
    return { count: 1, cost: cost1 };
  }

  const r = multiplier;
  const startCost = baseCost * Math.pow(r, currentLevel);
  let est = Math.floor(Math.log(1 + (Math.max(0, availableCash) * (r - 1)) / startCost) / Math.log(r));
  est = Math.max(1, est);

  let totalCost = 0;
  for (let i = 0; i < est; i++) {
    totalCost += Math.floor(baseCost * Math.pow(multiplier, currentLevel + i));
  }

  let count = est;
  while (count < 10000) {
    const nextCost = Math.floor(baseCost * Math.pow(multiplier, currentLevel + count));
    if (totalCost + nextCost <= availableCash) {
      totalCost += nextCost;
      count++;
    } else {
      break;
    }
  }

  while (count > 1 && totalCost > availableCash) {
    count--;
    totalCost -= Math.floor(baseCost * Math.pow(multiplier, currentLevel + count));
  }

  return { count, cost: totalCost };
}

// ==========================================
// RATE CALCULATORS & BONUSES
// ==========================================

export function getGlobalCashMultiplier(state: GameState): number {
  let mult = 1.0;

  // District Multiplier
  const district = state.districts?.[state.currentDistrictId];
  if (district && district.revenueMultiplier) {
    mult *= district.revenueMultiplier;
  }

  // Purchased Upgrades
  for (const upgrade of Object.values(state.upgrades)) {
    if (upgrade.purchased && upgrade.globalCashMultiplier) {
      mult *= upgrade.globalCashMultiplier;
    }
  }

  // Equipped Relic Bonuses
  if (state.equippedRelicIds && state.relics) {
    for (const rId of state.equippedRelicIds) {
      const relic = state.relics[rId];
      if (relic && relic.bonusType === 'cashMultiplier') {
        mult += relic.bonusValue;
      }
    }
  }

  // Prestige Perks
  const mobCon = state.perks['mob-connections'];
  if (mobCon && mobCon.level > 0) {
    mult += mobCon.level * mobCon.valuePerLevel;
  }

  // Post-Reset Black Market Contract: Ironclad Pipeline (+50%)
  if (state.blackMarketContracts?.['contract-iron-pipeline']?.unlocked) {
    mult *= 1.5;
  }

  // Post-Reset Shadow Cabinet: Central Banker (4x)
  if (state.shadowCabinet?.['cabinet-central-banker']?.bribed) {
    mult *= 4.0;
  }

  // Heat Penalty: If Heat > 85%, panic sets in and revenue is cut by 40%
  if (state.heat > 85) {
    mult *= 0.60;
  }

  return mult;
}

export function getGlobalChipMultiplier(state: GameState): number {
  let mult = 1.0;

  for (const upgrade of Object.values(state.upgrades)) {
    if (upgrade.purchased && upgrade.globalChipMultiplier) {
      mult *= upgrade.globalChipMultiplier;
    }
  }

  // Equipped Relic Bonuses
  if (state.equippedRelicIds && state.relics) {
    for (const rId of state.equippedRelicIds) {
      const relic = state.relics[rId];
      if (relic && relic.bonusType === 'chipMultiplier') {
        mult += relic.bonusValue;
      }
    }
  }

  const artie = state.staff['accountant-artie'];
  if (artie && artie.hired && artie.chipBonusRate) {
    mult *= artie.chipBonusRate;
  }

  const whale = state.perks['whale-attractor'];
  if (whale && whale.level > 0) {
    mult += whale.level * whale.valuePerLevel;
  }

  // Post-Reset Black Market Contract: Whale Consortium (+100%)
  if (state.blackMarketContracts?.['contract-whale-consortium']?.unlocked) {
    mult *= 2.0;
  }

  return mult;
}

export function getHeatResistance(state: GameState): number {
  let resistance = 1.0;

  // District Heat Modifier
  const district = state.districts?.[state.currentDistrictId];
  if (district && district.heatModifier) {
    resistance *= district.heatModifier;
  }

  // Equipped Relic Bonuses
  if (state.equippedRelicIds && state.relics) {
    for (const rId of state.equippedRelicIds) {
      const relic = state.relics[rId];
      if (relic && relic.bonusType === 'heatReduction') {
        resistance *= Math.max(0.2, 1 - relic.bonusValue);
      }
    }
  }

  for (const upgrade of Object.values(state.upgrades)) {
    if (upgrade.purchased && upgrade.heatMultiplier) {
      resistance *= upgrade.heatMultiplier;
    }
  }

  const vinnie = state.staff['bouncer-vinnie'];
  if (vinnie && vinnie.hired && vinnie.heatReductionRate) {
    resistance *= (1 - vinnie.heatReductionRate);
  }

  const lawyers = state.perks['ironclad-lawyers'];
  if (lawyers && lawyers.level > 0) {
    resistance *= Math.max(0.2, 1 - (lawyers.level * lawyers.valuePerLevel));
  }

  // Post-Reset Black Market Contract: Diplomatic Immunity Courier (-50% Heat)
  if (state.blackMarketContracts?.['contract-diplomatic-pouch']?.unlocked) {
    resistance *= 0.50;
  }

  return resistance;
}

// Returns [cashPerSec, chipsPerSec, heatPerSec] for a table
export function getTableRates(tableId: string, state: GameState): [number, number, number] {
  const table = state.tables[tableId];
  if (!table || table.level <= 0 || !table.unlocked) return [0, 0, 0];

  const now = Date.now();

  // If table is padlocked by police, revenue is zero!
  if (state.padlockedTables?.[tableId] && now < state.padlockedTables[tableId].until) {
    return [0, 0, 0];
  }

  let cash = table.baseRevenue * table.level;
  let chips = table.baseChips * table.level;
  let heat = table.baseHeat * Math.sqrt(table.level);

  // Table specific upgrades
  for (const upgrade of Object.values(state.upgrades)) {
    if (upgrade.purchased && upgrade.tableId === tableId && upgrade.multiplier) {
      cash *= upgrade.multiplier;
    }
  }

  // Staff assigned to this table (skip if staff is detained in police holding cell)
  for (const staff of Object.values(state.staff)) {
    const isDetained = state.detainedStaff?.[staff.id] && now < state.detainedStaff[staff.id].until;
    if (staff.hired && !isDetained && staff.targetTableId === tableId && staff.tableMultiplier) {
      cash *= staff.tableMultiplier;
    }
  }

  // Category specific pit bosses (skip if detained)
  if (table.category === 'Casino Floor' && state.staff['pitboss-claudia']?.hired && (!state.detainedStaff?.['pitboss-claudia'] || now >= state.detainedStaff['pitboss-claudia'].until)) {
    cash *= 2.0;
  }
  if (table.category === 'VIP Penthouse' && state.staff['don-lucio']?.hired && (!state.detainedStaff?.['don-lucio'] || now >= state.detainedStaff['don-lucio'].until)) {
    cash *= 3.0;
  }

  // VIP Whale Profit Boost
  if (state.activeTableBoosts?.[tableId] && now < state.activeTableBoosts[tableId].until) {
    cash *= state.activeTableBoosts[tableId].multiplier;
    chips *= state.activeTableBoosts[tableId].multiplier;
  }

  const globalCash = getGlobalCashMultiplier(state);
  const globalChips = getGlobalChipMultiplier(state);
  const heatResist = getHeatResistance(state);

  return [cash * globalCash, chips * globalChips, heat * heatResist];
}

// Total passive generation rates across entire syndicate
export function getTotalProductionRates(state: GameState) {
  let totalCash = 0;
  let totalChips = 0;
  let totalHeatGen = 0;

  for (const tableId of Object.keys(state.tables)) {
    const [c, ch, h] = getTableRates(tableId, state);
    totalCash += c;
    totalChips += ch;
    totalHeatGen += h;
  }

  // Laundering Front Businesses
  let totalWashCapacity = 0;
  let totalHeatSuppression = 0;

  const fastWash = state.perks['fast-wash']?.level || 0;
  let washSpeedBonus = 1 + (fastWash * 0.35);

  // Upgrade bonuses
  if (state.upgrades['crypto-mixer-servers']?.purchased) {
    washSpeedBonus += 1.5;
  }

  // Relic bonuses
  if (state.equippedRelicIds && state.relics) {
    for (const rId of state.equippedRelicIds) {
      if (state.relics[rId]?.bonusType === 'laundrySpeed') {
        washSpeedBonus += state.relics[rId].bonusValue;
      }
    }
  }

  // Post-Reset Black Market Contract: Cayman Quantum Wire Routing (+100%)
  if (state.blackMarketContracts?.['contract-cayman-routing']?.unlocked) {
    washSpeedBonus += 1.0;
  }

  // Post-Reset Shadow Cabinet: Treasury Secretary (+200%)
  if (state.shadowCabinet?.['cabinet-treasury-secretary']?.bribed) {
    washSpeedBonus += 2.0;
  }

  for (const biz of Object.values(state.businesses)) {
    if (biz.unlocked && biz.level > 0) {
      totalWashCapacity += biz.washRate * biz.level * washSpeedBonus;
      totalHeatSuppression += biz.heatSuppression * biz.level;
    }
  }

  // Base natural heat dissipation
  totalHeatSuppression += 0.25;

  return {
    cashPerSec: totalCash,
    chipsPerSec: totalChips,
    heatGenPerSec: totalHeatGen,
    heatDropPerSec: totalHeatSuppression,
    netHeatPerSec: totalHeatGen - totalHeatSuppression,
    washCapacityPerSec: totalWashCapacity,
  };
}

// ==========================================
// PRESTIGE SYSTEM (TIED TO CLEAN LAUNDERED EQUITY)
// ==========================================

// Calculate Clean Laundered Equity metric used for Prestige Buyouts
export function getPrestigeEquity(state: GameState): number {
  return Math.max(
    state.equity || 0,
    state.stats.equityEarnedThisRun || 0
  );
}

// Prestige threshold: requires at least 2,500 Clean Equity (💎 2,500)
export const PRESTIGE_EQUITY_THRESHOLD = 2500;

// Calculate Prestige Golden Mob Tokens obtainable based on Clean Equity
export function calculatePrestigeTokens(state: GameState): number {
  const cleanEquity = getPrestigeEquity(state);
  if (cleanEquity < PRESTIGE_EQUITY_THRESHOLD) return 0;

  // Scaled curve based on clean equity:
  // 2,500 eq -> 1 token
  // 4,000 eq -> 2 tokens
  // 6,500 eq -> 3 tokens
  // 10,000 eq -> 4 tokens
  // 14,500 eq -> 5 tokens
  // 20,000 eq -> 6 tokens
  // 50,000 eq -> 9 tokens
  // 200,000 eq -> 19 tokens
  // 1,000,000 eq -> 44 tokens
  const rawTokens = Math.floor(Math.sqrt((cleanEquity - 2000) / 500));
  return Math.max(0, rawTokens);
}

// Calculate the Clean Equity amount needed to earn the next Mob Token
export function getNextPrestigeTokenEquity(currentTokens: number): number {
  const targetToken = currentTokens <= 0 ? 1 : currentTokens + 1;
  return Math.ceil(Math.pow(targetToken, 2) * 500 + 2000);
}

// ==========================================
// ACTIVE PLAY (DEAL HIGH-STAKES HAND)
// ==========================================

const HAND_RESULTS = [
  { name: 'Pair of Jacks', mult: 1.0, isCrit: false, weight: 45 },
  { name: 'Three Aces', mult: 2.0, isCrit: false, weight: 28 },
  { name: 'Full House Kings', mult: 3.5, isCrit: true, weight: 15 },
  { name: 'Straight Flush', mult: 6.0, isCrit: true, weight: 8 },
  { name: 'NATURAL BLACKJACK 21!', mult: 10.0, isCrit: true, weight: 4 },
];

export function executeActiveDeal(state: GameState): { nextState: GameState; result: ActiveClickResult } {
  const rates = getTotalProductionRates(state);
  // Base gain: $2 or 4% of 1 second's passive cash (balanced clicker curve)
  const baseGain = Math.max(2, rates.cashPerSec * 0.04);
  const baseChipGain = Math.max(1, Math.floor(rates.chipsPerSec * 0.04));

  // Weighted random hand
  const roll = Math.random() * 100;
  let cum = 0;
  let selected = HAND_RESULTS[0];

  for (const hand of HAND_RESULTS) {
    cum += hand.weight;
    if (roll <= cum) {
      selected = hand;
      break;
    }
  }

  // Note: rates.cashPerSec already includes globalCashMultiplier, staff bonuses, and district modifiers!
  const finalCash = Math.floor(baseGain * selected.mult);
  const finalChips = Math.floor(baseChipGain * (selected.isCrit ? 2 : 1));
  const heatAdded = selected.isCrit ? 0.6 : 0.15;

  const nextState: GameState = {
    ...state,
    cash: state.cash + finalCash,
    chips: state.chips + finalChips,
    heat: Math.min(100, state.heat + heatAdded),
    stats: {
      ...state.stats,
      totalClicks: state.stats.totalClicks + 1,
      handsWon: state.stats.handsWon + 1,
      blackjacksHit: selected.isCrit ? state.stats.blackjacksHit + 1 : state.stats.blackjacksHit,
      totalCashEarned: state.stats.totalCashEarned + finalCash,
      totalChipsEarned: state.stats.totalChipsEarned + finalChips,
    },
  };

  return {
    nextState,
    result: {
      cashGained: finalCash,
      chipsGained: finalChips,
      heatGained: heatAdded,
      isCrit: selected.isCrit,
      handName: selected.name,
    },
  };
}

// ==========================================
// CORE TICK STEP (E.G. 10 TIMES PER SECOND)
// ==========================================

export function processGameTick(state: GameState, deltaSeconds: number): { nextState: GameState; event?: string } {
  if (deltaSeconds <= 0) return { nextState: state };

  const rates = getTotalProductionRates(state);

  // 1. Passive Cash & Chips
  const cashProduced = rates.cashPerSec * deltaSeconds;
  const chipsProduced = rates.chipsPerSec * deltaSeconds;

  let newCash = state.cash + cashProduced;
  let newChips = state.chips + chipsProduced;

  // 2. Money Laundering: Converts Dirty Cash into Clean Equity
  let newEquity = state.equity;
  let cashLaundered = 0;
  let equityGained = 0;

  if (rates.washCapacityPerSec > 0 && newCash > 0) {
    const maxWash = rates.washCapacityPerSec * deltaSeconds;
    cashLaundered = Math.min(newCash, maxWash);
    newCash -= cashLaundered;
    // 1 Clean Equity per $100 laundered (tripled if Treasury Secretary is bribed)
    const equityMultiplier = state.shadowCabinet?.['cabinet-treasury-secretary']?.bribed ? 3.0 : 1.0;
    equityGained = (cashLaundered / 100) * equityMultiplier;
    newEquity += equityGained;
  }

  // 3. Heat Management
  let newHeat = state.heat + (rates.netHeatPerSec * deltaSeconds);
  newHeat = Math.max(0, Math.min(100, newHeat));

  let eventNotice: string | undefined = undefined;
  let raidsAvoided = state.stats.raidsAvoided;

  // 4. Police Raid Event Check if Heat hits 100%
  if (newHeat >= 100) {
    // Check if Attorney General is bribed (-70% raid frequency)
    const baseRaidChance = state.shadowCabinet?.['cabinet-attorney-general']?.bribed ? 0.075 : 0.25;
    if (Math.random() < baseRaidChance * deltaSeconds) {
      let vaultProtectRatio = 0;
      if (state.blackMarketContracts?.['contract-interpol-ghost']?.unlocked || state.upgrades['vault-tier-5']?.purchased) {
        vaultProtectRatio = 1.0; // 100% raid immunity!
      } else if (state.upgrades['vault-tier-4']?.purchased) {
        vaultProtectRatio = 0.95;
      } else if (state.upgrades['vault-tier-3']?.purchased) {
        vaultProtectRatio = 0.90;
      } else if (state.upgrades['vault-tier-2']?.purchased) {
        vaultProtectRatio = 0.70;
      } else if (state.upgrades['vault-tier-1']?.purchased) {
        vaultProtectRatio = 0.50;
      }

      const shieldedCash = newCash * vaultProtectRatio;
      const exposedCash = newCash - shieldedCash;
      let fine = Math.floor(exposedCash * 0.35);

      if (state.upgrades['federal-judge-dinner']?.purchased) {
        fine = Math.floor(fine * 0.50); // -50% fine
      }

      newCash -= fine;
      newHeat = 20; // Reset heat post-raid
      raidsAvoided += 1;

      if (vaultProtectRatio >= 1.0) {
        eventNotice = `🚨 POLICE RAID AVERTED! Federal agents raided the casino floor, but your encrypted offshore vault & ghost credentials protected 100% of dirty cash! Heat reset to 20%.`;
      } else if (vaultProtectRatio > 0) {
        eventNotice = `🚨 POLICE RAID! Feds stormed the casino and seized ${formatMoney(fine)}, but your Reinforced Vault shielded ${formatMoney(shieldedCash)}! Heat dropped to 20%.`;
      } else {
        eventNotice = `🚨 POLICE RAID! The feds stormed the floor and seized ${formatMoney(fine)} of dirty cash! Heat reset to 20%.`;
      }
    }
  }

  // 5. Floor Event Expiry & Spawning
  const now = Date.now();
  let updatedFloorEvent = state.activeFloorEvent;

  if (updatedFloorEvent && now >= updatedFloorEvent.expiresAt) {
    if (updatedFloorEvent.type === 'snitch') {
      newHeat = Math.min(100, newHeat + 25);
      eventNotice = `⚠️ Informant Escaped! The undercover rat leaked your operations to the feds (+25% Heat)!`;
    } else if (updatedFloorEvent.type === 'heist') {
      if (state.upgrades['vault-tier-5']?.purchased) {
        eventNotice = `🛡️ Orbital Vault Repelled Heist! Mercenary lasers failed to pierce the orbital satellite vault! 0 losses.`;
      } else {
        const heistLoss = Math.floor(newCash * 0.35);
        newCash -= heistLoss;
        eventNotice = `🚨 Vault Safe Blown Open! The armed gang escaped into the night with ${formatMoney(heistLoss)} in cash!`;
      }
    }
    updatedFloorEvent = null;
  }

  let lastEventCheck = state.lastFloorEventCheckTime || now;
  if (!updatedFloorEvent && (now - lastEventCheck > 65000)) {
    lastEventCheck = now;
    const hasVault = Boolean(state.upgrades['vault-tier-1']?.purchased);
    const unlockedTables = Object.values(state.tables).filter(t => t.unlocked && t.level > 0);
    const roll = Math.random();

    if (hasVault && roll < 0.20) {
      // Vault Heist
      if (state.staff['bouncer-vinnie']?.hired && Math.random() < 0.50) {
        const bonusLoot = Math.floor(Math.max(5000, newCash * 0.05));
        newCash += bonusLoot;
        eventNotice = `🛡️ Vinnie 'The Brick' intercepted armed robbers drilling the safe! Confiscated ${formatMoney(bonusLoot)} in loot.`;
      } else {
        const potentialLoot = Math.floor(Math.max(10000, newCash * 0.15));
        updatedFloorEvent = {
          id: `heist-${now}`,
          type: 'heist',
          title: '🚨 ARMED VAULT HEIST IN PROGRESS!',
          description: 'A mercenary crew is cutting into the floor vault with plasma torches! Repel them before they crack the door!',
          expiresAt: now + 14000,
          durationSeconds: 14,
          lootAmount: potentialLoot,
        };
      }
    } else if (unlockedTables.length > 0 && roll < 0.60) {
      // VIP Whale
      const target = unlockedTables[Math.floor(Math.random() * unlockedTables.length)];
      updatedFloorEvent = {
        id: `vip-${now}`,
        type: 'vip',
        title: `👑 High-Roller Whale at ${target.name}!`,
        description: `A billionaire high-roller just sat down with huge chip stacks. Comp their bottle service for a +300% profit surge!`,
        expiresAt: now + 20000,
        durationSeconds: 20,
        targetTableId: target.id,
        tableTitle: target.name,
      };
    } else {
      // Snitch
      updatedFloorEvent = {
        id: `snitch-${now}`,
        type: 'snitch',
        title: '🕵️‍♂️ Undercover Police Informant Spotted!',
        description: 'A suspicious plainclothes detective is recording player bets! Interrogate them before they reach their squad car!',
        expiresAt: now + 20000,
        durationSeconds: 20,
      };
    }
  }

  // 6. Cleanup expired debuffs & buffs
  const cleanedPadlocks = { ...state.padlockedTables };
  for (const [id, padlock] of Object.entries(cleanedPadlocks)) {
    if (now >= padlock.until) delete cleanedPadlocks[id];
  }

  const cleanedDetained = { ...state.detainedStaff };
  for (const [id, detained] of Object.entries(cleanedDetained)) {
    if (now >= detained.until) delete cleanedDetained[id];
  }

  const cleanedBoosts = { ...state.activeTableBoosts };
  for (const [id, boost] of Object.entries(cleanedBoosts)) {
    if (now >= boost.until) delete cleanedBoosts[id];
  }

  // 7. Tournament Progression
  const updatedTournaments = { ...(state.tournaments || {}) };
  const wonTrophies = [...(state.wonTrophies || [])];
  for (const [tId, tourney] of Object.entries(updatedTournaments)) {
    if (tourney.status === 'running' && tourney.startedAt) {
      if (now >= tourney.startedAt + tourney.durationSeconds * 1000) {
        let winProb = tourney.winChance;
        if (tourney.sponsoredProId && state.sponsoredPros?.[tourney.sponsoredProId]) {
          winProb += state.sponsoredPros[tourney.sponsoredProId].winBonus;
        }
        if (state.equippedRelicIds && state.relics) {
          for (const rId of state.equippedRelicIds) {
            if (state.relics[rId]?.bonusType === 'tournamentBonus') {
              winProb += state.relics[rId].bonusValue;
            }
          }
        }

        const isWin = Math.random() < winProb;
        if (isWin) {
          const proCut = tourney.sponsoredProId && state.sponsoredPros?.[tourney.sponsoredProId]
            ? state.sponsoredPros[tourney.sponsoredProId].cutPercent / 100
            : 0;
          const userShare = Math.floor(tourney.firstPlacePrize * (1 - proCut));
          newCash += userShare;
          newChips += tourney.chipsReward;
          if (!wonTrophies.includes(tourney.trophy)) {
            wonTrophies.push(tourney.trophy);
          }
          eventNotice = `🏆 1ST PLACE! Won ${tourney.name}! Took home ${formatMoney(userShare)} cash, ${formatChips(tourney.chipsReward)} and the ${tourney.trophy}!`;
        } else {
          const consolation = Math.floor(tourney.firstPlacePrize * 0.15);
          newCash += consolation;
          eventNotice = `🥈 Final Table finish in ${tourney.name}! Took home ${formatMoney(consolation)} consolation prize.`;
        }

        updatedTournaments[tId] = {
          ...tourney,
          status: 'idle',
          startedAt: undefined,
          sponsoredProId: undefined,
        };
      }
    }
  }

  // 8. Sportsbook Match Settlement & Passive Vig
  let updatedMatches = state.sportsbookMatches ? [...state.sportsbookMatches] : [];
  let addedVig = 0;
  for (let i = 0; i < updatedMatches.length; i++) {
    const match = updatedMatches[i];
    if (match.status === 'open' && now >= match.endsAt) {
      let winner: 'A' | 'B' = match.oddsA < match.oddsB
        ? (Math.random() < 0.60 ? 'A' : 'B')
        : (Math.random() < 0.60 ? 'B' : 'A');

      if (match.fixedByMob && match.activeBet) {
        winner = match.activeBet.side;
      }

      if (match.activeBet) {
        if (match.activeBet.side === winner) {
          const payout = Math.floor(match.activeBet.amount * (winner === 'A' ? match.oddsA : match.oddsB));
          newCash += payout;
          eventNotice = `🥊 SPORTSBOOK WIN! ${winner === 'A' ? match.teamA : match.teamB} won ${match.eventTitle}! Paid out ${formatMoney(payout)}.`;
        } else {
          eventNotice = `💔 BET LOST: ${winner === 'A' ? match.teamA : match.teamB} won ${match.eventTitle}.`;
        }
      }

      const districtMult = state.districts?.[state.currentDistrictId]?.revenueMultiplier || 1.0;
      const matchVig = Math.floor((60 + Math.random() * 200) * districtMult);
      addedVig += matchVig;
      newCash += matchVig;

      updatedMatches[i] = generateNewSportsbookMatch(match.sport, now);
    }
  }

  // 9. Tactical Vault Heists Progression
  let newMobTokens = state.mobTokens;
  const updatedHeists = { ...(state.heistMissions || {}) };
  for (const [hId, heist] of Object.entries(updatedHeists)) {
    if (heist.status === 'in_progress' && heist.startedAt) {
      if (now >= heist.startedAt + (heist.durationSeconds * 1000)) {
        let successChance = (100 - heist.riskPercent) / 100;
        if (state.shadowCabinet?.['cabinet-interpol-director']?.bribed) {
          successChance += 0.25;
        }

        const isSuccess = Math.random() < successChance;
        if (isSuccess) {
          newCash += heist.cashReward;
          newMobTokens += heist.tokensReward;
          updatedHeists[hId] = {
            ...heist,
            status: 'cooldown',
            startedAt: undefined,
            cooldownUntil: now + 90000,
          };
          eventNotice = `🔫 HEIST SUCCESS! Your crew cracked ${heist.targetName}! Looted ${formatMoney(heist.cashReward)} and ${formatTokens(heist.tokensReward)}!`;
        } else {
          newHeat = Math.min(100, newHeat + heist.heatPenalty);
          updatedHeists[hId] = {
            ...heist,
            status: 'cooldown',
            startedAt: undefined,
            cooldownUntil: now + 120000,
          };
          eventNotice = `💥 HEIST BOTCHED! Alarms went off during the ${heist.targetName} operation! +${heist.heatPenalty}% Heat accumulated!`;
        }
      }
    } else if (heist.status === 'cooldown' && heist.cooldownUntil && now >= heist.cooldownUntil) {
      updatedHeists[hId] = {
        ...heist,
        status: 'ready',
        cooldownUntil: undefined,
      };
    }
  }

  // 10. Update Achievements (1 to 20)
  const updatedAchievements = { ...(state.achievements || {}) };
  if (state.stats.totalClicks >= 1 && updatedAchievements['ach-first-deal']) {
    updatedAchievements['ach-first-deal'].unlocked = true;
  }
  if ((newCash >= 100000 || state.stats.totalCashEarned >= 100000) && updatedAchievements['ach-hundred-grand']) {
    updatedAchievements['ach-hundred-grand'].unlocked = true;
  }
  if ((newCash >= 1000000 || state.stats.totalCashEarned >= 1000000) && updatedAchievements['ach-millionaire']) {
    updatedAchievements['ach-millionaire'].unlocked = true;
  }
  if ((newEquity >= 500 || state.stats.totalLaundered >= 500) && updatedAchievements['ach-clean-sheets']) {
    updatedAchievements['ach-clean-sheets'].unlocked = true;
  }
  if (wonTrophies.length >= 1 && updatedAchievements['ach-tourney-champ']) {
    updatedAchievements['ach-tourney-champ'].unlocked = true;
  }
  if (Object.values(state.sponsoredPros || {}).some(p => p.hired) && updatedAchievements['ach-pro-sponsor']) {
    updatedAchievements['ach-pro-sponsor'].unlocked = true;
  }
  if ((state.equippedRelicIds?.length || 0) >= 3 && updatedAchievements['ach-relic-collector']) {
    updatedAchievements['ach-relic-collector'].unlocked = true;
  }
  if (state.districts?.['vegas']?.unlocked && updatedAchievements['ach-vegas-strip']) {
    updatedAchievements['ach-vegas-strip'].unlocked = true;
  }
  if ((newCash >= 1000000000 || state.stats.totalCashEarned >= 1000000000) && updatedAchievements['ach-billionaire']) {
    updatedAchievements['ach-billionaire'].unlocked = true;
  }
  if ((newCash >= 1000000000000 || state.stats.totalCashEarned >= 1000000000000) && updatedAchievements['ach-trillionaire']) {
    updatedAchievements['ach-trillionaire'].unlocked = true;
  }
  if ((newEquity >= 50000 || state.stats.totalLaundered >= 50000) && updatedAchievements['ach-clean-mogul']) {
    updatedAchievements['ach-clean-mogul'].unlocked = true;
  }
  if (state.districts?.['london-mayfair']?.unlocked && updatedAchievements['ach-mayfair-club']) {
    updatedAchievements['ach-mayfair-club'].unlocked = true;
  }
  if (state.districts?.['sovereign-orbit']?.unlocked && updatedAchievements['ach-orbital-haven']) {
    updatedAchievements['ach-orbital-haven'].unlocked = true;
  }
  if (wonTrophies.includes('Platinum World Championship Bracelet') && updatedAchievements['ach-super-high-roller']) {
    updatedAchievements['ach-super-high-roller'].unlocked = true;
  }
  if (Object.values(state.sponsoredPros || {}).filter(p => p.hired).length >= 6 && updatedAchievements['ach-pro-stable']) {
    updatedAchievements['ach-pro-stable'].unlocked = true;
  }
  if ((state.equippedRelicIds?.length || 0) >= 5 && updatedAchievements['ach-relic-hoarder']) {
    updatedAchievements['ach-relic-hoarder'].unlocked = true;
  }
  if (state.stats.prestigeResets >= 1 && updatedAchievements['ach-first-reset']) {
    updatedAchievements['ach-first-reset'].unlocked = true;
  }
  if (Object.values(state.shadowCabinet || {}).some(o => o.bribed) && updatedAchievements['ach-shadow-cartel']) {
    updatedAchievements['ach-shadow-cartel'].unlocked = true;
  }

  const nextState: GameState = {
    ...state,
    cash: newCash,
    chips: newChips,
    equity: newEquity,
    heat: newHeat,
    mobTokens: newMobTokens,
    lastTickTime: Date.now(),
    activeFloorEvent: updatedFloorEvent,
    lastFloorEventCheckTime: lastEventCheck,
    padlockedTables: cleanedPadlocks,
    detainedStaff: cleanedDetained,
    activeTableBoosts: cleanedBoosts,
    tournaments: updatedTournaments,
    wonTrophies,
    sportsbookMatches: updatedMatches,
    totalVigCollected: (state.totalVigCollected || 0) + addedVig,
    achievements: updatedAchievements,
    heistMissions: updatedHeists,
    stats: {
      ...state.stats,
      totalCashEarned: state.stats.totalCashEarned + cashProduced,
      totalChipsEarned: state.stats.totalChipsEarned + chipsProduced,
      totalLaundered: state.stats.totalLaundered + cashLaundered,
      equityEarnedThisRun: (state.stats.equityEarnedThisRun || 0) + equityGained,
      totalEquityEarned: (state.stats.totalEquityEarned || 0) + equityGained,
      raidsAvoided,
      timePlayedSeconds: state.stats.timePlayedSeconds + deltaSeconds,
    },
  };

  return { nextState, event: eventNotice };
}

// ==========================================
// OFFLINE PROGRESS CALCULATOR
// ==========================================

export function calculateOfflineProgress(state: GameState, now = Date.now()): { nextState: GameState; summary?: OfflineProgressSummary } {
  const elapsedSeconds = Math.min(86400 * 3, Math.max(0, (now - state.lastTickTime) / 1000));
  if (elapsedSeconds < 10) {
    return { nextState: { ...state, lastTickTime: now } };
  }

  const rates = getTotalProductionRates(state);

  // Offline gives full passive cash, chips, and laundering without heat spikes
  const cashEarned = rates.cashPerSec * elapsedSeconds;
  const chipsEarned = rates.chipsPerSec * elapsedSeconds;

  let newCash = state.cash + cashEarned;
  let newEquity = state.equity;
  let totalLaundered = 0;

  if (rates.washCapacityPerSec > 0) {
    const maxWash = rates.washCapacityPerSec * elapsedSeconds;
    totalLaundered = Math.min(newCash, maxWash);
    newCash -= totalLaundered;
    newEquity += totalLaundered / 100;
  }

  const nextState: GameState = {
    ...state,
    cash: newCash,
    chips: state.chips + chipsEarned,
    equity: newEquity,
    heat: Math.max(0, state.heat - (rates.heatDropPerSec * elapsedSeconds)),
    lastTickTime: now,
    stats: {
      ...state.stats,
      totalCashEarned: state.stats.totalCashEarned + cashEarned,
      totalChipsEarned: state.stats.totalChipsEarned + chipsEarned,
      totalLaundered: state.stats.totalLaundered + totalLaundered,
      equityEarnedThisRun: (state.stats.equityEarnedThisRun || 0) + (totalLaundered / 100),
      totalEquityEarned: (state.stats.totalEquityEarned || 0) + (totalLaundered / 100),
      timePlayedSeconds: state.stats.timePlayedSeconds + elapsedSeconds,
    },
  };

  return {
    nextState,
    summary: {
      secondsOffline: elapsedSeconds,
      cashEarned,
      chipsEarned,
      equityLaundered: totalLaundered / 100,
    },
  };
}

// ==========================================
// BRIBE THE COMMISSIONER (RISK & REWARD)
// ==========================================

export function getBribeCost(state: GameState): number {
  return Math.max(2500, Math.floor(state.cash * 0.18));
}

export function attemptBribeCommissioner(state: GameState): { nextState: GameState; success: boolean; message: string } {
  const cost = getBribeCost(state);
  if (state.cash < cost) {
    return {
      nextState: state,
      success: false,
      message: `You need at least ${formatMoney(cost)} dirty cash to slide across the commissioner's desk.`,
    };
  }

  const newCash = state.cash - cost;
  const roll = Math.random();

  if (roll < 0.85) {
    // 85% Chance: Bribe Accepted!
    const newHeat = Math.max(0, state.heat - 35);
    return {
      nextState: {
        ...state,
        cash: newCash,
        heat: newHeat,
      },
      success: true,
      message: `🤝 Bribe Accepted! The commissioner pocketed the cash envelope and called off the squad cars (-35% Heat).`,
    };
  } else {
    // 15% Chance: Sting Operation!
    const now = Date.now();
    const durationMs = 15 * 60 * 1000; // 15 minutes

    const eligibleTables = Object.values(state.tables).filter(
      t => t.unlocked && t.level > 0 && (!state.padlockedTables[t.id] || state.padlockedTables[t.id].until < now)
    );
    const eligibleStaff = Object.values(state.staff).filter(
      s => s.hired && (!state.detainedStaff[s.id] || state.detainedStaff[s.id].until < now)
    );

    const updatedPadlocked = { ...state.padlockedTables };
    const updatedDetained = { ...state.detainedStaff };
    let outcomeMessage = '';

    const targetType = (eligibleTables.length > 0 && eligibleStaff.length > 0)
      ? (Math.random() > 0.5 ? 'table' : 'staff')
      : (eligibleTables.length > 0 ? 'table' : (eligibleStaff.length > 0 ? 'staff' : 'cash'));

    if (targetType === 'table' && eligibleTables.length > 0) {
      const chosenTable = eligibleTables[Math.floor(Math.random() * eligibleTables.length)];
      updatedPadlocked[chosenTable.id] = {
        tableId: chosenTable.id,
        until: now + durationMs,
        reason: 'Police Sting Padlock',
      };
      outcomeMessage = `🚨 STING OPERATION! The commissioner wore a hidden wire! Detectives padlocked ${chosenTable.name} for 15 minutes!`;
    } else if (targetType === 'staff' && eligibleStaff.length > 0) {
      const chosenStaff = eligibleStaff[Math.floor(Math.random() * eligibleStaff.length)];
      updatedDetained[chosenStaff.id] = {
        staffId: chosenStaff.id,
        until: now + durationMs,
        reason: 'Detained in Police Holding Cell',
      };
      outcomeMessage = `🚨 STING OPERATION! The commissioner wore a wire! ${chosenStaff.name} was arrested and detained in city jail for 15 minutes!`;
    } else {
      outcomeMessage = `🚨 STING OPERATION! Internal affairs caught the payoff and hit your casino with an extra \$5,000 legal citation!`;
    }

    return {
      nextState: {
        ...state,
        cash: Math.max(0, newCash - 5000),
        heat: Math.min(100, state.heat + 15),
        padlockedTables: updatedPadlocked,
        detainedStaff: updatedDetained,
      },
      success: false,
      message: outcomeMessage,
    };
  }
}

// ==========================================
// FLOOR SPOTTER EVENT ACTIONS
// ==========================================

export function resolveFloorEvent(
  state: GameState, 
  action: 'catch_snitch' | 'comp_vip' | 'repel_heist'
): { nextState: GameState; notice: string } {
  const event = state.activeFloorEvent;
  if (!event) return { nextState: state, notice: '' };

  const now = Date.now();
  let nextCash = state.cash;
  let nextChips = state.chips;
  let nextHeat = state.heat;
  let nextNotice = '';
  let updatedBoosts = { ...state.activeTableBoosts };

  if (action === 'catch_snitch') {
    const chipReward = Math.max(50, 40 * state.reputation);
    nextChips += chipReward;
    nextHeat = Math.max(0, nextHeat - 15);
    nextNotice = `🕵️‍♂️ Snitch Interrogated! You confiscated his audio wire and player logs (+${chipReward} Chips, -15% Heat)!`;
  } else if (action === 'comp_vip') {
    if (event.targetTableId && state.tables[event.targetTableId]) {
      updatedBoosts[event.targetTableId] = {
        tableId: event.targetTableId,
        multiplier: 3.0,
        until: now + (60 * 1000), // 60s of 3x profit!
        label: 'VIP Whale Spree (+300%)',
      };
      nextNotice = `👑 VIP Whale Comped! Crystal champagne poured at ${state.tables[event.targetTableId].name} (+300% profit for 60s)!`;
    }
  } else if (action === 'repel_heist') {
    const loot = event.lootAmount || 15000;
    nextCash += loot;
    nextNotice = `🛡️ Vault Heist Repelled! Syndicate enforcers ambushed the drilling gang and confiscated ${formatMoney(loot)} in loot!`;
  }

  return {
    nextState: {
      ...state,
      cash: nextCash,
      chips: nextChips,
      heat: nextHeat,
      activeTableBoosts: updatedBoosts,
      activeFloorEvent: null,
    },
    notice: nextNotice,
  };
}

// Early Bail Out with Clean Equity
export function bailOutTable(state: GameState, tableId: string): GameState {
  const cost = 10; // 10 Clean Equity
  if (state.equity < cost || !state.padlockedTables[tableId]) return state;
  const updated = { ...state.padlockedTables };
  delete updated[tableId];
  return {
    ...state,
    equity: state.equity - cost,
    padlockedTables: updated,
  };
}

export function bailOutStaff(state: GameState, staffId: string): GameState {
  const cost = 15; // 15 Clean Equity
  if (state.equity < cost || !state.detainedStaff[staffId]) return state;
  const updated = { ...state.detainedStaff };
  delete updated[staffId];
  return {
    ...state,
    equity: state.equity - cost,
    detainedStaff: updated,
  };
}

// ==========================================
// TOURNAMENTS & SPONSORED PROS
// ==========================================

export function startTournament(
  state: GameState, 
  tournamentId: string, 
  sponsoredProId?: string
): { nextState: GameState; error?: string } {
  const tourney = state.tournaments[tournamentId];
  if (!tourney) return { nextState: state, error: 'Tournament not found.' };
  if (tourney.status === 'running') return { nextState: state, error: 'Tournament is already in play!' };

  if (state.cash < tourney.buyIn) {
    return { nextState: state, error: `Insufficient dirty cash for buy-in (${formatMoney(tourney.buyIn)} required).` };
  }
  if (state.chips < tourney.chipsEntry) {
    return { nextState: state, error: `Insufficient casino chips for entry fee (${formatChips(tourney.chipsEntry)} required).` };
  }

  const updatedTournaments = {
    ...state.tournaments,
    [tournamentId]: {
      ...tourney,
      status: 'running' as const,
      startedAt: Date.now(),
      sponsoredProId: sponsoredProId || null,
    },
  };

  return {
    nextState: {
      ...state,
      cash: state.cash - tourney.buyIn,
      chips: state.chips - tourney.chipsEntry,
      tournaments: updatedTournaments,
    },
  };
}

export function hireSponsoredPro(state: GameState, proId: string): GameState {
  const pro = state.sponsoredPros[proId];
  if (!pro || pro.hired) return state;
  if (state.cash < pro.salary) return state;

  return {
    ...state,
    cash: state.cash - pro.salary,
    sponsoredPros: {
      ...state.sponsoredPros,
      [proId]: {
        ...pro,
        hired: true,
      },
    },
  };
}

// ==========================================
// SPORTSBOOK LIVE BETTING
// ==========================================

const SPORTS_TEAMS = {
  Boxing: [
    ['"Sugar" Ray Vance', 'Viktor "The Siberian" Drago'],
    ['Cassius King', 'Manny "El Matador" Ortiz'],
    ['Arturo "Thunder" Gatti', 'Floyd "Pretty Boy" Sterling'],
  ],
  'Horse Racing': [
    ['Silver Bullet (No. 2)', 'Thunderclap (No. 5)'],
    ['Secretariat Redux (No. 1)', 'Ghost Runner (No. 8)'],
    ['Vegas Jackpot (No. 3)', 'Iron Stallion (No. 6)'],
  ],
  Football: [
    ['Milan Rossoneri', 'Turin Zebras'],
    ['Manchester Red Devils', 'Liverpool Seasiders'],
    ['Barcelona Blaugrana', 'Madrid Galacticos'],
  ],
};

export function generateNewSportsbookMatch(
  sport: 'Boxing' | 'Horse Racing' | 'Football', 
  now = Date.now()
): SportsbookMatch {
  const teamPairs = SPORTS_TEAMS[sport];
  const pair = teamPairs[Math.floor(Math.random() * teamPairs.length)];
  const oddsA = +(1.40 + Math.random() * 1.50).toFixed(2);
  const oddsB = +(1.40 + Math.random() * 1.50).toFixed(2);
  const durationSec = 45 + Math.floor(Math.random() * 75);

  return {
    id: `match-${sport.toLowerCase().replace(' ', '-')}-${now}-${Math.floor(Math.random() * 1000)}`,
    sport,
    eventTitle: `${sport} Championship Bout`,
    teamA: pair[0],
    teamB: pair[1],
    oddsA,
    oddsB,
    status: 'open',
    endsAt: now + (durationSec * 1000),
  };
}

export function placeSportsbookBet(
  state: GameState, 
  matchId: string, 
  side: 'A' | 'B', 
  amount: number
): GameState {
  if (state.cash < amount || amount <= 0) return state;

  const matches = state.sportsbookMatches.map(m => {
    if (m.id === matchId && m.status === 'open' && !m.activeBet) {
      return {
        ...m,
        activeBet: { side, amount },
      };
    }
    return m;
  });

  return {
    ...state,
    cash: state.cash - amount,
    sportsbookMatches: matches,
  };
}

export function fixSportsbookMatch(
  state: GameState, 
  matchId: string
): { nextState: GameState; notice: string } {
  const match = state.sportsbookMatches.find(m => m.id === matchId);
  if (!match || match.status !== 'open') return { nextState: state, notice: 'Match is closed.' };

  const fixCost = 5000;
  if (state.cash < fixCost) return { nextState: state, notice: 'Need at least $5,000 dirty cash to grease referees!' };

  const updatedMatches = state.sportsbookMatches.map(m => {
    if (m.id === matchId) {
      return { ...m, fixedByMob: true };
    }
    return m;
  });

  return {
    nextState: {
      ...state,
      cash: state.cash - fixCost,
      heat: Math.min(100, state.heat + 15),
      sportsbookMatches: updatedMatches,
    },
    notice: `🕵️ MATCH FIXED! Referees and jockeys paid off for ${match.eventTitle} (+15% Heat)!`,
  };
}

// ==========================================
// VINTAGE DECKS & RELICS
// ==========================================

export function purchaseRelic(state: GameState, relicId: string): GameState {
  const relic = state.relics[relicId];
  if (!relic || relic.unlocked) return state;
  if (state.chips < relic.costChips) return state;

  return {
    ...state,
    chips: state.chips - relic.costChips,
    relics: {
      ...state.relics,
      [relicId]: {
        ...relic,
        unlocked: true,
      },
    },
  };
}

export function toggleEquipRelic(state: GameState, relicId: string): GameState {
  const relic = state.relics[relicId];
  if (!relic || !relic.unlocked) return state;

  let currentEquipped = [...state.equippedRelicIds];
  if (currentEquipped.includes(relicId)) {
    // Unequip
    currentEquipped = currentEquipped.filter(id => id !== relicId);
  } else {
    // Equip (max 3)
    if (currentEquipped.length >= 3) {
      currentEquipped.shift(); // remove oldest
    }
    currentEquipped.push(relicId);
  }

  return {
    ...state,
    equippedRelicIds: currentEquipped,
  };
}

// ==========================================
// TERRITORY DISTRICTS
// ==========================================

export function unlockDistrict(state: GameState, districtId: string): GameState {
  const district = state.districts[districtId];
  if (!district || district.unlocked) return state;
  if (state.cash < district.unlockCostCash || state.equity < district.unlockCostEquity) return state;

  return {
    ...state,
    cash: state.cash - district.unlockCostCash,
    equity: state.equity - district.unlockCostEquity,
    currentDistrictId: districtId,
    districts: {
      ...state.districts,
      [districtId]: {
        ...district,
        unlocked: true,
      },
    },
  };
}

export function travelToDistrict(state: GameState, districtId: string): GameState {
  const district = state.districts[districtId];
  if (!district || !district.unlocked) return state;

  return {
    ...state,
    currentDistrictId: districtId,
  };
}

// ==========================================
// ACHIEVEMENTS
// ==========================================

export function claimAchievement(state: GameState, achievementId: string): GameState {
  const ach = state.achievements[achievementId];
  if (!ach || !ach.unlocked || ach.claimed) return state;

  return {
    ...state,
    mobTokens: state.mobTokens + ach.rewardTokens,
    achievements: {
      ...state.achievements,
      [achievementId]: {
        ...ach,
        claimed: true,
      },
    },
  };
}

// ==========================================
// POST-RESET SYSTEM 1: LUCKY SYNDICATE WHEEL
// ==========================================

export function canSpinLuckyWheel(state: GameState): boolean {
  const now = Date.now();
  const cooldownMs = 10 * 60 * 1000; // 10 minutes free spin
  return !state.lastWheelSpinTime || (now - state.lastWheelSpinTime >= cooldownMs);
}

export function spinLuckyWheel(
  state: GameState, 
  payWithTokens = false
): { nextState: GameState; reward: WheelReward; error?: string } {
  const freeReady = canSpinLuckyWheel(state);
  if (!freeReady && !payWithTokens) {
    return { 
      nextState: state, 
      reward: LUCKY_WHEEL_WEDGES[0], 
      error: 'Free spin is on cooldown! You can spend 2 Syndicate Tokens to spin instantly.' 
    };
  }

  if (payWithTokens && !freeReady) {
    if (state.mobTokens < 2) {
      return { 
        nextState: state, 
        reward: LUCKY_WHEEL_WEDGES[0], 
        error: 'You need 2 Syndicate Tokens to spin off-cooldown.' 
      };
    }
  }

  // Random wedge
  const index = Math.floor(Math.random() * LUCKY_WHEEL_WEDGES.length);
  const reward = LUCKY_WHEEL_WEDGES[index];

  let nextCash = state.cash;
  let nextChips = state.chips;
  let nextEquity = state.equity;
  let nextTokens = state.mobTokens;

  if (payWithTokens && !freeReady) {
    nextTokens -= 2;
  }

  if (reward.id === 'wheel-jackpot') {
    nextTokens += 50;
    nextCash += 250000000;
  } else if (reward.type === 'cash') {
    nextCash += reward.value;
  } else if (reward.type === 'chips') {
    nextChips += reward.value;
  } else if (reward.type === 'equity') {
    nextEquity += reward.value;
  } else if (reward.type === 'tokens') {
    nextTokens += reward.value;
  }

  const nextState: GameState = {
    ...state,
    cash: nextCash,
    chips: nextChips,
    equity: nextEquity,
    mobTokens: nextTokens,
    lastWheelSpinTime: Date.now(),
    stats: {
      ...state.stats,
      equityEarnedThisRun: (state.stats.equityEarnedThisRun || 0) + (reward.type === 'equity' ? reward.value : 0),
      totalEquityEarned: (state.stats.totalEquityEarned || 0) + (reward.type === 'equity' ? reward.value : 0),
    },
  };

  return { nextState, reward };
}

// ==========================================
// POST-RESET SYSTEM 1: BLACK MARKET CONTRACTS
// ==========================================

export function buyBlackMarketContract(
  state: GameState, 
  contractId: string
): { nextState: GameState; error?: string } {
  const contract = state.blackMarketContracts?.[contractId];
  if (!contract) return { nextState: state, error: 'Contract not found.' };
  if (contract.unlocked) return { nextState: state, error: 'Contract is already active!' };

  if (state.mobTokens < contract.costTokens) {
    return { nextState: state, error: `Requires ${contract.costTokens} Syndicate Tokens.` };
  }
  if (state.equity < contract.costEquity) {
    return { nextState: state, error: `Requires ${formatEquity(contract.costEquity)} Clean Equity.` };
  }

  return {
    nextState: {
      ...state,
      mobTokens: state.mobTokens - contract.costTokens,
      equity: state.equity - contract.costEquity,
      blackMarketContracts: {
        ...state.blackMarketContracts,
        [contractId]: {
          ...contract,
          unlocked: true,
        },
      },
    },
  };
}

// ==========================================
// POST-RESET SYSTEM 2: TACTICAL VAULT HEISTS
// ==========================================

export function startHeistMission(
  state: GameState, 
  heistId: string
): { nextState: GameState; error?: string } {
  const heist = state.heistMissions?.[heistId];
  if (!heist) return { nextState: state, error: 'Heist target not found.' };
  if (heist.status === 'in_progress') return { nextState: state, error: 'Heist crew is already in the field!' };
  if (heist.status === 'cooldown') return { nextState: state, error: 'Target security is on high alert (Cooldown active).' };

  return {
    nextState: {
      ...state,
      heistMissions: {
        ...state.heistMissions,
        [heistId]: {
          ...heist,
          status: 'in_progress',
          startedAt: Date.now(),
        },
      },
    },
  };
}

// ==========================================
// POST-RESET SYSTEM 3: THE SHADOW CARTEL CABINET
// ==========================================

export function bribeShadowOfficial(
  state: GameState, 
  officialId: string
): { nextState: GameState; error?: string } {
  const official = state.shadowCabinet?.[officialId];
  if (!official) return { nextState: state, error: 'Official appointment not found.' };
  if (official.bribed) return { nextState: state, error: 'Official is already on permanent retainer.' };

  if (state.equity < official.costEquity) {
    return { nextState: state, error: `Requires ${formatEquity(official.costEquity)} Clean Equity retainer.` };
  }

  return {
    nextState: {
      ...state,
      equity: state.equity - official.costEquity,
      shadowCabinet: {
        ...state.shadowCabinet,
        [officialId]: {
          ...official,
          bribed: true,
        },
      },
    },
  };
}


