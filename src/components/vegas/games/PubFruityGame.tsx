'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  HelpCircle,
  Coins,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Zap,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  Play,
  Square,
  Gift,
  Crown,
  Car,
  Footprints,
  Compass,
} from 'lucide-react';
import {
  playPubCoinDrop,
  playPubHoldBeep,
  playPubNudgeThud,
  playPubHiLoBeep,
  playPubFeatureFanfare,
  playSlotTick,
  playSlotStop,
  playWheelTick,
  playWinSound,
  playJackpotSound,
  isSoundEnabled,
  setSoundEnabled,
} from '@/lib/vegas/VegasAudio';
import { addGameHistory } from '@/lib/vegas/VegasHistory';
import { getActivePlayerName } from '@/lib/poker-trainer/tracker';
import { fetchDealerComment } from '@/lib/vegas/VegasAiService';
import VegasWinSplash from '../VegasWinSplash';

interface Props {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onOpenTutorial: () => void;
  onSwitchToVegas?: () => void;
}

export interface PubSymbol {
  id: string;
  name: string;
  icon?: string;
  avatarImg?: string;
  payout3: number; // 3 matching on winline
  weight: number;
  badgeColor: string;
  comicLabel: string;
  characterRole?: string;
}

// 8-BIT CHARACTER THEMED SYMBOLS WITH GENERIC CASINO/PUB HIGH ROLLER NICKNAMES
export const PUB_SYMBOLS: PubSymbol[] = [
  {
    id: 'jackpot_trophy',
    name: 'EPT Vegas Trophy',
    icon: '🏆',
    payout3: 100,
    weight: 2,
    badgeColor: 'bg-amber-500 text-black',
    comicLabel: '£100 JACKPOT',
  },
  {
    id: 'edward_boss',
    name: 'Edward',
    avatarImg: '/avatars/avatar_edward_wearing_1772222877224.png',
    characterRole: 'The Pit Boss',
    payout3: 70,
    weight: 4,
    badgeColor: 'bg-yellow-400 text-black',
    comicLabel: 'THE PIT BOSS',
  },
  {
    id: 'dave_blackburn',
    name: 'Dave Blackburn',
    avatarImg: '/avatars/avatar_dave_blackburn_1787685845732.png',
    characterRole: 'The Card Shark',
    payout3: 40,
    weight: 6,
    badgeColor: 'bg-purple-500 text-white',
    comicLabel: 'THE CARD SHARK',
  },
  {
    id: 'chris_daly',
    name: 'Chris Daly',
    avatarImg: '/avatars/avatar_chris_daly_1772222942062.png',
    characterRole: 'The Magician',
    payout3: 25,
    weight: 9,
    badgeColor: 'bg-emerald-500 text-white',
    comicLabel: 'THE MAGICIAN',
  },
  {
    id: 'georgina_luck',
    name: 'Georgina',
    avatarImg: '/avatars/avatar_georgina_wearing_1772223035422.png',
    characterRole: 'Lady Luck',
    payout3: 15,
    weight: 12,
    badgeColor: 'bg-rose-500 text-white',
    comicLabel: 'LADY LUCK',
  },
  {
    id: 'bell',
    name: 'Liberty Bell',
    icon: '🔔',
    payout3: 10,
    weight: 16,
    badgeColor: 'bg-yellow-300 text-black',
    comicLabel: 'BELL CHIME',
  },
  {
    id: 'melon',
    name: 'Strip Melon',
    icon: '🍉',
    payout3: 7,
    weight: 20,
    badgeColor: 'bg-green-500 text-white',
    comicLabel: 'JUICY HIT',
  },
  {
    id: 'grapes',
    name: 'Pub Grapes',
    icon: '🍇',
    payout3: 5,
    weight: 24,
    badgeColor: 'bg-indigo-500 text-white',
    comicLabel: 'ROYAL VINTAGE',
  },
  {
    id: 'lemon',
    name: 'Casino Lemon',
    icon: '🍋',
    payout3: 4,
    weight: 28,
    badgeColor: 'bg-amber-300 text-black',
    comicLabel: 'SOUR SHOT',
  },
  {
    id: 'cherry',
    name: 'Twin Cherries',
    icon: '🍒',
    payout3: 3,
    weight: 34,
    badgeColor: 'bg-red-500 text-white',
    comicLabel: 'PAIR & SHARE',
  },
];

// Physical Stepper Reel Tape (16 symbols per reel strip - Balanced Casino Weighting)
export const REEL_TAPE_0: PubSymbol[] = [
  PUB_SYMBOLS[0], // Jackpot Trophy
  PUB_SYMBOLS[9], // Cherry (Only 1 cherry on reel 0)
  PUB_SYMBOLS[8], // Lemon
  PUB_SYMBOLS[1], // Edward Boss
  PUB_SYMBOLS[7], // Grapes
  PUB_SYMBOLS[6], // Melon
  PUB_SYMBOLS[5], // Bell
  PUB_SYMBOLS[2], // Dave B
  PUB_SYMBOLS[5], // Bell
  PUB_SYMBOLS[8], // Lemon
  PUB_SYMBOLS[3], // Chris Daly
  PUB_SYMBOLS[7], // Grapes
  PUB_SYMBOLS[4], // Georgina
  PUB_SYMBOLS[7], // Grapes
  PUB_SYMBOLS[6], // Melon
  PUB_SYMBOLS[8], // Lemon
];

export const REEL_TAPE_1: PubSymbol[] = [
  PUB_SYMBOLS[1], // Edward Boss
  PUB_SYMBOLS[8], // Lemon
  PUB_SYMBOLS[9], // Cherry (Only 1 cherry on reel 1)
  PUB_SYMBOLS[2], // Dave B
  PUB_SYMBOLS[6], // Melon
  PUB_SYMBOLS[0], // Jackpot Trophy
  PUB_SYMBOLS[7], // Grapes
  PUB_SYMBOLS[5], // Bell
  PUB_SYMBOLS[6], // Melon
  PUB_SYMBOLS[3], // Chris Daly
  PUB_SYMBOLS[8], // Lemon
  PUB_SYMBOLS[4], // Georgina
  PUB_SYMBOLS[5], // Bell
  PUB_SYMBOLS[7], // Grapes
  PUB_SYMBOLS[6], // Melon
  PUB_SYMBOLS[5], // Bell
];

export const REEL_TAPE_2: PubSymbol[] = [
  PUB_SYMBOLS[2], // Dave B
  PUB_SYMBOLS[9], // Cherry (Only 1 cherry on reel 2)
  PUB_SYMBOLS[1], // Edward Boss
  PUB_SYMBOLS[7], // Grapes
  PUB_SYMBOLS[8], // Lemon
  PUB_SYMBOLS[3], // Chris Daly
  PUB_SYMBOLS[5], // Bell
  PUB_SYMBOLS[6], // Melon
  PUB_SYMBOLS[7], // Grapes
  PUB_SYMBOLS[0], // Jackpot Trophy
  PUB_SYMBOLS[4], // Georgina
  PUB_SYMBOLS[8], // Lemon
  PUB_SYMBOLS[8], // Lemon
  PUB_SYMBOLS[7], // Grapes
  PUB_SYMBOLS[6], // Melon
  PUB_SYMBOLS[5], // Bell
];

// Cash ladder rungs from £1 up to £100 Jackpot
const CASH_LADDER = [1, 2, 3, 5, 10, 15, 25, 40, 70, 100];

// 16 MONOPOLY-STYLE SQUARES ARRANGED IN A CLOCKWISE PERIMETER LOOP (5x5 GRID)
export interface MonopolySquare {
  id: number;
  title: string;
  subtext: string;
  priceTag: string;
  colorBar: string; // Monopoly property color banner
  icon?: string;
  avatarImg?: string;
  type: 'go' | 'cash' | 'nudge' | 'mystery' | 'skill' | 'roulette' | 'life' | 'jail' | 'parking' | 'hazard' | 'repeat' | 'jackpot';
  val: number;
  isCorner?: boolean;
  row: string;
  col: string;
}

