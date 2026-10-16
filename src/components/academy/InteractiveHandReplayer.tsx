'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, PositionName, Street } from '@/lib/poker-trainer/types';
import { renderMiniCard } from './TableScenarioVisual';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Award,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Coins,
  Brain,
  Sparkles,
} from 'lucide-react';

export interface ReplayActionStep {
  street: Street;
  actorId: string;
  actorName: string;
  actionText: string;
  amount?: number;
  potAfter: number;
  boardAfter: Card[];
  playerChipsAfter: Record<string, number>;
  playerBetsAfter: Record<string, number>;
  playerFoldedAfter: Record<string, boolean>;
  coachNote: {
    grade: 'A+' | 'Good' | 'Blunder' | 'Key Takeaway';
    title: string;
    explanation: string;
    rule: string;
  };
}

export interface HandReplaySample {
  id: string;
  title: string;
  lessonCategory: string;
  blindsDesc: string;
  players: {
    id: string;
    name: string;
    position: PositionName;
    avatar: string;
    startingChips: number;
    cards?: Card[];
  }[];
  steps: ReplayActionStep[];
}

export const SAMPLE_REPLAY_HANDS: Record<string, HandReplaySample> = {
  'hand-limp-punish': {
    id: 'hand-limp-punish',
    title: 'Positional Warfare: Punishing the Open Limp',
    lessonCategory: 'Fundamentals & Positional Advantage',
    blindsDesc: 'Blinds £10 / £20 • 6-Max',
    players: [
      {
        id: 'stephen',
        name: 'Stephen Flood',
        position: 'UTG',
        avatar: '/avatars/avatar_stephen.png',
        startingChips: 1000,
        cards: [
          { rank: 'J', suit: '♠', value: 11 },
          { rank: '10', suit: '♠', value: 10 },
        ],
      },
      {
        id: 'darren',
        name: 'Darren Daly',
        position: 'CO',
        avatar: '/avatars/avatar_darren.png',
        startingChips: 1000,
      },
      {
        id: 'hero',
        name: 'You (Hero)',
        position: 'BTN',
        avatar: '/avatars/avatar_shark.png',
        startingChips: 1000,
        cards: [
          { rank: 'A', suit: '♠', value: 14 },
          { rank: 'K', suit: '♦', value: 13 },
        ],
      },
      {
        id: 'liam',
        name: 'Liam Duxbury',
        position: 'BB',
        avatar: '/avatars/avatar_liam.png',
        startingChips: 1000,
      },
    ],
    steps: [
      {
        street: 'Pre-flop',
        actorId: 'stephen',
        actorName: 'Stephen Flood',
        actionText: 'Stephen limps for £20 (Calls Big Blind)',
        amount: 20,
        potAfter: 50,
        boardAfter: [],
        playerChipsAfter: { stephen: 980, darren: 1000, hero: 1000, liam: 980 },
        playerBetsAfter: { stephen: 20, darren: 0, hero: 0, liam: 20 },
        playerFoldedAfter: { stephen: false, darren: false, hero: false, liam: false },
        coachNote: {
          grade: 'Key Takeaway',
          title: 'The Limping Trap',
          explanation:
            'Stephen makes a classic mistake by open-limping JTs under the gun. By limping, he surrenders the betting initiative and allows position players to attack.',
          rule: 'Golden Rule: Never open-limp! If a hand is worth entering, enter with a raise.',
        },
      },
      {
        street: 'Pre-flop',
        actorId: 'darren',
        actorName: 'Darren Daly',
        actionText: 'Darren folds on the Cutoff',
        potAfter: 50,
        boardAfter: [],
        playerChipsAfter: { stephen: 980, darren: 1000, hero: 1000, liam: 980 },
        playerBetsAfter: { stephen: 20, darren: 0, hero: 0, liam: 20 },
        playerFoldedAfter: { stephen: false, darren: true, hero: false, liam: false },
        coachNote: {
          grade: 'Good',
          title: 'Disciplined Fold',
          explanation:
            'Darren folds weak offsuit holdings facing a limp. Fold discipline from the Cutoff keeps your win rate protected.',
          rule: 'Avoid flat-calling weak hands in middle position.',
        },
      },
      {
        street: 'Pre-flop',
        actorId: 'hero',
        actorName: 'You (Hero)',
        actionText: 'Hero RAISES to £70 (3.5× Isolation Raise)',
        amount: 70,
        potAfter: 120,
        boardAfter: [],
        playerChipsAfter: { stephen: 980, darren: 1000, hero: 930, liam: 980 },
        playerBetsAfter: { stephen: 20, darren: 0, hero: 70, liam: 20 },
        playerFoldedAfter: { stephen: false, darren: true, hero: false, liam: false },
        coachNote: {
          grade: 'A+',
          title: 'Optimal Isolation on the Button',
          explanation:
            'Hero punishes the limper with a 3.5× raise holding A♠ K♦. Raising from the Button seizes the initiative and ensures you will act last on every post-flop street.',
          rule: 'Iso-Raise Formula: Standard 3× BB + 1 BB per limper = 3.5× BB (£70).',
        },
      },
      {
        street: 'Pre-flop',
        actorId: 'liam',
        actorName: 'Liam Duxbury',
        actionText: 'Liam folds in the Big Blind',
        potAfter: 120,
        boardAfter: [],
        playerChipsAfter: { stephen: 980, darren: 1000, hero: 930, liam: 980 },
        playerBetsAfter: { stephen: 20, darren: 0, hero: 70, liam: 20 },
        playerFoldedAfter: { stephen: false, darren: true, hero: false, liam: true },
        coachNote: {
          grade: 'Good',
          title: 'Blinds Fold Out',
          explanation:
            'The Big Blind folds. Hero has successfully forced heads-up play with the weakest player at the table.',
          rule: 'Isolation raises drive out the blinds, drastically reducing multiway variance.',
        },
      },
      {
        street: 'Pre-flop',
        actorId: 'stephen',
        actorName: 'Stephen Flood',
        actionText: 'Stephen calls £50 more',
        amount: 50,
        potAfter: 170,
        boardAfter: [],
        playerChipsAfter: { stephen: 930, darren: 1000, hero: 930, liam: 980 },
        playerBetsAfter: { stephen: 70, darren: 0, hero: 70, liam: 20 },
        playerFoldedAfter: { stephen: false, darren: true, hero: false, liam: true },
        coachNote: {
          grade: 'Key Takeaway',
          title: 'Out of Position Call',
          explanation:
            'Stephen calls £50, heading to the flop with an inferior hand completely out of position.',
          rule: 'Calling raises out of position is the #1 leak of losing players.',
        },
      },
      {
        street: 'Flop',
        actorId: 'dealer',
        actorName: 'Dealer',
        actionText: 'Flop Dealt: K♠ 7♦ 2♣ (Rainbow)',
        potAfter: 170,
        boardAfter: [
          { rank: 'K', suit: '♠', value: 13 },
          { rank: '7', suit: '♦', value: 7 },
          { rank: '2', suit: '♣', value: 2 },
        ],
        playerChipsAfter: { stephen: 930, darren: 1000, hero: 930, liam: 980 },
        playerBetsAfter: { stephen: 0, darren: 0, hero: 0, liam: 0 },
        playerFoldedAfter: { stephen: false, darren: true, hero: false, liam: true },
        coachNote: {
          grade: 'Key Takeaway',
          title: 'Dry Board Advantage',
          explanation:
            'This dry rainbow board connects heavily with Hero’s pre-flop raising range (AK, AA, KK, KQ) and almost completely misses Stephen’s limping range.',
          rule: 'Pre-flop aggressor has huge range advantage on dry Ace- and King-high boards.',
        },
      },
      {
        street: 'Flop',
        actorId: 'stephen',
        actorName: 'Stephen Flood',
        actionText: 'Stephen checks to Hero',
        potAfter: 170,
        boardAfter: [
          { rank: 'K', suit: '♠', value: 13 },
          { rank: '7', suit: '♦', value: 7 },
          { rank: '2', suit: '♣', value: 2 },
        ],
        playerChipsAfter: { stephen: 930, darren: 1000, hero: 930, liam: 980 },
        playerBetsAfter: { stephen: 0, darren: 0, hero: 0, liam: 0 },
        playerFoldedAfter: { stephen: false, darren: true, hero: false, liam: true },
        coachNote: {
          grade: 'Good',
          title: 'Standard Check by Limper',
          explanation: 'Stephen checks, admitting weakness and handing full control to Hero.',
          rule: 'When the out-of-position limper checks, prepare your continuation bet.',
        },
      },
      {
        street: 'Flop',
        actorId: 'hero',
        actorName: 'You (Hero)',
        actionText: 'Hero BETS £55 (33% Pot Continuation Bet)',
        amount: 55,
        potAfter: 225,
        boardAfter: [
          { rank: 'K', suit: '♠', value: 13 },
          { rank: '7', suit: '♦', value: 7 },
          { rank: '2', suit: '♣', value: 2 },
        ],
        playerChipsAfter: { stephen: 930, darren: 1000, hero: 875, liam: 980 },
        playerBetsAfter: { stephen: 0, darren: 0, hero: 55, liam: 0 },
        playerFoldedAfter: { stephen: false, darren: true, hero: false, liam: true },
        coachNote: {
          grade: 'A+',
          title: 'Small C-Bet Sizing Geometry',
          explanation:
            'Hero bets £55 (approx 33% pot). You do not need to bet big on dry boards! A 33% bet only needs 25% fold equity to be auto-profitable, while getting value from weaker pairs.',
          rule: 'Bet 33% pot on dry rainbow boards. Save 66%–75% pot bets for wet, draw-heavy textures.',
        },
      },
      {
        street: 'Flop',
        actorId: 'stephen',
        actorName: 'Stephen Flood',
        actionText: 'Stephen folds! Hero scoops £225 pot.',
        potAfter: 225,
        boardAfter: [
          { rank: 'K', suit: '♠', value: 13 },
          { rank: '7', suit: '♦', value: 7 },
          { rank: '2', suit: '♣', value: 2 },
        ],
        playerChipsAfter: { stephen: 930, darren: 1000, hero: 1100, liam: 980 },
        playerBetsAfter: { stephen: 0, darren: 0, hero: 0, liam: 0 },
        playerFoldedAfter: { stephen: true, darren: true, hero: false, liam: true },
        coachNote: {
          grade: 'A+',
          title: 'Hand Won: Maximum Efficiency',
          explanation:
            'Stephen realizes his missed draw cannot call without odds and mucks. Hero collects £100 net profit cleanly with zero turn or river stress!',
          rule: 'Aggression + Position = The two most profitable weapons in Texas Hold’em.',
        },
      },
    ],
  },
  'hand-liam-test': {
    id: 'hand-liam-test',
    title: 'The Liam Test: Disciplined River Fold vs Check-Raise',
    lessonCategory: 'Post-Flop Discipline & Showdown Leak Repair',
    blindsDesc: 'Blinds £15 / £30 • Heads-Up Match',
    players: [
      {
        id: 'hero',
        name: 'You (Hero)',
        position: 'BTN',
        avatar: '/avatars/avatar_shark.png',
        startingChips: 1200,
        cards: [
          { rank: 'K', suit: '♠', value: 13 },
          { rank: '10', suit: '♦', value: 10 },
        ],
      },
      {
        id: 'liam',
        name: 'Liam Duxbury',
        position: 'BB',
        avatar: '/avatars/avatar_liam.png',
        startingChips: 1200,
        cards: [
          { rank: 'A', suit: '♥', value: 14 },
          { rank: '4', suit: '♥', value: 4 },
        ],
      },
    ],
    steps: [
      {
        street: 'Pre-flop',
        actorId: 'hero',
        actorName: 'You (Hero)',
        actionText: 'Hero raises to £75 with K♠ 10♦',
        amount: 75,
        potAfter: 105,
        boardAfter: [],
        playerChipsAfter: { hero: 1125, liam: 1170 },
        playerBetsAfter: { hero: 75, liam: 30 },
        playerFoldedAfter: { hero: false, liam: false },
        coachNote: {
          grade: 'Good',
          title: 'Standard Pre-Flop Open',
          explanation: 'Hero opens 2.5× on the button with KTo. Liam calls in the big blind.',
          rule: 'Open-raise from the button with suited and broadway combinations.',
        },
      },
      {
        street: 'Pre-flop',
        actorId: 'liam',
        actorName: 'Liam Duxbury',
        actionText: 'Liam calls £45 in the Big Blind',
        amount: 45,
        potAfter: 150,
        boardAfter: [],
        playerChipsAfter: { hero: 1125, liam: 1125 },
        playerBetsAfter: { hero: 75, liam: 75 },
        playerFoldedAfter: { hero: false, liam: false },
        coachNote: {
          grade: 'Key Takeaway',
          title: 'Heads-up to the Flop',
          explanation: 'Pot is £150. Liam defends with suited Ace.',
          rule: 'Big blinds get discounted pot odds to defend wide.',
        },
      },
      {
        street: 'Flop',
        actorId: 'dealer',
        actorName: 'Dealer',
        actionText: 'Flop Dealt: 10♥ 9♥ 4♠ (Flush & Straight Draws)',
        potAfter: 150,
        boardAfter: [
          { rank: '10', suit: '♥', value: 10 },
          { rank: '9', suit: '♥', value: 9 },
          { rank: '4', suit: '♠', value: 4 },
        ],
        playerChipsAfter: { hero: 1125, liam: 1125 },
        playerBetsAfter: { hero: 0, liam: 0 },
        playerFoldedAfter: { hero: false, liam: false },
        coachNote: {
          grade: 'Key Takeaway',
          title: 'Wet Flop Texture',
          explanation:
            'Hero flops Top Pair, but the board is loaded with straight and flush draws. Liam checks to Hero.',
          rule: 'Wet boards require protection bets against heavy drawing equity.',
        },
      },
      {
        street: 'Flop',
        actorId: 'hero',
        actorName: 'You (Hero)',
        actionText: 'Hero bets £90 (60% Pot Protection Bet)',
        amount: 90,
        potAfter: 240,
        boardAfter: [
          { rank: '10', suit: '♥', value: 10 },
          { rank: '9', suit: '♥', value: 9 },
          { rank: '4', suit: '♠', value: 4 },
        ],
        playerChipsAfter: { hero: 1035, liam: 1125 },
        playerBetsAfter: { hero: 90, liam: 0 },
        playerFoldedAfter: { hero: false, liam: false },
        coachNote: {
          grade: 'A+',
          title: 'Proper Protection Sizing',
          explanation: 'Hero bets 60% pot to charge draws. Liam calls with his nut flush draw.',
          rule: 'Charge flush and straight draws by sizing 55%–70% pot.',
        },
      },
      {
        street: 'Flop',
        actorId: 'liam',
        actorName: 'Liam Duxbury',
        actionText: 'Liam calls £90',
        amount: 90,
        potAfter: 330,
        boardAfter: [
          { rank: '10', suit: '♥', value: 10 },
          { rank: '9', suit: '♥', value: 9 },
          { rank: '4', suit: '♠', value: 4 },
        ],
        playerChipsAfter: { hero: 1035, liam: 1035 },
        playerBetsAfter: { hero: 90, liam: 90 },
        playerFoldedAfter: { hero: false, liam: false },
        coachNote: {
          grade: 'Key Takeaway',
          title: 'Villain Calls with Flush Draw',
          explanation: 'Pot grows to £330 heading to the turn.',
          rule: 'Take note when tight players call on coordinated draw textures.',
        },
      },
      {
        street: 'Turn',
        actorId: 'dealer',
        actorName: 'Dealer',
        actionText: 'Turn: 2♣ (Brick). Liam checks, Hero checks behind.',
        potAfter: 330,
        boardAfter: [
          { rank: '10', suit: '♥', value: 10 },
          { rank: '9', suit: '♥', value: 9 },
          { rank: '4', suit: '♠', value: 4 },
          { rank: '2', suit: '♣', value: 2 },
        ],
        playerChipsAfter: { hero: 1035, liam: 1035 },
        playerBetsAfter: { hero: 0, liam: 0 },
        playerFoldedAfter: { hero: false, liam: false },
        coachNote: {
          grade: 'Good',
          title: 'Pot Control on the Turn',
          explanation:
            'Hero checks behind with one pair, pot-controlling and keeping the pot manageable.',
          rule: 'One-pair hands are rarely 3-street value hands.',
        },
      },
      {
        street: 'River',
        actorId: 'dealer',
        actorName: 'Dealer',
        actionText: 'River: Q♥ (Heart Flush Completes!)',
        potAfter: 330,
        boardAfter: [
          { rank: '10', suit: '♥', value: 10 },
          { rank: '9', suit: '♥', value: 9 },
          { rank: '4', suit: '♠', value: 4 },
          { rank: '2', suit: '♣', value: 2 },
          { rank: 'Q', suit: '♥', value: 12 },
        ],
        playerChipsAfter: { hero: 1035, liam: 1035 },
        playerBetsAfter: { hero: 0, liam: 0 },
        playerFoldedAfter: { hero: false, liam: false },
        coachNote: {
          grade: 'Key Takeaway',
          title: 'The Scare Card',
          explanation:
            'The third heart hits the river, completing the nut flush for anyone holding two hearts.',
          rule: 'When the obvious draw hits on the river, reassess your hand value downward.',
        },
      },
      {
        street: 'River',
        actorId: 'liam',
        actorName: 'Liam Duxbury',
        actionText: 'Liam bets £300 (Pot-Sized River Bet!)',
        amount: 300,
        potAfter: 630,
        boardAfter: [
          { rank: '10', suit: '♥', value: 10 },
          { rank: '9', suit: '♥', value: 9 },
          { rank: '4', suit: '♠', value: 4 },
          { rank: '2', suit: '♣', value: 2 },
          { rank: 'Q', suit: '♥', value: 12 },
        ],
        playerChipsAfter: { hero: 1035, liam: 735 },
        playerBetsAfter: { hero: 0, liam: 300 },
        playerFoldedAfter: { hero: false, liam: false },
        coachNote: {
          grade: 'Key Takeaway',
          title: 'The Liam Test Triggered',
          explanation:
            'Liam bombs the river for £300. Calling here with just second pair is the exact "Calling Station" leak that ruins win-rates.',
          rule: 'The Liam Test: When a regular bets big on a completed draw river, they have it 90%+ of the time.',
        },
      },
      {
        street: 'River',
        actorId: 'hero',
        actorName: 'You (Hero)',
        actionText: 'Hero FOLDS second pair! Saves £300.',
        potAfter: 630,
        boardAfter: [
          { rank: '10', suit: '♥', value: 10 },
          { rank: '9', suit: '♥', value: 9 },
          { rank: '4', suit: '♠', value: 4 },
          { rank: '2', suit: '♣', value: 2 },
          { rank: 'Q', suit: '♥', value: 12 },
        ],
        playerChipsAfter: { hero: 1035, liam: 1365 },
        playerBetsAfter: { hero: 0, liam: 0 },
        playerFoldedAfter: { hero: true, liam: false },
        coachNote: {
          grade: 'A+',
          title: 'Masterclass Discipline',
          explanation:
            'Hero folds! Liam flips over Ace-high Nut Flush. By finding the fold button, Hero preserved 34 Big Blinds for future profitable spots.',
          rule: 'A penny saved is a penny earned: Elite players win by knowing when they are beat.',
        },
      },
    ],
  },
};

