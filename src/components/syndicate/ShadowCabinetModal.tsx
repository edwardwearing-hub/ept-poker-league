'use client';

import React from 'react';
import { 
  X, 
  Crown, 
  ShieldCheck, 
  Coins, 
  Gem, 
  CheckCircle2, 
  Lock, 
  Flame, 
  Sparkles,
  Award 
} from 'lucide-react';
import { GameState } from '@/game/types';
import { bribeShadowOfficial, formatEquity } from '@/game/engine';
import { playSound } from '@/game/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
  onOpenPrestigeModal: () => void;
}

const OFFICIAL_ICONS: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck size={28} className="text-emerald-400" />,
  Gem: <Gem size={28} className="text-cyan-400" />,
  Coins: <Coins size={28} className="text-amber-400" />,
  Crown: <Crown size={28} className="text-gold" />,
};

export default function ShadowCabinetModal({
  isOpen,
  onClose,
  state,
  onStateUpdate,
  onOpenPrestigeModal,
}: Props) {
  if (!isOpen) return null;

  const isUnlocked = state.stats.prestigeResets >= 3;
  const officials = Object.values(state.shadowCabinet || {});

  const handleAppoint = (officialId: string) => {
    const result = bribeShadowOfficial(state, officialId);
    if (result.error) {
      alert(result.error);
      return;
    }
    playSound.jackpot(state.settings.soundEnabled);
    onStateUpdate(result.nextState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-charcoal-card via-charcoal-card to-charcoal-dark border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] p-4 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close shadow cabinet"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles size={14} /> Prestige Reset 3 Feature • The Shadow Cartel
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            The Shadow Cartel Cabinet <Crown className="text-gold" />
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Appoint high-ranking federal, judicial, and international officials on permanent syndicate retainer using Clean Corporate Equity. Their extraordinary influence bends sovereign institutions to your will.
          </p>
        </div>

        {!isUnlocked ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded-2xl bg-black/40">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
              <Lock size={32} className="text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Prestige Reset Tier 3 Required</h3>
            <p className="text-zinc-400 text-sm max-w-md mb-6 leading-relaxed">
              The Shadow Cabinet is the sovereign tier of underworld dominion. Execute 3 Strip Buyout prestige resets to access federal judicial appointments.
            </p>
            <button
              onClick={onOpenPrestigeModal}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all"
            >
              Check Reset Requirements
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {officials.map(official => {
              const isBribed = official.bribed;
              const canAfford = state.equity >= official.costEquity;

              return (
                <div
                  key={official.id}
                  className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 ${
                    isBribed
                      ? 'bg-gradient-to-b from-cyan-950/40 to-charcoal-card border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                      : 'bg-charcoal-card/80 border-white/10 hover:border-cyan-500/30'
                  }`}
                >
                  <div>
                    {/* Top Identity & Office Badge */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-2xl bg-black/60 border border-white/10 shrink-0">
                        {OFFICIAL_ICONS[official.iconName] || <Award size={28} className="text-cyan-400" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                          {official.officeName}
                        </span>
                        <h3 className="text-lg font-black text-white leading-tight">
                          {official.incumbent}
                        </h3>
                      </div>
                    </div>

                    {/* Official Description */}
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed min-h-[36px]">
                      {official.description}
                    </p>

                    {/* Benefit Highlight */}
                    <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 mb-5 flex items-center gap-2.5">
                      <Crown size={16} className="text-gold shrink-0" />
                      <span className="text-xs font-bold text-cyan-300">
                        {official.benefitLabel}
                      </span>
                    </div>
                  </div>

                  {/* Action / Retainer Status */}
                  {isBribed ? (
                    <div className="w-full py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} /> On Permanent Syndicate Retainer
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-zinc-400">Retainer Fee:</span>
                        <span className="font-bold text-cyan-400">{formatEquity(official.costEquity)} Clean Equity</span>
                      </div>
                      <button
                        onClick={() => handleAppoint(official.id)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          canAfford
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                        }`}
                      >
                        Appoint on Permanent Retainer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
