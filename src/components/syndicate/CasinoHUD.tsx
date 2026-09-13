'use client';

import React from 'react';
import { 
  Flame, 
  Settings, 
  Volume2, 
  VolumeX, 
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  Briefcase,
  MapPin,
  Trophy,
  Target,
  Crosshair,
  Building
} from 'lucide-react';
import { GameState } from '@/game/types';
import { 
  formatMoney, 
  formatChips, 
  formatEquity, 
  formatTokens, 
  getTotalProductionRates, 
  calculatePrestigeTokens,
  getBribeCost,
  canSpinLuckyWheel
} from '@/game/engine';

interface Props {
  state: GameState;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onOpenPrestige: () => void;
  onBribeChief: () => void;
  onOpenTerritories: () => void;
  onOpenAchievements: () => void;
  onOpenWheel?: () => void;
  onOpenHeists?: () => void;
  onOpenCabinet?: () => void;
}

export default function CasinoHUD({ 
  state, 
  onOpenSettings, 
  onToggleSound, 
  onOpenPrestige, 
  onBribeChief,
  onOpenTerritories,
  onOpenAchievements,
  onOpenWheel,
  onOpenHeists,
  onOpenCabinet
}: Props) {
  const rates = getTotalProductionRates(state);
  const potentialTokens = calculatePrestigeTokens(state);
  const unclaimedAchievementsCount = Object.values(state.achievements || {}).filter(a => a.unlocked && !a.claimed).length;
  const isWheelReady = canSpinLuckyWheel(state);
  const hasWheelUnlocked = state.stats.prestigeResets >= 1;
  const hasHeistsUnlocked = state.stats.prestigeResets >= 2;
  const hasCabinetUnlocked = state.stats.prestigeResets >= 3;

  const [activePlayer, setActivePlayer] = React.useState<string | null>(null);
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('ept_active_player_v2');
      if (saved) setActivePlayer(saved);
    } catch {}
  }, []);

  // Heat status determination
  const isHighHeat = state.heat >= 75;
  const isCriticalHeat = state.heat >= 90;

  return (
    <header className="sticky top-0 z-40 w-full glass-header bg-black/85 backdrop-blur-md border-b border-gold/25 shadow-[0_4px_30px_rgba(0,0,0,0.7)] px-3 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Syndicate Branding & Level */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.4)] shrink-0 bg-black">
              <img src="/ept-logo.jpg" alt="EPT Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black tracking-wider uppercase bg-gradient-to-r from-gold via-white to-gold bg-clip-text text-transparent">
                  E.P.T. Syndicate
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 border border-gold/40 text-gold-glow">
                  TIER {state.reputation}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-zinc-400 font-mono">
                  Boss: <strong className="text-white">{activePlayer || 'High Roller'}</strong>
                </span>
                <span className="text-zinc-600">•</span>
                <button
                  onClick={onOpenTerritories}
                  className="flex items-center gap-1 text-[10px] text-gold-glow hover:text-white bg-gold/10 hover:bg-gold/20 px-2 py-0.5 rounded-md border border-gold/30 transition-colors cursor-pointer font-bold"
                  title="Travel & expand territories"
                >
                  <MapPin size={11} className="text-gold shrink-0" />
                  <span>{state.districts?.[state.currentDistrictId]?.name || 'Downtown'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Audio, Achievements & Settings on Mobile */}
          <div className="flex items-center gap-1.5 md:hidden shrink-0">
            <button
              onClick={onOpenAchievements}
              aria-label="Achievements"
              className="relative min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-gold transition-colors active:scale-95"
            >
              <Trophy size={16} />
              {unclaimedAchievementsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold text-black font-black text-[8px] flex items-center justify-center animate-bounce shadow-[0_0_6px_rgba(212,175,55,0.8)]">
                  {unclaimedAchievementsCount}
                </span>
              )}
            </button>
            <button
              onClick={onToggleSound}
              aria-label={state.settings.soundEnabled ? "Mute audio" : "Enable audio"}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-gold transition-colors active:scale-95"
            >
              {state.settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={onOpenSettings}
              aria-label="Open settings"
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-gold transition-colors active:scale-95"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Center: Currencies Bar (Responsive Touch-Friendly Grid) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 w-full md:w-auto">
          
          {/* 1. Dirty Cash */}
          <div className="glass-panel px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border-white/10 flex flex-col min-w-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              Dirty Cash
            </span>
            <span className="text-xs sm:text-base md:text-lg font-black text-white font-mono tracking-tight glow-emerald truncate">
              {formatMoney(state.cash, state.settings.scientificNotation)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-emerald-400/90 font-mono truncate">
              +{formatMoney(rates.cashPerSec)}/s
            </span>
          </div>

          {/* 2. Casino Chips */}
          <div className="glass-panel px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border-white/10 flex flex-col min-w-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
              Chips
            </span>
            <span className="text-xs sm:text-base md:text-lg font-black text-gold-glow font-mono tracking-tight glow-gold truncate">
              {formatChips(state.chips, state.settings.scientificNotation)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-amber-300/80 font-mono truncate">
              +{formatChips(rates.chipsPerSec)}/s
            </span>
          </div>

          {/* 3. Clean Equity */}
          <div className="glass-panel px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border-white/10 flex flex-col min-w-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
              Clean Equity
            </span>
            <span className="text-xs sm:text-base md:text-lg font-black text-cyan-300 font-mono tracking-tight glow-cyan truncate">
              {formatEquity(state.equity, state.settings.scientificNotation)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-cyan-400/80 font-mono truncate">
              Wash: {formatMoney(rates.washCapacityPerSec)}/s
            </span>
          </div>

        </div>

        {/* Right: Actions Strip (Scrollable on Mobile, Aligned on Desktop) */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none py-0.5 justify-start md:justify-end">
          
          {/* Heat Meter */}
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shrink-0 transition-all duration-300 ${
            isCriticalHeat 
              ? 'bg-red-950/70 border-red-500/80 shadow-[0_0_15px_rgba(230,57,70,0.6)] animate-pulse' 
              : isHighHeat 
              ? 'bg-orange-950/50 border-orange-500/60' 
              : 'glass-panel border-white/10'
          }`}>
            <div className="flex flex-col items-start min-w-[65px]">
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                {isCriticalHeat ? (
                  <ShieldAlert size={12} className="text-red-400 animate-bounce shrink-0" />
                ) : (
                  <Flame size={12} className={isHighHeat ? 'text-orange-400 shrink-0' : 'text-zinc-400 shrink-0'} />
                )}
                <span className={isCriticalHeat ? 'text-red-400' : isHighHeat ? 'text-orange-400' : 'text-zinc-400'}>
                  Heat: {Math.floor(state.heat)}%
                </span>
              </div>
              <div className="w-16 sm:w-20 h-1.5 bg-black/60 rounded-full overflow-hidden mt-1 border border-white/10">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isCriticalHeat ? 'bg-ept-red' : isHighHeat ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${state.heat}%` }}
                />
              </div>
            </div>
          </div>

          {/* Post-Reset Quick Actions */}
          {hasWheelUnlocked && onOpenWheel && (
            <button
              onClick={onOpenWheel}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-95 ${
                isWheelReady
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-charcoal-dark border-gold shadow-[0_0_15px_rgba(234,179,8,0.6)] animate-pulse hover:brightness-110'
                  : 'bg-white/5 hover:bg-white/10 text-gold border-gold/30'
              }`}
              title="Golden Syndicate Lucky Wheel"
            >
              <Target size={14} className={isWheelReady ? 'animate-spin' : ''} style={{ animationDuration: '8s' }} />
              <span>Wheel</span>
              {isWheelReady && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-0.5 -right-0.5 animate-ping" />
              )}
            </button>
          )}

          {hasHeistsUnlocked && onOpenHeists && (
            <button
              onClick={onOpenHeists}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 active:scale-95"
              title="Tactical Vault Heists Operations Board"
            >
              <Crosshair size={14} />
              <span>Heists</span>
            </button>
          )}

          {hasCabinetUnlocked && onOpenCabinet && (
            <button
              onClick={onOpenCabinet}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 active:scale-95"
              title="The Shadow Cartel Cabinet"
            >
              <Building size={14} />
              <span>Cabinet</span>
            </button>
          )}

          {/* Emergency Bribe Button when Heat >= 80% */}
          {state.heat >= 80 && (
            <button
              onClick={onBribeChief}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(234,88,12,0.8)] animate-pulse transition-transform active:scale-95 cursor-pointer border border-orange-400/60 shrink-0"
              title="Slide a cash envelope across the commissioner's desk! 85% Chance: -35% Heat | 15% Chance: Police Sting"
            >
              <Briefcase size={13} />
              <span className="hidden sm:inline">Bribe Chief</span>
              <span className="sm:hidden">Bribe</span>
              <span className="bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-300">
                {formatMoney(getBribeCost(state))}
              </span>
            </button>
          )}

          {/* Prestige (Strip Buyout) Button */}
          <button
            onClick={onOpenPrestige}
            title={potentialTokens > 0 
              ? `Strip Buyout Ready! Liquidation value: +${potentialTokens} Mob Tokens` 
              : 'Strip Buyout requires 💎 2.5K Clean Equity (Launder cash in Front Businesses)'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-gold to-yellow-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Sparkles size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">Strip Buyout</span>
            <span className="sm:hidden">Buyout</span>
            {potentialTokens > 0 && (
              <span className="bg-black/80 text-gold px-1.5 py-0.5 rounded text-[10px] font-mono ml-0.5">
                +{potentialTokens}
              </span>
            )}
          </button>

          {/* Desktop Audio, Achievements & Settings Buttons */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={onOpenAchievements}
              aria-label="Syndicate Achievements"
              className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
              title="Syndicate Achievements & Rewards"
            >
              <Trophy size={16} />
              {unclaimedAchievementsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-black font-black text-[9px] flex items-center justify-center animate-bounce shadow-[0_0_8px_rgba(212,175,55,0.8)]">
                  {unclaimedAchievementsCount}
                </span>
              )}
            </button>
            <button
              onClick={onToggleSound}
              aria-label={state.settings.soundEnabled ? "Mute audio" : "Enable audio"}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
              title={state.settings.soundEnabled ? "Mute Audio" : "Unmute Audio"}
            >
              {state.settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={onOpenSettings}
              aria-label="Open settings"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
              title="Settings & Save Code"
            >
              <Settings size={16} />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
