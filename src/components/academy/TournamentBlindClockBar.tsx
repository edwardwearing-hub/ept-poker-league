'use client';

import React from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Settings,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  formatTimeDisplay,
  TimedBlindsConfig,
} from '@/lib/poker-trainer/timed-blinds';

interface Props {
  config: TimedBlindsConfig;
  currentLevelIndex: number;
  secondsRemaining: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onNextLevel: () => void;
  onPrevLevel: () => void;
  onOpenCustomizer: () => void;
}

export default function TournamentBlindClockBar({
  config,
  currentLevelIndex,
  secondsRemaining,
  isRunning,
  onToggleTimer,
  onResetTimer,
  onNextLevel,
  onPrevLevel,
  onOpenCustomizer,
}: Props) {
  if (!config.enabled) {
    return (
      <div className="bg-black/50 border border-white/10 rounded-2xl px-4 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <Clock size={14} className="text-zinc-500" />
          <span>Blind Mode:</span>
          <span className="font-bold text-white">Static Cash Blinds (£5/£10)</span>
        </div>

        <button
          onClick={onOpenCustomizer}
          className="px-3 py-1 rounded-lg bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition"
        >
          <Timer size={13} />
          <span>Enable Timed Blinds Clock</span>
        </button>
      </div>
    );
  }

  const currentLevel = config.levels[currentLevelIndex] || config.levels[0];
  const nextLevel = config.levels[currentLevelIndex + 1];
  const totalDuration = currentLevel.durationSeconds || config.defaultLevelDurationSeconds;
  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / Math.max(1, totalDuration)) * 100));

  const isWarningTime = secondsRemaining <= 15 && secondsRemaining > 0;

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border border-gold/40 p-3 shadow-xl overflow-hidden animate-in fade-in duration-200">
      {/* Dynamic Background Progress Bar */}
      <div
        style={{ width: `${progressPercent}%` }}
        className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${
          isWarningTime
            ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
            : 'bg-gradient-to-r from-amber-500 to-gold'
        }`}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        {/* Left: Tournament Level & Countdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-gold text-black font-black text-xs uppercase tracking-wider shadow">
              LEVEL {currentLevel.level}
            </span>

            {/* Countdown Display */}
            <div
              className={`font-mono text-2xl font-black tracking-tight flex items-center gap-1.5 ${
                isWarningTime
                  ? 'text-red-400 animate-pulse'
                  : 'text-white'
              }`}
            >
              <Timer
                size={18}
                className={isWarningTime ? 'text-red-400' : 'text-gold'}
              />
              <span>{formatTimeDisplay(secondsRemaining)}</span>
            </div>
          </div>

          {/* Quick Play/Pause & Step Controls */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
            <button
              onClick={onPrevLevel}
              disabled={currentLevelIndex <= 0}
              title="Previous Blind Level"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 transition"
            >
              <ChevronLeft size={14} />
            </button>

            <button
              onClick={onToggleTimer}
              title={isRunning ? 'Pause Tournament Clock' : 'Start Tournament Clock'}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 transition ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500 text-black shadow hover:brightness-110'
              }`}
            >
              {isRunning ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
              <span>{isRunning ? 'Pause' : 'Start'}</span>
            </button>

            <button
              onClick={onNextLevel}
              disabled={currentLevelIndex >= config.levels.length - 1}
              title="Skip to Next Blind Level"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 transition"
            >
              <ChevronRight size={14} />
            </button>

            <button
              onClick={onResetTimer}
              title="Reset timer to start of current level"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Center / Right: Current Blinds & Next Blinds */}
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto text-xs">
          <div className="flex items-center gap-2">
            <div>
              <div className="text-[9px] uppercase font-bold text-zinc-400">
                Current Blinds:
              </div>
              <div className="text-sm font-mono font-black text-gold">
                £{currentLevel.smallBlind} / £{currentLevel.bigBlind}
                {currentLevel.ante ? (
                  <span className="text-[11px] text-zinc-300 font-normal ml-1">
                    (Ante £{currentLevel.ante})
                  </span>
                ) : null}
              </div>
            </div>

            {nextLevel && (
              <div className="hidden md:block pl-3 border-l border-white/10">
                <div className="text-[9px] uppercase font-bold text-zinc-500">
                  Next Level:
                </div>
                <div className="text-xs font-mono font-bold text-zinc-300">
                  £{nextLevel.smallBlind} / £{nextLevel.bigBlind}
                </div>
              </div>
            )}
          </div>

          {/* Customize Button */}
          <button
            onClick={onOpenCustomizer}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0"
          >
            <Settings size={13} className="text-gold" />
            <span className="hidden sm:inline">Clock Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
