'use client';

import React, { useState } from 'react';
import { 
  Droplets, 
  RotateCw, 
  Music, 
  Building2, 
  Lock, 
  ArrowUpCircle,
  Flame,
  ShieldCheck,
  TrendingDown,
  Zap
} from 'lucide-react';
import { GameState, FrontBusiness } from '@/game/types';
import { 
  formatMoney, 
  formatEquity, 
  getBusinessUpgradeCost, 
  getBatchBusinessUpgradeCost,
  getMaxAffordableBusinessUpgrades,
  getTotalProductionRates 
} from '@/game/engine';
import { playSound } from '@/game/sound';
import TileArtwork from './TileArtwork';

interface Props {
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
}

type BuyMultiplier = 1 | 10 | 25 | 100 | 'max';
const BUY_MULTIPLIERS: BuyMultiplier[] = [1, 10, 25, 100, 'max'];

const BIZ_ICONS: Record<string, React.ElementType> = {
  Droplets,
  RotateCw,
  Music,
  Building2,
};

export default function LaundromatTab({ state, onStateUpdate }: Props) {
  const [buyMultiplier, setBuyMultiplier] = useState<BuyMultiplier>(1);
  const rates = getTotalProductionRates(state);

  const handleUpgradeBiz = (bizId: string, count: number, cost: number) => {
    const biz = state.businesses[bizId];
    if (!biz || count <= 0) return;
    if (state.cash < cost) return;

    if (count > 1) {
      playSound.levelUp(state.settings.soundEnabled);
    } else {
      playSound.cash(state.settings.soundEnabled);
    }

    const nextState: GameState = {
      ...state,
      cash: state.cash - cost,
      businesses: {
        ...state.businesses,
        [bizId]: {
          ...biz,
          level: biz.level + count,
        },
      },
    };

    onStateUpdate(nextState);
  };

  const handleUnlockBiz = (bizId: string) => {
    const biz = state.businesses[bizId];
    if (!biz || biz.unlocked) return;

    if (state.cash < biz.unlockCost) return;

    playSound.levelUp(state.settings.soundEnabled);

    const nextState: GameState = {
      ...state,
      cash: state.cash - biz.unlockCost,
      businesses: {
        ...state.businesses,
        [bizId]: {
          ...biz,
          unlocked: true,
          level: 1,
        },
      },
    };

    onStateUpdate(nextState);
  };

  const bizList = Object.values(state.businesses);

  return (
    <div className="space-y-4">
      {/* Laundromat Header Banner */}
      <div className="glass-panel-emerald rounded-2xl p-4 sm:p-5 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            Corporate Shell Operations
          </span>
          <h2 className="text-lg font-black text-white mt-1">
            Money Laundering & Heat Suppression
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl mt-0.5">
            Front businesses quietly siphon dirty cash from your casino tables and convert it into <strong>Clean Corporate Equity (💎)</strong>. Clean Equity is required to execute <strong>Strip Buyouts (Prestige Resets)</strong> and unlock permanent syndicate features!
          </p>
        </div>

        <div className="flex items-center gap-4 bg-black/60 px-4 py-2.5 rounded-xl border border-white/10 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Total Wash Capacity</span>
            <span className="text-sm sm:text-base font-black text-cyan-400 font-mono">
              {formatMoney(rates.washCapacityPerSec)}/s
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Heat Cooling</span>
            <span className="text-sm sm:text-base font-black text-emerald-400 font-mono flex items-center gap-0.5">
              <TrendingDown size={14} />
              -{rates.heatDropPerSec.toFixed(2)}/s
            </span>
          </div>
        </div>
      </div>

      {/* Multiplier Selector Bar */}
      <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-charcoal-dark/70 border border-white/10 backdrop-blur-md">
        <span className="text-xs font-bold text-zinc-300">
          Front Expansion Operations
        </span>
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-1.5 flex items-center gap-1">
            <Zap size={12} className="text-cyan-400" />
            Buy:
          </span>
          {BUY_MULTIPLIERS.map((mult) => (
            <button
              key={mult}
              onClick={() => setBuyMultiplier(mult)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                buyMultiplier === mult
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)] scale-105'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {mult === 'max' ? 'MAX' : `${mult}x`}
            </button>
          ))}
        </div>
      </div>

      {/* Front Businesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {bizList.map((biz) => {
          const Icon = BIZ_ICONS[biz.iconName] || Building2;
          
          const upgradeInfo = buyMultiplier === 'max'
            ? getMaxAffordableBusinessUpgrades(biz.baseCost, biz.costMultiplier, biz.level, state.cash)
            : {
                count: buyMultiplier,
                cost: getBatchBusinessUpgradeCost(biz.baseCost, biz.costMultiplier, biz.level, buyMultiplier),
              };

          const canAffordUpgrade = state.cash >= upgradeInfo.cost && upgradeInfo.count > 0;
          const canAffordUnlock = state.cash >= biz.unlockCost;

          if (!biz.unlocked) {
            return (
              <div
                key={biz.id}
                className="glass-panel rounded-2xl p-4 border-dashed border-white/15 flex flex-col justify-between group hover:border-cyan-500/40 transition-colors"
              >
                <div>
                  <TileArtwork 
                    id={biz.id} 
                    type="business" 
                    name={biz.name} 
                    isLocked={true}
                    className="w-full h-24 rounded-xl overflow-hidden mb-3 border border-white/10 group"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {biz.type}
                    </span>
                    <Lock size={16} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-300 group-hover:text-white transition-colors">
                    {biz.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {biz.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Acquisition Cost</span>
                    <span className="text-sm font-black font-mono text-cyan-300">
                      {formatMoney(biz.unlockCost)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleUnlockBiz(biz.id)}
                    disabled={!canAffordUnlock}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      canAffordUnlock
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    Acquire Front
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={biz.id}
              className="glass-panel rounded-2xl p-4 border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <TileArtwork 
                  id={biz.id} 
                  type="business" 
                  name={biz.name} 
                  className="w-full h-24 rounded-xl overflow-hidden mb-3 border border-white/10 group" 
                />
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${biz.accentColor} text-white shadow-[0_0_10px_rgba(6,182,212,0.2)]`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm sm:text-base font-black text-white">
                          {biz.name}
                        </h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                          LVL {biz.level}
                        </span>
                        {upgradeInfo.count > 1 && canAffordUpgrade && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono animate-in fade-in duration-200">
                            +{upgradeInfo.count} → LVL {biz.level + upgradeInfo.count}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                        {biz.type}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs sm:text-sm font-black text-cyan-400 font-mono">
                      Washes {formatMoney(biz.washRate * biz.level)}/s
                    </span>
                    <span className="block text-[10px] text-emerald-400 font-mono">
                      -{ (biz.heatSuppression * biz.level).toFixed(2) }/s Heat
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mt-1">
                  {biz.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    {upgradeInfo.count > 1 ? `Cost (+${upgradeInfo.count} Lvl)` : 'Expansion Cost'}
                  </span>
                  <span className={`text-sm font-black font-mono ${canAffordUpgrade ? 'text-white' : 'text-zinc-500'}`}>
                    {formatMoney(upgradeInfo.cost)}
                  </span>
                </div>

                <button
                  onClick={() => handleUpgradeBiz(biz.id, upgradeInfo.count, upgradeInfo.cost)}
                  disabled={!canAffordUpgrade}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    canAffordUpgrade
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <ArrowUpCircle size={14} />
                  {buyMultiplier === 'max'
                    ? `Max (+${upgradeInfo.count})`
                    : upgradeInfo.count > 1
                    ? `+${upgradeInfo.count} Levels`
                    : 'Expand'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
