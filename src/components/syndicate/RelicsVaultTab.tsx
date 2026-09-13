'use client';

import React from 'react';
import { 
  Sparkles, 
  Layers, 
  Dices, 
  ShieldCheck, 
  BookOpen, 
  Crown, 
  Lock, 
  CheckCircle2, 
  XCircle,
  Gem,
  ArrowUpRight
} from 'lucide-react';
import { GameState, Relic } from '@/game/types';
import { formatChips, purchaseRelic, toggleEquipRelic } from '@/game/engine';
import { playSound } from '@/game/sound';
import TileArtwork from './TileArtwork';

interface Props {
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
}

const RELIC_ICONS: Record<string, React.ElementType> = {
  Layers,
  Dices,
  ShieldCheck,
  BookOpen,
  Crown,
  Sparkles,
};

export default function RelicsVaultTab({ state, onStateUpdate }: Props) {
  const relics = Object.values(state.relics || {});
  const equippedIds = state.equippedRelicIds || [];

  const handleUnlock = (relicId: string) => {
    const relic = state.relics[relicId];
    if (!relic || relic.unlocked) return;
    if (state.chips < relic.costChips) return;

    const nextState = purchaseRelic(state, relicId);
    playSound.levelUp(state.settings.soundEnabled);
    onStateUpdate(nextState);
  };

  const handleToggleEquip = (relicId: string) => {
    const nextState = toggleEquipRelic(state, relicId);
    playSound.cash(state.settings.soundEnabled);
    onStateUpdate(nextState);
  };

  return (
    <div className="space-y-6">
      {/* Hero Vault Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-gold/30 shadow-[0_0_30px_rgba(212,175,55,0.25)] group min-h-[220px] sm:min-h-0 sm:h-52 flex flex-col justify-end">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/images/vintage_relic_vault.jpg" 
            alt="Secret Vintage Vault" 
            className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark via-charcoal-dark/75 to-transparent" />
        </div>

        <div className="relative z-10 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-gold/20 text-gold-glow border border-gold/40">
                Syndicate Reliquary
              </span>
              <span className="text-[10px] font-mono text-zinc-300 font-bold">
                Equipped Pedestals: {equippedIds.length}/3
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              Vintage Decks & Lucky Charm Relics
            </h2>
            <p className="text-xs text-zinc-300 max-w-xl line-clamp-2 mt-0.5 drop-shadow">
              Equip rare vintage collector card decks, weighted craps dice, and mob heirlooms onto your 3 glowing pedestals to grant permanent passive power multipliers.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Glowing Pedestals */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-gold" />
          Active Display Pedestals (Max 3 Slots)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[0, 1, 2].map((slotIndex) => {
            const relicId = equippedIds[slotIndex];
            const relic = relicId ? state.relics[relicId] : null;
            const Icon = relic ? RELIC_ICONS[relic.iconName] || Crown : Crown;

            if (!relic) {
              return (
                <div 
                  key={slotIndex}
                  className="rounded-2xl p-4 border border-dashed border-white/15 bg-black/30 flex flex-col items-center justify-center text-center min-h-[140px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 mb-2">
                    <Sparkles size={18} />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Empty Pedestal {slotIndex + 1}
                  </span>
                  <span className="text-[10px] text-zinc-600 mt-0.5">
                    Equip an unlocked relic below
                  </span>
                </div>
              );
            }

            return (
              <div 
                key={slotIndex}
                className="glass-panel-gold rounded-2xl p-4 border-2 border-gold shadow-[0_0_25px_rgba(212,175,55,0.3)] flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold/20 text-gold-glow border border-gold/40">
                      Slot {slotIndex + 1} Active
                    </span>
                    <button
                      onClick={() => handleToggleEquip(relic.id)}
                      className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Unequip"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <TileArtwork 
                      id={relic.id} 
                      type="relic" 
                      name={relic.name} 
                      className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gold/40 shadow-[0_0_12px_rgba(212,175,55,0.4)]" 
                    />
                    <div>
                      <h4 className="text-sm font-black text-white line-clamp-1">
                        {relic.name}
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">
                        {relic.effectDescription}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gold/20 flex items-center justify-between text-[10px] font-mono text-zinc-300">
                  <span>Type: {relic.type.toUpperCase()}</span>
                  <span className="text-gold-glow font-black">{relic.rarity}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vault Catalog */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-2">
          <Crown size={16} className="text-gold" />
          The Secret Vault Collection
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {relics.map((r) => {
            const Icon = RELIC_ICONS[r.iconName] || Crown;
            const isEquipped = equippedIds.includes(r.id);
            const canAfford = state.chips >= r.costChips;

            return (
              <div 
                key={r.id}
                className={`glass-panel rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                  isEquipped 
                    ? 'border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                    : r.unlocked 
                    ? 'border-white/15 hover:border-gold/30' 
                    : 'border-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      r.rarity === 'Legendary'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : r.rarity === 'Rare'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {r.rarity} {r.type.toUpperCase()}
                    </span>

                    {isEquipped && (
                      <span className="text-[10px] font-black text-gold-glow flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-gold" />
                        Equipped
                      </span>
                    )}
                  </div>

                  <TileArtwork 
                    id={r.id} 
                    type="relic" 
                    name={r.name} 
                    isLocked={!r.unlocked}
                    className="w-full h-24 rounded-xl overflow-hidden my-2 border border-white/10 group" 
                  />
                  <div className="flex items-center gap-2.5 my-1.5">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gold shrink-0">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white line-clamp-1">
                        {r.name}
                      </h4>
                      <p className="text-[11px] font-bold text-emerald-400 font-mono">
                        {r.effectDescription}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    {r.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  {r.unlocked ? (
                    <button
                      onClick={() => handleToggleEquip(r.id)}
                      className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        isEquipped
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_12px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95'
                      }`}
                    >
                      {isEquipped ? 'Unequip' : 'Equip to Pedestal'}
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Unlock Fee</span>
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {formatChips(r.costChips)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleUnlock(r.id)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-600 via-gold to-yellow-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        Unlock Relic
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
