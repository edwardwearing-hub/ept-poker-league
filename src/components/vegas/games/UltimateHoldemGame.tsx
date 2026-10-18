'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, Play, RotateCcw, Sparkles, Brain, Trophy } from 'lucide-react';
import VegasCard, { CardModel } from '../VegasCard';
import VegasAiDealer from '../VegasAiDealer';
import { VegasChipRack, VegasChipStack } from '../VegasChip';
import VegasWinSplash from '../VegasWinSplash';
import Vegas3DTableArena from '../Vegas3DTableArena';
import { playCardSound, playChipSound, playWinSound, playJackpotSound } from '@/lib/vegas/VegasAudio';
import { addGameHistory } from '@/lib/vegas/VegasHistory';
import { getUltimateHoldemAdvice } from '@/lib/vegas/VegasStrategyEngine';

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

interface PokerScore {
  score: number;
  name: string;
}

function evaluate7CardHand(cards: CardModel[]): PokerScore {
  const values = cards.map((c) => c.value || 0).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  const suitCounts: Record<string, number> = {};
  for (const s of suits) suitCounts[s] = (suitCounts[s] || 0) + 1;
  const flushSuit = Object.keys(suitCounts).find((s) => suitCounts[s] >= 5);

  const valueCounts: Record<number, number> = {};
  for (const v of values) valueCounts[v] = (valueCounts[v] || 0) + 1;

  const pairs = Object.entries(valueCounts).filter(([_, count]) => count === 2).map(([v]) => parseInt(v, 10)).sort((a, b) => b - a);
  const trips = Object.entries(valueCounts).filter(([_, count]) => count >= 3).map(([v]) => parseInt(v, 10)).sort((a, b) => b - a);
  const quads = Object.entries(valueCounts).filter(([_, count]) => count === 4).map(([v]) => parseInt(v, 10));

  const uniqueVals = Array.from(new Set(values)).sort((a, b) => b - a);
  let straightHigh = 0;
  for (let i = 0; i <= uniqueVals.length - 5; i++) {
    if (uniqueVals[i] - uniqueVals[i + 4] === 4) {
      straightHigh = uniqueVals[i];
      break;
    }
  }
  if (!straightHigh && [14, 5, 4, 3, 2].every((v) => uniqueVals.includes(v))) {
    straightHigh = 5;
  }

  if (flushSuit && straightHigh) {
    const flushCards = cards.filter((c) => c.suit === flushSuit).map((c) => c.value || 0).sort((a, b) => b - a);
    const uFlush = Array.from(new Set(flushCards));
    let sfHigh = 0;
    for (let i = 0; i <= uFlush.length - 5; i++) {
      if (uFlush[i] - uFlush[i + 4] === 4) {
        sfHigh = uFlush[i];
        break;
      }
    }
    if (sfHigh === 14) return { score: 999, name: 'Royal Flush' };
    if (sfHigh > 0) return { score: 900 + sfHigh, name: 'Straight Flush' };
  }

  if (quads.length > 0) return { score: 800 + quads[0], name: 'Four of a Kind' };
  if (trips.length > 0 && (pairs.length > 0 || trips.length > 1)) {
    return { score: 700 + trips[0], name: 'Full House' };
  }
  if (flushSuit) return { score: 600, name: 'Flush' };
  if (straightHigh > 0) return { score: 500 + straightHigh, name: 'Straight' };
  if (trips.length > 0) return { score: 400 + trips[0], name: 'Three of a Kind' };
  if (pairs.length >= 2) return { score: 300 + pairs[0], name: 'Two Pair' };
  if (pairs.length === 1) return { score: 200 + pairs[0], name: 'One Pair' };

  return { score: 100 + (values[0] || 0), name: 'High Card' };
}

