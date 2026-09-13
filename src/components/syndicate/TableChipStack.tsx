'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Coins, Crown, Flame } from 'lucide-react';
import { formatMoney } from '@/game/engine';

interface Props {
  tableId: string;
  category: 'Underground' | 'Speakeasy' | 'Casino Floor' | 'VIP Penthouse';
  cashRate: number;
  level: number;
  unlocked: boolean;
}

const TABLE_DURATIONS: Record<string, number> = {
  'underground-dice': 1.8,
  'poker-den': 2.4,
  'speakeasy-blackjack': 3.0,
  'roulette-alley': 3.6,
  'high-roller-holdem': 4.2,
  'baccarat-penthouse': 5.0,
  'cosmic-whale-salon': 6.0,
};

const CHIP_PALETTES: Record<string, {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  suit: string;
  badgeBg: string;
}> = {
  Underground: {
    primary: '#E63946',
    secondary: '#FFFFFF',
    accent: '#D4AF37',
    glow: 'rgba(230, 57, 70, 0.4)',
    suit: '♠',
    badgeBg: 'bg-rose-950/40 text-rose-300 border-rose-500/30',
  },
  Speakeasy: {
    primary: '#1D4ED8',
    secondary: '#FFE578',
    accent: '#60A5FA',
    glow: 'rgba(29, 78, 216, 0.4)',
    suit: '♣',
    badgeBg: 'bg-blue-950/40 text-blue-300 border-blue-500/30',
  },
  'Casino Floor': {
    primary: '#16A34A',
    secondary: '#FFE578',
    accent: '#86EFAC',
    glow: 'rgba(34, 197, 94, 0.4)',
    suit: '♦',
    badgeBg: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
  },
  'VIP Penthouse': {
    primary: '#D4AF37',
    secondary: '#0A0A0A',
    accent: '#FFE578',
    glow: 'rgba(212, 175, 55, 0.5)',
    suit: '👑',
    badgeBg: 'bg-amber-950/40 text-gold-glow border-gold/40',
  },
};

const TOTAL_SLOTS = 6;

