'use client';

import React, { useEffect, useState, useRef } from 'react';
import { playWheelTick } from '@/lib/vegas/VegasAudio';

export const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function getPocketColor(n: number): 'green' | 'red' | 'black' {
  if (n === 0) return 'green';
  return RED_NUMS.includes(n) ? 'red' : 'black';
}

interface Props {
  spinning: boolean;
  winningNumber: number | null;
  onSpinEnd?: () => void;
  className?: string;
}

export default function RouletteWheelVisual({
  spinning,
  winningNumber,
  onSpinEnd,
  className = '',
}: Props) {
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [ballRadius, setBallRadius] = useState(132); // outer rim track
  const [isDecelerating, setIsDecelerating] = useState(false);
  const tickAudioInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!spinning) {
      if (tickAudioInterval.current) {
        clearInterval(tickAudioInterval.current);
        tickAudioInterval.current = null;
      }
      setIsDecelerating(false);
      return;
    }

    // Spin start
    setIsDecelerating(false);
    setBallRadius(136); // high on outer track

    // Periodic wheel ticks
    tickAudioInterval.current = setInterval(() => {
      playWheelTick();
    }, 110);

    return () => {
      if (tickAudioInterval.current) {
        clearInterval(tickAudioInterval.current);
        tickAudioInterval.current = null;
      }
    };
  }, [spinning]);

  useEffect(() => {
    if (winningNumber === null || !spinning) return;

    // Calculate target angle so winning pocket lands at the top marker (0 deg / 12 o'clock)
    const pocketIndex = ROULETTE_NUMBERS.indexOf(winningNumber);
    if (pocketIndex === -1) return;

    const anglePerPocket = 360 / ROULETTE_NUMBERS.length;
    // Current pocket angle from 12 o'clock
    const pocketAngle = pocketIndex * anglePerPocket;

    // Spin multiple full revolutions + exact offset to land at top (0 deg)
    const fullSpins = 5 + Math.floor(Math.random() * 2);
    const targetWheelAngle = wheelRotation + fullSpins * 360 + (360 - pocketAngle);

    // Ball spins opposite direction
    const targetBallAngle = ballRotation - (fullSpins + 2) * 360;

    setIsDecelerating(true);
    setWheelRotation(targetWheelAngle);
    setBallRotation(targetBallAngle);

    // Ball drops down onto pockets towards the end
    const dropTimer = setTimeout(() => {
      setBallRadius(102); // inside pocket track
    }, 2200);

    const endTimer = setTimeout(() => {
      if (tickAudioInterval.current) {
        clearInterval(tickAudioInterval.current);
        tickAudioInterval.current = null;
      }
      onSpinEnd?.();
    }, 3200);

    return () => {
      clearTimeout(dropTimer);
      clearTimeout(endTimer);
    };
  }, [winningNumber, spinning]);

  const numCount = ROULETTE_NUMBERS.length;
  const sliceAngle = 360 / numCount;

  return (
    <div
      className={`relative flex items-center justify-center select-none w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 ${className}`}
    >
      {/* Top Center Gold Indicator Pointer */}
      <div className="absolute top-1 z-30 flex flex-col items-center pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-gold" />
      </div>

      {/* Outer Mahogany Wooden Bowl */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-950 via-[#2e140b] to-amber-950 border-8 border-amber-900 shadow-[inset_0_4px_25px_rgba(0,0,0,0.9),_0_10px_30px_rgba(0,0,0,0.8)] p-2 flex items-center justify-center">
        {/* Brass Inner Rim Ring */}
        <div className="w-full h-full rounded-full border-4 border-[#cfb53b] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] relative flex items-center justify-center overflow-hidden bg-[#180a05]">
          {/* Rotating Wheel Group */}
          <div
            className="w-[90%] h-[90%] rounded-full relative shadow-[0_0_20px_rgba(0,0,0,0.9)]"
            style={{
              transform: `rotate(${wheelRotation}deg)`,
              transition: isDecelerating
                ? 'transform 3.2s cubic-bezier(0.25, 0.1, 0.25, 1)'
                : 'transform 0.1s linear',
            }}
          >
            <svg viewBox="0 0 300 300" className="w-full h-full">
              <defs>
                <radialGradient id="brassGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff3b0" />
                  <stop offset="45%" stopColor="#ffd700" />
                  <stop offset="80%" stopColor="#b38600" />
                  <stop offset="100%" stopColor="#664d00" />
                </radialGradient>
                <radialGradient id="centerTurret" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="25%" stopColor="#ffd700" />
                  <stop offset="70%" stopColor="#997300" />
                  <stop offset="100%" stopColor="#332600" />
                </radialGradient>
              </defs>

              {/* Number Slices */}
              {ROULETTE_NUMBERS.map((num, i) => {
                const startAngle = (i * sliceAngle - 90) * (Math.PI / 180);
                const endAngle = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);
                const rOuter = 145;
                const rInner = 82;

                const x1 = 150 + rOuter * Math.cos(startAngle);
                const y1 = 150 + rOuter * Math.sin(startAngle);
                const x2 = 150 + rOuter * Math.cos(endAngle);
                const y2 = 150 + rOuter * Math.sin(endAngle);
                const x3 = 150 + rInner * Math.cos(endAngle);
                const y3 = 150 + rInner * Math.sin(endAngle);
                const x4 = 150 + rInner * Math.cos(startAngle);
                const y4 = 150 + rInner * Math.sin(startAngle);

                const d = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 0 0 ${x4} ${y4} Z`;

                const color = getPocketColor(num);
                const fillColor =
                  color === 'red' ? '#b91c1c' : color === 'black' ? '#18181b' : '#059669';

                // Mid angle for text
                const midAngle = (i + 0.5) * sliceAngle;
                const textRad = (midAngle - 90) * (Math.PI / 180);
                const textDist = 114;
                const tx = 150 + textDist * Math.cos(textRad);
                const ty = 150 + textDist * Math.sin(textRad);

                const isWinner = winningNumber === num && !spinning;

                return (
                  <g key={num}>
                    <path
                      d={d}
                      fill={fillColor}
                      stroke="#d4af37"
                      strokeWidth="0.75"
                      className={isWinner ? 'filter drop-shadow-[0_0_8px_#ffd700]' : ''}
                    />
                    <text
                      x={tx}
                      y={ty}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="900"
                      fontFamily="monospace"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${midAngle}, ${tx}, ${ty})`}
                      className="select-none"
                    >
                      {num}
                    </text>
                  </g>
                );
              })}

              {/* Inner Brass Track & Frets Ring */}
              <circle cx="150" cy="150" r="82" fill="none" stroke="#ffd700" strokeWidth="2.5" />
              <circle cx="150" cy="150" r="50" fill="url(#brassGradient)" stroke="#664d00" strokeWidth="1.5" />

              {/* 8 Brass Turret Spokes */}
              {Array.from({ length: 8 }).map((_, idx) => {
                const spokeAngle = idx * 45 * (Math.PI / 180);
                const sx1 = 150 + 20 * Math.cos(spokeAngle);
                const sy1 = 150 + 20 * Math.sin(spokeAngle);
                const sx2 = 150 + 48 * Math.cos(spokeAngle);
                const sy2 = 150 + 48 * Math.sin(spokeAngle);
                return (
                  <line
                    key={idx}
                    x1={sx1}
                    y1={sy1}
                    x2={sx2}
                    y2={sy2}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="opacity-80"
                  />
                );
              })}

              {/* Center Domed Turret Cap */}
              <circle cx="150" cy="150" r="22" fill="url(#centerTurret)" stroke="#ffffff" strokeWidth="1" />
              <circle cx="147" cy="147" r="4" fill="#ffffff" opacity="0.6" />
            </svg>
          </div>

          {/* Animated Ivory Ball */}
          {spinning && (
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              style={{
                transform: `rotate(${ballRotation}deg)`,
                transition: isDecelerating
                  ? 'transform 3.2s cubic-bezier(0.2, 0.05, 0.2, 1)'
                  : 'transform 0.1s linear',
              }}
            >
              <div
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-white via-zinc-100 to-zinc-300 border border-zinc-400 shadow-[0_0_8px_rgba(255,255,255,0.9),_0_2px_4px_rgba(0,0,0,0.8)]"
                style={{
                  transform: `translateY(-${ballRadius}px)`,
                  transition: 'transform 1.0s ease-in-out',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
