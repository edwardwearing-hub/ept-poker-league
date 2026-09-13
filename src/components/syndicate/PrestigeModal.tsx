'use client';

import React from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Sparkles, 
  Crown, 
  Flame, 
  ArrowRight, 
  ArrowUpCircle,
  Check,
  ShieldCheck 
} from 'lucide-react';
import { GameState, PrestigePerk } from '@/game/types';
import { 
  formatMoney, 
  formatTokens, 
  formatEquity,
  calculatePrestigeTokens,
  getPrestigeEquity,
  getNextPrestigeTokenEquity,
  PRESTIGE_EQUITY_THRESHOLD
} from '@/game/engine';
import { playSound } from '@/game/sound';
import { INITIAL_TABLES, INITIAL_STAFF, INITIAL_UPGRADES, INITIAL_BUSINESSES } from '@/game/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
}

export default function PrestigeModal({ isOpen, onClose, state, onStateUpdate }: Props) {
  if (!isOpen) return null;

  const cleanEquity = getPrestigeEquity(state);
  const potentialTokens = calculatePrestigeTokens(state);
  const canPrestige = potentialTokens > 0;
  const nextTargetEquity = getNextPrestigeTokenEquity(potentialTokens);
  const prevTargetEquity = potentialTokens > 0 ? getNextPrestigeTokenEquity(potentialTokens - 1) : 0;
  const progressPercent = Math.min(100, Math.max(0, ((cleanEquity - prevTargetEquity) / (nextTargetEquity - prevTargetEquity)) * 100));

  const handlePrestigeReset = () => {
    if (!canPrestige) return;

    playSound.jackpot(state.settings.soundEnabled);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#D4AF37', '#FFE578', '#22C55E', '#FFFFFF'],
    });

    const startingCashBonus = (state.perks['starting-bankroll']?.level || 0) * (state.perks['starting-bankroll']?.valuePerLevel || 0);
    const contractBonus = state.blackMarketContracts?.['contract-syndicate-bailout']?.unlocked ? 10000000 : 0;

    const nextState: GameState = {
      ...state,
      cash: 50 + startingCashBonus + contractBonus,
      chips: 10,
      equity: 0,
      heat: 0,
      mobTokens: state.mobTokens + potentialTokens,
      reputation: state.reputation + 1,

      // Reset Tables, Staff, Upgrades, Businesses for new run
      tables: INITIAL_TABLES,
      staff: INITIAL_STAFF,
      upgrades: INITIAL_UPGRADES,
      businesses: INITIAL_BUSINESSES,

      stats: {
        ...state.stats,
        prestigeResets: state.stats.prestigeResets + 1,
        equityEarnedThisRun: 0,
      },
      lastTickTime: Date.now(),
    };

    onStateUpdate(nextState);
    onClose();
  };

  const handleUpgradePerk = (perkId: string) => {
    const perk = state.perks[perkId];
    if (!perk || perk.level >= perk.maxLevel) return;

    if (state.mobTokens < perk.cost) return;

    playSound.levelUp(state.settings.soundEnabled);

    const nextState: GameState = {
      ...state,
      mobTokens: state.mobTokens - perk.cost,
      perks: {
        ...state.perks,
        [perkId]: {
          ...perk,
          level: perk.level + 1,
        },
      },
    };

    onStateUpdate(nextState);
  };

  const perkList = Object.values(state.perks);
  const currentTier = state.stats.prestigeResets;

  const ROADMAP_STEPS = [
    {
      tier: 1,
      title: 'Underworld Kingpin',
      rewards: 'Black Market Contracts + Syndicate Wheel',
      unlocked: currentTier >= 1,
    },
    {
      tier: 2,
      title: 'Global Syndicate',
      rewards: 'Tactical Vault Heists Board',
      unlocked: currentTier >= 2,
    },
    {
      tier: 3,
      title: 'Illuminati Shadow Cartel',
      rewards: 'Shadow Cartel Cabinet Appointments',
      unlocked: currentTier >= 3,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel-gold rounded-3xl border border-gold/40 p-4 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.25)]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer touch-manipulation"
        >
          <X size={20} />
        </button>

        {/* Vegas Resort Hero Banner */}
        <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden mb-6 border border-gold/40 shadow-[0_0_25px_rgba(212,175,55,0.3)]">
          <img 
            src="/images/vegas_strip_resort.jpg" 
            alt="Las Vegas Strip Casino Resort" 
            className="w-full h-full object-cover filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark via-charcoal-dark/40 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-gold/20 text-gold-glow border border-gold/40 backdrop-blur-md">
                Prestige Buyout • Tier {currentTier}
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
                Vegas Strip Mega-Resort
              </h2>
            </div>
            <div className="p-2.5 rounded-xl bg-gold/20 text-gold-glow border border-gold/30 backdrop-blur-md">
              <Crown size={24} />
            </div>
          </div>
        </div>

        {/* Prestige Feature Unlock Roadmap */}
        <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-gold" />
              Prestige Reset Feature Roadmap
            </span>
            <span className="text-[11px] font-bold text-gold font-mono">
              Resets Executed: {currentTier}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {ROADMAP_STEPS.map((step) => (
              <div
                key={step.tier}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                  step.unlocked
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-900/50 border-white/5 text-zinc-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                      Reset {step.tier}
                    </span>
                    {step.unlocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <Check size={12} /> UNLOCKED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-500">LOCKED</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {step.title}
                  </h4>
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                  {step.rewards}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Prestige Summary Box (Tied to Clean Equity) */}
        <div className="glass-panel p-5 rounded-2xl border-white/10 mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Laundered Clean Equity
              </span>
              <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono block tracking-tight">
                {formatEquity(cleanEquity)}
              </span>
              <span className="text-[10px] text-zinc-400">
                {canPrestige ? 'Eligible for Strip Buyout' : `Requires ${formatEquity(PRESTIGE_EQUITY_THRESHOLD)} Clean Equity`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <ArrowRight size={20} className="text-zinc-500 hidden sm:block" />
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Tokens on Liquidation</span>
                <span className="text-lg sm:text-xl font-black text-gold-glow font-mono block">
                  +{potentialTokens} Mob Tokens
                </span>
                <span className="text-[10px] text-amber-300/80 font-mono">
                  Next token at {formatEquity(nextTargetEquity)}
                </span>
              </div>
            </div>

            <button
              onClick={handlePrestigeReset}
              disabled={!canPrestige}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                canPrestige
                  ? 'bg-gradient-to-r from-amber-600 via-gold to-yellow-600 text-black shadow-[0_0_25px_rgba(212,175,55,0.6)] hover:brightness-110 active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {canPrestige ? 'Execute Buyout' : `Requires ${formatEquity(PRESTIGE_EQUITY_THRESHOLD)}`}
            </button>
          </div>

          {/* Progress bar towards next token */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1 text-zinc-300">
                <Sparkles size={11} className="text-gold" />
                Token Milestone Progress
              </span>
              <span>
                {cleanEquity < PRESTIGE_EQUITY_THRESHOLD 
                  ? `${formatEquity(cleanEquity)} / ${formatEquity(PRESTIGE_EQUITY_THRESHOLD)}` 
                  : `${formatEquity(cleanEquity)} / ${formatEquity(nextTargetEquity)}`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-gold transition-all duration-500"
                style={{ 
                  width: `${cleanEquity < PRESTIGE_EQUITY_THRESHOLD 
                    ? Math.min(100, Math.max(3, (cleanEquity / PRESTIGE_EQUITY_THRESHOLD) * 100)) 
                    : Math.min(100, Math.max(3, progressPercent))}%` 
                }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              💡 Corporate conglomerates and gaming commissions will only accept legitimate, laundered <strong>Clean Equity (💎)</strong> from your front businesses to execute a Strip Buyout. Street dirty cash is rejected!
            </p>
          </div>
        </div>

        {/* Available Mob Tokens Counter */}
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
            <Sparkles size={14} className="text-gold" />
            Permanent Mob Influence Perks
          </h3>
          <span className="text-xs font-black text-gold-glow font-mono bg-gold/10 px-2.5 py-1 rounded-xl border border-gold/30">
            Available: {state.mobTokens} Tokens
          </span>
        </div>

        {/* Perks Grid */}
        <div className="space-y-2.5">
          {perkList.map((perk) => {
            const isMax = perk.level >= perk.maxLevel;
            const canAfford = state.mobTokens >= perk.cost && !isMax;

            return (
              <div
                key={perk.id}
                className="glass-panel p-3 rounded-xl border-white/10 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      {perk.name}
                    </h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gold font-mono">
                      {perk.level}/{perk.maxLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {perk.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-black font-mono text-gold-glow">
                    {isMax ? 'MAX' : `${perk.cost} Tokens`}
                  </span>

                  {!isMax && (
                    <button
                      onClick={() => handleUpgradePerk(perk.id)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-gold hover:bg-yellow-400 text-black shadow-[0_0_10px_rgba(212,175,55,0.4)] active:scale-95'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      Upgrade
                    </button>
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
