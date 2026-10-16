'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Brain,
  Compass,
  Crosshair,
  ExternalLink,
  Play,
  RotateCcw,
  ShieldCheck,
  Target,
  Eye,
  Film,
  X,
} from 'lucide-react';
import {
  CareerTrackerStats,
  DecisionGrade,
  PositionName,
  ScenarioPreset,
} from '@/lib/poker-trainer/types';
import {
  computeDerivedMetrics,
  generatePlayerImprovementAdvice,
  DiagnosedLeak,
  PlayerActionStep,
} from '@/lib/poker-trainer/tracker';
import {
  GAME_MODES_INFO,
  getPreflopHandNotation,
  POSITION_BRIDGE_LABELS,
  POSITION_INFO,
} from '@/lib/poker-trainer/constants';
import InfoTooltip from './InfoTooltip';
import TableScenarioVisual, { TableScenarioVisualProps } from './TableScenarioVisual';
import InteractiveHandReplayer from './InteractiveHandReplayer';

function getLeakTableScenario(leak: DiagnosedLeak): TableScenarioVisualProps {
  const isRiverOrCalling =
    leak.id.includes('wtsd') ||
    leak.id.includes('river') ||
    leak.title.toLowerCase().includes('river') ||
    leak.title.toLowerCase().includes('station');

  if (isRiverOrCalling) {
    return {
      title: 'Table Example: Overcoming the Calling Station Leak',
      subtitle: 'Folding second pair when the flush completes on the river',
      streetName: 'River',
      pot: 630,
      boardCards: [
        { rank: '10', suit: '♥', value: 10 },
        { rank: '9', suit: '♥', value: 9 },
        { rank: '4', suit: '♠', value: 4 },
        { rank: '2', suit: '♣', value: 2 },
        { rank: 'Q', suit: '♥', value: 12 },
      ],
      hero: {
        name: 'You (Hero)',
        position: 'BTN',
        chips: 1035,
        cards: [
          { rank: 'K', suit: '♠', value: 13 },
          { rank: '10', suit: '♦', value: 10 },
        ],
      },
      opponents: [
        {
          id: 'liam',
          name: 'Liam Duxbury',
          position: 'BB',
          chips: 735,
          lastAction: 'Bombed River £300',
        },
      ],
      tacticalCallout: {
        badge: 'Discipline Fold',
        badgeType: 'critical',
        actionText: 'Fold Second Pair (Save £300)',
        rationale: leak.fixAction,
      },
      drillPreset: 'btn-vs-bb-3bet',
    };
  }

  // Default: Positional / Limp / Aggression Leak
  return {
    title: 'Table Example: Fixing Loose-Passive / Open-Limping Leak',
    subtitle: 'Hero isolates limper with 3.5× raise in position',
    streetName: 'Pre-Flop',
    pot: 50,
    boardCards: [],
    hero: {
      name: 'You (Hero)',
      position: 'BTN',
      chips: 1000,
      cards: [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♦', value: 13 },
      ],
    },
    opponents: [
      {
        id: 'stephen',
        name: 'Stephen Flood',
        position: 'UTG',
        chips: 980,
        lastAction: 'Limped £20',
      },
      {
        id: 'liam',
        name: 'Liam Duxbury',
        position: 'BB',
        chips: 980,
        lastAction: 'BB £20',
      },
    ],
    tacticalCallout: {
      badge: 'Aggressive Fix',
      badgeType: 'optimal',
      actionText: 'Raise to £70 (Never Limp Behind)',
      rationale: leak.fixAction,
    },
    drillPreset: 'btn-vs-bb-3bet',
  };
}

interface Props {
  trackerStats: CareerTrackerStats;
  onResetTracker: () => void;
  onLaunchPresetDrill: (preset: ScenarioPreset) => void;
  playerName?: string;
}

