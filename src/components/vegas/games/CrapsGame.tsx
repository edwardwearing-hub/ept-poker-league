'use client';

import React, { useState } from 'react';
import { HelpCircle, RotateCcw, Dices, Sparkles } from 'lucide-react';
import VegasAiDealer from '../VegasAiDealer';
import CrapsDiceVisual from '../CrapsDiceVisual';
import { VegasChipRack, VegasChipStack } from '../VegasChip';
import VegasWinSplash from '../VegasWinSplash';
import Vegas3DTableArena from '../Vegas3DTableArena';
import { playChipSound, playDiceSound, playWinSound } from '@/lib/vegas/VegasAudio';
import { addGameHistory } from '@/lib/vegas/VegasHistory';

interface Props {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onOpenTutorial: () => void;
}

type BetType = 'pass' | 'dont-pass' | 'field' | 'any7' | 'hard6' | 'hard8';

export default function CrapsGame({ bankroll, onUpdateBankroll, onOpenTutorial }: Props) {
  const [point, setPoint] = useState<number | null>(null);
  const [dice, setDice] = useState<[number, number]>([3, 4]);
  const [rolling, setRolling] = useState(false);
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

        if (totalNet > 0) {
          playWinSound();
          setSplashWin(totalNet);
        }

        const summaryText = messages.join(' • ');
        setMessage(summaryText);

        addGameHistory({
          gameId: 'craps',
          headline: `Shooter Rolled ${sum} (${d1} + ${d2})`,
          detail: summaryText || `Rolled ${sum}`,
          delta: totalNet,
          badge: sum === 7 ? 'Seven' : sum === 11 ? 'Yo 11' : point === sum ? 'Point Hit' : `Roll ${sum}`,
        });
      }
    }, 65);
  };

  return (
    <div className="bg-gradient-to-b from-emerald-950/80 via-black to-zinc-950 border border-emerald-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden space-y-6">
      {/* Big Win Splash Banner */}
      <VegasWinSplash winAmount={splashWin} title="CRAPS WIN!" onComplete={() => setSplashWin(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-widest">
              Game #3 • Vegas Strip Dice
            </span>
            <span className="text-zinc-400 text-xs font-mono">Near Zero Edge with Odds</span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
            <span>Las Vegas High-Roller Craps</span>
            <span className="text-xs font-mono font-bold text-gold px-2 py-0.5 rounded bg-gold/15 border border-gold/30">
              Pass & Don&apos;t Pass
            </span>
          </h3>
        </div>

        <button
          onClick={onOpenTutorial}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition"
        >
          <HelpCircle size={14} className="text-gold" />
          <span>Rules & Tutorial</span>
        </button>
      </div>

      {/* AI Glamorous Dealer Sarah Header */}
      <VegasAiDealer
        dialogue={dealerDialogue}
        gameTitle="Craps"
        status={point === null ? 'Come Out Roll' : `Point is ${point}`}
      />

      {/* Point Puck Bar & 3D Dice Throw Arena */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-black/70 p-4 rounded-2xl border border-white/10 gap-4 shadow-xl">
        {/* 3D Realistic Point Puck */}
        <div className="flex items-center gap-3">
          <div className="text-zinc-400 font-bold uppercase text-[10px]">Point Puck:</div>
          <div
            className={`w-14 h-14 rounded-full border-4 flex flex-col items-center justify-center font-mono font-black text-xs uppercase shadow-xl transition-all duration-300 ${
              point !== null
                ? 'bg-gradient-to-br from-white via-zinc-100 to-zinc-300 text-black border-gold shadow-[0_0_20px_rgba(212,175,55,0.7)] scale-105'
                : 'bg-gradient-to-br from-zinc-900 to-black text-zinc-500 border-zinc-700'
            }`}
          >
            <span className="text-[9px] font-bold leading-none">{point !== null ? 'ON' : 'OFF'}</span>
            {point !== null && <span className="text-sm text-black leading-none mt-0.5">{point}</span>}
          </div>
        </div>

        {/* 3D Dice Throw Arena Display */}
        <div className="flex items-center gap-4 bg-emerald-950/40 border border-emerald-500/30 px-6 py-2 rounded-2xl shadow-inner">
          <div className="flex items-center gap-3">
            <CrapsDiceVisual value={dice[0]} rolling={rolling} size="md" />
            <CrapsDiceVisual value={dice[1]} rolling={rolling} size="md" />
          </div>
          <div className="text-2xl font-black text-gold font-mono">
            = {dice[0] + dice[1]}
          </div>
        </div>

        {/* Roll History */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1">Rolls:</span>
          {history.map((h, i) => (
            <span
              key={i}
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-black shadow ${
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
          <div className="grid grid-cols-6 gap-2 text-center font-black relative z-10">
            {[4, 5, 6, 8, 9, 10].map((num) => (
              <div
                key={num}
                className={`p-3 rounded-xl border-2 transition ${
                  point === num
                    ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-white shadow-[0_0_25px_#ffd700] scale-105'
                    : 'bg-black/60 text-white border-white/20'
                }`}
              >
                <div className="text-[10px] uppercase text-zinc-300">Point</div>
                <div className="text-2xl font-mono">{num}</div>
                {point === num && (
                  <div className="text-[9px] bg-black text-gold font-black uppercase px-1 rounded mt-1">
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
        <div className="bg-black/70 border border-gold/40 text-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-zinc-200">
          {message}
        </div>
      )}

      {/* Controls Bar with Authentic 3D Chip Rack */}
      <div className="bg-black/60 p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Chip Rack */}
        <div className="flex items-center gap-3">
          <VegasChipRack
            values={[5, 10, 25, 50, 100]}
            selectedValue={selectedChip}
            onSelect={setSelectedChip}
            disabled={rolling}
          />
          {totalActiveBets > 0 && !rolling && (
            <button
              onClick={clearBets}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-xs font-bold transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Wager and Roll Button */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-zinc-400">Active Wager:</div>
            <div className="text-lg font-mono font-black text-gold">
              £{totalActiveBets.toLocaleString()}
            </div>
          </div>

          <button
            disabled={rolling || totalActiveBets === 0 || totalActiveBets > bankroll}
            onClick={rollDice}
            className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:brightness-110 active:scale-95 transition disabled:opacity-40"
          >
            {rolling ? 'ROLLING DICE...' : 'SHOOT DICE 🎲'}
          </button>
        </div>
      </div>
    </div>
  );
}
