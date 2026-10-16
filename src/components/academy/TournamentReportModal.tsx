'use client';

import React from 'react';
import {
  Trophy,
  Award,
  Crown,
  Skull,
  TrendingUp,
  Target,
  Brain,
  Sparkles,
  RotateCcw,
  X,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Users,
} from 'lucide-react';
import { Card, DecisionGrade } from '@/lib/poker-trainer/types';
import { renderMiniCard } from './TableScenarioVisual';

export interface TournamentEliminationEntry {
  placement: number;
  playerName: string;
  avatar: string;
  isHero: boolean;
  knockedOutBy?: string;
  handNumber?: number;
}

export interface TournamentReportData {
  tournamentTitle: string;
  heroPlacement: number; // 1 for Champion, 2, 3, etc.
  totalParticipants: number;
  totalHandsPlayed: number;
  totalPrizePool: number;
  heroNetChips: number;
  heroKnockouts: {
    playerName: string;
    avatar: string;
    handNumber?: number;
  }[];
  eliminationLadder: TournamentEliminationEntry[];
  handsWon: number;
  winRatePercent: number;
  vpipPercent: number;
  pfrPercent: number;
  aggressionFactor: number;
  coachGrade: DecisionGrade;
  coachAccuracyPercent: number;
  biggestPotWon?: {
    pot: number;
    handDesc: string;
    heroCards: Card[];
    board: Card[];
  } | null;
  coachStrengths: string[];
  coachLeaksCaught: string[];
  coachVerdict: string;
}

interface Props {
  data: TournamentReportData;
  onClose: () => void;
  onStartNewTournament: () => void;
}

