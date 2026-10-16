'use client';

import React, { useState } from 'react';
import { HelpCircle, Play, RotateCcw, Sparkles, Wand2 } from 'lucide-react';
import VegasCard, { CardModel } from '../VegasCard';
import VegasAiDealer from '../VegasAiDealer';
import { VegasChipRack, VegasChipStack } from '../VegasChip';
import VegasWinSplash from '../VegasWinSplash';
import Vegas3DTableArena from '../Vegas3DTableArena';
import { playCardSound, playChipSound, playWinSound } from '@/lib/vegas/VegasAudio';
import { addGameHistory } from '@/lib/vegas/VegasHistory';

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

// Evaluate 2-card low hand (only Pair or High Cards)
function evaluate2Card(cards: CardModel[]): { score: number; desc: string } {
  if (cards.length !== 2) return { score: 0, desc: 'Incomplete' };
  const [c1, c2] = cards;
  const v1 = c1.value || 0;
  const v2 = c2.value || 0;

  if (v1 === v2) {
    return { score: 100 + v1, desc: `Pair of ${c1.rank}s` };
  }
  const high = Math.max(v1, v2);
  const low = Math.min(v1, v2);
  return { score: high * 10 + low, desc: `${cards.find(c => c.value === high)?.rank} High` };
}

// Simple 5-card evaluation
function evaluate5Card(cards: CardModel[]): { score: number; desc: string } {
  if (cards.length !== 5) return { score: 0, desc: 'Incomplete' };
  const values = cards.map((c) => c.value || 0).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);

  let isStraight = false;
  if (values[0] - values[4] === 4 && new Set(values).size === 5) isStraight = true;
  if (!isStraight && [14, 5, 4, 3, 2].every((v) => values.includes(v))) isStraight = true;

  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const countVals = Object.values(counts).sort((a, b) => b - a);

  if (isFlush && isStraight) return { score: 800, desc: 'Straight Flush' };
  if (countVals[0] === 4) return { score: 700, desc: 'Four of a Kind' };
  if (countVals[0] === 3 && countVals[1] === 2) return { score: 600, desc: 'Full House' };
  if (isFlush) return { score: 500, desc: 'Flush' };
  if (isStraight) return { score: 400, desc: 'Straight' };
  if (countVals[0] === 3) return { score: 300, desc: 'Three of a Kind' };
  if (countVals[0] === 2 && countVals[1] === 2) return { score: 200, desc: 'Two Pair' };
  if (countVals[0] === 2) {
    const pVal = parseInt(Object.entries(counts).find(([_, c]) => c === 2)?.[0] || '0', 10);
    return { score: 100 + pVal, desc: 'One Pair' };
  }

  return { score: values[0], desc: 'High Card' };
}

// House Way Split
function houseWaySplit(sevenCards: CardModel[]): { high: CardModel[]; low: CardModel[] } {
  const sorted = [...sevenCards].sort((a, b) => (b.value || 0) - (a.value || 0));

  const valCounts: Record<number, CardModel[]> = {};
  for (const c of sorted) {
    const v = c.value || 0;
    if (!valCounts[v]) valCounts[v] = [];
    valCounts[v].push(c);
  }

  const pairs = Object.values(valCounts).filter((arr) => arr.length === 2);
  const trips = Object.values(valCounts).filter((arr) => arr.length >= 3);

  if (pairs.length >= 2) {
    const lowPair = pairs[1];
    const highCards = sorted.filter((c) => !lowPair.includes(c));
    return { high: highCards, low: lowPair };
  }

  if (pairs.length === 1 && trips.length === 0) {
    const pair = pairs[0];
    const kickers = sorted.filter((c) => !pair.includes(c));
    const low2 = [kickers[0], kickers[1]];
    const high5 = [...pair, kickers[2], kickers[3], kickers[4]];
    return { high: high5, low: low2 };
  }

  const low = [sorted[1], sorted[2]];
  const high = [sorted[0], sorted[3], sorted[4], sorted[5], sorted[6]];
  return { high, low };
}

