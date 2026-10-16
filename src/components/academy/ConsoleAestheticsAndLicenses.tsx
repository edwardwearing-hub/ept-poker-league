'use client';

import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Cpu,
  Gamepad2,
  Lock,
  Palette,
  Play,
  Radio,
  Shield,
  Sparkles,
  Trophy,
  Tv,
  Zap,
} from 'lucide-react';
import {
  ACADEMY_LICENSE_TESTS,
  CONSOLE_HUD_THEMES,
  CONSOLE_TUTORIAL_AESTHETICS_DB,
  ConsoleHudThemeId,
} from '@/lib/poker-trainer/console-aesthetics-db';
import { CareerTrackerStats, ScenarioPreset } from '@/lib/poker-trainer/types';
import { computeDerivedMetrics } from '@/lib/poker-trainer/tracker';
import InfoTooltip from './InfoTooltip';

interface Props {
  trackerStats: CareerTrackerStats;
  activeHudTheme: ConsoleHudThemeId;
  onSelectHudTheme: (theme: ConsoleHudThemeId) => void;
  onLaunchPresetDrill: (preset: ScenarioPreset) => void;
}

export default function ConsoleAestheticsAndLicenses({
  trackerStats,
  activeHudTheme,
  onSelectHudTheme,
  onLaunchPresetDrill,
}: Props) {
  const [eraFilter, setEraFilter] = useState<'ALL' | '6th Gen (PS2 / Xbox / GC)' | '7th Gen (Xbox 360 / PS3)'>('ALL');
  const derived = useMemo(() => computeDerivedMetrics(trackerStats), [trackerStats]);

  // CoD4 "The Pit" style Automated Difficulty Evaluation
  const pitDifficultyEvaluation = useMemo(() => {
    const acc = derived.decisionAccuracyPercent;
    if (trackerStats.handsPlayed < 2) {
      return {
        tier: 'EPT Regular (Baseline Assessment)',
        color: '#38BDF8',
        quote:
          '"Soap, step into the Arena and complete 2+ hands so we can clock your VPIP/PFR and assign your combat difficulty." — Captain Price / E.P.T. Coach',
      };
    }
    if (acc >= 88 && trackerStats.handsPlayed >= 5) {
      return {
        tier: 'GTO Solver / Veteran Tier',
        color: '#00FF66',
        quote: `"New squadron record! ${acc}% Coach Accuracy across ${trackerStats.handsPlayed} hands. You are cleared for GTO Solver & Pro Shark tables."`,
      };
    }
    if (acc >= 75) {
      return {
        tier: 'Pro Shark (Hardened Adaptive)',
        color: '#FACC15',
        quote: `"Fine work—${acc}% Coach Accuracy. We recommend stepping up to Pro Shark bots that actively adapt to your HUD stats."`,
      };
    }
    if (acc >= 58) {
      return {
        tier: 'EPT Regular (Standard Club Tier)',
        color: '#F97316',
        quote: `"Solid fundamentals (${acc}% Accuracy), but watch your pot-odds calls and pre-flop limps. Stick to EPT Regular difficulty while drilling."`,
      };
    }
    return {
      tier: 'Rookie (Boot Camp Training)',
      color: '#EF4444',
      quote: `"You're bleeding EV out there (${acc}% Accuracy). Keep Live Coach HUD ON and drill Rookie bots until your pot-odds math is second nature."`,
    };
  }, [derived.decisionAccuracyPercent, trackerStats.handsPlayed]);

  // Count medals earned across the 6 GT4-style License Tests
  const medalCounts = useMemo(() => {
    let gold = 0;
    let silver = 0;
    let bronze = 0;
    for (const test of ACADEMY_LICENSE_TESTS) {
      const m = test.medalStatus(trackerStats);
      if (m === 'Gold') gold++;
      else if (m === 'Silver') silver++;
      else if (m === 'Bronze') bronze++;
    }
    return { gold, silver, bronze };
  }, [trackerStats]);

  const filteredDb = useMemo(() => {
    if (eraFilter === 'ALL') return CONSOLE_TUTORIAL_AESTHETICS_DB;
    return CONSOLE_TUTORIAL_AESTHETICS_DB.filter((item) => item.eraCategory === eraFilter);
  }, [eraFilter]);

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* 1. CONSOLE HUD SKIN SWITCHER & COD4 "THE PIT" DIFFICULTY EVALUATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Console HUD Skin Selector (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-gold/30">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Tv className="text-gold" size={20} />
                <InfoTooltip
                  title="2000–2015 Console Tutorial HUD Skin Switcher"
                  description="Applies authentic UI motifs from classic 2000–2015 console game tutorials (Gran Turismo 4, Metal Gear Solid 2 Codec, Call of Duty 4 The Pit, GTA San Andreas) across the Academy header, Coach Comms, and controller prompts."
                >
                  <span>Active Console Tutorial HUD Aesthetic</span>
                </InfoTooltip>
              </h2>
              <p className="text-xs text-zinc-400">
                Switch the Academy’s live retro-console tutorial overlay & Codec theme at any time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-4">
            {(Object.keys(CONSOLE_HUD_THEMES) as ConsoleHudThemeId[]).map((tId) => {
              const t = CONSOLE_HUD_THEMES[tId];
              const isSelected = activeHudTheme === tId;
              return (
                <button
                  key={tId}
                  onClick={() => onSelectHudTheme(tId)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-white/15 border-gold shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                      : 'bg-black/50 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${t.accentColor}25`,
                        color: t.accentColor,
                      }}
                    >
                      {t.eraBadge}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-black text-gold uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-black text-white truncate">{t.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                    {t.inspiration}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CoD4 "The Pit" Automated Difficulty Assessment (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-br from-[#1a1d14]/90 to-black flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                CoD4 &quot;The Pit&quot; Evaluation System
              </span>
              <span className="text-xs font-mono text-zinc-400">
                ACCURACY: {derived.decisionAccuracyPercent}%
              </span>
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mt-1">
              <InfoTooltip
                title="Killhouse 'The Pit' Difficulty Recommender (2007)"
                description="Inspired by Call of Duty 4: Modern Warfare's 'F.N.G.' cargo ship tutorial, where your speed and target accuracy automatically determine which campaign difficulty you should play."
              >
                <span>Recommended Arena Difficulty</span>
              </InfoTooltip>
            </h3>
            <div
              className="text-xl font-black mt-2"
              style={{ color: pitDifficultyEvaluation.color }}
            >
              ★ {pitDifficultyEvaluation.tier}
            </div>
            <p className="text-xs text-zinc-300 italic mt-2 leading-relaxed bg-black/50 p-3 rounded-xl border border-white/10">
              {pitDifficultyEvaluation.quote}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Hands Clocked: {trackerStats.handsPlayed}</span>
            <span className="text-emerald-400 font-bold">
              A+ Moves: {trackerStats.gradeCounts['A+'] || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 2. GRAN TURISMO 4 STYLE E.P.T. LICENSE CENTER (B, A, IB, IA, S LICENSES) */}
      <div className="glass-panel rounded-2xl p-6 border border-sky-400/30 bg-gradient-to-b from-[#0f172a]/80 to-black">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] font-black uppercase tracking-widest mb-1.5">
              Gran Turismo 4 (2004 PS2) Progression System
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="text-yellow-400" size={22} />
              <InfoTooltip
                title="E.P.T. License Center (B → A → IB → IA → Super License)"
                description="Inspired by Gran Turismo's legendary License Center. Instead of boring text walls, each poker skill is a License Trial that awards a Bronze, Silver, or Gold trophy stamp as you hit the target benchmarks in the Arena!"
              >
                <span>The E.P.T. License Center Trials</span>
              </InfoTooltip>
            </h2>
            <p className="text-xs text-zinc-400">
              Earn Bronze, Silver, and elusive Gold Trophies across all 6 poker license examinations.
            </p>
          </div>

          {/* Trophy Stamp Counter */}
          <div className="flex items-center gap-3 bg-black/70 px-4 py-2.5 rounded-xl border border-white/15 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-yellow-500/15 border border-yellow-400/40 text-yellow-300 text-xs font-black">
              🏆 Gold: {medalCounts.gold}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-300/15 border border-zinc-300/40 text-zinc-200 text-xs font-black">
              🥈 Silver: {medalCounts.silver}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-700/20 border border-amber-600/40 text-amber-400 text-xs font-black">
              🥉 Bronze: {medalCounts.bronze}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACADEMY_LICENSE_TESTS.map((test) => {
            const medal = test.medalStatus(trackerStats);
            const prog = test.progressText(trackerStats);

            const medalBadge =
              medal === 'Gold'
                ? 'bg-yellow-400 text-black border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                : medal === 'Silver'
                ? 'bg-zinc-200 text-black border-white'
                : medal === 'Bronze'
                ? 'bg-amber-600 text-white border-amber-400'
                : 'bg-zinc-900 text-zinc-500 border-white/10';

            return (
              <div
                key={test.id}
                className="bg-black/65 rounded-xl p-5 border border-white/15 hover:border-sky-400/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-sky-500 text-black font-black text-xs tracking-wider">
                        {test.licenseCode}
                      </span>
                      <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                        {test.licenseClass}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 ${medalBadge}`}
                    >
                      {medal === 'Gold' && '🏆 GOLD'}
                      {medal === 'Silver' && '🥈 SILVER'}
                      {medal === 'Bronze' && '🥉 BRONZE'}
                      {medal === 'Locked' && (
                        <>
                          <Lock size={10} /> UNTESTED
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-white mb-1.5">
                    {test.title}
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                    {test.objective}
                  </p>

                  <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/20 text-[11px] text-sky-200/90 italic mb-4">
                    &quot;{test.instructorBrief}&quot;
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Telemetry Progress:</span>
                    <span className="text-gold font-bold">{prog}</span>
                  </div>
                  <button
                    onClick={() => onLaunchPresetDrill(test.presetToLaunch)}
                    className="w-full py-2 rounded-lg bg-sky-500/20 hover:bg-sky-400 text-sky-300 hover:text-black border border-sky-400/40 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                  >
                    <Play size={12} fill="currentColor" /> Enter License Trial ({test.licenseCode})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. THE 2000–2015 CONSOLE GAME TUTORIAL AESTHETICS DATABASE */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="text-gold" size={22} />
              <InfoTooltip
                title="2000–2015 Console Game Tutorial Aesthetics Database"
                description="Curated research database documenting how 6th-Generation (PS2, Xbox, GameCube) and 7th-Generation (Xbox 360, PS3) console games designed iconic tutorials using skeuomorphic frames, controller prompts, telemetry, and diegetic briefings."
              >
                <span>2000–2015 Console Tutorial Aesthetics Database</span>
              </InfoTooltip>
            </h2>
            <p className="text-sm text-zinc-400">
              Explore the color palettes, typography, UI motifs, controller prompts, and onboarding psychology from the golden age of console tutorials.
            </p>
          </div>

          {/* Era Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'ALL', label: 'All Eras (2000–2015)' },
                { id: '6th Gen (PS2 / Xbox / GC)', label: '6th Gen (PS2 / Xbox / GC)' },
                { id: '7th Gen (Xbox 360 / PS3)', label: '7th Gen (Xbox 360 / PS3)' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setEraFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  eraFilter === f.id
                    ? 'bg-gold text-black border-gold'
                    : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDb.map((entry) => (
            <div
              key={entry.id}
              className="glass-panel rounded-2xl p-6 border border-white/15 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Color Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${entry.colorPalette.primary}, ${entry.colorPalette.secondary})`,
                }}
              />

              <div>
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase"
                      style={{
                        backgroundColor: `${entry.colorPalette.primary}25`,
                        color: entry.colorPalette.primary,
                      }}
                    >
                      {entry.releaseYear} • {entry.platforms.join(' / ')}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      {entry.eraCategory}
                    </span>
                  </div>

                  {/* 5-Swatch Color Palette Preview */}
                  <div className="flex items-center gap-1" title="Authentic UI Color Palette">
                    {Object.entries(entry.colorPalette).map(([k, hex]) => (
                      <div
                        key={k}
                        className="w-4 h-4 rounded-full border border-white/30 shadow"
                        style={{ backgroundColor: hex }}
                        title={`${k}: ${hex}`}
                      />
                    ))}
                  </div>
                </div>

                <h3 className="text-xl font-black text-white">{entry.gameTitle}</h3>
                <div
                  className="text-xs font-bold uppercase tracking-wider mt-0.5 mb-2"
                  style={{ color: entry.colorPalette.primary }}
                >
                  Tutorial System: {entry.signatureTutorialName}
                </div>
                <p className="text-xs text-zinc-300 italic mb-4">
                  &quot;{entry.vibeTagline}&quot;
                </p>

                {/* Typography & UI Motifs */}
                <div className="space-y-3 bg-black/50 p-4 rounded-xl border border-white/10 mb-4">
                  <div className="text-xs">
                    <strong className="text-gold">Typography Style: </strong>
                    <span className="text-zinc-300">{entry.typographyStyle}</span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-gold mb-1">
                      Signature UI Motifs (2000–2015):
                    </div>
                    <ul className="space-y-1">
                      {entry.uiMotifs.map((m, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                          <span style={{ color: entry.colorPalette.primary }}>▸</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-xs pt-2 border-t border-white/10">
                    <strong className="text-cyan-400">Onboarding Psychology: </strong>
                    <span className="text-zinc-300">{entry.onboardingPsychology}</span>
                  </div>
                </div>

                {/* Controller Prompt Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {Object.entries(entry.controllerPrompts).map(([role, glyph]) => (
                    <div
                      key={role}
                      className="bg-black/70 border border-white/15 rounded-lg p-2 text-center"
                    >
                      <div className="text-[9px] uppercase text-zinc-500 font-bold">
                        {role}
                      </div>
                      <div className="text-[11px] font-mono font-black text-white mt-0.5">
                        {glyph}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer: Adaptation + Apply Theme Button */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-zinc-400">
                  <strong className="text-white">E.P.T. Integration:</strong>{' '}
                  {entry.eptAcademyAdaptation}
                </div>
                <button
                  onClick={() => onSelectHudTheme(entry.linkedThemeId)}
                  className="px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider border shrink-0 transition"
                  style={{
                    backgroundColor:
                      activeHudTheme === entry.linkedThemeId
                        ? entry.colorPalette.primary
                        : `${entry.colorPalette.primary}20`,
                    borderColor: entry.colorPalette.primary,
                    color:
                      activeHudTheme === entry.linkedThemeId
                        ? '#000000'
                        : entry.colorPalette.primary,
                  }}
                >
                  {activeHudTheme === entry.linkedThemeId
                    ? '✓ Active HUD Skin'
                    : 'Apply HUD Skin'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
