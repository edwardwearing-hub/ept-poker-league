'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, Play, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import VegasCard, { CardModel } from '../VegasCard';
import VegasAiDealer from '../VegasAiDealer';
import { VegasChipRack, VegasChipStack } from '../VegasChip';
import VegasWinSplash from '../VegasWinSplash';
import Vegas3DTableArena from '../Vegas3DTableArena';
import { playCardSound, playChipSound, playWinSound, playJackpotSound } from '@/lib/vegas/VegasAudio';
import { addGameHistory } from '@/lib/vegas/VegasHistory';

interface Props {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onOpenTutorial: () => void;
}

const SUITS: CardModel['suit'][] = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createShoe(deckCount = 4): CardModel[] {
  const shoe: CardModel[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        let value = parseInt(rank, 10);
        if (['J', 'Q', 'K'].includes(rank)) value = 10;
        if (rank === 'A') value = 11;
        shoe.push({ rank, suit, value });
      }
    }
  }
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  return shoe;
}

function calculateHandValue(cards: CardModel[]): { total: number; isSoft: boolean; isBust: boolean; isBlackjack: boolean } {
  let total = 0;
  let aceCount = 0;

  for (const c of cards) {
    if (c.rank === 'A') {
      aceCount++;
      total += 11;
    } else {
      total += c.value || 0;
    }
  }

  while (total > 21 && aceCount > 0) {
    total -= 10;
    aceCount--;
  }

  const isSoft = aceCount > 0;
  const isBust = total > 21;
  const isBlackjack = cards.length === 2 && total === 21;

  return { total, isSoft, isBust, isBlackjack };
}

