'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, Play, RotateCcw, Sparkles, Trophy, Brain, Wand2 } from 'lucide-react';
import VegasCard, { CardModel } from '../VegasCard';
import { VegasChipRack } from '../VegasChip';
import VegasWinSplash from '../VegasWinSplash';
import { playCardSound, playChipSound, playWinSound, playJackpotSound } from '@/lib/vegas/VegasAudio';
import { addGameHistory } from '@/lib/vegas/VegasHistory';
import { getVideoPokerAdvice } from '@/lib/vegas/VegasStrategyEngine';
import { useKonamiHighRoller } from '@/components/EasterEggs';

interface Props {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onOpenTutorial: () => void;
}

const SUITS: CardModel['suit'][] = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck(): CardModel[] {
  const deck: CardModel[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value = parseInt(rank, 10);
      if (rank === 'J') value = 11;
      if (rank === 'Q') value = 12;
      if (rank === 'K') value = 13;
      if (rank === 'A') value = 14;
      deck.push({ rank, suit, value });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

interface HandEvaluation {
  rankName: string;
  multiplier: number;
}

function evaluateVideoPokerHand(cards: CardModel[]): HandEvaluation {
  if (cards.length !== 5) return { rankName: 'No Hand', multiplier: 0 };

  const values = cards.map((c) => c.value || 0).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  let isStraight = false;
  if (values[4] - values[0] === 4 && new Set(values).size === 5) {
    isStraight = true;
  }
  if (values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5 && values[4] === 14) {
    isStraight = true;
  }

  // Royal Flush
  if (isFlush && isStraight && values[0] === 10 && values[4] === 14) {
    return { rankName: 'Royal Flush', multiplier: 800 };
  }

  // Straight Flush
  if (isFlush && isStraight) {
    return { rankName: 'Straight Flush', multiplier: 50 };
  }

  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const countValues = Object.values(counts).sort((a, b) => b - a);

  if (countValues[0] === 4) return { rankName: 'Four of a Kind', multiplier: 25 };
  if (countValues[0] === 3 && countValues[1] === 2) return { rankName: 'Full House', multiplier: 9 };
  if (isFlush) return { rankName: 'Flush', multiplier: 6 };
  if (isStraight) return { rankName: 'Straight', multiplier: 4 };
  if (countValues[0] === 3) return { rankName: 'Three of a Kind', multiplier: 3 };
  if (countValues[0] === 2 && countValues[1] === 2) return { rankName: 'Two Pair', multiplier: 2 };

  // Jacks or Better
  if (countValues[0] === 2) {
    const pairValue = parseInt(Object.entries(counts).find(([_, count]) => count === 2)?.[0] || '0', 10);
    if (pairValue >= 11) {
      return { rankName: 'Jacks or Better', multiplier: 1 };
    }
  }

  return { rankName: 'Nothing', multiplier: 0 };
}

const PAYTABLE_DISPLAY = [
  { hand: 'Royal Flush', mult: 800 },
  { hand: 'Straight Flush', mult: 50 },
  { hand: 'Four of a Kind', mult: 25 },
  { hand: 'Full House', mult: 9 },
  { hand: 'Flush', mult: 6 },
  { hand: 'Straight', mult: 4 },
  { hand: 'Three of a Kind', mult: 3 },
  { hand: 'Two Pair', mult: 2 },
  { hand: 'Jacks or Better', mult: 1 },
];

export default function VideoPokerGame({ bankroll, onUpdateBankroll, onOpenTutorial }: Props) {
  const { isHighRoller } = useKonamiHighRoller();
  const [deck, setDeck] = useState<CardModel[]>([]);
  const [cards, setCards] = useState<CardModel[]>([]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [step, setStep] = useState<'betting' | 'holding'>('betting');
  const [bet, setBet] = useState(25);
  const [message, setMessage] = useState<string | null>(
    'Select your wager, click Deal, then click cards to HOLD before the final Draw!'
  );
  const [splashWin, setSplashWin] = useState<number | null>(null);
  const [lastWinHand, setLastWinHand] = useState<string | null>(null);
  const [splashDetails, setSplashDetails] = useState<{
    subtitle?: string;
    winDetail?: string;
    badge?: string;
  }>({});

  const toggleHold = (idx: number) => {
    if (step !== 'holding') return;
    playCardSound();
    setHeld((prev) => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  const handleDeal = () => {
    if (bet > bankroll) return;
    playCardSound();
    const d = createDeck();
    const dealCards = [d.pop()!, d.pop()!, d.pop()!, d.pop()!, d.pop()!];
    setDeck(d);
    setCards(dealCards);
    setHeld([false, false, false, false, false]);
    setStep('holding');
    setLastWinHand(null);
    setSplashWin(null);

    // Initial deduction
    onUpdateBankroll(-bet);

    const check = evaluateVideoPokerHand(dealCards);
    if (check.multiplier > 0) {
      setMessage(`Initial Deal: ${check.rankName}! Select cards to HOLD and click Draw.`);
    } else {
      setMessage('Select which cards to HOLD, then click Draw!');
    }
  };

  const handleDraw = () => {
    if (step !== 'holding') return;
    playCardSound();
    const currentDeck = [...deck];
    const finalCards = cards.map((c, idx) => {
      if (held[idx]) return c;
      return currentDeck.pop()!;
    });

    setCards(finalCards);
    setStep('betting');

    const result = evaluateVideoPokerHand(finalCards);
    const handStr = finalCards.map((c) => `${c.rank}${c.suit}`).join(' ');
    if (result.multiplier > 0) {
      const winAmt = bet * result.multiplier;
      const netWin = winAmt;
      setLastWinHand(result.rankName);

      if (result.rankName === 'Royal Flush') {
        playJackpotSound();
      } else {
        playWinSound();
      }
      setSplashDetails({
        subtitle: `Made Hand: ${result.rankName}`,
        winDetail: `Paid ${result.multiplier}x on £${bet} wager • Cards: ${handStr}`,
        badge: `${result.multiplier}x Payout`,
      });
      setSplashWin(netWin);

      setMessage(`🎉 ${result.rankName}! Paid ${result.multiplier}x (+£${netWin.toLocaleString()})!`);
      onUpdateBankroll(netWin + bet);
      addGameHistory({
        gameId: 'video-poker',
        headline: `${result.rankName}! Paid ${result.multiplier}x`,
        detail: `Cards: ${handStr} • Won £${netWin.toLocaleString()}`,
        delta: netWin,
        badge: `${result.multiplier}x`,
      });
    } else {
      setMessage(`No qualifying hand. Click Deal to play again.`);
      addGameHistory({
        gameId: 'video-poker',
        headline: 'No Qualifying Hand',
        detail: `Cards: ${handStr} • Lost £${bet.toLocaleString()}`,
        delta: -bet,
        badge: 'No Win',
      });
    }
  };

  return (
    <div
      style={{ touchAction: 'manipulation' }}
      className="h-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden select-none touch-manipulation relative rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-b from-[#2d140a] via-[#1a0b05] to-[#0d0502] p-1.5 sm:p-4 border-2 sm:border-4 border-[#4a220f] shadow-2xl font-sans"
    >
      {/* Big Win Splash Banner */}
      <VegasWinSplash
        winAmount={splashWin}
        title="VIDEO POKER PAYOUT!"
        subtitle={splashDetails.subtitle}
        winDetail={splashDetails.winDetail}
        badge={splashDetails.badge}
        onComplete={() => setSplashWin(null)}
      />

      {/* Bar-Top Brass Rim & Drink Coaster Inset */}
      <div className="shrink-0 flex items-center justify-between gap-2 border-b border-amber-900/40 pb-1.5 mb-1 relative z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-black uppercase tracking-widest shrink-0">
              Vegas Bar-Top Kiosk
            </span>
            <span className="text-emerald-400 text-[10px] font-mono font-bold hidden sm:inline">RTP: 99.54%</span>
          </div>
          <h3 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5 mt-0.5 truncate">
            <span>Game King™ Video Poker</span>
            <span className="text-[9px] font-mono font-bold text-gold px-1.5 py-0.2 rounded bg-gold/15 border border-gold/30">
              800:1 Royal Flush
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/academy?tab=leaderboard&discipline=blackjack"
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-[10px] font-bold text-gold transition"
          >
            <Trophy size={12} />
            <span className="hidden sm:inline">Leaderboard</span>
          </Link>
          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-300 hover:text-white transition"
          >
            <HelpCircle size={12} className="text-gold" />
            <span className="hidden sm:inline">Rules & Tutorial</span>
            <span className="sm:hidden">Rules</span>
          </button>
        </div>
      </div>

      {/* Live Video Poker Optimal Hold Advisor */}
      {step === 'holding' && cards.length === 5 && (
        <div className="shrink-0 bg-gradient-to-r from-blue-950/80 via-black to-zinc-950 border border-blue-500/40 p-1.5 sm:p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs shadow-lg mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
              <Brain size={14} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] uppercase font-mono font-black text-blue-300">
                  9/6 Advisor
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold hidden sm:inline">
                  ⚡ 99.54% RTP
                </span>
              </div>
              {(() => {
                const adv = getVideoPokerAdvice(cards);
                return (
                  <div className="truncate text-[10px] sm:text-[11px] text-zinc-300 font-bold">
                    {adv.headline}
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="shrink-0">
            <button
              onClick={() => {
                const adv = getVideoPokerAdvice(cards);
                playCardSound();
                setHeld([0, 1, 2, 3, 4].map((i) => adv.holdIndices.includes(i)));
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-black uppercase text-[10px] shadow active:scale-95 transition"
            >
              <Wand2 size={12} />
              <span>Optimal</span>
            </button>
          </div>
        </div>
      )}

      {/* 3D SLANTED ARCADE MONITOR ASSEMBLY (Perspective + Recessed Chassis) */}
      <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
        <div
          className="relative w-full h-full flex-1 min-h-0 flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#2b3342] via-[#1a202c] to-[#0f141d] p-1.5 sm:p-3 border-2 sm:border-4 border-[#475569] shadow-[inset_0_4px_12px_rgba(255,255,255,0.25),0_15px_35px_rgba(0,0,0,0.9)] overflow-hidden"
        >
          {/* Four Corner Hex Rivet Bolts */}
          <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-700 border border-zinc-900 shadow-sm flex items-center justify-center text-[7px] text-zinc-900 font-black">
            +
          </div>
          <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-700 border border-zinc-900 shadow-sm flex items-center justify-center text-[7px] text-zinc-900 font-black">
            +
          </div>
          <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-700 border border-zinc-900 shadow-sm flex items-center justify-center text-[7px] text-zinc-900 font-black">
            +
          </div>
          <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-700 border border-zinc-900 shadow-sm flex items-center justify-center text-[7px] text-zinc-900 font-black">
            +
          </div>

          {/* CRT SCREEN RECESSED BEZEL */}
          <div className="flex-1 min-h-0 relative rounded-xl sm:rounded-2xl bg-black border-2 border-black/80 shadow-[inset_0_0_40px_rgba(0,0,0,0.95)] overflow-hidden p-1.5 sm:p-4 flex flex-col justify-between gap-1.5 sm:gap-3">
            {/* CRT Phosphor Scanline Texture */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50 z-20" />
            
            {/* Curved Screen Glass Reflection Glare */}
            <div
              className="absolute inset-0 pointer-events-none z-20 opacity-30"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.02) 40%, transparent 60%)',
              }}
            />

            {/* Paytable Grid Screen with Glowing Winner Row */}
            <div className="shrink-0 relative z-10 grid grid-cols-3 sm:grid-cols-9 gap-1 bg-blue-950/70 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-blue-500/30 text-center font-mono text-[10px] sm:text-xs shadow-inner">
              {PAYTABLE_DISPLAY.map((row) => {
                const isWinningRow = lastWinHand === row.hand;
                return (
                  <div
                    key={row.hand}
                    className={`p-1 sm:p-1.5 rounded border transition-all duration-300 ${
                      isWinningRow
                        ? 'bg-gradient-to-b from-[#ffd700] to-[#cfb53b] text-black border-white shadow-[0_0_20px_#ffd700] font-black scale-105 z-10 animate-pulse'
                        : 'bg-black/60 border-blue-500/20 text-blue-200'
                    }`}
                  >
                    <div className="text-[8px] sm:text-[9px] truncate uppercase font-bold">{row.hand}</div>
                    <div className={`text-[10px] sm:text-xs font-black ${isWinningRow ? 'text-black' : 'text-amber-300'}`}>
                      {row.mult}x
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Video Poker CRT Felt Arena */}
            <div
              className={`flex-1 min-h-0 relative rounded-xl sm:rounded-2xl border-2 p-2 sm:p-4 shadow-[inset_0_0_50px_rgba(0,0,0,0.85)] flex flex-col justify-between items-center ${
                isHighRoller
                  ? 'bg-[radial-gradient(ellipse_at_center,_#b8860b_0%,_#755405_45%,_#3d2901_100%)] border-[#ffd700]'
                  : 'bg-[radial-gradient(ellipse_at_center,_#1d4ed8_0%,_#1e3a8a_45%,_#09132c_100%)] border-blue-400/40'
              }`}
            >
              {/* Status Message */}
              <div className="text-center min-h-[28px] relative z-10">
                {message && (
                  <span className="text-xs sm:text-sm font-black text-cyan-200 bg-black/85 px-5 py-1.5 rounded-full border border-cyan-400/50 shadow-lg tracking-wide">
                    {message}
                  </span>
                )}
              </div>

              {/* 5 Draw Poker Cards */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 relative z-10 max-w-full overflow-x-auto py-2">
                {cards.length === 5 ? (
                  cards.map((c, idx) => (
                    <div
                      key={idx}
                      className="relative cursor-pointer transition-transform hover:-translate-y-1"
                      onClick={() => toggleHold(idx)}
                    >
                      <VegasCard
                        card={c}
                        size="xl"
                        isHeld={held[idx]}
                      />
                    </div>
                  ))
                ) : (
                  [0, 1, 2, 3, 4].map((i) => <VegasCard key={i} faceDown size="xl" />)
                )}
              </div>

              {/* Holding Instruction */}
              <div className="text-center text-xs text-blue-200/90 font-mono font-bold tracking-wider relative z-10">
                {step === 'holding'
                  ? '⚡ PRESS "HOLD" BUTTONS OR TAP CARDS TO KEEP • THEN PRESS DRAW'
                  : 'Select Wager and Press DEAL'}
              </div>
            </div>

            {/* 5 TACTILE BACKLIT MECHANICAL "HOLD" ARCADE PUSHBUTTONS */}
            <div className="relative z-10 grid grid-cols-5 gap-2 sm:gap-4 pt-1">
              {[0, 1, 2, 3, 4].map((idx) => {
                const isHeld = held[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={step !== 'holding'}
                    onClick={() => toggleHold(idx)}
                    className={`group relative flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-1 rounded-xl transition-all duration-150 active:translate-y-1 disabled:opacity-40 select-none ${
                      isHeld
                        ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-black border-2 border-amber-200 shadow-[0_0_22px_rgba(245,158,11,0.85),inset_0_2px_4px_rgba(255,255,255,0.9)] translate-y-0.5'
                        : 'bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 text-zinc-300 border-2 border-zinc-600 shadow-[0_4px_10px_rgba(0,0,0,0.8),inset_0_2px_3px_rgba(255,255,255,0.2)] hover:border-zinc-400'
                    }`}
                  >
                    {/* Glowing LED Dot */}
                    <div
                      className={`w-2 h-2 rounded-full mb-1 transition-all ${
                        isHeld
                          ? 'bg-amber-950 shadow-[0_0_8px_#b45309]'
                          : 'bg-zinc-600'
                      }`}
                    />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider font-mono">
                      {isHeld ? 'HELD' : 'HOLD'}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono opacity-70">
                      #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* LOWER ARCADE CONTROL PANEL (Bill Acceptor + Chip Rack + Domed DEAL Pushbutton) */}
      <div className="shrink-0 mt-auto relative z-10 bg-gradient-to-b from-black/90 via-zinc-950 to-black p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-amber-900/50 flex items-center justify-between gap-2 sm:gap-4 shadow-2xl">
        {/* Left: Bill / Voucher Acceptor */}
        <div className="hidden sm:flex items-center gap-2 bg-black/80 px-2.5 py-1.5 rounded-xl border border-white/10 shrink-0">
          <div className="w-1.5 h-6 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] animate-pulse" />
          <div className="text-[9px] font-mono text-zinc-400 uppercase leading-tight">
            <span className="text-emerald-400 font-bold block">Bill Validator</span>
            <span>£5 - £100</span>
          </div>
        </div>

        {/* Center: Chip Rack */}
        <div className="flex items-center gap-1.5">
          <VegasChipRack
            values={[5, 10, 25, 50, 100]}
            selectedValue={bet}
            onSelect={setBet}
            disabled={step === 'holding'}
          />
        </div>

        {/* Right: Domed Arcade Action Pushbutton */}
        <div className="shrink-0">
          {step === 'betting' ? (
            <button
              disabled={bet > bankroll}
              onClick={handleDeal}
              className="px-4 py-2 sm:px-10 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#ffd700] text-black font-black uppercase text-[11px] sm:text-sm tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6),inset_0_2px_4px_rgba(255,255,255,0.7)] hover:brightness-110 active:translate-y-1 transition disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>DEAL (£{bet})</span>
            </button>
          ) : (
            <button
              onClick={handleDraw}
              className="px-4 py-2 sm:px-10 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-cyan-500 text-white font-black uppercase text-[11px] sm:text-sm tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.7),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:brightness-110 active:translate-y-1 transition flex items-center justify-center gap-1.5"
            >
              <span>⚡ DRAW</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
