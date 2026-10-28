'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, HelpCircle, Trophy, Volume2, VolumeX, Mic, MicOff, MessageSquare, Zap, Play, RotateCcw, Brain, ChevronLeft } from 'lucide-react';
import { VegasChipRack } from '../VegasChip';
import VegasWinSplash from '../VegasWinSplash';
import VegasGuideOddsDrawer from '../VegasGuideOddsDrawer';
import { playSlotTick, playSlotStop, playWinSound, playJackpotSound, isSoundEnabled, setSoundEnabled } from '@/lib/vegas/VegasAudio';
import { triggerHaptic } from '@/lib/vegas/VegasHaptics';
import { addGameHistory } from '@/lib/vegas/VegasHistory';
import { getActivePlayerName } from '@/lib/poker-trainer/tracker';
import { fetchDealerComment } from '@/lib/vegas/VegasAiService';

interface Props {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onOpenTutorial: () => void;
  onSwitchToPubFruity?: () => void;
  onBackToFloor?: () => void;
}


export interface SlotSymbol {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgGradient: string;
  payout3: number;
  weight: number;
}

export const SLOT_SYMBOLS: SlotSymbol[] = [
  {
    id: 'diamond',
    name: 'Mega Wild Diamond',
    icon: '💎',
    color: 'text-cyan-300',
    bgGradient: 'from-cyan-900/40 via-sky-950/60 to-black',
    payout3: 500, // 500x jackpot!
    weight: 1,
  },
  {
    id: 'seven',
    name: 'Flaming Lucky 7',
    icon: '7️⃣',
    color: 'text-red-400',
    bgGradient: 'from-red-950/60 via-amber-950/40 to-black',
    payout3: 150,
    weight: 3,
  },
  {
    id: 'bell',
    name: 'Liberty Gold Bell',
    icon: '🔔',
    color: 'text-yellow-300',
    bgGradient: 'from-amber-950/50 via-yellow-950/30 to-black',
    payout3: 60,
    weight: 6,
  },
  {
    id: 'crown',
    name: 'EPT Royal Crown',
    icon: '👑',
    color: 'text-amber-300',
    bgGradient: 'from-purple-950/50 via-indigo-950/40 to-black',
    payout3: 40,
    weight: 10,
  },
  {
    id: 'grapes',
    name: 'Royal Grapes',
    icon: '🍇',
    color: 'text-purple-300',
    bgGradient: 'from-purple-950/40 via-fuchsia-950/30 to-black',
    payout3: 25,
    weight: 14,
  },
  {
    id: 'melon',
    name: 'Neon Watermelon',
    icon: '🍉',
    color: 'text-emerald-300',
    bgGradient: 'from-emerald-950/40 via-green-950/30 to-black',
    payout3: 15,
    weight: 18,
  },
  {
    id: 'cherry',
    name: 'Ruby Cherries',
    icon: '🍒',
    color: 'text-rose-400',
    bgGradient: 'from-rose-950/50 via-red-950/30 to-black',
    payout3: 10,
    weight: 14,
  },
];

function getRandomSymbol(): SlotSymbol {
  const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const sym of SLOT_SYMBOLS) {
    if (rand < sym.weight) return sym;
    rand -= sym.weight;
  }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

interface WinningLine {
  lineIndex: number; // 0 = top, 1 = mid, 2 = bot, 3 = diag down, 4 = diag up
  symbol: SlotSymbol;
  winAmount: number;
  multiplier: number;
}