export const MONOPOLY_SQUARES: MonopolySquare[] = [
  // TOP ROW (Left to Right)
  {
    id: 0,
    title: 'GO ➔',
    subtext: 'COLLECT £2',
    priceTag: '+£2',
    colorBar: 'bg-red-600',
    icon: '🚩',
    type: 'go',
    val: 2,
    isCorner: true,
    row: 'row-start-1',
    col: 'col-start-1',
  },
  {
    id: 1,
    title: 'STRIP LIMO',
    subtext: 'VIP NUDGE',
    priceTag: '+1 NUDGE',
    colorBar: 'bg-purple-700',
    icon: '🍾',
    type: 'nudge',
    val: 1,
    row: 'row-start-1',
    col: 'col-start-2',
  },
  {
    id: 2,
    title: 'FOUNTAINS',
    subtext: 'BELLAGIO',
    priceTag: '£2 CASH',
    colorBar: 'bg-sky-500',
    icon: '⛲',
    type: 'cash',
    val: 2,
    row: 'row-start-1',
    col: 'col-start-3',
  },
  {
    id: 3,
    title: 'MAGICIAN',
    subtext: 'CHRIS DALY',
    priceTag: 'MYSTERY ?',
    colorBar: 'bg-sky-600',
    avatarImg: '/avatars/avatar_chris_daly_1772222942062.png',
    type: 'mystery',
    val: 0,
    row: 'row-start-1',
    col: 'col-start-4',
  },
  {
    id: 4,
    title: 'SECURITY',
    subtext: 'IN JAIL / VISIT',
    priceTag: 'VISITING',
    colorBar: 'bg-amber-600',
    icon: '🚨',
    type: 'jail',
    val: 0,
    isCorner: true,
    row: 'row-start-1',
    col: 'col-start-5',
  },

  // RIGHT COLUMN (Top to Bottom)
  {
    id: 5,
    title: 'PENTHOUSE',
    subtext: 'SUITE CASH',
    priceTag: '£5 CASH',
    colorBar: 'bg-pink-600',
    icon: '🍸',
    type: 'cash',
    val: 5,
    row: 'row-start-2',
    col: 'col-start-5',
  },
  {
    id: 6,
    title: 'ROULETTE',
    subtext: 'SPIN A WIN',
    priceTag: 'SKILL WHEEL',
    colorBar: 'bg-pink-700',
    icon: '🎡',
    type: 'roulette',
    val: 0,
    row: 'row-start-3',
    col: 'col-start-5',
  },
  {
    id: 7,
    title: 'GOLD OASIS',
    subtext: 'EXTRA LIFE',
    priceTag: '+1 LIFE',
    colorBar: 'bg-orange-500',
    icon: '❤️',
    type: 'life',
    val: 1,
    row: 'row-start-4',
    col: 'col-start-5',
  },

  // BOTTOM ROW (Right to Left)
  {
    id: 8,
    title: 'PIT BOSS',
    subtext: 'FREE PARKING',
    priceTag: '£10 POT',
    colorBar: 'bg-red-700',
    avatarImg: '/avatars/avatar_edward_wearing_1772222877224.png',
    type: 'parking',
    val: 10,
    isCorner: true,
    row: 'row-start-5',
    col: 'col-start-5',
  },
  {
    id: 9,
    title: 'CABANA',
    subtext: 'ROOFTOP',
    priceTag: '£15 CASH',
    colorBar: 'bg-red-500',
    icon: '🏊',
    type: 'cash',
    val: 15,
    row: 'row-start-5',
    col: 'col-start-4',
  },
  {
    id: 10,
    title: 'CARD SHARK',
    subtext: 'DAVE B',
    priceTag: '£25 CASH',
    colorBar: 'bg-yellow-500',
    avatarImg: '/avatars/avatar_dave_blackburn_1787685845732.png',
    type: 'cash',
    val: 25,
    row: 'row-start-5',
    col: 'col-start-3',
  },
  {
    id: 11,
    title: 'VAULT POT',
    subtext: 'CHANCE',
    priceTag: '£40 CASH',
    colorBar: 'bg-yellow-600',
    icon: '🏨',
    type: 'cash',
    val: 40,
    row: 'row-start-5',
    col: 'col-start-2',
  },

  // LEFT COLUMN (Bottom to Top)
  {
    id: 12,
    title: 'GO TO JAIL',
    subtext: 'HAZARD PIT',
    priceTag: 'HAZARD ☠️',
    colorBar: 'bg-blue-900',
    icon: '☠️',
    type: 'hazard',
    val: 0,
    isCorner: true,
    row: 'row-start-5',
    col: 'col-start-1',
  },
  {
    id: 13,
    title: 'REPEAT',
    subtext: 'CHANCE',
    priceTag: 'FRENZY!',
    colorBar: 'bg-emerald-600',
    icon: '🔁',
    type: 'repeat',
    val: 0,
    row: 'row-start-4',
    col: 'col-start-1',
  },
  {
    id: 14,
    title: 'LADY LUCK',
    subtext: 'GEORGINA',
    priceTag: '£70 CASH',
    colorBar: 'bg-emerald-700',
    avatarImg: '/avatars/avatar_georgina_wearing_1772223035422.png',
    type: 'cash',
    val: 70,
    row: 'row-start-3',
    col: 'col-start-1',
  },
  {
    id: 15,
    title: 'BOARDWALK',
    subtext: 'SUPER JACKPOT',
    priceTag: '£100 TOP',
    colorBar: 'bg-blue-600',
    icon: '🏆',
    type: 'jackpot',
    val: 100,
    row: 'row-start-2',
    col: 'col-start-1',
  },
];

export type MachineMode = 'TIGHT' | 'NEUTRAL' | 'GIVING';