interface Props {
  sampleHandId?: string;
  customHand?: HandReplaySample;
  onClose?: () => void;
}

export default function InteractiveHandReplayer({
  sampleHandId = 'hand-limp-punish',
  customHand,
  onClose,
}: Props) {
  const activeHand = customHand || SAMPLE_REPLAY_HANDS[sampleHandId] || SAMPLE_REPLAY_HANDS['hand-limp-punish'];
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const playTimerRef = useRef<number | null>(null);

  const step = activeHand.steps[currentStepIdx] || activeHand.steps[0];
  const totalSteps = activeHand.steps.length;

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) window.clearTimeout(playTimerRef.current);
      return;
    }

    const delayMs = Math.round(2200 / playbackSpeed);
    playTimerRef.current = window.setTimeout(() => {
      setCurrentStepIdx((prev) => {
        if (prev < totalSteps - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, delayMs);

    return () => {
      if (playTimerRef.current) window.clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, currentStepIdx, totalSteps, playbackSpeed]);

  const handleNext = () => {
    setIsPlaying(false);
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  const handleJumpToStreet = (street: Street) => {
    setIsPlaying(false);
    const idx = activeHand.steps.findIndex((s) => s.street === street);
    if (idx !== -1) {
      setCurrentStepIdx(idx);
    }
  };

  const gradeColor = {
    'A+': 'bg-emerald-500 text-black border-emerald-400',
    Good: 'bg-cyan-500 text-black border-cyan-400',
    Blunder: 'bg-ept-red text-white border-ept-red',
    'Key Takeaway': 'bg-gold text-black border-gold',
  }[step.coachNote.grade];

  return (
    <div className="rounded-3xl bg-zinc-950 border border-gold/40 overflow-hidden shadow-2xl flex flex-col">
      {/* Replayer Top Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-amber-950/80 via-black to-zinc-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} />
              <span>Interactive Hand Replayer</span>
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {activeHand.blindsDesc}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white mt-1">
            {activeHand.title}
          </h3>
        </div>

        {/* Street Scrubber Pills */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
          {(['Pre-flop', 'Flop', 'Turn', 'River'] as Street[]).map((st) => {
            const hasStreet = activeHand.steps.some((s) => s.street === st);
            const isCurrent = step.street === st;
            return (
              <button
                key={st}
                disabled={!hasStreet}
                onClick={() => handleJumpToStreet(st)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                  isCurrent
                    ? 'bg-gold text-black font-black shadow'
                    : hasStreet
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 opacity-40 cursor-not-allowed'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Screen */}
      <div className="relative p-4 sm:p-6 bg-[radial-gradient(circle_at_center,_#133340_0%,_#091820_65%,_#050b0f_100%)] select-none">
        {/* Step Counter Indicator */}
        <div className="absolute top-3 left-4 z-30 text-[11px] font-mono text-zinc-400">
          Action Step: <strong className="text-gold">{currentStepIdx + 1}</strong> / {totalSteps}
        </div>

        {/* 3D Oval Stadium Poker Table Felt */}
        <div className="relative mx-auto w-full max-w-2xl min-h-[360px] rounded-[110px] poker-table-rail p-3.5 flex flex-col justify-between shadow-2xl">
          <div className="relative w-full h-full min-h-[330px] rounded-[96px] poker-table-rim bg-[radial-gradient(ellipse_at_center,_#166534_0%,_#09361c_62%,_#03170b_100%)] flex items-center justify-center p-3">
            {/* Betting Racetrack */}
            <div className="absolute inset-3 rounded-[84px] border border-white/15 pointer-events-none" />

            {/* Perimeter Opponents */}
            <div className="absolute top-2 inset-x-6 flex items-center justify-around gap-2 z-20">
              {activeHand.players
                .filter((p) => p.id !== 'hero')
                .map((p) => {
                  const isActing = step.actorId === p.id;
                  const isFolded = step.playerFoldedAfter[p.id];
                  const currentBet = step.playerBetsAfter[p.id] || 0;
                  const remainingChips =
                    step.playerChipsAfter[p.id] !== undefined
                      ? step.playerChipsAfter[p.id]
                      : p.startingChips;

                  return (
                    <div
                      key={p.id}
                      className={`flex flex-col items-center transition-all ${
                        isFolded ? 'opacity-35 grayscale' : ''
                      }`}
                    >
                      {/* Cards */}
                      <div className="flex -space-x-1.5 mb-[-6px] relative z-10">
                        {p.cards && p.cards.length > 0 ? (
                          p.cards.map((c) => renderMiniCard(c, false, 'sm'))
                        ) : (
                          <>
                            {renderMiniCard({ rank: 'A', suit: '♠', value: 14 }, true, 'sm')}
                            {renderMiniCard({ rank: 'K', suit: '♦', value: 13 }, true, 'sm')}
                          </>
                        )}
                      </div>

                      {/* Seat Pod */}
                      <div
                        className={`rounded-xl px-2.5 py-1 bg-black/90 border shadow-md text-center min-w-[85px] transition-all ${
                          isActing
                            ? 'border-gold ring-2 ring-gold/70 scale-105'
                            : 'border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-white truncate max-w-[60px]">
                            {p.name.split(' ')[0]}
                          </span>
                          <span className="px-1 rounded bg-gold/20 text-gold text-[8px] font-black">
                            {p.position}
                          </span>
                        </div>
                        <div className="text-[9px] font-mono text-emerald-400 font-bold">
                          £{remainingChips.toLocaleString()}
                        </div>
                      </div>

                      {/* Bet Chips in Front of Pod */}
                      {currentBet > 0 && (
                        <div className="mt-1 px-2 py-0.5 rounded-full bg-black/80 border border-gold/60 text-gold font-mono font-bold text-[9px] shadow animate-chip-toss">
                          Bet: £{currentBet}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Middle Community Cards & Pot */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-2.5 my-auto">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 border border-gold/60 shadow">
                <Coins size={12} className="text-gold" />
                <span className="text-xs sm:text-sm font-mono font-black text-gold">
                  Pot: £{step.potAfter.toLocaleString()}
                </span>
              </div>

              {/* 5 Board Slots */}
              <div className="flex items-center gap-1.5 min-h-[52px]">
                {step.boardAfter.length === 0 ? (
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                    Pre-Flop (No Board)
                  </div>
                ) : (
                  <>
                    {step.boardAfter.map((c) => renderMiniCard(c, false, 'md'))}
                    {Array.from({ length: Math.max(0, 5 - step.boardAfter.length) }).map(
                      (_, i) => (
                        <div
                          key={`empty-replayer-slot-${i}`}
                          className="w-9 h-13 rounded-md border border-white/10 bg-black/10"
                        />
                      )
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Bottom Hero Pod */}
            {activeHand.players.find((p) => p.id === 'hero') && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                {/* Hero Bet */}
                {(step.playerBetsAfter['hero'] || 0) > 0 && (
                  <div className="mb-1 px-2.5 py-0.5 rounded-full bg-black/85 border border-gold/60 text-gold font-mono font-bold text-[10px] shadow">
                    Bet: £{step.playerBetsAfter['hero']}
                  </div>
                )}

                {/* Hero Cards */}
                <div className="flex -space-x-1.5 relative z-10 mb-[-6px]">
                  {activeHand.players
                    .find((p) => p.id === 'hero')!
                    .cards?.map((c) => renderMiniCard(c, false, 'md'))}
                </div>

                <div
                  className={`rounded-xl px-3.5 py-1.5 bg-gradient-to-b from-[#1b2230] to-[#0c0f15] border-2 shadow-xl text-center min-w-[130px] transition-all ${
                    step.actorId === 'hero'
                      ? 'border-gold ring-2 ring-gold/80 scale-105'
                      : 'border-gold/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-gold text-black text-[9px] font-black">
                      BTN
                    </span>
                    <span className="text-xs font-bold text-white">You (Hero)</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold mt-0.5">
                    £{(step.playerChipsAfter['hero'] ?? 1000).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Callout Pill Directly on the Felt */}
        <div className="mt-3 max-w-lg mx-auto bg-black/85 border border-gold/40 rounded-xl px-4 py-2 text-center shadow-lg">
          <div className="text-[10px] uppercase font-bold text-zinc-400">
            Latest Action:
          </div>
          <div className="text-xs sm:text-sm font-black text-white">
            {step.actionText}
          </div>
        </div>
      </div>

      {/* Synchronized Coach Commentary Panel */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border-t border-white/10 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${gradeColor}`}
              >
                {step.coachNote.grade}
              </span>
              <h4 className="text-sm sm:text-base font-black text-white">
                {step.coachNote.title}
              </h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
              {step.coachNote.explanation}
            </p>
          </div>

          <div className="hidden sm:block p-2.5 rounded-xl bg-gold/10 border border-gold/30 max-w-xs shrink-0 text-left">
            <div className="text-[10px] font-black text-gold uppercase tracking-wider flex items-center gap-1">
              <Lightbulb size={12} /> Pro Rule
            </div>
            <div className="text-[11px] text-zinc-300 mt-0.5 font-medium">
              {step.coachNote.rule}
            </div>
          </div>
        </div>

        {/* Playback Control Bar */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              title="Reset to Hand Beginning"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs tracking-wider shadow hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              <span>{isPlaying ? 'Pause' : 'Play Hand'}</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentStepIdx === totalSteps - 1}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Speed Toggle */}
          <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-lg border border-white/10">
            <span className="text-[10px] text-zinc-400 font-bold uppercase mr-1">
              Speed:
            </span>
            {([1, 1.5, 2] as (1 | 1.5 | 2)[]).map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  playbackSpeed === spd
                    ? 'bg-gold text-black font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {spd}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
