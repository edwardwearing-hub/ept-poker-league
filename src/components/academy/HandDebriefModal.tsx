'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CoachFeedback,
  DecisionGrade,
  GameMode,
  PositionName,
  TrainerPlayer,
} from '@/lib/poker-trainer/types';
import { renderMiniCard } from './TableScenarioVisual';
import { ActionTimelineEntry } from './BotTrainerArena';
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Award,
  Play,
  X,
  Sparkles,
  Lightbulb,
  ArrowRight,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Loader2,
} from 'lucide-react';

export interface HandDebriefData {
  handNumber: number;
  gameMode: GameMode;
  blinds: { sb: number; bb: number; ante?: number };
  heroCards: Card[];
  heroPosition: PositionName;
  communityCards: Card[];
  potWon: number;
  winnerNames: string[];
  winningHandDesc: string;
  heroNetChips: number;
  heroFolded: boolean;
  decisions: CoachFeedback[];
  timeline: ActionTimelineEntry[];
}

interface Props {
  data: HandDebriefData;
  onClose: () => void;
  onDealNextHand: () => void;
  onLaunchDrill?: (preset: any) => void;
}

export default function HandDebriefModal({
  data,
  onClose,
  onDealNextHand,
  onLaunchDrill,
}: Props) {
  const {
    handNumber,
    gameMode,
    blinds,
    heroCards,
    heroPosition,
    communityCards,
    potWon,
    winnerNames,
    winningHandDesc,
    heroNetChips,
    heroFolded,
    decisions,
  } = data;

  const heroWon = heroNetChips > 0;
  const heroNetBB = Number((heroNetChips / blinds.bb).toFixed(1));

  const [aiCoachReport, setAiCoachReport] = useState<{
    source: 'ai' | 'fallback';
    headline: string;
    analysis: string;
    keyTakeaway: string;
    recommendedDrill: string;
  } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingAi(true);

    fetch('/api/academy/coach-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'hand_debrief',
        handNumber,
        gameMode,
        blinds,
        heroCards,
        heroPosition,
        communityCards,
        potWon,
        winnerNames,
        winningHandDesc,
        heroNetChips,
        heroFolded,
        decisions: decisions.map((d) => ({
          street: d.street,
          actionTaken: d.actionTaken,
          recommendedAction: d.recommendedAction,
          grade: d.grade,
          evDelta: d.evDelta,
          headline: d.headline,
          explanation: d.explanation,
          leakCategory: d.leakCategory,
        })),
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (isMounted && result) {
          setAiCoachReport(result);
        }
      })
      .catch((err) => {
        console.warn('AI Coach debrief fetch error:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingAi(false);
      });

    return () => {
      isMounted = false;
    };
  }, [handNumber, gameMode, heroNetChips, heroFolded, decisions]);

  // Compute Overall Hand Grade from Hero's decisions
  const computeOverallGrade = (): { grade: DecisionGrade; label: string; score: number } => {
    if (decisions.length === 0) {
      return { grade: 'A+', label: 'Disciplined Fold / No Action', score: 95 };
    }
    const gradeWeights: Record<DecisionGrade, number> = {
      'A+': 100,
      B: 85,
      C: 65,
      D: 45,
      F: 20,
    };
    const total = decisions.reduce((acc, d) => acc + (gradeWeights[d.grade] || 70), 0);
    const avg = Math.round(total / decisions.length);

    if (avg >= 92) return { grade: 'A+', label: 'GTO Masterclass', score: avg };
    if (avg >= 80) return { grade: 'B', label: 'Solid Poker Play', score: avg };
    if (avg >= 60) return { grade: 'C', label: 'Inaccuracies Detected', score: avg };
    if (avg >= 40) return { grade: 'D', label: 'Significant Leaks', score: avg };
    return { grade: 'F', label: 'Costly Mistakes', score: avg };
  };

  const overall = computeOverallGrade();

  // Extract positive highlights
  const positiveHighlights: string[] = [];
  decisions.forEach((d) => {
    if (d.grade === 'A+' || d.grade === 'B') {
      positiveHighlights.push(`${d.street}: ${d.headline} (${d.actionTaken})`);
    }
  });

  if (positiveHighlights.length === 0 && heroFolded) {
    positiveHighlights.push('Disciplined pre-flop folding saved chips with non-playable hand.');
  }

  // Extract critical mistakes / missed opportunities
  const improvementAreas: {
    street: string;
    mistake: string;
    recommendation: string;
    explanation: string;
    evDelta: number;
    tip: string;
  }[] = [];

  decisions.forEach((d) => {
    if (d.grade === 'C' || d.grade === 'D' || d.grade === 'F' || d.evDelta < -0.5) {
      improvementAreas.push({
        street: d.street,
        mistake: `You chose to ${d.actionTaken}`,
        recommendation: `Optimal move: ${d.recommendedAction}`,
        explanation: d.explanation,
        evDelta: d.evDelta,
        tip: d.strategicTip,
      });
    }
  });

  const gradeBadgeStyle = {
    'A+': 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]',
    B: 'bg-cyan-500 text-black border-cyan-400',
    C: 'bg-amber-500 text-black border-amber-400',
    D: 'bg-orange-500 text-black border-orange-400',
    F: 'bg-ept-red text-white border-red-500',
  }[overall.grade];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-zinc-900 via-black to-zinc-950 border-2 border-gold shadow-[0_0_60px_rgba(212,175,55,0.4)] text-left flex flex-col">
        {/* Header Strip */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-950/80 via-black to-zinc-900 border-b border-white/10 flex items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shadow">
              <Brain size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                  Hand #{handNumber} Debrief & Coach Report
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Blinds £{blinds.sb}/£{blinds.bb}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                How You Played & How to Improve
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-ept-red text-zinc-400 hover:text-white transition"
            title="Close Debrief"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Top Score & Result Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Hand Grade Card */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col justify-between text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                Overall Coach Grade
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 my-1">
                <span
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xl border ${gradeBadgeStyle}`}
                >
                  {overall.grade}
                </span>
                <div>
                  <div className="text-sm font-black text-white">{overall.label}</div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    Accuracy: {overall.score}%
                  </div>
                </div>
              </div>
            </div>

            {/* Net Chip Profit / Loss */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col justify-between text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                Hand Chip Result
              </span>
              <div className="my-1">
                <div
                  className={`text-2xl font-mono font-black flex items-center justify-center sm:justify-start gap-1 ${
                    heroWon ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {heroWon ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  <span>
                    {heroNetChips > 0 ? '+' : ''}£{heroNetChips.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  {heroNetBB > 0 ? '+' : ''}
                  {heroNetBB} Big Blinds
                </div>
              </div>
            </div>

            {/* Pot Winner */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col justify-between text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                Pot Outcome
              </span>
              <div className="my-1">
                <div className="text-sm font-black text-gold truncate">
                  🏆 {winnerNames.join(' & ')}
                </div>
                <div className="text-xs text-white font-bold mt-0.5">
                  Won £{potWon.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  {winningHandDesc}
                </div>
              </div>
            </div>
          </div>

          {/* Table Cards & Board Overview Strip */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex flex-wrap items-center justify-between gap-3">
            {/* Hero's Hole Cards & Position */}
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-1 rounded bg-gold text-black font-black text-[10px]">
                {heroPosition}
              </span>
              <div className="flex -space-x-1.5">
                {heroCards.map((c) => renderMiniCard(c, false, 'sm'))}
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Your Hole Cards</div>
                <div className="text-[10px] text-zinc-400">
                  {heroFolded ? 'Folded during hand' : 'Played through'}
                </div>
              </div>
            </div>

            {/* Board Cards */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1">
                Board:
              </span>
              {communityCards.length === 0 ? (
                <span className="text-[11px] text-zinc-500 font-mono">
                  (No Flop Dealt)
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  {communityCards.map((c) => renderMiniCard(c, false, 'sm'))}
                </div>
              )}
            </div>
          </div>

          {/* AI Master Coach Hand Retrospective */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black border border-indigo-500/30 relative overflow-hidden space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                  <Brain size={16} />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>AI Master Coach Breakdown</span>
                  <Sparkles size={13} className="text-amber-400" />
                </h4>
              </div>

              {isLoadingAi ? (
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2.5 py-1 rounded-full animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  Analyzing hand dynamics...
                </span>
              ) : aiCoachReport?.source === 'ai' ? (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  🤖 Gemini AI Powered
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-300 bg-sky-950/60 border border-sky-500/40 px-2.5 py-0.5 rounded-full">
                  ⚡ Local Engine Verified (Failsafe)
                </span>
              )}
            </div>

            {isLoadingAi ? (
              <div className="space-y-2 py-2">
                <div className="h-4 bg-white/5 rounded-md animate-pulse w-3/4" />
                <div className="h-3 bg-white/5 rounded-md animate-pulse w-full" />
                <div className="h-3 bg-white/5 rounded-md animate-pulse w-5/6" />
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div>
                  <h5 className="text-sm font-bold text-amber-300">
                    {aiCoachReport?.headline || 'Hand Completed'}
                  </h5>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                    {aiCoachReport?.analysis}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  {aiCoachReport?.keyTakeaway && (
                    <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 flex items-start gap-2">
                      <Lightbulb size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-400 block">
                          Key Strategic Takeaway
                        </span>
                        <span className="text-zinc-200 text-[11px] leading-snug">
                          {aiCoachReport.keyTakeaway}
                        </span>
                      </div>
                    </div>
                  )}

                  {aiCoachReport?.recommendedDrill && (
                    <div className="p-3 rounded-xl bg-black/60 border border-indigo-500/30 flex items-start gap-2">
                      <Target size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-400 block">
                          Recommended Practice Drill
                        </span>
                        <span className="text-zinc-200 text-[11px] leading-snug">
                          {aiCoachReport.recommendedDrill}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: What You Could Have Done Better (Mistakes & Leaks) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">
                !
              </span>
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                What You Could Have Done Better
              </h4>
            </div>

            {improvementAreas.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                <div>
                  <strong>Flawless Decisions!</strong> You made zero graded mistakes on
                  this hand. Every decision aligned with GTO and winning league strategy.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {improvementAreas.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-red-950/20 border border-red-500/40 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-900/60 text-red-200 border border-red-500/50">
                        {item.street} Inaccuracy
                      </span>
                      {item.evDelta !== 0 && (
                        <span className="text-[11px] font-mono text-red-400 font-bold">
                          Estimated EV Loss: {item.evDelta} BB
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-black/60 border border-white/5">
                        <div className="text-[10px] text-zinc-400 font-bold uppercase">
                          What You Did:
                        </div>
                        <div className="font-bold text-red-300 mt-0.5">
                          {item.mistake}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/60 border border-emerald-500/30">
                        <div className="text-[10px] text-emerald-400 font-bold uppercase">
                          Better Play:
                        </div>
                        <div className="font-bold text-emerald-300 mt-0.5">
                          {item.recommendation}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                      {item.explanation}
                    </p>

                    {item.tip && (
                      <div className="p-2 rounded-lg bg-black/50 border border-gold/30 text-[11px] text-zinc-200 flex items-start gap-1.5">
                        <Lightbulb size={12} className="text-gold shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-gold">Pro Tip:</strong> {item.tip}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: What You Did Well (Strengths) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                What You Did Well
              </h4>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              {positiveHighlights.map((hi, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                  <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                  <span>{hi}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Street-by-Street Decision Breakdown */}
          {decisions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-gold" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Street-by-Street Decision Log
                </h4>
              </div>

              <div className="space-y-2">
                {decisions.map((dec, i) => (
                  <div
                    key={dec.id || i}
                    className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white font-mono">
                          {dec.street}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                            dec.grade === 'A+' || dec.grade === 'B'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-400 border border-red-500/40'
                          }`}
                        >
                          Grade {dec.grade}
                        </span>
                        <span className="font-bold text-white">{dec.headline}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {dec.explanation}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 space-y-0.5 font-mono text-[11px]">
                      <div>
                        Action: <strong className="text-white">{dec.actionTaken}</strong>
                      </div>
                      <div>
                        Rec:{' '}
                        <strong className="text-emerald-400">
                          {dec.recommendedAction}
                        </strong>
                      </div>
                      <div className="text-zinc-500 text-[10px]">
                        Win Chance: {dec.handEquity}% | Call Odds: {dec.potOdds}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-20 backdrop-blur-md">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase transition border border-white/10"
          >
            Close Report
          </button>

          <button
            onClick={() => {
              onClose();
              onDealNextHand();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition flex items-center gap-2"
          >
            <Play size={14} fill="currentColor" />
            <span>Deal Next Hand →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