export default function TournamentReportModal({
  data,
  onClose,
  onStartNewTournament,
}: Props) {
  const isChampion = data.heroPlacement === 1;

  const getPlacementBadge = (placement: number) => {
    switch (placement) {
      case 1:
        return {
          icon: <Crown className="text-yellow-300 fill-yellow-400" size={18} />,
          text: '1ST PLACE (CHAMPION)',
          bg: 'bg-gradient-to-r from-yellow-500/30 via-amber-400/20 to-yellow-600/30 border-yellow-400/80 text-yellow-300',
        };
      case 2:
        return {
          icon: <Award className="text-zinc-200" size={18} />,
          text: '2ND PLACE (RUNNER-UP)',
          bg: 'bg-gradient-to-r from-zinc-400/20 to-zinc-600/20 border-zinc-300/60 text-zinc-200',
        };
      case 3:
        return {
          icon: <Award className="text-amber-600" size={18} />,
          text: '3RD PLACE (BRONZE PODIUM)',
          bg: 'bg-gradient-to-r from-amber-700/20 to-amber-900/20 border-amber-600/50 text-amber-400',
        };
      default:
        return {
          icon: <Skull className="text-red-400" size={16} />,
          text: `${placement}TH PLACE (ELIMINATED)`,
          bg: 'bg-zinc-800/80 border-white/10 text-zinc-400',
        };
    }
  };

  const getGradeColor = (grade: DecisionGrade) => {
    switch (grade) {
      case 'A+':
        return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/15';
      case 'B':
        return 'text-sky-400 border-sky-500/50 bg-sky-500/15';
      case 'C':
        return 'text-amber-400 border-amber-500/50 bg-amber-500/15';
      default:
        return 'text-rose-400 border-rose-500/50 bg-rose-500/15';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto rounded-3xl bg-zinc-950/95 border-2 border-gold/40 shadow-[0_0_60px_rgba(212,175,55,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Banner */}
        <div
          className={`px-6 py-5 sm:py-6 border-b flex items-center justify-between relative overflow-hidden ${
            isChampion
              ? 'bg-gradient-to-r from-amber-950 via-zinc-900 to-yellow-950 border-gold/50'
              : 'bg-gradient-to-r from-rose-950 via-zinc-900 to-zinc-950 border-rose-500/30'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl opacity-30 ${
              isChampion ? 'bg-yellow-400' : 'bg-rose-500'
            }`}
          />

          <div className="flex items-center gap-4 relative z-10">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border ${
                isChampion
                  ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-black border-yellow-200 shadow-yellow-500/30'
                  : 'bg-zinc-800 text-rose-400 border-rose-500/40 shadow-rose-900/30'
              }`}
            >
              {isChampion ? (
                <Trophy size={32} className="animate-bounce" />
              ) : (
                <Skull size={32} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-black/50 border border-white/20 text-zinc-300">
                  FULL GAME ELIMINATOR
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase border flex items-center gap-1.5 ${
                    getPlacementBadge(data.heroPlacement).bg
                  }`}
                >
                  {getPlacementBadge(data.heroPlacement).icon}
                  {getPlacementBadge(data.heroPlacement).text}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                {isChampion
                  ? '🏆 TOURNAMENT CHAMPION — WINNER TAKES ALL!'
                  : `TOURNAMENT FINISH: ${data.heroPlacement}TH OF ${data.totalParticipants}`}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                {isChampion
                  ? `You outlasted all ${data.totalParticipants - 1} opponents across ${data.totalHandsPlayed} hands and claimed the entire £${data.totalPrizePool.toLocaleString()} prize pool!`
                  : `Knocked out after ${data.totalHandsPlayed} intense hands. Complete tactical debrief generated below.`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close tournament report"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition z-10 shrink-0"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar text-zinc-200">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                <Coins size={13} className="text-gold" />
                Tournament Payout
              </span>
              <div className="mt-1">
                <div
                  className={`text-xl sm:text-2xl font-black ${
                    data.heroNetChips >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {data.heroNetChips >= 0 ? '+' : ''}£
                  {Math.abs(data.heroNetChips).toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {isChampion ? 'Entire Prize Pool Won' : 'Final Chip Result'}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                <Flame size={13} className="text-rose-400" />
                Knockouts Claimed
              </span>
              <div className="mt-1">
                <div className="text-xl sm:text-2xl font-black text-rose-300">
                  {data.heroKnockouts.length}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {data.heroKnockouts.length > 0
                    ? `${data.heroKnockouts.map((k) => k.playerName.split(' ')[0]).join(', ')}`
                    : 'No eliminations'}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                <Brain size={13} className="text-sky-400" />
                Coach Grade
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-lg border font-black text-lg ${getGradeColor(
                    data.coachGrade
                  )}`}
                >
                  {data.coachGrade}
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {data.coachAccuracyPercent}% Accuracy
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                <Target size={13} className="text-amber-400" />
                Play Frequency
              </span>
              <div className="mt-1">
                <div className="text-base sm:text-lg font-black text-white">
                  VPIP {data.vpipPercent}% / PFR {data.pfrPercent}%
                </div>
                <div className="text-[10px] text-zinc-400">
                  Aggression: {data.aggressionFactor}x • Win Rate: {data.winRatePercent}%
                </div>
              </div>
            </div>
          </div>

          {/* Elimination Order Ladder & Final Standings */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/10">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
              <Users size={14} className="text-gold" />
              Final Table Standings & Elimination Ladder
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.eliminationLadder.map((entry) => {
                const isHeroRow = entry.isHero;
                return (
                  <div
                    key={`${entry.placement}-${entry.playerName}`}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      isHeroRow
                        ? 'bg-gold/15 border-gold/60 text-white font-bold shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                        : entry.placement === 1
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
                        : 'bg-black/40 border-white/5 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 ${
                          entry.placement === 1
                            ? 'bg-yellow-400 text-black'
                            : entry.placement === 2
                            ? 'bg-zinc-300 text-black'
                            : entry.placement === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {entry.placement}
                      </span>
                      <div className="truncate">
                        <span className="font-bold truncate text-white">
                          {entry.playerName}
                        </span>
                        {isHeroRow && (
                          <span className="ml-1.5 text-[10px] text-gold uppercase tracking-wider font-black">
                            (YOU)
                          </span>
                        )}
                        {entry.knockedOutBy && entry.placement > 1 && (
                          <div className="text-[10px] text-zinc-400 truncate">
                            KO’d by {entry.knockedOutBy}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {entry.placement === 1 ? (
                        <span className="text-xs font-black text-yellow-400 flex items-center gap-1">
                          <Crown size={12} />
                          £{data.totalPrizePool.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400">
                          {entry.handNumber ? `Hand #${entry.handNumber}` : 'Out'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Biggest Pot Won Snapshot */}
          {data.biggestPotWon && (
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-[10px] uppercase font-black tracking-wider text-gold flex items-center justify-center sm:justify-start gap-1">
                  <Sparkles size={12} />
                  Biggest Tournament Pot Won
                </div>
                <div className="text-xl font-black text-white">
                  £{data.biggestPotWon.pot.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-300">
                  {data.biggestPotWon.handDesc}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-400 text-center mb-1 font-bold">
                    Hole Cards
                  </div>
                  <div className="flex gap-1 justify-center">
                    {data.biggestPotWon.heroCards.map((c, i) => (
                      <div key={`hero-pot-${i}`}>
                        {renderMiniCard(c, false, 'md')}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-10 w-px bg-white/15" />

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-400 text-center mb-1 font-bold">
                    Board Texture
                  </div>
                  <div className="flex gap-1 justify-center">
                    {data.biggestPotWon.board.map((c, i) => (
                      <div key={`board-pot-${i}`}>
                        {renderMiniCard(c, false, 'md')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Virtual Coach Tactical Debrief & Leak Analysis */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 border border-indigo-500/30 space-y-3.5">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-indigo-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-indigo-300">
                Virtual Coach Tournament Debrief
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed italic bg-black/30 p-3 rounded-xl border border-white/5">
              "{data.coachVerdict}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Tournament Strengths
                </span>
                <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                  {data.coachStrengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-rose-500/20 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                  <AlertTriangle size={13} />
                  Priority Improvement Focus
                </span>
                <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                  {data.coachLeaksCaught.length > 0 ? (
                    data.coachLeaksCaught.map((leak, i) => (
                      <li key={i}>{leak}</li>
                    ))
                  ) : (
                    <li>No critical leaks detected! High EV solid tournament play.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition"
          >
            Review Table Felt
          </button>

          <button
            onClick={onStartNewTournament}
            className="px-7 py-3 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase tracking-wider text-xs shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition flex items-center gap-2"
          >
            <RotateCcw size={15} />
            Start New Full Tournament
          </button>
        </div>
      </div>
    </div>
  );
}
