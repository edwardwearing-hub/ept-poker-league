'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, RotateCcw, Sparkles, Trophy, Brain } from 'lucide-react';
import VegasCard, { CardModel } from '../VegasCard';
import VegasAiDealer from '../VegasAiDealer';
import { VegasChipRack, VegasChipStack } from '../VegasChip';
import VegasWinSplash from '../VegasWinSplash';
import Vegas3DTableArena from '../Vegas3DTableArena';
import { playCardSound, playChipSound, playWinSound } from '@/lib/vegas/VegasAudio';
import { addGameHistory } from '@/lib/vegas/VegasHistory';
import { getBaccaratAdvice } from '@/lib/vegas/VegasStrategyEngine';

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
      if (['10', 'J', 'Q', 'K'].includes(rank)) value = 0;
      if (rank === 'A') value = 1;
      deck.push({ rank, suit, value });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calculateBaccaratHand(cards: CardModel[]): number {
  const sum = cards.reduce((acc, c) => acc + (c.value || 0), 0);
  return sum % 10;
}

type BaccaratBet = 'player' | 'banker' | 'tie' | 'player-pair' | 'banker-pair';

export default function BaccaratGame({ bankroll, onUpdateBankroll, onOpenTutorial }: Props) {
  const [selectedChip, setSelectedChip] = useState(25);
  const [bets, setBets] = useState<Record<BaccaratBet, number>>({
    player: 50,
    banker: 0,
    tie: 0,
    'player-pair': 0,
    'banker-pair': 0,
  });

  const [playerCards, setPlayerCards] = useState<CardModel[]>([]);
  const [bankerCards, setBankerCards] = useState<CardModel[]>([]);
  const [dealing, setDealing] = useState(false);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(
    'Select chip value and place your bet on Player, Banker, or Tie.'
  );
  const [dealerDialogue, setDealerDialogue] = useState<string>(
    'Welcome to high-stakes Baccarat, darling. Place your wager on Player, Banker, or Tie!'
  );
  const [beadPlate, setBeadPlate] = useState<('P' | 'B' | 'T')[]>([
    'B', 'P', 'B', 'B', 'T', 'P', 'B', 'P', 'B', 'B', 'P', 'B'
  ]);
  const [splashWin, setSplashWin] = useState<number | null>(null);
  const [splashDetails, setSplashDetails] = useState<{ subtitle?: string; winDetail?: string; badge?: string }>({});

  const totalWager = Object.values(bets).reduce((a, b) => a + b, 0);
  const playerScore = calculateBaccaratHand(playerCards);
  const bankerScore = calculateBaccaratHand(bankerCards);

  const addBet = (type: BaccaratBet) => {
    if (dealing) return;
    if (totalWager + selectedChip > bankroll) return;
    playChipSound();
    setBets((prev) => ({ ...prev, [type]: prev[type] + selectedChip }));
  };

  const clearBets = () => {
    if (dealing) return;
    playChipSound();
    setBets({
      player: 0,
      banker: 0,
      tie: 0,
      'player-pair': 0,
      'banker-pair': 0,
    });
  };

  const handleDeal = () => {
    if (dealing || totalWager === 0 || totalWager > bankroll) return;
    setDealing(true);
    setOutcomeMessage(null);
    setSplashWin(null);
    setDealerDialogue('No more bets, darling. Dealing the Tableau...');

    const deck = createDeck();
    const p1 = deck.pop()!;
    const b1 = deck.pop()!;
    const p2 = deck.pop()!;
    const b2 = deck.pop()!;

    let pHand = [p1, p2];
    let bHand = [b1, b2];

    // Card deal audio
    playCardSound();
    setPlayerCards([p1]);
    setBankerCards([]);

    setTimeout(() => {
      playCardSound();
      setBankerCards([b1]);
    }, 250);

    setTimeout(() => {
      playCardSound();
      setPlayerCards([p1, p2]);
    }, 500);

    setTimeout(() => {
      playCardSound();
      setBankerCards([b1, b2]);

      let pScore = calculateBaccaratHand(pHand);
      let bScore = calculateBaccaratHand(bHand);

      // Natural 8 or 9 check
      const isNatural = pScore >= 8 || bScore >= 8;

      if (!isNatural) {
        let p3: CardModel | null = null;
        if (pScore <= 5) {
          p3 = deck.pop()!;
          pHand.push(p3);
          pScore = calculateBaccaratHand(pHand);
        }

        if (p3 === null) {
          if (bScore <= 5) {
            const b3 = deck.pop()!;
            bHand.push(b3);
            bScore = calculateBaccaratHand(bHand);
          }
        } else {
          const p3Val = p3.value || 0;
          let bankerDraws = false;
          if (bScore <= 2) bankerDraws = true;
          else if (bScore === 3 && p3Val !== 8) bankerDraws = true;
          else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(p3Val)) bankerDraws = true;
          else if (bScore === 5 && [4, 5, 6, 7].includes(p3Val)) bankerDraws = true;
          else if (bScore === 6 && [6, 7].includes(p3Val)) bankerDraws = true;

          if (bankerDraws) {
            const b3 = deck.pop()!;
            bHand.push(b3);
            bScore = calculateBaccaratHand(bHand);
          }
        }
      }

      setTimeout(() => {
        setPlayerCards([...pHand]);
        setBankerCards([...bHand]);
        setDealing(false);

        // Evaluate Wager Outcome
        let net = 0;
        let winner: 'P' | 'B' | 'T';

        if (pScore > bScore) {
          winner = 'P';
          if (bets.player > 0) net += bets.player;
          if (bets.banker > 0) net -= bets.banker;
          if (bets.tie > 0) net -= bets.tie;
        } else if (bScore > pScore) {
          winner = 'B';
          if (bets.banker > 0) net += Math.floor(bets.banker * 0.95); // 5% commission
          if (bets.player > 0) net -= bets.player;
          if (bets.tie > 0) net -= bets.tie;
        } else {
          winner = 'T';
          if (bets.tie > 0) net += bets.tie * 8;
        }

        // Pairs
        if (bets['player-pair'] > 0) {
          if (pHand[0].rank === pHand[1].rank) net += bets['player-pair'] * 11;
          else net -= bets['player-pair'];
        }
        if (bets['banker-pair'] > 0) {
          if (bHand[0].rank === bHand[1].rank) net += bets['banker-pair'] * 11;
          else net -= bets['banker-pair'];
        }

        setBeadPlate((prev) => [winner, ...prev.slice(0, 15)]);
        if (net !== 0) {
          onUpdateBankroll(net);
        }

        if (net > 0) {
          playWinSound();
          setSplashWin(net);

          const winParts: string[] = [];
          if (winner === 'P' && bets.player > 0) {
            winParts.push(`Player Bet (${pScore} vs ${bScore}) Paid 1:1 (+£${bets.player.toLocaleString()})`);
          }
          if (winner === 'B' && bets.banker > 0) {
            winParts.push(`Banker Bet (${bScore} vs ${pScore}) Paid 1:1 less 5% comm (+£${Math.floor(bets.banker * 0.95).toLocaleString()})`);
          }
          if (winner === 'T' && bets.tie > 0) {
            winParts.push(`Tie Bet at ${pScore} Paid 8:1 (+£${(bets.tie * 8).toLocaleString()})`);
          }
          if (bets['player-pair'] > 0 && pHand[0].rank === pHand[1].rank) {
            winParts.push(`Player Pair (${pHand[0].rank}) Paid 11:1 (+£${(bets['player-pair'] * 11).toLocaleString()})`);
          }
          if (bets['banker-pair'] > 0 && bHand[0].rank === bHand[1].rank) {
            winParts.push(`Banker Pair (${bHand[0].rank}) Paid 11:1 (+£${(bets['banker-pair'] * 11).toLocaleString()})`);
          }

          let badge = 'BACCARAT WIN';
          if (winner === 'T') {
            badge = 'TIE 8:1';
          } else if (isNatural) {
            badge = winner === 'P' ? `PLAYER NATURAL ${pScore}` : `BANKER NATURAL ${bScore}`;
          } else {
            badge = winner === 'P' ? `PLAYER ${pScore} WINS` : `BANKER ${bScore} WINS`;
          }

          setSplashDetails({
            badge,
            subtitle: winner === 'P' ? `Player takes the coup ${pScore} to ${bScore}` : winner === 'B' ? `Banker takes the coup ${bScore} to ${pScore}` : `Tie coup at ${pScore}`,
            winDetail: winParts.join(' • '),
          });
        }

        if (winner === 'P') {
          setOutcomeMessage(`Player wins ${pScore} to ${bScore}! ${net > 0 ? `Won £${net.toLocaleString()}!` : ''}`);
          setDealerDialogue(`Player takes the hand with ${pScore} over ${bScore}! Congratulations, darling!`);
          addGameHistory({
            gameId: 'baccarat',
            headline: `Player Wins (${pScore} vs ${bScore})`,
            detail: net > 0 ? `Won £${net.toLocaleString()}` : net < 0 ? `Lost £${Math.abs(net).toLocaleString()}` : 'Push',
            delta: net,
            badge: 'Player Win',
          });
        } else if (winner === 'B') {
          setOutcomeMessage(`Banker wins ${bScore} to ${pScore}! ${net > 0 ? `Won £${net.toLocaleString()} (after 5% comm)!` : ''}`);
          setDealerDialogue(`Banker wins with ${bScore} over ${pScore}. The 5% commission has been deducted.`);
          addGameHistory({
            gameId: 'baccarat',
            headline: `Banker Wins (${bScore} vs ${pScore})`,
            detail: net > 0 ? `Won £${net.toLocaleString()} (5% comm)` : net < 0 ? `Lost £${Math.abs(net).toLocaleString()}` : 'Push',
            delta: net,
            badge: 'Banker Win',
          });
        } else {
          setOutcomeMessage(`Tie at ${pScore}! ${net > 0 ? `Won £${net.toLocaleString()} at 8:1!` : 'Main bets push.'}`);
          setDealerDialogue(`It's a Tie at ${pScore}! Main bets push, and 8 to 1 paid to Tie wagers, darling!`);
          addGameHistory({
            gameId: 'baccarat',
            headline: `Tie Hand (${pScore} - ${bScore})`,
            detail: net > 0 ? `Tie paid 8:1 (+£${net.toLocaleString()})` : 'Main bets pushed',
            delta: net,
            badge: 'Tie 8:1',
          });
        }
      }, 700);
    }, 750);
  };

  // Stats calculation for scoreboard
  const bankerCount = beadPlate.filter((b) => b === 'B').length;
  const playerCount = beadPlate.filter((b) => b === 'P').length;
  const tieCount = beadPlate.filter((b) => b === 'T').length;
  const totalRounds = beadPlate.length || 1;

  return (
    <div
      style={{ touchAction: 'manipulation' }}
      className="h-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden select-none touch-manipulation relative bg-gradient-to-b from-indigo-950/80 via-black to-zinc-950 border border-indigo-500/40 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-2xl font-sans"
    >
      {/* Big Win Splash Banner */}
      <VegasWinSplash
        winAmount={splashWin}
        title="BACCARAT WIN!"
        subtitle={splashDetails.subtitle}
        winDetail={splashDetails.winDetail}
        badge={splashDetails.badge}
        onComplete={() => setSplashWin(null)}
      />

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-black uppercase tracking-widest shrink-0">
              High-Roller Classic
            </span>
            <span className="text-zinc-400 text-[10px] font-mono hidden sm:inline">House Edge: 1.06% (Banker)</span>
          </div>
          <h3 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5 mt-0.5 truncate">
            <span>Baccarat (Punto Banco)</span>
            <span className="text-[9px] font-mono font-bold text-gold px-1.5 py-0.2 rounded bg-gold/15 border border-gold/30">
              Target 9 Points
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/academy?tab=leaderboard&discipline=blackjack"
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold text-[10px] font-black uppercase tracking-wider transition shadow"
            title="View Blackjack & Table Games League Standings"
          >
            <Trophy size={12} className="text-gold" />
            <span className="hidden sm:inline">Table League</span>
            <span className="sm:hidden">League</span>
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

      {/* AI Glamorous Dealer Sarah Header */}
      <div className="shrink-0 mb-1">
        <VegasAiDealer
          dialogue={dealerDialogue}
          gameTitle="Baccarat"
          status={dealing ? 'Dealing Tableau' : 'Awaiting Wager'}
        />
      </div>

      {/* Live Baccarat Strategy Coach Advice HUD */}
      <div className="shrink-0 bg-gradient-to-r from-indigo-950/80 via-black to-zinc-950 border border-indigo-500/40 p-2 sm:p-3 rounded-xl flex items-center justify-between gap-2 text-xs shadow-lg mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
            <Brain size={14} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase font-mono font-black text-indigo-300">
                Odds Advisor
              </span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold hidden sm:inline">
                ⚡ Lowest Edge
              </span>
            </div>
            {(() => {
              const adv = getBaccaratAdvice();
              return (
                <div className="truncate text-[10px] sm:text-[11px] text-zinc-300 font-bold">
                  {adv.headline}
                </div>
              );
            })()}
          </div>
        </div>
        <div className="shrink-0">
          <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 font-black text-[9px] sm:text-xs font-mono">
            REC: {getBaccaratAdvice().action}
          </span>
        </div>
      </div>

      {/* Macau / Evolution Style Bead Road Scoreboard */}
      <div className="shrink-0 bg-black/80 p-1.5 sm:p-3 rounded-xl border border-white/10 flex items-center justify-between gap-2 font-mono text-[10px] sm:text-xs shadow-xl mb-1">
        {/* Statistics Ratio */}
        <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-black shrink-0">
          <div className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-600 inline-block" />
            <span>Banker: {Math.round((bankerCount / totalRounds) * 100)}%</span>
          </div>
          <div className="flex items-center gap-1 text-blue-400">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-600 inline-block" />
            <span>Player: {Math.round((playerCount / totalRounds) * 100)}%</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-600 inline-block" />
            <span>Tie: {tieCount}</span>
          </div>
        </div>

        {/* Bead Plate Cells */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-[140px] sm:max-w-none">
          <span className="text-[9px] uppercase font-bold text-zinc-500 mr-0.5 hidden sm:inline">Road:</span>
          {beadPlate.map((res, idx) => (
            <div
              key={idx}
              className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs text-white shadow ${
                res === 'B'
                  ? 'bg-red-600'
                  : res === 'P'
                  ? 'bg-blue-600'
                  : 'bg-emerald-600'
              }`}
            >
              {res}
            </div>
          ))}
        </div>
      </div>

      {/* 3D Tilted Baccarat VIP Salon Table Arena */}
      <Vegas3DTableArena
        gameType="baccarat"
        showShoe={true}
        showDiscardRack={true}
        showChipTray={true}
        watermarkTitle="PUNTO BANCO"
        watermarkSubtitle="MACAU & VEGAS HIGH-LIMIT SALON • COMMISSION 5%"
      >
        <div className="space-y-6 relative z-10">
          {/* Hands Arena */}
          <div className="grid grid-cols-2 gap-4 relative z-10">
            {/* Player Hand */}
            <div className="flex flex-col items-center gap-2 bg-black/85 p-4 rounded-2xl border-2 border-blue-500/60 shadow-xl backdrop-blur-sm">
              <div className="text-sm font-black uppercase text-blue-300 flex items-center gap-2 tracking-wider">
                <span>PLAYER HAND</span>
                {playerCards.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-200 border border-blue-400 font-mono text-sm font-black shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                    {playerScore}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 min-h-[90px] justify-center">
                {playerCards.map((c, i) => (
                  <VegasCard key={i} card={c} size="lg" />
                ))}
                {playerCards.length === 0 && (
                  <div className="text-xs font-bold text-zinc-300 uppercase tracking-widest px-3 py-1.5 rounded-lg bg-black/60 border border-white/10">
                    Awaiting Deal
                  </div>
                )}
              </div>
            </div>

            {/* Banker Hand */}
            <div className="flex flex-col items-center gap-2 bg-black/85 p-4 rounded-2xl border-2 border-red-500/60 shadow-xl backdrop-blur-sm">
              <div className="text-sm font-black uppercase text-red-300 flex items-center gap-2 tracking-wider">
                <span>BANKER HAND</span>
                {bankerCards.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-950 text-red-200 border border-red-400 font-mono text-sm font-black shadow-[0_0_15px_rgba(239,68,68,0.8)]">
                    {bankerScore}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 min-h-[90px] justify-center">
                {bankerCards.map((c, i) => (
                  <VegasCard key={i} card={c} size="lg" />
                ))}
                {bankerCards.length === 0 && (
                  <div className="text-xs font-bold text-zinc-300 uppercase tracking-widest px-3 py-1.5 rounded-lg bg-black/60 border border-white/10">
                    Awaiting Deal
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Baccarat Main Betting Ovals with 3D Chip Stacks (Solid Sharp Backplates) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center relative z-10">
            {/* Player Bet */}
            <div
              onClick={() => addBet('player')}
              className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all select-none flex flex-col items-center justify-center relative shadow-xl ${
                bets.player > 0
                  ? 'bg-blue-950 border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.7)]'
                  : 'bg-zinc-950/95 border-zinc-700 hover:border-blue-400 hover:bg-zinc-900'
              }`}
            >
              <div className="text-[11px] sm:text-sm font-black uppercase tracking-wider text-blue-300">
                PLAYER (1:1)
              </div>
              <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1">
                £{bets.player.toLocaleString()}
              </div>
              {bets.player > 0 && (
                <div className="absolute -top-2 right-2">
                  <VegasChipStack amount={bets.player} size="xs" />
                </div>
              )}
            </div>

            {/* Tie Bet */}
            <div
              onClick={() => addBet('tie')}
              className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all select-none flex flex-col items-center justify-center relative shadow-xl ${
                bets.tie > 0
                  ? 'bg-emerald-950 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.7)]'
                  : 'bg-zinc-950/95 border-zinc-700 hover:border-emerald-400 hover:bg-zinc-900'
              }`}
            >
              <div className="text-[11px] sm:text-sm font-black uppercase tracking-wider text-emerald-300">
                TIE (8:1)
              </div>
              <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1">
                £{bets.tie.toLocaleString()}
              </div>
              {bets.tie > 0 && (
                <div className="absolute -top-2 right-2">
                  <VegasChipStack amount={bets.tie} size="xs" />
                </div>
              )}
            </div>

            {/* Banker Bet */}
            <div
              onClick={() => addBet('banker')}
              className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all select-none flex flex-col items-center justify-center relative shadow-xl ${
                bets.banker > 0
                  ? 'bg-red-950 border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                  : 'bg-zinc-950/95 border-zinc-700 hover:border-red-400 hover:bg-zinc-900'
              }`}
            >
              <div className="text-[11px] sm:text-sm font-black uppercase tracking-wider text-red-300">
                BANKER (1:1)
              </div>
              <div className="font-mono text-xs sm:text-base font-black text-white mt-0.5 sm:mt-1">
                £{bets.banker.toLocaleString()}
              </div>
              {bets.banker > 0 && (
                <div className="absolute -top-2 right-2">
                  <VegasChipStack amount={bets.banker} size="xs" />
                </div>
              )}
            </div>
          </div>

          {/* Side Bets (Pairs) with Solid Sharp Backplates */}
          <div className="grid grid-cols-2 gap-3 text-center text-xs relative z-10">
            <div
              onClick={() => addBet('player-pair')}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all select-none relative shadow-lg ${
                bets['player-pair'] > 0
                  ? 'bg-blue-950 border-blue-400 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  : 'bg-zinc-950/95 border-zinc-700 text-zinc-200 hover:border-blue-400'
              }`}
            >
              <span className="font-black text-xs uppercase tracking-wide">Player Pair (11:1)</span>
              <div className="font-mono text-gold font-black text-sm mt-0.5">£{bets['player-pair']}</div>
              {bets['player-pair'] > 0 && (
                <div className="absolute -top-2 right-2">
                  <VegasChipStack amount={bets['player-pair']} size="xs" />
                </div>
              )}
            </div>

            <div
              onClick={() => addBet('banker-pair')}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all select-none relative shadow-lg ${
                bets['banker-pair'] > 0
                  ? 'bg-red-950 border-red-400 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'bg-zinc-950/95 border-zinc-700 text-zinc-200 hover:border-red-400'
              }`}
            >
              <span className="font-black text-xs uppercase tracking-wide">Banker Pair (11:1)</span>
              <div className="font-mono text-gold font-black text-sm mt-0.5">£{bets['banker-pair']}</div>
              {bets['banker-pair'] > 0 && (
                <div className="absolute -top-2 right-2">
                  <VegasChipStack amount={bets['banker-pair']} size="xs" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Vegas3DTableArena>

      {/* Outcome Announcement */}
      {outcomeMessage && (
        <div className="shrink-0 bg-black/70 border border-gold/40 text-center py-1 px-3 rounded-lg text-xs font-bold text-zinc-200 mb-1">
          {outcomeMessage}
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
            disabled={dealing}
          />
          {totalWager > 0 && !dealing && (
            <button
              onClick={clearBets}
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-[10px] sm:text-xs font-bold transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Wager and Deal Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[9px] uppercase font-bold text-zinc-400">Total Bet:</div>
            <div className="text-xs sm:text-base font-mono font-black text-gold">
              £{totalWager.toLocaleString()}
            </div>
          </div>

          <button
            disabled={dealing || totalWager === 0 || totalWager > bankroll}
            onClick={handleDeal}
            className="px-4 py-2 sm:px-8 sm:py-3 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#cfb53b] to-[#ffd700] text-black font-black uppercase text-[11px] sm:text-xs tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.5)] hover:brightness-110 active:scale-95 transition disabled:opacity-40"
          >
            {dealing ? 'DEALING...' : 'DEAL TABLEAU'}
          </button>
        </div>
      </div>
    </div>
  );
}