export default function BlackjackGame({ bankroll, onUpdateBankroll, onOpenTutorial }: Props) {
  const [shoe, setShoe] = useState<CardModel[]>(() => createShoe(4));
  const [bet, setBet] = useState(25);
  const [activeWager, setActiveWager] = useState(25);
  const [playerCards, setPlayerCards] = useState<CardModel[]>([]);
  const [dealerCards, setDealerCards] = useState<CardModel[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'player-turn' | 'dealer-turn' | 'game-over'>('betting');
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);
  const [payoutDelta, setPayoutDelta] = useState<number | null>(null);
  const [dealerDialogue, setDealerDialogue] = useState<string>(
    'Welcome to the Blackjack table, darling. Place your chips and let us see if you can reach 21!'
  );
  const [splashWin, setSplashWin] = useState<number | null>(null);

  const playerHand = calculateHandValue(playerCards);
  const fullDealerHand = calculateHandValue(dealerCards);

  // Deal starting hands with realistic audio and sequential animation
  const handleDeal = () => {
    if (bet > bankroll) return;
    let currentShoe = [...shoe];
    if (currentShoe.length < 20) {
      currentShoe = createShoe(4);
    }

    playCardSound();
    const p1 = currentShoe.pop()!;
    const d1 = currentShoe.pop()!;
    const p2 = currentShoe.pop()!;
    const d2 = currentShoe.pop()!;

    setShoe(currentShoe);
    setPlayerCards([p1, p2]);
    setDealerCards([d1, d2]);
    setActiveWager(bet);
    setOutcomeMessage(null);
    setPayoutDelta(null);
    setSplashWin(null);

    const initialPlayer = calculateHandValue([p1, p2]);
    const initialDealer = calculateHandValue([d1, d2]);

    // Check immediate naturals
    if (initialPlayer.isBlackjack || initialDealer.isBlackjack) {
      setGameState('game-over');
      if (initialPlayer.isBlackjack && initialDealer.isBlackjack) {
        setOutcomeMessage('Both Natural Blackjacks! Push (Stake Returned).');
        setDealerDialogue('Both of us have Natural Blackjack! A rare push, darling.');
        setPayoutDelta(0);
        addGameHistory({
          gameId: 'blackjack',
          headline: 'Both Natural Blackjacks!',
          detail: 'Player 21 vs Dealer 21 • Stake returned',
          delta: 0,
          badge: 'Push',
        });
      } else if (initialPlayer.isBlackjack) {
        const winAmount = Math.floor(bet * 1.5);
        playJackpotSound();
        setSplashWin(winAmount);
        setOutcomeMessage(`Natural Blackjack! Paid 3:2 (+£${winAmount.toLocaleString()})! 🎉`);
        setDealerDialogue('Natural Blackjack! Outstanding cards, darling! Paying 3 to 2 on your bet.');
        setPayoutDelta(winAmount);
        onUpdateBankroll(winAmount);
        addGameHistory({
          gameId: 'blackjack',
          headline: 'Natural Blackjack! Paid 3:2',
          detail: `Dealt ${p1.rank}${p1.suit} ${p2.rank}${p2.suit} • Won £${winAmount.toLocaleString()}`,
          delta: winAmount,
          badge: '3:2 Payout',
        });
      } else {
        setOutcomeMessage('Dealer has Natural Blackjack. House wins.');
        setDealerDialogue('The house holds Natural Blackjack. My apologies, darling.');
        setPayoutDelta(-bet);
        onUpdateBankroll(-bet);
        addGameHistory({
          gameId: 'blackjack',
          headline: 'Dealer Natural Blackjack',
          detail: `Dealer holds 21 • Lost £${bet.toLocaleString()}`,
          delta: -bet,
          badge: 'House 21',
        });
      }
    } else {
      setGameState('player-turn');
      setDealerDialogue(`You have ${initialPlayer.total}. My up-card is a ${d1.rank}. Hit, Stand, or Double?`);
    }
  };

  // Player Hits
  const handleHit = () => {
    if (gameState !== 'player-turn') return;
    playCardSound();
    const currentShoe = [...shoe];
    const nextCard = currentShoe.pop()!;
    setShoe(currentShoe);

    const updatedHand = [...playerCards, nextCard];
    setPlayerCards(updatedHand);
    const val = calculateHandValue(updatedHand);

    if (val.isBust) {
      setGameState('game-over');
      setOutcomeMessage(`Bust with ${val.total}! Dealer wins.`);
      setDealerDialogue(`Oh darling, bust with ${val.total}! The house takes this hand.`);
      setPayoutDelta(-activeWager);
      onUpdateBankroll(-activeWager);
      addGameHistory({
        gameId: 'blackjack',
        headline: `Player Bust with ${val.total}`,
        detail: `Hit over 21 • Lost £${activeWager.toLocaleString()}`,
        delta: -activeWager,
        badge: 'Bust',
      });
    } else if (val.total === 21) {
      setDealerDialogue('21! A perfect hand. Standing automatically.');
      handleStand(updatedHand);
    } else {
      setDealerDialogue(`You hit to ${val.total}. Care to take another card, or stand?`);
    }
  };

  // Player Stands -> Dealer reveals and hits to 17
  const handleStand = (currentHand = playerCards) => {
    setGameState('dealer-turn');
    let dCards = [...dealerCards];
    let s = [...shoe];

    playCardSound(); // Hole card reveal sound
    let dVal = calculateHandValue(dCards);
    while (dVal.total < 17) {
      const c = s.pop()!;
      dCards.push(c);
      dVal = calculateHandValue(dCards);
    }

    setShoe(s);
    setDealerCards(dCards);
    setGameState('game-over');

    const pVal = calculateHandValue(currentHand);
    if (dVal.isBust) {
      playWinSound();
      setSplashWin(activeWager);
      setOutcomeMessage(`Dealer Busts with ${dVal.total}! You Win (+£${activeWager.toLocaleString()})! 🎉`);
      setDealerDialogue(`Dealer busts with ${dVal.total}! Outstanding victory, darling! The chips are yours.`);
      setPayoutDelta(activeWager);
      onUpdateBankroll(activeWager);
      addGameHistory({
        gameId: 'blackjack',
        headline: 'Dealer Busts!',
        detail: `Dealer ${dVal.total} vs Player ${pVal.total} • Won £${activeWager.toLocaleString()}`,
        delta: activeWager,
        badge: 'Win 1:1',
      });
    } else if (pVal.total > dVal.total) {
      playWinSound();
      setSplashWin(activeWager);
      setOutcomeMessage(`You Win! ${pVal.total} beats Dealer's ${dVal.total} (+£${activeWager.toLocaleString()})!`);
      setDealerDialogue(`Splendid play! Your ${pVal.total} beats my ${dVal.total}. Winnings sent to your stack.`);
      setPayoutDelta(activeWager);
      onUpdateBankroll(activeWager);
      addGameHistory({
        gameId: 'blackjack',
        headline: 'Player Hand Wins!',
        detail: `Player ${pVal.total} beats Dealer ${dVal.total} • Won £${activeWager.toLocaleString()}`,
        delta: activeWager,
        badge: 'Win 1:1',
      });
    } else if (pVal.total < dVal.total) {
      setOutcomeMessage(`Dealer Wins! ${dVal.total} beats your ${pVal.total}.`);
      setDealerDialogue(`Dealer takes it with ${dVal.total} against your ${pVal.total}. Better luck on the next deal!`);
      setPayoutDelta(-activeWager);
      onUpdateBankroll(-activeWager);
      addGameHistory({
        gameId: 'blackjack',
        headline: 'Dealer Hand Wins',
        detail: `Dealer ${dVal.total} beats Player ${pVal.total} • Lost £${activeWager.toLocaleString()}`,
        delta: -activeWager,
        badge: 'House Win',
      });
    } else {
      setOutcomeMessage(`Push! Both have ${pVal.total} (Stake Returned).`);
      setDealerDialogue(`It's a push at ${pVal.total}! No harm done, darling. Stake returned.`);
      setPayoutDelta(0);
      addGameHistory({
        gameId: 'blackjack',
        headline: `Push at ${pVal.total}`,
        detail: `Both stand at ${pVal.total} • Stake returned`,
        delta: 0,
        badge: 'Push',
      });
    }
  };

  // Double Down
  const handleDoubleDown = () => {
    if (gameState !== 'player-turn' || playerCards.length !== 2) return;
    if (bankroll < activeWager * 2) return;

    playCardSound();
    const currentShoe = [...shoe];
    const nextCard = currentShoe.pop()!;
    setShoe(currentShoe);

    const updatedHand = [...playerCards, nextCard];
    setPlayerCards(updatedHand);
    const doubleWager = activeWager * 2;
    setActiveWager(doubleWager);

    setDealerDialogue('Doubling down! Fortune favors the bold, darling. Dealing one final card.');

    const pVal = calculateHandValue(updatedHand);
    if (pVal.isBust) {
      setGameState('game-over');
      setOutcomeMessage(`Bust with ${pVal.total}! Lost doubled bet.`);
      setDealerDialogue(`Bust with ${pVal.total}! The doubled wager goes to the house.`);
      setPayoutDelta(-doubleWager);
      onUpdateBankroll(-doubleWager);
      addGameHistory({
        gameId: 'blackjack',
        headline: `Doubled Bet Bust (${pVal.total})`,
        detail: `Lost doubled wager of £${doubleWager.toLocaleString()}`,
        delta: -doubleWager,
        badge: 'Double Bust',
      });
      return;
    }

    handleStand(updatedHand);
  };

  return (
    <div className="bg-gradient-to-b from-emerald-950/80 via-black to-zinc-950 border border-emerald-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden space-y-6">
      {/* Big Win Splash Banner */}
      <VegasWinSplash winAmount={splashWin} title="BLACKJACK WIN!" onComplete={() => setSplashWin(null)} />

      {/* Top Header & Rule Shortcut */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-widest">
              Game #1 • Vegas Table Classic
            </span>
            <span className="text-zinc-400 text-xs font-mono">House Edge: ~0.5%</span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
            <span>Vegas Strip Blackjack (21)</span>
            <span className="text-xs font-mono font-bold text-gold px-2 py-0.5 rounded bg-gold/15 border border-gold/30">
              3:2 Natural Payout
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Link
            href="/academy?tab=leaderboard&discipline=blackjack"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold text-xs font-black uppercase tracking-wider transition shadow"
            title="View Blackjack & Table Games League Standings"
          >
            <Trophy size={14} className="text-gold" />
            <span className="hidden sm:inline">Table League</span>
            <span className="sm:hidden">League</span>
          </Link>
          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition"
          >
            <HelpCircle size={14} className="text-gold" />
            <span className="hidden sm:inline">Rules & Tutorial</span>
            <span className="sm:hidden">Rules</span>
          </button>
        </div>
      </div>

      {/* AI Glamorous Dealer Sarah Header */}
      <VegasAiDealer
        dialogue={dealerDialogue}
        gameTitle="Blackjack"
        status={
          gameState === 'betting'
            ? 'Awaiting Wager'
            : gameState === 'player-turn'
            ? 'Player Decision'
            : 'Settling Hand'
        }
      />

      {/* 3D Tilted Casino Table Arena with Padded Leather Armrest, Mahogany Racetrack, 3D Shoe, and Dealer Chip Tray */}
      <Vegas3DTableArena
        gameType="blackjack"
        shoeCardsRemaining={shoe.length}
        watermarkTitle="LAS VEGAS"
        watermarkSubtitle="BLACKJACK PAYS 3 TO 2 • DEALER MUST STAND ON 17"
      >
        {/* Dealer Zone */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-200">
            <span>Dealer Hand</span>
            {gameState !== 'betting' && (
              <span className="px-2.5 py-0.5 rounded-full bg-black/80 border border-gold/40 text-gold font-mono text-sm font-black shadow-lg">
                {gameState === 'player-turn' ? `${dealerCards[0]?.value || ''}` : `${fullDealerHand.total}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 min-h-[95px] justify-center">
            {dealerCards.map((card, idx) => (
              <VegasCard
                key={idx}
                card={card}
                faceDown={idx === 1 && (gameState === 'player-turn' || gameState === 'betting')}
                size="lg"
              />
            ))}
            {dealerCards.length === 0 && (
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-widest px-3.5 py-1.5 rounded-xl bg-black/70 border border-white/10">
                Awaiting First Deal
              </div>
            )}
          </div>
        </div>

        {/* Center Table Wager Circle with 3D Chips */}
        <div className="relative z-10 py-2 flex flex-col items-center justify-center">
          {outcomeMessage ? (
            <div
              className={`inline-block px-6 py-3 rounded-2xl border text-sm sm:text-base font-black shadow-2xl animate-in zoom-in-95 duration-200 ${
                payoutDelta && payoutDelta > 0
                  ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 shadow-[0_0_35px_rgba(52,211,153,0.7)]'
                  : payoutDelta && payoutDelta < 0
                  ? 'bg-red-950/95 border-red-500 text-red-200 shadow-[0_0_35px_rgba(239,68,68,0.7)]'
                  : 'bg-zinc-900 border-white/20 text-zinc-300'
              }`}
            >
              {outcomeMessage}
            </div>
          ) : (
            <div className="relative group">
              {/* Pulsing Golden Betting Spot with Solid Backplate */}
              <div className="w-24 h-24 rounded-full border-2 border-gold/80 bg-zinc-950/95 flex flex-col items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.4)]">
                <span className="text-[11px] font-black uppercase text-gold tracking-widest">BET SPOT</span>
                <div className="mt-1">
                  <VegasChipStack amount={activeWager} size="md" />
                </div>
              </div>
              <div className="text-xs font-mono text-center text-white mt-1 font-black">
                £{activeWager} Active
              </div>
            </div>
          )}
        </div>

        {/* Player Zone */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-200">
            <span>Your Hand</span>
            {playerCards.length > 0 && (
              <span
                className={`px-3 py-0.5 rounded-full border font-mono text-sm font-black shadow-lg ${
                  playerHand.isBlackjack
                    ? 'bg-gold text-black border-white shadow-[0_0_20px_#ffd700]'
                    : playerHand.isBust
                    ? 'bg-red-950 text-red-300 border-red-500'
                    : 'bg-black/80 border-gold/40 text-gold'
                }`}
              >
                {playerHand.total} {playerHand.isSoft && !playerHand.isBlackjack && !playerHand.isBust ? '(Soft)' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 min-h-[95px] justify-center">
            {playerCards.map((card, idx) => (
              <VegasCard key={idx} card={card} size="lg" />
            ))}
            {playerCards.length === 0 && (
              <div className="text-xs text-white/40 italic font-medium px-4 py-2 rounded-xl bg-black/40 border border-white/5">
                Place your chips in the bet spot to begin
              </div>
            )}
          </div>
        </div>
      </Vegas3DTableArena>

      {/* Controls Bar with Authentic 3D Chip Rack */}
      <div className="bg-black/70 p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Chip Rack */}
        <div className="flex items-center gap-3">
          <VegasChipRack
            values={[5, 10, 25, 50, 100]}
            selectedValue={bet}
            onSelect={setBet}
            disabled={gameState === 'player-turn' || gameState === 'dealer-turn'}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {gameState === 'betting' || gameState === 'game-over' ? (
            <button
              disabled={bet > bankroll}
              onClick={handleDeal}
              className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-gradient-to-r from-[#ffd700] via-[#cfb53b] to-[#ffd700] text-black font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.5)] hover:brightness-110 active:scale-95 transition disabled:opacity-40"
            >
              {gameState === 'game-over' ? 'DEAL NEXT HAND' : `DEAL (£${bet})`}
            </button>
          ) : gameState === 'player-turn' ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleHit}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition"
              >
                HIT
              </button>
              <button
                onClick={() => handleStand()}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition"
              >
                STAND
              </button>
              {playerCards.length === 2 && bankroll >= activeWager * 2 && (
                <button
                  onClick={handleDoubleDown}
                  className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition"
                >
                  DOUBLE (£{activeWager * 2})
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-zinc-400 font-mono animate-pulse">
              Dealer playing...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
