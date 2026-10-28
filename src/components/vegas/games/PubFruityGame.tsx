'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Zap,
  Flame,
  Square,
  Footprints,
  ArrowLeft,
  Activity,
  BookOpen,
  X,
  Eye,
  RotateCcw,
  Maximize2,
  Minimize2,
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
} from '@/lib/vegas/VegasAudio';
import { addGameHistory } from '@/lib/vegas/VegasHistory';
import { getActivePlayerName } from '@/lib/poker-trainer/tracker';
import { fetchDealerComment } from '@/lib/vegas/VegasAiService';
import VegasWinSplash from '../VegasWinSplash';
import VegasGameCompanion from '../VegasGameCompanion';
import { VEGAS_GAMES_CATALOG } from '../vegas-rules-db';
import { triggerHaptic } from '@/lib/vegas/VegasHaptics';
import {
  MachineMode,
  StageViewMode,
  CartridgeSymbol,
  BoardTile,
} from '@/cartridges/types';
import {
  VEGAS_STRIP_CARTRIDGE,
  VEGAS_STRIP_SYMBOLS,
  VEGAS_STRIP_REEL_TAPE_0,
  VEGAS_STRIP_REEL_TAPE_1,
  VEGAS_STRIP_REEL_TAPE_2,
  VEGAS_STRIP_BOARD_TILES,
  VEGAS_STRIP_CASH_LADDER,
} from '@/cartridges/01-vegas-strip';

// Re-export cartridge symbols & types for backwards compatibility
export type PubSymbol = CartridgeSymbol;
export type MonopolySquare = BoardTile;
export type { MachineMode };
export const PUB_SYMBOLS = VEGAS_STRIP_SYMBOLS;
export const REEL_TAPE_0 = VEGAS_STRIP_REEL_TAPE_0;
export const REEL_TAPE_1 = VEGAS_STRIP_REEL_TAPE_1;
export const REEL_TAPE_2 = VEGAS_STRIP_REEL_TAPE_2;
export const MONOPOLY_SQUARES = VEGAS_STRIP_BOARD_TILES;
const CASH_LADDER = VEGAS_STRIP_CASH_LADDER;

/**
 * Mystery Card Outcome definition for Chris Daly's 3-card pick inside the 3x3 centre panel
 */
interface MysteryCardOutcome {
  id: 'rungs_2' | 'life_1' | 'pot_25' | 'jail';
  title: string;
  shortTag: string;
  icon: string;
  accentClass: string;
}

const MYSTERY_CARD_POOL: MysteryCardOutcome[] = [
  {
    id: 'rungs_2',
    title: '+2 CASH RUNGS',
    shortTag: '+2 RUNGS',
    icon: '🪜',
    accentClass: 'from-amber-500 to-yellow-600 border-yellow-200 text-black',
  },
  {
    id: 'life_1',
    title: '+1 EXTRA LIFE',
    shortTag: '+1 LIFE ❤️',
    icon: '❤️',
    accentClass: 'from-rose-500 to-red-700 border-rose-200 text-white',
  },
  {
    id: 'pot_25',
    title: 'INSTANT £25 POT',
    shortTag: '+£25 POT',
    icon: '💰',
    accentClass: 'from-emerald-500 to-teal-700 border-emerald-200 text-white',
  },
  {
    id: 'jail',
    title: 'GO TO JAIL!',
    shortTag: 'JAIL 🚨',
    icon: '🚨',
    accentClass: 'from-red-900 to-zinc-950 border-red-400 text-red-200',
  },
];

/**
 * Zero-latency tactile vibration pulse (15ms) for nudges, reel stops, and skill clicks
 */
const pulseVibrate = (ms = 15) => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate?.(ms);
    } catch {
      // Ignore on unsupported browsers
    }
  }
};

interface Props {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onOpenTutorial: () => void;
  onSwitchToVegas?: () => void;
  onBackToFloor?: () => void;
  onOpenGuideTicker?: () => void;
}

