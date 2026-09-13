'use client';

import React from 'react';
import { 
  X, 
  MapPin, 
  TrendingUp, 
  Flame, 
  Crown, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { GameState, District } from '@/game/types';
import { formatMoney, formatEquity, unlockDistrict, travelToDistrict } from '@/game/engine';
import { playSound } from '@/game/sound';
import TileArtwork from './TileArtwork';

interface Props {
  state: GameState;
  onClose: () => void;
  onStateUpdate: (newState: GameState) => void;
}

export default function TerritoryMapModal({ state, onClose, onStateUpdate }: Props) {
  const districts = Object.values(state.districts || {});

  const handleUnlock = (districtId: string) => {
    const nextState = unlockDistrict(state, districtId);
    playSound.levelUp(state.settings.soundEnabled);
    onStateUpdate(nextState);
  };

  const handleTravel = (districtId: string) => {
    const nextState = travelToDistrict(state, districtId);
    playSound.cash(state.settings.soundEnabled);
    onStateUpdate(nextState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel border-gold/40 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(212,175,55,0.3)] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-charcoal-dark/95 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Global Syndicate Territories
              </h2>
              <p className="text-xs text-zinc-400">
                Expand beyond the back alleys to command the world's most lucrative gambling capitals.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close territory map"
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Territory Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {districts.map((d) => {
            const isCurrent = state.currentDistrictId === d.id;
            const canAfford = state.cash >= d.unlockCostCash && state.equity >= d.unlockCostEquity;

            return (
              <div
                key={d.id}
                className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isCurrent 
                    ? 'glass-panel-gold border-2 border-gold shadow-[0_0_25px_rgba(212,175,55,0.35)]' 
                    : d.unlocked 
                    ? 'glass-panel border-white/15 hover:border-gold/40' 
                    : 'bg-black/40 border-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Hero Image */}
                  <div className="relative w-full h-32 overflow-hidden">
                    <TileArtwork 
                      id={d.id} 
                      type="district" 
                      fallbackImage={d.image} 
                      name={d.name} 
                      className="w-full h-full" 
                      isLocked={!d.unlocked} 
                    />
                    
                    <div className="absolute top-2.5 right-2.5">
                      {isCurrent ? (
                        <span className="px-2.5 py-1 rounded-full bg-gold text-black text-[10px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(212,175,55,0.6)]">
                          Active HQ
                        </span>
                      ) : d.unlocked ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/80 text-black text-[10px] font-black uppercase tracking-wider">
                          Unlocked
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-black/70 text-zinc-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-white/10">
                          <Lock size={11} /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-base font-black text-white">
                      {d.name}
                    </h3>
                    <span className="text-[11px] font-bold text-gold-glow block mb-1">
                      {d.tagline}
                    </span>
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                      {d.description}
                    </p>

                    {/* Modifiers Grid */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/50 border border-white/5 text-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">Revenue</span>
                        <span className="text-xs font-black text-emerald-400 font-mono">
                          {d.revenueMultiplier}x Mult
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">Heat Rate</span>
                        <span className={`text-xs font-black font-mono ${d.heatModifier <= 1 ? 'text-cyan-400' : 'text-orange-400'}`}>
                          {d.heatModifier}x
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">Local Boss</span>
                        <span className="text-[11px] font-bold text-zinc-300 line-clamp-1">
                          {d.bossName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  {isCurrent ? (
                    <div className="w-full py-2 rounded-xl bg-gold/20 text-gold-glow border border-gold/40 text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={14} />
                      Current Base of Operations
                    </div>
                  ) : d.unlocked ? (
                    <button
                      onClick={() => handleTravel(d.id)}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <ArrowRight size={14} />
                      Travel To Territory
                    </button>
                  ) : (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Expansion Cost</span>
                        <span className="text-xs font-mono font-bold text-white">
                          {formatMoney(d.unlockCostCash)} + {formatEquity(d.unlockCostEquity)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleUnlock(d.id)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-600 via-gold to-yellow-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        Acquire Territory
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
