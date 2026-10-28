'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, RotateCcw, Dices, Sparkles, Trophy, Brain, ChevronLeft } from 'lucide-react';
import VegasAiDealer from '../VegasAiDealer';
import CrapsDiceVisual from '../CrapsDiceVisual';
import { VegasChipRack, VegasChipStack } from '../VegasChip';
import VegasWinSplash from '../VegasWinSplash';
import Vegas3DTableArena from '../Vegas3DTableArena';
import VegasGuideOddsDrawer from '../VegasGuideOddsDrawer';
import { playChipSound, playDiceSound, playWinSound } from '@/lib/vegas/VegasAudio';
import { addGameHistory } from '@/lib/vegas/VegasHistory';
import { getCrapsAdvice } from '@/lib/vegas/VegasStrategyEngine';

interface Props {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onOpenTutorial: () => void;
  onBackToFloor?: () => void;
}

type BetType = 'pass' | 'dont-pass' | 'field' | 'any7' | 'hard6' | 'hard8';

export default function CrapsGame({ bankroll, onUpdateBankroll, onOpenTutorial, onBackToFloor }: Props) {
  const [point, setPoint] = useState<number | null>(null);
  const [dice, setDice] = useState<[number, number]>([3, 4]);
  const [rolling, setRolling] = useState(false);
  const [showGuideOdds, setShowGuideOdds] = useState(false);
  const [bets, setBets] = useState<Record<BetType, number>>({
    pass: 25,
    'dont-pass': 0,
    field: 0,
    any7: 0,
    hard6: 0,
    hard8: 0,
  });
  const [selectedChip, setSelectedChip] = useState(25);
  const [history, setHistory] = useState<{ total: number; d1: number; d2: number }[]>([]);
  const [message, setMessage] = useState<string | null>(
    'Come Out Roll: Place your bet on the Pass Line!'
  );
  const [dealerDialogue, setDealerDialogue] = useState<string>(
    'Welcome to the Craps pit, darling! Place your bet on the Pass Line and shoot the dice!'
  );
  const [splashWin, setSplashWin] = useState<number | null>(null);
  const [splashDetails, setSplashDetails] = useState<{ subtitle?: string; winDetail?: string; badge?: string }>({});

  const totalActiveBets = Object.values(bets).reduce((a, b) => a + b, 0);

  const addBet = (type: BetType) => {
    if (rolling) return;
    if (totalActiveBets + selectedChip > bankroll) return;
    playChipSound();
    setBets((prev) => ({ ...prev, [type]: prev[type] + selectedChip }));
  };

  const clearBets = () => {
    if (rolling) return;
    playChipSound();
    setBets({
      pass: 0,
      'dont-pass': 0,
      field: 0,
      any7: 0,
      hard6: 0,
      hard8: 0,
    });
  };

  const rollDice = () => {
    if (rolling || totalActiveBets === 0 || totalActiveBets > bankroll) return;
    setRolling(true);
    setMessage(null);
    setSplashWin(null);
    playDiceSound();

    let rolls = 0;
    const interval = setInterval(() => {
      rolls++;
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice([d1, d2]);

      if (rolls >= 14) {
        clearInterval(interval);
        const finalD1 = Math.floor(Math.random() * 6) + 1;
        const finalD2 = Math.floor(Math.random() * 6) + 1;
        const sum = finalD1 + finalD2;
        setDice([finalD1, finalD2]);
        setRolling(false);
        playDiceSound();
        setHistory((prev) => [{ total: sum, d1: finalD1, d2: finalD2 }, ...prev.slice(0, 7)]);

        // Evaluate Bets
        let totalNet = 0;
        const messages: string[] = [];

        // 1. One-Roll Bets (Field & Any 7)
        if (bets.field > 0) {
          if ([2].includes(sum)) {
            const win = bets.field * 2;
            totalNet += win;
            messages.push(`Field Win 2:1 (+£${win})`);
          } else if ([12].includes(sum)) {
            const win = bets.field * 3;
            totalNet += win;
            messages.push(`Field Win 3:1 (+£${win})`);
          } else if ([3, 4, 9, 10, 11].includes(sum)) {
            const win = bets.field;
            totalNet += win;
            messages.push(`Field Win 1:1 (+£${win})`);
          } else {
            totalNet -= bets.field;
            messages.push(`Field Lost (-£${bets.field})`);
          }
        }

        if (bets.any7 > 0) {
          if (sum === 7) {
            const win = bets.any7 * 4;
            totalNet += win;
            messages.push(`Any 7 Hit! (+£${win})`);
          } else {
            totalNet -= bets.any7;
            messages.push(`Any 7 Lost (-£${bets.any7})`);
          }
        }

        if (bets.hard6 > 0) {
          if (finalD1 === 3 && finalD2 === 3) {
            const win = bets.hard6 * 9;
            totalNet += win;
            messages.push(`Hard 6 Hit 9:1! (+£${win})`);
          } else if (sum === 7 || sum === 6) {
            totalNet -= bets.hard6;
            messages.push(`Hard 6 Lost (-£${bets.hard6})`);
          }
        }

        if (bets.hard8 > 0) {
          if (finalD1 === 4 && finalD2 === 4) {
            const win = bets.hard8 * 9;
            totalNet += win;
            messages.push(`Hard 8 Hit 9:1! (+£${win})`);
          } else if (sum === 7 || sum === 8) {
            totalNet -= bets.hard8;
            messages.push(`Hard 8 Lost (-£${bets.hard8})`);
          }
        }

        // 2. Pass Line & Don't Pass Multi-roll logic
        if (point === null) {
          // Come Out Roll
          if (sum === 7 || sum === 11) {
            setDealerDialogue(`Natural ${sum}! Pass line wins, darling! Splendid roll.`);
            if (bets.pass > 0) {
              totalNet += bets.pass;
              messages.push(`Natural ${sum}! Pass Line Wins (+£${bets.pass})`);
            }
            if (bets['dont-pass'] > 0) {
              totalNet -= bets['dont-pass'];
              messages.push(`Natural ${sum}! Don't Pass Loses (-£${bets['dont-pass']})`);
            }
          } else if (sum === 2 || sum === 3 || sum === 12) {
            setDealerDialogue(`Craps ${sum}! Pass line is down, darling.`);
            if (bets.pass > 0) {
              totalNet -= bets.pass;
              messages.push(`Craps ${sum}! Pass Line Loses (-£${bets.pass})`);
            }
            if (bets['dont-pass'] > 0) {
              if (sum === 12) {
                messages.push(`Craps 12! Don't Pass Pushes (Stake Returned).`);
              } else {
                totalNet += bets['dont-pass'];
                messages.push(`Craps ${sum}! Don't Pass Wins (+£${bets['dont-pass']})`);
              }
            }
          } else {
            // Established Point
            setPoint(sum);
            setDealerDialogue(`Point is established at ${sum}! The puck is ON. Roll that ${sum} again!`);
            messages.push(`Point is established at ${sum}! Roll ${sum} again to WIN!`);
          }
        } else {
          // Point Phase
          if (sum === point) {
            // Table Wins
            setDealerDialogue(`Winner winner! Shooter hits the Point ${point}! Beautiful shooting, darling!`);
            if (bets.pass > 0) {
              totalNet += bets.pass;
              messages.push(`HIT THE POINT ${point}! Pass Line Wins (+£${bets.pass}) 🎉`);
            }
            if (bets['dont-pass'] > 0) {
              totalNet -= bets['dont-pass'];
              messages.push(`Hit Point ${point}! Don't Pass Loses (-£${bets['dont-pass']})`);
            }
            setPoint(null); // Puck back to OFF
          } else if (sum === 7) {
            // Seven Out
            setDealerDialogue(`Seven Out! Line away. Pass Line loses, Don't Pass wins.`);
            if (bets.pass > 0) {
              totalNet -= bets.pass;
              messages.push(`SEVEN OUT! Pass Line Loses (-£${bets.pass})`);
            }
            if (bets['dont-pass'] > 0) {
              totalNet += bets['dont-pass'];
              messages.push(`Seven Out! Don't Pass Wins (+£${bets['dont-pass']})`);
            }
            setPoint(null); // Puck back to OFF
          } else {
            setDealerDialogue(`Rolled ${sum}. Point remains ${point}. Roll again!`);
            messages.push(`Rolled ${sum}. Point is ${point}. Keep rolling!`);
          }
        }

        if (totalNet !== 0) {
          onUpdateBankroll(totalNet);
        }

        // Table Felt Chip Sweeping: Automatically sweep one-roll bets and resolved line bets
        setBets((prev) => {
          const next = { ...prev };
          // Single-roll proposition bets always resolve & sweep
          next.field = 0;
          next.any7 = 0;
          if (sum === 7 || sum === 6) next.hard6 = 0;
          if (sum === 7 || sum === 8) next.hard8 = 0;
          // When Come Out roll resolves or Point is hit / seven-out, sweep resolved line bets
          if (point === null && (sum === 7 || sum === 11 || sum === 2 || sum === 3 || sum === 12)) {
            next.pass = 0;
            next['dont-pass'] = 0;
          } else if (point !== null && (sum === point || sum === 7)) {
            next.pass = 0;
            next['dont-pass'] = 0;
          }
          return next;
        });

        if (totalNet > 0) {
          playWinSound();
          setSplashWin(totalNet);

          const winningParts = messages.filter((m) => m.includes('+£') || m.includes('Wins') || m.includes('Hit'));
          const winDetail = winningParts.length > 0 ? winningParts.join(' • ') : `Shooter rolled ${sum} on the felt`;
          const badge =
            sum === point
              ? `POINT ${point} HIT`
              : (sum === 7 || sum === 11) && point === null
              ? `NATURAL ${sum}`
              : `ROLLED ${sum}`;

          setSplashDetails({
            badge,
            subtitle: `Shooter rolled ${sum} (${finalD1} + ${finalD2})`,
            winDetail,
          });
        }

        const summaryText = messages.join(' • ');
        setMessage(summaryText);

        addGameHistory({
          gameId: 'craps',
          headline: `Shooter Rolled ${sum} (${finalD1} + ${finalD2})`,
          detail: summaryText || `Rolled ${sum}`,
          delta: totalNet,
          badge: sum === 7 ? 'Seven' : sum === 11 ? 'Yo 11' : point === sum ? 'Point Hit' : `Roll ${sum}`,
        });
      }
    }, 65);
  };

  return (
    <div
      style={{ touchAction: 'manipulation' }}
      className="h-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden select-none touch-manipulation relative bg-gradient-to-b from-emerald-950/80 via-black to-zinc-950 border border-emerald-500/40 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-2xl font-sans"
    >
      {/* Big Win Splash Banner */}
      <VegasWinSplash
        winAmount={splashWin}
        title="CRAPS WIN!"
        subtitle={splashDetails.subtitle}
        winDetail={splashDetails.winDetail}
        badge={splashDetails.badge}
        onComplete={() => setSplashWin(null)}
      />

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-1.5 sm:gap-2 border-b border-white/10 pb-1.5 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {onBackToFloor ? (
            <button
              type="button"
              onClick={onBackToFloor}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-300 hover:text-white transition active:scale-95 shrink-0"
              title="Return to Casino Floor"
            >
              <ChevronLeft size={13} className="text-gold" />
              <span className="hidden sm:inline">Floor</span>
            </button>
          ) : (
            <Link
              href="/vegas"
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-300 hover:text-white transition shrink-0"
            >
              <ChevronLeft size={13} className="text-gold" />
              <span className="hidden sm:inline">Floor</span>
            </Link>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-widest shrink-0">
                Vegas Strip Dice
              </span>
              <span className="text-zinc-400 text-[10px] font-mono hidden sm:inline">Near Zero Edge with Odds</span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1 mt-0.5 truncate">
              <span>Las Vegas Craps</span>
              <span className="text-[9px] font-mono font-bold text-gold px-1.5 py-0.2 rounded bg-gold/15 border border-gold/30">
                Pass & Don&apos;t Pass
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Slide-over Guide & Odds Advisor Trigger */}
          <button
            type="button"
            onClick={() => setShowGuideOdds(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 border border-emerald-400/50 text-emerald-300 hover:text-white text-[10px] font-black uppercase tracking-wider transition shadow active:scale-95"
            title="Open Sarah's Croupier Chat & Craps Odds Advisor"
          >
            <Brain size={12} className="text-emerald-400 shrink-0" />
            <span className="hidden xs:inline">GUIDE / ODDS</span>
            <span className="xs:hidden">ODDS</span>
            <span className="ml-0.5 px-1 py-0.2 rounded bg-emerald-500/40 border border-emerald-300 text-white text-[9px] font-mono font-black animate-pulse">
              {getCrapsAdvice(point).action}
            </span>
          </button>

          <Link
            href="/academy?tab=leaderboard&discipline=roulette-craps"
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold text-[10px] font-black uppercase tracking-wider transition shadow"
            title="View Roulette & Craps League Standings"
          >
            <Trophy size={12} className="text-gold" />
            <span className="hidden sm:inline">Dice League</span>
            <span className="sm:hidden">League</span>
          </Link>
          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-300 hover:text-white transition"
          >
            <HelpCircle size={12} className="text-gold" />
            <span className="hidden sm:inline">Rules</span>
          </button>
        </div>
      </div>

      {/* AI Glamorous Dealer Sarah Header (Visible on desktop; collapsed into slide-over drawer on mobile) */}
      <div className="shrink-0 mb-1 hidden md:block">
        <VegasAiDealer
          dialogue={dealerDialogue}
          gameTitle="Craps"
          status={point === null ? 'Come Out Roll' : `Point is ${point}`}
        />
      </div>

      {/* Live Craps Strategy Coach Advice HUD (Visible on desktop; collapsed into slide-over drawer on mobile) */}
      <div className="shrink-0 hidden md:flex bg-gradient-to-r from-emerald-950/80 via-black to-zinc-950 border border-emerald-500/40 p-2 sm:p-3 rounded-xl items-center justify-between gap-2 text-xs shadow-lg mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Brain size={14} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase font-mono font-black text-emerald-300">
                Odds Advisor
              </span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold hidden sm:inline">
                ⚡ Zero Edge
              </span>
            </div>
            {(() => {
              const adv = getCrapsAdvice(point);
              return (
                <div className="truncate text-[10px] sm:text-[11px] text-zinc-300 font-bold">
                  {adv.headline}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="shrink-0">
          <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-black text-[9px] sm:text-xs font-mono">
            REC: {getCrapsAdvice(point).action}
          </span>
        </div>
      </div>

      {/* Point Puck Bar & 3D Dice Throw Arena */}
      <div className="shrink-0 flex items-center justify-between bg-black/70 p-1.5 sm:p-3 rounded-xl border border-white/10 gap-2 shadow-xl mb-1">
        {/* 3D Realistic Point Puck */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="text-zinc-400 font-bold uppercase text-[9px] hidden sm:inline">Point:</div>
          <div
            className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2 sm:border-4 flex flex-col items-center justify-center font-mono font-black text-[9px] sm:text-xs uppercase shadow-xl transition-all duration-300 ${
              point !== null
                ? 'bg-gradient-to-br from-white via-zinc-100 to-zinc-300 text-black border-gold shadow-[0_0_15px_rgba(212,175,55,0.7)]'
                : 'bg-gradient-to-br from-zinc-900 to-black text-zinc-500 border-zinc-700'
            }`}
          >
            <span className="text-[7.5px] sm:text-[9px] font-bold leading-none">{point !== null ? 'ON' : 'OFF'}</span>
            {point !== null && <span className="text-[11px] sm:text-sm text-black leading-none mt-0.5">{point}</span>}
          </div>
        </div>

        {/* 3D Dice Throw Arena Display */}
        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-xl shadow-inner">
          <div className="flex items-center gap-1.5">
            <CrapsDiceVisual value={dice[0]} rolling={rolling} size="sm" />
            <CrapsDiceVisual value={dice[1]} rolling={rolling} size="sm" />
          </div>
          <div className="text-base sm:text-xl font-black text-gold font-mono">
            = {dice[0] + dice[1]}
          </div>
        </div>

        {/* Roll History */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-[100px] sm:max-w-none">
          <span className="text-[9px] uppercase font-bold text-zinc-400 mr-0.5 hidden sm:inline">Rolls:</span>
          {history.slice(0, 5).map((h, i) => (
            <span
              key={i}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center font-mono text-[9px] sm:text-[10px] font-black shadow shrink-0 ${
                h.total === 7
                  ? 'bg-red-700 text-white'
                  : h.total === 11
                  ? 'bg-gold text-black'
                  : 'bg-zinc-800 text-white border border-white/20'
              }`}
            >
              {h.total}
            </span>
          ))}
        </div>
      </div>

      {/* 3D Tilted Craps Pit Table Arena */}
      <Vegas3DTableArena
        gameType="craps"
        showShoe={false}
        showDiscardRack={false}
        showChipTray={true}
        watermarkTitle="VEGAS CRAPS PIT"
        watermarkSubtitle="PASS LINE • DON'T PASS • FIELD BETS • HARDWAYS"
      >
        <div className="space-y-4 relative z-10">
          {/* Number Boxes (Point Trackers) */}
          <div className="grid grid-cols-6 gap-1 sm:gap-2 text-center font-black relative z-10">
            {[4, 5, 6, 8, 9, 10].map((num) => (
              <div
                key={num}
                className={`p-1.5 sm:p-3 rounded-xl border-2 transition ${
                  point === num
                    ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-white shadow-[0_0_25px_#ffd700] scale-105'
                    : 'bg-black/60 text-white border-white/20'
                }`}
              >
                <div className="text-[9px] sm:text-[10px] uppercase text-zinc-300">Point</div>
                <div className="text-lg sm:text-2xl font-mono">{num}</div>
                {point === num && (
                  <div className="text-[8px] sm:text-[9px] bg-black text-gold font-black uppercase px-1 rounded mt-0.5 sm:mt-1">
                    Active
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Main Betting Blocks with 3D Chips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
            {/* Pass Line */}
            <div
              onClick={() => addBet('pass')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition select-none flex flex-col justify-between relative ${
                bets.pass > 0
                  ? 'bg-emerald-950/90 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                  : 'bg-black/60 border-white/20 hover:border-gold'
              }`}
            >
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center justify-between">
                  <span>PASS LINE (1:1)</span>
                  <span className="text-[10px] text-zinc-400">Wins 7/11</span>
                </div>
                <p className="text-[10px] text-zinc-300 mt-1">
                  Root for shooter. Wins on Come Out 7/11; wins if Point rolls before 7.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Wager:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-gold text-sm">
                    £{bets.pass.toLocaleString()}
                  </span>
                  {bets.pass > 0 && <VegasChipStack amount={bets.pass} size="xs" />}
                </div>
              </div>
            </div>

            {/* Don't Pass */}
            <div
              onClick={() => addBet('dont-pass')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition select-none flex flex-col justify-between relative ${
                bets['dont-pass'] > 0
                  ? 'bg-red-950/90 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : 'bg-black/60 border-white/20 hover:border-gold'
              }`}
            >
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-red-300 flex items-center justify-between">
                  <span>DON&apos;T PASS (1:1)</span>
                  <span className="text-[10px] text-zinc-400">Wins 2/3</span>
                </div>
                <p className="text-[10px] text-zinc-300 mt-1">
                  The Dark Side. Wins on 2/3 (12 push); wins if 7 rolls before the Point.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Wager:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-gold text-sm">
                    £{bets['dont-pass'].toLocaleString()}
                  </span>
                  {bets['dont-pass'] > 0 && <VegasChipStack amount={bets['dont-pass']} size="xs" />}
                </div>
              </div>
            </div>

            {/* The Field */}
            <div
              onClick={() => addBet('field')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition select-none flex flex-col justify-between relative ${
                bets.field > 0
                  ? 'bg-purple-950/90 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                  : 'bg-black/60 border-white/20 hover:border-gold'
              }`}
            >
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center justify-between">
                  <span>THE FIELD (1-Roll)</span>
                  <span className="text-[10px] text-gold font-bold">2=2x • 12=3x</span>
                </div>
                <p className="text-[10px] text-zinc-300 mt-1">
                  Wins next roll if 2, 3, 4, 9, 10, 11, or 12 rolls!
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Wager:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-gold text-sm">
                    £{bets.field.toLocaleString()}
                  </span>
                  {bets.field > 0 && <VegasChipStack amount={bets.field} size="xs" />}
                </div>
              </div>
            </div>
          </div>

          {/* Center Proposition Bets */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs relative z-10">
            <div
              onClick={() => addBet('any7')}
              className={`p-2.5 rounded-xl border cursor-pointer transition select-none relative ${
                bets.any7 > 0
                  ? 'bg-gold/20 border-gold text-gold font-bold ring-1 ring-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-black/60 border-white/10 text-zinc-300 hover:border-white/30'
              }`}
            >
              <div className="font-black text-amber-300">ANY 7 (4:1)</div>
              <div className="text-[10px] text-zinc-400">Single roll 7</div>
              <div className="font-mono text-xs font-black text-gold mt-1">£{bets.any7}</div>
              {bets.any7 > 0 && (
                <div className="absolute -top-2 right-2">
                  <VegasChipStack amount={bets.any7} size="xs" />
                </div>
              )}
            </div>

            <div
              onClick={() => addBet('hard6')}
              className={`p-2.5 rounded-xl border cursor-pointer transition select-none relative ${
                bets.hard6 > 0
                  ? 'bg-gold/20 border-gold text-gold font-bold ring-1 ring-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-black/60 border-white/10 text-zinc-300 hover:border-white/30'
              }`}
            >
              <div className="font-black text-emerald-300">HARD 6 (9:1)</div>
              <div className="text-[10px] text-zinc-400">Pair of 3s (⚂⚂)</div>
              <div className="font-mono text-xs font-black text-gold mt-1">£{bets.hard6}</div>
              {bets.hard6 > 0 && (
                <div className="absolute -top-2 right-2">
                  <VegasChipStack amount={bets.hard6} size="xs" />
                </div>
              )}
            </div>

            <div
              onClick={() => addBet('hard8')}
              className={`p-2.5 rounded-xl border cursor-pointer transition select-none relative ${
                bets.hard8 > 0
                  ? 'bg-gold/20 border-gold text-gold font-bold ring-1 ring-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-black/60 border-white/10 text-zinc-300 hover:border-white/30'
              }`}
            >
              <div className="font-black text-emerald-300">HARD 8 (9:1)</div>
              <div className="text-[10px] text-zinc-400">Pair of 4s (⚃⚃)</div>
              <div className="font-mono text-xs font-black text-gold mt-1">£{bets.hard8}</div>
              {bets.hard8 > 0 && (
                <div className="absolute -top-2 right-2">
                  <VegasChipStack amount={bets.hard8} size="xs" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Vegas3DTableArena>

      {/* Outcome Announcement */}
      {message && (
        <div className="shrink-0 bg-black/70 border border-gold/40 text-center py-1 px-3 rounded-lg text-xs font-bold text-zinc-200 mb-1">
          {message}
        </div>
      )}

      {/* Controls Bar with Authentic 3D Chip Rack */}
      <div className="shrink-0 mt-auto bg-black/60 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/10 flex items-center justify-between gap-2 sm:gap-4">
        {/* Chip Rack */}
        <div className="flex items-center gap-2">
          <VegasChipRack
            values={[5, 10, 25, 50, 100]}
            selectedValue={selectedChip}
            onSelect={setSelectedChip}
            disabled={rolling}
          />
          {totalActiveBets > 0 && !rolling && (
            <button
              onClick={clearBets}
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-[10px] sm:text-xs font-bold transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Wager and Roll Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[9px] uppercase font-bold text-zinc-400">Bet:</div>
            <div className="text-xs sm:text-base font-mono font-black text-gold">
              £{totalActiveBets.toLocaleString()}
            </div>
          </div>

          <button
            disabled={rolling || totalActiveBets === 0 || totalActiveBets > bankroll}
            onClick={rollDice}
            className="px-4 py-2 sm:px-8 sm:py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black uppercase text-[11px] sm:text-xs tracking-wider shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:brightness-110 active:scale-95 transition disabled:opacity-40"
          >
            {rolling ? 'ROLLING...' : 'SHOOT 🎲'}
          </button>
        </div>
      </div>

      {/* Slide-Over Guide & Odds Advisor Drawer */}
      <VegasGuideOddsDrawer
        isOpen={showGuideOdds}
        onClose={() => setShowGuideOdds(false)}
        gameTitle="Las Vegas Craps"
        dealerDialogue={dealerDialogue}
        dealerStatus={point === null ? 'Come Out Roll' : `Point is ${point}`}
        advisorTitle="Zero Edge Craps Odds Advisor"
        recommendation={getCrapsAdvice(point).action}
        recommendationHeadline={getCrapsAdvice(point).headline}
        recommendationExplanation="Pass Line and Don't Pass bets carry minimal house edge (~1.41% and 1.36%). Once a Point is established, taking True Odds behind your bet has a true 0.00% statistical house edge."
        rulesSummary={[
          { label: 'Pass Line Edge', value: '1.41% (Low Variance)', highlight: true },
          { label: "Don't Pass Edge", value: '1.36% (Lowest Line Bet)', highlight: true },
          { label: 'Free True Odds', value: '0.00% Edge (True Mathematical Odds)', highlight: true },
          { label: 'Proposition Bets (Any 7)', value: '16.67% Edge (Avoid)', highlight: false },
        ]}
      />
    </div>
  );
}
