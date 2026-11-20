'use client';

import React, { useState } from 'react';

interface Props {
  value: number; // 1 to 6
  rolling?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CrapsDiceVisual({
  value,
  rolling = false,
  size = 'md',
  className = '',
}: Props) {
  const [imgError, setImgError] = useState(false);
  const clampedVal = Math.max(1, Math.min(6, Math.round(value) || 1));

  const sizeStyles = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-18 h-18 sm:w-20 sm:h-20',
  }[size];

  const dotSize = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
    lg: 'w-3.5 h-3.5',
  }[size];

  // Render authentic casino dice pips (vector fallback)
  const renderPips = (val: number) => {
    switch (val) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`} />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex justify-between p-0.5">
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] self-start`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] self-end`} />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex justify-between p-0.5">
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] self-start`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] self-center`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] self-end`} />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 justify-items-center items-center">
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`} />
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 justify-items-center items-center">
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] col-start-1 row-start-1`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] col-start-3 row-start-1`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] col-start-2 row-start-2`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] col-start-1 row-start-3`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] col-start-3 row-start-3`} />
          </div>
        );
      case 6:
      default:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-3 justify-items-center items-center gap-0.5">
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`} />
            <span className={`${dotSize} rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`} />
          </div>
        );
    }
  };

  return (
    <div
      className={`relative select-none ${sizeStyles} transition-all duration-150 ${
        rolling ? 'animate-bounce scale-110 -rotate-12 filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)]' : 'hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]'
      } ${className}`}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {!imgError ? (
        <img
          src={`/dice/Dice_red${clampedVal}.png`}
          alt={`Dice ${clampedVal}`}
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
          onError={() => setImgError(true)}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-red-500 via-rose-600 to-red-950 border-2 border-red-300/90 p-2 shadow-[inset_0_3px_6px_rgba(255,255,255,0.6),inset_0_-4px_8px_rgba(0,0,0,0.7)] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/35 to-transparent rounded-[inherit] pointer-events-none" />
          <div className="w-full h-full relative z-10 flex items-center justify-center">
            {renderPips(clampedVal)}
          </div>
        </div>
      )}
    </div>
  );
}
