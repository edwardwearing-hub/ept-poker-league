'use client';

import React from 'react';
import { useKonamiHighRoller } from '@/components/EasterEggs';

export interface CardModel {
  rank: string;
  suit: '♠' | '♥' | '♦' | '♣' | string;
  value?: number;
}

interface Props {
  card?: CardModel | null;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  selected?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  label?: string;
  isHeld?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function VegasCard({
  card,
  faceDown = false,
  size = 'md',
  selected = false,
  highlighted = false,
  dimmed = false,
  label,
  isHeld = false,
  onClick,
  className = '',
}: Props) {
  const { isHighRoller } = useKonamiHighRoller();
  const isRed = card?.suit === '♥' || card?.suit === '♦';
  const isRoyalty = ['A', 'K', 'Q', 'J'].includes(card?.rank || '');

  const sizeClasses = {
    sm: 'w-8 h-12 text-[10px] rounded-md',
    md: 'w-11 h-16 sm:w-12 sm:h-18 text-xs rounded-lg',
    lg: 'w-14 h-20 sm:w-16 sm:h-24 text-sm rounded-xl',
    xl: 'w-18 h-26 sm:w-20 sm:h-28 text-base rounded-xl',
  }[size];

  const pipColorClass = isHighRoller
    ? isRed
      ? 'text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.65)]'
      : 'text-[#ffd700] drop-shadow-[0_0_6px_rgba(255,215,0,0.65)]'
    : isRed
    ? 'text-red-600'
    : 'text-zinc-950';

  const centerPipColorClass = isHighRoller
    ? isRed
      ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.75)]'
      : 'text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.75)]'
    : isRed
    ? 'text-red-600'
    : 'text-zinc-900';

  // 3D Card Container
  return (
    <div
      onClick={onClick}
      className={`${sizeClasses} relative select-none font-sans font-black transition-all duration-300 ease-out group animate-in fade-in slide-in-from-top-6 duration-300 ${
        onClick ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_30px_rgba(0,0,0,0.8)]' : 'cursor-default'
      } ${selected ? '-translate-y-3 ring-2 ring-gold shadow-[0_0_20px_#ffd700]' : 'shadow-[0_12px_22px_-4px_rgba(0,0,0,0.75)]'} ${
        highlighted ? 'ring-2 ring-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.85)]' : ''
      } ${dimmed ? 'opacity-40 grayscale' : 'opacity-100'} ${className}`}
      style={{ perspective: '1000px' }}
    >
      {/* Flipping 3D wrapper */}
      <div
        className={`w-full h-full relative transition-transform duration-500 rounded-[inherit] [transform-style:preserve-3d] ${
          faceDown || !card ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        }`}
      >
        {/* CARD FRONT */}
        <div
          className={`absolute inset-0 w-full h-full rounded-[inherit] border ${
            isHighRoller
              ? 'bg-gradient-to-b from-zinc-900 via-[#12100a] to-black border-[#ffd700] shadow-[inset_0_0_12px_rgba(255,215,0,0.35)]'
              : `bg-gradient-to-b from-white via-zinc-50 to-zinc-200 ${
                  isRoyalty ? 'border-amber-400/90 shadow-[inset_0_0_8px_rgba(212,175,55,0.4)]' : 'border-zinc-300'
                }`
          } flex flex-col justify-between p-1 sm:p-1.5 [backface-visibility:hidden] overflow-hidden`}
        >
          {/* Top Left Rank & Suit */}
          <div className={`leading-none flex flex-col items-start ${pipColorClass}`}>
            <span className="font-mono tracking-tighter text-[11px] sm:text-xs leading-none drop-shadow-sm font-black">
              {card?.rank}
            </span>
            <span className="text-[10px] sm:text-[11px] leading-none drop-shadow-sm">{card?.suit}</span>
          </div>

          {/* Center Suit Art */}
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none transition-transform group-hover:scale-110 ${centerPipColorClass}`}
          >
            <span className="text-xl sm:text-2xl drop-shadow-md opacity-90">{card?.suit}</span>
          </div>

          {/* Bottom Right Inverted Rank & Suit */}
          <div
            className={`leading-none flex flex-col items-end rotate-180 self-end ${pipColorClass}`}
          >
            <span className="font-mono tracking-tighter text-[11px] sm:text-xs leading-none drop-shadow-sm font-black">
              {card?.rank}
            </span>
            <span className="text-[10px] sm:text-[11px] leading-none drop-shadow-sm">{card?.suit}</span>
          </div>

          {/* Subtle glossy sheen line across top corner */}
          <div
            className={`absolute inset-0 pointer-events-none ${
              isHighRoller
                ? 'bg-gradient-to-tr from-transparent via-[#ffd700]/20 to-transparent opacity-80'
                : 'bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-60'
            }`}
          />
        </div>

        {/* CARD BACK (Classic VIP Casino Back or 24K Obsidian Crown Back) */}
        <div
          className={`absolute inset-0 w-full h-full rounded-[inherit] border-2 shadow-lg flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden ${
            isHighRoller
              ? 'bg-gradient-to-br from-zinc-950 via-[#241a04] to-black border-[#ffd700]'
              : 'bg-gradient-to-br from-blue-900 via-indigo-950 to-blue-950 border-white/40'
          }`}
        >
          <div className="w-[86%] h-[86%] rounded border-2 border-gold/60 bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:6px_6px] opacity-85 flex flex-col items-center justify-center shadow-inner">
            <span className="text-gold font-mono text-[9px] font-black uppercase tracking-widest drop-shadow">
              {isHighRoller ? '👑 24K' : 'VEGAS'}
            </span>
            <span className="text-white/60 text-[7px] uppercase font-bold tracking-tighter">
              {isHighRoller ? 'OBSIDIAN' : 'VIP CLUB'}
            </span>
          </div>
          {/* Back reflective gloss */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Video Poker HELD Stamp Badge */}
      {isHeld && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black font-mono text-[9px] uppercase tracking-wider border-2 border-white shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-bounce z-20 whitespace-nowrap">
          HELD
        </div>
      )}

      {/* Optional Top Label */}
      {label && !isHeld && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-black/85 text-[8px] font-black uppercase text-gold border border-gold/50 whitespace-nowrap shadow z-20">
          {label}
        </span>
      )}
    </div>
  );
}
