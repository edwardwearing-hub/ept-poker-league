'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Dices, 
  Sparkles, 
  Zap, 
  Flame, 
  TrendingUp, 
  Trophy 
} from 'lucide-react';
import { GameState, ActiveClickResult } from '@/game/types';
import { executeActiveDeal, formatMoney, formatChips } from '@/game/engine';
import { playSound } from '@/game/sound';

interface Props {
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
}

interface FloatingText {
  id: number;
  text: string;
  isCrit: boolean;
  x: number;
  y: number;
}

export default function ActivePlayArea({ state, onStateUpdate }: Props) {
  const [lastHand, setLastHand] = useState<string>('Ready to Deal');
  const [lastGain, setLastGain] = useState<{ cash: number; chips: number } | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isPressing, setIsPressing] = useState(false);

  const handleDeal = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { nextState, result } = executeActiveDeal(state);
    onStateUpdate(nextState);

    // Audio cues
    if (result.isCrit) {
      playSound.jackpot(state.settings.soundEnabled);
      if (state.settings.particlesEnabled) {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#FFE578', '#22C55E', '#FFFFFF'],
        });
      }
    } else {
      playSound.card(state.settings.soundEnabled);
    }

    setLastHand(result.handName);
    setLastGain({ cash: result.cashGained, chips: result.chipsGained });

    // Floating text feedback
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const newFloat: FloatingText = {
      id: Date.now() + Math.random(),
      text: result.isCrit 
        ? `🔥 ${result.handName}! +${formatMoney(result.cashGained)}` 
        : `+${formatMoney(result.cashGained)}`,
      isCrit: result.isCrit,
      x: clickX,
      y: clickY,
    };

    setFloatingTexts((prev) => [...prev.slice(-6), newFloat]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== newFloat.id));
    }, 800);
  };

  return (
    <div className="glass-panel-gold rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-gold/30">
      
      {/* Cinematic Casino Table Backdrop */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <img 
          src="/images/hero_dealer_desk.jpg" 
          alt="Underground Casino Desk" 
          className="w-full h-full object-cover object-center filter brightness-90 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-charcoal-dark/90 to-charcoal-dark/75" />
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Left: Interactive Action Desk */}
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto">
          
          {/* Main Deal Button */}
          <div className="relative">
            <button
              onClick={handleDeal}
              onMouseDown={() => setIsPressing(true)}
              onMouseUp={() => setIsPressing(false)}
              onMouseLeave={() => setIsPressing(false)}
              onTouchStart={() => setIsPressing(true)}
              onTouchEnd={() => setIsPressing(false)}
              className={`group relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-br from-charcoal-dark via-charcoal-light to-charcoal-dark border-2 border-gold/50 shadow-[0_0_25px_rgba(212,175,55,0.25)] flex flex-col items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none touch-manipulation active:scale-95 ${
                isPressing ? 'scale-95 border-gold-glow shadow-[0_0_35px_rgba(212,175,55,0.6)]' : 'hover:scale-102 hover:border-gold hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]'
              }`}
            >
              {/* Inner Glowing Felt Ring */}
              <div className="absolute inset-1.5 rounded-xl border border-gold/20 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

              {/* Floating Text Overlay Inside Button */}
              {floatingTexts.map((f) => (
                <div
                  key={f.id}
                  className={`absolute pointer-events-none font-black text-xs sm:text-sm animate-float-up ${
                    f.isCrit ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,1)]' : 'text-emerald-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]'
                  }`}
                  style={{ left: `${Math.max(10, Math.min(100, f.x - 20))}px`, top: `${Math.max(10, Math.min(100, f.y - 30))}px` }}
                >
                  {f.text}
                </div>
              ))}

              <div className="p-3 rounded-full bg-gold/10 border border-gold/30 text-gold-glow group-hover:scale-110 transition-transform">
                <Dices size={28} className="animate-pulse-slow" />
              </div>

              <div className="text-center">
                <span className="block text-xs sm:text-sm font-black tracking-wider uppercase text-gold-glow">
                  DEAL HAND
                </span>
                <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">
                  Tap for Dirty Cash
                </span>
              </div>
            </button>
          </div>

          {/* Current Deal Information */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gold/20 text-gold-glow border border-gold/30 flex items-center gap-1">
                <Sparkles size={10} />
                High-Stakes Desk
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Hands: {state.stats.handsWon}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white font-mono tracking-tight flex items-center gap-2">
              {lastHand}
            </h2>

            {lastGain && (
              <div className="flex items-center gap-3 mt-1 font-mono text-xs">
                <span className="text-emerald-400 font-bold">
                  +{formatMoney(lastGain.cash)}
                </span>
                <span className="text-amber-400 font-bold">
                  +{formatChips(lastGain.chips)}
                </span>
              </div>
            )}

            <p className="text-xs text-zinc-400 mt-2 max-w-sm">
              Manual hands have a chance to hit <strong>Full House</strong> or <strong>Natural Blackjacks</strong> for massive cash multipliers and casino chips.
            </p>
          </div>

        </div>

        {/* Right: Quick Syndicate Milestones */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full lg:w-auto">
          
          <div className="glass-panel p-2.5 rounded-xl border-white/5 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
              <Trophy size={11} className="text-gold" />
              Blackjacks
            </span>
            <span className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
              {state.stats.blackjacksHit}
            </span>
          </div>

          <div className="glass-panel p-2.5 rounded-xl border-white/5 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
              <TrendingUp size={11} className="text-emerald-400" />
              Total Laundered
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-400 font-mono mt-0.5">
              {formatMoney(state.stats.totalLaundered)}
            </span>
          </div>

          <div className="glass-panel p-2.5 rounded-xl border-white/5 flex flex-col col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
              <Zap size={11} className="text-cyan-400" />
              Raids Survived
            </span>
            <span className="text-sm sm:text-base font-black text-cyan-400 font-mono mt-0.5">
              {state.stats.raidsAvoided}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
