'use client';

import React, { useState } from 'react';
import { 
  Dices, 
  Gamepad2, 
  Layers, 
  CircleDot, 
  Crown, 
  Gem, 
  Sparkles, 
  Lock, 
  ArrowUpCircle,
  Flame,
  Filter,
  Zap
} from 'lucide-react';
import { GameState, GameTable } from '@/game/types';
import { 
  formatMoney, 
  formatChips, 
  getTableUpgradeCost, 
  getBatchTableUpgradeCost,
  getMaxAffordableTableUpgrades,
  getTableRates,
  bailOutTable 
} from '@/game/engine';
import { playSound } from '@/game/sound';
import TableChipStack from './TableChipStack';
import TileArtwork from './TileArtwork';

interface Props {
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
}

type BuyMultiplier = 1 | 10 | 25 | 100 | 'max';
const BUY_MULTIPLIERS: BuyMultiplier[] = [1, 10, 25, 100, 'max'];

const ICON_MAP: Record<string, React.ElementType> = {
  Dices,
  Gamepad2,
  Layers,
  CircleDot,
  Crown,
  Gem,
  Sparkles,
};

export default function FloorManagement({ state, onStateUpdate }: Props) {
  const [selectedFloor, setSelectedFloor] = useState<string>('All');
  const [buyMultiplier, setBuyMultiplier] = useState<BuyMultiplier>(1);

  const floors = ['All', 'Underground', 'Speakeasy', 'Casino Floor', 'VIP Penthouse'];

  const handleUpgradeTable = (tableId: string, count: number, cost: number) => {
    const table = state.tables[tableId];
    if (!table || count <= 0) return;
    if (state.cash < cost) return;

    if (count > 1) {
      playSound.levelUp(state.settings.soundEnabled);
    } else {
      playSound.cash(state.settings.soundEnabled);
    }

    const nextState: GameState = {
      ...state,
      cash: state.cash - cost,
      tables: {
        ...state.tables,
        [tableId]: {
          ...table,
          level: table.level + count,
        },
      },
    };

    onStateUpdate(nextState);
  };

  const handleUnlockTable = (tableId: string) => {
    const table = state.tables[tableId];
    if (!table || table.unlocked) return;

    if (state.cash < table.unlockCost) return;

    playSound.levelUp(state.settings.soundEnabled);

    const nextState: GameState = {
      ...state,
      cash: state.cash - table.unlockCost,
      tables: {
        ...state.tables,
        [tableId]: {
          ...table,
          unlocked: true,
          level: 1, // Instantly unlocks at level 1
        },
      },
    };

    onStateUpdate(nextState);
  };

  const tableList = Object.values(state.tables).filter((t) => {
    if (selectedFloor === 'All') return true;
    return t.category === selectedFloor;
  });

  return (
    <div className="space-y-4">
      
      {/* Floor Filter Tabs & Buy Multiplier Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-charcoal-dark/70 border border-white/10 backdrop-blur-md">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
                selectedFloor === floor
                  ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] font-black'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {floor}
            </button>
          ))}
        </div>

        {/* Buy Multiplier Selector */}
        <div className="flex items-center justify-end gap-1 bg-black/50 p-1 rounded-xl border border-white/10 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-1.5 flex items-center gap-1">
            <Zap size={12} className="text-gold" />
            Buy:
          </span>
          {BUY_MULTIPLIERS.map((mult) => (
            <button
              key={mult}
              onClick={() => setBuyMultiplier(mult)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                buyMultiplier === mult
                  ? 'bg-gradient-to-r from-amber-500 via-gold to-yellow-400 text-black shadow-[0_0_12px_rgba(212,175,55,0.5)] scale-105'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {mult === 'max' ? 'MAX' : `${mult}x`}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {tableList.map((table) => {
          const Icon = ICON_MAP[table.iconName] || Dices;
          const [cashRate, chipRate, heatRate] = getTableRates(table.id, state);
          
          const upgradeInfo = buyMultiplier === 'max'
            ? getMaxAffordableTableUpgrades(table.baseCost, table.costMultiplier, table.level, state.cash)
            : {
                count: buyMultiplier,
                cost: getBatchTableUpgradeCost(table.baseCost, table.costMultiplier, table.level, buyMultiplier),
              };

          const canAffordUpgrade = state.cash >= upgradeInfo.cost && upgradeInfo.count > 0;
          const canAffordUnlock = state.cash >= table.unlockCost;

          // Next milestone (25, 50, 100, 200, 500)
          const milestones = [10, 25, 50, 100, 200, 500];
          const nextMilestone = milestones.find((m) => m > table.level) || table.level + 50;
          const prevMilestone = [...milestones].reverse().find((m) => m <= table.level) || 0;
          const progressPercent = Math.min(100, Math.max(0, ((table.level - prevMilestone) / (nextMilestone - prevMilestone)) * 100));

          if (!table.unlocked) {
            return (
              <div
                key={table.id}
                className="glass-panel rounded-2xl p-4 border-dashed border-white/15 flex flex-col justify-between relative overflow-hidden group hover:border-gold/40 transition-colors"
              >
                <div>
                  <TileArtwork 
                    id={table.id} 
                    type="table" 
                    fallbackImage={table.image} 
                    name={table.name} 
                    isLocked={true}
                    className="w-full h-24 rounded-xl overflow-hidden mb-3 border border-white/10 group"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {table.category}
                    </span>
                    <Lock size={16} className="text-zinc-500 group-hover:text-gold transition-colors" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-300 group-hover:text-white transition-colors">
                    {table.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                    {table.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Unlock License</span>
                    <span className="text-sm font-black font-mono text-gold-glow">
                      {formatMoney(table.unlockCost)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleUnlockTable(table.id)}
                    disabled={!canAffordUnlock}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      canAffordUnlock
                        ? 'bg-gradient-to-r from-amber-600 via-gold to-yellow-600 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    Unlock Table
                  </button>
                </div>
              </div>
            );
          }

          const now = Date.now();
          const isPadlocked = Boolean(state.padlockedTables?.[table.id] && now < state.padlockedTables[table.id].until);
          const padlockedSeconds = isPadlocked ? Math.max(0, Math.ceil((state.padlockedTables[table.id].until - now) / 1000)) : 0;

          const activeBoost = state.activeTableBoosts?.[table.id] && now < state.activeTableBoosts[table.id].until ? state.activeTableBoosts[table.id] : null;
          const boostSeconds = activeBoost ? Math.max(0, Math.ceil((activeBoost.until - now) / 1000)) : 0;

          return (
            <div
              key={table.id}
              className={`rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                isPadlocked 
                  ? 'bg-amber-950/40 border-2 border-dashed border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                  : activeBoost 
                  ? 'glass-panel-gold border-2 border-gold shadow-[0_0_25px_rgba(212,175,55,0.4)] animate-pulse-slow' 
                  : 'glass-panel border-white/10 hover:border-gold/30'
              }`}
            >
              {/* Padlock Sting Warning Overlay */}
              {isPadlocked && (
                <div className="mb-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                        PADLOCKED BY POLICE STING
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {Math.floor(padlockedSeconds / 60)}m {padlockedSeconds % 60}s remaining
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onStateUpdate(bailOutTable(state, table.id))}
                    disabled={state.equity < 10}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer shrink-0"
                  >
                    Bail (10 💎)
                  </button>
                </div>
              )}

              {/* VIP Whale Profit Surge Banner */}
              {activeBoost && (
                <div className="mb-3 p-2 rounded-xl bg-gold/20 border border-gold/60 flex items-center justify-between gap-2 animate-pulse">
                  <div className="flex items-center gap-1.5">
                    <Crown size={15} className="text-gold-glow" />
                    <span className="text-[11px] font-black uppercase text-gold-glow">
                      VIP Whale Spree (+300%)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {boostSeconds}s left
                  </span>
                </div>
              )}

              {/* Header Info */}
              <div>
                <TileArtwork 
                  id={table.id} 
                  type="table" 
                  fallbackImage={table.image} 
                  name={table.name} 
                  className="w-full h-24 rounded-xl overflow-hidden mb-3 border border-white/10 group" 
                />

                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${table.accentColor} text-white shadow-[0_0_10px_rgba(212,175,55,0.2)]`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm sm:text-base font-black text-white">
                          {table.name}
                        </h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">
                          LVL {table.level}
                        </span>
                        {upgradeInfo.count > 1 && canAffordUpgrade && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono animate-in fade-in duration-200">
                            +{upgradeInfo.count} → LVL {table.level + upgradeInfo.count}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                        {table.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs sm:text-sm font-black text-emerald-400 font-mono">
                      +{formatMoney(cashRate)}/s
                    </span>
                    <span className="block text-[10px] text-amber-300 font-mono">
                      +{formatChips(chipRate)}/s
                    </span>
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono mb-1">
                    <span>Milestone: {table.level}/{nextMilestone}</span>
                    <span className="flex items-center gap-0.5 text-orange-400 font-bold">
                      <Flame size={10} />
                      +{heatRate.toFixed(1)}/s heat
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-yellow-400 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* 3D Casino Chip Stack Money-Maker Animation */}
                <TableChipStack
                  tableId={table.id}
                  category={table.category}
                  cashRate={cashRate}
                  level={table.level}
                  unlocked={table.unlocked}
                />
              </div>

              {/* Action Bar */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    {upgradeInfo.count > 1 ? `Cost (+${upgradeInfo.count} Lvl)` : 'Upgrade Cost'}
                  </span>
                  <span className={`text-sm font-black font-mono ${canAffordUpgrade ? 'text-white' : 'text-zinc-500'}`}>
                    {formatMoney(upgradeInfo.cost)}
                  </span>
                </div>

                <button
                  onClick={() => handleUpgradeTable(table.id, upgradeInfo.count, upgradeInfo.cost)}
                  disabled={!canAffordUpgrade}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    canAffordUpgrade
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <ArrowUpCircle size={14} />
                  {buyMultiplier === 'max'
                    ? `Max (+${upgradeInfo.count})`
                    : upgradeInfo.count > 1
                    ? `+${upgradeInfo.count} Levels`
                    : 'Level Up'}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