export default function PlayStyleTracker({
  trackerStats,
  onResetTracker,
  onLaunchPresetDrill,
  playerName = 'You',
}: Props) {
  const [expandedLeakVisualId, setExpandedLeakVisualId] = useState<string | null>(null);
  const [activeReplayerHandId, setActiveReplayerHandId] = useState<string | null>(null);

  const derived = useMemo(() => computeDerivedMetrics(trackerStats), [trackerStats]);
  const advice = useMemo(
    () => generatePlayerImprovementAdvice(trackerStats, playerName),
    [trackerStats, playerName]
  );

  const gradeColors: Record<DecisionGrade, string> = {
    'A+': 'bg-emerald-500 text-black',
    B: 'bg-cyan-500 text-black',
    C: 'bg-amber-500 text-black',
    D: 'bg-orange-500 text-black',
    F: 'bg-ept-red text-white',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Career Summary Banner */}
      <div className="glass-panel-gold rounded-2xl p-6 border border-gold/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-black uppercase tracking-widest">
            <Compass size={14} />
            <InfoTooltip
              title="Active Player Archetype Classification"
              description="Automatically categorizes your play style into one of four poker archetypes (TAG Shark, LAG Crusher, Nit / Rock, or Calling Station) based on your tracked VPIP, PFR, and Aggression Factor."
            >
              <span>Active Player Archetype</span>
            </InfoTooltip>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            {derived.archetype}
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {derived.archetypeDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              <InfoTooltip
                title="Total Hands Tracked"
                description="Cumulative number of hands you have played in the AI Bot Arena. All stats persist in your browser's local storage."
              >
                <span>Hands Tracked</span>
              </InfoTooltip>
            </div>
            <div className="text-2xl font-black text-white">
              {trackerStats.handsPlayed}
            </div>
          </div>
          <div className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              <InfoTooltip
                title="Net Big Blinds (BB) Won"
                description="Measures your total profit or loss normalized in Big Blinds (BB) rather than raw currency, allowing accurate comparison across different stack depths and formats."
              >
                <span>Net BB Won</span>
              </InfoTooltip>
            </div>
            <div
              className={`text-2xl font-black ${
                trackerStats.netBBWon >= 0 ? 'text-emerald-400' : 'text-ept-red'
              }`}
            >
              {trackerStats.netBBWon >= 0 ? '+' : ''}
              {trackerStats.netBBWon} BB
            </div>
          </div>
          <div className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              <InfoTooltip
                title="Weighted Coach Grade (%)"
                description="Your overall strategic decision score across every street action (A+ = 100%, B = 82%, C = 60%, D = 30%, F = 0%)."
              >
                <span>Coach Grade</span>
              </InfoTooltip>
            </div>
            <div className="text-2xl font-black text-gold">
              {derived.decisionAccuracyPercent}%
            </div>
          </div>
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Reset all tracked hands, HUD statistics, and leak history?'
                )
              ) {
                onResetTracker();
              }
            }}
            title="Clear all saved hand history and start a fresh tracking session."
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-red-950/60 border border-white/10 hover:border-ept-red/50 text-xs font-bold text-zinc-400 hover:text-ept-red flex items-center gap-1.5 transition"
          >
            <RotateCcw size={14} /> Reset Tracker
          </button>
        </div>
      </div>

      {/* Middle Grid: 2D Play-Style Quadrant Matrix + Core HUD Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2D Play-Style Quadrant Chart (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
              <Crosshair className="text-gold" size={18} />
              <InfoTooltip
                title="2D Play-Style Quadrant Matrix"
                description="The horizontal X-axis tracks how loose or tight you are pre-flop (VPIP %). The vertical Y-axis tracks how aggressively you raise and bet (PFR/VPIP ratio + Post-Flop Aggression Factor). Aim to keep your gold marker inside the green Pro Shark Zone!"
              >
                <span>2D Play-Style Matrix</span>
              </InfoTooltip>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Plots your pre-flop looseness (VPIP) against your raising & post-flop aggression (PFR + AF).
            </p>
          </div>

          {/* Visual 2x2 Quadrant Box */}
          <div className="relative w-full aspect-square max-h-[300px] mx-auto bg-black/70 rounded-2xl border border-white/15 overflow-hidden p-4">
            {/* Center Crosshairs */}
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/15 border-r border-dashed border-white/20" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/15 border-b border-dashed border-white/20" />

            {/* Optimal Pro TAG Zone Box */}
            <div
              className="absolute rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center pointer-events-none"
              style={{
                left: '28%',
                width: '28%',
                top: '12%',
                height: '36%',
              }}
            >
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300/80 text-center px-1">
                Pro Shark Zone
              </span>
            </div>

            {/* Quadrant Labels */}
            <div className="absolute top-2.5 left-3 text-[10px] font-black uppercase text-emerald-400">
              TAG (Tight-Aggressive)
            </div>
            <div className="absolute top-2.5 right-3 text-[10px] font-black uppercase text-amber-400 text-right">
              LAG (Loose-Aggressive)
            </div>
            <div className="absolute bottom-2.5 left-3 text-[10px] font-black uppercase text-cyan-400">
              Nit / Rock (Tight-Passive)
            </div>
            <div className="absolute bottom-2.5 right-3 text-[10px] font-black uppercase text-ept-red text-right">
              Calling Station (Loose-Passive)
            </div>

            {/* Player Coordinate Marker */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 z-20 flex flex-col items-center"
              style={{
                left: `${derived.loosenessScore}%`,
                top: `${100 - derived.aggressionScore}%`,
              }}
            >
              <div className="w-5 h-5 rounded-full bg-gold border-2 border-black shadow-[0_0_15px_#ffd700] animate-pulse" />
              <span className="mt-1 px-2 py-0.5 rounded bg-black/90 border border-gold text-[10px] font-black text-gold whitespace-nowrap">
                YOU ({derived.vpipPercent}/{derived.pfrPercent})
              </span>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-zinc-400 font-mono mt-3 pt-3 border-t border-white/10">
            <span>← Tighter (Low VPIP)</span>
            <span>Looser (High VPIP) →</span>
          </div>
        </div>

        {/* Core HUD Statistics & Pro Benchmarks (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
              <Activity className="text-gold" size={18} />
              <InfoTooltip
                title="HUD Telemetry vs. Pro Benchmarks"
                description="Professional poker trackers (like PokerTracker, Hold'em Manager, and GTO Wizard) use these 6 core frequencies to identify every weakness in a player's game."
              >
                <span>Live HUD Telemetry vs. Pro Benchmarks</span>
              </InfoTooltip>
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Hover or click <strong className="text-gold">ⓘ</strong> on any HUD metric below to see its exact formula and strategic meaning.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: 'Hands Played % (VPIP)',
                  val: `${derived.vpipPercent}%`,
                  target: '20% – 28%',
                  status:
                    derived.vpipPercent >= 18 && derived.vpipPercent <= 30
                      ? 'Optimal'
                      : derived.vpipPercent > 30
                      ? 'Too Loose'
                      : 'Too Tight',
                  desc: 'Plain English: How often you choose to play a hand before the flop instead of folding.',
                  tooltipTitle: 'Hands Played % — VPIP (Voluntarily Put Money In Pot)',
                  tooltipDesc:
                    'Measures how often you choose to play a hand pre-flop by calling or raising (posting compulsory Small/Big Blinds does not count). Playing more than 32% of hands means you are entering pots with weak, dominated cards.',
                  formula: 'VPIP % = (Hands Called or Raised Pre-Flop / Total Hands) × 100',
                },
                {
                  label: 'Hands Raised % (PFR)',
                  val: `${derived.pfrPercent}%`,
                  target: '16% – 24%',
                  status:
                    derived.pfrPercent >= 15 && derived.pfrPercent <= 26
                      ? 'Optimal'
                      : derived.pfrPercent < 15
                      ? 'Too Passive'
                      : 'Hyper-Aggro',
                  desc: 'Plain English: How often you enter the pot with a raise rather than just calling.',
                  tooltipTitle: 'Hands Raised % — PFR (Pre-Flop Raise)',
                  tooltipDesc:
                    'Measures how often you enter the pot with a raise pre-flop. Winning players almost always raise when entering a pot to seize the initiative and win blinds uncontested.',
                  formula: 'Target: Keep (Hands Played % - Hands Raised %) <= 6%',
                },
                {
                  label: 'Re-Raise % (3-Bet)',
                  val: `${derived.threeBetPercent}%`,
                  target: '7% – 11%',
                  status:
                    derived.threeBetPercent >= 6 && derived.threeBetPercent <= 13
                      ? 'Optimal'
                      : derived.threeBetPercent < 6
                      ? 'Under-3Betting'
                      : 'Light 3Bets',
                  desc: 'Plain English: How often you re-raise when another player raises before the flop.',
                  tooltipTitle: 'Re-Raise % — 3-Bet (Pre-Flop Re-Raise)',
                  tooltipDesc:
                    'The Big Blind is the 1st bet, the initial open-raise is the 2nd bet, and the re-raise is the 3-Bet. A 3-Bet % under 4% means opponents know you only re-raise with AA/KK and will easily fold against you.',
                  formula: '3-Bet % = (Pre-Flop Re-Raises / Opportunities Facing Open) × 100',
                },
                {
                  label: 'Betting Drive (Aggression / AF)',
                  val: `${derived.aggressionFactor}`,
                  target: '2.0 – 3.5',
                  status:
                    derived.aggressionFactor >= 1.8 && derived.aggressionFactor <= 4.0
                      ? 'Optimal'
                      : derived.aggressionFactor < 1.8
                      ? 'Check/Caller'
                      : 'Bluff Heavy',
                  desc: 'Plain English: Ratio of how often you Bet/Raise vs. just Call after the flop.',
                  tooltipTitle: 'Betting Drive — Post-Flop Aggression Factor (AF)',
                  tooltipDesc:
                    'Measures how assertive you are on the Flop, Turn, and River. An AF below 1.5 means you call far more than you bet/raise (passive). An AF between 2.0 and 3.5 indicates healthy value-betting and semi-bluffing.',
                  formula: 'AF = (Post-Flop Bets + Raises) / Post-Flop Calls',
                },
                {
                  label: 'Showdown Rate % (WTSD)',
                  val: `${derived.wtsdPercent}%`,
                  target: '26% – 34%',
                  status:
                    derived.wtsdPercent <= 36 ? 'Disciplined' : 'Sticky Station',
                  desc: 'Plain English: How often you stay in the hand all the way to the final card reveal.',
                  tooltipTitle: 'Showdown Rate % — WTSD (Went to Showdown)',
                  tooltipDesc:
                    'Tracks how often you stay in the hand all the way to the final card reveal. If your WTSD % is over 38%, you are likely failing "The Liam Test" and calling river bets with beaten one-pair hands.',
                  formula: 'WTSD % = (Showdowns Reached / Total Hands Played) × 100',
                },
                {
                  label: 'Showdown Wins % (W$SD)',
                  val: `${derived.wsdPercent}%`,
                  target: '52% – 62%',
                  status: derived.wsdPercent >= 50 ? 'Strong Value' : 'Need Better Hands',
                  desc: 'Plain English: How often you have the winning hand when cards are flipped over.',
                  tooltipTitle: 'Showdown Wins % — W$SD (Won Money at Showdown)',
                  tooltipDesc:
                    'Measures how often you have the best hand when cards are flipped over at showdown. Winning over 52% proves you are reaching the river with strong value rather than weak bluff-catchers.',
                  formula: 'W$SD % = (Showdowns Won / Showdowns Reached) × 100',
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-black/50 p-4 rounded-xl border border-white/10 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-300">
                      <InfoTooltip
                        title={stat.tooltipTitle}
                        description={stat.tooltipDesc}
                        formula={stat.formula}
                        size={13}
                      >
                        <span>{stat.label}</span>
                      </InfoTooltip>
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                        stat.status === 'Optimal' ||
                        stat.status === 'Disciplined' ||
                        stat.status === 'Strong Value'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {stat.status}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black text-white">{stat.val}</span>
                    <span className="text-[11px] font-mono text-gold">
                      Pro Target: {stat.target}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1.5">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Personalized AI Coach Improvement Plan */}
      <div className="glass-panel p-6 rounded-2xl border-t-4 border-gold relative overflow-hidden space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[11px] font-black uppercase tracking-wider mb-1">
              <Brain size={13} />
              <span>Personalized Game Improvement Plan</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Coaching Advice for {playerName}
            </h3>
            <p className="text-xs text-zinc-300 mt-0.5">
              {advice.overallAssessment}
            </p>
          </div>

          {playerName && playerName !== 'You' && playerName !== 'Guest' && (
            <Link
              href={`/scouting/${encodeURIComponent(playerName)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition shrink-0 self-start sm:self-auto"
            >
              <span>View Scouting Profile</span>
              <ExternalLink size={12} />
            </Link>
          )}
        </div>

        {/* Action Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {advice.actionPlan.map((step: PlayerActionStep) => (
            <div
              key={step.stepNumber}
              className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between hover:border-gold/50 transition group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-lg bg-gold/20 text-gold font-mono font-black text-xs flex items-center justify-center border border-gold/40">
                    #{step.stepNumber}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Goal: {step.targetBenchmark}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white group-hover:text-gold transition">
                  {step.title}
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={() => onLaunchPresetDrill(step.drillPreset)}
                  className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-gold hover:text-black text-xs font-black text-gold uppercase tracking-wider transition flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Play size={12} fill="currentColor" /> {step.drillLabel}
                  </span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Coach Summary Tip */}
        <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 text-xs text-zinc-200 flex items-center gap-2">
          <span className="text-gold font-black">💡 Next Step:</span>
          <span>{advice.customPrescription}</span>
        </div>
      </div>

      {/* Automated Leak Diagnostic & Personalized Coaching Prescription */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="text-ept-red" size={18} />
              <InfoTooltip
                title="Automated Leak Finder & Coach Prescriptions"
                description="In poker, a 'Leak' is a recurring strategic mistake that bleeds chips over time (like open-limping, chasing gutshots without pot odds, or ignoring bounty equity). Click 'Launch Corrective Drill' on any card to practice fixing that exact leak!"
              >
                <span>Automated Leak Finder & Coach Prescriptions</span>
              </InfoTooltip>
            </h3>
            <p className="text-xs text-zinc-400">
              AI diagnosis of your statistical leaks with 1-click corrective training drills.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            {(Object.keys(trackerStats.gradeCounts) as DecisionGrade[]).map((g) => (
              <span
                key={g}
                className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-zinc-300"
              >
                <strong className="text-gold">{g}:</strong> {trackerStats.gradeCounts[g]}
              </span>
            ))}
          </div>
        </div>

        {derived.diagnosedLeaks.length === 0 ? (
          <div className="p-8 text-center bg-black/40 rounded-xl border border-white/5 text-sm text-zinc-400">
            Play a few hands in the <strong>AI Bot Arena</strong> to populate your personal Leak Diagnostic Report!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {derived.diagnosedLeaks.map((leak: DiagnosedLeak) => (
              <div
                key={leak.id}
                className={`p-5 rounded-xl border flex flex-col justify-between ${
                  leak.severity === 'High'
                    ? 'bg-ept-red/10 border-ept-red/40'
                    : leak.severity === 'Medium'
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-emerald-500/10 border-emerald-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        leak.severity === 'High'
                          ? 'bg-ept-red text-white'
                          : leak.severity === 'Medium'
                          ? 'bg-amber-400 text-black'
                          : 'bg-emerald-400 text-black'
                      }`}
                    >
                      {leak.severity === 'Strength'
                        ? 'Core Strength'
                        : `${leak.severity} Priority Leak`}
                    </span>
                    <span className="text-xs font-mono font-bold text-gold">
                      {leak.metricBadge}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white mb-1.5">
                    {leak.title}
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                    {leak.diagnosis}
                  </p>
                  <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-xs text-zinc-200 mb-3">
                    <strong className="text-gold">Coach Prescription:</strong>{' '}
                    {leak.fixAction}
                  </div>
                </div>

                {/* Visual Examples & Animated Replay Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() =>
                      setExpandedLeakVisualId(
                        expandedLeakVisualId === leak.id ? null : leak.id
                      )
                    }
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      expandedLeakVisualId === leak.id
                        ? 'bg-gold text-black border-gold font-black'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 hover:border-gold/40'
                    }`}
                  >
                    <Eye size={12} />
                    <span>{expandedLeakVisualId === leak.id ? 'Hide Visual' : 'Table Visual'}</span>
                  </button>

                  <button
                    onClick={() =>
                      setActiveReplayerHandId(
                        leak.id.includes('wtsd') || leak.title.toLowerCase().includes('river')
                          ? 'hand-liam-test'
                          : 'hand-limp-punish'
                      )
                    }
                    className="py-1.5 px-2 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition flex items-center justify-center gap-1.5"
                  >
                    <Film size={12} />
                    <span>Hand Replay</span>
                  </button>
                </div>

                {/* Collapsible Table Scenario Visual */}
                {expandedLeakVisualId === leak.id && (
                  <div className="mb-3 animate-in fade-in duration-300">
                    <TableScenarioVisual
                      {...getLeakTableScenario(leak)}
                      onLaunchDrill={onLaunchPresetDrill}
                      compact
                    />
                  </div>
                )}

                <button
                  onClick={() =>
                    onLaunchPresetDrill(leak.recommendedPreset as ScenarioPreset)
                  }
                  className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-gold hover:text-black border border-gold/40 text-gold font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
                >
                  <Play size={13} fill="currentColor" /> Launch Corrective Drill in Arena
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Positional Breakdown & Recent Graded Hand Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Positional Performance Table (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-base font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <InfoTooltip
              title="Positional Performance Breakdown"
              description="Shows your VPIP/PFR, Coach Accuracy %, and Net Big Blinds won from each seat at the table. You should naturally win the most chips from late position (BTN and CO) and play tightest in UTG."
            >
              <span>Positional Performance</span>
            </InfoTooltip>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase text-[10px]">
                  <th className="py-2">Seat (Pos)</th>
                  <th className="py-2">Hands</th>
                  <th className="py-2">Played / Raised</th>
                  <th className="py-2">Coach %</th>
                  <th className="py-2 text-right">Net BB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {(['BTN', 'CO', 'HJ', 'MP', 'UTG', 'SB', 'BB'] as PositionName[]).map(
                  (pos) => {
                    const pStat = trackerStats.byPosition[pos];
                    if (!pStat) return null;
                    const posVpip =
                      pStat.hands > 0
                        ? Math.round((pStat.vpipCount / pStat.hands) * 100)
                        : 0;
                    const posPfr =
                      pStat.hands > 0
                        ? Math.round((pStat.pfrCount / pStat.hands) * 100)
                        : 0;
                    const posAcc =
                      pStat.totalDecisions > 0
                        ? Math.round(
                            (pStat.optimalDecisions / pStat.totalDecisions) * 100
                          )
                        : 100;
                    const pInfo = POSITION_INFO[pos];
                    return (
                      <tr key={pos} className="hover:bg-white/5">
                        <td className="py-2.5 font-black text-gold font-sans text-[11px]">
                          <InfoTooltip
                            title={
                              POSITION_BRIDGE_LABELS[pos]?.fullBridge ||
                              pInfo?.title ||
                              pos
                            }
                            description={pInfo?.description || pos}
                            example={pInfo?.rangeTip}
                            size={11}
                          >
                            <span>
                              {POSITION_BRIDGE_LABELS[pos]?.shortBridge || pos}
                            </span>
                          </InfoTooltip>
                        </td>
                        <td className="py-2.5 text-zinc-300">{pStat.hands}</td>
                        <td className="py-2.5 text-zinc-300">
                          {posVpip}% / {posPfr}%
                        </td>
                        <td className="py-2.5 text-emerald-400">{posAcc}%</td>
                        <td
                          className={`py-2.5 text-right font-bold ${
                            pStat.netBB >= 0 ? 'text-emerald-400' : 'text-ept-red'
                          }`}
                        >
                          {pStat.netBB >= 0 ? '+' : ''}
                          {pStat.netBB}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Decision Audit Log (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-base font-black text-white uppercase tracking-wider mb-4">
            <InfoTooltip
              title="Street-by-Street Hand Decision Audit Log"
              description="Chronological log of your last 40 decisions in the Bot Arena, showing your cards, seat position, street, the Coach's grade, and the exact mathematical comparison between your Equity % and Pot Odds %."
            >
              <span>Recent Hand Decision Log ({trackerStats.recentFeedback.length})</span>
            </InfoTooltip>
          </h3>
          {trackerStats.recentFeedback.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No graded decisions recorded yet. Your street-by-street actions and Coach grades will appear here automatically.
            </div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
              {trackerStats.recentFeedback.map((fb) => (
                <div
                  key={fb.id}
                  className="p-3.5 rounded-xl bg-black/50 border border-white/10 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          gradeColors[fb.grade]
                        }`}
                      >
                        {fb.grade}
                      </span>
                      <span className="text-xs font-bold text-gold">
                        [{fb.position} • {fb.street}]
                      </span>
                      <span className="text-xs font-black text-white">
                        {fb.heroCards.length === 2
                          ? getPreflopHandNotation(fb.heroCards[0], fb.heroCards[1])
                          : ''}{' '}
                        — {fb.headline}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 uppercase">
                        {GAME_MODES_INFO[fb.gameMode]?.shortBadge || fb.gameMode}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{fb.explanation}</p>
                    <div className="text-[11px] font-mono text-zinc-500">
                      Your Action: <strong className="text-white">{fb.actionTaken}</strong> •
                      Recommended:{' '}
                      <strong className="text-emerald-400">
                        {fb.recommendedAction}
                      </strong>{' '}
                      • Equity: {fb.handEquity}% vs Odds: {fb.potOdds}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Hand Replayer Modal Dialog */}
      {activeReplayerHandId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-zinc-950 border-2 border-gold shadow-[0_0_60px_rgba(212,175,55,0.4)]">
            <button
              onClick={() => setActiveReplayerHandId(null)}
              className="absolute top-4 right-4 z-40 p-2 rounded-full bg-black/80 hover:bg-ept-red text-zinc-400 hover:text-white border border-white/20 transition"
              title="Close Replayer"
            >
              <X size={18} />
            </button>
            <InteractiveHandReplayer
              sampleHandId={activeReplayerHandId}
              onClose={() => setActiveReplayerHandId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
