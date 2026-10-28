'use client';

import React from 'react';
import { playChipSound } from '@/lib/vegas/VegasAudio';
import { triggerHaptic } from '@/lib/vegas/VegasHaptics';
import { useKonamiHighRoller } from '@/components/EasterEggs';

export type ChipValue = 5 | 10 | 25 | 50 | 100 | 500 | 1000 | 5000 | number;

interface ChipColors {
  main: string;
  edge: string;
  stripe: string;
  border: string;
  text: string;
  innerBorder: string;
}

function getChipColors(val: number): ChipColors {
  if (val <= 5) {
    return {
      main: 'from-red-500 via-red-600 to-red-800',
      edge: 'border-red-900',
      stripe: 'bg-white',
      border: 'border-white',
      text: 'text-red-700',
      innerBorder: 'border-red-400',
    };
  }
  if (val <= 10) {
    return {
      main: 'from-blue-500 via-blue-600 to-blue-800',
      edge: 'border-blue-950',
      stripe: 'bg-white',
      border: 'border-white',
      text: 'text-blue-700',
      innerBorder: 'border-blue-400',
    };
  }
  if (val <= 25) {
    return {
      main: 'from-emerald-500 via-emerald-600 to-emerald-800',
      edge: 'border-emerald-950',
      stripe: 'bg-white',
      border: 'border-white',
      text: 'text-emerald-700',
      innerBorder: 'border-emerald-400',
    };
  }
  if (val <= 50) {
    return {
      main: 'from-amber-500 via-orange-500 to-orange-700',
      edge: 'border-orange-950',
      stripe: 'bg-white',
      border: 'border-white',
      text: 'text-orange-700',
      innerBorder: 'border-orange-400',
    };
  }
  if (val <= 100) {
    return {
      main: 'from-zinc-800 via-zinc-900 to-black',
      edge: 'border-zinc-950',
      stripe: 'bg-white',
      border: 'border-white',
      text: 'text-zinc-900',
      innerBorder: 'border-zinc-400',
    };
  }
  if (val <= 250) {
    return {
      main: 'from-pink-500 via-fuchsia-600 to-rose-700',
      edge: 'border-pink-950',
      stripe: 'bg-white',
      border: 'border-white',
      text: 'text-pink-700',
      innerBorder: 'border-pink-400',
    };
  }
  if (val <= 500) {
    // 500 High Roller (Royal Purple & Gold)
    return {
      main: 'from-purple-600 via-purple-800 to-indigo-950',
      edge: 'border-purple-950',
      stripe: 'bg-gold',
      border: 'border-gold',
      text: 'text-purple-900',
      innerBorder: 'border-gold',
    };
  }
  if (val <= 1000) {
    // £1,000 Konami VIP Whale (24K Liquid Gold)
    return {
      main: 'from-[#ffd700] via-[#d4af37] to-[#8a6508]',
      edge: 'border-yellow-200',
      stripe: 'bg-zinc-950',
      border: 'border-white',
      text: 'text-amber-900',
      innerBorder: 'border-amber-600',
    };
  }
  // £5,000+ Konami Diamond Cranberry / Platinum Whale
  return {
    main: 'from-rose-600 via-red-900 to-zinc-950',
    edge: 'border-[#ffd700]',
    stripe: 'bg-cyan-300',
    border: 'border-[#ffd700]',
    text: 'text-rose-950',
    innerBorder: 'border-[#ffd700]',
  };
}

interface ChipProps {
  value: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  stacked?: boolean;
}

