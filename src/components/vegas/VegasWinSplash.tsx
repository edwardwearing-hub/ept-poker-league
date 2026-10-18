'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, X, Flame, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playJackpotSound, playWinSound, playSlotTick } from '@/lib/vegas/VegasAudio';
import { triggerHaptic } from '@/lib/vegas/VegasHaptics';

export interface VegasWinDetails {
  title?: string;
  subtitle?: string;
  winDetail?: string;
  badge?: string;
}

interface Props {
  winAmount: number | null;
  title?: string;
  subtitle?: string;
  winDetail?: string;
  badge?: string;
  isJackpot?: boolean;
  durationMs?: number;
  onComplete?: () => void;
}

export default function VegasWinSplash({
  winAmount,
  title,
  subtitle,
  winDetail,
  badge,
  isJackpot = false,
  durationMs = 3200,
  onComplete,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [animatedCount, setAnimatedCount] = useState(0);

  const handleClose = () => {
    setVisible(false);
    onComplete?.();
  };

  useEffect(() => {
    if (!winAmount || winAmount <= 0) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const isEpic = isJackpot || winAmount >= 1000;
    const isMega = !isEpic && winAmount >= 500;
    const isBig = !isEpic && !isMega && winAmount >= 200;

    // Trigger audio & mobile tactile haptics
    if (isEpic) {
      playJackpotSound();
      triggerHaptic('jackpot');
    } else if (isMega || isBig) {
      playWinSound();
      triggerHaptic('big_win');
    } else {
      playWinSound();
      triggerHaptic('win');
    }

    // Trigger WebGL Canvas-Confetti Particle Explosions
    try {
      if (isEpic) {
        // Double cannon confetti barrage
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#ffae00', '#ffffff', '#eab308', '#f59e0b'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.7 },
            colors: ['#ffd700', '#f59e0b', '#ec4899'],
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.7 },
            colors: ['#ffd700', '#f59e0b', '#3b82f6'],
          });
        }, 300);
      } else if (isMega) {
        confetti({
          particleCount: 80,
          spread: 75,
          origin: { y: 0.65 },
          colors: ['#ffd700', '#a855f7', '#ec4899', '#fde047'],
        });
      } else if (isBig) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#ffd700', '#f59e0b', '#ffffff'],
        });
      }
    } catch {
      // Ignore in non-browser or test runner
    }

    // Number rollup animation with subtle ticking sound
    const startTime = Date.now();
    const rollDuration = Math.min(1200, durationMs * 0.5);
    let lastTickVal = 0;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / rollDuration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currVal = Math.floor(winAmount * ease);
      setAnimatedCount(currVal);

      // Play subtle tick on significant jumps
      if (currVal - lastTickVal >= Math.max(10, Math.floor(winAmount / 20))) {
        lastTickVal = currVal;
        playSlotTick();
        triggerHaptic('tick');
      }

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 30);

    // Auto-dismiss timer (default 3.2 seconds)
    const timer = setTimeout(() => {
      handleClose();
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [winAmount, isJackpot, durationMs]);

  if (!visible || !winAmount || winAmount <= 0) return null;

  const isEpic = isJackpot || winAmount >= 1000;
  const isMega = !isEpic && winAmount >= 500;
  const isBig = !isEpic && !isMega && winAmount >= 200;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer select-none"
    >
      {/* Golden backdrop ambient radial glow */}
      <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-black/40 pointer-events-none animate-pulse" />

      {/* Floating Golden Coin Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => {
          const left = `${(i * 5 + (i % 3) * 2) % 100}%`;
          const delay = `${(i * 0.1).toFixed(2)}s`;
          const duration = `${(1.6 + (i % 3) * 0.4).toFixed(2)}s`;
          return (
            <div
              key={i}
              className="absolute text-2xl select-none animate-bounce"
              style={{
                left,
                top: `${(i % 5) * 16}%`,
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
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className={`relative bg-gradient-to-b from-zinc-900/95 via-black/95 to-zinc-950/95 rounded-3xl p-5 sm:p-8 text-center space-y-3 transform scale-100 animate-in zoom-in-75 duration-200 max-w-sm sm:max-w-md w-full cursor-pointer transition ${
          isEpic
            ? 'border-4 border-yellow-400 shadow-[0_0_80px_rgba(251,191,36,0.9),inset_0_0_30px_rgba(251,191,36,0.3)] ring-4 ring-yellow-400/50'
            : isMega
            ? 'border-3 border-fuchsia-500 shadow-[0_0_70px_rgba(217,70,239,0.8),inset_0_0_20px_rgba(217,70,239,0.2)] ring-2 ring-fuchsia-400/40'
            : isBig
            ? 'border-3 border-gold shadow-[0_0_60px_rgba(212,175,55,0.7)]'
            : 'border-2 border-emerald-500/80 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
        }`}
      >
        {/* Glow halo */}
        <div
          className={`absolute -inset-1 rounded-3xl blur-xl opacity-60 -z-10 ${
            isEpic
              ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-red-500 animate-pulse'
              : isMega
              ? 'bg-gradient-to-r from-fuchsia-500 via-purple-600 to-pink-500'
              : 'bg-gradient-to-r from-[#ffd700] via-[#cfb53b] to-[#ffd700]'
          }`}
        />

        {/* Quick Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition"
          title="Dismiss (or click anywhere)"
        >
          <X size={15} />
        </button>

        {/* Top Win Pill / Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full font-mono text-xs font-black uppercase tracking-widest ${
            isEpic
              ? 'bg-yellow-400/20 border-2 border-yellow-400 text-yellow-300 shadow-[0_0_15px_#fde047]'
              : isMega
              ? 'bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-300 shadow-[0_0_12px_#e879f9]'
              : isBig
              ? 'bg-gold/20 border border-gold text-gold shadow-[0_0_10px_#d4af37]'
              : 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
          }`}
        >
          {isEpic ? (
            <Crown size={15} className="text-yellow-300 animate-bounce" />
          ) : isMega ? (
            <Flame size={15} className="text-fuchsia-400 animate-pulse" />
          ) : isBig ? (
            <Trophy size={14} className="text-gold" />
          ) : (
            <Sparkles size={14} className="text-emerald-400" />
          )}
          <span>
            {title ||
              (isEpic
                ? '👑 SENSATIONAL JACKPOT! 👑'
                : isMega
                ? '🚨 MEGA BIG WIN! 🚨'
                : isBig
                ? '💰 BIG WIN! 💰'
                : '🎉 WINNER! 🎉')}
          </span>
        </div>

        {/* Amount Won */}
        <div
          className={`text-4xl sm:text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text drop-shadow-[0_4px_12px_rgba(212,175,55,0.6)] ${
            isEpic
              ? 'bg-gradient-to-b from-[#fffbeb] via-[#fde047] to-[#d97706]'
              : isMega
              ? 'bg-gradient-to-b from-[#fae8ff] via-[#e879f9] to-[#c026d3]'
              : 'bg-gradient-to-b from-[#fff6cc] via-[#ffd700] to-[#b38600]'
          }`}
        >
          +£{animatedCount.toLocaleString()}
        </div>

        {/* HOW THEY WON: Subtitle / Hit Breakdown */}
        {subtitle && (
          <div className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
            <span>{subtitle}</span>
          </div>
        )}

        {/* Detailed Breakdown of Winning Hits / Symbols */}
        {winDetail && (
          <div className="p-2.5 rounded-xl bg-black/70 border border-gold/30 text-xs text-amber-200 font-mono leading-relaxed max-h-24 overflow-y-auto">
            {winDetail}
          </div>
        )}

        {badge && (
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
            {badge}
          </div>
        )}

        <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-medium pt-1 flex items-center justify-center gap-1">
          <span>Tap anywhere to dismiss</span>
          <span>•</span>
          <span>Auto-closing in 3s</span>
        </div>

        {/* Shrinking Auto-Dismiss Progress Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
            style={{
              animation: `shrinkWidth ${durationMs}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
