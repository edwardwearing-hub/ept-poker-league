'use client';

import React, { useState } from 'react';
import {
  Timer,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Check,
  Zap,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import {
  BlindLevel,
  BlindSpeedPreset,
  BLIND_SPEED_PRESETS_INFO,
  DEFAULT_DEEPSTACK_LEVELS,
  DEFAULT_REGULAR_LEVELS,
  DEFAULT_TURBO_LEVELS,
  formatTimeDisplay,
  getDefaultTimedBlindsConfig,
  playBlindsUpChime,
  TimedBlindsConfig,
} from '@/lib/poker-trainer/timed-blinds';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: TimedBlindsConfig;
  onSaveConfig: (newConfig: TimedBlindsConfig) => void;
  currentLevelIndex: number;
  secondsRemaining: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onJumpToLevel: (levelIndex: number) => void;
}

export default function TimedBlindsCustomizerModal({
  isOpen,
  onClose,
  config: initialConfig,
  onSaveConfig,
  currentLevelIndex,
  secondsRemaining,
  isRunning,
  onToggleTimer,
  onResetTimer,
  onJumpToLevel,
}: Props) {
  const [localConfig, setLocalConfig] = useState<TimedBlindsConfig>(() => ({
    ...initialConfig,
    levels: initialConfig.levels.map((l) => ({ ...l })),
  }));

  const [customMinutes, setCustomMinutes] = useState<number>(() =>
    Math.floor(initialConfig.defaultLevelDurationSeconds / 60) || 1
  );
  const [customSeconds, setCustomSeconds] = useState<number>(() =>
    initialConfig.defaultLevelDurationSeconds % 60
  );

  if (!isOpen) return null;

  const handleApplyPreset = (preset: BlindSpeedPreset) => {
    let newLevels: BlindLevel[] = DEFAULT_TURBO_LEVELS;
    let newDuration = 60;

    if (preset === 'hyperspeed') {
      newLevels = DEFAULT_TURBO_LEVELS;
      newDuration = 30;
    } else if (preset === 'regular') {
      newLevels = DEFAULT_REGULAR_LEVELS;
      newDuration = 180;
    } else if (preset === 'deepstack') {
      newLevels = DEFAULT_DEEPSTACK_LEVELS;
      newDuration = 300;
    } else if (preset === 'custom') {
      newLevels = localConfig.levels;
      newDuration = localConfig.defaultLevelDurationSeconds;
    }

    setLocalConfig((prev) => ({
      ...prev,
      preset,
      defaultLevelDurationSeconds: newDuration,
      levels: newLevels.map((l) => ({ ...l })),
    }));
    setCustomMinutes(Math.floor(newDuration / 60));
    setCustomSeconds(newDuration % 60);
  };

  const handleDurationChange = (totalSecs: number) => {
    const valid = Math.max(10, totalSecs);
    setLocalConfig((prev) => ({
      ...prev,
      defaultLevelDurationSeconds: valid,
    }));
    setCustomMinutes(Math.floor(valid / 60));
    setCustomSeconds(valid % 60);
  };

  const handleUpdateLevel = (
    index: number,
    field: 'smallBlind' | 'bigBlind' | 'ante',
    val: number
  ) => {
    setLocalConfig((prev) => {
      const nextLevels = [...prev.levels];
      nextLevels[index] = {
        ...nextLevels[index],
        [field]: Math.max(0, val),
      };
      // If updating smallBlind, ensure bigBlind is at least equal or double if default
      if (field === 'smallBlind' && nextLevels[index].bigBlind < val) {
        nextLevels[index].bigBlind = val * 2;
      }
      return {
        ...prev,
        preset: 'custom',
        levels: nextLevels,
      };
    });
  };

  const handleAddLevel = () => {
    setLocalConfig((prev) => {
      const last = prev.levels[prev.levels.length - 1];
      const nextNum = prev.levels.length + 1;
      const nextSB = last ? Math.round(last.smallBlind * 1.5) : 5;
      const nextBB = last ? Math.round(last.bigBlind * 1.5) : 10;
      const nextAnte = last && last.ante ? Math.round(last.ante * 1.5) : undefined;

      return {
        ...prev,
        preset: 'custom',
        levels: [
          ...prev.levels,
          {
            level: nextNum,
            smallBlind: nextSB,
            bigBlind: nextBB,
            ante: nextAnte,
          },
        ],
      };
    });
  };

  const handleRemoveLevel = (index: number) => {
    if (localConfig.levels.length <= 1) return;
    setLocalConfig((prev) => {
      const filtered = prev.levels.filter((_, i) => i !== index);
      // Re-index levels
      const reindexed = filtered.map((lvl, idx) => ({
        ...lvl,
        level: idx + 1,
      }));
      return {
        ...prev,
        preset: 'custom',
        levels: reindexed,
      };
    });
  };

  const handleSaveAndApply = () => {
    const totalSecs = customMinutes * 60 + customSeconds;
    const finalSecs = Math.max(10, totalSecs);
    const updated = {
      ...localConfig,
      defaultLevelDurationSeconds: finalSecs,
    };
    onSaveConfig(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-gradient-to-b from-zinc-900 via-black to-zinc-950 border-2 border-gold/60 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.35)] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <Timer size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Timed Blinds & Tournament Clock
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 text-[10px] font-black uppercase">
                  Customizer
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Customize blind amount increases, countdown length per level, and sound alerts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Main Master Toggle & Live Clock Preview */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-black to-zinc-900 border border-gold/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() =>
                  setLocalConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
                }
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  localConfig.enabled ? 'bg-gold' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                    localConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <div>
                <div className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>Timed Blinds Mode</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      localConfig.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {localConfig.enabled ? 'ENABLED' : 'DISABLED (Fixed £5/£10)'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {localConfig.enabled
                    ? 'Blinds increase automatically as the countdown timer ticks down.'
                    : 'Blinds stay stationary at £5/£10 for relaxed casual practice.'}
                </p>
              </div>
            </div>

            {/* Live Clock Mini Display / Controls */}
            {localConfig.enabled && (
              <div className="flex items-center gap-2 bg-black/80 px-3.5 py-2 rounded-xl border border-white/10 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                <div>
                  <div className="text-[9px] text-zinc-400 uppercase font-bold">
                    Active Level {currentLevelIndex + 1}
                  </div>
                  <div className="text-xl font-mono font-black text-gold">
                    {formatTimeDisplay(secondsRemaining)}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={onToggleTimer}
                    title={isRunning ? 'Pause Timer' : 'Start Timer'}
                    className={`p-2 rounded-lg text-black font-black transition ${
                      isRunning ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'
                    }`}
                  >
                    {isRunning ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                  </button>
                  <button
                    onClick={onResetTimer}
                    title="Reset Timer to Start of Level"
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Blind Structure Presets */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span>Choose Speed Structure Preset</span>
              <span className="text-[10px] text-zinc-500 font-normal">
                Click any preset to load its structure
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['hyperspeed', 'turbo', 'regular', 'deepstack'] as BlindSpeedPreset[]).map(
                (p) => {
                  const info = BLIND_SPEED_PRESETS_INFO[p];
                  const isSelected = localConfig.preset === p;
                  return (
                    <button
                      key={p}
                      onClick={() => handleApplyPreset(p)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gold/15 border-gold text-white shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                          : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{info.badge}</span>
                        {isSelected && <Check size={14} className="text-gold" />}
                      </div>
                      <div className="text-[11px] font-bold mt-1 text-zinc-200">
                        {info.name.split(' ')[1]}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                        {info.defaultSeconds}s per level
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Level Duration Customizer */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                  <Clock size={14} className="text-gold" />
                  <span>Level Length (Time Before Blinds Increase)</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Set how many minutes or seconds each blind level lasts before increasing.
                </p>
              </div>

              {/* Quick Pick Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { label: '30s', secs: 30 },
                  { label: '1m', secs: 60 },
                  { label: '2m', secs: 120 },
                  { label: '3m', secs: 180 },
                  { label: '5m', secs: 300 },
                  { label: '10m', secs: 600 },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() => handleDurationChange(btn.secs)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      localConfig.defaultLevelDurationSeconds === btn.secs
                        ? 'bg-gold text-black border-gold shadow'
                        : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Inputs: Minutes and Seconds */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5 items-center">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Minutes:
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={customMinutes}
                  onChange={(e) => {
                    const m = Math.max(0, parseInt(e.target.value) || 0);
                    setCustomMinutes(m);
                    handleDurationChange(m * 60 + customSeconds);
                  }}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Seconds:
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={customSeconds}
                  onChange={(e) => {
                    const s = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                    setCustomSeconds(s);
                    handleDurationChange(customMinutes * 60 + s);
                  }}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-gold"
                />
              </div>

              {/* Total Duration Display */}
              <div className="col-span-2 flex items-center justify-between sm:justify-end gap-3 sm:pt-4">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">
                    Effective Duration:
                  </div>
                  <div className="text-sm font-mono font-black text-emerald-400">
                    {formatTimeDisplay(customMinutes * 60 + customSeconds)} per level
                  </div>
                </div>

                {/* Sound Alert Toggle */}
                <button
                  onClick={() => {
                    setLocalConfig((prev) => ({
                      ...prev,
                      soundAlerts: !prev.soundAlerts,
                    }));
                    if (!localConfig.soundAlerts) {
                      playBlindsUpChime();
                    }
                  }}
                  title={localConfig.soundAlerts ? 'Sound Chime Enabled' : 'Sound Chime Muted'}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition ${
                    localConfig.soundAlerts
                      ? 'bg-amber-500/20 text-gold border-gold/40'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}
                >
                  {localConfig.soundAlerts ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span className="hidden sm:inline">
                    {localConfig.soundAlerts ? 'Chime ON' : 'Muted'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Blind Levels Schedule Table (Amounts & Structure) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Sliders size={13} className="text-gold" />
                  <span>Blind Levels Schedule & Chip Amounts</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Click on any amount to edit the Small Blind (£), Big Blind (£), or Ante.
                </p>
              </div>

              <button
                onClick={handleAddLevel}
                className="py-1 px-3 rounded-lg bg-gold/15 hover:bg-gold/25 text-gold border border-gold/30 text-xs font-black uppercase tracking-wider flex items-center gap-1 transition"
              >
                <Plus size={13} /> Add Level
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/60 max-h-[300px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 bg-zinc-900/90 backdrop-blur-md z-10">
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3">Small Blind (£)</th>
                    <th className="py-2.5 px-3">Big Blind (£)</th>
                    <th className="py-2.5 px-3">Ante (£)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {localConfig.levels.map((lvl, idx) => {
                    const isCurrent = idx === currentLevelIndex;
                    return (
                      <tr
                        key={lvl.level}
                        className={`transition ${
                          isCurrent
                            ? 'bg-gold/15 border-l-4 border-l-gold'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-2 px-3 font-black text-sm">
                          <span className={isCurrent ? 'text-gold' : 'text-zinc-300'}>
                            L{lvl.level}
                          </span>
                        </td>

                        {/* Small Blind Input */}
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500">£</span>
                            <input
                              type="number"
                              min="1"
                              step="5"
                              value={lvl.smallBlind}
                              onChange={(e) =>
                                handleUpdateLevel(
                                  idx,
                                  'smallBlind',
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20 bg-zinc-900/90 border border-white/15 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-gold"
                            />
                          </div>
                        </td>

                        {/* Big Blind Input */}
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500">£</span>
                            <input
                              type="number"
                              min="2"
                              step="5"
                              value={lvl.bigBlind}
                              onChange={(e) =>
                                handleUpdateLevel(
                                  idx,
                                  'bigBlind',
                                  parseInt(e.target.value) || 2
                                )
                              }
                              className="w-20 bg-zinc-900/90 border border-white/15 rounded-lg px-2 py-1 text-xs font-bold text-gold focus:outline-none focus:border-gold"
                            />
                          </div>
                        </td>

                        {/* Ante Input */}
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500">£</span>
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={lvl.ante || 0}
                              onChange={(e) =>
                                handleUpdateLevel(
                                  idx,
                                  'ante',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 bg-zinc-900/90 border border-white/15 rounded-lg px-2 py-1 text-xs font-bold text-zinc-300 focus:outline-none focus:border-gold"
                            />
                          </div>
                        </td>

                        {/* Status / Jump Level Button */}
                        <td className="py-2 px-3 font-sans">
                          {isCurrent ? (
                            <span className="px-2 py-0.5 rounded bg-gold text-black font-black text-[9px] uppercase tracking-wider">
                              ACTIVE NOW
                            </span>
                          ) : (
                            <button
                              onClick={() => onJumpToLevel(idx)}
                              className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-bold"
                            >
                              Jump to Level
                            </button>
                          )}
                        </td>

                        {/* Delete Action */}
                        <td className="py-2 px-3 text-right">
                          <button
                            disabled={localConfig.levels.length <= 1}
                            onClick={() => handleRemoveLevel(idx)}
                            className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/40 disabled:opacity-20 transition"
                            title="Delete this blind level"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/60 shrink-0">
          <button
            onClick={() => handleApplyPreset('turbo')}
            className="text-xs text-zinc-400 hover:text-white underline"
          >
            Reset to Standard Turbo Defaults
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none py-2 px-4 rounded-xl border border-white/15 text-zinc-300 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              className="flex-1 sm:flex-none py-2 px-6 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <Check size={14} /> Save & Apply Blinds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
