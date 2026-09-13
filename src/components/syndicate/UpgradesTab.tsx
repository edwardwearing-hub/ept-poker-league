'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  Coffee, 
  Wrench, 
  Landmark 
} from 'lucide-react';
import { GameState, CasinoUpgrade } from '@/game/types';
import { formatMoney, formatChips, formatEquity } from '@/game/engine';
import { playSound } from '@/game/sound';

interface Props {
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Equipment: Wrench,
  Hospitality: Coffee,
  Security: ShieldAlert,
  Underworld: Landmark,
};

export default function UpgradesTab({ state, onStateUpdate }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Equipment', 'Hospitality', 'Security', 'Underworld'];

  const handleBuyUpgrade = (upgradeId: string) => {
    const upgrade = state.upgrades[upgradeId];
    if (!upgrade || upgrade.purchased) return;

    let canAfford = false;
    let nextCash = state.cash;
    let nextChips = state.chips;
    let nextEquity = state.equity;

    if (upgrade.costType === 'cash' && state.cash >= upgrade.cost) {
      nextCash -= upgrade.cost;
      canAfford = true;
    } else if (upgrade.costType === 'chips' && state.chips >= upgrade.cost) {
      nextChips -= upgrade.cost;
      canAfford = true;
    } else if (upgrade.costType === 'equity' && state.equity >= upgrade.cost) {
      nextEquity -= upgrade.cost;
      canAfford = true;
    }

    if (!canAfford) return;

    playSound.levelUp(state.settings.soundEnabled);

    const nextState: GameState = {
      ...state,
      cash: nextCash,
      chips: nextChips,
      equity: nextEquity,
      upgrades: {
        ...state.upgrades,
        [upgradeId]: {
          ...upgrade,
          purchased: true,
        },
      },
    };

    onStateUpdate(nextState);
  };

  const upgradeList = Object.values(state.upgrades).filter((u) => {
    if (selectedCategory === 'All') return true;
    return u.category === selectedCategory;
  });

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Upgrades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {upgradeList.map((upgrade) => {
          const Icon = CATEGORY_ICONS[upgrade.category] || Zap;
          let canAfford = false;
          let costDisplay = '';

          if (upgrade.costType === 'cash') {
            canAfford = state.cash >= upgrade.cost;
            costDisplay = formatMoney(upgrade.cost);
          } else if (upgrade.costType === 'chips') {
            canAfford = state.chips >= upgrade.cost;
            costDisplay = formatChips(upgrade.cost);
          } else if (upgrade.costType === 'equity') {
            canAfford = state.equity >= upgrade.cost;
            costDisplay = formatEquity(upgrade.cost);
          }

          return (
            <div
              key={upgrade.id}
              className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 ${
                upgrade.purchased
                  ? 'glass-panel-emerald border border-emerald-500/30'
                  : 'glass-panel border-white/10 hover:border-gold/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-gold">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">
                        {upgrade.name}
                      </h3>
                      <span className="text-[10px] uppercase font-bold text-zinc-400">
                        {upgrade.category}
                      </span>
                    </div>
                  </div>

                  {upgrade.purchased && (
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Check size={14} />
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 mt-1">
                  {upgrade.description}
                </p>

                <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-[11px] font-bold text-amber-300">
                  {upgrade.effectLabel}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-black font-mono text-gold-glow">
                  {upgrade.purchased ? 'Active' : costDisplay}
                </span>

                {!upgrade.purchased && (
                  <button
                    onClick={() => handleBuyUpgrade(upgrade.id)}
                    disabled={!canAfford}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-600 via-gold to-yellow-600 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    Purchase
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