export default function PubFruityGame({
  bankroll,
  onUpdateBankroll,
  onOpenTutorial,
  onSwitchToVegas,
}: Props) {
  // Stake per spin: £0.25, £0.50, £1.00, £2.00
  const [stake, setStake] = useState<number>(1);
  const [soundOn, setSoundOn] = useState<boolean>(true);

  // ==============================================================
  // 1. MPU4 COMPENSATED LEDGER STATE (Target RTP: 74% - Authentic UK Category C)
  // ==============================================================
  const [totalIn, setTotalIn] = useState<number>(30);
  const [totalOut, setTotalOut] = useState<number>(28);
  const targetRTP = 0.74;
  const currentBank = totalIn * targetRTP - totalOut;

  const machineMode: MachineMode =
    currentBank < -2 ? 'TIGHT' : currentBank > 6 ? 'GIVING' : 'NEUTRAL';

  // Physical Stepper Reel Tape Indices (0 to 15)
  const [tapeIndices, setTapeIndices] = useState<number[]>([1, 4, 7]);
  const [reelNumbers, setReelNumbers] = useState<number[]>([1, 0, 1]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);
  const [recoilReelIndex, setRecoilReelIndex] = useState<number | null>(null);

  // Holds Mechanics
  const [holdsAvailable, setHoldsAvailable] = useState<boolean>(false);
  const [heldReels, setHeldReels] = useState<boolean[]>([false, false, false]);
  const [holdAfterNudge, setHoldAfterNudge] = useState<boolean>(false); // HAN Exploit

  // Nudges Mechanics
  const [nudgesRemaining, setNudgesRemaining] = useState<number>(0);

  // Number Trail (1 to 8): 4 = Bonus, 8 = Top Glass Feature Board
  const [trailStep, setTrailStep] = useState<number>(2);
  const [trailHeld, setTrailHeld] = useState<boolean>(false);

  // Pathway C: Exchange to Feature (Win on winline pending choice)
  const [exchangePending, setExchangePending] = useState<{
    amount: number;
    description: string;
    symName: string;
  } | null>(null);

  // ==============================================================
  // TOP GLASS MONOPOLY BOARD STATE
  // ==============================================================
  const [inFeatureBoard, setInFeatureBoard] = useState<boolean>(false);
  const [boardPosition, setBoardPosition] = useState<number>(0);
  const [isWalkingBoard, setIsWalkingBoard] = useState<boolean>(false);
  const [cashLadderStep, setCashLadderStep] = useState<number>(-1);

  // Hi-Lo Dice Display & Suspense Roll (Ties lose unless Equal Wins earned)
  const [hiLoCurrent, setHiLoCurrent] = useState<number>(7);
  const [isRollingHiLo, setIsRollingHiLo] = useState<boolean>(false);
  const [equalWinsLit, setEqualWinsLit] = useState<boolean>(false);
  const [extraLives, setExtraLives] = useState<number>(0);
  const [potCash, setPotCash] = useState<number>(0);

  // Mini-Game 1: Harder Skill Cash Stopper (Dynamic Acceleration)
  const [skillStopperActive, setSkillStopperActive] = useState<boolean>(false);
  const [stopperHighlightRung, setStopperHighlightRung] = useState<number>(0);
  const stopperTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mini-Game 2: Faster Reflex Reel Roulette
  const [reelRouletteActive, setReelRouletteActive] = useState<boolean>(false);
  const [rouletteIndex, setRouletteIndex] = useState<number>(0);
  const rouletteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mini-Game 3: Rapid Jackpot Repeater Chance (YES / NO)
  const [repeaterActive, setRepeaterActive] = useState<boolean>(false);
  const [repeaterYesLit, setRepeaterYesLit] = useState<boolean>(false);
  const [pendingJackpotWin, setPendingJackpotWin] = useState<number>(0);
  const repeaterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Win splash popup & messages
  const [winAmount, setWinAmount] = useState<number>(0);
  const [winTitle, setWinTitle] = useState<string>('');
  const [tickerMessage, setTickerMessage] = useState<string>(
    'MONOPOLY VEGAS STRIP • ROLL AROUND THE PARK • HIT 8 ON TRAIL OR EXCHANGE TO ENTER'
  );
  const [aiHostessComment, setAiHostessComment] = useState<string>(
    'Right then, mate! The high rollers are on the Monopoly board! Roll around the park and aim for Boardwalk!'
  );
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Helper to get visible 3 symbols for a reel tape at position
  const getReelSymbols = (reelIdx: number, centerIdx: number): PubSymbol[] => {
    const tape = reelIdx === 0 ? REEL_TAPE_0 : reelIdx === 1 ? REEL_TAPE_1 : REEL_TAPE_2;
    const len = tape.length;
    const topIdx = (centerIdx - 1 + len) % len;
    const botIdx = (centerIdx + 1) % len;
    return [tape[topIdx], tape[centerIdx], tape[botIdx]];
  };

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  // Periodic Hold Beep when holds are active
  useEffect(() => {
    if (holdsAvailable && soundOn && !isSpinning && !inFeatureBoard) {
      const interval = setInterval(() => {
        playPubHoldBeep();
      }, 1400);
      return () => clearInterval(interval);
    }
  }, [holdsAvailable, soundOn, isSpinning, inFeatureBoard]);

  // AI Dealer commentary
  const triggerAiComment = async (event: string, detail: string) => {
    setIsAiThinking(true);
    try {
      const comment = await fetchDealerComment({
        game: 'The Red Lion English Pub Fruity - Monopoly Vegas High Rollers',
        playerName: getActivePlayerName() || undefined,
        eventType: event === 'big_win' ? 'big_win' : 'custom',
        result: detail,
      });
      if (comment) {
        setAiHostessComment(comment);
      }
    } catch {
      // fallback
    } finally {
      setIsAiThinking(false);
    }
  };

  // Helper: Trigger mechanical recoil kick
  const triggerRecoil = (rIdx: number) => {
    setRecoilReelIndex(rIdx);
    playPubNudgeThud();
    setTimeout(() => {
      setRecoilReelIndex(null);
    }, 90);
  };

  // ==============================================================
  // 1. SPIN THE MECHANICAL STEPPER REELS (Slowed & Deliberate)
  // ==============================================================
  const handleSpin = () => {
    if (
      isSpinning ||
      bankroll < stake ||
      inFeatureBoard ||
      exchangePending ||
      skillStopperActive ||
      reelRouletteActive ||
      repeaterActive
    )
      return;

    // Deduct stake and update ledger
    onUpdateBankroll(-stake);
    setTotalIn((prev) => prev + stake);
    playPubCoinDrop();

    setIsSpinning(true);
    setNudgesRemaining(0);

    const spin0 = !heldReels[0];
    const spin1 = !heldReels[1];
    const spin2 = !heldReels[2];
    setSpinningReels([spin0, spin1, spin2]);

    setTickerMessage('STEPPER MOTORS RUNNING... REEL TAPE ENGAGED!');

    // Reset holds
    const wasHAN = holdAfterNudge && heldReels[0] && heldReels[1] && heldReels[2];
    setHoldsAvailable(false);
    setHeldReels([false, false, false]);
    setHoldAfterNudge(false);

    // If trail was not held, reset trail unless compensated mode keeps it
    let currentTrail = trailHeld ? trailStep : 0;
    setTrailHeld(false);

    // If Hold After Nudge was executed, reward identical payout directly!
    if (wasHAN) {
      setTimeout(() => {
        setIsSpinning(false);
        setSpinningReels([false, false, false]);
        const centerSym = getReelSymbols(0, tapeIndices[0])[1];
        const hanPayout = centerSym.payout3 * stake;
        playWinSound();
        setWinTitle('🔥 HOLD AFTER NUDGE (HAN) EXPLOIT! 🔥');
        setWinAmount(hanPayout);
        onUpdateBankroll(hanPayout);
        setTotalOut((prev) => prev + hanPayout);
        setTickerMessage(`HAN EXPLOIT CASHED! +£${hanPayout} IDENTICAL WIN REPEATED!`);
        addGameHistory({
          gameId: 'pub-fruity',
          headline: 'Hold After Nudge (HAN) Exploited',
          detail: `Repeated 3x ${centerSym.name} for £${hanPayout}`,
          delta: hanPayout,
          badge: '⚡ HAN EXPLOIT',
        });
      }, 750);
      return;
    }

    // Deliberate mechanical stepping interval (85ms per step)
    const stepInterval = setInterval(() => {
      playSlotTick();
      setTapeIndices((prev) => [
        spin0 ? (prev[0] + 1) % REEL_TAPE_0.length : prev[0],
        spin1 ? (prev[1] + 1) % REEL_TAPE_1.length : prev[1],
        spin2 ? (prev[2] + 1) % REEL_TAPE_2.length : prev[2],
      ]);
    }, 85);

    // Stop Reel 0 with mechanical thud (750ms)
    setTimeout(() => {
      if (spin0) {
        playSlotStop();
        triggerRecoil(0);
      }
      setSpinningReels((prev) => [false, prev[1], prev[2]]);
    }, 750);

    // Stop Reel 1 (1250ms)
    setTimeout(() => {
      if (spin1) {
        playSlotStop();
        triggerRecoil(1);
      }
      setSpinningReels((prev) => [false, false, prev[2]]);
    }, 1250);

    // Stop Reel 2 (1750ms)
    setTimeout(() => {
      clearInterval(stepInterval);
      if (spin2) {
        playSlotStop();
        triggerRecoil(2);
      }
      setSpinningReels([false, false, false]);
      setIsSpinning(false);

      // Final landing positions governed by MPU4 compensated ledger
      let target0 = spin0 ? Math.floor(Math.random() * REEL_TAPE_0.length) : tapeIndices[0];
      let target1 = spin1 ? Math.floor(Math.random() * REEL_TAPE_1.length) : tapeIndices[1];
      let target2 = spin2 ? Math.floor(Math.random() * REEL_TAPE_2.length) : tapeIndices[2];

      let num0 = spin0 ? (Math.random() < 0.68 ? 0 : Math.random() < 0.92 ? 1 : 2) : reelNumbers[0];
      let num1 = spin1 ? (Math.random() < 0.68 ? 0 : Math.random() < 0.92 ? 1 : 2) : reelNumbers[1];
      let num2 = spin2 ? (Math.random() < 0.68 ? 0 : Math.random() < 0.92 ? 1 : 2) : reelNumbers[2];

      // In TIGHT mode, prevent numbers from forcing trail to 8
      if (machineMode === 'TIGHT' && currentTrail + num0 + num1 + num2 >= 7) {
        num0 = 0;
        num1 = 0;
        num2 = 0;
      } else if (machineMode === 'GIVING' && Math.random() < 0.35) {
        num0 = Math.max(num0, 1);
        num1 = Math.max(num1, 1);
      }

      setTapeIndices([target0, target1, target2]);
      setReelNumbers([num0, num1, num2]);

      const c0 = getReelSymbols(0, target0)[1];
      const c1 = getReelSymbols(1, target1)[1];
      const c2 = getReelSymbols(2, target2)[1];

      // Pathway B: 3 Trophies or 3 Edward Bosses
      if (c0.id === 'jackpot_trophy' && c1.id === 'jackpot_trophy' && c2.id === 'jackpot_trophy') {
        playPubFeatureFanfare();
        playJackpotSound();
        const jackpotWin = 100 * stake;
        setWinAmount(jackpotWin);
        setWinTitle('🏆 £100 TROPHY DIRECT JACKPOT! 🏆');
        onUpdateBankroll(jackpotWin);
        setTotalOut((prev) => prev + jackpotWin);
        triggerRepeaterChance(jackpotWin);
        return;
      }

      if (c0.id === 'edward_boss' && c1.id === 'edward_boss' && c2.id === 'edward_boss') {
        playPubFeatureFanfare();
        setInFeatureBoard(true);
        setBoardPosition(8); // Land directly on Edward's Pit Boss corner
        setPotCash(20 * stake);
        setExtraLives(1);
        setTickerMessage('★ DIRECT LINE-UP ENTRY! THE PIT BOSS UNLOCKED THE MONOPOLY BOARD! ★');
        triggerAiComment('feature_board', 'Edward Wearing landed 3-in-a-row! Direct Top Glass Entry!');
        return;
      }

      // Standard winline check
      let winPayout = 0;
      let winDesc = '';

      if (c0.id === c1.id && c1.id === c2.id) {
        winPayout = c0.payout3 * stake;
        winDesc = `THREE ${c0.name.toUpperCase()}S!`;
      } else if (c0.id === 'cherry' && c1.id === 'cherry') {
        winPayout = 2 * stake;
        winDesc = 'TWO CHERRIES!';
      } else if (c0.id === 'cherry') {
        winPayout = 1 * stake;
        winDesc = 'ONE CHERRY!';
      }

      // Pathway C: Exchange to Feature on basic fruit win
      if (winPayout > 0) {
        playWinSound();
        setExchangePending({
          amount: winPayout,
          description: winDesc,
          symName: c0.name,
        });
        setTickerMessage(
          `★ WIN £${winPayout}! PRESS [EXCHANGE] TO HI-LO INTO MONOPOLY BOARD OR [COLLECT] CASH! ★`
        );
        return;
      }

      // Pathway A: Numbered Reel Trail (1 to 8)
      const sumNums = num0 + num1 + num2;
      let newTrail = currentTrail + sumNums;

      if (sumNums > 0) {
        playPubHiLoBeep(true);
        setTickerMessage(`+${sumNums} NUMBERS ADDED! TRAIL ADVANCED TO STEP ${newTrail}/8`);
      } else {
        setTickerMessage('NO NUMBERS ON WINLINE. CHECK FOR HOLDS OR NUDGES!');
      }

      if (newTrail >= 8) {
        // Direct Feature Board entry!
        playPubFeatureFanfare();
        setInFeatureBoard(true);
        setBoardPosition(0); // Start at GO!
        setExtraLives(0); // 0 starting lives - requires cautious play
        setEqualWinsLit(false); // Ties lose on Hi-Lo by default
        setPotCash(2 * stake);
        setTrailStep(0);
        setTickerMessage('🎯 TOP GLASS ACTIVATED! WELCOME TO THE MONOPOLY VEGAS BOARD!');
        triggerAiComment('feature_board', 'Player completed the number trail and unlocked the Monopoly board!');
      } else {
        if (newTrail >= 4 && currentTrail < 4) {
          playPubFeatureFanfare();
          handleReelBonus();
        }
        setTrailStep(newTrail);

        // Trail Held Mechanic (only if in Giving or high trail)
        if (newTrail >= 6 && (machineMode === 'GIVING' || Math.random() < 0.25)) {
          setTrailHeld(true);
          playPubHoldBeep();
          setTickerMessage(`★ TRAIL HELD AT STEP ${newTrail}! NEXT SPIN ADDS ON! ★`);
        }

        // Random Holds or Nudges award (tightened to realistic pub machine hit frequencies)
        const rand = Math.random();
        if (rand < (machineMode === 'GIVING' ? 0.20 : machineMode === 'TIGHT' ? 0.05 : 0.12)) {
          setHoldsAvailable(true);
          playPubHoldBeep();
          setTickerMessage('★ HOLD LIGHTS ACTIVE! LOCK IN PAIRS OR HIGH NUMBERS! ★');
        } else if (rand < (machineMode === 'GIVING' ? 0.35 : machineMode === 'TIGHT' ? 0.10 : 0.18)) {
          const count = machineMode === 'GIVING' ? Math.floor(Math.random() * 2) + 2 : 1;
          setNudgesRemaining(count);
          playPubFeatureFanfare();
          setTickerMessage(`★ ${count} STEPPER NUDGE${count > 1 ? 'S' : ''} AWARDED! STEP A REEL DOWN! ★`);
        }
      }
    }, 1800);
  };

  // Bonus at Trail Step 4
  const handleReelBonus = () => {
    const bonuses = [
      'CHRIS DALY TURBAN BOOST (+2 STEPS)',
      'DAVE B RE-SPIN CHANCE',
      'EDWARD SKILL STOPPER',
      'ADD AGAIN (DOUBLE NUMBERS)',
    ];
    const chosen = bonuses[Math.floor(Math.random() * bonuses.length)];
    setTickerMessage(`⚡ REEL BONUS: ${chosen}!`);

    if (chosen.includes('+2')) {
      setTrailStep((prev) => Math.min(prev + 2, 8));
    } else if (chosen.includes('ADD AGAIN')) {
      const extra = reelNumbers[0] + reelNumbers[1] + reelNumbers[2];
      setTrailStep((prev) => Math.min(prev + extra, 8));
    } else if (chosen.includes('SKILL STOPPER')) {
      launchSkillStopper();
    }
  };

  // Exchange or Collect cash
  const handleExchangeCollectCash = () => {
    if (!exchangePending) return;
    const { amount, description } = exchangePending;
    onUpdateBankroll(amount);
    setTotalOut((prev) => prev + amount);
    setWinAmount(amount);
    setWinTitle('🍻 WINLINE CASH COLLECTED! 🍻');
    setTickerMessage(`COLLECTED £${amount} (${description})! READY TO SPIN!`);
    addGameHistory({
      gameId: 'pub-fruity',
      headline: 'Winline Win Collected',
      detail: `${description} for £${amount}`,
      delta: amount,
      badge: '💰 WINLINE',
    });
    setExchangePending(null);
  };

  const handleExchangeToFeature = () => {
    if (!exchangePending) return;
    setTickerMessage('EXCHANGE ENGAGED! WELCOME TO THE MONOPOLY BOARD!');
    setHiLoCurrent(7);
    setInFeatureBoard(true);
    setBoardPosition(0);
    setPotCash(exchangePending.amount * 2);
    setExtraLives(1);
    setExchangePending(null);
    playPubFeatureFanfare();
    triggerAiComment('exchange', 'Player exchanged a cash win to gamble for the Monopoly board!');
  };

  // Reel Holds
  const toggleHold = (reelIndex: number) => {
    if (!holdsAvailable || isSpinning) return;
    playPubHoldBeep();
    setHeldReels((prev) => {
      const next = [...prev];
      next[reelIndex] = !next[reelIndex];
      return next;
    });
  };

  const handleCancel = () => {
    playPubNudgeThud();
    if (holdsAvailable) {
      setHeldReels([false, false, false]);
      setHoldsAvailable(false);
      setTickerMessage('HOLDS CANCELLED.');
    }
  };

  // Nudges & Auto Nudge
  const handleNudge = (reelIndex: number) => {
    if (nudgesRemaining <= 0 || isSpinning) return;
    playPubNudgeThud();
    triggerRecoil(reelIndex);
    setNudgesRemaining((prev) => prev - 1);

    setTapeIndices((prev) => {
      const next = [...prev];
      const maxLen = reelIndex === 0 ? REEL_TAPE_0.length : reelIndex === 1 ? REEL_TAPE_1.length : REEL_TAPE_2.length;
      next[reelIndex] = (next[reelIndex] + 1) % maxLen;
      return next;
    });

    setTimeout(() => {
      checkWinlineWinAfterNudge();
    }, 150);
  };

  const handleAutoNudge = () => {
    if (nudgesRemaining <= 0 || isSpinning) return;
    setTickerMessage('AUTO-NUDGING TO HIGHEST VALUE COMBINATION...');

    let steps0 = 0;
    let steps1 = 0;
    let steps2 = 0;
    let bestPayout = 0;

    for (let i = 0; i <= nudgesRemaining; i++) {
      for (let j = 0; j <= nudgesRemaining - i; j++) {
        const k = nudgesRemaining - i - j;
        const sym0 = getReelSymbols(0, (tapeIndices[0] + i) % REEL_TAPE_0.length)[1];
        const sym1 = getReelSymbols(1, (tapeIndices[1] + j) % REEL_TAPE_1.length)[1];
        const sym2 = getReelSymbols(2, (tapeIndices[2] + k) % REEL_TAPE_2.length)[1];

        let p = 0;
        if (sym0.id === sym1.id && sym1.id === sym2.id) p = sym0.payout3;
        else if (sym0.id === 'cherry' && sym1.id === 'cherry') p = 2;
        else if (sym0.id === 'cherry') p = 1;

        if (p > bestPayout) {
          bestPayout = p;
          steps0 = i;
          steps1 = j;
          steps2 = k;
        }
      }
    }

    if (bestPayout > 0) {
      let curr0 = 0;
      let curr1 = 0;
      let curr2 = 0;
      const interval = setInterval(() => {
        if (curr0 < steps0) {
          curr0++;
          handleNudge(0);
        } else if (curr1 < steps1) {
          curr1++;
          handleNudge(1);
        } else if (curr2 < steps2) {
          curr2++;
          handleNudge(2);
        } else {
          clearInterval(interval);
        }
      }, 250);
    } else {
      handleNudge(0);
    }
  };

  const checkWinlineWinAfterNudge = () => {
    const c0 = getReelSymbols(0, tapeIndices[0])[1];
    const c1 = getReelSymbols(1, tapeIndices[1])[1];
    const c2 = getReelSymbols(2, tapeIndices[2])[1];

    if (c0.id === c1.id && c1.id === c2.id) {
      const payout = c0.payout3 * stake;
      playWinSound();
      setWinTitle('🍻 NUDGED TO PERFECTION! 🍻');
      setWinAmount(payout);
      onUpdateBankroll(payout);
      setTotalOut((prev) => prev + payout);
      setNudgesRemaining(0);
      setTickerMessage(`WINNER! NUDGED ${c0.name}! +£${payout}`);

      setHoldAfterNudge(true);
      setHoldsAvailable(true);
      setHeldReels([true, true, true]);
      playPubHoldBeep();
      setTickerMessage('★ HOLD AFTER NUDGE (HAN) ACTIVATED! HOLD ALL 3 REELS TO REPEAT! ★');
    }
  };

  // ==============================================================
  // 5. TOP GLASS MONOPOLY BOARD: SLOWED TOKEN WALK & HI-LO REVEAL
  // ==============================================================
  const handleHiLoGuess = (guess: 'hi' | 'lo') => {
    if (
      !inFeatureBoard ||
      isWalkingBoard ||
      isRollingHiLo ||
      skillStopperActive ||
      reelRouletteActive ||
      repeaterActive
    )
      return;

    setIsRollingHiLo(true);
    setTickerMessage('DICE ROLLING... SUSPENSE IN THE AIR!');

    // Suspense roll animation (cycling 3-4 numbers before settling)
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      playSlotTick();
      setHiLoCurrent(Math.floor(Math.random() * 12) + 1);
      rollCount++;
      if (rollCount >= 5) {
        clearInterval(rollInterval);
        setIsRollingHiLo(false);

        // Final target roll
        let nextRoll = Math.floor(Math.random() * 12) + 1;
        const prevRoll = hiLoCurrent;

        // In TIGHT mode, trap on 7 or make player miss
        if (machineMode === 'TIGHT' && Math.random() < 0.45) {
          if (prevRoll <= 4) nextRoll = 1;
          else if (prevRoll >= 9) nextRoll = 12;
          else nextRoll = 7;
        }

        setHiLoCurrent(nextRoll);

        let isWin = false;
        if (nextRoll === prevRoll) {
          if (equalWinsLit) {
            playPubHiLoBeep(true);
            setTickerMessage(`EQUAL NUMBER (${nextRoll})! EQUAL WINS ACTIVE — SAFE PUSH!`);
            return;
          } else {
            isWin = false;
          }
        } else if (guess === 'hi' && nextRoll > prevRoll) {
          isWin = true;
        } else if (guess === 'lo' && nextRoll < prevRoll) {
          isWin = true;
        }

        if (isWin) {
          playPubHiLoBeep(true);
          const steps = Math.floor(Math.random() * 3) + 1;
          animateTokenWalk(steps, nextRoll);
        } else {
          playPubHiLoBeep(false);
          if (extraLives > 0) {
            setExtraLives((prev) => prev - 1);
            setTickerMessage(`WRONG GUESS (${nextRoll})! EXTRA LIFE SAVED YOUR MONOPOLY RUN! ❤️`);
          } else {
            const finalAward = Math.max(potCash, 1 * stake);
            onUpdateBankroll(finalAward);
            setTotalOut((prev) => prev + finalAward);
            playWinSound();
            setWinTitle('BAR CLOSED! COLLECTING BOARD POT');
            setWinAmount(finalAward);
            setInFeatureBoard(false);
            setCashLadderStep(-1);
            setTickerMessage(`FEATURE OVER! BANKED £${finalAward} FROM THE TOP GLASS!`);
            triggerAiComment('feature_lost', `Player stepped off Hi-Lo but banked £${finalAward}!`);
          }
        }
      }
    }, 75);
  };

  // Animate the token walking square-by-square around the perimeter (Slowed down & deliberate)
  const animateTokenWalk = (totalSteps: number, rollNum: number) => {
    setIsWalkingBoard(true);
    let step = 0;
    let currPos = boardPosition;

    const walkInterval = setInterval(() => {
      step++;
      const prev = currPos;
      currPos = (currPos + 1) % MONOPOLY_SQUARES.length;
      setBoardPosition(currPos);
      playWheelTick();

      // Passing GO reward (£2 pocket money!)
      if (prev === 15 && currPos === 0) {
        const goBonus = 2 * stake;
        setPotCash((p) => p + goBonus);
        playWinSound();
        setTickerMessage(`★ PASSED GO! COLLECTED £${goBonus} POCKET MONEY! ★`);
      }

      if (step >= totalSteps) {
        clearInterval(walkInterval);
        setIsWalkingBoard(false);
        playPubNudgeThud();
        evaluateSquareLanding(currPos, rollNum);
      }
    }, 220); // 220ms per square for a clear, suspenseful Monopoly walk
  };

  // Evaluate the square landed on
  const evaluateSquareLanding = (pos: number, rollNum: number) => {
    const sq = MONOPOLY_SQUARES[pos];
    setCashLadderStep((prev) => Math.min(prev + 1, CASH_LADDER.length - 1));
    setTickerMessage(`LANDED ON [${sq.title}] (${sq.subtext})!`);

    if (sq.type === 'cash' || sq.type === 'go' || sq.type === 'parking') {
      const added = sq.val * stake;
      setPotCash((prev) => prev + added);
      playWinSound();
    } else if (sq.type === 'nudge') {
      setNudgesRemaining((prev) => prev + sq.val);
      playPubFeatureFanfare();
    } else if (sq.type === 'life') {
      setExtraLives((prev) => prev + 1);
      playPubFeatureFanfare();
    } else if (sq.type === 'skill') {
      launchSkillStopper();
    } else if (sq.type === 'roulette') {
      launchReelRoulette();
    } else if (sq.type === 'mystery') {
      handleMysterySquare();
    } else if (sq.type === 'hazard') {
      handleHazardSquare();
    } else if (sq.type === 'repeat') {
      triggerRepeaterChance(25 * stake);
    } else if (sq.type === 'jackpot') {
      const jWin = 100 * stake;
      setPotCash((prev) => prev + jWin);
      playJackpotSound();
      setTickerMessage('💥 £100 BOARDWALK JACKPOT HIT! 💥');
      triggerRepeaterChance(jWin);
    }
  };

  // Hazards & Mystery
  const handleHazardSquare = () => {
    if (extraLives > 0) {
      setExtraLives((prev) => prev - 1);
      setTickerMessage('GO TO JAIL TRAP! EXTRA LIFE SAVED YOU FROM ARREST! ❤️');
    } else {
      const consolation = 1 * stake;
      onUpdateBankroll(consolation);
      setTotalOut((prev) => prev + consolation);
      setInFeatureBoard(false);
      setCashLadderStep(-1);
      setTickerMessage('☠️ SENT TO JAIL! COLLECTED £1 CONSOLATION PRIZE.');
    }
  };

  const handleMysterySquare = () => {
    const rewards = [
      { text: '+2 EXTRA LIVES', action: () => setExtraLives((l) => l + 2) },
      { text: '£15 CASH BOOST', action: () => setPotCash((p) => p + 15 * stake) },
      { text: '+3 STEPPER NUDGES', action: () => setNudgesRemaining((n) => n + 3) },
      { text: 'EQUAL WINS ACTIVATED', action: () => setEqualWinsLit(true) },
    ];
    const picked = rewards[Math.floor(Math.random() * rewards.length)];
    setTickerMessage(`🔮 THE MAGICIAN AWARDS: ${picked.text}!`);
    picked.action();
  };

  // ==============================================================
  // 6. MINI-GAME 1: HARDER SKILL CASH STOPPER (Dynamic Acceleration)
  // ==============================================================
  const launchSkillStopper = () => {
    setSkillStopperActive(true);
    setTickerMessage('⚡ HARDER SKILL STOPPER ACTIVE! LIGHT SPEEDS UP NEAR JACKPOT! ⚡');

    let current = 0;
    let dir = 1;

    const runStep = () => {
      playWheelTick();
      current += dir;
      if (current >= CASH_LADDER.length - 1) {
        current = CASH_LADDER.length - 1;
        dir = -1;
      } else if (current <= 0) {
        current = 0;
        dir = 1;
      }
      setStopperHighlightRung(current);

      // Dynamic acceleration: gets much faster as it climbs to the jackpot!
      // Low rungs: 70ms, Mid rungs: 45ms, High rungs: 35ms, £100 Jackpot: 28ms!
      let delay = 70;
      if (current >= 8) delay = 28;
      else if (current >= 6) delay = 38;
      else if (current >= 3) delay = 50;

      // Slight jitter to prevent mechanical rhythmic counting
      delay += Math.floor(Math.random() * 8) - 4;

      stopperTimerRef.current = setTimeout(runStep, delay);
    };

    stopperTimerRef.current = setTimeout(runStep, 70);
  };

  const handleStopSkillCash = () => {
    if (!skillStopperActive) return;
    if (stopperTimerRef.current) clearTimeout(stopperTimerRef.current);
    setSkillStopperActive(false);

    let finalRung = stopperHighlightRung;
    // In TIGHT mode, slip off £100 by 1 rung
    if (machineMode === 'TIGHT' && finalRung === CASH_LADDER.length - 1) {
      finalRung = CASH_LADDER.length - 2; // slip to £70
      setTickerMessage('SLIPPED BY 1 RUNG! STOPPED ON £70!');
    } else {
      setTickerMessage(`TRUE SKILL REFLEX! FROZEN ON £${CASH_LADDER[finalRung]}!`);
    }

    const wonCash = CASH_LADDER[finalRung] * stake;
    playWinSound();
    setPotCash((prev) => prev + wonCash);
    setCashLadderStep(finalRung);
  };

  // ==============================================================
  // 7. MINI-GAME 2: FASTER REEL ROULETTE (True Reflex Timing)
  // ==============================================================
  const launchReelRoulette = () => {
    setReelRouletteActive(true);
    setTickerMessage('🎡 FASTER REEL ROULETTE! TIME YOUR STOP ON THE HIGH ROLLERS! 🎡');

    let idx = 0;
    // Faster 85ms interval for true reflex challenge
    rouletteTimerRef.current = setInterval(() => {
      playSlotTick();
      idx = (idx + 1) % PUB_SYMBOLS.length;
      setRouletteIndex(idx);
    }, 85);
  };

  const handleStopReelRoulette = () => {
    if (!reelRouletteActive) return;
    if (rouletteTimerRef.current) clearInterval(rouletteTimerRef.current);
    setReelRouletteActive(false);

    const sym = PUB_SYMBOLS[rouletteIndex];
    const prize = sym.payout3 * stake;
    playWinSound();
    setPotCash((prev) => prev + prize);
    setTickerMessage(`🎡 REEL ROULETTE FROZEN ON ${sym.name.toUpperCase()}! WON £${prize}!`);
  };

  // ==============================================================
  // 8. MINI-GAME 3: RAPID JACKPOT REPEATER (55ms YES/NO)
  // ==============================================================
  const triggerRepeaterChance = (initialJackpot: number) => {
    setPendingJackpotWin(initialJackpot);
    setRepeaterActive(true);
    setTickerMessage('★ JACKPOT HIT! REPEAT CHANCE FLASHING! HIT [START] ON YES! ★');

    let state = false;
    // Rapid 55ms flicker requires razor-sharp timing
    repeaterTimerRef.current = setInterval(() => {
      state = !state;
      setRepeaterYesLit(state);
      playWheelTick();
    }, 55);
  };

  const handleStopRepeater = () => {
    if (!repeaterActive) return;
    if (repeaterTimerRef.current) clearInterval(repeaterTimerRef.current);
    setRepeaterActive(false);

    const wonRepeat = machineMode === 'GIVING' ? repeaterYesLit || Math.random() < 0.6 : repeaterYesLit;

    if (wonRepeat) {
      playJackpotSound();
      setWinTitle('🍾 REPEAT CHANCE WON! JACKPOT DOUBLED! 🍾');
      setWinAmount(pendingJackpotWin);
      onUpdateBankroll(pendingJackpotWin);
      setTotalOut((prev) => prev + pendingJackpotWin);
      setTickerMessage(`REPEAT WON! +£${pendingJackpotWin} AGAIN! PROPER JOB!`);
      triggerAiComment('big_win', 'Player successfully landed the Jackpot Repeater!');
    } else {
      setTickerMessage('REPEAT MISSED ON NO. JACKPOT CASHED OUT SAFELY!');
    }
  };

  // Collect Board Cash to Bankroll
  const handleCollectBoard = () => {
    if (!inFeatureBoard || potCash <= 0 || isWalkingBoard) return;
    playWinSound();
    onUpdateBankroll(potCash);
    setTotalOut((prev) => prev + potCash);
    setWinTitle('🍻 CASHPOT COLLECTED! 🍻');
    setWinAmount(potCash);
    setInFeatureBoard(false);
    setCashLadderStep(-1);
    setTickerMessage(`COLLECTED £${potCash} FROM THE BOARD! PROPER JOB GUV'NOR!`);
    triggerAiComment('collect_cash', `Player banked £${potCash} from the high roller feature board!`);
  };

  // Visible reel symbols
  const r0Symbols = getReelSymbols(0, tapeIndices[0]);
  const r1Symbols = getReelSymbols(1, tapeIndices[1]);
  const r2Symbols = getReelSymbols(2, tapeIndices[2]);

  return (
    <div className="relative max-w-5xl mx-auto space-y-4 select-none pb-12 font-sans">
      {/* WIN SPLASH POPUP */}
      {winAmount > 0 && (
        <VegasWinSplash
          title={winTitle}
          winAmount={winAmount}
          onComplete={() => setWinAmount(0)}
        />
      )}

      {/* ============================================================== */}
      {/* TOP HEADER: British Pub Header & Landlady Sarah */}
      {/* ============================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-[#2b0808] via-[#450a0a] to-[#260505] border-3 border-amber-500/80 p-3 sm:p-4 shadow-[0_0_35px_rgba(245,158,11,0.35)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title & Badges */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-red-600 text-black flex items-center justify-center font-black shadow-[0_0_20px_#f59e0b] border-2 border-white text-2xl shrink-0">
            <span>🎩</span>
            <span className="absolute -bottom-1 -right-1 text-sm">🎲</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-500/50">
                UK Pub Fruit Machine (MPU4)
              </span>
              <span className="text-[10px] font-bold text-red-200 bg-red-950 px-1.5 py-0.5 rounded border border-red-600">
                🔞 18+ ONLY
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                  machineMode === 'GIVING'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-400 animate-pulse'
                    : machineMode === 'TIGHT'
                    ? 'bg-red-950 text-red-300 border-red-500'
                    : 'bg-amber-900/80 text-yellow-300 border-yellow-400'
                }`}
                title={`MPU4 Ledger: Total In: £${totalIn.toFixed(2)}, Total Out: £${totalOut.toFixed(2)}, Target RTP: 80%`}
              >
                STATUS: {machineMode}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-amber-200 tracking-tight uppercase flex items-center gap-2">
              THE VEGAS STRIP: MONOPOLY PUB FRUITY 🎰 🎩
            </h2>
            <div className="text-xs text-zinc-300 font-mono">
              STAKE: <span className="text-gold font-bold">£{stake.toFixed(2)}</span> • MAX WIN: <span className="text-amber-400 font-black">£100 BOARDWALK JACKPOT</span>
            </div>
          </div>
        </div>

        {/* Live Pub Landlady Sarah & Bar Banter */}
        <div className="flex items-center gap-3 bg-black/75 border-2 border-amber-500/50 rounded-2xl px-3 py-2 max-w-md w-full shadow-inner">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 shadow">
            <img
              src="/vegas/dealer_sarah.jpg"
              alt="Sarah Pub Landlady"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="text-xs leading-snug">
            <div className="text-[10px] uppercase font-black text-amber-400 flex items-center justify-between">
              <span>Sarah • The Red Lion Landlady</span>
              {isAiThinking && <span className="text-[9px] text-zinc-400 animate-pulse">(chatting...)</span>}
            </div>
            <p className="text-zinc-200 italic line-clamp-2">
              &quot;{aiHostessComment}&quot;
            </p>
          </div>
        </div>

        {/* Controls / How to Play */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/academy?tab=leaderboard&discipline=slots"
            className="px-3.5 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 border-2 border-gold/50 text-gold font-black text-xs uppercase tracking-wider transition shadow flex items-center gap-1.5 active:scale-95"
            title="View Slots & Fruity League Standings"
          >
            <Trophy size={14} className="text-gold" />
            <span>Fruity League</span>
          </Link>
          {onSwitchToVegas && (
            <button
              onClick={onSwitchToVegas}
              className="px-3.5 py-2 rounded-xl bg-purple-950/90 hover:bg-purple-900 border-2 border-purple-400 text-purple-200 font-black text-xs uppercase tracking-wider transition shadow flex items-center gap-1.5 active:scale-95"
            >
              <span>🎰 Vegas 5-Line</span>
            </button>
          )}
          <button
            onClick={onOpenTutorial}
            className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs transition shadow flex items-center gap-1"
          >
            <HelpCircle size={14} />
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* THE MAIN PHYSICAL CABINET (Styled with Retro 8-Bit Vegas Neon) */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#1f0202] via-[#2f0404] to-[#140101] border-4 border-[#991b1b] p-3 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_2px_12px_rgba(255,215,0,0.4)] overflow-hidden">
        
        {/* Subtle 8-Bit Vegas Skyline Backdrop Watermark */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center mix-blend-screen"
          style={{ backgroundImage: `url('/backgrounds/8bit_night_skyline.png')` }}
        />

        {/* ============================================================== */}
        {/* 1. TOP GLASS: AUTHENTIC 5x5 MONOPOLY PERIMETER BOARD */}
        {/* ============================================================== */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#0a140d] via-[#112417] to-[#061009] border-3 border-[#10b981] p-3 sm:p-4 shadow-[0_0_30px_rgba(16,185,129,0.35)] overflow-hidden">
          
          {/* Top Marquee with Character Cast */}
          <div className="flex flex-wrap items-center justify-between pb-2 border-b-2 border-emerald-900/60 mb-3 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 animate-ping shadow-[0_0_10px_#fde047]" />
              <span className="font-black text-xs sm:text-sm text-yellow-300 uppercase tracking-widest drop-shadow-[0_0_8px_#f59e0b]">
                ★ MONOPOLY VEGAS STRIP: TOP GLASS BOARD ★
              </span>
            </div>

            {/* High Roller Characters Cameo */}
            <div className="hidden sm:flex items-center gap-2 bg-black/70 px-3 py-1 rounded-full border border-yellow-400/40">
              <span className="text-[10px] text-zinc-300 font-bold uppercase">Cast:</span>
              <img src="/avatars/avatar_edward_wearing_1772222877224.png" alt="Edward" className="w-5 h-5 rounded-full object-cover border border-yellow-400" title="Edward (The Pit Boss)" />
              <img src="/avatars/avatar_dave_blackburn_1787685845732.png" alt="Dave B" className="w-5 h-5 rounded-full object-cover border border-purple-400" title="Dave Blackburn (The Card Shark)" />
              <img src="/avatars/avatar_chris_daly_1772222942062.png" alt="Chris Daly" className="w-5 h-5 rounded-full object-cover border border-emerald-400" title="Chris Daly (The Magician)" />
              <img src="/avatars/avatar_georgina_wearing_1772223035422.png" alt="Georgina" className="w-5 h-5 rounded-full object-cover border border-rose-400" title="Georgina (Lady Luck)" />
            </div>

            <div className="font-mono text-xs text-amber-300 bg-red-950/90 px-3 py-1 rounded-xl border-2 border-yellow-400 shadow flex items-center gap-2">
              <span>BOARD POT:</span>
              <span className="font-black text-white text-sm">£{potCash}</span>
            </div>
          </div>

          {/* Grid Layout: 5x5 Perimeter Monopoly Board (Left 9 cols) + Vertical Cash Ladder (Right 3 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center relative z-10">
            
            {/* Left 9 Cols: The 5x5 Perimeter Monopoly Board */}
            <div className="lg:col-span-9 bg-[#0b1c11]/90 rounded-2xl p-2 sm:p-3 border-2 border-emerald-500/60 relative shadow-2xl">
              
              {/* THE 5x5 MONOPOLY GRID */}
              <div className="grid grid-cols-5 grid-rows-5 gap-1 sm:gap-1.5 relative min-h-[380px] sm:min-h-[440px]">
                
                {/* 16 PERIMETER SQUARES */}
                {MONOPOLY_SQUARES.map((sq) => {
                  const isActive = inFeatureBoard && boardPosition === sq.id;

                  return (
                    <div
                      key={sq.id}
                      className={`${sq.row} ${sq.col} relative rounded-xl border flex flex-col justify-between overflow-hidden transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-b from-yellow-300 via-amber-300 to-yellow-500 text-black border-white shadow-[0_0_25px_#fde047] scale-105 z-30 font-black ring-3 ring-yellow-400'
                          : sq.isCorner
                          ? 'bg-gradient-to-b from-[#1f2937] via-[#111827] to-[#0f172a] text-white border-yellow-500/40 shadow'
                          : 'bg-[#fefce8]/95 text-zinc-900 border-zinc-400/80 shadow-md hover:brightness-105'
                      }`}
                    >
                      {/* Top Monopoly Property Color Banner */}
                      <div className={`h-2 sm:h-2.5 w-full ${sq.colorBar} border-b border-black/40`} />

                      {/* Moving Token Indicator (🎩 Top Hat or Golden Pawn) */}
                      {isActive && (
                        <div className="absolute top-1 right-1 text-base sm:text-lg animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-40">
                          🎩
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="p-1 flex flex-col items-center justify-center flex-1 text-center">
                        <div className={`text-[8px] sm:text-[9.5px] font-black uppercase tracking-tight leading-tight line-clamp-1 ${isActive ? 'text-black' : sq.isCorner ? 'text-yellow-300' : 'text-zinc-950'}`}>
                          {sq.title}
                        </div>

                        {/* Character Avatar or Icon */}
                        <div className="my-0.5 flex items-center justify-center">
                          {sq.avatarImg ? (
                            <img
                              src={sq.avatarImg}
                              alt={sq.title}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-black shadow-sm"
                            />
                          ) : (
                            <span className="text-xs sm:text-base leading-none drop-shadow-sm">
                              {sq.icon}
                            </span>
                          )}
                        </div>

                        <div className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-tighter ${isActive ? 'text-zinc-900' : sq.isCorner ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {sq.subtext}
                        </div>
                      </div>

                      {/* Bottom Price Tag */}
                      <div className={`py-0.5 px-1 text-[7.5px] sm:text-[8.5px] font-mono font-black text-center border-t border-black/15 ${
                        isActive
                          ? 'bg-yellow-400 text-black'
                          : sq.isCorner
                          ? 'bg-black/60 text-yellow-300'
                          : 'bg-zinc-200 text-zinc-900'
                      }`}>
                        {sq.priceTag}
                      </div>
                    </div>
                  );
                })}

                {/* ============================================================== */}
                {/* 3x3 HOLLOW MONOPOLY COURTYARD (Center Stage) */}
                {/* ============================================================== */}
                <div className="row-start-2 row-span-3 col-start-2 col-span-3 rounded-2xl bg-gradient-to-b from-[#06180c] via-black to-[#06180c] border-2 border-emerald-400/50 p-2 sm:p-3 flex flex-col justify-between shadow-inner relative overflow-hidden z-20">
                  
                  {/* Monopoly-Style Angled Red Marquee Banner */}
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-700/50">
                    <div className="bg-red-600 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest px-2.5 py-0.5 rounded shadow border border-white">
                      MONOPOLY VEGAS
                    </div>
                    <div className="text-[9px] font-mono text-emerald-300 flex items-center gap-1">
                      <Footprints size={12} className={isWalkingBoard ? 'animate-bounce text-yellow-300' : ''} />
                      <span className="hidden sm:inline">POSITION:</span>
                      <span className="font-bold text-white uppercase">{MONOPOLY_SQUARES[boardPosition].title}</span>
                    </div>
                  </div>

                  {/* CENTER ARENA: MINI-GAMES OR HI-LO CONTROLS */}
                  {skillStopperActive ? (
                    /* MINI-GAME 1: HARDER SKILL CASH STOPPER */
                    <div className="my-auto bg-red-950/90 border-2 border-yellow-400 rounded-xl p-2.5 sm:p-3 text-center space-y-2 animate-pulse shadow-[0_0_20px_#ef4444]">
                      <div className="flex items-center justify-center gap-1.5 text-yellow-300 font-black text-xs uppercase tracking-wider">
                        <Zap size={16} className="animate-bounce" />
                        <span>HARDER SKILL CASH STOPPER!</span>
                      </div>
                      <div className="text-[10px] text-zinc-300">
                        TARGET RUNG: <span className="font-mono font-black text-base text-yellow-300">£{CASH_LADDER[stopperHighlightRung]}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleStopSkillCash}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-red-600 border-2 border-white text-black font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#fde047] active:scale-95"
                      >
                        STOP ON JACKPOT! 🛑
                      </button>
                    </div>
                  ) : reelRouletteActive ? (
                    /* MINI-GAME 2: FASTER REEL ROULETTE */
                    <div className="my-auto bg-purple-950/90 border-2 border-purple-400 rounded-xl p-2.5 sm:p-3 text-center space-y-2 animate-pulse shadow-[0_0_20px_#a855f7]">
                      <div className="flex items-center justify-center gap-1.5 text-purple-200 font-black text-xs uppercase tracking-wider">
                        <span>🎡 REEL ROULETTE WHEEL</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl">{PUB_SYMBOLS[rouletteIndex].icon || '🎰'}</span>
                        <div className="font-bold text-white text-xs">
                          {PUB_SYMBOLS[rouletteIndex].name} (£{PUB_SYMBOLS[rouletteIndex].payout3 * stake})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleStopReelRoulette}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-400 to-indigo-600 border-2 border-white text-white font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#c084fc] active:scale-95"
                      >
                        STOP WHEEL! 🛑
                      </button>
                    </div>
                  ) : repeaterActive ? (
                    /* MINI-GAME 3: RAPID JACKPOT REPEATER */
                    <div className="my-auto bg-amber-950/90 border-2 border-yellow-300 rounded-xl p-2.5 sm:p-3 text-center space-y-2 animate-pulse shadow-[0_0_20px_#f59e0b]">
                      <div className="text-yellow-300 font-black text-xs uppercase">
                        ★ REPEAT CHANCE FLASHING! ★
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <span className={`px-3 py-1 rounded text-sm font-black ${repeaterYesLit ? 'bg-green-500 text-black shadow-[0_0_15px_#22c55e]' : 'bg-black/50 text-zinc-600'}`}>
                          YES
                        </span>
                        <span className={`px-3 py-1 rounded text-sm font-black ${!repeaterYesLit ? 'bg-red-500 text-white shadow-[0_0_15px_#ef4444]' : 'bg-black/50 text-zinc-600'}`}>
                          NO
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleStopRepeater}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-xs uppercase tracking-widest border-2 border-white shadow active:scale-95"
                      >
                        STOP ON YES!
                      </button>
                    </div>
                  ) : (
                    /* STANDARD HI-LO GAMBLE IN COURTYARD */
                    <div className="my-auto flex flex-col items-center justify-center space-y-2">
                      <div className="flex items-center justify-center gap-3">
                        {/* 3D Hi-Lo Number Cube */}
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black uppercase text-amber-400">HI-LO NUMBER</span>
                          <div className={`w-14 h-12 rounded-xl bg-black border-3 border-yellow-400 flex items-center justify-center font-mono font-black text-2xl text-yellow-300 shadow-[0_0_20px_#f59e0b] ${isRollingHiLo ? 'animate-bounce' : ''}`}>
                            {hiLoCurrent}
                          </div>
                        </div>

                        {/* HI / LO Guess Buttons */}
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            disabled={!inFeatureBoard || isWalkingBoard || isRollingHiLo}
                            onClick={() => handleHiLoGuess('hi')}
                            className={`px-3.5 py-1.5 rounded-lg border-2 font-black text-xs uppercase tracking-wider active:scale-95 transition flex items-center gap-1 ${
                              inFeatureBoard && !isWalkingBoard && !isRollingHiLo
                                ? 'bg-gradient-to-b from-emerald-500 to-emerald-800 hover:from-emerald-400 border-emerald-300 text-white shadow-[0_0_12px_#10b981] animate-pulse'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-600 opacity-30 cursor-not-allowed'
                            }`}
                          >
                            <ArrowUp size={14} />
                            <span>HI ⬆</span>
                          </button>

                          <button
                            type="button"
                            disabled={!inFeatureBoard || isWalkingBoard || isRollingHiLo}
                            onClick={() => handleHiLoGuess('lo')}
                            className={`px-3.5 py-1.5 rounded-lg border-2 font-black text-xs uppercase tracking-wider active:scale-95 transition flex items-center gap-1 ${
                              inFeatureBoard && !isWalkingBoard && !isRollingHiLo
                                ? 'bg-gradient-to-b from-rose-500 to-rose-800 hover:from-rose-400 border-rose-300 text-white shadow-[0_0_12px_#ef4444] animate-pulse'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-600 opacity-30 cursor-not-allowed'
                            }`}
                          >
                            <ArrowDown size={14} />
                            <span>LO ⬇</span>
                          </button>
                        </div>
                      </div>

                      {/* Equal wins light & Extra Lives */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded-lg border border-rose-500/60 text-[10px] font-mono">
                          <span className="text-red-400 animate-pulse">❤️</span>
                          <span className="text-white font-black">{extraLives} LIVES</span>
                        </div>
                        <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${equalWinsLit ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'bg-black text-zinc-600 border-zinc-800'}`}>
                          {equalWinsLit ? '★ EQUAL WINS' : 'EQUAL LOSES'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Courtyard Bar: Collect Cashpot */}
                  <div className="pt-1.5 border-t border-emerald-800/60 flex items-center justify-between">
                    <div className="text-[9px] font-mono text-zinc-300">
                      POT: <span className="font-black text-yellow-300">£{potCash}</span>
                    </div>
                    <button
                      type="button"
                      disabled={!inFeatureBoard || potCash <= 0 || isWalkingBoard}
                      onClick={handleCollectBoard}
                      className={`px-3 py-1 rounded-lg border font-black text-[10px] uppercase tracking-wider active:scale-95 transition flex items-center gap-1 ${
                        inFeatureBoard && potCash > 0 && !isWalkingBoard
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-white shadow-[0_0_12px_#f59e0b] animate-bounce'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
                      }`}
                    >
                      <Coins size={12} />
                      <span>COLLECT POT</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 3 Cols: The British Cash Ladder (£1 to £100 Jackpot) */}
            <div className="lg:col-span-3 bg-gradient-to-b from-black via-[#1c0812] to-black rounded-2xl p-2.5 sm:p-3 border-2 border-amber-400/70 shadow-2xl flex flex-col justify-between">
              <div className="text-center font-mono font-black text-[11px] sm:text-xs uppercase tracking-wider text-yellow-300 pb-2 border-b-2 border-amber-600 mb-1 flex items-center justify-center gap-1.5">
                <Trophy size={14} className="text-yellow-400" />
                <span>★ CASH LADDER ★</span>
              </div>

              <div className="flex flex-col-reverse gap-1">
                {CASH_LADDER.map((val, idx) => {
                  const isCurrent = cashLadderStep === idx;
                  const isPassed = cashLadderStep > idx;
                  const isStopperLight = skillStopperActive && stopperHighlightRung === idx;

                  return (
                    <div
                      key={val}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black flex items-center justify-between transition-all ${
                        isStopperLight
                          ? 'bg-white text-black shadow-[0_0_25px_#ffffff] scale-105 border-2 border-yellow-400 z-20 animate-pulse'
                          : isCurrent
                          ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-black shadow-[0_0_20px_#fde047] scale-105 border-2 border-white z-10'
                          : isPassed
                          ? 'bg-gradient-to-r from-amber-950 via-yellow-950 to-amber-950 text-yellow-300 border border-amber-600/70'
                          : 'bg-black/70 text-zinc-600 border border-white/5'
                      }`}
                    >
                      <span className="text-[9px] tracking-widest flex items-center gap-1">
                        {idx === CASH_LADDER.length - 1 ? (
                          <span className="text-yellow-400 animate-pulse font-black">🏆 JACKPOT</span>
                        ) : (
                          `STEP ${idx + 1}`
                        )}
                      </span>
                      <span className="text-xs sm:text-sm font-black drop-shadow">£{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. CENTER: RETRO 14-SEGMENT RED DOT-MATRIX LED BANNER */}
        {/* ============================================================== */}
        <div className="my-3 px-4 py-2.5 rounded-xl bg-black border-2 border-red-700 shadow-[inset_0_2px_10px_rgba(0,0,0,1)] flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[10px] font-mono font-black uppercase text-red-500">
              LED MESSAGE:
            </span>
          </div>
          <div className="font-mono font-black text-xs sm:text-sm text-red-400 tracking-wider text-center truncate drop-shadow-[0_0_8px_#ef4444]">
            {tickerMessage}
          </div>
          <div className="text-[10px] font-mono text-zinc-500 shrink-0 hidden sm:block">
            MPU4 CATEGORY C • RTP 80%
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. LOWER GLASS: 3 MECHANICAL STEPPER REELS WITH RECOIL PHYSICS */}
        {/* ============================================================== */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#180303] via-[#2c0505] to-[#120101] border-3 border-amber-500/80 p-3 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
          
          {/* Laser-guided Red Horizontal Winline Marker */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-red-500 shadow-[0_0_15px_#ef4444] z-20 pointer-events-none flex items-center justify-between px-3">
            <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded shadow border border-white">
              ◄ WINLINE
            </span>
            <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded shadow border border-white">
              WINLINE ►
            </span>
          </div>

          {/* The 3 Mechanical Reels */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
            {[r0Symbols, r1Symbols, r2Symbols].map((reelCol, rIdx) => {
              const isSpin = spinningReels[rIdx];
              const isHeld = heldReels[rIdx];
              const numOverlay = reelNumbers[rIdx];
              const isRecoil = recoilReelIndex === rIdx;

              return (
                <div
                  key={rIdx}
                  className={`relative rounded-2xl bg-gradient-to-b from-[#141414] via-[#f5f5f5] to-[#141414] p-1.5 sm:p-2 border-3 transition-transform duration-75 ${
                    isRecoil ? 'translate-y-1' : 'translate-y-0'
                  } ${
                    isHeld
                      ? 'border-yellow-400 shadow-[0_0_25px_#fde047]'
                      : 'border-zinc-700 shadow-[inset_0_12px_24px_rgba(0,0,0,0.85),inset_0_-12px_24px_rgba(0,0,0,0.85)]'
                  }`}
                >
                  {/* Held Badge if held */}
                  {isHeld && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full z-30 uppercase shadow border border-black animate-pulse">
                      HELD
                    </div>
                  )}

                  {/* Cylindrical Drum Shading */}
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    {reelCol.map((sym, rowIdx) => {
                      const isCenterWinline = rowIdx === 1;

                      return (
                        <div
                          key={rowIdx}
                          className={`relative rounded-xl flex flex-col items-center justify-center p-2 sm:p-3 transition-transform ${
                            isCenterWinline
                              ? 'bg-gradient-to-b from-white via-zinc-100 to-zinc-200 text-black shadow-lg border-2 border-red-500 scale-100 z-10'
                              : 'bg-zinc-200/80 opacity-50 scale-95'
                          } ${isSpin ? 'blur-[1px]' : ''}`}
                        >
                          {/* 8-Bit Character Avatar OR Emoji Icon */}
                          {sym.avatarImg ? (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shadow-md border-2 border-black bg-white/20 p-0.5 flex items-center justify-center">
                              <img
                                src={sym.avatarImg}
                                alt={sym.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <span className="text-3xl sm:text-5xl drop-shadow-md">
                              {sym.icon}
                            </span>
                          )}

                          <span className="text-[10px] sm:text-xs font-black uppercase text-zinc-900 tracking-tight mt-1 text-center">
                            {sym.name}
                          </span>

                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full ${sym.badgeColor}`}>
                            {sym.comicLabel}
                          </span>

                          {/* Number sticker on center symbol for number trail */}
                          {isCenterWinline && numOverlay > 0 && (
                            <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 border-2 border-white text-white font-mono font-black text-xs flex items-center justify-center shadow-[0_0_10px_#ef4444]">
                              +{numOverlay}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ============================================================== */}
          {/* 4. THE NUMBER TRAIL (1 TO 8): 4 = BONUS, 8 = TOP GLASS */}
          {/* ============================================================== */}
          <div className="mt-4 pt-3 border-t-2 border-amber-800/80 bg-black/80 rounded-xl p-3">
            <div className="flex items-center justify-between text-[11px] uppercase font-black text-yellow-300 mb-2 px-1">
              <span className="flex items-center gap-1.5">
                <span>★ THE VEGAS NUMBER TRAIL</span>
                <span className="text-zinc-400 font-normal text-[9px]">(STEP 4 = BONUS • STEP 8 = TOP GLASS)</span>
                {trailHeld && (
                  <span className="bg-yellow-400 text-black px-1.5 py-0.2 rounded font-black text-[9px] animate-pulse">
                    TRAIL HELD!
                  </span>
                )}
              </span>
              <span className="text-amber-400 font-mono">PROGRESS: {trailStep}/8</span>
            </div>

            <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => {
                const isLit = trailStep >= step;
                const isBonus = step === 4;
                const isFeature = step === 8;

                return (
                  <div
                    key={step}
                    className={`py-2 rounded-xl text-center font-mono font-black text-xs sm:text-sm border-2 transition-all ${
                      isLit
                        ? isFeature
                          ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 text-black border-white shadow-[0_0_20px_#fde047]'
                          : isBonus
                          ? 'bg-gradient-to-b from-blue-400 to-blue-700 text-white border-blue-200 shadow-[0_0_15px_#60a5fa]'
                          : 'bg-gradient-to-b from-red-500 to-red-700 text-white border-red-300 shadow-[0_0_12px_#ef4444]'
                        : 'bg-black/60 text-zinc-600 border-white/5'
                    }`}
                  >
                    <div>{step}</div>
                    <div className="text-[8px] uppercase tracking-tighter">
                      {isFeature ? 'BOARD' : isBonus ? 'BONUS' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 5. AUTHENTIC BRITISH PUB FRUITY CONSOLE & SQUARE BUTTON DECK */}
        {/* ============================================================== */}
        <div className="mt-3 rounded-2xl p-3 sm:p-4 bg-gradient-to-b from-[#2b0808] via-[#1a0404] to-[#0c0202] border-t-3 border-amber-500 shadow-[0_-10px_25px_rgba(0,0,0,0.85)]">
          
          {/* Upper Deck: Stake Selector, Nudges Available, Bankroll */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 mb-3">
            {/* Stake Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black text-zinc-300">Stake:</span>
              <div className="flex items-center gap-1.5 bg-black/70 p-1 rounded-xl border border-white/15">
                {[0.25, 0.5, 1, 2].map((val) => (
                  <button
                    key={val}
                    disabled={isSpinning || inFeatureBoard || exchangePending !== null}
                    onClick={() => setStake(val)}
                    className={`px-3 py-1 rounded-lg font-mono font-black text-xs transition ${
                      stake === val
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_12px_#f59e0b]'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    £{val.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            {/* Nudges Status & Auto Nudge */}
            <div className="flex items-center gap-2">
              <div
                className={`px-3.5 py-1.5 rounded-xl border-2 font-mono font-black text-xs uppercase flex items-center gap-2 ${
                  nudgesRemaining > 0
                    ? 'bg-yellow-500/25 text-yellow-300 border-yellow-400 shadow-[0_0_15px_#fde047] animate-pulse'
                    : 'bg-black/70 text-zinc-500 border-white/10'
                }`}
              >
                <span>★ NUDGES: {nudgesRemaining}</span>
                {nudgesRemaining > 0 && (
                  <button
                    type="button"
                    onClick={handleAutoNudge}
                    className="ml-1.5 px-2.5 py-0.5 rounded bg-yellow-400 text-black text-[10px] font-black uppercase hover:brightness-110 shadow"
                  >
                    AUTO
                  </button>
                )}
              </div>
            </div>

            {/* Bankroll Counter */}
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-300 bg-black/60 px-3 py-1.5 rounded-xl border border-gold/30">
              <span className="text-zinc-400">BANKROLL:</span>
              <span className="text-gold font-black text-sm">£{bankroll.toLocaleString()}</span>
            </div>
          </div>

          {/* Lower Deck: The Classic Square Backlit Push Buttons with State-Driven Illumination */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-2.5">
            
            {/* 1. CANCEL / STEP */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={!holdsAvailable && nudgesRemaining <= 0}
              className={`p-2 sm:p-2.5 rounded-xl border-2 font-black text-[11px] sm:text-xs uppercase tracking-wider active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] ${
                holdsAvailable || nudgesRemaining > 0
                  ? 'bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 border-zinc-300 text-white shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <span>CANCEL</span>
              <span className="text-[9px] text-zinc-400">STEP</span>
            </button>

            {/* 2. HOLD / NUDGE 1 */}
            <button
              type="button"
              disabled={isSpinning || (!holdsAvailable && nudgesRemaining <= 0)}
              onClick={() => {
                if (nudgesRemaining > 0) handleNudge(0);
                else toggleHold(0);
              }}
              className={`p-2 sm:p-2.5 rounded-xl border-2 font-black text-[11px] sm:text-xs uppercase tracking-wider active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] ${
                heldReels[0]
                  ? 'bg-yellow-400 border-white text-black shadow-[0_0_20px_#fde047]'
                  : holdsAvailable
                  ? 'bg-amber-500 border-amber-200 text-white animate-pulse shadow-[0_0_15px_#f59e0b]'
                  : nudgesRemaining > 0
                  ? 'bg-blue-600 border-blue-300 text-white shadow-[0_0_15px_#3b82f6] animate-pulse'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <span>{nudgesRemaining > 0 ? 'NUDGE 1' : 'HOLD 1'}</span>
              <span className="text-[9px]">{heldReels[0] ? 'LOCKED' : nudgesRemaining > 0 ? 'STEP ▼' : 'REEL 1'}</span>
            </button>

            {/* 3. HOLD / NUDGE 2 */}
            <button
              type="button"
              disabled={isSpinning || (!holdsAvailable && nudgesRemaining <= 0)}
              onClick={() => {
                if (nudgesRemaining > 0) handleNudge(1);
                else toggleHold(1);
              }}
              className={`p-2 sm:p-2.5 rounded-xl border-2 font-black text-[11px] sm:text-xs uppercase tracking-wider active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] ${
                heldReels[1]
                  ? 'bg-yellow-400 border-white text-black shadow-[0_0_20px_#fde047]'
                  : holdsAvailable
                  ? 'bg-amber-500 border-amber-200 text-white animate-pulse shadow-[0_0_15px_#f59e0b]'
                  : nudgesRemaining > 0
                  ? 'bg-blue-600 border-blue-300 text-white shadow-[0_0_15px_#3b82f6] animate-pulse'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <span>{nudgesRemaining > 0 ? 'NUDGE 2' : 'HOLD 2'}</span>
              <span className="text-[9px]">{heldReels[1] ? 'LOCKED' : nudgesRemaining > 0 ? 'STEP ▼' : 'REEL 2'}</span>
            </button>

            {/* 4. HOLD / NUDGE 3 */}
            <button
              type="button"
              disabled={isSpinning || (!holdsAvailable && nudgesRemaining <= 0)}
              onClick={() => {
                if (nudgesRemaining > 0) handleNudge(2);
                else toggleHold(2);
              }}
              className={`p-2 sm:p-2.5 rounded-xl border-2 font-black text-[11px] sm:text-xs uppercase tracking-wider active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] ${
                heldReels[2]
                  ? 'bg-yellow-400 border-white text-black shadow-[0_0_20px_#fde047]'
                  : holdsAvailable
                  ? 'bg-amber-500 border-amber-200 text-white animate-pulse shadow-[0_0_15px_#f59e0b]'
                  : nudgesRemaining > 0
                  ? 'bg-blue-600 border-blue-300 text-white shadow-[0_0_15px_#3b82f6] animate-pulse'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <span>{nudgesRemaining > 0 ? 'NUDGE 3' : 'HOLD 3'}</span>
              <span className="text-[9px]">{heldReels[2] ? 'LOCKED' : nudgesRemaining > 0 ? 'STEP ▼' : 'REEL 3'}</span>
            </button>

            {/* 5. HI BUTTON */}
            <button
              type="button"
              disabled={!inFeatureBoard || isSpinning || isWalkingBoard || isRollingHiLo}
              onClick={() => handleHiLoGuess('hi')}
              className={`p-2 sm:p-2.5 rounded-xl border-2 font-black text-[11px] sm:text-xs uppercase tracking-wider active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] ${
                inFeatureBoard && !isSpinning && !isWalkingBoard && !isRollingHiLo
                  ? 'bg-gradient-to-b from-emerald-600 to-emerald-950 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.7)] animate-pulse'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-1">
                <ArrowUp size={14} />
                <span>HI</span>
              </div>
              <span className="text-[9px] text-emerald-200">GAMBLE</span>
            </button>

            {/* 6. LO BUTTON */}
            <button
              type="button"
              disabled={!inFeatureBoard || isSpinning || isWalkingBoard || isRollingHiLo}
              onClick={() => handleHiLoGuess('lo')}
              className={`p-2 sm:p-2.5 rounded-xl border-2 font-black text-[11px] sm:text-xs uppercase tracking-wider active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] ${
                inFeatureBoard && !isSpinning && !isWalkingBoard && !isRollingHiLo
                  ? 'bg-gradient-to-b from-rose-600 to-rose-950 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.7)] animate-pulse'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-1">
                <ArrowDown size={14} />
                <span>LO</span>
              </div>
              <span className="text-[9px] text-rose-200">GAMBLE</span>
            </button>

            {/* 7. COLLECT / EXCHANGE BUTTON */}
            {exchangePending ? (
              <button
                type="button"
                onClick={handleExchangeCollectCash}
                className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-700 border-2 border-yellow-200 text-black font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-[0_0_20px_#f59e0b] active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] animate-pulse"
              >
                <span>COLLECT</span>
                <span className="text-[9px] font-mono">£{exchangePending.amount}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={!inFeatureBoard && potCash <= 0 || isWalkingBoard}
                onClick={handleCollectBoard}
                className={`p-2 sm:p-2.5 rounded-xl border-2 font-black text-[11px] sm:text-xs uppercase tracking-wider active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] ${
                  inFeatureBoard && potCash > 0 && !isWalkingBoard
                    ? 'bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-700 border-yellow-200 text-black shadow-[0_0_20px_#f59e0b] animate-bounce'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
                }`}
              >
                <span>COLLECT</span>
                <span className="text-[9px] font-mono">£{potCash}</span>
              </button>
            )}

            {/* 8. BIG START / STOP / EXCHANGE BUTTON */}
            {exchangePending ? (
              <button
                type="button"
                onClick={handleExchangeToFeature}
                className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-800 border-2 border-emerald-300 text-white font-black text-[11px] sm:text-xs uppercase tracking-widest shadow-[0_0_25px_#10b981] hover:brightness-110 active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] animate-bounce"
              >
                <div className="flex items-center gap-1">
                  <Flame size={14} />
                  <span>EXCHANGE</span>
                </div>
                <span className="text-[9px] font-mono">TO BOARD</span>
              </button>
            ) : skillStopperActive ? (
              <button
                type="button"
                onClick={handleStopSkillCash}
                className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-yellow-400 via-amber-500 to-red-600 border-2 border-white text-black font-black text-[11px] sm:text-xs uppercase tracking-widest shadow-[0_0_25px_#fde047] hover:brightness-110 active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] animate-pulse"
              >
                <div className="flex items-center gap-1">
                  <Square size={14} />
                  <span>STOP</span>
                </div>
                <span className="text-[9px] font-mono">STOPPER</span>
              </button>
            ) : reelRouletteActive ? (
              <button
                type="button"
                onClick={handleStopReelRoulette}
                className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-purple-500 via-indigo-600 to-purple-800 border-2 border-white text-white font-black text-[11px] sm:text-xs uppercase tracking-widest shadow-[0_0_25px_#a855f7] hover:brightness-110 active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] animate-pulse"
              >
                <div className="flex items-center gap-1">
                  <Square size={14} />
                  <span>STOP</span>
                </div>
                <span className="text-[9px] font-mono">WHEEL</span>
              </button>
            ) : repeaterActive ? (
              <button
                type="button"
                onClick={handleStopRepeater}
                className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-yellow-400 via-amber-500 to-yellow-600 border-2 border-white text-black font-black text-[11px] sm:text-xs uppercase tracking-widest shadow-[0_0_25px_#fde047] hover:brightness-110 active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] animate-pulse"
              >
                <div className="flex items-center gap-1">
                  <Square size={14} />
                  <span>REPEAT</span>
                </div>
                <span className="text-[9px] font-mono">CHANCE</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSpinning || bankroll < stake || inFeatureBoard}
                onClick={handleSpin}
                className={`p-2 sm:p-2.5 rounded-xl border-2 font-black text-[11px] sm:text-xs uppercase tracking-widest active:scale-95 transition flex flex-col items-center justify-center min-h-[62px] ${
                  !isSpinning && bankroll >= stake && !inFeatureBoard
                    ? 'bg-gradient-to-b from-[#00e676] via-[#00c853] to-[#00873a] border-[#b9f6ca] text-white shadow-[0_0_25px_rgba(0,200,83,0.8)] hover:brightness-110 animate-pulse'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Sparkles size={14} />
                  <span>START</span>
                </div>
                <span className="text-[9px] font-mono">£{stake.toFixed(2)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
