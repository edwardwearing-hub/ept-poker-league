'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { HelpCircle, Sparkles, Plus, Volume2, VolumeX, MessageSquare, Mic, MicOff, Trophy } from 'lucide-react';
import RouletteWheelVisual, { getPocketColor, ROULETTE_NUMBERS } from '../RouletteWheelVisual';
import VegasChip, { VegasChipStack } from '../VegasChip';
import VegasWinSplash from '../VegasWinSplash';
import { playChipSound, playWinSound, isSoundEnabled, setSoundEnabled } from '@/lib/vegas/VegasAudio';
import { addGameHistory } from '@/lib/vegas/VegasHistory';
import { getActivePlayerName } from '@/lib/poker-trainer/tracker';
import { fetchDealerComment, DealerEventPayload } from '@/lib/vegas/VegasAiService';
import { useKonamiHighRoller } from '@/components/EasterEggs';

interface Props {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onOpenTutorial: () => void;
}

const RED_NUMS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

interface BetAction {
  category: 'number' | 'column' | 'dozen' | 'outside';
  target: string | number;
  amount: number;
}

export default function RouletteGame({ bankroll, onUpdateBankroll, onOpenTutorial }: Props) {
  const { isHighRoller } = useKonamiHighRoller();
  const [selectedChip, setSelectedChip] = useState<number>(25);
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  const [playerName, setPlayerName] = useState('Player 1');

  // Bet records
  const [numberBets, setNumberBets] = useState<Record<string | number, number>>({});
  const [columnBets, setColumnBets] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 }); // 1 = top row, 2 = mid row, 3 = bot row
  const [dozenBets, setDozenBets] = useState<Record<string, number>>({ '1st12': 0, '2nd12': 0, '3rd12': 0 });
  const [outsideBets, setOutsideBets] = useState<Record<string, number>>({
    low: 0, // 1-18
    even: 0,
    red: 0,
    black: 0,
    odd: 0,
    high: 0, // 19-36
  });

  // Action history for UNDO and previous state for REBET
  const [betHistory, setBetHistory] = useState<BetAction[]>([]);
  const [lastRoundBets, setLastRoundBets] = useState<{
    numbers: Record<string | number, number>;
    columns: Record<number, number>;
    dozens: Record<string, number>;
    outside: Record<string, number>;
  } | null>(null);

  // Wheel spin & outcomes
  const [spinning, setSpinning] = useState(false);
  const [showWheelOverlay, setShowWheelOverlay] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | string | null>(35);
  // Default history matching the authentic screenshot: 35 at top, then 1, 20, 4, 24, 28, 12, 6
  const [history, setHistory] = useState<(number | string)[]>([35, 1, 20, 4, 24, 28, 12, 6]);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>('Place your chips upon the felt!');
  const [splashWin, setSplashWin] = useState<number | null>(null);
  const [splashDetails, setSplashDetails] = useState<{
    subtitle?: string;
    winDetail?: string;
    badge?: string;
  }>({});
  const [sessionNet, setSessionNet] = useState<number>(0);

  // Live AI Dealer Sarah State
  const [dealerDialogue, setDealerDialogue] = useState<string>(
    'Welcome to the Monte Carlo suite, darling. Place your wagers upon the felt!'
  );
  const [isAiThinking, setIsAiThinking] = useState(false);
  const lastSpokenRef = useRef<string>('');

  // Voice synthesis for Sarah
  const speakLine = (line: string) => {
    if (!voiceOn || typeof window === 'undefined' || !window.speechSynthesis) return;
    if (lastSpokenRef.current === line) return;
    lastSpokenRef.current = line;

    try {
      window.speechSynthesis.cancel();
      const clean = line.replace(/[\u{1F300}-\u{1F6FF}|[\u{2600}-\u{26FF}]/gu, '');
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 1.0;
      utter.pitch = 1.15; // glamorous feminine croupier tone
      const voices = window.speechSynthesis.getVoices();
      const female = voices.find(
        (v) =>
          v.name.includes('Female') ||
          v.name.includes('Samantha') ||
          v.name.includes('Victoria') ||
          v.name.includes('Google UK English Female') ||
          v.name.includes('Natural')
      );
      if (female) utter.voice = female;
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  // Helper to trigger Sarah's AI comment in real time
  const askSarahAi = async (eventType: DealerEventPayload['eventType'], extra?: Partial<DealerEventPayload>) => {
    setIsAiThinking(true);
    const comment = await fetchDealerComment({
      game: 'Roulette',
      playerName,
      eventType,
      sessionNet,
      ...extra,
    });
    setDealerDialogue(comment);
    setIsAiThinking(false);
    speakLine(comment);
  };

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    const name = getActivePlayerName();
    if (name) {
      setPlayerName(name);
      // Greet player via AI on load
      askSarahAi('welcome', { playerName: name });
    }
  }, []);

  // Compute Total Table Bet
  const totalNumberBet = Object.values(numberBets).reduce((a, b) => a + b, 0);
  const totalColumnBet = Object.values(columnBets).reduce((a, b) => a + b, 0);
  const totalDozenBet = Object.values(dozenBets).reduce((a, b) => a + b, 0);
  const totalOutsideBet = Object.values(outsideBets).reduce((a, b) => a + b, 0);
  const totalWager = totalNumberBet + totalColumnBet + totalDozenBet + totalOutsideBet;

  // Add a Bet on a specific number (0, '00', 1-36)
  const addNumberBet = (num: number | string) => {
    if (spinning) return;
    if (totalWager + selectedChip > bankroll) return;
    playChipSound();
    setNumberBets((prev) => ({
      ...prev,
      [num]: (prev[num] || 0) + selectedChip,
    }));
    setBetHistory((prev) => [...prev, { category: 'number', target: num, amount: selectedChip }]);
  };

  // Add a Bet on a Column (1 = row 1, 2 = row 2, 3 = row 3)
  const addColumnBet = (col: number) => {
    if (spinning) return;
    if (totalWager + selectedChip > bankroll) return;
    playChipSound();
    setColumnBets((prev) => ({
      ...prev,
      [col]: (prev[col] || 0) + selectedChip,
    }));
    setBetHistory((prev) => [...prev, { category: 'column', target: col, amount: selectedChip }]);
  };

  // Add a Bet on Dozens
  const addDozenBet = (dozenId: '1st12' | '2nd12' | '3rd12') => {
    if (spinning) return;
    if (totalWager + selectedChip > bankroll) return;
    playChipSound();
    setDozenBets((prev) => ({
      ...prev,
      [dozenId]: (prev[dozenId] || 0) + selectedChip,
    }));
    setBetHistory((prev) => [...prev, { category: 'dozen', target: dozenId, amount: selectedChip }]);
  };

  // Add an Outside Bet
  const addOutsideBet = (key: string) => {
    if (spinning) return;
    if (totalWager + selectedChip > bankroll) return;
    playChipSound();
    setOutsideBets((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + selectedChip,
    }));
    setBetHistory((prev) => [...prev, { category: 'outside', target: key, amount: selectedChip }]);
  };

  // CLEAR ALL BETS
  const handleClearBets = () => {
    if (spinning || totalWager === 0) return;
    playChipSound();
    setNumberBets({});
    setColumnBets({ 1: 0, 2: 0, 3: 0 });
    setDozenBets({ '1st12': 0, '2nd12': 0, '3rd12': 0 });
    setOutsideBets({ low: 0, even: 0, red: 0, black: 0, odd: 0, high: 0 });
    setBetHistory([]);
  };

  // UNDO LAST BET
  const handleUndo = () => {
    if (spinning || betHistory.length === 0) return;
    playChipSound();
    const lastAction = betHistory[betHistory.length - 1];
    setBetHistory((prev) => prev.slice(0, -1));

    if (lastAction.category === 'number') {
      setNumberBets((prev) => {
        const cur = prev[lastAction.target] || 0;
        const next = cur - lastAction.amount;
        const copy = { ...prev };
        if (next <= 0) delete copy[lastAction.target];
        else copy[lastAction.target] = next;
        return copy;
      });
    } else if (lastAction.category === 'column') {
      setColumnBets((prev) => ({
        ...prev,
        [lastAction.target as number]: Math.max(0, (prev[lastAction.target as number] || 0) - lastAction.amount),
      }));
    } else if (lastAction.category === 'dozen') {
      setDozenBets((prev) => ({
        ...prev,
        [lastAction.target as string]: Math.max(0, (prev[lastAction.target as string] || 0) - lastAction.amount),
      }));
    } else if (lastAction.category === 'outside') {
      setOutsideBets((prev) => ({
        ...prev,
        [lastAction.target as string]: Math.max(0, (prev[lastAction.target as string] || 0) - lastAction.amount),
      }));
    }
  };

  // DOUBLE ALL BETS (X2)
  const handleDoubleBets = () => {
    if (spinning || totalWager === 0) return;
    if (totalWager * 2 > bankroll) return;
    playChipSound();

    const doubleMap = <T extends Record<string | number, number>>(obj: T): T => {
      const res: Record<string | number, number> = {};
      for (const [k, v] of Object.entries(obj)) {
        res[k] = v * 2;
      }
      return res as T;
    };

    setNumberBets((prev) => doubleMap(prev));
    setColumnBets((prev) => doubleMap(prev));
    setDozenBets((prev) => doubleMap(prev));
    setOutsideBets((prev) => doubleMap(prev));

    // Sarah reacts to doubling up
    askSarahAi('double_down', { wager: totalWager * 2 });
  };

  // REBET PREVIOUS ROUND'S WAGERS
  const handleRebet = () => {
    if (spinning || !lastRoundBets) return;
    const prevTotal =
      Object.values(lastRoundBets.numbers).reduce((a, b) => a + b, 0) +
      Object.values(lastRoundBets.columns).reduce((a, b) => a + b, 0) +
      Object.values(lastRoundBets.dozens).reduce((a, b) => a + b, 0) +
      Object.values(lastRoundBets.outside).reduce((a, b) => a + b, 0);

    if (prevTotal > bankroll) return;
    playChipSound();
    setNumberBets({ ...lastRoundBets.numbers });
    setColumnBets({ ...lastRoundBets.columns });
    setDozenBets({ ...lastRoundBets.dozens });
    setOutsideBets({ ...lastRoundBets.outside });
  };

  // SPIN THE WHEEL
  const handleSpin = () => {
    if (spinning || totalWager === 0 || totalWager > bankroll) return;

    // Save current bets for rebet
    setLastRoundBets({
      numbers: { ...numberBets },
      columns: { ...columnBets },
      dozens: { ...dozenBets },
      outside: { ...outsideBets },
    });

    setSpinning(true);
    setShowWheelOverlay(true);
    setOutcomeMessage(null);
    setSplashWin(null);

    // Pick a winning number (European 0-36 or 00)
    // 97% standard 0..36, 3% chance of 00 for Vegas flavor
    const isDoubleZero = Math.random() < 0.03;
    const target = isDoubleZero ? '00' : Math.floor(Math.random() * 37);
    setWinningNumber(target);
  };

  // WHEEL SPIN FINISHED
  const handleSpinComplete = () => {
    setSpinning(false);
    if (winningNumber === null) return;

    // Prepend to history tower
    setHistory((prev) => [winningNumber, ...prev.slice(0, 9)]);

    const isNum = typeof winningNumber === 'number';
    const numVal = isNum ? (winningNumber as number) : -1;
    const color = winningNumber === '00' || winningNumber === 0 ? 'green' : RED_NUMS.includes(numVal) ? 'red' : 'black';

    // Payout calculation
    let totalWin = 0;

    // 1. Straight Up Bets (pays 35:1 + original wager back = 36x)
    if (numberBets[winningNumber]) {
      totalWin += numberBets[winningNumber] * 36;
    }

    // 2. Column Bets (pays 2:1 + original wager back = 3x)
    if (isNum && numVal > 0) {
      const col = numVal % 3 === 0 ? 1 : numVal % 3 === 2 ? 2 : 3;
      if (columnBets[col]) {
        totalWin += columnBets[col] * 3;
      }
    }

    // 3. Dozen Bets (pays 2:1 + original wager back = 3x)
    if (isNum && numVal >= 1 && numVal <= 12 && dozenBets['1st12']) totalWin += dozenBets['1st12'] * 3;
    if (isNum && numVal >= 13 && numVal <= 24 && dozenBets['2nd12']) totalWin += dozenBets['2nd12'] * 3;
    if (isNum && numVal >= 25 && numVal <= 36 && dozenBets['3rd12']) totalWin += dozenBets['3rd12'] * 3;

    // 4. Outside Bets (pays 1:1 + original wager back = 2x)
    if (color === 'red' && outsideBets.red) totalWin += outsideBets.red * 2;
    if (color === 'black' && outsideBets.black) totalWin += outsideBets.black * 2;
    if (isNum && numVal > 0 && numVal % 2 === 0 && outsideBets.even) totalWin += outsideBets.even * 2;
    if (isNum && numVal > 0 && numVal % 2 !== 0 && outsideBets.odd) totalWin += outsideBets.odd * 2;
    if (isNum && numVal >= 1 && numVal <= 18 && outsideBets.low) totalWin += outsideBets.low * 2;
    if (isNum && numVal >= 19 && numVal <= 36 && outsideBets.high) totalWin += outsideBets.high * 2;

    const netResult = totalWin - totalWager;
    setSessionNet((prev) => prev + netResult);
    onUpdateBankroll(netResult);

    const colorLabel = color.toUpperCase();
    if (netResult > 0) {
      playWinSound();

      // Collect specific winning hits to explain how the player won
      const winningHits: string[] = [];
      if (numberBets[winningNumber]) {
        winningHits.push(`Straight Up #${winningNumber} (Paid 35:1)`);
      }
      if (isNum && numVal > 0) {
        const col = numVal % 3 === 0 ? 1 : numVal % 3 === 2 ? 2 : 3;
        if (columnBets[col]) winningHits.push(`Column ${col} (Paid 2:1)`);
      }
      if (isNum && numVal >= 1 && numVal <= 12 && dozenBets['1st12']) winningHits.push(`1st 12 (Paid 2:1)`);
      if (isNum && numVal >= 13 && numVal <= 24 && dozenBets['2nd12']) winningHits.push(`2nd 12 (Paid 2:1)`);
      if (isNum && numVal >= 25 && numVal <= 36 && dozenBets['3rd12']) winningHits.push(`3rd 12 (Paid 2:1)`);
      if (color === 'red' && outsideBets.red) winningHits.push(`Red (Paid 1:1)`);
      if (color === 'black' && outsideBets.black) winningHits.push(`Black (Paid 1:1)`);
      if (isNum && numVal > 0 && numVal % 2 === 0 && outsideBets.even) winningHits.push(`Even (Paid 1:1)`);
      if (isNum && numVal > 0 && numVal % 2 !== 0 && outsideBets.odd) winningHits.push(`Odd (Paid 1:1)`);
      if (isNum && numVal >= 1 && numVal <= 18 && outsideBets.low) winningHits.push(`1-18 Low (Paid 1:1)`);
      if (isNum && numVal >= 19 && numVal <= 36 && outsideBets.high) winningHits.push(`19-36 High (Paid 1:1)`);

      setSplashDetails({
        subtitle: `Ball landed on #${winningNumber} ${colorLabel}`,
        winDetail: winningHits.length > 0 ? winningHits.join(' • ') : `Won £${netResult.toLocaleString()}`,
        badge: `#${winningNumber} ${colorLabel}`,
      });

      setSplashWin(netResult);
      setOutcomeMessage(`Ball landed on #${winningNumber} (${colorLabel})! You won £${netResult.toLocaleString()}! 🎉`);
      addGameHistory({
        gameId: 'roulette',
        headline: `Ball landed on #${winningNumber} (${colorLabel})`,
        detail: winningHits.length > 0 ? winningHits.join(' • ') : `Won £${netResult.toLocaleString()} on spin`,
        delta: netResult,
        badge: `#${winningNumber} ${colorLabel}`,
      });

      // Query AI Dealer Sarah for real-time commentary
      askSarahAi(netResult >= 300 ? 'big_win' : 'spin_win', {
        result: winningNumber,
        color: colorLabel,
        netDelta: netResult,
        wager: totalWager,
      });
    } else if (netResult < 0) {
      setOutcomeMessage(`Ball landed on #${winningNumber} (${colorLabel}). Lost £${Math.abs(netResult).toLocaleString()}.`);
      addGameHistory({
        gameId: 'roulette',
        headline: `Ball landed on #${winningNumber} (${colorLabel})`,
        detail: `Lost £${Math.abs(netResult).toLocaleString()} on spin`,
        delta: netResult,
        badge: `#${winningNumber} ${colorLabel}`,
      });

      // Query AI Dealer Sarah for real-time commentary
      askSarahAi('spin_loss', {
        result: winningNumber,
        color: colorLabel,
        netDelta: netResult,
        wager: totalWager,
      });
    } else {
      setOutcomeMessage(`Ball landed on #${winningNumber} (${colorLabel}). Break even.`);
      addGameHistory({
        gameId: 'roulette',
        headline: `Ball landed on #${winningNumber} (${colorLabel})`,
        detail: 'Break even push',
        delta: 0,
        badge: `#${winningNumber} ${colorLabel}`,
      });
      askSarahAi('spin_push', {
        result: winningNumber,
        color: colorLabel,
        netDelta: 0,
        wager: totalWager,
      });
    }

    // Auto close overlay after a moment
    setTimeout(() => {
      setShowWheelOverlay(false);
    }, 2400);
  };

  // Helper row arrays for 3 rows x 12 columns
  const row1 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]; // Row 1 (top)
  const row2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35]; // Row 2 (mid)
  const row3 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]; // Row 3 (bot)

  return (
    <div className="relative w-full rounded-[2rem] bg-gradient-to-b from-[#1b1b1e] via-[#0f0f12] to-[#08080a] p-2 sm:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] border-4 border-[#282830] select-none overflow-hidden font-sans">
      {/* Big Win Splash Fireworks */}
      <VegasWinSplash
        winAmount={splashWin}
        title="ROULETTE HIT!"
        subtitle={splashDetails.subtitle}
        winDetail={splashDetails.winDetail}
        badge={splashDetails.badge}
        onComplete={() => setSplashWin(null)}
      />

      {/* 1. TOP MOBILE-CASINO HUD STATUS BAR */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-black/70 border border-white/10 mb-2.5 text-white">
        {/* Left: Avatar & VIP Star Level */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 border border-white/40 flex items-center justify-center text-sm shadow-md">
            👤
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-700 via-cyan-600 to-blue-600 border border-cyan-300/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] text-xs font-black">
            <span className="text-yellow-300">★ 1</span>
            <span className="text-white hidden sm:inline">{playerName}</span>
          </div>
        </div>

        {/* Center: Recessed BET Box */}
        <div className="flex items-center gap-2 bg-[#09150e] border-2 border-[#166534] rounded-xl px-3 py-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400/80">BET</span>
          <span className="font-mono font-black text-sm sm:text-base text-white">
            £{totalWager.toLocaleString()}
          </span>
        </div>

        {/* Right: Recessed BALANCE Box with Green '+' button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#09150e] border-2 border-[#166534] rounded-xl px-3 py-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            <span className="font-mono font-black text-sm sm:text-base text-yellow-300">
              £{bankroll.toLocaleString()}
            </span>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('ept_open_login'))}
              className="w-5 h-5 rounded-full bg-gradient-to-b from-[#22c55e] to-[#15803d] hover:brightness-110 text-white flex items-center justify-center text-xs font-black shadow"
              title="Add Chips / Claim Handle"
            >
              <Plus size={12} strokeWidth={3} />
            </button>
          </div>

          {/* Sound & Voice Toggles */}
          <button
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
            }}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition"
            title="Toggle Sound FX"
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} className="text-zinc-400" />}
          </button>

          <button
            onClick={() => setVoiceOn(!voiceOn)}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition ${
              voiceOn ? 'bg-gold/25 border-gold text-gold shadow-[0_0_10px_#ffd700]' : 'bg-white/10 hover:bg-white/20 border-white/20 text-zinc-400'
            }`}
            title={voiceOn ? 'Dealer Voice ON' : 'Dealer Voice OFF (Click to hear Sarah speak)'}
          >
            {voiceOn ? <Mic size={15} /> : <MicOff size={15} />}
          </button>

          <Link
            href="/academy?tab=leaderboard&discipline=roulette-craps"
            className="px-2.5 py-1.5 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold font-black text-xs uppercase tracking-wider transition shadow flex items-center gap-1.5"
            title="View Roulette & Craps League Standings"
          >
            <Trophy size={14} className="text-gold" />
            <span className="hidden sm:inline">Wheel League</span>
          </Link>

          <button
            onClick={onOpenTutorial}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-yellow-300 flex items-center justify-center transition"
            title="Roulette Tutorial & Rules"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* 2. GLAMOROUS DEALER SARAH STANDING AT THE TABLE (TOP RAIL INTEGRATION) */}
      <div className="relative mb-2.5 rounded-2xl bg-gradient-to-r from-[#20130b] via-[#120a06] to-[#1c0f08] border-2 border-gold/50 p-2.5 sm:p-3 shadow-[0_6px_20px_rgba(0,0,0,0.85)] flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden">
        {/* Subtle Racetrack Wood Inlay */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#ffd700]/40 to-transparent pointer-events-none" />

        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          {/* Sarah Looking Over The Table Rail */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-t-full rounded-b-2xl border-2 border-gold/80 overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.7)] bg-black">
              <img
                src="/vegas/dealer_sarah.jpg"
                alt="Sarah Head Dealer"
                className="w-full h-full object-cover object-top scale-115 -translate-y-0.5"
              />
            </div>
            {/* Live AI Croupier Status Badge */}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider border border-white/60 shadow flex items-center gap-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{isHighRoller ? '👑 VIP AI' : 'LIVE AI'}</span>
            </span>
          </div>

          {/* Real-Time Live Speech Bubble */}
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                <span>Sarah</span>
                <span className="text-[10px] font-normal text-zinc-400">
                  {isHighRoller ? '• 👑 24K Salon Privé Croupier' : '• Monte Carlo Croupier'}
                </span>
              </span>
              {isAiThinking && (
                <span className="text-[10px] font-mono text-cyan-400 animate-pulse flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>Thinking...</span>
                </span>
              )}
            </div>

            <div className="relative bg-black/75 border border-gold/40 px-3 py-1.5 rounded-xl text-xs sm:text-sm text-yellow-100 font-sans italic leading-snug shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              &quot;{dealerDialogue}&quot;
            </div>
          </div>
        </div>

        {/* Quick Ask / Refresh Commentary Button */}
        <button
          type="button"
          disabled={isAiThinking}
          onClick={() => askSarahAi('custom', { wager: totalWager })}
          className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-white/5 hover:bg-gold/20 text-zinc-300 hover:text-gold border border-white/10 hover:border-gold/40 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow"
          title="Ask Sarah for a live comment"
        >
          <MessageSquare size={13} className="text-gold" />
          <span>Dealer Chat</span>
        </button>
      </div>

      {/* 3. THE MAIN EMERALD GREEN (OR 24K GOLD KONAMI) TABLE FELT WITH EPT WATERMARK & FINE TEXTURE */}
      <div
        className={`relative w-full rounded-2xl p-2.5 sm:p-4 shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] border-2 overflow-x-auto ${
          isHighRoller
            ? 'bg-gradient-to-b from-[#b8860b] via-[#855e06] to-[#422c02] border-[#ffd700] shadow-[inset_0_0_80px_rgba(0,0,0,0.85),0_0_35px_rgba(255,215,0,0.35)]'
            : 'bg-[#0b7a37] border-[#15803d]'
        }`}
      >
        {/* Overhead Spotlighting Radial Beam */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isHighRoller
              ? 'radial-gradient(ellipse 70% 60% at 50% 35%, rgba(255,235,120,0.28) 0%, rgba(212,175,55,0.05) 65%, transparent 80%)'
              : 'radial-gradient(ellipse 70% 60% at 50% 35%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 65%, transparent 80%)',
          }}
        />

        {/* Woven Felt Fiber Micro-Grain Texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.25) 1px, transparent 0)`,
            backgroundSize: '4px 4px',
          }}
        />

        {/* EPT Poker League Custom Felt Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
          <div className="flex flex-col items-center opacity-25 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-gold/70 p-1 bg-black/40 backdrop-blur-[1px] shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center overflow-hidden">
              <img
                src="/ept-logo.jpg"
                alt="EPT Poker League Felt Watermark"
                className="w-full h-full object-contain filter brightness-125 contrast-125"
              />
            </div>
            <div className="mt-2 text-center">
              <span className="text-[10px] sm:text-xs font-serif font-black tracking-[0.25em] text-yellow-200 uppercase">
                ★ {isHighRoller ? 'VIP 24K GOLD • E.P.T. 2026 POKER LEAGUE' : 'E.P.T. 2026 POKER LEAGUE'} ★
              </span>
              <div className="text-[8px] font-mono tracking-widest text-yellow-100 uppercase mt-0.5">
                {isHighRoller
                  ? '👑 KONAMI HIGH ROLLER SALON • 35:1 MONTE CARLO'
                  : 'OFFICIAL VEGAS CASINO SUITE • 35:1 MONTE CARLO'}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-[760px] flex items-stretch gap-3 relative z-10">
          {/* A. LEFT STATS VERTICAL TOWER (Dark rounded capsule pill) */}
          <div className="w-16 rounded-2xl bg-black/90 border-2 border-white/30 p-2 flex flex-col items-center justify-between shrink-0 shadow-2xl">
            {/* Top Large Winning Number */}
            <div className="text-center w-full pb-1 border-b border-white/20">
              <span className="text-3xl font-black font-mono text-white tracking-tight drop-shadow-md">
                {winningNumber !== null ? winningNumber : '—'}
              </span>
            </div>

            {/* Vertical History Strip */}
            <div className="flex flex-col items-center gap-1.5 my-2 w-full">
              {history.slice(1, 8).map((num, idx) => {
                const isNum = typeof num === 'number';
                const color = num === '00' || num === 0 ? 'green' : isNum && RED_NUMS.includes(num) ? 'red' : 'black';
                return (
                  <span
                    key={idx}
                    className={`font-mono text-xs font-black drop-shadow ${
                      color === 'red'
                        ? 'text-red-500'
                        : color === 'green'
                        ? 'text-emerald-400'
                        : 'text-white'
                    }`}
                  >
                    {num}
                  </span>
                );
              })}
            </div>

            {/* Bottom STATS Label */}
            <div className="w-full pt-1 border-t border-white/20 text-center">
              <span className="text-[10px] font-black tracking-widest text-zinc-300 uppercase">
                STATS
              </span>
            </div>
          </div>

          {/* B. THE ROULETTE FELT GRID (Framed in crisp white casino silkscreen) */}
          <div
            className={`flex-1 flex flex-col border-2 border-white rounded-2xl p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] backdrop-blur-[0.5px] ${
              isHighRoller ? 'bg-[#855e06]/90' : 'bg-[#0d853e]/90'
            }`}
          >
            {/* TOP SECTION: ZEROS (LEFT) + 3x12 NUMBERS (CENTER) + 2 TO 1 (RIGHT) */}
            <div className="flex items-stretch border-b-2 border-white">
              {/* 00 and 0 Left Column */}
              <div className="w-14 sm:w-16 flex flex-col border-r-2 border-white divide-y-2 divide-white shrink-0">
                {/* 00 (Top half) */}
                <button
                  type="button"
                  onClick={() => addNumberBet('00')}
                  className={`flex-1 p-2 flex items-center justify-center relative hover:bg-white/10 transition group ${
                    numberBets['00'] ? 'bg-emerald-900/60' : ''
                  }`}
                >
                  <div className="w-10 sm:w-12 h-14 sm:h-16 rounded-full bg-gradient-to-b from-[#00e676] via-[#00c853] to-[#009624] border-2 border-emerald-300/60 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.7)] flex items-center justify-center font-mono font-black text-white text-base sm:text-lg group-hover:scale-105 transition-transform">
                    00
                  </div>
                  {/* Dolly marker if winning */}
                  {winningNumber === '00' && !spinning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce">
                      <div className="w-4 h-7 rounded-sm bg-gradient-to-b from-[#ffd700] via-[#cfb53b] to-[#856514] border border-white shadow-[0_0_15px_#ffd700]" />
                    </div>
                  )}
                  {/* Placed Chip */}
                  {numberBets['00'] && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <VegasChipStack amount={numberBets['00']} size="xs" />
                    </div>
                  )}
                </button>

                {/* 0 (Bottom half) */}
                <button
                  type="button"
                  onClick={() => addNumberBet(0)}
                  className={`flex-1 p-2 flex items-center justify-center relative hover:bg-white/10 transition group ${
                    numberBets[0] ? 'bg-emerald-900/60' : ''
                  }`}
                >
                  <div className="w-10 sm:w-12 h-14 sm:h-16 rounded-full bg-gradient-to-b from-[#00e676] via-[#00c853] to-[#009624] border-2 border-emerald-300/60 shadow-[0_3px_8px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.7)] flex items-center justify-center font-mono font-black text-white text-base sm:text-lg group-hover:scale-105 transition-transform">
                    0
                  </div>
                  {/* Dolly marker if winning */}
                  {winningNumber === 0 && !spinning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce">
                      <div className="w-4 h-7 rounded-sm bg-gradient-to-b from-[#ffd700] via-[#cfb53b] to-[#856514] border border-white shadow-[0_0_15px_#ffd700]" />
                    </div>
                  )}
                  {/* Placed Chip */}
                  {numberBets[0] && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <VegasChipStack amount={numberBets[0]} size="xs" />
                    </div>
                  )}
                </button>
              </div>

              {/* 3 ROWS OF NUMBERS (12 COLUMNS) */}
              <div className="flex-1 flex flex-col divide-y-2 divide-white">
                {/* Row 1 (Top): 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36 */}
                <div className="flex divide-x-2 divide-white">
                  {row1.map((num) => {
                    const isRed = RED_NUMS.includes(num);
                    const bet = numberBets[num] || 0;
                    const isWinning = winningNumber === num && !spinning;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => addNumberBet(num)}
                        className={`flex-1 p-1.5 sm:p-2 flex items-center justify-center relative hover:bg-white/10 transition group ${
                          bet > 0 ? 'bg-gold/15' : ''
                        }`}
                      >
                        <div
                          className={`w-9 sm:w-11 h-12 sm:h-14 rounded-full border-2 flex items-center justify-center font-mono font-black text-white text-base sm:text-lg shadow-[0_3px_8px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform ${
                            isRed
                              ? 'bg-gradient-to-b from-[#ef4444] via-[#dc2626] to-[#991b1b] border-red-300/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]'
                              : 'bg-gradient-to-b from-[#27272a] via-[#18181b] to-[#09090b] border-white/40 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]'
                          }`}
                        >
                          {num}
                        </div>
                        {/* Brass Dolly Win Marker */}
                        {isWinning && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce">
                            <div className="w-4 h-7 rounded-sm bg-gradient-to-b from-[#ffd700] via-[#cfb53b] to-[#856514] border border-white shadow-[0_0_15px_#ffd700]" />
                          </div>
                        )}
                        {/* Placed Chip on Felt */}
                        {bet > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <VegasChipStack amount={bet} size="xs" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Row 2 (Middle): 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35 */}
                <div className="flex divide-x-2 divide-white">
                  {row2.map((num) => {
                    const isRed = RED_NUMS.includes(num);
                    const bet = numberBets[num] || 0;
                    const isWinning = winningNumber === num && !spinning;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => addNumberBet(num)}
                        className={`flex-1 p-1.5 sm:p-2 flex items-center justify-center relative hover:bg-white/10 transition group ${
                          bet > 0 ? 'bg-gold/15' : ''
                        }`}
                      >
                        <div
                          className={`w-9 sm:w-11 h-12 sm:h-14 rounded-full border-2 flex items-center justify-center font-mono font-black text-white text-base sm:text-lg shadow-[0_3px_8px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform ${
                            isRed
                              ? 'bg-gradient-to-b from-[#ef4444] via-[#dc2626] to-[#991b1b] border-red-300/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]'
                              : 'bg-gradient-to-b from-[#27272a] via-[#18181b] to-[#09090b] border-white/40 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]'
                          }`}
                        >
                          {num}
                        </div>
                        {/* Brass Dolly Win Marker */}
                        {isWinning && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce">
                            <div className="w-4 h-7 rounded-sm bg-gradient-to-b from-[#ffd700] via-[#cfb53b] to-[#856514] border border-white shadow-[0_0_15px_#ffd700]" />
                          </div>
                        )}
                        {/* Placed Chip on Felt */}
                        {bet > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <VegasChipStack amount={bet} size="xs" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Row 3 (Bottom): 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34 */}
                <div className="flex divide-x-2 divide-white">
                  {row3.map((num) => {
                    const isRed = RED_NUMS.includes(num);
                    const bet = numberBets[num] || 0;
                    const isWinning = winningNumber === num && !spinning;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => addNumberBet(num)}
                        className={`flex-1 p-1.5 sm:p-2 flex items-center justify-center relative hover:bg-white/10 transition group ${
                          bet > 0 ? 'bg-gold/15' : ''
                        }`}
                      >
                        <div
                          className={`w-9 sm:w-11 h-12 sm:h-14 rounded-full border-2 flex items-center justify-center font-mono font-black text-white text-base sm:text-lg shadow-[0_3px_8px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform ${
                            isRed
                              ? 'bg-gradient-to-b from-[#ef4444] via-[#dc2626] to-[#991b1b] border-red-300/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]'
                              : 'bg-gradient-to-b from-[#27272a] via-[#18181b] to-[#09090b] border-white/40 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]'
                          }`}
                        >
                          {num}
                        </div>
                        {/* Brass Dolly Win Marker */}
                        {isWinning && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce">
                            <div className="w-4 h-7 rounded-sm bg-gradient-to-b from-[#ffd700] via-[#cfb53b] to-[#856514] border border-white shadow-[0_0_15px_#ffd700]" />
                          </div>
                        )}
                        {/* Placed Chip on Felt */}
                        {bet > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <VegasChipStack amount={bet} size="xs" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: 2 TO 1 (for Row 1, Row 2, Row 3) */}
              <div className="w-12 sm:w-14 flex flex-col border-l-2 border-white divide-y-2 divide-white shrink-0">
                {[1, 2, 3].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => addColumnBet(col)}
                    className={`flex-1 p-2 flex items-center justify-center text-center font-serif font-black text-white text-xs sm:text-sm tracking-tight leading-tight hover:bg-white/10 transition relative ${
                      columnBets[col] ? 'bg-gold/20' : ''
                    }`}
                  >
                    <span>2<br />TO<br />1</span>
                    {columnBets[col] > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <VegasChipStack amount={columnBets[col]} size="xs" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* MIDDLE SECTION: DOZENS (1st TWELVE, 2nd TWELVE, 3rd TWELVE) */}
            <div className="flex border-b-2 border-white divide-x-2 divide-white">
              {[
                { id: '1st12', label: '1st TWELVE' },
                { id: '2nd12', label: '2nd TWELVE' },
                { id: '3rd12', label: '3rd TWELVE' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => addDozenBet(d.id as '1st12' | '2nd12' | '3rd12')}
                  className={`flex-1 py-3 px-2 text-center font-serif font-black text-white text-xs sm:text-sm tracking-widest uppercase hover:bg-white/10 transition relative ${
                    dozenBets[d.id] ? 'bg-gold/20' : ''
                  }`}
                >
                  <span>{d.label}</span>
                  {dozenBets[d.id] > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <VegasChipStack amount={dozenBets[d.id]} size="xs" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* BOTTOM SECTION: OUTSIDE EVEN-MONEY BETS (1-18, EVEN, RED ◆, BLACK ◆, ODD, 19-36) */}
            <div className="flex divide-x-2 divide-white">
              {[
                { id: 'low', label: '1-18' },
                { id: 'even', label: 'EVEN' },
                { id: 'red', isDiamond: 'red' },
                { id: 'black', isDiamond: 'black' },
                { id: 'odd', label: 'ODD' },
                { id: 'high', label: '19-36' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => addOutsideBet(b.id)}
                  className={`flex-1 py-3 px-2 flex items-center justify-center hover:bg-white/10 transition relative ${
                    outsideBets[b.id] ? 'bg-gold/20' : ''
                  }`}
                >
                  {b.isDiamond === 'red' ? (
                    <span className="text-3xl font-black text-[#e51c23] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                      ◆
                    </span>
                  ) : b.isDiamond === 'black' ? (
                    <span className="text-3xl font-black text-[#111111] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                      ◆
                    </span>
                  ) : (
                    <span className="font-serif font-black text-white text-xs sm:text-sm tracking-wider uppercase">
                      {b.label}
                    </span>
                  )}

                  {outsideBets[b.id] > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <VegasChipStack amount={outsideBets[b.id]} size="xs" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. OUTCOME MESSAGE BANNER */}
      {outcomeMessage && (
        <div className="my-2.5 py-1.5 px-4 rounded-xl bg-black/80 border border-gold/40 text-center text-xs sm:text-sm font-bold text-yellow-300 shadow">
          {outcomeMessage}
        </div>
      )}

      {/* 5. RECESSED MAHOGANY & LEATHER CONSOLE (BOTTOM CONTROLS BAR) */}
      <div className="mt-3 rounded-2xl p-3 sm:p-4 bg-gradient-to-b from-[#2a170d] via-[#1a0e08] to-[#0c0704] border-t-2 border-[#f59e0b]/80 shadow-[0_-8px_20px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,215,0,0.4)] flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: Glossy Blue Action Buttons (X2, CLEAR) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={spinning || totalWager === 0}
            onClick={handleDoubleBets}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-b from-[#00b0ff] via-[#0091ea] to-[#0077c2] border-2 border-[#80d8ff]/70 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_10px_rgba(0,145,234,0.4),inset_0_2px_4px_rgba(255,255,255,0.7)] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            X2
          </button>

          <button
            type="button"
            disabled={spinning || totalWager === 0}
            onClick={handleClearBets}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-b from-[#00b0ff] via-[#0091ea] to-[#0077c2] border-2 border-[#80d8ff]/70 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_10px_rgba(0,145,234,0.4),inset_0_2px_4px_rgba(255,255,255,0.7)] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            CLEAR
          </button>
        </div>

        {/* Center: Recessed Dark Velvet Chip Tray (10, 25, 50, 100, 250 + 500, 1000, 5000 in Konami High Roller Mode) */}
        <div
          className={`rounded-full bg-[#0a0a0d] border p-1.5 shadow-[inset_0_4px_10px_rgba(0,0,0,0.9)] flex items-center gap-1.5 sm:gap-3 max-w-full overflow-x-auto touch-pan-x ${
            isHighRoller ? 'border-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'border-amber-600/40'
          }`}
        >
          {(isHighRoller ? [10, 25, 50, 100, 250, 500, 1000, 5000] : [10, 25, 50, 100, 250]).map((val) => (
            <VegasChip
              key={val}
              value={val}
              size="md"
              selected={selectedChip === val}
              disabled={spinning}
              onClick={() => setSelectedChip(val)}
            />
          ))}
        </div>

        {/* Right Side: Glossy Blue Buttons (UNDO, REBET) + Big Green Glossy SPIN Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={spinning || betHistory.length === 0}
            onClick={handleUndo}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-b from-[#00b0ff] via-[#0091ea] to-[#0077c2] border-2 border-[#80d8ff]/70 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_10px_rgba(0,145,234,0.4),inset_0_2px_4px_rgba(255,255,255,0.7)] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            UNDO
          </button>

          <button
            type="button"
            disabled={spinning || !lastRoundBets}
            onClick={handleRebet}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-b from-[#00b0ff] via-[#0091ea] to-[#0077c2] border-2 border-[#80d8ff]/70 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_10px_rgba(0,145,234,0.4),inset_0_2px_4px_rgba(255,255,255,0.7)] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            REBET
          </button>

          {/* Big Green 3D SPIN Button */}
          <button
            type="button"
            disabled={spinning || totalWager === 0 || totalWager > bankroll}
            onClick={handleSpin}
            className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl bg-gradient-to-b from-[#00e676] via-[#00c853] to-[#00873a] border-2 border-[#b9f6ca] text-white font-black text-sm sm:text-base uppercase tracking-widest shadow-[0_6px_16px_rgba(0,200,83,0.5),inset_0_2px_4px_rgba(255,255,255,0.8)] hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Sparkles size={16} />
            <span>{spinning ? 'SPINNING...' : 'SPIN'}</span>
          </button>
        </div>
      </div>

      {/* 6. CINEMATIC 3D ROULETTE WHEEL MODAL / OVERLAY ON SPIN */}
      {showWheelOverlay && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-[#141e16] via-black to-[#090f0b] border-2 border-gold rounded-3xl p-6 sm:p-8 max-w-lg w-full flex flex-col items-center shadow-[0_0_60px_rgba(212,175,55,0.6)] space-y-4">
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Official Las Vegas 37-Pocket Wheel
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {spinning ? 'Ball in Orbit...' : `Winning Pocket: #${winningNumber}`}
              </h3>
            </div>

            {/* Realistic Rotating 3D Wheel with Ball Physics */}
            <RouletteWheelVisual
              spinning={spinning}
              winningNumber={typeof winningNumber === 'number' ? winningNumber : 0}
              onSpinEnd={handleSpinComplete}
            />

            {!spinning && (
              <div className="w-full text-center py-2 px-4 rounded-xl bg-black/60 border border-gold/40 text-gold font-black text-sm animate-pulse">
                Result: #{winningNumber} • Returning to Felt Layout...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