export default function SlotsGame({ bankroll, onUpdateBankroll, onOpenTutorial, onSwitchToPubFruity, onBackToFloor }: Props) {
  // Bet configuration
  const [betPerLine, setBetPerLine] = useState<number>(25);
  const [activeLines, setActiveLines] = useState<number>(3); // 1 = Center, 3 = Horizontal rows, 5 = All (inc diagonals)
  const totalBet = betPerLine * activeLines;
  const [showGuideOdds, setShowGuideOdds] = useState(false);

  // 3 Reels × 3 Rows Matrix: grid[col][row] where col in 0..2, row in 0..2 (0=top, 1=center, 2=bottom)
  const [reelGrid, setReelGrid] = useState<SlotSymbol[][]>([
    [SLOT_SYMBOLS[1], SLOT_SYMBOLS[1], SLOT_SYMBOLS[1]],
    [SLOT_SYMBOLS[1], SLOT_SYMBOLS[1], SLOT_SYMBOLS[1]],
    [SLOT_SYMBOLS[1], SLOT_SYMBOLS[1], SLOT_SYMBOLS[1]],
  ]);

  const [spinningCols, setSpinningCols] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [leverPulled, setLeverPulled] = useState(false);
  const [winningLines, setWinningLines] = useState<WinningLine[]>([]);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);
  const [splashWin, setSplashWin] = useState<number | null>(null);
  const [splashDetails, setSplashDetails] = useState<{
    subtitle?: string;
    winDetail?: string;
    badge?: string;
  }>({});
  const [isJackpotSplash, setIsJackpotSplash] = useState(false);
  const [jackpotPool, setJackpotPool] = useState(78540);
  const [autoSpin, setAutoSpin] = useState(false);
  const autoSpinRef = useRef(false);
  autoSpinRef.current = autoSpin;
  const [isTurbo, setIsTurbo] = useState(false);
  const [isAnticipation, setIsAnticipation] = useState(false);
  const [recoilCol, setRecoilCol] = useState<number | null>(null);

  // Audio & Dealer AI
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  const [playerName, setPlayerName] = useState('Player 1');
  const [dealerDialogue, setDealerDialogue] = useState<string>(
    'Welcome to the Megabucks progressive floor, darling! Pull the lever or hit Spin to chase the jackpot.'
  );
  const [isAiThinking, setIsAiThinking] = useState(false);
  const lastSpokenRef = useRef<string>('');

  // Voice synthesis
  const speakLine = (line: string) => {
    if (!voiceOn || typeof window === 'undefined' || !window.speechSynthesis) return;
    if (lastSpokenRef.current === line) return;
    lastSpokenRef.current = line;

    try {
      window.speechSynthesis.cancel();
      const clean = line.replace(/[\u{1F300}-\u{1F6FF}|[\u{2600}-\u{26FF}]/gu, '');
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 1.0;
      utter.pitch = 1.15;
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

  const askSarahAi = async (eventType: any, extra?: any) => {
    setIsAiThinking(true);
    const comment = await fetchDealerComment({
      game: 'Slots',
      playerName,
      eventType,
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
      askSarahAi('welcome', { playerName: name });
    }
  }, []);

  // Progressive Jackpot Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setJackpotPool((prev) => prev + Math.floor(Math.random() * 12) + 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const isAnySpinning = spinningCols[0] || spinningCols[1] || spinningCols[2];

  // Ref to keep handleSpin fresh for keyboard listeners
  const handleSpinRef = useRef<() => void>(() => {});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleSpinRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // MAIN SPIN FUNCTION
  const handleSpin = () => {
    if (isAnySpinning || totalBet > bankroll) {
      if (autoSpin) setAutoSpin(false);
      return;
    }

    // Pull lever animation
    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 350);
    triggerHaptic('deal');

    setSpinningCols([true, true, true]);
    setWinningLines([]);
    setOutcomeMessage(null);
    setSplashWin(null);
    setIsJackpotSplash(false);
    setIsAnticipation(false);

    // Initial deduction of total wager
    onUpdateBankroll(-totalBet);

    // Pre-generate target outcome matrix (3 cols x 3 rows)
    const targetMatrix: SlotSymbol[][] = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    ];

    // Check if anticipation should trigger on Reel 3
    const hasAnticipation =
      !isTurbo &&
      (targetMatrix[0][1].id === targetMatrix[1][1].id ||
        targetMatrix[0][0].id === targetMatrix[1][0].id ||
        targetMatrix[0][2].id === targetMatrix[1][2].id);

    const r1Stop = isTurbo ? 200 : 600;
    const r2Stop = isTurbo ? 350 : 1100;
    const r3Stop = isTurbo ? 500 : hasAnticipation ? 2400 : 1600;

    // Reel 1 Spin Loop
    const timer1 = setInterval(() => {
      playSlotTick();
      setReelGrid((prev) => [
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        prev[1],
        prev[2],
      ]);
    }, isTurbo ? 40 : 60);

    // Reel 2 Spin Loop
    const timer2 = setInterval(() => {
      setReelGrid((prev) => [
        prev[0],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        prev[2],
      ]);
    }, isTurbo ? 40 : 60);

    // Reel 3 Spin Loop
    const timer3 = setInterval(() => {
      setReelGrid((prev) => [
        prev[0],
        prev[1],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      ]);
    }, isTurbo ? 40 : 60);

    // 1. Reel 1 Stops
    setTimeout(() => {
      clearInterval(timer1);
      setReelGrid((prev) => [targetMatrix[0], prev[1], prev[2]]);
      setSpinningCols([false, true, true]);
      playSlotStop();
      triggerHaptic('tick');
      setRecoilCol(0);
      setTimeout(() => setRecoilCol(null), 120);
    }, r1Stop);

    // 2. Reel 2 Stops
    setTimeout(() => {
      clearInterval(timer2);
      setReelGrid((prev) => [targetMatrix[0], targetMatrix[1], prev[2]]);
      setSpinningCols([false, false, true]);
      playSlotStop();
      triggerHaptic('tick');
      setRecoilCol(1);
      setTimeout(() => setRecoilCol(null), 120);

      if (hasAnticipation) {
        setIsAnticipation(true);
        triggerHaptic('anticipation');
      }
    }, r2Stop);

    // 3. Reel 3 Stops & Evaluate Winnings
    setTimeout(() => {
      clearInterval(timer3);
      setIsAnticipation(false);
      setReelGrid(targetMatrix);
      setSpinningCols([false, false, false]);
      playSlotStop();
      triggerHaptic('tick');
      setRecoilCol(2);
      setTimeout(() => setRecoilCol(null), 120);

      // EVALUATE PAYLINES
      // Lines definitions:
      // Line 0: Middle Row [c0[1], c1[1], c2[1]]
      // Line 1: Top Row    [c0[0], c1[0], c2[0]]
      // Line 2: Bottom Row [c0[2], c1[2], c2[2]]
      // Line 3: Diagonal 1 [c0[0], c1[1], c2[2]]
      // Line 4: Diagonal 2 [c0[2], c1[1], c2[0]]
      const paylinesToCheck: { index: number; symbols: [SlotSymbol, SlotSymbol, SlotSymbol] }[] = [];

      // Center is always line 0
      paylinesToCheck.push({ index: 0, symbols: [targetMatrix[0][1], targetMatrix[1][1], targetMatrix[2][1]] });

      if (activeLines >= 3) {
        paylinesToCheck.push({ index: 1, symbols: [targetMatrix[0][0], targetMatrix[1][0], targetMatrix[2][0]] });
        paylinesToCheck.push({ index: 2, symbols: [targetMatrix[0][2], targetMatrix[1][2], targetMatrix[2][2]] });
      }

      if (activeLines >= 5) {
        paylinesToCheck.push({ index: 3, symbols: [targetMatrix[0][0], targetMatrix[1][1], targetMatrix[2][2]] });
        paylinesToCheck.push({ index: 4, symbols: [targetMatrix[0][2], targetMatrix[1][1], targetMatrix[2][0]] });
      }

      const wins: WinningLine[] = [];
      let grossPayout = 0;
      let hasJackpot = false;

      for (const line of paylinesToCheck) {
        const [s1, s2, s3] = line.symbols;

        // Triple Diamonds = Progressive Jackpot!
        if (s1.id === 'diamond' && s2.id === 'diamond' && s3.id === 'diamond') {
          hasJackpot = true;
          const jpWin = jackpotPool;
          grossPayout += jpWin;
          wins.push({
            lineIndex: line.index,
            symbol: s1,
            winAmount: jpWin,
            multiplier: 3000,
          });
        }
        // Triple Match (3 of any symbol)
        else if (s1.id === s2.id && s2.id === s3.id) {
          const mult = s1.payout3;
          const lineWin = betPerLine * mult;
          grossPayout += lineWin;
          wins.push({
            lineIndex: line.index,
            symbol: s1,
            winAmount: lineWin,
            multiplier: mult,
          });
        }
        // Wild Substitution: 2 matching + 1 Diamond
        else if (
          (s1.id === s2.id && s3.id === 'diamond') ||
          (s1.id === s3.id && s2.id === 'diamond') ||
          (s2.id === s3.id && s1.id === 'diamond')
        ) {
          const matched = s1.id !== 'diamond' ? s1 : s2.id !== 'diamond' ? s2 : s3;
          const mult = matched.payout3;
          const lineWin = betPerLine * mult;
          grossPayout += lineWin;
          wins.push({
            lineIndex: line.index,
            symbol: matched,
            winAmount: lineWin,
            multiplier: mult,
          });
        }
        // Two Cherries on Left (Reels 1 & 2 only, standard Vegas rule)
        else if (s1.id === 'cherry' && s2.id === 'cherry' && s3.id !== 'cherry') {
          const lineWin = betPerLine * 3;
          grossPayout += lineWin;
          wins.push({
            lineIndex: line.index,
            symbol: SLOT_SYMBOLS.find((s) => s.id === 'cherry')!,
            winAmount: lineWin,
            multiplier: 3,
          });
        }
        // Single Cherry on Left (Reel 1 only, standard Vegas rule)
        else if (s1.id === 'cherry' && s2.id !== 'cherry' && s3.id !== 'cherry') {
          const lineWin = betPerLine * 1;
          grossPayout += lineWin;
          wins.push({
            lineIndex: line.index,
            symbol: SLOT_SYMBOLS.find((s) => s.id === 'cherry')!,
            winAmount: lineWin,
            multiplier: 1,
          });
        }
      }

      setWinningLines(wins);

      const netDelta = grossPayout - totalBet;

      if (hasJackpot) {
        playJackpotSound();
        triggerHaptic('jackpot');
        setIsJackpotSplash(true);
        setSplashDetails({
          subtitle: '🚨 3x MEGA DIAMOND PROGRESSIVE JACKPOT! 🚨',
          winDetail: 'Diamonds aligned across center payline for maximum casino progressive payout!',
          badge: 'JACKPOT',
        });
        setSplashWin(grossPayout);
        setOutcomeMessage(`🚨 MEGA PROGRESSIVE JACKPOT! WON £${grossPayout.toLocaleString()}! 🚨`);
        onUpdateBankroll(grossPayout);
        setJackpotPool(50000);
        addGameHistory({
          gameId: 'slots',
          headline: 'MEGABUCKS JACKPOT HIT! 🚨',
          detail: `💎 💎 💎 Wild Diamonds on payline • Won £${grossPayout.toLocaleString()}!`,
          delta: grossPayout,
          badge: 'JACKPOT',
        });
        askSarahAi('big_win', { netDelta: grossPayout, wager: totalBet });
      } else if (grossPayout > 0) {
        playWinSound();
        triggerHaptic(grossPayout >= totalBet * 5 ? 'big_win' : 'win');
        const lineBreakdown = wins
          .map((w) => `Line ${w.lineIndex + 1}: 3x ${w.symbol.icon} ${w.symbol.name} (${w.multiplier}x)`)
          .join(' • ');

        setSplashDetails({
          subtitle: `${wins.length} Winning Payline(s) Matched`,
          winDetail: lineBreakdown,
          badge: `${wins.length} Lines Hit`,
        });
        setSplashWin(grossPayout);
        setOutcomeMessage(`Winner! ${wins.length} Payline(s) Hit • Won £${grossPayout.toLocaleString()}! 🎉`);
        onUpdateBankroll(grossPayout);
        addGameHistory({
          gameId: 'slots',
          headline: `Slot Win: £${grossPayout.toLocaleString()}`,
          detail: lineBreakdown,
          delta: grossPayout,
          badge: `${wins.length} Lines Hit`,
        });
        askSarahAi(netDelta >= 200 ? 'big_win' : 'spin_win', { netDelta, wager: totalBet });
      } else {
        triggerHaptic('bust');
        setOutcomeMessage('No winning lines. Pull again or try 5 lines!');
        addGameHistory({
          gameId: 'slots',
          headline: 'Slot Miss',
          detail: `Lost £${totalBet.toLocaleString()} on ${activeLines} lines`,
          delta: -totalBet,
          badge: 'Miss',
        });
        askSarahAi('spin_loss', { netDelta: -totalBet, wager: totalBet });
      }

      // Auto-spin next round if active
      if (autoSpinRef.current) {
        setTimeout(() => {
          if (autoSpinRef.current && bankroll >= totalBet) {
            handleSpin();
          } else {
            setAutoSpin(false);
          }
        }, isTurbo ? 650 : 1800);
      }
    }, r3Stop);
  };

  useEffect(() => {
    handleSpinRef.current = handleSpin;
  });

  return (
    <div
      style={{ touchAction: 'manipulation' }}
      className="h-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden select-none touch-manipulation relative rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-b from-[#1b1424] via-[#110c18] to-[#08050c] p-1.5 sm:p-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-2 sm:border-4 border-[#3c1d56] font-sans"
    >
      {/* Big Win Splash Banner */}
      <VegasWinSplash
        winAmount={splashWin}
        title={isJackpotSplash ? '🚨 PROGRESSIVE JACKPOT! 🚨' : 'SLOT MACHINE HIT!'}
        subtitle={splashDetails.subtitle}
        winDetail={splashDetails.winDetail}
        badge={splashDetails.badge}
        isJackpot={isJackpotSplash}
        onComplete={() => setSplashWin(null)}
      />

      {/* 1. TOP HUD STATUS BAR */}
      <div className="shrink-0 flex items-center justify-between gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-xl sm:rounded-2xl bg-black/70 border border-white/10 mb-1 sm:mb-2 text-white">
        {/* Left: Floor Return + Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
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

          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-fuchsia-600 to-purple-500 border border-white/40 flex items-center justify-center text-xs sm:text-sm shadow-md shrink-0">
            🎰
          </div>
          <div className="hidden xs:flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-purple-800 to-fuchsia-700 border border-purple-400/50 text-[10px] sm:text-xs font-black truncate">
            <span className="text-yellow-300">★ 1</span>
            <span className="text-white hidden sm:inline">{playerName}</span>
          </div>
        </div>

        {/* Center: Recessed Total Bet Display */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#12071f] border-2 border-[#7e22ce] rounded-xl px-2 sm:px-3 py-0.5 sm:py-1 shadow-inner">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-300">BET</span>
          <span className="font-mono font-black text-xs sm:text-base text-yellow-300">
            £{totalBet.toLocaleString()}
          </span>
          <span className="text-[8px] sm:text-[9px] text-zinc-400 font-mono hidden sm:inline">({activeLines} Lines)</span>
        </div>

        {/* Right: Bankroll, Slide-over Guide/Odds Trigger & Tools */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <div className="flex items-center gap-1 bg-[#12071f] border-2 border-[#7e22ce] rounded-xl px-2 sm:px-3 py-0.5 sm:py-1 shadow-inner">
            <span className="font-mono font-black text-xs sm:text-base text-white">
              £{bankroll.toLocaleString()}
            </span>
          </div>

          {/* Slide-over Guide & Odds Trigger */}
          <button
            type="button"
            onClick={() => setShowGuideOdds(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 hover:from-purple-500/30 border border-purple-400/50 text-purple-300 hover:text-white text-[10px] font-black uppercase tracking-wider transition shadow active:scale-95 shrink-0"
            title="Open Sarah's Hostess Chat & Slots Paytable Guide"
          >
            <Brain size={12} className="text-purple-400 shrink-0" />
            <span className="hidden xs:inline">GUIDE / ODDS</span>
            <span className="xs:hidden">ODDS</span>
          </button>

          <Link
            href="/academy?tab=leaderboard&discipline=slots"
            className="hidden sm:flex px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-fuchsia-600/30 hover:bg-purple-600/50 border border-purple-400/60 text-yellow-300 font-black text-[10px] sm:text-xs uppercase tracking-wider transition shadow items-center gap-1"
            title="View Slots & Fruit Machine League Standings"
          >
            <Trophy size={12} className="text-yellow-300" />
            <span>League</span>
          </Link>

          {onSwitchToPubFruity && (
            <button
              onClick={onSwitchToPubFruity}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-200 font-black text-xs uppercase tracking-wider transition shadow flex items-center gap-1.5"
              title="Switch to English Pub Fruit Machine"
            >
              <span>🍺 <span className="hidden sm:inline">Pub Fruity</span></span>
            </button>
          )}

          <button
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition shrink-0"
            title="Toggle Sound"
          >
            {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} className="text-zinc-400" />}
          </button>

          <button
            onClick={() => setVoiceOn(!voiceOn)}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition shrink-0 ${
              voiceOn ? 'bg-gold/25 border-gold text-gold shadow-[0_0_10px_#ffd700]' : 'bg-white/10 hover:bg-white/20 border-white/20 text-zinc-400'
            }`}
            title="Toggle Hostess Voice"
          >
            {voiceOn ? <Mic size={13} /> : <MicOff size={13} />}
          </button>

          <button
            onClick={onOpenTutorial}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-yellow-300 flex items-center justify-center transition shrink-0"
            title="Rules & Paytable"
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {/* 2. GLAMOROUS DEALER HOSTESS SARAH (Visible on desktop; collapsed into slide-over drawer on mobile) */}
      <div className="shrink-0 hidden md:flex relative mb-2 rounded-2xl bg-gradient-to-r from-[#20102b] via-[#14081c] to-[#1a0a24] border-2 border-gold/50 p-2.5 sm:p-3 shadow-[0_6px_20px_rgba(0,0,0,0.85)] flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-t-full rounded-b-xl border-2 border-gold/80 overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.7)] bg-black">
              <img
                src="/vegas/dealer_sarah.jpg"
                alt="Sarah Slot Hostess"
                className="w-full h-full object-cover object-top scale-115 -translate-y-0.5"
              />
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-fuchsia-600 text-white text-[7px] font-black uppercase tracking-wider border border-white/60 shadow flex items-center gap-0.5 whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
              <span>SLOT AI</span>
            </span>
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                <span>Sarah</span>
                <span className="text-[10px] font-normal text-zinc-400">• VIP Floor Hostess</span>
              </span>
              {isAiThinking && (
                <span className="text-[10px] font-mono text-cyan-400 animate-pulse flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>Thinking...</span>
                </span>
              )}
            </div>

            <div className="relative bg-black/75 border border-gold/40 px-3 py-1.5 rounded-xl text-xs sm:text-sm text-yellow-100 font-sans italic leading-snug shadow-inner">
              &quot;{dealerDialogue}&quot;
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={isAiThinking}
          onClick={() => askSarahAi('custom', { wager: totalBet })}
          className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-white/5 hover:bg-gold/20 text-zinc-300 hover:text-gold border border-white/10 hover:border-gold/40 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow"
        >
          <MessageSquare size={13} className="text-gold" />
          <span>Hostess Chat</span>
        </button>
      </div>

      {/* 3. PROGRESSIVE JACKPOT MARQUEE CROWN (Arching Gold & Neon Las Vegas Crown) */}
      <div className="relative mb-3 rounded-2xl bg-gradient-to-r from-amber-950 via-[#1a0802] to-purple-950 border-3 border-gold p-3.5 sm:p-5 text-center shadow-[0_0_40px_rgba(212,175,55,0.5),inset_0_2px_8px_rgba(255,255,255,0.4)] overflow-hidden">
        {/* Running Marquee Chaser Bulbs Top & Bottom */}
        <div className="flex items-center justify-between px-2 mb-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#ffd700] animate-pulse"
              style={{ animationDelay: `${(i * 0.1).toFixed(2)}s` }}
            />
          ))}
        </div>

        <div className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-yellow-300 flex items-center justify-center gap-2 drop-shadow-md">
          <Trophy size={16} className="text-gold" />
          <span>★ VEGAS MEGABUCKS PROGRESSIVE JACKPOT ★</span>
        </div>

        {/* Big Neon Digital Counter */}
        <div className="text-4xl sm:text-6xl font-mono font-black text-white tracking-tight drop-shadow-[0_4px_16px_rgba(212,175,55,0.9)] mt-1">
          £{jackpotPool.toLocaleString()}
        </div>

        <div className="text-[10px] sm:text-xs font-mono font-bold text-amber-200/90 mt-1">
          Hit 3x 💎 Mega Wild Diamonds on any payline to trigger the progressive jackpot!
        </div>
      </div>

      {/* 4. THE 3D MECHANICAL REEL CABINET WITH CONVEX GLASS & CHROME BEZEL */}
      <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center py-1 sm:py-2 overflow-hidden">
        {/* Main 3-Reel x 3-Row Convex Window Chassis */}
        <div className="w-full max-w-3xl bg-gradient-to-b from-[#251733] via-[#120a1c] to-[#08040d] p-2 sm:p-5 rounded-2xl sm:rounded-[2.2rem] border-2 sm:border-4 border-[#eab308] shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_3px_10px_rgba(255,255,255,0.3)] relative overflow-hidden">
          {/* Chrome Corner Brackets */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white/60 pointer-events-none" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/60 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white/60 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white/60 pointer-events-none" />

          {/* Payline Indicators (Left side flags) */}
          <div className="relative flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gold">
              Multi-Line Mechanical Action
            </span>
            <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-zinc-300">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Line 1: Center
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Lines 2-3: Top/Bot
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Lines 4-5: Diag
              </span>
            </div>
          </div>

          {/* 3D Convex Reel Glass Window */}
          <div className="relative bg-[#07050a] p-2.5 sm:p-4 rounded-2xl border-4 border-[#581c87] shadow-[inset_0_15px_40px_rgba(0,0,0,0.98),0_4px_15px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Cylindrical Shadow Drum Overlays (Creates genuine 3D barrel illusion) */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none z-30" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-30" />

            {/* Specular Glare Streak across glass */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-30" />

            {/* Center Payline Indicator Laser Beam */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-red-500 via-yellow-300 to-red-500 opacity-60 shadow-[0_0_15px_#ffd700] z-20 pointer-events-none" />

            {/* Laser Line Highlights for Winning Paylines */}
            {winningLines.map((win, idx) => (
              <div
                key={idx}
                className={`absolute inset-x-0 h-1.5 bg-gradient-to-r from-yellow-300 via-white to-yellow-300 shadow-[0_0_20px_#ffd700,0_0_35px_rgba(255,215,0,0.8)] z-40 animate-pulse pointer-events-none ${
                  win.lineIndex === 0
                    ? 'top-1/2 -translate-y-1/2'
                    : win.lineIndex === 1
                    ? 'top-[22%]'
                    : win.lineIndex === 2
                    ? 'bottom-[22%]'
                    : win.lineIndex === 3
                    ? 'top-1/2 -translate-y-1/2 rotate-12 origin-center'
                    : 'top-1/2 -translate-y-1/2 -rotate-12 origin-center'
                }`}
              />
            ))}

            {/* THE 3 REEL DRUMS (3 COLUMNS × 3 ROWS) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
              {[0, 1, 2].map((colIdx) => {
                const isSpinning = spinningCols[colIdx];
                const isReelAnticipating = colIdx === 2 && isAnticipation;
                const isRecoil = recoilCol === colIdx;

                return (
                  <div
                    key={colIdx}
                    className={`relative bg-gradient-to-b from-[#181124] via-[#221633] to-[#181124] rounded-xl border-2 shadow-[inset_0_2px_8px_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between py-2 sm:py-3 divide-y divide-white/5 transition-all duration-150 ${
                      isRecoil ? 'translate-y-2 scale-[0.98]' : 'translate-y-0 scale-100'
                    } ${
                      isReelAnticipating
                        ? 'border-yellow-400 shadow-[0_0_35px_#fde047] ring-2 ring-yellow-400 animate-pulse'
                        : 'border-zinc-700/80'
                    }`}
                  >
                    {isReelAnticipating && (
                      <div className="absolute top-1 inset-x-0 z-40 flex justify-center pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[8px] font-black tracking-widest uppercase shadow animate-bounce">
                          SUSPENSE!
                        </span>
                      </div>
                    )}
                    {/* Chrome Separator Bevel */}
                    <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-r from-transparent to-white/15 pointer-events-none" />

                    {/* 3 Visible Rows per Reel (0 = Top, 1 = Center, 2 = Bottom) */}
                    {[0, 1, 2].map((rowIdx) => {
                      const sym = reelGrid[colIdx][rowIdx];
                      const isCenter = rowIdx === 1;
                      const isWinCell = winningLines.some(
                        (w) =>
                          (w.lineIndex === 0 && rowIdx === 1) ||
                          (w.lineIndex === 1 && rowIdx === 0) ||
                          (w.lineIndex === 2 && rowIdx === 2) ||
                          (w.lineIndex === 3 && colIdx === rowIdx) ||
                          (w.lineIndex === 4 && colIdx === 2 - rowIdx)
                      );

                      return (
                        <div
                          key={rowIdx}
                          className={`h-16 sm:h-24 md:h-28 flex flex-col items-center justify-center relative transition-transform duration-150 ${
                            isSpinning ? 'blur-[1px] scale-95 opacity-80' : 'scale-100 opacity-100'
                          } ${
                            isWinCell && !isSpinning
                              ? 'bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 rounded-xl ring-2 ring-gold shadow-[0_0_20px_#ffd700]'
                              : isCenter
                              ? 'bg-white/[0.03]'
                              : 'opacity-70 scale-95'
                          }`}
                        >
                          {/* 3D Symbol Icon */}
                          <div
                            className={`text-2xl sm:text-4xl md:text-5xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] transition-transform ${
                              isWinCell && !isSpinning ? 'animate-bounce scale-110' : ''
                            }`}
                          >
                            {sym.icon}
                          </div>
                          {/* Symbol Name Badge */}
                          <span className="text-[8px] sm:text-[10px] font-mono font-black text-amber-200 uppercase tracking-tight mt-0.5 sm:mt-1 drop-shadow">
                            {sym.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outcome Message Ribbon */}
          {outcomeMessage && (
            <div className="mt-3 text-center py-2 px-4 rounded-xl bg-gradient-to-r from-purple-950 via-black to-purple-950 border-2 border-gold text-xs sm:text-sm font-black text-yellow-300 shadow-[0_0_20px_rgba(212,175,55,0.4)] animate-in zoom-in-95 duration-200">
              {outcomeMessage}
            </div>
          )}

          {/* Paytable Quick Reference Strip */}
          <div className="mt-3 grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center text-[9px] sm:text-[10px] font-mono font-black text-zinc-300 bg-black/80 p-2 rounded-xl border border-white/10 shadow-inner">
            <div className="hover:text-gold transition">💎 500x</div>
            <div className="hover:text-gold transition">7️⃣ 150x</div>
            <div className="hover:text-gold transition">🔔 60x</div>
            <div className="hover:text-gold transition">👑 40x</div>
            <div className="hover:text-gold transition">🍇 25x</div>
            <div className="hover:text-gold transition">🍉 15x</div>
            <div className="hover:text-gold transition">🍒 10x</div>
          </div>
        </div>

        {/* 3D Physical Chrome & Red Mechanical Pull Lever (Desktop / Tablet side-mounted) */}
        <div className="hidden md:flex md:flex-col items-center justify-center pl-2">
          <button
            disabled={isAnySpinning || totalBet > bankroll}
            onClick={handleSpin}
            onPointerDown={(e) => {
              if (e.button === 0 && !isAnySpinning && totalBet <= bankroll) {
                triggerHaptic(15);
                handleSpin();
              }
            }}
            className="group flex flex-col items-center cursor-pointer disabled:cursor-not-allowed select-none transition-transform active:scale-95 touch-manipulation"
            title="Pull 3D Slot Lever"
          >
            {/* Red Glossy Ball Knob */}
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-400 via-red-600 to-red-950 border-3 border-white shadow-[0_10px_25px_rgba(239,68,68,0.9),inset_0_3px_6px_rgba(255,255,255,0.8)] transition-all duration-300 ${
                leverPulled ? 'translate-y-24 scale-95 shadow-[0_2px_10px_rgba(239,68,68,0.5)]' : 'group-hover:scale-110'
              }`}
            />
            {/* Chrome Steel Shaft */}
            <div
              className={`w-4 bg-gradient-to-r from-zinc-500 via-zinc-100 to-zinc-600 border-x border-zinc-700 shadow-lg transition-all duration-300 ${
                leverPulled ? 'h-10' : 'h-32'
              }`}
            />
            {/* Beveled Brass Pivot */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-950 border-2 border-gold shadow-inner flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-black border border-gold/60" />
            </div>
            <span className="text-[10px] font-black uppercase text-gold tracking-widest mt-1">
              PULL
            </span>
          </button>
        </div>
      </div>

      {/* 5. TACTILE CASINO BUTTON DECK (CONSOLE) */}
      <div className="shrink-0 mt-auto rounded-xl sm:rounded-2xl p-1.5 sm:p-4 bg-gradient-to-b from-[#2a173d] via-[#1a0c28] to-[#0c0514] border-t-2 border-[#f59e0b]/80 shadow-[0_-8px_20px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,215,0,0.4)] flex flex-wrap items-center justify-between gap-1.5 sm:gap-4 z-20">
        {/* Left Side: Bet Per Line & Lines Selector */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Bet per line chips */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Bet / Line:</span>
            <VegasChipRack
              values={[5, 10, 25, 50, 100, 250]}
              selectedValue={betPerLine}
              onSelect={setBetPerLine}
              disabled={isAnySpinning}
            />
          </div>

          {/* Paylines Selector (1, 3, 5 Lines) */}
          <div className="flex items-center gap-1.5 bg-black/70 p-1.5 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-zinc-400 px-1">Lines:</span>
            {[1, 3, 5].map((l) => (
              <button
                key={l}
                disabled={isAnySpinning}
                onClick={() => setActiveLines(l)}
                onPointerDown={(e) => {
                  if (e.button === 0 && !isAnySpinning) {
                    triggerHaptic(15);
                    setActiveLines(l);
                  }
                }}
                className={`px-3 py-1 rounded-lg font-mono font-black text-xs transition touch-manipulation active:scale-95 ${
                  activeLines === l
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_10px_#c084fc]'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: TURBO, MAX BET, AUTO SPIN, & BIG JUICY GREEN SPIN BUTTON */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Turbo Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsTurbo((prev) => !prev);
              triggerHaptic(15);
            }}
            onPointerDown={(e) => {
              if (e.button === 0) {
                setIsTurbo((prev) => !prev);
                triggerHaptic(15);
              }
            }}
            className={`flex-1 sm:flex-initial px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border-2 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 text-center touch-manipulation active:scale-95 ${
              isTurbo
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-yellow-200 text-black shadow-[0_0_15px_#f59e0b]'
                : 'bg-white/10 border-white/20 text-zinc-300 hover:text-white'
            }`}
            title="Turbo Spin Mode (High speed mechanical reel spins)"
          >
            <Zap size={13} className={isTurbo ? 'fill-black' : ''} />
            <span>{isTurbo ? 'TURBO ON' : 'TURBO'}</span>
          </button>

          {/* Max Bet */}
          <button
            type="button"
            disabled={isAnySpinning}
            onClick={() => {
              setActiveLines(5);
              setBetPerLine(100);
            }}
            onPointerDown={(e) => {
              if (e.button === 0 && !isAnySpinning) {
                triggerHaptic(15);
                setActiveLines(5);
                setBetPerLine(100);
              }
            }}
            className="flex-1 sm:flex-initial px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-b from-[#00b0ff] via-[#0091ea] to-[#0077c2] border-2 border-[#80d8ff]/70 text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_10px_rgba(0,145,234,0.4)] active:scale-95 transition disabled:opacity-40 text-center touch-manipulation"
          >
            MAX BET
          </button>

          {/* Auto Spin */}
          <button
            type="button"
            disabled={isAnySpinning && !autoSpin}
            onClick={() => {
              const next = !autoSpin;
              setAutoSpin(next);
              if (next && !isAnySpinning) handleSpin();
            }}
            onPointerDown={(e) => {
              if (e.button === 0 && (!isAnySpinning || autoSpin)) {
                triggerHaptic(15);
                const next = !autoSpin;
                setAutoSpin(next);
                if (next && !isAnySpinning) handleSpin();
              }
            }}
            className={`flex-1 sm:flex-initial px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border-2 font-black text-xs uppercase tracking-wider transition text-center touch-manipulation active:scale-95 ${
              autoSpin
                ? 'bg-red-600 border-white text-white shadow-[0_0_15px_#ef4444] animate-pulse'
                : 'bg-white/10 border-white/20 text-zinc-300 hover:text-white'
            }`}
          >
            {autoSpin ? 'STOP' : 'AUTO'}
          </button>

          {/* Big Green Glowing 3D SPIN Button */}
          <button
            type="button"
            disabled={isAnySpinning || totalBet > bankroll}
            onClick={handleSpin}
            onPointerDown={(e) => {
              if (e.button === 0 && !isAnySpinning && totalBet <= bankroll) {
                triggerHaptic(15);
                handleSpin();
              }
            }}
            className="flex-[2] sm:flex-initial px-5 py-2.5 sm:px-8 sm:py-3.5 rounded-2xl bg-gradient-to-b from-[#00e676] via-[#00c853] to-[#00873a] border-2 border-[#b9f6ca] text-white font-black text-xs sm:text-base uppercase tracking-widest shadow-[0_6px_20px_rgba(0,200,83,0.6),inset_0_2px_4px_rgba(255,255,255,0.8)] hover:brightness-110 active:scale-95 transition disabled:opacity-40 flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation"
            title="Spin (Spacebar)"
          >
            <Sparkles size={16} />
            <span>{isAnySpinning ? 'SPINNING...' : `SPIN (£${totalBet})`}</span>
            <span className="hidden lg:inline text-[9px] opacity-75 font-mono ml-1 px-1.5 py-0.5 rounded bg-black/30 border border-white/20">
              SPACE
            </span>
          </button>
        </div>
      </div>

      {/* Slide-Over Guide & Odds Advisor Drawer */}
      <VegasGuideOddsDrawer
        isOpen={showGuideOdds}
        onClose={() => setShowGuideOdds(false)}
        gameTitle="Megabucks Slots"
        dealerDialogue={dealerDialogue}
        dealerStatus={isAnySpinning ? 'Reels Spinning' : 'Awaiting Spin'}
        onAskSarah={() => askSarahAi('custom', { wager: totalBet })}
        isAiThinking={isAiThinking}
        advisorTitle="Megabucks Slot Machine Paytable & RTP"
        recommendation={activeLines === 5 ? '5 LINES (MAX COVERAGE)' : 'MAX LINES RECOMMENDED'}
        recommendationHeadline="Theoretical Return to Player: 96.50%"
        recommendationExplanation="Playing all 5 paylines (3 horizontal rows + 2 diagonal lines) maximizes your hit frequency and qualifies for diagonal Progressive Jackpot triggers with 3 Mega Wild Diamonds."
        rulesSummary={[
          { label: 'Theoretical RTP', value: '96.50% Certified', highlight: true },
          { label: 'Progressive Jackpot', value: `£${jackpotPool.toLocaleString()} (3 Diamonds)`, highlight: true },
          { label: 'Triple 7s Payout', value: '50 to 1' },
          { label: 'Active Paylines', value: `${activeLines} Lines Selected` },
        ]}
      />
    </div>
  );
}
