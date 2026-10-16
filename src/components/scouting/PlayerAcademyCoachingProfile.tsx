'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Brain,
  Coins,
  Sparkles,
  Target,
  Trophy,
  Play,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { CareerTrackerStats } from '@/lib/poker-trainer/types';
import {
  DerivedTrackerMetrics,
  generatePlayerImprovementAdvice,
  loadTrackerStatsForPlayer,
  PlayerImprovementAdvice,
  computeDerivedMetrics,
  getInitialTrackerStats,
} from '@/lib/poker-trainer/tracker';
import {
  computePlayerLevel,
  BASE_ACADEMY_BANKROLL,
} from '@/lib/poker-trainer/leaderboard';

interface Props {
  playerName: string;
}

export default function PlayerAcademyCoachingProfile({ playerName }: Props) {
  const [advice, setAdvice] = useState<PlayerImprovementAdvice | null>(null);
  const [derived, setDerived] = useState<DerivedTrackerMetrics | null>(null);
  const [stats, setStats] = useState<CareerTrackerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. First load from player's local storage for instant render
    const localStats = loadTrackerStatsForPlayer(playerName);
    setStats(localStats);
    setDerived(computeDerivedMetrics(localStats));
    setAdvice(generatePlayerImprovementAdvice(localStats, playerName));

    // 2. Fetch server-persisted profile if available
    fetch(`/api/player/academy-profile?name=${encodeURIComponent(playerName)}`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.stats && data.stats.handsPlayed >= localStats.handsPlayed) {
          setStats(data.stats);
          setDerived(data.derived);
          setAdvice(data.advice);
        }
      })
      .catch((err) => console.log('Could not fetch server academy profile:', err))
      .finally(() => setLoading(false));
  }, [playerName]);

  if (loading && !advice) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-white/10 animate-pulse text-center text-xs text-zinc-500">
        Loading AI Poker Academy profile for {playerName}...
      </div>
    );
  }

  const currentAdvice =
    advice || generatePlayerImprovementAdvice(getInitialTrackerStats(), playerName);
  const currentDerived =
    derived || computeDerivedMetrics(getInitialTrackerStats());

  return (
    <div className="glass-panel p-6 md:p-8 rounded-2xl border-t-4 border-gold relative overflow-hidden space-y-6">
      {/* Background Watermark */}
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Brain size={140} />
      </div>

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles size={13} />
            <span>AI Academy Telemetry & Coach Profile</span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Play Style:</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] via-[#ffe578] to-[#cfb53b]">
              {currentAdvice.archetype}
            </span>
          </h3>
          <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
            {currentAdvice.archetypeDescription}
          </p>

          {/* Academy Bankroll & Training Level Badge */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 border border-gold/40 text-xs">
              <Coins size={13} className="text-gold" />
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Academy Bankroll:</span>
              <span className="font-mono font-black text-gold">
                £{Math.max(
                  0,
                  BASE_ACADEMY_BANKROLL +
                    (stats?.netChipsWon || 0) +
                    (stats?.bountyCashWon || 0) +
                    (stats?.bailoutChipsReceived || 0)
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 border border-white/10 text-xs">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Level:</span>
              <span
                className={`font-black uppercase text-[10px] px-2 py-0.5 rounded border ${
                  computePlayerLevel(stats || getInitialTrackerStats()).borderColor
                } ${computePlayerLevel(stats || getInitialTrackerStats()).badgeColor}`}
              >
                {computePlayerLevel(stats || getInitialTrackerStats()).tier}
              </span>
            </div>
            {(stats?.bankruptcyCount || 0) > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/80 border border-red-500/70 text-xs text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.35)]">
                <span>🤡</span>
                <span className="text-[10px] font-bold uppercase">Loser Badge:</span>
                <span className="font-mono font-black text-red-200">
                  Bankrupt ×{stats?.bankruptcyCount}
                </span>
                <span className="text-[9px] text-zinc-400">
                  (+£{(stats?.bailoutChipsReceived || (stats?.bankruptcyCount || 0) * 1000).toLocaleString()} loan)
                </span>
              </div>
            )}
          </div>
        </div>

        <Link
          href={`/academy`}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 transition shrink-0"
        >
          <Play size={13} fill="currentColor" /> Enter Academy Arena
        </Link>
      </div>

      {/* 4 Core HUD Telemetry Cards with Plain + Pro Bridge Labels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-black/60 p-3.5 rounded-xl border border-white/10 text-center">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">
            Hands Played % (VPIP)
          </div>
          <div className="text-2xl font-black text-white mt-0.5">
            {currentDerived.vpipPercent}%
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Target: 20%–28%</div>
        </div>

        <div className="bg-black/60 p-3.5 rounded-xl border border-white/10 text-center">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">
            Hands Raised % (PFR)
          </div>
          <div className="text-2xl font-black text-white mt-0.5">
            {currentDerived.pfrPercent}%
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Target: 16%–24%</div>
        </div>

        <div className="bg-black/60 p-3.5 rounded-xl border border-white/10 text-center">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">
            Betting Drive (AF)
          </div>
          <div className="text-2xl font-black text-white mt-0.5">
            {currentDerived.aggressionFactor}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Target: 2.0–3.5</div>
        </div>

        <div className="bg-black/60 p-3.5 rounded-xl border border-white/10 text-center">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">
            Coach Decision Grade
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-0.5">
            {currentDerived.decisionAccuracyPercent}%
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {stats?.handsPlayed || 0} hands evaluated
          </div>
        </div>
      </div>

      {/* Coach Assessment & Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assessment Box */}
        <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
            <Brain size={14} /> Virtual Coach Assessment
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed">
            {currentAdvice.overallAssessment}
          </p>
          <div className="pt-2 border-t border-white/10 text-[11px] text-zinc-400">
            <strong>Coach Note:</strong> {currentAdvice.customPrescription}
          </div>
        </div>

        {/* Key Strengths */}
        <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck size={14} /> Proven Strengths
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {currentAdvice.keyStrengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Personalized Improvement Plan (Action Steps with 1-Click Drill Launchers) */}
      <div className="space-y-3 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Target className="text-gold" size={16} />
            <span>Personalized Game Improvement Plan</span>
          </h4>
          <span className="text-[11px] text-zinc-400">
            Tailored to {playerName}&apos;s tracked habits
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentAdvice.actionPlan.map((step) => (
            <div
              key={step.stepNumber}
              className="p-4 rounded-xl bg-zinc-900/80 border border-white/10 flex flex-col justify-between hover:border-gold/50 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-gold/20 text-gold font-mono font-black text-[11px] flex items-center justify-center border border-gold/40">
                    {step.stepNumber}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Goal: {step.targetBenchmark}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-white group-hover:text-gold transition">
                  {step.title}
                </h5>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <Link
                  href={`/academy`}
                  className="w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-gold hover:text-black text-[11px] font-bold text-zinc-200 transition flex items-center justify-between"
                >
                  <span>{step.drillLabel}</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
