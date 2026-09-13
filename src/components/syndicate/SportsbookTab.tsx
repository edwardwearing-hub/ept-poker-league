'use client';

import React, { useState } from 'react';
import { 
  Flame, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  Dices,
  Zap,
  Radio,
  Trophy
} from 'lucide-react';
import { GameState, SportsbookMatch } from '@/game/types';
import { formatMoney, placeSportsbookBet, fixSportsbookMatch } from '@/game/engine';
import { playSound } from '@/game/sound';

interface Props {
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
}

export default function SportsbookTab({ state, onStateUpdate }: Props) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [betAmounts, setBetAmounts] = useState<Record<string, number>>({});

  const matches = state.sportsbookMatches || [];
  const totalVig = state.totalVigCollected || 0;

  const handlePlaceBet = (matchId: string, side: 'A' | 'B', amount: number) => {
    if (state.cash < amount || amount <= 0) return;
    const nextState = placeSportsbookBet(state, matchId, side, amount);
    playSound.cash(state.settings.soundEnabled);
    onStateUpdate(nextState);
  };

  const handleFixMatch = (matchId: string) => {
    const { nextState, notice } = fixSportsbookMatch(state, matchId);
    playSound.raid(state.settings.soundEnabled);
    alert(notice);
    onStateUpdate(nextState);
  };

  return (
    <div className="space-y-5">
      {/* Hero Sportsbook Lounge Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.25)] group min-h-[220px] sm:min-h-0 sm:h-52 flex flex-col justify-end">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/images/sportsbook_lounge.jpg" 
            alt="VIP Sportsbook Lounge" 
            className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark via-charcoal-dark/75 to-transparent" />
        </div>

        <div className="relative z-10 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <Radio size={12} className="text-cyan-400 animate-pulse" />
                Live Syndicate Bookmaker
              </span>
              <span className="text-[10px] font-mono text-zinc-300 font-bold">
                House Edge: 8.5%
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              The Syndicate Sportsbook Lounge
            </h2>
            <p className="text-xs text-zinc-300 max-w-xl line-clamp-2 mt-0.5 drop-shadow">
              Run the book on championship boxing, high-stakes horse races, and football derbies. Collect the house vig on every match or secretly bribe referees to fix outcomes.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/60 px-4 py-2.5 rounded-2xl border border-white/10 shrink-0 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Total Vig Collected</span>
              <span className="text-sm sm:text-base font-black text-cyan-300 font-mono">
                {formatMoney(totalVig)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Sports Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {matches.map((m) => {
          const now = Date.now();
          const remainingSec = Math.max(0, Math.ceil((m.endsAt - now) / 1000));
          const currentBetAmount = betAmounts[m.id] || 250;

          return (
            <div 
              key={m.id}
              className={`glass-panel rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                m.fixedByMob 
                  ? 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-amber-950/20' 
                  : m.activeBet 
                  ? 'border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
                  : 'border-white/10 hover:border-cyan-500/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-cyan-400 font-mono">
                    {m.sport}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 font-bold">
                    <Clock size={12} className="text-cyan-400" />
                    {remainingSec}s left
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-black text-white line-clamp-1">
                  {m.eventTitle}
                </h3>

                {m.fixedByMob && (
                  <div className="my-2 p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider text-amber-300 text-center animate-pulse">
                    ⚠️ MATCH FIXED BY SYNDICATE
                  </div>
                )}

                {/* Team / Contender Matchup Cards */}
                <div className="grid grid-cols-2 gap-2 my-3">
                  <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                    m.activeBet?.side === 'A' 
                      ? 'bg-cyan-500/20 border-cyan-400' 
                      : 'bg-black/40 border-white/5'
                  }`}>
                    <span className="text-xs font-black text-white line-clamp-1">{m.teamA}</span>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Odds</span>
                      <span className="text-xs font-mono font-black text-cyan-300">{m.oddsA}x</span>
                    </div>
                    <button
                      onClick={() => handlePlaceBet(m.id, 'A', currentBetAmount)}
                      disabled={Boolean(m.activeBet) || state.cash < currentBetAmount}
                      className="mt-2 w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      {m.activeBet?.side === 'A' ? 'Bet Placed' : `Bet Side A`}
                    </button>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                    m.activeBet?.side === 'B' 
                      ? 'bg-cyan-500/20 border-cyan-400' 
                      : 'bg-black/40 border-white/5'
                  }`}>
                    <span className="text-xs font-black text-white line-clamp-1">{m.teamB}</span>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Odds</span>
                      <span className="text-xs font-mono font-black text-cyan-300">{m.oddsB}x</span>
                    </div>
                    <button
                      onClick={() => handlePlaceBet(m.id, 'B', currentBetAmount)}
                      disabled={Boolean(m.activeBet) || state.cash < currentBetAmount}
                      className="mt-2 w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      {m.activeBet?.side === 'B' ? 'Bet Placed' : `Bet Side B`}
                    </button>
                  </div>
                </div>

                {/* Bet Size Quick Selector */}
                {!m.activeBet && (
                  <div className="mb-3">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                      Wager Amount: {formatMoney(currentBetAmount)}
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {[100, 250, 1000, 5000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setBetAmounts({ ...betAmounts, [m.id]: amt })}
                          className={`py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            currentBetAmount === amt 
                              ? 'bg-cyan-500 text-black font-black' 
                              : 'bg-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Bet Summary */}
                {m.activeBet && (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center justify-between mb-3">
                    <span>Active Wager: {formatMoney(m.activeBet.amount)}</span>
                    <span className="font-black">
                      Potential: {formatMoney(m.activeBet.amount * (m.activeBet.side === 'A' ? m.oddsA : m.oddsB))}
                    </span>
                  </div>
                )}
              </div>

              {/* Mob Action: Fix Match */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleFixMatch(m.id)}
                  disabled={m.fixedByMob || state.cash < 5000}
                  className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    m.fixedByMob
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                      : state.cash >= 5000
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <ShieldAlert size={14} />
                  {m.fixedByMob ? 'Match Fixed (Guaranteed Win)' : 'Fix Match ($5,000 +15% Heat)'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
