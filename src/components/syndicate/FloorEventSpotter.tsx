'use client';

import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Crown, 
  ShieldAlert, 
  Sparkles, 
  Flame, 
  Timer, 
  Zap, 
  DollarSign 
} from 'lucide-react';
import { FloorEvent } from '@/game/types';
import { formatMoney } from '@/game/engine';
import { playSound } from '@/game/sound';

interface Props {
  event: FloorEvent | null;
  onResolve: (action: 'catch_snitch' | 'comp_vip' | 'repel_heist') => void;
  soundEnabled: boolean;
}

export default function FloorEventSpotter({ event, onResolve, soundEnabled }: Props) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!event) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((event.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [event]);

  if (!event) return null;

  const totalDuration = event.durationSeconds || 20;
  const progressRatio = Math.max(0, Math.min(1, timeLeft / totalDuration));

  const handleAction = () => {
    if (event.type === 'snitch') {
      playSound.cash(soundEnabled);
      onResolve('catch_snitch');
    } else if (event.type === 'vip') {
      playSound.jackpot(soundEnabled);
      onResolve('comp_vip');
    } else if (event.type === 'heist') {
      playSound.levelUp(soundEnabled);
      onResolve('repel_heist');
    }
  };

  const isHeist = event.type === 'heist';
  const isVip = event.type === 'vip';
  const isSnitch = event.type === 'snitch';

  return (
    <div className={`rounded-2xl p-4 border relative overflow-hidden shadow-2xl transition-all duration-300 animate-bounce ${
      isHeist 
        ? 'glass-panel-red border-red-500/80 shadow-[0_0_30px_rgba(230,57,70,0.6)]' 
        : isVip 
        ? 'glass-panel-gold border-gold shadow-[0_0_30px_rgba(212,175,55,0.5)]' 
        : 'glass-panel border-cyan-500/80 shadow-[0_0_30px_rgba(6,182,212,0.4)]'
    }`}>
      
      {/* Background Pulse Accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none animate-pulse" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        
        {/* Left: Icon & Description */}
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl border shrink-0 ${
            isHeist 
              ? 'bg-red-500/20 text-ept-red border-red-500/40 animate-spin' 
              : isVip 
              ? 'bg-gold/20 text-gold-glow border-gold/40 animate-pulse' 
              : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 animate-bounce'
          }`} style={isHeist ? { animationDuration: '8s' } : undefined}>
            {isHeist ? <ShieldAlert size={26} /> : isVip ? <Crown size={26} /> : <Eye size={26} />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                isHeist 
                  ? 'bg-red-950/60 text-red-300 border-red-500/40' 
                  : isVip 
                  ? 'bg-amber-950/60 text-gold border-gold/40' 
                  : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
              }`}>
                {isHeist ? 'EMERGENCY VAULT ALERT' : isVip ? 'HIGH-ROLLER VIP EVENT' : 'UNDERCOVER INFORMANT'}
              </span>

              <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1">
                <Timer size={12} className="text-zinc-400" />
                {timeLeft}s remaining
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black text-white mt-1">
              {event.title}
            </h3>
            <p className="text-xs text-zinc-300 max-w-xl mt-0.5">
              {event.description}
            </p>
          </div>
        </div>

        {/* Right: Urgent Action Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={handleAction}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer shadow-lg touch-manipulation flex items-center justify-center gap-2 ${
              isHeist
                ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 hover:brightness-110 text-white shadow-[0_0_20px_rgba(230,57,70,0.8)]'
                : isVip
                ? 'bg-gradient-to-r from-amber-600 via-gold to-yellow-600 hover:brightness-110 text-black shadow-[0_0_20px_rgba(212,175,55,0.7)]'
                : 'bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 hover:brightness-110 text-white shadow-[0_0_20px_rgba(6,182,212,0.7)]'
            }`}
          >
            {isHeist ? (
              <>
                <ShieldAlert size={16} />
                <span>Repel Robbery Crew!</span>
              </>
            ) : isVip ? (
              <>
                <Sparkles size={16} />
                <span>Comp VIP Drinks (+300%)!</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Interrogate Informant!</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Progress Bar Running Out */}
      <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden mt-3 border border-white/10">
        <div 
          className={`h-full transition-all duration-100 ${
            isHeist ? 'bg-ept-red' : isVip ? 'bg-gold' : 'bg-cyan-400'
          }`}
          style={{ width: `${progressRatio * 100}%` }}
        />
      </div>

    </div>
  );
}