export default function PubFruityGame({
  bankroll,
  onUpdateBankroll,
  onOpenTutorial,
  onSwitchToVegas,
  onBackToFloor,
  onOpenGuideTicker,
}: Props) {
  const cartridge = VEGAS_STRIP_CARTRIDGE;

  // Stake per spin: £0.25, £0.50, £1.00, £2.00
  const [stake, setStake] = useState<number>(cartridge.mechanics.defaultStake);
  const [soundOn, setSoundOn] = useState<boolean>(true);

  // ==============================================================
  // DYNAMIC STAGE VIEW CONTROLLER ('BASE_REELS' | 'FEATURE_BOARD')
  // ==============================================================
  const [stageView, setStageView] = useState<StageViewMode>('BASE_REELS');
  const [isPeekingBoard, setIsPeekingBoard] = useState<boolean>(false);
  const [step4BonusBanner, setStep4BonusBanner] = useState<string | null>(null);
  const [localDrawerOpen, setLocalDrawerOpen] = useState<boolean>(false);

  // ==============================================================
  // 1. MPU4 COMPENSATED LEDGER STATE (Target RTP: 74% - Authentic UK Category C)
  // ==============================================================
  const [totalIn, setTotalIn] = useState<number>(cartridge.mechanics.initialLedgerIn);
  const [totalOut, setTotalOut] = useState<number>(cartridge.mechanics.initialLedgerOut);
  const targetRTP = cartridge.mechanics.targetRTP;
  const currentBank = totalIn * targetRTP - totalOut;

  const machineMode: MachineMode =
    currentBank < -2 ? 'TIGHT' : currentBank > 6 ? 'GIVING' : 'NEUTRAL';

  // Physical Stepper Reel Tape Indices (0 to 15) & Harmonic Recoil Phases
  const [tapeIndices, setTapeIndices] = useState<number[]>([1, 4, 7]);
  const [reelNumbers, setReelNumbers] = useState<number[]>([1, 0, 1]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);
  // Harmonic recoil offset in px per reel ([reel0, reel1, reel2]) for realistic damped spring bounce
  const [recoilOffsets, setRecoilOffsets] = useState<number[]>([0, 0, 0]);

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
  // TOP GLASS MONOPOLY BOARD STATE & SECURITY CHASER
  // ==============================================================
  const [inFeatureBoard, setInFeatureBoard] = useState<boolean>(false);
  const [boardPosition, setBoardPosition] = useState<number>(0);
  const [isWalkingBoard, setIsWalkingBoard] = useState<boolean>(false);
  const [cashLadderStep, setCashLadderStep] = useState<number>(-1);

  // Crimson SECURITY chaser light spawned on top-right corner (tile id 4)
  const [securityPosition, setSecurityPosition] = useState<number>(4);
  const [securityAlertFlash, setSecurityAlertFlash] = useState<boolean>(false);
  const securityPositionRef = useRef<number>(4);

  // Hi-Lo Dice Display & Suspense Roll (Equal Loses converts to Equal Wins for 3 turns on GO or PIT BOSS)
  const [hiLoCurrent, setHiLoCurrent] = useState<number>(7);
  const [isRollingHiLo, setIsRollingHiLo] = useState<boolean>(false);
  const [equalWinsTurns, setEqualWinsTurns] = useState<number>(0);
  const equalWinsLit = equalWinsTurns > 0;
  const [extraLives, setExtraLives] = useState<number>(0);
  const extraLivesRef = useRef<number>(0);
  const [potCash, setPotCash] = useState<number>(0);

  useEffect(() => {
    extraLivesRef.current = extraLives;
  }, [extraLives]);

  useEffect(() => {
    securityPositionRef.current = securityPosition;
  }, [securityPosition]);

  // Mini-Game 1 / 3: Cash Frenzy & Harder Skill Cash Stopper (Horizontal Cash Ribbon bounce)
  const [skillStopperActive, setSkillStopperActive] = useState<boolean>(false);
  const [skillStopperLabel, setSkillStopperLabel] = useState<string>('CASH FRENZY (REPEAT)');
  const [stopperHighlightRung, setStopperHighlightRung] = useState<number>(0);
  const stopperTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mini-Game 2: Skill Wheel (Roulette) — 65ms Strobe around 16 Perimeter Tiles
  const [reelRouletteActive, setReelRouletteActive] = useState<boolean>(false);
  const [rouletteIndex, setRouletteIndex] = useState<number>(0);
  const rouletteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mini-Game 3: Magician Chris Daly's 3 Mystery Cards (mapped to HOLD 1, HOLD 2, HOLD 3)
  const [mysteryCardsActive, setMysteryCardsActive] = useState<boolean>(false);
  const [mysteryDeck, setMysteryDeck] = useState<MysteryCardOutcome[]>([
    MYSTERY_CARD_POOL[0],
    MYSTERY_CARD_POOL[1],
    MYSTERY_CARD_POOL[2],
  ]);
  const [mysteryPickedIndex, setMysteryPickedIndex] = useState<number | null>(null);

  // Mini-Game 4: Rapid Jackpot Repeater Chance (YES / NO)
  const [repeaterActive, setRepeaterActive] = useState<boolean>(false);
  const [repeaterYesLit, setRepeaterYesLit] = useState<boolean>(false);
  const [pendingJackpotWin, setPendingJackpotWin] = useState<number>(0);
  const repeaterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Automatically transition stageView into 'FEATURE_BOARD' when inFeatureBoard activates
  useEffect(() => {
    if (inFeatureBoard) {
      setIsPeekingBoard(false);
      setStageView('FEATURE_BOARD');
    } else if (!step4BonusBanner && !skillStopperActive) {
      setStageView('BASE_REELS');
    }
  }, [inFeatureBoard, step4BonusBanner, skillStopperActive]);

  // Cleanup active timers on unmount
  useEffect(() => {
    return () => {
      if (stopperTimerRef.current) clearTimeout(stopperTimerRef.current);
      if (rouletteTimerRef.current) clearInterval(rouletteTimerRef.current);
      if (repeaterTimerRef.current) clearInterval(repeaterTimerRef.current);
    };
  }, []);

  // Fullscreen Immersive Mode state & handlers
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    pulseVibrate(15);
    const next = !isFullscreen;
    setIsFullscreen(next);

    if (next) {
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          (document.documentElement as any).webkitRequestFullscreen();
        }
      } catch {}
    } else {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitFullscreenElement) {
          (document as any).webkitExitFullscreen();
        }
      } catch {}
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Retro Amber LED Dot-Matrix Display & Oracle Future Predictions
  const [spinsUntilBoard] = useState<number>(4);
  const [dotMatrixCycle, setDotMatrixCycle] = useState<number>(0);

  // Win splash popup & messages
  const [winAmount, setWinAmount] = useState<number>(0);
  const [winTitle, setWinTitle] = useState<string>('');
  const [winSubtitle, setWinSubtitle] = useState<string | undefined>(undefined);
  const [winDetail, setWinDetail] = useState<string | undefined>(undefined);
  const [winBadge, setWinBadge] = useState<string | undefined>(undefined);
  const [tickerMessage, setTickerMessage] = useState<string>(
    cartridge.theme.defaultTickerMessage
  );
  const [aiHostessComment, setAiHostessComment] = useState<string>(
    cartridge.theme.hostess.defaultComment
  );
  const [, setIsAiThinking] = useState<boolean>(false);

  // Periodically cycle the retro dot-matrix message board between status, tips, and future predictions
  useEffect(() => {
    const cycleTimer = setInterval(() => {
      setDotMatrixCycle((prev) => prev + 1);
    }, 3500);
    return () => clearInterval(cycleTimer);
  }, []);

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
    if ((holdsAvailable || mysteryCardsActive) && soundOn && !isSpinning) {
      const interval = setInterval(() => {
        playPubHoldBeep();
      }, 1400);
      return () => clearInterval(interval);
    }
  }, [holdsAvailable, mysteryCardsActive, soundOn, isSpinning]);

  // AI Dealer commentary
  const triggerAiComment = async (event: string, detail: string) => {
    setIsAiThinking(true);
    try {
      const comment = await fetchDealerComment({
        game: cartridge.theme.hostess.aiGameContext,
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

  // ==============================================================
  // HARMONIC RECOIL BOUNCE (Damped Spring Stepper Motor Physics)
  // ==============================================================
  const triggerHarmonicRecoil = (rIdx: number) => {
    playPubNudgeThud();
    pulseVibrate(15);
    triggerHaptic('step');

    // Phase 1: Initial downward mechanical overshoot (+10px)
    setRecoilOffsets((prev) => {
      const next = [...prev];
      next[rIdx] = 10;
      return next;
    });

    // Phase 2: Upward spring rebound (-5px)
    setTimeout(() => {
      setRecoilOffsets((prev) => {
        const next = [...prev];
        next[rIdx] = -5;
        return next;
      });
    }, 65);

    // Phase 3: Secondary micro-overshoot (+2px)
    setTimeout(() => {
      setRecoilOffsets((prev) => {
        const next = [...prev];
        next[rIdx] = 2;
        return next;
      });
    }, 130);

    // Phase 4: Settle at equilibrium (0px)
    setTimeout(() => {
      setRecoilOffsets((prev) => {
        const next = [...prev];
        next[rIdx] = 0;
        return next;
      });
    }, 190);
  };

  // Toggle [PEEK BOARD] pill
  const handleTogglePeekBoard = () => {
    pulseVibrate(15);
    playPubHoldBeep();
    if (stageView === 'BASE_REELS') {
      setIsPeekingBoard(true);
      setStageView('FEATURE_BOARD');
    } else {
      setIsPeekingBoard(false);
      setStep4BonusBanner(null);
      setStageView('BASE_REELS');
    }
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
      mysteryCardsActive ||
      repeaterActive
    )
      return;

    pulseVibrate(15);

    // Ensure central stage is in BASE_REELS when spinning
    setIsPeekingBoard(false);
    setStep4BonusBanner(null);
    setStageView('BASE_REELS');

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
    const currentTrail = trailHeld ? trailStep : 0;
    setTrailHeld(false);

    // If Hold After Nudge was executed, reward identical payout directly!
    if (wasHAN) {
      setTimeout(() => {
        setIsSpinning(false);
        setSpinningReels([false, false, false]);
        const centerSym = getReelSymbols(0, tapeIndices[0])[1];
        const hanPayout = centerSym.payout3 * stake;
        playWinSound();
        pulseVibrate(15);
        setWinTitle('🔥 HOLD AFTER NUDGE (HAN) EXPLOIT! 🔥');
        setWinSubtitle(`Repeated 3x ${centerSym.name} on the payline`);
        setWinDetail(`Hold After Nudge exploit paid ${centerSym.payout3}x stake (+£${hanPayout})`);
        setWinBadge('⚡ HAN EXPLOIT');
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

    // Stop Reel 0 with harmonic recoil bounce (750ms)
    setTimeout(() => {
      if (spin0) {
        playSlotStop();
        triggerHarmonicRecoil(0);
      }
      setSpinningReels((prev) => [false, prev[1], prev[2]]);
    }, 750);

    // Stop Reel 1 with harmonic recoil bounce (1250ms)
    setTimeout(() => {
      if (spin1) {
        playSlotStop();
        triggerHarmonicRecoil(1);
      }
      setSpinningReels((prev) => [false, false, prev[2]]);
    }, 1250);

    // Stop Reel 2 with harmonic recoil bounce (1750ms)
    setTimeout(() => {
      clearInterval(stepInterval);
      if (spin2) {
        playSlotStop();
        triggerHarmonicRecoil(2);
      }
      setSpinningReels([false, false, false]);
      setIsSpinning(false);

      // Final landing positions governed by MPU4 compensated ledger
      const target0 = spin0 ? Math.floor(Math.random() * REEL_TAPE_0.length) : tapeIndices[0];
      const target1 = spin1 ? Math.floor(Math.random() * REEL_TAPE_1.length) : tapeIndices[1];
      const target2 = spin2 ? Math.floor(Math.random() * REEL_TAPE_2.length) : tapeIndices[2];

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
        setWinTitle('🏆 £100 TROPHY DIRECT JACKPOT! 🏆');
        setWinSubtitle('3x EPT Vegas Trophies lined up on the payline');
        setWinDetail(`Top payout: 100x stake (+£${jackpotWin})`);
        setWinBadge('🏆 DIRECT JACKPOT');
        setWinAmount(jackpotWin);
        onUpdateBankroll(jackpotWin);
        setTotalOut((prev) => prev + jackpotWin);
        setStageView('FEATURE_BOARD');
        triggerRepeaterChance(jackpotWin);
        return;
      }

      if (c0.id === 'edward_boss' && c1.id === 'edward_boss' && c2.id === 'edward_boss') {
        playPubFeatureFanfare();
        setInFeatureBoard(true);
        setStageView('FEATURE_BOARD');
        setBoardPosition(8); // Land directly on Edward's Pit Boss corner
        setSecurityPosition(4); // Spawn crimson SECURITY chaser at top-right corner
        securityPositionRef.current = 4;
        setPotCash(20 * stake);
        setExtraLives(1);
        extraLivesRef.current = 1;
        setEqualWinsTurns(3); // Landing on PIT BOSS grants 3 turns of EQUAL WINS!
        setTickerMessage('★ DIRECT LINE-UP ENTRY! PIT BOSS UNLOCKED BOARD + EQUAL WINS (3 TURNS)! ★');
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
          `★ WIN £${winPayout}! PRESS [START] TO EXCHANGE INTO MONOPOLY BOARD OR [COLLECT] CASH! ★`
        );
        return;
      }

      // Pathway A: Numbered Reel Trail (1 to 8)
      const sumNums = num0 + num1 + num2;
      const newTrail = currentTrail + sumNums;

      if (sumNums > 0) {
        playPubHiLoBeep(true);
        setTickerMessage(`+${sumNums} NUMBERS ADDED! TRAIL ADVANCED TO STEP ${newTrail}/8`);
      } else {
        setTickerMessage('NO NUMBERS ON WINLINE. CHECK FOR HOLDS OR NUDGES!');
      }

      if (newTrail >= 8) {
        // Instant smooth transition to full 5x5 MONOPOLY VEGAS STRIP board grid!
        playPubFeatureFanfare();
        setInFeatureBoard(true);
        setStageView('FEATURE_BOARD');
        setBoardPosition(0); // Start at GO!
        setSecurityPosition(4); // Spawn crimson SECURITY chaser at top-right corner
        securityPositionRef.current = 4;
        setExtraLives(1);
        extraLivesRef.current = 1;
        setEqualWinsTurns(3); // Starting on GO grants 3 turns of EQUAL WINS!
        setPotCash(2 * stake);
        setTrailStep(0);
        setTickerMessage('🎯 STEP 8 HIT! MONOPOLY BOARD ACTIVE • SECURITY CHASER ARMED AT CORNER!');
        triggerAiComment('feature_board', 'Player completed the 8-step number trail and unlocked the Monopoly board!');
      } else {
        setTrailStep(newTrail);

        // Instant smooth transition into the 5x5 MONOPOLY VEGAS STRIP board grid on Bonus Step 4!
        if (newTrail >= 4 && currentTrail < 4) {
          playPubFeatureFanfare();
          handleReelBonus(newTrail, num0 + num1 + num2);
          return;
        }

        // Trail Held Mechanic (only if in Giving or high trail)
        if (newTrail >= 6 && (machineMode === 'GIVING' || Math.random() < 0.25)) {
          setTrailHeld(true);
          playPubHoldBeep();
          setTickerMessage(`★ TRAIL HELD AT STEP ${newTrail}! NEXT SPIN ADDS ON! ★`);
        }

        // Random Holds or Nudges award
        const rand = Math.random();
        if (rand < (machineMode === 'GIVING' ? 0.2 : machineMode === 'TIGHT' ? 0.05 : 0.12)) {
          setHoldsAvailable(true);
          playPubHoldBeep();
          setTickerMessage('★ HOLD LIGHTS ACTIVE! LOCK IN PAIRS OR HIGH NUMBERS! ★');
        } else if (rand < (machineMode === 'GIVING' ? 0.35 : machineMode === 'TIGHT' ? 0.1 : 0.18)) {
          const count = machineMode === 'GIVING' ? Math.floor(Math.random() * 2) + 2 : 1;
          setNudgesRemaining(count);
          playPubFeatureFanfare();
          setTickerMessage(`★ ${count} STEPPER NUDGE${count > 1 ? 'S' : ''} AWARDED! STEP A REEL DOWN! ★`);
        }
      }
    }, 1800);
  };

  // Bonus at Trail Step 4 — Smoothly transitions central stage into the 5x5 MONOPOLY VEGAS STRIP board
  const handleReelBonus = (baseTrail: number, sumAdded: number) => {
    const bonuses = cartridge.reelBonuses;
    const chosen = bonuses[Math.floor(Math.random() * bonuses.length)];
    setTickerMessage(`⚡ STEP 4 TRAIL BONUS: ${chosen}!`);
    setStageView('FEATURE_BOARD');
    setStep4BonusBanner(chosen);

    if (chosen.includes('+2')) {
      const boosted = Math.min(baseTrail + 2, 8);
      setTrailStep(boosted);
      if (boosted >= 8) {
        setInFeatureBoard(true);
        setBoardPosition(0);
        setSecurityPosition(4);
        securityPositionRef.current = 4;
        setExtraLives(1);
        extraLivesRef.current = 1;
        setEqualWinsTurns(3);
        setPotCash(2 * stake);
        setTrailStep(0);
        setStep4BonusBanner(null);
        setTickerMessage('🎯 TURBAN BOOST HIT STEP 8! MONOPOLY BOARD UNLOCKED!');
      } else {
        setTrailHeld(true);
      }
    } else if (chosen.includes('ADD AGAIN')) {
      const boosted = Math.min(baseTrail + sumAdded, 8);
      setTrailStep(boosted);
      if (boosted >= 8) {
        setInFeatureBoard(true);
        setBoardPosition(0);
        setSecurityPosition(4);
        securityPositionRef.current = 4;
        setExtraLives(1);
        extraLivesRef.current = 1;
        setEqualWinsTurns(3);
        setPotCash(2 * stake);
        setTrailStep(0);
        setStep4BonusBanner(null);
        setTickerMessage('🎯 ADD AGAIN HIT STEP 8! MONOPOLY BOARD UNLOCKED!');
      } else {
        setTrailHeld(true);
      }
    } else if (chosen.includes('SKILL STOPPER')) {
      setTrailHeld(true);
      launchSkillStopper('STEP 4 SKILL STOPPER');
    } else {
      // DAVE B RE-SPIN CHANCE: Hold trail + award 2 nudges
      setTrailHeld(true);
      setNudgesRemaining(2);
    }
  };

  // Exchange or Collect cash
  const handleExchangeCollectCash = () => {
    if (!exchangePending) return;
    pulseVibrate(15);
    const { amount, description } = exchangePending;
    onUpdateBankroll(amount);
    setTotalOut((prev) => prev + amount);
    setWinTitle('🍻 WINLINE CASH COLLECTED! 🍻');
    setWinSubtitle(`Matched ${description}`);
    setWinDetail(`Reel winline paid +£${amount}`);
    setWinBadge('💰 WINLINE');
    setWinAmount(amount);
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
    pulseVibrate(15);
    setTickerMessage('EXCHANGE ENGAGED! WELCOME TO THE MONOPOLY BOARD!');
    setHiLoCurrent(7);
    setInFeatureBoard(true);
    setStageView('FEATURE_BOARD');
    setBoardPosition(0);
    setSecurityPosition(4); // Spawn crimson SECURITY chaser at top-right corner
    securityPositionRef.current = 4;
    setPotCash(exchangePending.amount * 2);
    setExtraLives(1);
    extraLivesRef.current = 1;
    setEqualWinsTurns(3);
    setExchangePending(null);
    playPubFeatureFanfare();
    triggerAiComment('exchange', 'Player exchanged a cash win to gamble for the Monopoly board!');
  };

  // Reel Holds
  const toggleHold = (reelIndex: number) => {
    if (!holdsAvailable || isSpinning) return;
    pulseVibrate(15);
    playPubHoldBeep();
    setHeldReels((prev) => {
      const next = [...prev];
      next[reelIndex] = !next[reelIndex];
      return next;
    });
  };

  const handleCancel = () => {
    pulseVibrate(15);
    playPubNudgeThud();
    if (holdsAvailable) {
      setHeldReels([false, false, false]);
      setHoldsAvailable(false);
      setTickerMessage('HOLDS CANCELLED.');
    } else if (
      inFeatureBoard &&
      !isWalkingBoard &&
      !isRollingHiLo &&
      !skillStopperActive &&
      !reelRouletteActive &&
      !mysteryCardsActive
    ) {
      handleWinOrBust();
    }
  };

  // Nudges & Auto Nudge
  const handleNudge = (reelIndex: number) => {
    if (nudgesRemaining <= 0 || isSpinning) return;
    setStageView('BASE_REELS');
    triggerHarmonicRecoil(reelIndex);
    setNudgesRemaining((prev) => prev - 1);

    setTapeIndices((prev) => {
      const next = [...prev];
      const maxLen =
        reelIndex === 0 ? REEL_TAPE_0.length : reelIndex === 1 ? REEL_TAPE_1.length : REEL_TAPE_2.length;
      next[reelIndex] = (next[reelIndex] + 1) % maxLen;
      return next;
    });

    setTimeout(() => {
      checkWinlineWinAfterNudge();
    }, 150);
  };

  const handleAutoNudge = () => {
    if (nudgesRemaining <= 0 || isSpinning) return;
    pulseVibrate(15);
    setStageView('BASE_REELS');
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
      pulseVibrate(15);
      setWinTitle('🍻 NUDGED TO PERFECTION! 🍻');
      setWinSubtitle(`3x ${c0.name} aligned via manual nudges`);
      setWinDetail(`Payline combo paid ${c0.payout3}x stake (+£${payout})`);
      setWinBadge('🍻 NUDGE WIN');
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
  // CRIMSON SECURITY CHASER: Steps 1–2 tiles clockwise after every Hi-Lo roll
  // Consumes 1 Life if it catches the player!
  // ==============================================================
  const stepSecurityChaser = (playerTargetTile: number, landedMiniGame: boolean) => {
    const secSteps = Math.random() < 0.5 ? 1 : 2;
    const startSec = securityPositionRef.current;
    const step1Pos = (startSec + 1) % MONOPOLY_SQUARES.length;
    const finalSecPos = (startSec + secSteps) % MONOPOLY_SQUARES.length;

    // Step 1
    setTimeout(() => {
      setSecurityPosition(step1Pos);
      securityPositionRef.current = step1Pos;

      // Step 2 (if 2 steps) or evaluate catch
      setTimeout(() => {
        setSecurityPosition(finalSecPos);
        securityPositionRef.current = finalSecPos;

        const caughtOnStep1 = step1Pos === playerTargetTile;
        const caughtOnFinal = finalSecPos === playerTargetTile;

        if (caughtOnStep1 || caughtOnFinal) {
          pulseVibrate(15);
          triggerHaptic('bust');
          playPubHiLoBeep(false);
          setSecurityAlertFlash(true);
          setTimeout(() => setSecurityAlertFlash(false), 1200);

          if (extraLivesRef.current > 0) {
            extraLivesRef.current = Math.max(0, extraLivesRef.current - 1);
            setExtraLives(extraLivesRef.current);
            if (!landedMiniGame) {
              setTickerMessage(
                `🚨 SECURITY CHASER CAUGHT YOU AT ${MONOPOLY_SQUARES[playerTargetTile].title}! CONSUMED 1 LIFE (-1 ❤️)!`
              );
            }
          } else {
            // Even at 0 lives, clamp extraLives at 0 and alert the player
            setExtraLives(0);
            if (!landedMiniGame) {
              setTickerMessage(
                `🚨 SECURITY CHASER PATROLLED ${MONOPOLY_SQUARES[playerTargetTile].title}! WATCH YOUR LIVES! 🚨`
              );
            }
          }
        }
      }, secSteps === 2 ? 140 : 20);
    }, 140);
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
      mysteryCardsActive ||
      repeaterActive
    )
      return;

    pulseVibrate(15);
    setStageView('FEATURE_BOARD');
    setIsRollingHiLo(true);
    setTickerMessage('DICE ROLLING... SUSPENSE IN THE AIR!');

    // Capture whether Equal Wins is active for this roll, then decrement remaining Equal Wins turns
    const hadEqualWins = equalWinsTurns > 0;
    if (hadEqualWins) {
      setEqualWinsTurns((prev) => Math.max(0, prev - 1));
    }

    let rollCount = 0;
    const rollInterval = setInterval(() => {
      playSlotTick();
      setHiLoCurrent(Math.floor(Math.random() * 12) + 1);
      rollCount++;

      if (rollCount >= 5) {
        clearInterval(rollInterval);
        setIsRollingHiLo(false);

        let nextRoll = Math.floor(Math.random() * 12) + 1;
        const prevRoll = hiLoCurrent;

        if (machineMode === 'TIGHT' && Math.random() < 0.45) {
          if (prevRoll <= 4) nextRoll = 1;
          else if (prevRoll >= 9) nextRoll = 12;
          else nextRoll = 7;
        }

        setHiLoCurrent(nextRoll);

        let isWin = false;
        let isEqualWinHit = false;
        if (nextRoll === prevRoll) {
          if (hadEqualWins) {
            isWin = true;
            isEqualWinHit = true;
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
          pulseVibrate(15);
          triggerHaptic('deal');
          const steps = nextRoll;
          if (isEqualWinHit) {
            setTickerMessage(
              `★ EQUAL NUMBER (${nextRoll})! EQUAL WINS ACTIVE — ADVANCING ${nextRoll} SQUARES! ★`
            );
          } else {
            setTickerMessage(
              `★ HI-LO ROLLED ${nextRoll}! ADVANCING ${nextRoll} SQUARES AROUND THE STRIP! ★`
            );
          }
          animateTokenWalk(steps, nextRoll);
        } else {
          if (extraLivesRef.current > 0) {
            playPubHiLoBeep(false);
            pulseVibrate(15);
            triggerHaptic('deal');
            extraLivesRef.current = Math.max(0, extraLivesRef.current - 1);
            setExtraLives(extraLivesRef.current);
            setTickerMessage(`WRONG GUESS (${nextRoll})! EXTRA LIFE SAVED YOUR MONOPOLY RUN! ❤️`);
            // Crimson SECURITY chaser still steps 1–2 tiles clockwise after the Hi-Lo roll
            stepSecurityChaser(boardPosition, false);
          } else {
            triggerHaptic('bust');
            pulseVibrate(15);
            playPubHiLoBeep(false);
            const lostPot = potCash;
            setPotCash(0);
            setInFeatureBoard(false);
            setCashLadderStep(-1);
            setEqualWinsTurns(0);
            setTickerMessage(`☠️ BUSTED! WRONG GUESS (${nextRoll}) — LOST ALL £${lostPot} COLLECTED POT! BAR CLOSED.`);
            addGameHistory({
              gameId: 'pub-fruity',
              headline: 'Busted on Feature Board',
              detail: `Wrong guess (${nextRoll}) • Lost all £${lostPot} collected pot`,
              delta: 0,
              badge: '💀 BUSTED',
            });
            triggerAiComment(
              'feature_lost',
              `Player went bust on Hi-Lo and lost all £${lostPot} collected cash! That's the pub fruit machine for you, mate!`
            );
          }
        }
      }
    }, 75);
  };

  // Animate the token walking square-by-square around the perimeter
  const animateTokenWalk = (totalSteps: number, rollNum: number) => {
    setIsWalkingBoard(true);
    let step = 0;
    let currPos = boardPosition;
    let passedGoDuringWalk = false;

    const walkInterval = setInterval(() => {
      step++;
      const prev = currPos;
      currPos = (currPos + 1) % MONOPOLY_SQUARES.length;
      setBoardPosition(currPos);
      playWheelTick();
      pulseVibrate(15);
      triggerHaptic('step');

      // Passing GO reward (£2 pocket money + EQUAL WINS for 3 turns!)
      if (prev === 15 && currPos === 0) {
        passedGoDuringWalk = true;
        const goBonus = 2 * stake;
        setPotCash((p) => p + goBonus);
        setEqualWinsTurns(3);
        playWinSound();
        triggerHaptic('win');
        setTickerMessage(`★ PASSED GO! +£${goBonus} POCKET MONEY & EQUAL WINS FOR 3 TURNS! ★`);
      }

      if (step >= totalSteps) {
        clearInterval(walkInterval);
        setIsWalkingBoard(false);
        playPubNudgeThud();
        pulseVibrate(15);
        evaluateSquareLanding(currPos, rollNum, passedGoDuringWalk);
      }
    }, 220);
  };

  // Evaluate the square landed on, then step the Crimson SECURITY chaser 1–2 tiles clockwise
  const evaluateSquareLanding = (pos: number, _rollNum: number, passedGoDuringWalk = false) => {
    const sq = MONOPOLY_SQUARES[pos];
    setCashLadderStep((prev) => Math.min(prev + 1, CASH_LADDER.length - 1));
    triggerHaptic('deal');

    let triggersMiniGame = false;

    if (sq.type === 'go') {
      const added = sq.val * stake;
      setPotCash((prev) => prev + added);
      setEqualWinsTurns(3); // Passing or landing on GO grants EQUAL WINS for 3 turns!
      playWinSound();
      triggerHaptic('win');
      setTickerMessage(`★ LANDED ON GO! +£${added} CASH & EQUAL WINS FOR 3 TURNS! ★`);
    } else if (sq.type === 'parking') {
      // Landing on PIT BOSS (Free Parking corner, id 8) converts EQUAL LOSES to EQUAL WINS for 3 turns!
      const added = sq.val * stake;
      setPotCash((prev) => prev + added);
      setEqualWinsTurns(3);
      playWinSound();
      triggerHaptic('win');
      setTickerMessage(`★ LANDED ON [PIT BOSS]! +£${added} POT & EQUAL WINS FOR 3 TURNS! ★`);
    } else if (sq.type === 'cash') {
      const added = sq.val * stake;
      setPotCash((prev) => prev + added);
      playWinSound();
      triggerHaptic('win');
      setTickerMessage(
        passedGoDuringWalk
          ? `★ LANDED ON [${sq.title}] (+£${added}) • EQUAL WINS ACTIVE (3 TURNS)! ★`
          : `LANDED ON [${sq.title}] (${sq.subtext})! +£${added} ADDED TO POT!`
      );
    } else if (sq.type === 'nudge') {
      setNudgesRemaining((prev) => prev + sq.val);
      playPubFeatureFanfare();
      triggerHaptic('win');
      setTickerMessage(`LANDED ON [${sq.title}]! +${sq.val} STEPPER NUDGE BANKED!`);
    } else if (sq.type === 'life') {
      extraLivesRef.current += 1;
      setExtraLives(extraLivesRef.current);
      playPubFeatureFanfare();
      triggerHaptic('win');
      setTickerMessage(`★ LANDED ON [${sq.title}]! +1 EXTRA LIFE AWARDED ❤️! ★`);
    } else if (sq.type === 'skill' || sq.type === 'repeat') {
      // 3. Cash Frenzy (Repeat): Rapidly bounce highlight across Horizontal Cash Ribbon (Skill Cash Stopper)
      triggersMiniGame = true;
      launchSkillStopper(sq.type === 'repeat' ? 'CASH FRENZY (REPEAT)' : 'SKILL CASH STOPPER');
    } else if (sq.type === 'roulette') {
      // 1. Skill Wheel (Roulette): Strobe highlight border around 16 perimeter tiles at 65ms per step
      triggersMiniGame = true;
      launchReelRoulette();
    } else if (sq.type === 'mystery') {
      // 2. Mystery Cards (Magician Chris Daly): 3 cards in 3x3 centre mapped to HOLD 1, HOLD 2, HOLD 3
      triggersMiniGame = true;
      launchMysteryCards();
    } else if (sq.type === 'hazard') {
      handleHazardSquare();
      return;
    } else if (sq.type === 'jackpot') {
      triggersMiniGame = true;
      const jWin = 100 * stake;
      setPotCash((prev) => prev + jWin);
      playJackpotSound();
      triggerHaptic('jackpot');
      setTickerMessage('💥 £100 BOARDWALK JACKPOT HIT! 💥');
      triggerRepeaterChance(jWin);
    } else {
      setTickerMessage(`LANDED ON [${sq.title}] (${sq.subtext})!`);
    }

    // Step the crimson SECURITY chaser 1–2 tiles clockwise after this Hi-Lo roll
    stepSecurityChaser(pos, triggersMiniGame);
  };

  // 50/50 Win or Bust Gamble on Upper Board
  const handleWinOrBust = () => {
    if (
      !inFeatureBoard ||
      isWalkingBoard ||
      isRollingHiLo ||
      skillStopperActive ||
      reelRouletteActive ||
      mysteryCardsActive ||
      repeaterActive
    )
      return;

    pulseVibrate(15);
    const won = Math.random() < 0.5;

    if (won) {
      const cashSquares = MONOPOLY_SQUARES.filter((s) => s.val > 0);
      const chosen = cashSquares[Math.floor(Math.random() * cashSquares.length)];
      const wonPrize = chosen.val * stake;
      const totalCashout = potCash + wonPrize;

      onUpdateBankroll(totalCashout);
      setTotalOut((prev) => prev + totalCashout);
      playJackpotSound();
      triggerHaptic('jackpot');

      setWinTitle('⚡ 50/50 WIN OR BUST: JACKPOT! ⚡');
      setWinSubtitle(`Gamble Succeeded! Won ${chosen.title} (${chosen.priceTag})`);
      setWinDetail(`Won £${wonPrize} random board award + £${potCash} pot = £${totalCashout} Cashed Out!`);
      setWinBadge('⚡ 50/50 WINNER');
      setWinAmount(totalCashout);

      setInFeatureBoard(false);
      setPotCash(0);
      setCashLadderStep(-1);
      setEqualWinsTurns(0);
      setTickerMessage(`🎉 50/50 WON! HIT ${chosen.title} (+£${wonPrize}) + £${potCash} POT! BANKED £${totalCashout}!`);
      addGameHistory({
        gameId: 'pub-fruity',
        headline: 'Win or Bust: 50/50 Won!',
        detail: `Hit ${chosen.title} (+£${wonPrize}) • Banked £${totalCashout}`,
        delta: totalCashout,
        badge: '⚡ 50/50 WIN',
      });
      triggerAiComment(
        'big_win',
        `Cor blimey! Took the 50/50 Win or Bust gamble and won £${totalCashout}! High roller moves!`
      );
    } else {
      const lostPot = potCash;
      triggerHaptic('bust');
      playPubHiLoBeep(false);
      setPotCash(0);
      setInFeatureBoard(false);
      setCashLadderStep(-1);
      setEqualWinsTurns(0);
      setTickerMessage(`💀 50/50 BUSTED! LOST ALL £${lostPot} ACCUMULATED POT! TOTAL WIPEOUT!`);
      addGameHistory({
        gameId: 'pub-fruity',
        headline: 'Win or Bust: Busted!',
        detail: `Lost all £${lostPot} collected cashpot`,
        delta: 0,
        badge: '💀 BUSTED',
      });
      triggerAiComment(
        'feature_lost',
        `Gave it a go on 50/50 Win or Bust and lost £${lostPot}! Better luck next time, guv'nor!`
      );
    }
  };

  // Hazard Square (GO TO JAIL)
  const handleHazardSquare = () => {
    if (extraLivesRef.current > 0) {
      extraLivesRef.current = Math.max(0, extraLivesRef.current - 1);
      setExtraLives(extraLivesRef.current);
      triggerHaptic('deal');
      setTickerMessage('GO TO JAIL TRAP! EXTRA LIFE SAVED YOU FROM ARREST (-1 ❤️)!');
      stepSecurityChaser(boardPosition, false);
    } else {
      triggerHaptic('bust');
      playPubHiLoBeep(false);
      const lostPot = potCash;
      setPotCash(0);
      setInFeatureBoard(false);
      setCashLadderStep(-1);
      setEqualWinsTurns(0);
      setTickerMessage(`☠️ SENT TO JAIL! HAZARD PIT WIPED ALL £${lostPot} COLLECTED CASH! BUSTED.`);
      addGameHistory({
        gameId: 'pub-fruity',
        headline: 'Arrested in Jail Hazard',
        detail: `Lost all £${lostPot} collected cashpot`,
        delta: 0,
        badge: '☠️ ARRESTED',
      });
    }
  };

  // ==============================================================
  // MINI-GAME 2: MAGICIAN CHRIS DALY'S MYSTERY CARDS
  // 3 Mystery Cards inside the 3x3 centre panel mapped to [HOLD 1], [HOLD 2], [HOLD 3]
  // Outcomes: +2 Cash Rungs, +1 Life, Instant £25 Pot, or Jail
  // ==============================================================
  const launchMysteryCards = () => {
    // Shuffle the 4 outcomes and deal 3 cards
    const shuffled = [...MYSTERY_CARD_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
    setMysteryDeck(shuffled);
    setMysteryPickedIndex(null);
    setMysteryCardsActive(true);
    setStageView('FEATURE_BOARD');
    playPubFeatureFanfare();
    setTickerMessage(
      '🔮 CHRIS DALY MYSTERY CARDS! PRESS [HOLD 1], [HOLD 2], OR [HOLD 3] BELOW TO PICK A CARD! ★'
    );
  };

  const handlePickMysteryCard = (cardIdx: 0 | 1 | 2) => {
    if (!mysteryCardsActive || mysteryPickedIndex !== null) return;
    pulseVibrate(15);
    playPubHoldBeep();
    setMysteryPickedIndex(cardIdx);

    const picked = mysteryDeck[cardIdx] || MYSTERY_CARD_POOL[0];

    if (picked.id === 'rungs_2') {
      const nextRung = Math.min(Math.max(0, cashLadderStep) + 2, CASH_LADDER.length - 1);
      const rungBonus = CASH_LADDER[nextRung] * stake;
      setCashLadderStep(nextRung);
      setPotCash((prev) => prev + rungBonus);
      playWinSound();
      triggerHaptic('win');
      setTickerMessage(
        `🔮 CARD #${cardIdx + 1}: +2 CASH RUNGS! ADVANCED TO £${CASH_LADDER[nextRung]} (+£${rungBonus} POT)! ★`
      );
    } else if (picked.id === 'life_1') {
      extraLivesRef.current += 1;
      setExtraLives(extraLivesRef.current);
      playPubFeatureFanfare();
      triggerHaptic('win');
      setTickerMessage(`🔮 CARD #${cardIdx + 1}: +1 EXTRA LIFE AWARDED ❤️! ★`);
    } else if (picked.id === 'pot_25') {
      const instantBonus = 25 * stake;
      setPotCash((prev) => prev + instantBonus);
      playJackpotSound();
      triggerHaptic('win');
      setTickerMessage(`🔮 CARD #${cardIdx + 1}: INSTANT +£${instantBonus} CASH POT AWARDED! 💰 ★`);
    } else if (picked.id === 'jail') {
      // Move token to SECURITY / JAIL corner (tile 4)
      setBoardPosition(4);
      if (extraLivesRef.current > 0) {
        extraLivesRef.current = Math.max(0, extraLivesRef.current - 1);
        setExtraLives(extraLivesRef.current);
        playPubHiLoBeep(false);
        triggerHaptic('deal');
        setTickerMessage(
          `🔮 CARD #${cardIdx + 1}: JAIL! SENT TO SECURITY CORNER — EXTRA LIFE SAVED YOU (-1 ❤️)! 🚨`
        );
      } else {
        triggerHaptic('bust');
        playPubHiLoBeep(false);
        const lostPot = potCash;
        setTickerMessage(`☠️ CARD #${cardIdx + 1}: JAIL! ARRESTED WITH 0 LIVES — LOST £${lostPot} POT!`);
        setTimeout(() => {
          setMysteryCardsActive(false);
          setMysteryPickedIndex(null);
          setPotCash(0);
          setInFeatureBoard(false);
          setCashLadderStep(-1);
          setEqualWinsTurns(0);
        }, 1050);
        return;
      }
    }

    // Keep revealed cards visible for 1.1s before returning to Hi-Lo courtyard HUD
    setTimeout(() => {
      setMysteryCardsActive(false);
      setMysteryPickedIndex(null);
    }, 1100);
  };

  // ==============================================================
  // MINI-GAME 3: CASH FRENZY (REPEAT) / SKILL CASH STOPPER
  // Rapidly bounces highlight across the Horizontal Cash Ribbon controlled by [START]
  // ==============================================================
  const launchSkillStopper = (label = 'CASH FRENZY (REPEAT)') => {
    if (stopperTimerRef.current) clearTimeout(stopperTimerRef.current);
    setSkillStopperLabel(label);
    setSkillStopperActive(true);
    setStageView('FEATURE_BOARD');
    setTickerMessage(`⚡ ${label}! RAPID CASH RIBBON BOUNCE — TAP [START] BELOW TO LOCK PRIZE! ⚡`);

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

      let delay = 58;
      if (current >= 8) delay = 28;
      else if (current >= 6) delay = 36;
      else if (current >= 3) delay = 46;

      stopperTimerRef.current = setTimeout(runStep, delay);
    };

    stopperTimerRef.current = setTimeout(runStep, 58);
  };

  const handleStopSkillCash = () => {
    if (!skillStopperActive) return;
    pulseVibrate(15);
    if (stopperTimerRef.current) clearTimeout(stopperTimerRef.current);
    setSkillStopperActive(false);

    let finalRung = stopperHighlightRung;
    if (machineMode === 'TIGHT' && finalRung === CASH_LADDER.length - 1) {
      finalRung = CASH_LADDER.length - 2;
      setTickerMessage('SLIPPED BY 1 RUNG! FROZEN ON £70!');
    } else {
      setTickerMessage(`★ ${skillStopperLabel} FROZEN ON £${CASH_LADDER[finalRung]}! ★`);
    }

    const wonCash = CASH_LADDER[finalRung] * stake;
    playWinSound();
    setCashLadderStep(finalRung);

    if (inFeatureBoard) {
      setPotCash((prev) => prev + wonCash);
    } else {
      onUpdateBankroll(wonCash);
      setTotalOut((prev) => prev + wonCash);
      setWinTitle('⚡ SKILL CASH STOPPER WON! ⚡');
      setWinSubtitle(`Stopped on Cash Ribbon Rung #${finalRung + 1} (£${CASH_LADDER[finalRung]})`);
      setWinDetail(`Paid +£${wonCash} directly to bankroll`);
      setWinBadge('⚡ CASH FRENZY');
      setWinAmount(wonCash);
    }
  };

  // ==============================================================
  // MINI-GAME 1: SKILL WHEEL (ROULETTE)
  // Strobe highlight border around the 16 perimeter tiles at 65ms per step;
  // player taps [START] on bottom thumb deck to freeze on a cash or Extra Life tile.
  // ==============================================================
  const launchReelRoulette = () => {
    if (rouletteTimerRef.current) clearInterval(rouletteTimerRef.current);
    setReelRouletteActive(true);
    setStageView('FEATURE_BOARD');
    setTickerMessage(
      '🎡 SKILL WHEEL ROULETTE! 65MS PERIMETER STROBE — TAP [START] BELOW TO FREEZE ON CASH OR LIFE! 🎡'
    );

    let idx = boardPosition;
    setRouletteIndex(idx);
    rouletteTimerRef.current = setInterval(() => {
      playWheelTick();
      idx = (idx + 1) % MONOPOLY_SQUARES.length;
      setRouletteIndex(idx);
    }, 65);
  };

  const handleStopReelRoulette = () => {
    if (!reelRouletteActive) return;
    pulseVibrate(15);
    if (rouletteTimerRef.current) clearInterval(rouletteTimerRef.current);
    setReelRouletteActive(false);

    // Ensure the wheel freezes cleanly on a Cash or Extra Life perimeter tile
    let targetIdx = rouletteIndex % MONOPOLY_SQUARES.length;
    for (let offset = 0; offset < MONOPOLY_SQUARES.length; offset++) {
      const candidateIdx = (targetIdx + offset) % MONOPOLY_SQUARES.length;
      const candidate = MONOPOLY_SQUARES[candidateIdx];
      const isCashOrLife =
        candidate.type === 'life' ||
        candidate.type === 'cash' ||
        candidate.type === 'go' ||
        candidate.type === 'parking' ||
        candidate.type === 'jackpot';
      if (isCashOrLife) {
        targetIdx = candidateIdx;
        break;
      }
    }

    setRouletteIndex(targetIdx);
    const landedTile = MONOPOLY_SQUARES[targetIdx];

    if (landedTile.type === 'life') {
      extraLivesRef.current += 1;
      setExtraLives(extraLivesRef.current);
      playPubFeatureFanfare();
      triggerHaptic('win');
      setTickerMessage(
        `🎡 SKILL WHEEL FROZEN ON [${landedTile.title}]! AWARDED +1 EXTRA LIFE ❤️! ★`
      );
    } else {
      const prize = Math.max(2, landedTile.val) * stake;
      playWinSound();
      triggerHaptic('win');
      setPotCash((prev) => prev + prize);
      setTickerMessage(
        `🎡 SKILL WHEEL FROZEN ON [${landedTile.title}]! WON +£${prize} TO POT! ★`
      );
    }
  };

  // ==============================================================
  // 8. MINI-GAME 4: RAPID JACKPOT REPEATER (55ms YES/NO)
  // ==============================================================
  const triggerRepeaterChance = (initialJackpot: number) => {
    setPendingJackpotWin(initialJackpot);
    setRepeaterActive(true);
    setTickerMessage('★ JACKPOT HIT! REPEAT CHANCE FLASHING! HIT [START] ON YES! ★');

    let state = false;
    repeaterTimerRef.current = setInterval(() => {
      state = !state;
      setRepeaterYesLit(state);
      playWheelTick();
    }, 55);
  };

  const handleStopRepeater = () => {
    if (!repeaterActive) return;
    pulseVibrate(15);
    if (repeaterTimerRef.current) clearInterval(repeaterTimerRef.current);
    setRepeaterActive(false);

    const wonRepeat =
      machineMode === 'GIVING' ? repeaterYesLit || Math.random() < 0.6 : repeaterYesLit;

    if (wonRepeat) {
      playJackpotSound();
      setWinTitle('🍾 REPEAT CHANCE WON! JACKPOT DOUBLED! 🍾');
      setWinSubtitle('Jackpot Repeater successfully stopped on YES');
      setWinDetail(`Awarded repeat payout +£${pendingJackpotWin}!`);
      setWinBadge('🍾 REPEATER HIT');
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
    if (
      !inFeatureBoard ||
      potCash <= 0 ||
      isWalkingBoard ||
      skillStopperActive ||
      reelRouletteActive ||
      mysteryCardsActive
    )
      return;
    pulseVibrate(15);
    playWinSound();
    onUpdateBankroll(potCash);
    setTotalOut((prev) => prev + potCash);
    setWinTitle('🍻 CASHPOT COLLECTED! 🍻');
    setWinSubtitle('High-Roller Monopoly Feature Banked');
    setWinDetail(`Collected +£${potCash} accrued around the board`);
    setWinBadge('🏦 CASHPOT');
    setWinAmount(potCash);
    setInFeatureBoard(false);
    setCashLadderStep(-1);
    setEqualWinsTurns(0);
    setTickerMessage(`COLLECTED £${potCash} FROM THE BOARD! PROPER JOB GUV'NOR!`);
    triggerAiComment('collect_cash', `Player banked £${potCash} from the high roller feature board!`);
  };

  // Visible reel symbols
  const r0Symbols = getReelSymbols(0, tapeIndices[0]);
  const r1Symbols = getReelSymbols(1, tapeIndices[1]);
  const r2Symbols = getReelSymbols(2, tapeIndices[2]);

  // Companion game tutorial record for fallback drawer
  const pubFruityTutorial = VEGAS_GAMES_CATALOG.find((g) => g.id === 'pub-fruity');

  // Compute Dot-Matrix Ticker message
  const displayedMsg = (() => {
    const isSpecialEvent =
      tickerMessage &&
      (tickerMessage.includes('★') ||
        tickerMessage.includes('🎉') ||
        tickerMessage.includes('☠️') ||
        tickerMessage.includes('💥') ||
        tickerMessage.includes('💀') ||
        tickerMessage.includes('🎯') ||
        tickerMessage.includes('⚡') ||
        tickerMessage.includes('🎡') ||
        tickerMessage.includes('🔮') ||
        tickerMessage.includes('🚨'));

    if (!isSpecialEvent) {
      if (mysteryCardsActive) {
        return '🔮 CHRIS DALY MYSTERY CARDS • TAP [HOLD 1], [HOLD 2], OR [HOLD 3] BELOW! 🔮';
      }
      if (holdsAvailable) {
        return '★ HOLDS ACTIVE! PRESS [HOLD 1-3] TO LOCK WINLINE ICONS! ★';
      }
      if (nudgesRemaining > 0) {
        return `>>> ${nudgesRemaining} NUDGES LOADED! USE STEPPER BUTTONS BELOW TO STEP REELS <<<`;
      }
      if (inFeatureBoard) {
        return '★ MONOPOLY BOARD ACTIVE • USE [HI GAMBLE] / [LO GAMBLE] BELOW! ★';
      }
      const oracleTips = [
        `🔮 ORACLE PREDICTION: IN ${spinsUntilBoard} SPINS YOU WILL GET ON THE BOARD! 🔮`,
        '🔮 ORACLE: NUDGE POTENTIAL DETECTED ON REEL 2! 🔮',
        '🔮 TIP: 3x EDWARD BOSSES TRIGGER DIRECT BOARD ENTRY! 🔮',
        '🔮 TIP: PASSING GO OR LANDING ON PIT BOSS GRANTS EQUAL WINS FOR 3 TURNS! 🔮',
        '🔮 ORACLE: REPEAT CHANCE READY TO STRIKE! 🔮',
      ];
      return oracleTips[dotMatrixCycle % oracleTips.length];
    }
    return tickerMessage;
  })();

  const handleOpenGuideAndTicker = () => {
    pulseVibrate(15);
    if (onOpenGuideTicker) {
      onOpenGuideTicker();
    } else {
      setLocalDrawerOpen(true);
    }
  };

  // Currently highlighted perimeter tile during Skill Wheel Roulette
  const currentRouletteTile = MONOPOLY_SQUARES[rouletteIndex % MONOPOLY_SQUARES.length];

  return (
    /* ============================================================== */
    /* STRICTLY LOCKED PORTRAIT CABINET VIEWPORT CONTAINER            */
    /* ============================================================== */
    <div
      style={{ touchAction: 'manipulation' }}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[90] bg-[#0c0202] flex flex-col justify-between overflow-hidden select-none touch-manipulation font-sans p-1 sm:p-3'
          : 'h-full flex flex-col justify-between overflow-hidden select-none touch-manipulation relative max-w-5xl mx-auto font-sans'
      }
    >
      {/* WIN SPLASH POPUP */}
      {winAmount > 0 && (
        <VegasWinSplash
          title={winTitle}
          subtitle={winSubtitle}
          winDetail={winDetail}
          badge={winBadge}
          winAmount={winAmount}
          onComplete={() => setWinAmount(0)}
        />
      )}

      {/* ============================================================== */}
      {/* 1. COMPACT TOP BAR: Header, Fullscreen Toggle, [PEEK BOARD]    */}
      {/* ============================================================== */}
      <div className="shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#2b0808] via-[#450a0a] to-[#260505] border-2 border-amber-500/80 px-2 py-1 sm:px-3 sm:py-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: Back button + Title & Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {onBackToFloor && (
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onPointerDown={(e) => {
                e.preventDefault();
                pulseVibrate(15);
                onBackToFloor();
              }}
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-black/60 hover:bg-black/90 border border-white/15 text-zinc-300 hover:text-gold transition-transform duration-75 shrink-0 active:scale-95 touch-manipulation"
              title="Back to Casino Floor"
            >
              <ArrowLeft size={13} />
            </button>
          )}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-red-600 text-black flex items-center justify-center font-black shadow border border-white text-sm sm:text-base shrink-0">
            🎩
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h2 className="text-[11px] sm:text-sm font-black text-amber-200 tracking-tight uppercase truncate">
                VEGAS STRIP FRUITY
              </h2>
              <span
                className={`text-[7.5px] sm:text-[9px] font-black uppercase px-1 py-0.1 rounded border shrink-0 ${
                  machineMode === 'GIVING'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-400 animate-pulse'
                    : machineMode === 'TIGHT'
                    ? 'bg-red-950 text-red-300 border-red-500'
                    : 'bg-amber-900/80 text-yellow-300 border-yellow-400'
                }`}
              >
                {machineMode}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[8.5px] sm:text-[10px] text-zinc-300 font-mono truncate">
              <span>
                POT: <strong className="text-yellow-300 font-black">£{potCash}</strong>
              </span>
              <span>•</span>
              <span className="truncate italic text-zinc-400 hidden sm:inline">
                &ldquo;{aiHostessComment}&rdquo;
              </span>
            </div>
          </div>
        </div>

        {/* Right: Fullscreen Toggle, [PEEK BOARD] Toggle Pill, Ticker Drawer & Rules */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* FULLSCREEN TOGGLE BUTTON */}
          <button
            type="button"
            style={{ touchAction: 'manipulation' }}
            onPointerDown={(e) => {
              e.preventDefault();
              toggleFullscreen();
            }}
            className={`px-1.5 sm:px-2.5 py-1 rounded-lg sm:rounded-xl border font-mono font-black text-[8px] sm:text-[10px] uppercase tracking-wider transition-transform duration-75 shadow flex items-center gap-1 active:scale-95 touch-manipulation ${
              isFullscreen
                ? 'bg-amber-400 text-black border-white shadow-[0_0_12px_#fde047]'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/50'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Immersive Mode'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={11} />
                <span className="hidden xs:inline">EXIT FULL</span>
                <span className="xs:hidden">EXIT</span>
              </>
            ) : (
              <>
                <Maximize2 size={11} />
                <span className="hidden xs:inline">FULLSCREEN</span>
                <span className="xs:hidden">FULL</span>
              </>
            )}
          </button>

          {/* COMPACT [PEEK BOARD] TOGGLE PILL */}
          <button
            type="button"
            style={{ touchAction: 'manipulation' }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleTogglePeekBoard();
            }}
            className={`px-1.5 sm:px-2.5 py-1 rounded-lg sm:rounded-xl border font-mono font-black text-[8px] sm:text-[10px] uppercase tracking-wider transition-transform duration-75 shadow flex items-center gap-1 active:scale-95 touch-manipulation ${
              stageView === 'FEATURE_BOARD'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-black border-white shadow-[0_0_12px_#10b981]'
                : 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-400/70'
            }`}
            title="Toggle between Base Stepper Reels and Upper Monopoly Board"
          >
            {stageView === 'BASE_REELS' ? (
              <>
                <Eye size={11} />
                <span className="hidden xs:inline">[PEEK BOARD]</span>
                <span className="xs:hidden">[BOARD]</span>
              </>
            ) : (
              <>
                <RotateCcw size={11} />
                <span>[REELS]</span>
              </>
            )}
          </button>

          {/* Compact Guide & Ticker Slide-Over Drawer Button */}
          <button
            type="button"
            style={{ touchAction: 'manipulation' }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleOpenGuideAndTicker();
            }}
            className="p-1 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/60 text-blue-200 font-black text-[8px] sm:text-[10px] uppercase tracking-wider transition-transform duration-75 shadow flex items-center gap-1 active:scale-95 touch-manipulation"
            title="Open Guide & Live Session Ticker Drawer"
          >
            <Activity size={11} className="text-blue-400" />
            <span className="hidden sm:inline">Ticker</span>
          </button>

          {onSwitchToVegas && (
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onPointerDown={(e) => {
                e.preventDefault();
                pulseVibrate(15);
                onSwitchToVegas();
              }}
              className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-purple-950/90 hover:bg-purple-900 border border-purple-400 text-purple-200 font-black text-[10px] uppercase tracking-wider transition-transform duration-75 shadow items-center gap-1 active:scale-95 touch-manipulation"
            >
              <span>🎰 5-Line</span>
            </button>
          )}

          <button
            type="button"
            style={{ touchAction: 'manipulation' }}
            onPointerDown={(e) => {
              e.preventDefault();
              pulseVibrate(15);
              onOpenTutorial();
            }}
            className="p-1 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-[9px] transition-transform duration-75 shadow flex items-center gap-1 active:scale-95 touch-manipulation"
            title="Rules & Paytable"
          >
            <HelpCircle size={11} />
            <span className="hidden sm:inline">Rules</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* THE MAIN PHYSICAL CABINET (Fills remaining locked height)       */}
      {/* ============================================================== */}
      <div className="flex-1 min-h-0 mt-1 rounded-xl sm:rounded-3xl bg-gradient-to-b from-[#1f0202] via-[#2f0404] to-[#140101] border-2 sm:border-4 border-[#991b1b] p-1.5 sm:p-2.5 shadow-[0_15px_40px_rgba(0,0,0,0.95),inset_0_2px_10px_rgba(255,215,0,0.3)] flex flex-col justify-between overflow-hidden relative">
        {/* Subtle 8-Bit Vegas Skyline Backdrop Watermark */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center mix-blend-screen"
          style={{ backgroundImage: `url('${cartridge.theme.backdropUrl}')` }}
        />

        {/* ============================================================== */}
        {/* 2. FIXED HEADER HUD: DOT-MATRIX TICKER + 10-PILL CASH RIBBON   */}
        {/* Always visible in both BASE_REELS and FEATURE_BOARD modes      */}
        {/* ============================================================== */}
        <div className="shrink-0 space-y-1 relative z-10">
          {/* Retro 5x7 Amber Dot-Matrix LED Message Board */}
          <div className="px-2 py-0.5 sm:py-1 rounded-lg bg-[#0d0903] border border-amber-600/90 shadow-[inset_0_2px_10px_rgba(0,0,0,1)] relative overflow-hidden flex items-center justify-between gap-1.5">
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(#f59e0b 1px, transparent 1px), radial-gradient(#d97706 1px, transparent 1px)',
                backgroundSize: '4px 4px',
                backgroundPosition: '0 0, 2px 2px',
              }}
            />
            <div className="flex items-center gap-1 shrink-0 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fde047] animate-ping" />
              <span className="text-[8px] font-mono font-black uppercase text-amber-500 tracking-wider hidden sm:inline">
                TICKER:
              </span>
            </div>
            <div className="font-mono font-black text-[9px] sm:text-xs text-amber-300 tracking-wider text-center truncate drop-shadow-[0_0_8px_#f59e0b] relative z-10 flex-1">
              {displayedMsg}
            </div>
          </div>

          {/* COMPACT HORIZONTAL 10-PILL CASH RIBBON (Fixed directly beneath Dot-Matrix Ticker) */}
          <div
            className={`bg-black/85 border rounded-lg px-1 py-0.5 shadow-inner transition-colors ${
              skillStopperActive
                ? 'border-yellow-300 shadow-[0_0_15px_rgba(253,224,71,0.4)]'
                : 'border-amber-500/60'
            }`}
          >
            <div className="grid grid-cols-10 gap-0.5 sm:gap-1 items-center">
              {CASH_LADDER.map((val, idx) => {
                const isCurrent = cashLadderStep === idx;
                const isPassed = cashLadderStep > idx;
                const isStopperLight = skillStopperActive && stopperHighlightRung === idx;
                const isTopJackpot = idx === CASH_LADDER.length - 1;

                return (
                  <div
                    key={val}
                    className={`py-0.5 px-0.5 rounded text-center font-mono font-black transition-all flex flex-col items-center justify-center leading-none border ${
                      isStopperLight
                        ? 'bg-white text-black shadow-[0_0_18px_#ffffff] scale-110 border-yellow-300 ring-2 ring-yellow-400 z-20'
                        : isCurrent
                        ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 text-black shadow-[0_0_12px_#fde047] scale-105 border-white z-10'
                        : isPassed
                        ? 'bg-amber-950/90 text-yellow-300 border-amber-500/70'
                        : isTopJackpot
                        ? 'bg-red-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-zinc-950/80 text-zinc-500 border-white/5'
                    }`}
                  >
                    <span className="text-[8px] sm:text-[10px] tracking-tighter">
                      £{val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. DYNAMIC CENTRAL STAGE VIEW CONTROLLER                       */}
        {/* Smoothly switches between BASE_REELS and 5x5 MONOPOLY BOARD    */}
        {/* ============================================================== */}
        <div className="flex-1 min-h-0 my-1.5 flex flex-col justify-center overflow-hidden relative z-10">
          {stageView === 'FEATURE_BOARD' ? (
            /* ============================================================ */
            /* FEATURE_BOARD VIEW: Full 5x5 MONOPOLY VEGAS STRIP Grid       */
            /* Pure high-legibility display (zero duplicate inner buttons)  */
            /* ============================================================ */
            <div
              className={`h-full w-full rounded-2xl bg-gradient-to-b from-[#0a140d] via-[#112417] to-[#061009] border-2 p-1.5 sm:p-2.5 flex flex-col justify-between overflow-hidden transition-all duration-500 ease-out animate-in fade-in zoom-in-95 ${
                securityAlertFlash
                  ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.85)]'
                  : 'border-[#10b981] shadow-[0_0_25px_rgba(16,185,129,0.3)]'
              }`}
            >
              <div className="grid grid-cols-5 grid-rows-5 gap-1 sm:gap-1.5 flex-1 min-h-0">
                {MONOPOLY_SQUARES.map((sq) => {
                  const isActive = (inFeatureBoard || isPeekingBoard) && boardPosition === sq.id;
                  const isChasing =
                    inFeatureBoard && isWalkingBoard && Math.abs(boardPosition - sq.id) <= 1;
                  // 1. Skill Wheel (Roulette): 65ms Strobe highlight around the 16 perimeter tiles
                  const isRouletteStrobe = reelRouletteActive && rouletteIndex === sq.id;
                  // 4. Security Chaser: Crimson SECURITY light on the perimeter
                  const isSecurityChaserHere =
                    (inFeatureBoard || isPeekingBoard) && securityPosition === sq.id;

                  return (
                    <div
                      key={sq.id}
                      className={`${sq.row} ${sq.col} relative rounded-lg sm:rounded-xl border flex flex-col justify-between overflow-hidden transition-all duration-75 ${
                        isRouletteStrobe
                          ? 'bg-gradient-to-b from-fuchsia-300 via-purple-200 to-amber-300 text-black border-2 border-white ring-2 sm:ring-4 ring-fuchsia-400 shadow-[0_0_26px_#e879f9] scale-[1.05] z-40 font-black'
                          : isActive && isSecurityChaserHere
                          ? 'bg-gradient-to-b from-red-500 via-amber-400 to-red-700 text-white border-2 border-white ring-2 sm:ring-4 ring-red-500 shadow-[0_0_26px_#ef4444] scale-[1.04] z-30 font-black'
                          : isActive
                          ? 'bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-500 text-black border-2 border-white shadow-[0_0_25px_#fde047] scale-[1.03] z-30 font-black ring-2 ring-yellow-400'
                          : isSecurityChaserHere
                          ? 'bg-gradient-to-b from-[#450a0a] via-[#7f1d1d] to-[#2a0404] text-red-100 border-2 border-red-400 ring-2 ring-red-600 shadow-[0_0_20px_rgba(220,38,38,0.9)] z-25 font-black'
                          : isChasing
                          ? 'bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-400 text-black border-yellow-300 shadow-[0_0_15px_#f59e0b] z-20 font-bold'
                          : sq.isCorner
                          ? 'bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] text-white border-yellow-500/60'
                          : 'bg-[#fffbeb] text-zinc-950 border-zinc-400/95'
                      }`}
                    >
                      {/* Top Monopoly Property Color Banner */}
                      <div
                        className={`h-2 sm:h-2.5 w-full ${
                          isSecurityChaserHere ? 'bg-red-600 animate-pulse' : sq.colorBar
                        } border-b border-black/40 shrink-0`}
                      />

                      {/* Crimson SECURITY Chaser Beacon Badge */}
                      {isSecurityChaserHere && (
                        <div className="absolute top-0.5 left-0.5 px-1 py-0.1 rounded bg-red-600 border border-white text-white font-mono font-black text-[6.5px] sm:text-[7.5px] uppercase tracking-tighter flex items-center gap-0.5 shadow-[0_0_10px_#dc2626] z-40 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>SEC</span>
                        </div>
                      )}

                      {/* Skill Wheel Strobe Badge */}
                      {isRouletteStrobe && (
                        <div className="absolute top-0.5 left-0.5 px-1 py-0.1 rounded bg-fuchsia-600 border border-white text-white font-mono font-black text-[6.5px] sm:text-[7.5px] uppercase tracking-tighter shadow z-40">
                          WHEEL
                        </div>
                      )}

                      {/* Moving Player Token Indicator */}
                      {isActive && (
                        <div className="absolute top-0.5 right-0.5 text-xs sm:text-sm animate-bounce drop-shadow z-40">
                          {cartridge.theme.boardTokenIcon}
                        </div>
                      )}

                      {/* High-Legibility Tile Content */}
                      <div className="px-0.5 flex flex-col items-center justify-center flex-1 text-center min-h-0">
                        <div
                          className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tight leading-none truncate w-full ${
                            isRouletteStrobe || isActive
                              ? 'text-black'
                              : isSecurityChaserHere
                              ? 'text-red-200'
                              : sq.isCorner
                              ? 'text-yellow-300'
                              : 'text-zinc-950'
                          }`}
                        >
                          {sq.title}
                        </div>

                        <div className="my-0.5 flex items-center justify-center">
                          {sq.avatarImg ? (
                            <img
                              src={sq.avatarImg}
                              alt={sq.title}
                              className="w-5 h-5 sm:w-7 sm:h-7 rounded-full object-cover border border-black shadow-sm"
                            />
                          ) : (
                            <span className="text-xs sm:text-base leading-none">{sq.icon}</span>
                          )}
                        </div>

                        <div
                          className={`text-[6.5px] sm:text-[8px] font-extrabold uppercase tracking-tighter truncate w-full ${
                            isRouletteStrobe || isActive
                              ? 'text-zinc-900'
                              : isSecurityChaserHere
                              ? 'text-red-300'
                              : sq.isCorner
                              ? 'text-zinc-300'
                              : 'text-zinc-700'
                          }`}
                        >
                          {sq.subtext}
                        </div>
                      </div>

                      {/* High-Contrast Bottom Price Tag */}
                      <div
                        className={`py-0.5 px-0.5 text-[7.5px] sm:text-[9px] font-mono font-black text-center border-t border-black/15 truncate shrink-0 ${
                          isRouletteStrobe
                            ? 'bg-fuchsia-500 text-white'
                            : isActive
                            ? 'bg-yellow-400 text-black'
                            : isSecurityChaserHere
                            ? 'bg-red-950 text-red-200'
                            : sq.isCorner
                            ? 'bg-black/75 text-yellow-300'
                            : 'bg-zinc-200 text-zinc-950'
                        }`}
                      >
                        {sq.priceTag}
                      </div>
                    </div>
                  );
                })}

                {/* 3x3 HOLLOW MONOPOLY COURTYARD (Pure Display HUD — Controlled via Bottom Thumb Deck) */}
                <div className="row-start-2 row-span-3 col-start-2 col-span-3 rounded-xl bg-gradient-to-b from-[#06180c] via-black to-[#06180c] border-2 border-emerald-400/60 p-1.5 sm:p-2.5 flex flex-col justify-between shadow-inner relative overflow-hidden z-20">
                  {/* Top Courtyard Bar: Board Title, Crimson Security Status, Current Tile */}
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-700/50 shrink-0 gap-1">
                    <div className="bg-red-600 text-white font-black text-[7.5px] sm:text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow border border-white truncate">
                      {cartridge.boardTitle}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded bg-red-950/90 border border-red-500/80 text-red-300 font-mono font-black text-[7.5px] sm:text-[8.5px] uppercase flex items-center gap-1 shadow-[0_0_8px_rgba(220,38,38,0.4)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        <span>SEC: {MONOPOLY_SQUARES[securityPosition].title}</span>
                      </span>
                      <div className="text-[7.5px] sm:text-[9px] font-mono font-black text-emerald-300 uppercase hidden xs:flex items-center gap-0.5 truncate">
                        <Footprints
                          size={10}
                          className={isWalkingBoard ? 'animate-bounce text-yellow-300' : ''}
                        />
                        <span className="truncate">{MONOPOLY_SQUARES[boardPosition].title}</span>
                      </div>
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* CENTER 3x3 ARENA READOUT (Mini-Games & Hi-Lo HUD)              */}
                  {/* Zero inner buttons — all controlled via bottom 2x4 thumb deck  */}
                  {/* ============================================================== */}
                  {mysteryCardsActive ? (
                    /* 2. MYSTERY CARDS (MAGICIAN CHRIS DALY) — Mapped to [HOLD 1], [HOLD 2], [HOLD 3] */
                    <div className="my-auto bg-gradient-to-b from-purple-950/95 via-indigo-950/95 to-black border-2 border-emerald-400 rounded-xl p-1.5 sm:p-2 text-center space-y-1.5 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      <div className="flex items-center justify-center gap-1.5">
                        <img
                          src="/avatars/avatar_chris_daly_1772222942062.png"
                          alt="Chris Daly"
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-emerald-300 object-cover"
                        />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-300 tracking-wider">
                          🔮 CHRIS DALY&apos;S MYSTERY CARDS
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                        {[0, 1, 2].map((cIdx) => {
                          const cardOutcome = mysteryDeck[cIdx] || MYSTERY_CARD_POOL[cIdx];
                          const isRevealed = mysteryPickedIndex !== null;
                          const isChosen = mysteryPickedIndex === cIdx;

                          return (
                            <div
                              key={cIdx}
                              className={`rounded-lg p-1 sm:p-1.5 border-2 flex flex-col items-center justify-between min-h-[58px] sm:min-h-[68px] transition-all duration-200 ${
                                isRevealed
                                  ? isChosen
                                    ? `bg-gradient-to-b ${cardOutcome.accentClass} scale-105 ring-2 ring-white shadow-[0_0_15px_#ffffff]`
                                    : 'bg-zinc-900/90 border-zinc-700 text-zinc-400 opacity-75'
                                  : 'bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-950 border-amber-300/90 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse'
                              }`}
                            >
                              <span className="text-[7px] sm:text-[8px] font-mono font-black uppercase px-1 py-0.2 rounded bg-black/70 text-amber-300 border border-amber-400/50">
                                [HOLD {cIdx + 1}]
                              </span>
                              <span className="text-sm sm:text-base leading-none my-0.5">
                                {isRevealed ? cardOutcome.icon : '🎴'}
                              </span>
                              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter leading-tight text-center">
                                {isRevealed ? cardOutcome.shortTag : `MYSTERY #${cIdx + 1}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[7.5px] sm:text-[8.5px] font-mono font-bold text-amber-200 uppercase">
                        {mysteryPickedIndex === null
                          ? 'TAP [HOLD 1], [HOLD 2], OR [HOLD 3] ON THUMB DECK!'
                          : `PICKED CARD #${mysteryPickedIndex + 1}: ${mysteryDeck[mysteryPickedIndex]?.title}!`}
                      </div>
                    </div>
                  ) : skillStopperActive ? (
                    /* 3. CASH FRENZY (REPEAT) / SKILL CASH STOPPER — Bounces Horizontal Cash Ribbon */
                    <div className="my-auto bg-gradient-to-b from-red-950/95 via-amber-950/90 to-black border-2 border-yellow-400 rounded-xl p-2 text-center space-y-1.5 shadow-[0_0_20px_rgba(250,204,21,0.45)]">
                      <div className="flex items-center justify-center gap-1 text-yellow-300 font-black text-[9.5px] sm:text-[11px] uppercase tracking-wider">
                        <Zap size={13} className="animate-bounce text-yellow-300" />
                        <span>{skillStopperLabel}</span>
                      </div>
                      <div className="text-base sm:text-xl font-mono font-black text-white bg-black/80 border border-yellow-400/80 rounded-lg py-1 px-3 inline-block shadow-[0_0_15px_#fde047]">
                        £{CASH_LADDER[stopperHighlightRung] * stake}
                      </div>
                      <div className="grid grid-cols-10 gap-0.5 pt-0.5">
                        {CASH_LADDER.map((val, rIdx) => (
                          <div
                            key={val}
                            className={`h-1.5 rounded-full transition-all ${
                              stopperHighlightRung === rIdx
                                ? 'bg-white shadow-[0_0_8px_#fff] scale-y-125'
                                : rIdx <= stopperHighlightRung
                                ? 'bg-amber-400/80'
                                : 'bg-zinc-800'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-[7.5px] sm:text-[8.5px] font-mono font-bold text-amber-200 uppercase">
                        RIBBON BOUNCING • TAP [START] BELOW TO FREEZE CASH!
                      </div>
                    </div>
                  ) : reelRouletteActive ? (
                    /* 1. SKILL WHEEL (ROULETTE) — 65ms Strobe around the 16 Perimeter Tiles */
                    <div className="my-auto bg-gradient-to-b from-fuchsia-950/95 via-purple-950/95 to-black border-2 border-fuchsia-400 rounded-xl p-2 text-center space-y-1 shadow-[0_0_22px_rgba(232,121,249,0.5)]">
                      <div className="text-fuchsia-200 font-black text-[9.5px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center gap-1">
                        <span>🎡 SKILL WHEEL ROULETTE (65MS STROBE)</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 bg-black/75 border border-fuchsia-400/60 rounded-lg py-1 px-2.5">
                        {currentRouletteTile.avatarImg ? (
                          <img
                            src={currentRouletteTile.avatarImg}
                            alt={currentRouletteTile.title}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white object-cover"
                          />
                        ) : (
                          <span className="text-lg sm:text-xl">
                            {currentRouletteTile.icon || '🎡'}
                          </span>
                        )}
                        <div className="text-left">
                          <div className="font-black text-white text-[10px] sm:text-xs uppercase leading-none">
                            {currentRouletteTile.title}
                          </div>
                          <div className="font-mono font-black text-yellow-300 text-[9px] sm:text-[10px]">
                            {currentRouletteTile.type === 'life'
                              ? '+1 EXTRA LIFE ❤️'
                              : currentRouletteTile.val > 0
                              ? `+£${currentRouletteTile.val * stake} CASH`
                              : currentRouletteTile.priceTag}
                          </div>
                        </div>
                      </div>
                      <div className="text-[7.5px] sm:text-[8.5px] font-mono font-bold text-fuchsia-200 uppercase">
                        TAP [START] BELOW TO FREEZE ON CASH OR EXTRA LIFE!
                      </div>
                    </div>
                  ) : repeaterActive ? (
                    <div className="my-auto bg-amber-950/90 border-2 border-yellow-300 rounded-xl p-2 text-center space-y-1.5 animate-pulse">
                      <div className="text-yellow-300 font-black text-[10px] uppercase">
                        ★ REPEAT CHANCE! ★
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-black ${
                            repeaterYesLit
                              ? 'bg-green-500 text-black shadow-[0_0_12px_#22c55e]'
                              : 'bg-black/50 text-zinc-600'
                          }`}
                        >
                          YES
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-black ${
                            !repeaterYesLit
                              ? 'bg-red-500 text-white shadow-[0_0_12px_#ef4444]'
                              : 'bg-black/50 text-zinc-600'
                          }`}
                        >
                          NO
                        </span>
                      </div>
                      <div className="text-[8px] font-mono text-yellow-200 uppercase">
                        HIT [START] ON YES!
                      </div>
                    </div>
                  ) : !inFeatureBoard && step4BonusBanner ? (
                    /* STEP 4 TRAIL BONUS DISPLAY HUD */
                    <div className="my-auto bg-blue-950/90 border-2 border-blue-400 rounded-xl p-2.5 text-center space-y-1 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-in zoom-in-95 duration-300">
                      <div className="text-[10px] font-black uppercase text-blue-300 tracking-wider">
                        ⚡ TRAIL STEP 4 BONUS UNLOCKED! ⚡
                      </div>
                      <div className="text-xs sm:text-sm font-black text-yellow-300 uppercase">
                        {step4BonusBanner}
                      </div>
                      <div className="text-[8.5px] font-mono text-zinc-300">
                        TRAIL HELD AT {trailStep}/8 • HIT [START] BELOW TO SPIN!
                      </div>
                    </div>
                  ) : (
                    /* PURE HI-LO NUMBER CUBE, EXTRA LIVES & EQUAL WINS (3 TURNS) HUD */
                    <div className="my-auto flex flex-col items-center justify-center space-y-1.5">
                      <span className="text-[8px] font-black uppercase text-amber-400 tracking-widest">
                        HI-LO REEL NUMBER
                      </span>
                      <div
                        className={`w-14 h-12 sm:w-16 sm:h-14 rounded-2xl bg-black border-2 border-yellow-400 flex items-center justify-center font-mono font-black text-2xl sm:text-3xl text-yellow-300 shadow-[0_0_20px_#f59e0b] ${
                          isRollingHiLo ? 'animate-bounce' : ''
                        }`}
                      >
                        {hiLoCurrent}
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5 flex-wrap justify-center">
                        <div className="flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded border border-rose-500/60 text-[8px] sm:text-[9px] font-mono">
                          <span className="text-red-400">❤️</span>
                          <span className="text-white font-black">{extraLives} LIVES</span>
                        </div>
                        <div
                          className={`text-[7.5px] sm:text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded border transition-colors ${
                            equalWinsLit
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse'
                              : 'bg-black text-zinc-500 border-zinc-800'
                          }`}
                        >
                          {equalWinsLit ? `★ EQUAL WINS (${equalWinsTurns}T)` : 'EQUAL LOSES'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Courtyard Status Strip */}
                  <div className="pt-1 border-t border-emerald-800/60 flex items-center justify-between gap-1 text-[8px] sm:text-[9px] font-mono shrink-0">
                    <span className="text-zinc-300">
                      POT: <strong className="text-yellow-300 font-black">£{potCash}</strong>
                    </span>
                    <span className="text-emerald-400 uppercase truncate">
                      {mysteryCardsActive
                        ? 'PICK [HOLD 1-3] BELOW'
                        : skillStopperActive || reelRouletteActive
                        ? 'TAP [START] BELOW TO STOP'
                        : inFeatureBoard
                        ? 'USE [HI] / [LO] / [COLLECT] BELOW'
                        : 'PEEK MODE • HIT [START] BELOW'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* BASE_REELS MODE: 3 Stepper Reels with Harmonic Recoil Bounce, */
            /* E.P.T. Symbols, Red +1 Trail Badges, & 8-Step Vegas Trail     */
            /* ============================================================ */
            <div className="h-full w-full rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#180303] via-[#2c0505] to-[#120101] border-2 border-amber-500/80 p-1 sm:p-2 shadow-[0_10px_25px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-hidden relative transition-all duration-300 ease-out animate-in fade-in">
              {/* Stage Mode Header with [PEEK BOARD] Toggle Pill */}
              <div className="shrink-0 flex items-center justify-between pb-0.5 mb-0.5 border-b border-amber-500/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                  <span className="text-[8px] sm:text-[9.5px] font-mono font-black uppercase text-amber-300 tracking-wider">
                    BASE_REELS • 3-STEPPERS
                  </span>
                </div>
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleTogglePeekBoard();
                  }}
                  className="px-1.5 py-0.2 rounded-full bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-400/80 text-emerald-300 font-mono font-black text-[7.5px] sm:text-[8.5px] uppercase tracking-wider flex items-center gap-1 shadow active:scale-95 transition-transform duration-75 touch-manipulation"
                >
                  <Eye size={10} />
                  <span>[PEEK BOARD]</span>
                </button>
              </div>

              {/* 3 Mechanical Stepper Reels Area with Harmonic Recoil Bounce */}
              <div className="relative flex-1 min-h-0 flex items-center">
                {/* Laser-guided Red Horizontal Winline Marker */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 sm:h-1 bg-red-500 shadow-[0_0_12px_#ef4444] z-20 pointer-events-none flex items-center justify-between px-1.5">
                  <span className="text-[7px] sm:text-[8px] font-black text-white bg-red-600 px-1 py-0.1 rounded shadow border border-white">
                    ◄ WINLINE
                  </span>
                  <span className="text-[7px] sm:text-[8px] font-black text-white bg-red-600 px-1 py-0.1 rounded shadow border border-white">
                    WINLINE ►
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 sm:gap-2 w-full h-full relative z-10">
                  {[r0Symbols, r1Symbols, r2Symbols].map((reelCol, rIdx) => {
                    const isSpin = spinningReels[rIdx];
                    const isHeld = heldReels[rIdx];
                    const numOverlay = reelNumbers[rIdx];
                    const recoilPx = recoilOffsets[rIdx] || 0;

                    return (
                      <div
                        key={rIdx}
                        style={{
                          transform: `translateY(${recoilPx}px)`,
                          transition: 'transform 65ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                        className={`relative rounded-lg sm:rounded-xl bg-gradient-to-b from-[#141414] via-[#f5f5f5] to-[#141414] p-0.5 sm:p-1 border-2 flex flex-col justify-between overflow-hidden ${
                          isHeld
                            ? 'border-yellow-400 shadow-[0_0_20px_#fde047]'
                            : 'border-zinc-700 shadow-[inset_0_8px_16px_rgba(0,0,0,0.85),inset_0_-8px_16px_rgba(0,0,0,0.85)]'
                        }`}
                      >
                        {isHeld && (
                          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[7px] font-black px-1.5 py-0.1 rounded-full z-30 uppercase shadow border border-black animate-pulse">
                            HELD
                          </div>
                        )}

                        <div className="grid grid-rows-3 gap-0.5 sm:gap-1 h-full">
                          {reelCol.map((sym, rowIdx) => {
                            const isCenterWinline = rowIdx === 1;

                            return (
                              <div
                                key={rowIdx}
                                className={`relative rounded flex flex-col items-center justify-center px-0.5 py-0.2 sm:py-0.5 transition-transform min-h-0 ${
                                  isCenterWinline
                                    ? 'bg-gradient-to-b from-white via-zinc-100 to-zinc-200 text-black shadow border sm:border-2 border-red-500 z-10'
                                    : 'bg-zinc-200/80 opacity-40 scale-95'
                                } ${isSpin ? 'blur-[1px]' : ''}`}
                              >
                                {sym.avatarImg ? (
                                  <div
                                    className={`rounded overflow-hidden shadow border border-black bg-white/20 flex items-center justify-center shrink-0 ${
                                      isCenterWinline
                                        ? 'w-6 h-6 xs:w-7 xs:h-7 sm:w-11 sm:h-11'
                                        : 'w-4 h-4 xs:w-5 xs:h-5 sm:w-8 sm:h-8'
                                    }`}
                                  >
                                    <img
                                      src={sym.avatarImg}
                                      alt={sym.name}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <span
                                    className={`leading-none drop-shadow ${
                                      isCenterWinline
                                        ? 'text-base xs:text-lg sm:text-2xl'
                                        : 'text-xs xs:text-sm sm:text-lg'
                                    }`}
                                  >
                                    {sym.icon}
                                  </span>
                                )}

                                <span className="text-[7px] sm:text-[9px] font-black uppercase text-zinc-900 tracking-tight leading-none truncate max-w-full mt-0.5">
                                  {sym.name}
                                </span>

                                <span
                                  className={`text-[5.5px] sm:text-[7px] font-black uppercase px-0.5 py-0.1 rounded-full leading-none truncate max-w-full ${
                                    isCenterWinline ? 'inline-block' : 'hidden sm:inline-block'
                                  } ${sym.badgeColor}`}
                                >
                                  {sym.comicLabel}
                                </span>

                                {/* Red +1 / +2 Trail Sub-Symbol Sticker Badge */}
                                {isCenterWinline && numOverlay > 0 && (
                                  <div className="absolute top-0.5 right-0.5 px-1 py-0.1 min-w-[16px] h-4 rounded-full bg-red-600 border border-white text-white font-mono font-black text-[8px] sm:text-[9px] flex items-center justify-center shadow-[0_0_8px_#ef4444]">
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
              </div>

              {/* 4. THE 8-STEP VEGAS NUMBER TRAIL (4 = BONUS, 8 = TOP GLASS) */}
              <div className="shrink-0 mt-0.5 sm:mt-1 pt-0.5 sm:pt-1 border-t border-amber-800/80 bg-black/80 rounded-lg px-1.5 py-0.5 sm:py-1">
                <div className="flex items-center justify-between text-[8px] sm:text-[9px] uppercase font-black text-yellow-300 mb-0.5">
                  <span className="flex items-center gap-1">
                    <span>★ NUMBER TRAIL</span>
                    <span className="text-zinc-400 font-normal text-[7px] hidden sm:inline">
                      (STEP 4 = BONUS • STEP 8 = BOARD)
                    </span>
                    {trailHeld && (
                      <span className="bg-yellow-400 text-black px-1 py-0.1 rounded font-black text-[7px] animate-pulse">
                        HELD!
                      </span>
                    )}
                  </span>
                  <span className="text-amber-400 font-mono">STEP {trailStep}/8</span>
                </div>

                <div className="grid grid-cols-8 gap-0.5 sm:gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => {
                    const isLit = trailStep >= step;
                    const isBonus = step === 4;
                    const isFeature = step === 8;

                    return (
                      <div
                        key={step}
                        className={`py-0.5 rounded text-center font-mono font-black text-[9px] sm:text-xs border transition-all leading-tight ${
                          isLit
                            ? isFeature
                              ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 text-black border-white shadow-[0_0_12px_#fde047]'
                              : isBonus
                              ? 'bg-gradient-to-b from-blue-400 to-blue-700 text-white border-blue-200 shadow-[0_0_10px_#60a5fa]'
                              : 'bg-gradient-to-b from-red-500 to-red-700 text-white border-red-300 shadow-[0_0_8px_#ef4444]'
                            : 'bg-black/60 text-zinc-600 border-white/5'
                        }`}
                      >
                        <div>{step}</div>
                        <div className="text-[5.5px] sm:text-[7px] uppercase tracking-tighter">
                          {isFeature ? 'BOARD' : isBonus ? 'BONUS' : '•'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 5. PERMANENTLY PINNED BOTTOM MOBILE THUMB ZONE                 */}
        {/* Stake/Nudge Bar + Unified 2x4 Arcade Button Deck               */}
        {/* Bound to onPointerDown with zero-latency & 15ms haptics        */}
        {/* ============================================================== */}
        <div
          style={{ touchAction: 'manipulation' }}
          className="shrink-0 mt-auto rounded-xl p-1 sm:p-2 bg-gradient-to-b from-[#2b0808] via-[#1a0404] to-[#0c0202] border-t-2 border-amber-500 shadow-[0_-8px_20px_rgba(0,0,0,0.85)] relative z-20 touch-manipulation"
        >
          {/* Upper Thumb Bar: Stake Selector, Nudges Available, Bankroll */}
          <div className="flex items-center justify-between gap-1 pb-1 border-b border-white/10 mb-1">
            {/* Stake Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[8px] uppercase font-black text-zinc-400 hidden sm:inline">
                Stake:
              </span>
              <div className="flex items-center gap-0.5 bg-black/70 p-0.5 rounded-lg border border-white/15">
                {cartridge.mechanics.stakes.map((val) => (
                  <button
                    key={val}
                    type="button"
                    style={{ touchAction: 'manipulation' }}
                    disabled={isSpinning || inFeatureBoard || exchangePending !== null}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      if (isSpinning || inFeatureBoard || exchangePending !== null) return;
                      pulseVibrate(15);
                      setStake(val);
                    }}
                    className={`px-1 sm:px-1.5 py-0.5 rounded font-mono font-black text-[8px] sm:text-[9.5px] transition-transform duration-75 active:scale-95 touch-manipulation ${
                      stake === val
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    £{val.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            {/* Nudges Status & Auto Nudge */}
            <div
              className={`px-1.5 py-0.5 rounded-lg border font-mono font-black text-[8px] sm:text-[9px] uppercase flex items-center gap-1 ${
                nudgesRemaining > 0
                  ? 'bg-yellow-500/25 text-yellow-300 border-yellow-400 shadow animate-pulse'
                  : 'bg-black/70 text-zinc-500 border-white/10'
              }`}
            >
              <span>NUDGES: {nudgesRemaining}</span>
              {nudgesRemaining > 0 && (
                <button
                  type="button"
                  style={{ touchAction: 'manipulation' }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleAutoNudge();
                  }}
                  className="px-1 py-0.1 rounded bg-yellow-400 text-black text-[7.5px] font-black uppercase hover:brightness-110 active:scale-95 transition-transform duration-75 touch-manipulation"
                >
                  AUTO
                </button>
              )}
            </div>

            {/* Bankroll Counter */}
            <div className="flex items-center gap-1 font-mono text-[9px] sm:text-xs text-zinc-300 bg-black/60 px-1.5 py-0.5 rounded-lg border border-gold/30">
              <span className="text-zinc-400 hidden xs:inline">BANK:</span>
              <span className="text-gold font-black">£{bankroll.toLocaleString()}</span>
            </div>
          </div>

          {/* Lower Thumb Deck: Permanent 2x4 Arcade Button Deck */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
            {/* 1. CANCEL/STEP (Also triggers 50/50 Gamble when inFeatureBoard) */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              disabled={
                !holdsAvailable &&
                nudgesRemaining <= 0 &&
                (!inFeatureBoard ||
                  isWalkingBoard ||
                  isRollingHiLo ||
                  skillStopperActive ||
                  reelRouletteActive ||
                  mysteryCardsActive)
              }
              onPointerDown={(e) => {
                e.preventDefault();
                if (
                  !holdsAvailable &&
                  nudgesRemaining <= 0 &&
                  (!inFeatureBoard ||
                    isWalkingBoard ||
                    isRollingHiLo ||
                    skillStopperActive ||
                    reelRouletteActive ||
                    mysteryCardsActive)
                )
                  return;
                handleCancel();
              }}
              className={`p-1 rounded-lg sm:rounded-xl border-2 font-black text-[8px] sm:text-[10.5px] uppercase tracking-wider active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] touch-manipulation ${
                holdsAvailable || nudgesRemaining > 0
                  ? 'bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 border-zinc-300 text-white shadow'
                  : inFeatureBoard &&
                    !isWalkingBoard &&
                    !isRollingHiLo &&
                    !skillStopperActive &&
                    !reelRouletteActive &&
                    !mysteryCardsActive
                  ? 'bg-gradient-to-b from-red-600 via-amber-600 to-red-900 border-yellow-300 text-white shadow-[0_0_12px_#f59e0b]'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <span>CANCEL/STEP</span>
              <span className="text-[6px] sm:text-[7.5px] text-zinc-300">
                {inFeatureBoard ? '50/50 GAMBLE' : 'RESET HOLD'}
              </span>
            </button>

            {/* 2. HOLD 1 (or NUDGE 1 or MYSTERY CARD 1) */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              disabled={
                isSpinning ||
                (!holdsAvailable &&
                  nudgesRemaining <= 0 &&
                  (!mysteryCardsActive || mysteryPickedIndex !== null))
              }
              onPointerDown={(e) => {
                e.preventDefault();
                if (mysteryCardsActive && mysteryPickedIndex === null) {
                  handlePickMysteryCard(0);
                  return;
                }
                if (isSpinning || (!holdsAvailable && nudgesRemaining <= 0)) return;
                if (nudgesRemaining > 0) handleNudge(0);
                else toggleHold(0);
              }}
              className={`p-1 rounded-lg sm:rounded-xl border-2 font-black text-[8px] sm:text-[10.5px] uppercase tracking-wider active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] touch-manipulation ${
                mysteryCardsActive && mysteryPickedIndex === null
                  ? 'bg-gradient-to-b from-purple-500 via-indigo-600 to-purple-900 border-emerald-300 text-white shadow-[0_0_15px_#a855f7] animate-pulse'
                  : heldReels[0]
                  ? 'bg-yellow-400 border-white text-black shadow-[0_0_15px_#fde047]'
                  : holdsAvailable
                  ? 'bg-amber-500 border-amber-200 text-white animate-pulse shadow'
                  : nudgesRemaining > 0
                  ? 'bg-blue-600 border-blue-300 text-white animate-pulse shadow'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <span>HOLD 1</span>
              <span className="text-[6px] sm:text-[7.5px]">
                {mysteryCardsActive
                  ? 'CARD 1 🔮'
                  : heldReels[0]
                  ? 'LOCKED'
                  : nudgesRemaining > 0
                  ? 'NUDGE 1 ▼'
                  : 'REEL 1'}
              </span>
            </button>

            {/* 3. HOLD 2 (or NUDGE 2 or MYSTERY CARD 2) */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              disabled={
                isSpinning ||
                (!holdsAvailable &&
                  nudgesRemaining <= 0 &&
                  (!mysteryCardsActive || mysteryPickedIndex !== null))
              }
              onPointerDown={(e) => {
                e.preventDefault();
                if (mysteryCardsActive && mysteryPickedIndex === null) {
                  handlePickMysteryCard(1);
                  return;
                }
                if (isSpinning || (!holdsAvailable && nudgesRemaining <= 0)) return;
                if (nudgesRemaining > 0) handleNudge(1);
                else toggleHold(1);
              }}
              className={`p-1 rounded-lg sm:rounded-xl border-2 font-black text-[8px] sm:text-[10.5px] uppercase tracking-wider active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] touch-manipulation ${
                mysteryCardsActive && mysteryPickedIndex === null
                  ? 'bg-gradient-to-b from-purple-500 via-indigo-600 to-purple-900 border-emerald-300 text-white shadow-[0_0_15px_#a855f7] animate-pulse'
                  : heldReels[1]
                  ? 'bg-yellow-400 border-white text-black shadow-[0_0_15px_#fde047]'
                  : holdsAvailable
                  ? 'bg-amber-500 border-amber-200 text-white animate-pulse shadow'
                  : nudgesRemaining > 0
                  ? 'bg-blue-600 border-blue-300 text-white animate-pulse shadow'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <span>HOLD 2</span>
              <span className="text-[6px] sm:text-[7.5px]">
                {mysteryCardsActive
                  ? 'CARD 2 🔮'
                  : heldReels[1]
                  ? 'LOCKED'
                  : nudgesRemaining > 0
                  ? 'NUDGE 2 ▼'
                  : 'REEL 2'}
              </span>
            </button>

            {/* 4. HOLD 3 (or NUDGE 3 or MYSTERY CARD 3) */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              disabled={
                isSpinning ||
                (!holdsAvailable &&
                  nudgesRemaining <= 0 &&
                  (!mysteryCardsActive || mysteryPickedIndex !== null))
              }
              onPointerDown={(e) => {
                e.preventDefault();
                if (mysteryCardsActive && mysteryPickedIndex === null) {
                  handlePickMysteryCard(2);
                  return;
                }
                if (isSpinning || (!holdsAvailable && nudgesRemaining <= 0)) return;
                if (nudgesRemaining > 0) handleNudge(2);
                else toggleHold(2);
              }}
              className={`p-1 rounded-lg sm:rounded-xl border-2 font-black text-[8px] sm:text-[10.5px] uppercase tracking-wider active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] touch-manipulation ${
                mysteryCardsActive && mysteryPickedIndex === null
                  ? 'bg-gradient-to-b from-purple-500 via-indigo-600 to-purple-900 border-emerald-300 text-white shadow-[0_0_15px_#a855f7] animate-pulse'
                  : heldReels[2]
                  ? 'bg-yellow-400 border-white text-black shadow-[0_0_15px_#fde047]'
                  : holdsAvailable
                  ? 'bg-amber-500 border-amber-200 text-white animate-pulse shadow'
                  : nudgesRemaining > 0
                  ? 'bg-blue-600 border-blue-300 text-white animate-pulse shadow'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <span>HOLD 3</span>
              <span className="text-[6px] sm:text-[7.5px]">
                {mysteryCardsActive
                  ? 'CARD 3 🔮'
                  : heldReels[2]
                  ? 'LOCKED'
                  : nudgesRemaining > 0
                  ? 'NUDGE 3 ▼'
                  : 'REEL 3'}
              </span>
            </button>

            {/* 5. HI GAMBLE */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              disabled={
                !inFeatureBoard ||
                isSpinning ||
                isWalkingBoard ||
                isRollingHiLo ||
                skillStopperActive ||
                reelRouletteActive ||
                mysteryCardsActive
              }
              onPointerDown={(e) => {
                e.preventDefault();
                if (
                  !inFeatureBoard ||
                  isSpinning ||
                  isWalkingBoard ||
                  isRollingHiLo ||
                  skillStopperActive ||
                  reelRouletteActive ||
                  mysteryCardsActive
                )
                  return;
                handleHiLoGuess('hi');
              }}
              className={`p-1 rounded-lg sm:rounded-xl border-2 font-black text-[8px] sm:text-[10.5px] uppercase tracking-wider active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] touch-manipulation ${
                inFeatureBoard &&
                !isSpinning &&
                !isWalkingBoard &&
                !isRollingHiLo &&
                !skillStopperActive &&
                !reelRouletteActive &&
                !mysteryCardsActive
                  ? 'bg-gradient-to-b from-emerald-600 to-emerald-950 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-0.5">
                <ArrowUp size={10} />
                <span>HI GAMBLE</span>
              </div>
              <span className="text-[6px] sm:text-[7.5px] text-emerald-200">HIGHER ▲</span>
            </button>

            {/* 6. LO GAMBLE */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              disabled={
                !inFeatureBoard ||
                isSpinning ||
                isWalkingBoard ||
                isRollingHiLo ||
                skillStopperActive ||
                reelRouletteActive ||
                mysteryCardsActive
              }
              onPointerDown={(e) => {
                e.preventDefault();
                if (
                  !inFeatureBoard ||
                  isSpinning ||
                  isWalkingBoard ||
                  isRollingHiLo ||
                  skillStopperActive ||
                  reelRouletteActive ||
                  mysteryCardsActive
                )
                  return;
                handleHiLoGuess('lo');
              }}
              className={`p-1 rounded-lg sm:rounded-xl border-2 font-black text-[8px] sm:text-[10.5px] uppercase tracking-wider active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] touch-manipulation ${
                inFeatureBoard &&
                !isSpinning &&
                !isWalkingBoard &&
                !isRollingHiLo &&
                !skillStopperActive &&
                !reelRouletteActive &&
                !mysteryCardsActive
                  ? 'bg-gradient-to-b from-rose-600 to-rose-950 border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.7)] animate-pulse'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-0.5">
                <ArrowDown size={10} />
                <span>LO GAMBLE</span>
              </div>
              <span className="text-[6px] sm:text-[7.5px] text-rose-200">LOWER ▼</span>
            </button>

            {/* 7. COLLECT */}
            {exchangePending ? (
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleExchangeCollectCash();
                }}
                className="p-1 rounded-lg sm:rounded-xl bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-700 border-2 border-yellow-200 text-black font-black text-[8px] sm:text-[10.5px] uppercase tracking-wider shadow active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] animate-pulse touch-manipulation"
              >
                <span>COLLECT</span>
                <span className="text-[6px] sm:text-[7.5px] font-mono">£{exchangePending.amount}</span>
              </button>
            ) : (
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                disabled={
                  (!inFeatureBoard && potCash <= 0) ||
                  isWalkingBoard ||
                  skillStopperActive ||
                  reelRouletteActive ||
                  mysteryCardsActive
                }
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (
                    (!inFeatureBoard && potCash <= 0) ||
                    isWalkingBoard ||
                    skillStopperActive ||
                    reelRouletteActive ||
                    mysteryCardsActive
                  )
                    return;
                  handleCollectBoard();
                }}
                className={`p-1 rounded-lg sm:rounded-xl border-2 font-black text-[8px] sm:text-[10.5px] uppercase tracking-wider active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] touch-manipulation ${
                  inFeatureBoard &&
                  potCash > 0 &&
                  !isWalkingBoard &&
                  !skillStopperActive &&
                  !reelRouletteActive &&
                  !mysteryCardsActive
                    ? 'bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-700 border-yellow-200 text-black shadow animate-bounce'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
                }`}
              >
                <span>COLLECT</span>
                <span className="text-[6px] sm:text-[7.5px] font-mono">£{potCash}</span>
              </button>
            )}

            {/* 8. START (Also handles EXCHANGE / SKILL STOP / WHEEL STOP / REPEATER STOP) */}
            {exchangePending ? (
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleExchangeToFeature();
                }}
                className="p-1 rounded-lg sm:rounded-xl bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-800 border-2 border-emerald-300 text-white font-black text-[8px] sm:text-[10.5px] uppercase tracking-widest shadow active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] animate-bounce touch-manipulation"
              >
                <div className="flex items-center gap-0.5">
                  <Flame size={10} />
                  <span>START</span>
                </div>
                <span className="text-[6px] sm:text-[7.5px] font-mono">EXCHANGE</span>
              </button>
            ) : skillStopperActive ? (
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleStopSkillCash();
                }}
                className="p-1 rounded-lg sm:rounded-xl bg-gradient-to-b from-yellow-400 via-amber-500 to-red-600 border-2 border-white text-black font-black text-[8px] sm:text-[10.5px] uppercase tracking-widest shadow active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] animate-pulse touch-manipulation"
              >
                <div className="flex items-center gap-0.5">
                  <Square size={10} />
                  <span>START</span>
                </div>
                <span className="text-[6px] sm:text-[7.5px] font-mono">STOP!</span>
              </button>
            ) : reelRouletteActive ? (
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleStopReelRoulette();
                }}
                className="p-1 rounded-lg sm:rounded-xl bg-gradient-to-b from-fuchsia-500 via-purple-600 to-indigo-800 border-2 border-white text-white font-black text-[8px] sm:text-[10.5px] uppercase tracking-widest shadow active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] animate-pulse touch-manipulation"
              >
                <div className="flex items-center gap-0.5">
                  <Square size={10} />
                  <span>START</span>
                </div>
                <span className="text-[6px] sm:text-[7.5px] font-mono">FREEZE WHEEL!</span>
              </button>
            ) : repeaterActive ? (
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleStopRepeater();
                }}
                className="p-1 rounded-lg sm:rounded-xl bg-gradient-to-b from-yellow-400 via-amber-500 to-yellow-600 border-2 border-white text-black font-black text-[8px] sm:text-[10.5px] uppercase tracking-widest shadow active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] animate-pulse touch-manipulation"
              >
                <div className="flex items-center gap-0.5">
                  <Square size={10} />
                  <span>START</span>
                </div>
                <span className="text-[6px] sm:text-[7.5px] font-mono">REPEAT!</span>
              </button>
            ) : (
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                disabled={isSpinning || bankroll < stake || inFeatureBoard}
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (isSpinning || bankroll < stake || inFeatureBoard) return;
                  handleSpin();
                }}
                className={`p-1 rounded-lg sm:rounded-xl border-2 font-black text-[8px] sm:text-[10.5px] uppercase tracking-widest active:translate-y-0.5 active:scale-[0.97] transition-transform duration-75 flex flex-col items-center justify-center min-h-[36px] sm:min-h-[46px] touch-manipulation ${
                  !isSpinning && bankroll >= stake && !inFeatureBoard
                    ? 'bg-gradient-to-b from-[#00e676] via-[#00c853] to-[#00873a] border-[#b9f6ca] text-white shadow-[0_0_20px_rgba(0,200,83,0.8)] hover:brightness-110 animate-pulse'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-600 opacity-30 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <Sparkles size={10} />
                  <span>START</span>
                </div>
                <span className="text-[6px] sm:text-[7.5px] font-mono">£{stake.toFixed(2)}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Standalone Slide-Over Modal Drawer for Guide & Ticker if opened directly */}
      {localDrawerOpen && pubFruityTutorial && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onPointerDown={() => setLocalDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative z-[101] w-[92vw] max-w-md h-full bg-zinc-950 border-l-2 border-gold/50 shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Guide & Ticker Drawer"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/90 shrink-0">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gold">
                <BookOpen size={15} />
                <span>{pubFruityTutorial.title} • Guide &amp; Ticker</span>
              </div>
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  pulseVibrate(15);
                  setLocalDrawerOpen(false);
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white transition-transform duration-75 active:scale-95 touch-manipulation"
                aria-label="Close Guide & Ticker Drawer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 touch-momentum">
              <VegasGameCompanion game={pubFruityTutorial} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