export default function VegasChip({
  value,
  size = 'md',
  selected = false,
  disabled = false,
  onClick,
  className = '',
  stacked = false,
}: ChipProps) {
  const colors = getChipColors(value);

  const sizeStyles = {
    xs: {
      container: 'w-6 h-6 text-[8px]',
      inner: 'w-4 h-4',
      stripes: 'w-1 h-0.5',
    },
    sm: {
      container: 'w-8 h-8 text-[10px]',
      inner: 'w-5.5 h-5.5',
      stripes: 'w-1.5 h-0.5',
    },
    md: {
      container: 'w-11 h-11 text-xs',
      inner: 'w-7.5 h-7.5',
      stripes: 'w-2 h-1',
    },
    lg: {
      container: 'w-14 h-14 text-sm',
      inner: 'w-9.5 h-9.5',
      stripes: 'w-2.5 h-1.5',
    },
  }[size];

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || !onClick) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    triggerHaptic(15);
    playChipSound();
    onClick();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (disabled || !onClick) return;
          triggerHaptic(15);
          playChipSound();
          onClick();
        }
      }}
      style={{ touchAction: 'manipulation' }}
      className={`group relative rounded-full select-none transition-all duration-150 shrink-0 font-mono font-black touch-manipulation ${
        sizeStyles.container
      } ${
        onClick && !disabled
          ? 'cursor-pointer hover:scale-105 active:scale-95'
          : 'cursor-default'
      } ${
        selected
          ? '-translate-y-1 ring-4 ring-gold shadow-[0_0_20px_rgba(212,175,55,0.7)]'
          : 'shadow-[0_4px_8px_rgba(0,0,0,0.6)]'
      } ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : ''} ${className}`}
    >
      {/* 3D Chip Rim Shadow & Outer Bevel */}
      <div
        className={`w-full h-full rounded-full bg-gradient-to-br ${colors.main} p-0.5 border-2 ${colors.edge} shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_inset_0_-2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden`}
      >
        {/* Striped Serrated Edges (6 dashes around the perimeter) */}
        <div className="absolute inset-0 pointer-events-none">
          <span
            className={`absolute top-0 left-1/2 -translate-x-1/2 ${sizeStyles.stripes} ${colors.stripe} rounded-b-sm`}
          />
          <span
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${sizeStyles.stripes} ${colors.stripe} rounded-t-sm`}
          />
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 ${sizeStyles.stripes} ${colors.stripe} rounded-r-sm rotate-90`}
          />
          <span
            className={`absolute right-0 top-1/2 -translate-y-1/2 ${sizeStyles.stripes} ${colors.stripe} rounded-l-sm rotate-90`}
          />
          <span
            className={`absolute top-1 left-1 ${sizeStyles.stripes} ${colors.stripe} rotate-45 rounded-sm`}
          />
          <span
            className={`absolute bottom-1 right-1 ${sizeStyles.stripes} ${colors.stripe} rotate-45 rounded-sm`}
          />
        </div>

        {/* Inner Circle Inlay - High Contrast White Casino Disc */}
        <div
          className={`rounded-full bg-white border border-dashed ${colors.innerBorder} flex items-center justify-center ${sizeStyles.inner} shadow-[inset_0_1px_2px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.3)]`}
        >
          <span className={`${colors.text} font-black tracking-tight leading-none`}>
            {value >= 1000 ? `${value / 1000}k` : value}
          </span>
        </div>

        {/* Specular Glaze Light Sweep */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none rounded-full" />
      </div>
    </button>
  );
}

/**
 * Chip Rack Bar for wagering (unlocks £500, £1k & £5k Whale chips in Konami High Roller Mode)
 */
export function VegasChipRack({
  values = [5, 10, 25, 50, 100, 250],
  selectedValue,
  onSelect,
  disabled = false,
  className = '',
}: {
  values?: number[];
  selectedValue: number;
  onSelect: (v: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  const { isHighRoller } = useKonamiHighRoller();
  const displayValues = isHighRoller
    ? Array.from(new Set([...values, 500, 1000, 5000])).sort((a, b) => a - b)
    : values;

  return (
    <div
      style={{ touchAction: 'pan-x' }}
      className={`inline-flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded-2xl bg-black/80 border ${
        isHighRoller ? 'border-[#ffd700]/60 shadow-[0_0_20px_rgba(255,215,0,0.2)]' : 'border-white/10 shadow-2xl'
      } backdrop-blur-md max-w-full overflow-x-auto touch-pan-x select-none ${className}`}
    >
      <span className="text-[10px] uppercase font-bold text-zinc-400 pl-1 pr-1 hidden sm:inline shrink-0">
        {isHighRoller ? '👑 VIP:' : 'Bet:'}
      </span>
      {displayValues.map((val) => (
        <VegasChip
          key={val}
          value={val}
          size="md"
          selected={selectedValue === val}
          disabled={disabled}
          onClick={() => onSelect(val)}
        />
      ))}
    </div>
  );
}

/**
 * 3D Chip Stack on felt table bet spots
 */
export function VegasChipStack({
  amount,
  size = 'sm',
  className = '',
}: {
  amount: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  if (amount <= 0) return null;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Visual stacked layers if over £50 */}
      {amount >= 50 && (
        <div className="absolute -top-1 left-0.5 pointer-events-none opacity-80">
          <VegasChip value={amount} size={size} />
        </div>
      )}
      <VegasChip value={amount} size={size} />
    </div>
  );
}