export default function UltimateHoldemGame({ bankroll, onUpdateBankroll, onOpenTutorial }: Props) {
  const [deck, setDeck] = useState<CardModel[]>([]);
  const [baseBet, setBaseBet] = useState(25);
  const [tripsBet, setTripsBet] = useState(10);
  const [playMultiplier, setPlayMultiplier] = useState(0);

  const [playerCards, setPlayerCards] = useState<CardModel[]>([]);
  const [dealerCards, setDealerCards] = useState<CardModel[]>([]);
  const [boardCards, setBoardCards] = useState<CardModel[]>([]);

  const [street, setStreet] = useState<'betting' | 'preflop' | 'flop' | 'river' | 'showdown'>('betting');
  const [message, setMessage] = useState<string | null>(
    'Equal bets placed on Ante & Blind. Click Deal to receive your hole cards!'
  );
  const [dealerDialogue, setDealerDialogue] = useState<string>(
    'Welcome to Ultimate Texas Hold’em, darling. A 4x pre-flop raise carries a huge mathematical edge with strong cards!'
  );
  const [splashWin, setSplashWin] = useState<number | null>(null);
  const [splashDetails, setSplashDetails] = useState<{
    subtitle?: string;
    winDetail?: string;
    badge?: string;
  }>({});

  const totalAnteBlind = baseBet * 2;
  const activeWager = totalAnteBlind + tripsBet + baseBet * playMultiplier;

  const handleDeal = () => {
    if (totalAnteBlind + tripsBet > bankroll) return;
    playCardSound();
    const d = createDeck();
    const p1 = d.pop()!;
    const p2 = d.pop()!;
    const d1 = d.pop()!;
    const d2 = d.pop()!;
    const b = [d.pop()!, d.pop()!, d.pop()!, d.pop()!, d.pop()!];

    setDeck(d);
    setPlayerCards([p1, p2]);
    setDealerCards([d1, d2]);
    setBoardCards(b);
    setPlayMultiplier(0);
    setStreet('preflop');
    setSplashWin(null);
    setMessage('Pre-Flop: Check or Raise 4x your Ante!');
    setDealerDialogue('Hole cards are dealt! Check or strike boldly with a 4x Ante raise, darling?');
  };

  const handlePreflopRaise4x = () => {
    playCardSound();
    setPlayMultiplier(4);
    setDealerDialogue('4x Raise pre-flop! High-roller confidence, darling. Let us see the runout!');
    finishHand(4);
  };

  const handlePreflopCheck = () => {
    playCardSound();
    setStreet('flop');
    setMessage('Flop dealt: Check or Raise 2x your Ante!');
    setDealerDialogue('Checking through to the Flop. You can now raise 2x Ante or check once more.');
  };

  const handleFlopRaise2x = () => {
    playCardSound();
    setPlayMultiplier(2);
    setDealerDialogue('2x Raise locked in on the Flop! Dealing Turn and River for showdown.');
    finishHand(2);
  };

  const handleFlopCheck = () => {
    playCardSound();
    setStreet('river');
    setMessage('River dealt: Raise 1x your Ante or Fold!');
    setDealerDialogue('Board is complete! Make your final stand with a 1x Bet, or Fold.');
  };

  const handleRiverRaise1x = () => {
    playCardSound();
    setPlayMultiplier(1);
    setDealerDialogue('1x Bet on the River. Revealing dealer hole cards now...');
    finishHand(1);
  };

  const handleFold = () => {
    setStreet('showdown');
    const loss = totalAnteBlind + tripsBet;
    onUpdateBankroll(-loss);
    setMessage(`Folded hand. Lost Ante & Blind (-£${loss}).`);
    setDealerDialogue('Folding your hand. A prudent retreat to save your chips for the next spot, darling.');
  };

  const finishHand = (finalMult: number) => {
    setStreet('showdown');
    playCardSound();

    const pScore = evaluate7CardHand([...playerCards, ...boardCards]);
    const dScore = evaluate7CardHand([...dealerCards, ...boardCards]);
    const dealerQualifies = dScore.score >= 200; // pair or better

    let net = 0;
    const messages: string[] = [];

    // Trips Bet Bonus
    if (tripsBet > 0) {
      if (pScore.score >= 900) {
        const win = tripsBet * 50;
        net += win;
        messages.push(`Trips: Straight Flush (+£${win})`);
      } else if (pScore.score >= 800) {
        const win = tripsBet * 30;
        net += win;
        messages.push(`Trips: Quads (+£${win})`);
      } else if (pScore.score >= 700) {
        const win = tripsBet * 8;
        net += win;
        messages.push(`Trips: Full House (+£${win})`);
      } else if (pScore.score >= 600) {
        const win = tripsBet * 7;
        net += win;
        messages.push(`Trips: Flush (+£${win})`);
      } else if (pScore.score >= 500) {
        const win = tripsBet * 4;
        net += win;
        messages.push(`Trips: Straight (+£${win})`);
      } else if (pScore.score >= 400) {
        const win = tripsBet * 3;
        net += win;
        messages.push(`Trips: Three of a Kind (+£${win})`);
      } else {
        net -= tripsBet;
        messages.push(`Trips Lost (-£${tripsBet})`);
      }
    }

    // Compare Hands
    if (pScore.score > dScore.score) {
      const playWin = baseBet * finalMult;
      net += playWin;

      if (dealerQualifies) {
        net += baseBet;
        messages.push(`Ante Won (+£${baseBet})`);
      } else {
        messages.push('Dealer does not qualify (Ante pushes)');
      }

      if (pScore.score >= 500) {
        let blindMult = 1;
        if (pScore.score >= 990) blindMult = 500;
        else if (pScore.score >= 900) blindMult = 50;
        else if (pScore.score >= 800) blindMult = 10;
        else if (pScore.score >= 700) blindMult = 3;
        else if (pScore.score >= 600) blindMult = 1.5;
        const blindWin = Math.floor(baseBet * blindMult);
        net += blindWin;
        messages.push(`Blind Bonus: ${pScore.name} (+£${blindWin})`);
      } else {
        messages.push('Blind pushes');
      }

      messages.unshift(`YOU WIN with ${pScore.name} vs Dealer's ${dScore.name}!`);
      setDealerDialogue(`Splendid victory! Your ${pScore.name} beats my ${dScore.name}. The payouts are yours, darling!`);

      if (pScore.score >= 700) {
        playJackpotSound();
      } else {
        playWinSound();
      }
      const payoutSummary = messages.filter((m) => m.includes('Won') || m.includes('Bonus') || m.includes('WIN')).join(' • ');
      setSplashDetails({
        subtitle: `You Win with ${pScore.name}!`,
        winDetail: payoutSummary || `${pScore.name} beats Dealer's ${dScore.name}`,
        badge: pScore.name,
      });
      setSplashWin(net);
      addGameHistory({
        gameId: 'ultimate-holdem',
        headline: `Won with ${pScore.name}!`,
        detail: `Player: ${pScore.name} vs Dealer: ${dScore.name} • Won £${net.toLocaleString()}`,
        delta: net,
        badge: pScore.name,
      });
    } else if (pScore.score < dScore.score) {
      const mainLoss = totalAnteBlind + baseBet * finalMult;
      net -= mainLoss;
      messages.unshift(`Dealer wins with ${dScore.name} beats your ${pScore.name}.`);
      setDealerDialogue(`Dealer takes it with ${dScore.name}. The house wins this hand, darling.`);
      addGameHistory({
        gameId: 'ultimate-holdem',
        headline: 'Dealer Hand Wins',
        detail: `Dealer ${dScore.name} beats Player ${pScore.name} • Lost £${mainLoss.toLocaleString()}`,
        delta: -mainLoss,
        badge: 'Dealer Win',
      });
    } else {
      messages.unshift(`Push! Both have ${pScore.name}.`);
      setDealerDialogue(`A push! Both hands tie at ${pScore.name}.`);
      addGameHistory({
        gameId: 'ultimate-holdem',
        headline: `Push at ${pScore.name}`,
        detail: 'Equal 5-card rank • Bets returned',
        delta: 0,
        badge: 'Push',
      });
    }

    if (net !== 0) {
      onUpdateBankroll(net);
    }

    setMessage(messages.join(' • '));
  };

  return (
    <div className="bg-gradient-to-b from-rose-950/80 via-black to-zinc-950 border border-rose-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden space-y-6">
      {/* Big Win Splash Banner */}
      <VegasWinSplash
        winAmount={splashWin}
        title="ULTIMATE HOLD'EM WIN!"
        subtitle={splashDetails.subtitle}
        winDetail={splashDetails.winDetail}
        badge={splashDetails.badge}
        onComplete={() => setSplashWin(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-widest">
              Game #9 • Vegas Carnival Classic
            </span>
            <span className="text-zinc-400 text-xs font-mono">2.2% House Edge on Ante</span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
            <span>Ultimate Texas Hold&apos;em</span>
            <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
              500:1 Royal Flush Blind Bonus
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/vegas?tab=arcade#leaderboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-xs font-bold text-gold transition"
          >
            <Trophy size={14} />
            <span>Leaderboard</span>
          </Link>
          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition"
          >
            <HelpCircle size={14} className="text-gold" />
            <span>Rules & Tutorial</span>
          </button>
        </div>
      </div>

      {/* AI Glamorous Dealer Sarah Header */}
      <VegasAiDealer
        dialogue={dealerDialogue}
        gameTitle="Ultimate Hold'em"
        status={
          street === 'betting'
            ? 'Awaiting Wager'
            : street === 'showdown'
            ? 'Settling Hand'
            : 'Player Decision'
        }
      />

      {/* Live GTO Coach Advice HUD */}
      {street !== 'betting' && street !== 'showdown' && (
        <div className="bg-gradient-to-r from-indigo-950/80 via-black to-zinc-950 border border-indigo-500/40 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Brain size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-black text-indigo-300">
                  Live Coach Insight
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                  ⚡ GTO Optimal
                </span>
              </div>
              {(() => {
                const adv = getUltimateHoldemAdvice(street, playerCards, boardCards);
                return (
                  <>
                    <div className="font-bold text-white text-xs mt-0.5">{adv.headline}</div>
                    <p className="text-[11px] text-zinc-300 leading-snug">{adv.explanation}</p>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="hidden sm:block text-right shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400/50 text-indigo-200 font-black text-xs font-mono">
              REC: {getUltimateHoldemAdvice(street, playerCards, boardCards).action}
            </span>
          </div>
        </div>
      )}

      {/* 3D Tilted Ultimate Texas Hold'em Table Arena */}
      <Vegas3DTableArena
        gameType="holdem"
        showShoe={true}
        showDiscardRack={true}
        showChipTray={true}
        watermarkTitle="ULTIMATE TEXAS HOLD'EM"
        watermarkSubtitle="HEADS-UP CARNIVAL POKER • 4X PRE-FLOP PLAY"
      >
        <div className="flex flex-col justify-between items-center space-y-4 py-2 relative z-10">
          {/* Dealer Zone */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div className="text-xs font-black uppercase tracking-wider text-rose-300">
              Dealer Hole Cards (Needs Pair to Qualify)
            </div>
            <div className="flex items-center gap-2 min-h-[75px]">
              {dealerCards.length === 2 ? (
                <>
                  <VegasCard card={dealerCards[0]} faceDown={street !== 'showdown'} size="md" />
                  <VegasCard card={dealerCards[1]} faceDown={street !== 'showdown'} size="md" />
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <VegasCard faceDown size="md" />
                  <VegasCard faceDown size="md" />
                </div>
              )}
            </div>
          </div>

          {/* 5 Community Cards Board */}
          <div className="flex flex-col items-center gap-1.5 bg-black/60 p-3 sm:p-4 rounded-2xl border border-white/10 relative z-10 shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-gold">
              Shared Community Board
            </div>
            <div className="flex items-center gap-2 min-h-[75px]">
              {boardCards.length === 5 ? (
                boardCards.map((c, i) => (
                  <VegasCard
                    key={i}
                    card={c}
                    faceDown={
                      (i < 3 && street === 'preflop') ||
                      (i >= 3 && (street === 'preflop' || street === 'flop'))
                    }
                    size="md"
                  />
                ))
              ) : (
                [0, 1, 2, 3, 4].map((i) => <VegasCard key={i} faceDown size="md" />)
              )}
            </div>
          </div>

          {/* Player Zone */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div className="flex items-center gap-2 min-h-[75px]">
              {playerCards.length === 2 ? (
                <>
                  <VegasCard card={playerCards[0]} size="lg" />
                  <VegasCard card={playerCards[1]} size="lg" />
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <VegasCard faceDown size="lg" />
                  <VegasCard faceDown size="lg" />
                </div>
              )}
            </div>
            <div className="text-xs font-black uppercase tracking-wider text-rose-300">
              Your Hole Cards
            </div>
          </div>
        </div>
      </Vegas3DTableArena>

      {/* Outcome / Advice Message */}
      {message && (
        <div className="bg-black/70 border border-rose-500/40 text-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-zinc-200">
          {message}
        </div>
      )}

      {/* Betting Spots HUD with 3D Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-black/70 p-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative">
          <span className="text-[10px] text-zinc-400 font-bold uppercase">Ante</span>
          <div className="font-mono text-gold font-black text-sm mt-0.5">£{baseBet}</div>
          <div className="mt-1">
            <VegasChipStack amount={baseBet} size="xs" />
          </div>
        </div>

        <div className="bg-black/70 p-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative">
          <span className="text-[10px] text-zinc-400 font-bold uppercase">Blind</span>
          <div className="font-mono text-gold font-black text-sm mt-0.5">£{baseBet}</div>
          <div className="mt-1">
            <VegasChipStack amount={baseBet} size="xs" />
          </div>
        </div>

        <div className="bg-black/70 p-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative">
          <span className="text-[10px] text-zinc-400 font-bold uppercase">Trips Bonus</span>
          <div className="font-mono text-amber-300 font-black text-sm mt-0.5">£{tripsBet}</div>
          <div className="mt-1">
            <VegasChipStack amount={tripsBet} size="xs" />
          </div>
        </div>

        <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center relative ${
          playMultiplier > 0
            ? 'bg-rose-950/80 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
            : 'bg-black/40 border-dashed border-white/10'
        }`}>
          <span className="text-[10px] text-rose-300 font-bold uppercase">
            Play Wager {playMultiplier > 0 ? `(${playMultiplier}x)` : ''}
          </span>
          <div className="font-mono text-rose-400 font-black text-sm mt-0.5">
            {playMultiplier > 0 ? `£${baseBet * playMultiplier}` : '—'}
          </div>
          <div className="mt-1">
            {playMultiplier > 0 ? (
              <VegasChipStack amount={baseBet * playMultiplier} size="xs" />
            ) : (
              <span className="text-[10px] text-zinc-500 font-mono">No Bet</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls Bar with 3D Chip Rack */}
      <div className="bg-black/60 p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Chip Rack */}
        <div className="flex items-center gap-3">
          <VegasChipRack
            values={[5, 10, 25, 50, 100]}
            selectedValue={baseBet}
            onSelect={setBaseBet}
            disabled={street !== 'betting' && street !== 'showdown'}
          />
        </div>

        {/* Street Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {street === 'betting' || street === 'showdown' ? (
            <button
              disabled={totalAnteBlind + tripsBet > bankroll}
              onClick={handleDeal}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-600 text-white font-black uppercase text-xs tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition"
            >
              {street === 'showdown' ? 'Deal Next Hand' : `Deal Hand (£${totalAnteBlind + tripsBet})`}
            </button>
          ) : street === 'preflop' ? (
            <>
              <button
                onClick={handlePreflopCheck}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase text-xs tracking-wider transition"
              >
                Check
              </button>
              <button
                onClick={handlePreflopRaise4x}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider shadow-lg transition"
              >
                Raise 4x (£{baseBet * 4})
              </button>
            </>
          ) : street === 'flop' ? (
            <>
              <button
                onClick={handleFlopCheck}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase text-xs tracking-wider transition"
              >
                Check
              </button>
              <button
                onClick={handleFlopRaise2x}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider shadow-lg transition"
              >
                Raise 2x (£{baseBet * 2})
              </button>
            </>
          ) : street === 'river' ? (
            <>
              <button
                onClick={handleFold}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-black uppercase text-xs tracking-wider transition"
              >
                Fold
              </button>
              <button
                onClick={handleRiverRaise1x}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider shadow-lg transition"
              >
                Raise 1x (£{baseBet})
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
