'use client';

import React from 'react';
import { 
  ShieldAlert, 
  Coins, 
  Building2, 
  Crown, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Lock,
  Flame,
  AlertTriangle 
} from 'lucide-react';
import { GameState } from '@/game/types';
import { formatEquity, formatTokens, buyBlackMarketContract } from '@/game/engine';
import { playSound } from '@/game/sound';

interface Props {
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
  onOpenPrestigeModal: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Coins: <Coins size={20} className="text-amber-400" />,
  ShieldAlert: <ShieldAlert size={20} className="text-rose-400" />,
  Building2: <Building2 size={20} className="text-cyan-400" />,
  Crown: <Crown size={20} className="text-yellow-400" />,
  ShieldCheck: <ShieldCheck size={20} className="text-emerald-400" />,
  Sparkles: <Sparkles size={20} className="text-purple-400" />,
};

export default function BlackMarketTab({ state, onStateUpdate, onOpenPrestigeModal }: Props) {
  const isUnlocked = state.stats.prestigeResets >= 1;
  const contracts = Object.values(state.blackMarketContracts || {});

  const handlePurchase = (contractId: string) => {
    const result = buyBlackMarketContract(state, contractId);
    if (result.error) {
      alert(result.error);
      return;
    }
    playSound.jackpot(state.settings.soundEnabled);
    onStateUpdate(result.nextState);
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-charcoal-card/40 border border-white/5 rounded-2xl backdrop-blur-md">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Lock size={36} className="text-amber-400" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
          <Flame size={14} /> Prestige Reset 1 Required
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
          Underworld Black Market Locked
        </h2>
        <p className="text-zinc-400 max-w-md mb-6 text-sm leading-relaxed">
          Permanent cartel contracts and diplomatic backchannels are only available to verified syndicate bosses. Execute your first <span className="text-gold font-bold">Strip Buyout</span> to unlock this black market board.
        </p>
        <button
          onClick={onOpenPrestigeModal}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold to-amber-600 text-charcoal-dark font-black text-sm tracking-wide uppercase shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <Crown size={16} /> View Strip Buyout Requirements
        </button>
      </div>
    );
  }

  const activeCount = contracts.filter(c => c.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/80 via-charcoal-card to-charcoal-card border border-purple-500/30 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Crown size={240} className="text-purple-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={14} /> Tier 1 Prestige Board • Permanent Syndicate Perks
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              The Underworld Black Market
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
              These top-secret operations contracts persist permanently across all future Strip Buyout resets. Secure international diplomatic couriers, offshore bypasses, and quantum wire routing.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-xl p-4 self-start md:self-auto backdrop-blur-md">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">Active Contracts</div>
              <div className="text-xl font-black text-gold">
                {activeCount} / {contracts.length}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">Mob Tokens</div>
              <div className="text-xl font-black text-amber-400">
                {formatTokens(state.mobTokens)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {contracts.map(contract => {
          const isPurchased = contract.unlocked;
          const canAfford = state.mobTokens >= contract.costTokens && state.equity >= contract.costEquity;

          return (
            <div
              key={contract.id}
              className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between ${
                isPurchased
                  ? 'bg-gradient-to-b from-emerald-950/40 to-charcoal-card border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-charcoal-card/80 border-white/10 hover:border-purple-500/40 hover:shadow-lg'
              }`}
            >
              {/* Category & Codename Pill */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  {contract.codename}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">
                  {contract.category}
                </span>
              </div>

              {/* Title & Description */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 shrink-0">
                    {ICON_MAP[contract.iconName] || <Coins size={20} className="text-gold" />}
                  </div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {contract.name}
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed min-h-[48px]">
                  {contract.description}
                </p>
              </div>

              {/* Effect Highlight */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 mb-5 flex items-center gap-2">
                <Sparkles size={14} className="text-gold shrink-0" />
                <span className="text-xs font-bold text-emerald-400">
                  {contract.effectLabel}
                </span>
              </div>

              {/* Action / Cost Footer */}
              {isPurchased ? (
                <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                  <Check size={16} /> Permanent Contract Active
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-zinc-400">Cost:</span>
                    <span className="font-bold flex items-center gap-2 text-zinc-200">
                      <span className="text-amber-400">{contract.costTokens} Tokens</span>
                      <span>+</span>
                      <span className="text-cyan-400">{formatEquity(contract.costEquity)} Equity</span>
                    </span>
                  </div>
                  <button
                    onClick={() => handlePurchase(contract.id)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md ${
                      canAfford
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                    }`}
                  >
                    Authorize Contract
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