export default function PaiGowGame({ bankroll, onUpdateBankroll, onOpenTutorial }: Props) {
  const [bet, setBet] = useState(25);
  const [allPlayerCards, setAllPlayerCards] = useState<CardModel[]>([]);
  const [highCards, setHighCards] = useState<CardModel[]>([]);
  const [lowCards, setLowCards] = useState<CardModel[]>([]);

  const [dealerHigh, setDealerHigh] = useState<CardModel[]>([]);
  const [dealerLow, setDealerLow] = useState<CardModel[]>([]);

  const [step, setStep] = useState<'betting' | 'setting' | 'showdown'>('betting');
  const [message, setMessage] = useState<string | null>(
    'Pai Gow Poker: Split 7 cards into a 5-card High Hand and a 2-card Low Hand!'
  );
  const [dealerDialogue, setDealerDialogue] = useState<string>(
    'Welcome to Pai Gow, darling. Set your five-card high hand to outrank your two-card low hand, or play the House Way!'
  );
  const [splashWin, setSplashWin] = useState<number | null>(null);

  const handleDeal = () => {
    if (bet > bankroll) return;
    playCardSound();
    const d = createDeck();
    const pCards: CardModel[] = [];
    const dCards: CardModel[] = [];

    for (let i = 0; i < 7; i++) {
      pCards.push(d.pop()!);
      dCards.push(d.pop()!);
    }

    setAllPlayerCards(pCards);

    // Initial default split: House Way
    const split = houseWaySplit(pCards);
    setHighCards(split.high);
    setLowCards(split.low);

    const dSplit = houseWaySplit(dCards);
    setDealerHigh(dSplit.high);
    setDealerLow(dSplit.low);

    setStep('setting');
    setSplashWin(null);
    setMessage('Cards arranged by House Way. Adjust if you wish, then click Confirm & Compare!');
    setDealerDialogue('Seven cards dealt! I arranged them by the House Way. Tweak them if you fancy, darling.');
  };

  const handleApplyHouseWay = () => {
    playCardSound();
    const split = houseWaySplit(allPlayerCards);
    setHighCards(split.high);
    setLowCards(split.low);
    setMessage('Cards reset to official casino House Way!');
    setDealerDialogue('Reset to official casino House Way. Balanced and ready, darling.');
  };

  const moveToLow = (card: CardModel) => {
    if (step !== 'setting') return;
    if (lowCards.length >= 2) return;
    playCardSound();
    setHighCards((prev) => prev.filter((c) => c !== card));
    setLowCards((prev) => [...prev, card]);
  };

  const moveToHigh = (card: CardModel) => {
    if (step !== 'setting') return;
    if (highCards.length >= 5) return;
    playCardSound();
    setLowCards((prev) => prev.filter((c) => c !== card));
    setHighCards((prev) => [...prev, card]);
  };

  const handleConfirmHands = () => {
    if (highCards.length !== 5 || lowCards.length !== 2) {
      setMessage('You must set exactly 5 cards in High Hand and 2 cards in Low Hand!');
      setDealerDialogue('Careful darling: you must have exactly 5 cards in your high hand and 2 in your low hand.');
      return;
    }

    const pHigh = evaluate5Card(highCards);
    const pLow = evaluate2Card(lowCards);

    // Foul check: 5-card MUST rank higher than 2-card
    if (pLow.score > pHigh.score) {
      setStep('showdown');
      onUpdateBankroll(-bet);
      setMessage(`❌ FOUL HAND! Your 2-card low hand was stronger than your 5-card high hand! Forfeit bet (-£${bet}).`);
      setDealerDialogue('Oh darling, that is a foul! Your 2-card low hand cannot outrank your 5-card high hand. Wager forfeited.');
      return;
    }

    setStep('showdown');
    playCardSound();

    const dHigh = evaluate5Card(dealerHigh);
    const dLow = evaluate2Card(dealerLow);

    const pWinHigh = pHigh.score > dHigh.score;
    const pWinLow = pLow.score > dLow.score;

    if (pWinHigh && pWinLow) {
      // Won both
      const win = Math.floor(bet * 0.95); // 5% commission
      onUpdateBankroll(win);
      playWinSound();
      setSplashWin(win);
      setMessage(`🎉 WON BOTH HANDS! High: ${pHigh.desc} beats ${dHigh.desc} • Low: ${pLow.desc} beats ${dLow.desc} (+£${win})!`);
      setDealerDialogue(`Superb play, darling! Both your hands outranked mine. Take your winnings (+£${win})!`);
      addGameHistory({
        gameId: 'pai-gow',
        headline: 'Won Both Hands (2-0)!',
        detail: `High: ${pHigh.desc} • Low: ${pLow.desc} • Won £${win.toLocaleString()}`,
        delta: win,
        badge: '2-0 Win',
      });
    } else if (!pWinHigh && !pWinLow) {
      // Lost both
      onUpdateBankroll(-bet);
      setMessage(`House won both hands. Lost £${bet}.`);
      setDealerDialogue(`Dealer takes both hands this time. Better luck on the next seven, darling.`);
      addGameHistory({
        gameId: 'pai-gow',
        headline: 'Lost Both Hands (0-2)',
        detail: `High: ${dHigh.desc} • Low: ${dLow.desc} • Lost £${bet.toLocaleString()}`,
        delta: -bet,
        badge: '0-2 Loss',
      });
    } else {
      // Split 1-1 = PUSH!
      setMessage(`🤝 PUSH (TIE)! Won 1 hand, lost 1 hand. Stake Returned (No Money Lost)!`);
      setDealerDialogue(`A classic Pai Gow push! We split hands 1-1, so your £${bet} stake is safely returned.`);
      addGameHistory({
        gameId: 'pai-gow',
        headline: 'Pai Gow Push (1-1)',
        detail: 'Split 1 win, 1 loss • Stake returned',
        delta: 0,
        badge: 'Push',
      });
    }
  };

  return (
    <div className="bg-gradient-to-b from-teal-950/80 via-black to-zinc-950 border border-teal-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden space-y-6">
      {/* Big Win Splash Banner */}
      <VegasWinSplash winAmount={splashWin} title="PAI GOW WIN!" onComplete={() => setSplashWin(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-black uppercase tracking-widest">
              Game #10 • 7-Card Asian/Vegas Classic
            </span>
            <span className="text-zinc-400 text-xs font-mono">41% Push Rate</span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
            <span>Pai Gow Poker</span>
            <span className="text-xs font-mono font-bold text-teal-300 px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/40">
              5-Card High / 2-Card Low
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

      {/* AI Dealer Sarah */}
      <VegasAiDealer
        dialogue={dealerDialogue}
        gameTitle="Pai Gow Poker"
        status={
          step === 'betting'
            ? 'Awaiting Wager'
            : step === 'setting'
            ? 'Splitting 5 & 2 Hands'
            : 'Settling Hand'
        }
      />

      {/* 3D Tilted Pai Gow Poker Table Arena */}
      <Vegas3DTableArena
        gameType="paigow"
        showShoe={true}
        showDiscardRack={true}
        showChipTray={true}
        watermarkTitle="PAI GOW POKER"
        watermarkSubtitle="EAST MEETS WEST • 5-CARD HIGH & 2-CARD LOW"
      >
        <div className="space-y-4 relative z-10 py-2">

        {/* Dealer Area */}
        <div className="flex flex-col items-center gap-2 bg-black/50 p-3 rounded-2xl border border-white/10 relative z-10 shadow-xl">
          <div className="text-xs font-black uppercase text-teal-300">
            Dealer Hands ({step === 'showdown' ? 'Revealed' : 'Face-Down'})
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-zinc-400 mb-1">5-Card High</span>
              <div className="flex items-center gap-1">
                {dealerHigh.map((c, i) => (
                  <VegasCard key={i} card={c} faceDown={step !== 'showdown'} size="sm" />
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-zinc-400 mb-1">2-Card Low</span>
              <div className="flex items-center gap-1">
                {dealerLow.map((c, i) => (
                  <VegasCard key={i} card={c} faceDown={step !== 'showdown'} size="sm" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="bg-black/75 border border-teal-500/40 text-center py-2 px-4 rounded-xl text-xs sm:text-sm font-bold text-zinc-200 relative z-10">
            {message}
          </div>
        )}

        {/* Player Hands Area (High Hand vs Low Hand) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {/* 5-Card High Hand */}
          <div className="bg-black/60 p-4 rounded-2xl border-2 border-teal-500/40 flex flex-col items-center gap-2 shadow-xl">
            <div className="flex items-center justify-between w-full text-xs font-black uppercase text-teal-300">
              <span>5-CARD HIGH HAND ({highCards.length}/5)</span>
              <span className="text-[10px] text-zinc-300 font-mono bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/40">
                {highCards.length === 5 ? evaluate5Card(highCards).desc : 'Needs 5'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-h-[70px]">
              {highCards.map((c, i) => (
                <VegasCard
                  key={i}
                  card={c}
                  size="md"
                  onClick={step === 'setting' ? () => moveToLow(c) : undefined}
                />
              ))}
            </div>
            {step === 'setting' && (
              <span className="text-[10px] text-zinc-400 italic">Click card to move to Low Hand</span>
            )}
          </div>

          {/* 2-Card Low Hand */}
          <div className="bg-black/60 p-4 rounded-2xl border-2 border-teal-500/40 flex flex-col items-center gap-2 shadow-xl">
            <div className="flex items-center justify-between w-full text-xs font-black uppercase text-teal-300">
              <span>2-CARD LOW HAND ({lowCards.length}/2)</span>
              <span className="text-[10px] text-zinc-300 font-mono bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/40">
                {lowCards.length === 2 ? evaluate2Card(lowCards).desc : 'Needs 2'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-h-[70px]">
              {lowCards.map((c, i) => (
                <VegasCard
                  key={i}
                  card={c}
                  size="md"
                  onClick={step === 'setting' ? () => moveToHigh(c) : undefined}
                />
              ))}
            </div>
            {step === 'setting' && (
              <span className="text-[10px] text-zinc-400 italic">Click card to move to High Hand</span>
            )}
          </div>
        </div>
        </div>
      </Vegas3DTableArena>

      {/* Controls Bar with Authentic 3D Chip Rack */}
      <div className="bg-black/70 p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <VegasChipRack
            values={[5, 10, 25, 50, 100]}
            selectedValue={bet}
            onSelect={setBet}
            disabled={step === 'setting'}
          />

          {step === 'setting' && (
            <button
              onClick={handleApplyHouseWay}
              className="ml-2 px-3.5 py-2 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-purple-200 border border-purple-500/50 text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <Wand2 size={13} />
              <span>Reset to House Way</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {step === 'betting' || step === 'showdown' ? (
            <button
              disabled={bet > bankroll}
              onClick={handleDeal}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black uppercase text-xs tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition"
            >
              {step === 'showdown' ? 'Deal Next 7 Cards' : `Deal 7 Cards (£${bet})`}
            </button>
          ) : (
            <button
              disabled={highCards.length !== 5 || lowCards.length !== 2}
              onClick={handleConfirmHands}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition disabled:opacity-40"
            >
              CONFIRM & SHOWDOWN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
