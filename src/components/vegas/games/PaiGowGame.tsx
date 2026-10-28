'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, Play, RotateCcw, Sparkles, Wand2, Trophy, Brain, ChevronLeft } from 'lucide-react';
import VegasCard, { CardModel } from '../VegasCard';
import VegasAiDealer from '../VegasAiDealer';
import { VegasChipRack, VegasChipStack } from '../VegasChip';
import VegasWinSplash from '../VegasWinSplash';
import Vegas3DTableArena from '../Vegas3DTableArena';
import VegasGuideOddsDrawer from '../VegasGuideOddsDrawer';
import { playCardSound, playChipSound, playWinSound } from '@/lib/vegas/VegasAudio';
import { triggerHaptic } from '@/lib/vegas/VegasHaptics';
import { addGameHistory } from '@/lib/vegas/VegasHistory';

interface Props {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onOpenTutorial: () => void;
  onBackToFloor?: () => void;
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

export default function PaiGowGame({ bankroll, onUpdateBankroll, onOpenTutorial, onBackToFloor }: Props) {
  const [bet, setBet] = useState(25);
  const [showGuideOdds, setShowGuideOdds] = useState(false);
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
  const [splashDetails, setSplashDetails] = useState<{ subtitle?: string; winDetail?: string; badge?: string }>({});

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
    triggerHaptic(15);
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
    triggerHaptic(15);
    playCardSound();
    setHighCards((prev) => prev.filter((c) => c !== card));
    setLowCards((prev) => [...prev, card]);
  };

