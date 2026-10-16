'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { playJackpotSound, playWinSound } from '@/lib/vegas/VegasAudio';

interface Props {
  winAmount: number | null;
  title?: string;
  isJackpot?: boolean;
  onComplete?: () => void;
}

export default function VegasWinSplash({
  winAmount,
  title,
  isJackpot = false,
  onComplete,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [animatedCount, setAnimatedCount] = useState(0);

  useEffect(() => {
    if (!winAmount || winAmount <= 0) {
      setVisible(false);
      return;
    }

    setVisible(true);
    if (isJackpot || winAmount >= 1000) {
      playJackpotSound();
    } else {
      playWinSound();
    }

    // Number rollup animation
    const startTime = Date.now();
    const duration = 1200; // 1.2s roll
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedCount(Math.floor(winAmount * ease));

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 30);

    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [winAmount, isJackpot, onComplete]);

  if (!visible || !winAmount || winAmount <= 0) return null;

  const isMega = isJackpot || winAmount >= 500;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden animate-in fade-in duration-300">
      {/* Golden backdrop flash */}
      <div className="absolute inset-0 bg-gold/10 backdrop-blur-[2px] animate-pulse" />

      {/* Floating Golden Coin Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => {
          const left = `${(i * 4.2 + (i % 3) * 2) % 100}%`;
          const delay = `${(i * 0.12).toFixed(2)}s`;
          const duration = `${(1.8 + (i % 4) * 0.4).toFixed(2)}s`;
          return (
            <div
              key={i}
              className="absolute text-2xl select-none animate-bounce"
              style={{
                left,
                top: `${(i % 5) * 15}%`,
                animationDelay: delay,
                animationDuration: duration,
              }}
            >
              {i % 3 === 0 ? '🪙' : i % 3 === 1 ? '✨' : '💰'}
            </div>
          );
        })}
      </div>

      {/* Center Big Win Card */}
      <div className="relative bg-gradient-to-b from-zinc-900/95 via-black/95 to-zinc-950/95 border-4 border-gold rounded-3xl p-6 sm:p-10 shadow-[0_0_60px_rgba(212,175,55,0.8)] text-center space-y-3 transform scale-100 animate-in zoom-in-75 duration-300 max-w-sm sm:max-w-md mx-4">
        {/* Glow halo */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#ffd700] via-[#cfb53b] to-[#ffd700] blur-xl opacity-50 -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gold/20 border border-gold text-gold font-mono text-xs font-black uppercase tracking-widest">
          {isMega ? <Trophy size={16} className="text-gold" /> : <Sparkles size={16} />}
          <span>{title || (isMega ? '🚨 MEGA BIG WIN! 🚨' : '🎉 WINNER! 🎉')}</span>
        </div>

        <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#fff6cc] via-[#ffd700] to-[#b38600] drop-shadow-[0_4px_12px_rgba(212,175,55,0.6)]">
          +£{animatedCount.toLocaleString()}
        </div>

        <div className="text-xs uppercase font-mono tracking-widest text-zinc-400 font-bold">
          Added to your Academy Bankroll
        </div>
      </div>
    </div>
  );
}