// High-fidelity vector casino poker chip component
function RealisticPokerChip({ 
  isFilled, 
  isCurrent, 
  category, 
  slotIndex 
}: { 
  isFilled: boolean; 
  isCurrent: boolean; 
  category: string; 
  slotIndex: number;
}) {
  const palette = CHIP_PALETTES[category] || CHIP_PALETTES['Underground'];

  if (!isFilled) {
    return (
      <div className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
        isCurrent 
          ? 'bg-black/60 border border-dashed border-gold/50 shadow-[0_0_10px_rgba(212,175,55,0.3)] animate-pulse' 
          : 'bg-black/40 border border-white/10 opacity-35'
      }`}>
        <span className="text-[10px] font-mono text-zinc-600 select-none">
          {slotIndex + 1}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.8)] transition-all duration-200 transform hover:scale-105 select-none"
      style={{
        boxShadow: `0 3px 12px ${palette.glow}, inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 3px rgba(0,0,0,0.6)`
      }}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow">
        {/* Outer Clay Base */}
        <circle cx="20" cy="20" r="19" fill={palette.primary} stroke="#111" strokeWidth="1.2" />

        {/* 6 Outer Edge Stripes (Realistic Casino Inserts) */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <rect
            key={deg}
            x="18.25"
            y="1"
            width="3.5"
            height="5"
            rx="0.5"
            fill={palette.secondary}
            transform={`rotate(${deg} 20 20)`}
          />
        ))}

        {/* Outer Stitch Ring */}
        <circle
          cx="20"
          cy="20"
          r="13.5"
          fill="none"
          stroke={palette.secondary}
          strokeWidth="0.8"
          strokeDasharray="2 1.5"
          opacity="0.85"
        />

        {/* Center Medallion Foil */}
        <circle
          cx="20"
          cy="20"
          r="10"
          fill="#161616"
          stroke={palette.accent}
          strokeWidth="1"
        />

        {/* Center Suit / Icon Stamp */}
        <text
          x="20"
          y="23.5"
          textAnchor="middle"
          fontSize="9"
          fontWeight="900"
          fill={palette.accent}
          fontFamily="system-ui, sans-serif"
        >
          {palette.suit}
        </text>

        {/* Glossy Upper Highlight Reflection */}
        <path
          d="M 5 20 A 15 15 0 0 1 35 20 A 15 11 0 0 0 5 20"
          fill="white"
          opacity="0.22"
        />
      </svg>
    </div>
  );
}

export default function TableChipStack({ tableId, category, cashRate, level, unlocked }: Props) {
  const [progress, setProgress] = useState(0);
  const [payoutPop, setPayoutPop] = useState<string | null>(null);
  const [isRaking, setIsRaking] = useState(false);

  const durationSec = TABLE_DURATIONS[tableId] || 3.0;
  const cyclePayout = cashRate * durationSec;
  const palette = CHIP_PALETTES[category] || CHIP_PALETTES['Underground'];

  const lastTimeRef = useRef(performance.now());
  const progressRef = useRef(0);

  useEffect(() => {
    if (!unlocked || level <= 0) return;

    let animId: number;

    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      progressRef.current += delta / durationSec;

      if (progressRef.current >= 1.0) {
        progressRef.current = 0;
        setIsRaking(true);
        setPayoutPop(`+${formatMoney(cyclePayout)}`);

        setTimeout(() => setIsRaking(false), 300);
        setTimeout(() => setPayoutPop(null), 1100);
      }

      setProgress(progressRef.current);
      animId = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [unlocked, level, durationSec, cyclePayout]);

  if (!unlocked || level <= 0) return null;

  // Exact number of chips filled in the tray
  const filledCount = Math.min(TOTAL_SLOTS, Math.floor(progress * TOTAL_SLOTS));
  const currentSlotIndex = Math.min(TOTAL_SLOTS - 1, Math.floor(progress * TOTAL_SLOTS));
  const currentSlotProgress = (progress * TOTAL_SLOTS) % 1;

  return (
    <div className={`mt-3.5 p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
      isRaking 
        ? 'bg-amber-950/40 border-gold shadow-[0_0_25px_rgba(212,175,55,0.4)]' 
        : 'bg-black/60 border-white/10 hover:border-white/20 shadow-inner'
    }`}>

      {/* Floating Pot Payout Alert */}
      {payoutPop && (
        <div className="absolute right-4 top-2 font-black text-sm sm:text-base font-mono text-gold-glow animate-float-up pointer-events-none drop-shadow-[0_0_10px_rgba(212,175,55,1)] z-30 flex items-center gap-1">
          <Sparkles size={16} />
          {payoutPop}
        </div>
      )}

      {/* Rake Sweep Golden Light Wave */}
      {isRaking && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/30 to-transparent pointer-events-none animate-pulse" />
      )}

      {/* Header: Chip Tray Label & Pot Value */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${palette.badgeBg}`}>
            <Coins size={11} />
            <span>Dealer Chip Tray</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Rake: <strong className="text-white font-bold">{durationSec.toFixed(1)}s</strong>
          </span>
        </div>

        <div className="flex items-center gap-1 text-right">
          <span className="text-[10px] uppercase font-bold text-zinc-400 hidden sm:inline">Cycle Pot:</span>
          <span className="text-xs sm:text-sm font-black font-mono text-emerald-400">
            +{formatMoney(cyclePayout)}
          </span>
        </div>
      </div>

      {/* Physical Casino Chip Tray Slots */}
      <div className="relative p-2 rounded-xl bg-gradient-to-b from-charcoal-dark to-charcoal border border-white/10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5 items-center justify-items-center">
          {Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
            const isFilled = index < filledCount;
            const isCurrent = index === currentSlotIndex;

            return (
              <div key={index} className="relative flex flex-col items-center">
                <RealisticPokerChip
                  isFilled={isFilled}
                  isCurrent={isCurrent}
                  category={category}
                  slotIndex={index}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Continuous Fluid Under-Tray Progress Bar */}
      <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden border border-white/10 mt-2">
        <div
          className={`h-full transition-all duration-75 ${
            isRaking 
              ? 'bg-gold-glow shadow-[0_0_12px_rgba(212,175,55,1)]' 
              : 'bg-gradient-to-r from-emerald-500 via-gold to-emerald-400'
          }`}
          style={{ width: `${Math.floor(progress * 100)}%` }}
        />
      </div>

    </div>
  );
}