  const moveToHigh = (card: CardModel) => {
    if (step !== 'setting') return;
    if (highCards.length >= 5) return;
    triggerHaptic(15);
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
      setSplashDetails({
        badge: '2-0 CLEAN SWEEP',
        subtitle: 'Won Both High (5-Card) & Low (2-Card) Hands',
        winDetail: `High: ${pHigh.desc} beats ${dHigh.desc} • Low: ${pLow.desc} beats ${dLow.desc} (Paid 1:1 less 5% comm)`,
      });
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
    <div
      style={{ touchAction: 'manipulation' }}
      className="h-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden select-none touch-manipulation relative bg-gradient-to-b from-teal-950/80 via-black to-zinc-950 border border-teal-500/40 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-2xl font-sans"
    >
      {/* Big Win Splash Banner */}
      <VegasWinSplash
        winAmount={splashWin}
        title="PAI GOW WIN!"
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
              <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[9px] font-black uppercase tracking-widest shrink-0">
                Asian/Vegas Classic
              </span>
              <span className="text-zinc-400 text-[10px] font-mono hidden sm:inline">41% Push Rate</span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1 mt-0.5 truncate">
              <span>Pai Gow Poker</span>
              <span className="text-[9px] font-mono font-bold text-teal-300 px-1.5 py-0.2 rounded bg-teal-500/20 border border-teal-500/40">
                5 High / 2 Low
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Slide-over Guide & Odds Advisor Trigger */}
          <button
            type="button"
            onClick={() => setShowGuideOdds(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 border border-teal-400/50 text-teal-300 hover:text-white text-[10px] font-black uppercase tracking-wider transition shadow active:scale-95"
            title="Open Sarah's Croupier Chat & Pai Gow House Way Advisor"
          >
            <Brain size={12} className="text-teal-400 shrink-0" />
            <span className="hidden xs:inline">GUIDE / ODDS</span>
            <span className="xs:hidden">ODDS</span>
            {step === 'setting' && (
              <span className="ml-0.5 px-1 py-0.2 rounded bg-teal-500/40 border border-teal-300 text-white text-[9px] font-mono font-black animate-pulse">
                BALANCED
              </span>
            )}
          </button>

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
            <span className="hidden sm:inline">Rules</span>
          </button>
        </div>
      </div>

      {/* AI Dealer Sarah (Visible on desktop; collapsed into slide-over drawer on mobile) */}
      <div className="shrink-0 mb-1 hidden md:block">
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
      </div>

      {/* Live Pai Gow House Way Strategy Advisor HUD (Visible on desktop; collapsed into slide-over drawer on mobile) */}
      {step === 'setting' && (
        <div className="shrink-0 hidden md:flex bg-gradient-to-r from-teal-950/80 via-black to-zinc-950 border border-teal-500/40 p-1.5 sm:p-2.5 rounded-xl items-center justify-between gap-2 text-xs shadow-lg mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
              <Brain size={14} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] uppercase font-mono font-black text-teal-300">
                  House Way Advisor
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold hidden sm:inline">
                  ⚡ 41% Push Defense
                </span>
              </div>
              <div className="font-bold text-white text-[10px] sm:text-xs truncate">
                Optimal 5-Card High & 2-Card Low Split Applied
              </div>
            </div>
          </div>
          <div className="hidden sm:block text-right shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-200 font-black text-xs font-mono">
              STATUS: BALANCED
            </span>
          </div>
        </div>
      )}

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
                  onPointerDown={step === 'setting' ? (e) => {
                    if (e.button === 0) moveToLow(c);
                  } : undefined}
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
                  onPointerDown={step === 'setting' ? (e) => {
                    if (e.button === 0) moveToHigh(c);
                  } : undefined}
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
      <div className="shrink-0 mt-auto bg-black/70 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/10 flex items-center justify-between gap-2 sm:gap-4 z-20">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <VegasChipRack
            values={[5, 10, 25, 50, 100, 250]}
            selectedValue={bet}
            onSelect={setBet}
            disabled={step === 'setting'}
          />

          {step === 'setting' && (
            <button
              onClick={handleApplyHouseWay}
              onPointerDown={(e) => {
                if (e.button === 0) handleApplyHouseWay();
              }}
              className="px-2 sm:px-3 py-1.5 rounded-lg bg-purple-900/70 hover:bg-purple-800 text-purple-200 border border-purple-500/50 text-[10px] sm:text-xs font-bold flex items-center gap-1 transition shadow touch-manipulation active:scale-95"
            >
              <Wand2 size={12} />
              <span className="hidden sm:inline">Reset to House Way</span>
              <span className="sm:hidden">House Way</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {step === 'betting' || step === 'showdown' ? (
            <button
              disabled={bet > bankroll}
              onClick={handleDeal}
              onPointerDown={(e) => {
                if (e.button === 0 && bet <= bankroll) {
                  triggerHaptic(15);
                  handleDeal();
                }
              }}
              className="px-4 py-2 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black uppercase text-[11px] sm:text-xs tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition touch-manipulation disabled:opacity-40"
            >
              {step === 'showdown' ? 'Next 7 Cards' : `Deal 7 Cards (£${bet})`}
            </button>
          ) : (
            <button
              disabled={highCards.length !== 5 || lowCards.length !== 2}
              onClick={handleConfirmHands}
              onPointerDown={(e) => {
                if (e.button === 0 && highCards.length === 5 && lowCards.length === 2) {
                  triggerHaptic(15);
                  handleConfirmHands();
                }
              }}
              className="px-4 py-2 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-[11px] sm:text-xs tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition disabled:opacity-40 touch-manipulation"
            >
              CONFIRM
            </button>
          )}
        </div>
      </div>

      {/* Slide-Over Guide & Odds Advisor Drawer */}
      <VegasGuideOddsDrawer
        isOpen={showGuideOdds}
        onClose={() => setShowGuideOdds(false)}
        gameTitle="Pai Gow Poker"
        dealerDialogue={dealerDialogue}
        dealerStatus={
          step === 'betting'
            ? 'Awaiting Wager'
            : step === 'setting'
            ? 'Splitting 5 & 2 Hands'
            : 'Settling Hand'
        }
        advisorTitle="House Way Strategy & Split Defense"
        recommendation={step === 'setting' ? 'HOUSE WAY (BALANCED)' : null}
        recommendationHeadline="Preserve Low Hand While Protecting High Hand"
        recommendationExplanation="Pai Gow Poker is a defensive game where ~41% of all hands result in a push (tie). The official House Way method creates the strongest possible 2-card Low Hand without fouling (the 5-card High Hand must always rank higher than the 2-card Low Hand)."
        rulesSummary={[
          { label: 'Push Rate', value: '~41.5% of hands tie (stake returned)', highlight: true },
          { label: 'Foul Condition', value: 'High hand must strictly beat Low hand' },
          { label: 'Dealer Advantage', value: 'Dealer wins exact copy ties (2.84% edge)' },
          { label: 'Hand Split', value: '5 cards high, 2 cards low' },
        ]}
      />
    </div>
  );
}
