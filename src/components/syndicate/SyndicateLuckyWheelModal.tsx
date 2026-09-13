'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Crown, Clock, AlertCircle } from 'lucide-react';
import { GameState, WheelReward } from '@/game/types';
import { LUCKY_WHEEL_WEDGES } from '@/game/constants';
import { canSpinLuckyWheel, spinLuckyWheel, formatTime, formatTokens } from '@/game/engine';
import { playSound } from '@/game/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
}

export default function SyndicateLuckyWheelModal({ isOpen, onClose, state, onStateUpdate }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<WheelReward | null>(null);

  if (!isOpen) return null;

  const isFreeReady = canSpinLuckyWheel(state);
  const cooldownRemaining = state.lastWheelSpinTime
    ? Math.max(0, Math.floor((state.lastWheelSpinTime + 10 * 60 * 1000 - Date.now()) / 1000))
    : 0;

  const handleSpin = (payWithTokens: boolean) => {
    if (spinning) return;

    if (!isFreeReady && !payWithTokens) return;
    if (payWithTokens && state.mobTokens < 2) {
      alert('You need at least 2 Syndicate Tokens to spin off-cooldown!');
      return;
    }

    setSpinning(true);
    setWonReward(null);
    playSound.betPlaced(state.settings.soundEnabled);

    // Call engine logic to determine outcome
    const { nextState, reward } = spinLuckyWheel(state, payWithTokens);

    // Calculate rotation angle so the wheel stops on the selected wedge
    const wedgeIndex = LUCKY_WHEEL_WEDGES.findIndex(w => w.id === reward.id);
    const wedgeAngle = 360 / LUCKY_WHEEL_WEDGES.length;
    // Pointer is at the top (270 degrees or 0 with offset).
    // Extra rotations for excitement: 5 full turns (1800 deg)
    const extraTurns = 360 * 5;
    const targetDegree = extraTurns + (360 - (wedgeIndex * wedgeAngle + wedgeAngle / 2));

    setRotation(prev => prev + targetDegree);

    setTimeout(() => {
      setSpinning(false);
      setWonReward(reward);
      playSound.jackpot(state.settings.soundEnabled);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#10B981', '#3B82F6', '#EC4899'],
      });
      onStateUpdate(nextState);
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-charcoal-card via-charcoal-card to-charcoal-dark border border-gold/40 shadow-[0_0_50px_rgba(212,175,55,0.25)] p-4 sm:p-8 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={spinning}
          aria-label="Close lucky wheel"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles size={14} /> Prestige Reset 1 Feature
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            Golden Syndicate Wheel
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Spin the high-roller wheel for dirty bankrolls, chips, equity, and jackpot tokens!
          </p>
        </div>

        {/* Wheel Assembly */}
        <div className="relative w-56 h-56 sm:w-72 sm:h-72 my-2 flex items-center justify-center shrink-0">
          {/* Outer Gilded Casing */}
          <div className="absolute inset-0 rounded-full border-4 border-gold shadow-[0_0_30px_rgba(234,179,8,0.4)] pointer-events-none" />

          {/* Wheel Pointer at Top */}
          <div className="absolute -top-3 z-30 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-gold filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
          </div>

          {/* Spinning SVG Wheel */}
          <div
            className="w-full h-full rounded-full overflow-hidden transition-transform duration-[4500ms] ease-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <svg viewBox="0 0 300 300" className="w-full h-full">
              {LUCKY_WHEEL_WEDGES.map((wedge, i) => {
                const angle = 360 / LUCKY_WHEEL_WEDGES.length;
                const startAngle = i * angle;
                const endAngle = (i + 1) * angle;

                const x1 = 150 + 150 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 150 + 150 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 150 + 150 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 150 + 150 * Math.sin((Math.PI * endAngle) / 180);

                const midAngle = startAngle + angle / 2;
                const textX = 150 + 95 * Math.cos((Math.PI * midAngle) / 180);
                const textY = 150 + 95 * Math.sin((Math.PI * midAngle) / 180);

                return (
                  <g key={wedge.id}>
                    <path
                      d={`M150,150 L${x1},${y1} A150,150 0 0,1 ${x2},${y2} Z`}
                      fill={wedge.color}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                      className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                    >
                      {wedge.label.split(' ')[0]} {wedge.label.split(' ')[1]}
                    </text>
                  </g>
                );
              })}
              {/* Wheel Center Cap */}
              <circle cx="150" cy="150" r="28" fill="#18181b" stroke="#fbbf24" strokeWidth="3" />
              <circle cx="150" cy="150" r="18" fill="#eab308" />
            </svg>
          </div>
        </div>

        {/* Won Banner */}
        {wonReward && (
          <div className="w-full mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center animate-bounce">
            <div className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">Reward Claimed!</div>
            <div className="text-base font-black text-white">{wonReward.label}</div>
          </div>
        )}

        {/* Action Controls */}
        <div className="w-full mt-6 space-y-3">
          {isFreeReady ? (
            <button
              onClick={() => handleSpin(false)}
              disabled={spinning}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-charcoal-dark font-black text-sm uppercase tracking-widest shadow-[0_0_25px_rgba(234,179,8,0.5)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={18} /> {spinning ? 'Spinning...' : 'FREE LUCKY SPIN READY!'}
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleSpin(true)}
                disabled={spinning || state.mobTokens < 2}
                className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  state.mobTokens >= 2 && !spinning
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                }`}
              >
                <Crown size={16} /> Spin Now (Cost: 2 ⭐ Syndicate Tokens)
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
                <Clock size={14} className="text-amber-400" />
                <span>Next Free Spin in: </span>
                <span className="font-mono font-bold text-white">{formatTime(cooldownRemaining)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
