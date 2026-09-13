'use client';

import React, { useState } from 'react';
import { 
  Trophy, 
  Crown, 
  Award, 
  Users, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign,
  Flame,
  ShieldCheck,
  Star
} from 'lucide-react';
import { GameState, Tournament, SponsoredPro } from '@/game/types';
import { formatMoney, formatChips, startTournament, hireSponsoredPro } from '@/game/engine';
import { playSound } from '@/game/sound';
import TileArtwork from './TileArtwork';

interface Props {
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
}

export default function TournamentsTab({ state, onStateUpdate }: Props) {
  const [selectedProForTourney, setSelectedProForTourney] = useState<Record<string, string>>({});
  const [activeSubTab, setActiveSubTab] = useState<'tournaments' | 'pros' | 'trophies'>('tournaments');

  const tourneys = Object.values(state.tournaments || {});
  const pros = Object.values(state.sponsoredPros || {});
  const wonTrophies = state.wonTrophies || [];

  const handleLaunchTournament = (tourneyId: string) => {
    const selectedPro = selectedProForTourney[tourneyId];
    const { nextState, error } = startTournament(state, tourneyId, selectedPro);
    if (error) {
      alert(error);
      return;
    }
    playSound.cash(state.settings.soundEnabled);
    onStateUpdate(nextState);
  };

  const handleHirePro = (proId: string) => {
    const nextState = hireSponsoredPro(state, proId);
    playSound.levelUp(state.settings.soundEnabled);
    onStateUpdate(nextState);
  };

  return (
    <div className="space-y-5">
      {/* Hero Tournament Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-gold/30 shadow-[0_0_30px_rgba(212,175,55,0.25)] group min-h-[220px] sm:min-h-0 sm:h-52 flex flex-col justify-end">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/images/tournament_poker_room.jpg" 
            alt="World Poker Championship" 
            className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark via-charcoal-dark/75 to-transparent" />
        </div>

        <div className="relative z-10 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-gold/20 text-gold-glow border border-gold/40">
                Official EPT Circuit
              </span>
              <span className="text-[10px] font-mono text-zinc-300 font-bold">
                Trophies Won: {wonTrophies.length}/4
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              High-Stakes Poker Tournament Circuit
            </h2>
            <p className="text-xs text-zinc-300 max-w-xl line-clamp-2 mt-0.5 drop-shadow">
              Host underground shootouts and televised championship events. Bankroll sponsored tournament pros, collect massive prize pools, and win coveted gold championship bracelets.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full scrollbar-none shrink-0">
            <button
              onClick={() => setActiveSubTab('tournaments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                activeSubTab === 'tournaments'
                  ? 'bg-gradient-to-r from-amber-500 via-gold to-yellow-400 text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tournaments
            </button>
            <button
              onClick={() => setActiveSubTab('pros')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                activeSubTab === 'pros'
                  ? 'bg-gradient-to-r from-amber-500 via-gold to-yellow-400 text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pro Roster ({pros.filter(p => p.hired).length})
            </button>
            <button
              onClick={() => setActiveSubTab('trophies')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                activeSubTab === 'trophies'
                  ? 'bg-gradient-to-r from-amber-500 via-gold to-yellow-400 text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Trophies ({wonTrophies.length})
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: TOURNAMENTS */}
      {activeSubTab === 'tournaments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tourneys.map((t) => {
            const isRunning = t.status === 'running';
            const now = Date.now();
            const elapsed = isRunning && t.startedAt ? (now - t.startedAt) / 1000 : 0;
            const progress = isRunning ? Math.min(100, (elapsed / t.durationSeconds) * 100) : 0;
            const remainingSeconds = Math.max(0, Math.ceil(t.durationSeconds - elapsed));

            const canAfford = state.cash >= t.buyIn && state.chips >= t.chipsEntry;
            const isTrophyWon = wonTrophies.includes(t.trophy);
            const hiredPros = pros.filter(p => p.hired);
            const selectedProId = selectedProForTourney[t.id];
            const activePro = hiredPros.find(p => p.id === selectedProId);

            const totalWinChance = Math.min(0.95, t.winChance + (activePro ? activePro.winBonus : 0));

            return (
              <div 
                key={t.id}
                className={`glass-panel rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between relative overflow-hidden ${
                  isRunning 
                    ? 'border-gold shadow-[0_0_20px_rgba(212,175,55,0.25)]' 
                    : 'border-white/10 hover:border-gold/30'
                }`}
              >
                <div>
                  <TileArtwork 
                    id={t.id} 
                    type="tournament" 
                    fallbackImage={t.image} 
                    name={t.name} 
                    className="w-full h-28 rounded-xl overflow-hidden mb-3 border border-white/10 group" 
                  />
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gold/20 text-gold-glow border border-gold/30">
                      {t.tier} Tier
                    </span>
                    {isTrophyWon && (
                      <span className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                        <Trophy size={13} className="text-gold" />
                        Trophy Champion
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white">
                    {t.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                    {t.description}
                  </p>

                  {/* Prize Details Grid */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">1st Place</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
                        {formatMoney(t.firstPlacePrize)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Chip Reward</span>
                      <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                        +{formatChips(t.chipsReward)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Win Odds</span>
                      <span className="text-xs sm:text-sm font-black text-cyan-300 font-mono">
                        {(totalWinChance * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Pro Selection Dropdown */}
                  {!isRunning && hiredPros.length > 0 && (
                    <div className="mb-3">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                        Sponsor Roster Pro (+Win Boost):
                      </label>
                      <select
                        value={selectedProId || ''}
                        onChange={(e) => setSelectedProForTourney({
                          ...selectedProForTourney,
                          [t.id]: e.target.value,
                        })}
                        className="w-full bg-zinc-900 border border-white/15 rounded-xl text-xs font-bold text-white px-3 py-2 cursor-pointer focus:border-gold outline-none"
                      >
                        <option value="">None (Solo Entry - Base Odds)</option>
                        {hiredPros.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.alias}) — +{(p.winBonus * 100).toFixed(0)}% Win Chance (Keeps {p.cutPercent}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Running Progress Bar */}
                  {isRunning && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-gold-glow font-bold animate-pulse flex items-center gap-1.5">
                          <Crown size={14} className="text-gold" />
                          Tournament In Play...
                        </span>
                        <span className="text-zinc-300 font-bold">
                          {remainingSeconds}s remaining
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-600 via-gold to-yellow-400 transition-all duration-200"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Entry Buy-In</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {formatMoney(t.buyIn)} + {formatChips(t.chipsEntry)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleLaunchTournament(t.id)}
                    disabled={isRunning || !canAfford}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isRunning
                        ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-white/5 animate-pulse'
                        : canAfford
                        ? 'bg-gradient-to-r from-amber-600 via-gold to-yellow-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    {isRunning ? 'In Progress' : 'Enter Tournament'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 2: SPONSORED PROS */}
      {activeSubTab === 'pros' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pros.map((pro) => {
            const canAfford = state.cash >= pro.salary;

            return (
              <div 
                key={pro.id}
                className={`glass-panel rounded-2xl p-4 border flex flex-col justify-between ${
                  pro.hired ? 'border-emerald-500/40' : 'border-white/10 hover:border-gold/30'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={pro.avatar} 
                      alt={pro.name} 
                      className="w-14 h-14 rounded-2xl object-cover border border-gold/40 shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                    />
                    <div>
                      <h4 className="text-sm font-black text-white">
                        {pro.name}
                      </h4>
                      <span className="text-[11px] font-bold text-gold-glow block">
                        "{pro.alias}"
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        +{(pro.winBonus * 100).toFixed(0)}% Win Rate Boost
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mb-2">
                    {pro.specialty}
                  </p>

                  <blockquote className="p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] italic text-zinc-300">
                    "{pro.quote}"
                  </blockquote>

                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-zinc-300">
                    <span>Tournament Cut:</span>
                    <span className="font-bold text-amber-300">{pro.cutPercent}% of 1st Prize</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Signing Fee</span>
                    <span className="text-sm font-mono font-black text-white">
                      {formatMoney(pro.salary)}
                    </span>
                  </div>

                  {pro.hired ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      On Contract
                    </span>
                  ) : (
                    <button
                      onClick={() => handleHirePro(pro.id)}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-600 via-gold to-yellow-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      Sponsor Pro
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 3: TROPHY CABINET */}
      {activeSubTab === 'trophies' && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Trophy size={20} className="text-gold" />
                The Syndicate Trophy Cabinet
              </h3>
              <p className="text-xs text-zinc-400">
                Championship jewelry and bracelets won across regional, national, and world poker circuits.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-gold/20 text-gold-glow border border-gold/40 text-xs font-mono font-black">
              {wonTrophies.length} Claimed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tourneys.map((t) => {
              const isWon = wonTrophies.includes(t.trophy);

              return (
                <div 
                  key={t.id}
                  className={`rounded-2xl p-4 border flex flex-col items-center text-center transition-all ${
                    isWon 
                      ? 'glass-panel-gold border-gold/60 shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                      : 'bg-black/30 border-dashed border-white/10 opacity-60'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${
                    isWon 
                      ? 'bg-gradient-to-br from-amber-500 to-yellow-300 text-black shadow-[0_0_20px_rgba(212,175,55,0.5)]' 
                      : 'bg-zinc-800 text-zinc-600'
                  }`}>
                    <Trophy size={32} />
                  </div>

                  <h4 className={`text-sm font-black ${isWon ? 'text-white' : 'text-zinc-500'}`}>
                    {t.trophy}
                  </h4>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold mt-0.5">
                    {t.name}
                  </span>

                  <span className={`mt-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isWon 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-zinc-800 text-zinc-600'
                  }`}>
                    {isWon ? 'CHAMPION' : 'LOCKED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
