'use client';

import React from 'react';
import { 
  X, 
  Crosshair, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Coins, 
  Crown, 
  CheckCircle2, 
  Flame, 
  Lock 
} from 'lucide-react';
import { GameState } from '@/game/types';
import { startHeistMission, formatMoney, formatTokens, formatTime } from '@/game/engine';
import { playSound } from '@/game/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
  onOpenPrestigeModal: () => void;
}

export default function HeistMissionModal({
  isOpen,
  onClose,
  state,
  onStateUpdate,
  onOpenPrestigeModal,
}: Props) {
  if (!isOpen) return null;

  const isUnlocked = state.stats.prestigeResets >= 2;
  const heists = Object.values(state.heistMissions || {});
  const interpolBribed = Boolean(state.shadowCabinet?.['cabinet-interpol-director']?.bribed);

  const handleStartHeist = (heistId: string) => {
    const result = startHeistMission(state, heistId);
    if (result.error) {
      alert(result.error);
      return;
    }
    playSound.betPlaced(state.settings.soundEnabled);
    onStateUpdate(result.nextState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-charcoal-card via-charcoal-card to-charcoal-dark border border-rose-500/40 shadow-[0_0_60px_rgba(244,63,94,0.25)] p-4 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close heist missions"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider mb-2">
            <Flame size={14} /> Prestige Reset 2 Feature
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Tactical Vault Heists <Crosshair className="text-rose-500" />
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Dispatch elite specialist crews to crack rival vaults, ambush federal reserves, and infiltrate offshore banks. Massive dirty cash and syndicate token hauls await, but a botched job triggers heavy heat.
          </p>

          {interpolBribed && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
              <Crown size={14} /> INTERPOL Director General Retained: +25% Success Rate Applied to All Operations!
            </div>
          )}
        </div>

        {!isUnlocked ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded-2xl bg-black/40">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
              <Lock size={32} className="text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Prestige Reset Tier 2 Required</h3>
            <p className="text-zinc-400 text-sm max-w-md mb-6 leading-relaxed">
              Tactical Vault Heists require global syndicate coordination. Execute 2 Strip Buyout prestige resets to deploy mercenary heist teams.
            </p>
            <button
              onClick={onOpenPrestigeModal}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all"
            >
              Check Reset Requirements
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {heists.map(heist => {
              const now = Date.now();
              const isProgress = heist.status === 'in_progress' && heist.startedAt;
              const isCooldown = heist.status === 'cooldown' && heist.cooldownUntil && now < heist.cooldownUntil;
              const isReady = !isProgress && !isCooldown;

              let elapsed = 0;
              let percent = 0;
              let remainingSec = 0;

              if (isProgress && heist.startedAt) {
                elapsed = (now - heist.startedAt) / 1000;
                percent = Math.min(100, Math.floor((elapsed / heist.durationSeconds) * 100));
                remainingSec = Math.max(0, Math.floor(heist.durationSeconds - elapsed));
              }

              const cooldownRemaining = isCooldown && heist.cooldownUntil
                ? Math.max(0, Math.floor((heist.cooldownUntil - now) / 1000))
                : 0;

              const effectiveSuccessRate = Math.min(95, (100 - heist.riskPercent) + (interpolBribed ? 25 : 0));

              return (
                <div
                  key={heist.id}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-charcoal-card/80 p-5 sm:p-6 flex flex-col justify-between hover:border-rose-500/40 transition-all duration-300"
                >
                  <div>
                    {/* Top Type Pill & Risk Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                        {heist.targetType}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {effectiveSuccessRate}% Success Chance
                      </span>
                    </div>

                    {/* Target Name & Description */}
                    <h3 className="text-lg font-black text-white mb-2 leading-tight">
                      {heist.targetName}
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed min-h-[36px]">
                      {heist.description}
                    </p>

                    {/* Rewards Card */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-black/40 border border-white/5 mb-4">
                      <div>
                        <div className="text-[10px] uppercase text-zinc-400 font-semibold">Cash Bounty</div>
                        <div className="text-sm font-black text-emerald-400">{formatMoney(heist.cashReward)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-zinc-400 font-semibold">Syndicate Tokens</div>
                        <div className="text-sm font-black text-amber-400">{formatTokens(heist.tokensReward)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Status / Action */}
                  <div>
                    {isProgress ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                          <span className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
                            <Clock size={13} /> Operation Active...
                          </span>
                          <span>{formatTime(remainingSec)} left</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-1000"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    ) : isCooldown ? (
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-center gap-2 font-mono">
                        <ShieldAlert size={14} className="text-amber-500" />
                        Target on High Alert ({formatTime(cooldownRemaining)})
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartHeist(heist.id)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2"
                      >
                        <Crosshair size={15} /> Launch Heist Crew ({formatTime(heist.durationSeconds)})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
