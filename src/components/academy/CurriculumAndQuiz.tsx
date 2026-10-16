'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  HelpCircle,
  Play,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Users,
  XCircle,
  Eye,
  Film,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BOT_ROSTER } from '@/lib/poker-trainer/constants';
import { Card, PositionName, ScenarioPreset } from '@/lib/poker-trainer/types';
import HandGuide from '@/components/HandGuide';
import LeagueProTips from '@/components/LeagueProTips';
import PokerDictionary from '@/components/PokerDictionary';
import TableScenarioVisual, { TableScenarioVisualProps } from './TableScenarioVisual';
import InteractiveHandReplayer, { SAMPLE_REPLAY_HANDS } from './InteractiveHandReplayer';

interface Props {
  onLaunchPresetDrill: (preset: ScenarioPreset) => void;
}

interface MasterclassModule {
  id: string;
  badge: string;
  title: string;
  summary: string;
  keyTakeaways: string[];
  formulaOrRule: string;
  preset: ScenarioPreset;
  replayHandId?: string;
  scenarioVisual: Omit<TableScenarioVisualProps, 'onLaunchDrill'>;
}

const MASTERCLASS_MODULES: MasterclassModule[] = [
  {
    id: 'mod-position',
    badge: 'MODULE 1 • FUNDAMENTALS',
    title: 'Positional Warfare & Eliminating Open-Limps',
    summary:
      'Acting last post-flop is the single greatest statistical edge in poker. Winning TAG sharks play 3× wider on the Button than Under the Gun and never open-limp.',
    keyTakeaways: [
      'Keep your VPIP-to-PFR gap under 6%—if a hand is worth playing unopened, raise 2.5x–3x BB.',
      'In Early Position (UTG), play ~14% of hands; on the Button (BTN), expand to ~45%.',
      'Use small 33% pot continuation bets (C-bets) on dry boards when holding positional initiative.',
    ],
    formulaOrRule: 'Golden Rule: VPIP% - PFR% <= 6% (Zero Open-Limp Policy)',
    preset: 'btn-vs-bb-3bet',
    replayHandId: 'hand-limp-punish',
    scenarioVisual: {
      title: 'Table Example: Punishing the Open Limper',
      subtitle: 'Hero isolates Stephen from the Button with AK Offsuit',
      streetName: 'Pre-Flop',
      pot: 50,
      boardCards: [],
      hero: {
        name: 'You (Hero)',
        position: 'BTN',
        chips: 1000,
        cards: [
          { rank: 'A', suit: '♠', value: 14 },
          { rank: 'K', suit: '♦', value: 13 },
        ],
      },
      opponents: [
        {
          id: 'stephen',
          name: 'Stephen Flood',
          position: 'UTG',
          chips: 980,
          lastAction: 'Limped £20',
        },
        {
          id: 'darren',
          name: 'Darren Daly',
          position: 'CO',
          chips: 1000,
          isFolded: true,
          lastAction: 'Folded',
        },
        {
          id: 'liam',
          name: 'Liam Duxbury',
          position: 'BB',
          chips: 980,
          lastAction: 'BB £20',
        },
      ],
      tacticalCallout: {
        badge: 'Optimal Play',
        badgeType: 'optimal',
        actionText: 'Raise to £70 (3.5× BB Isolation)',
        rationale:
          'Never limp behind! Raising 3.5× isolates the weak limper, forces out the blinds, and guarantees you act last on every post-flop street with initiative.',
      },
      drillPreset: 'btn-vs-bb-3bet',
    },
  },
  {
    id: 'mod-pot-limit',
    badge: 'MODULE 2 • POT LIMIT',
    title: 'Pot-Limit Geometry & Multi-Street Sizing',
    summary:
      'In Pot-Limit formats, you cannot over-bet the pot to bully opponents pre-flop. You must plan bet sizes geometrically across Flop, Turn, and River.',
    keyTakeaways: [
      'Max Pot-Limit Raise = Current Total Pot + (2 × Call Amount) - Current Bet.',
      'Betting 75%–100% pot on the Flop and Turn balloons the pot exponentially for a River jam.',
      'Avoid committing your stack with bare one-pair hands in multiway Pot-Limit pots; prioritize redraws.',
    ],
    formulaOrRule: 'Max Pot Bet = Pot + 2 × Call',
    preset: 'multiway-pot-limit',
    scenarioVisual: {
      title: 'Table Example: Pot-Limit Exponential Growth',
      subtitle: 'Building the pot on Turn to allow a clean River All-In',
      streetName: 'Turn',
      pot: 240,
      boardCards: [
        { rank: 'K', suit: '♦', value: 13 },
        { rank: '10', suit: '♦', value: 10 },
        { rank: '4', suit: '♠', value: 4 },
        { rank: '2', suit: '♣', value: 2 },
      ],
      hero: {
        name: 'You (Hero)',
        position: 'BTN',
        chips: 1200,
        bet: 180,
        cards: [
          { rank: 'A', suit: '♦', value: 14 },
          { rank: 'Q', suit: '♦', value: 12 },
        ],
      },
      opponents: [
        {
          id: 'darren',
          name: 'Darren Daly',
          position: 'SB',
          chips: 600,
          lastAction: 'Checked',
        },
        {
          id: 'stephen',
          name: 'Stephen Flood',
          position: 'BB',
          chips: 800,
          lastAction: 'Checked',
        },
      ],
      tacticalCallout: {
        badge: 'Pot-Limit Sizing',
        badgeType: 'optimal',
        actionText: 'Bet £180 (75% Pot Multi-Street Growth)',
        rationale:
          'In Pot-Limit, you cannot jam the river unless you grow the pot geometrically on Turn. Sizing 75% creates a £600 pot on the River, allowing an exact pot-sized jam with nut flush draws.',
      },
      drillPreset: 'multiway-pot-limit',
    },
  },
  {
    id: 'mod-bounty',
    badge: 'MODULE 3 • BOUNTY HUNTER',
    title: 'Bounty Hunter (PKO) Chip Conversion Math',
    summary:
      'When you cover an all-in opponent in a Knockout tournament, their bounty adds immediate cash value to the pot—reducing the equity you need to call!',
    keyTakeaways: [
      'A starting bounty in a 50% PKO is worth ~33% of a starting stack in chip equity.',
      'When covering a 12 BB short-stack shove with a starting bounty, your required equity drops by ~8–11%.',
      'Never widen your calling range if you DO NOT cover the all-in opponent—you cannot win their bounty!',
    ],
    formulaOrRule: 'Bounty Pot Odds = Call / (Total Pot + Call + Bounty Chip Value)',
    preset: 'bounty-short-stack',
    scenarioVisual: {
      title: 'Table Example: Short-Stack Bounty Math',
      subtitle: 'Calling a 12 BB All-In with Bounty Equity Discount',
      streetName: 'Pre-Flop',
      pot: 750,
      boardCards: [],
      hero: {
        name: 'You (Hero)',
        position: 'BB',
        chips: 1500,
        cards: [
          { rank: 'K', suit: '♥', value: 13 },
          { rank: 'Q', suit: '♦', value: 12 },
        ],
      },
      opponents: [
        {
          id: 'dave',
          name: 'Dave Blackburn',
          position: 'UTG',
          chips: 0,
          lastAction: 'All-In £600 (Bounty £50)',
        },
        {
          id: 'luke',
          name: 'Luke Daly',
          position: 'BTN',
          chips: 1200,
          isFolded: true,
          lastAction: 'Folded',
        },
      ],
      tacticalCallout: {
        badge: 'Bounty Discount',
        badgeType: 'optimal',
        actionText: 'Call All-In (Required: 35% vs Normal 44%)',
        rationale:
          'Dave has a £50 bounty on his head. That bounty equals ~300 chips in equity, dropping your mathematical break-even equity from 44% down to 35%—making KQo a clear profitable call!',
      },
      drillPreset: 'bounty-short-stack',
    },
  },
  {
    id: 'mod-aof',
    badge: 'MODULE 4 • ALL-IN OR FOLD',
    title: '10 BB Push/Fold & Nash Equilibrium',
    summary:
      'When stacks drop to 8–12 BB (or in All-In or Fold games), post-flop play disappears. Maximizing fold equity and card-removal blockers is everything.',
    keyTakeaways: [
      'Ace-high (Ax) and King-high suited hands make better shoves than small offsuit connectors due to blockers.',
      'Pocket pairs (22+) are almost always profitable shoves under 12 BB from Middle/Late position.',
      'Call tighter than you shove—you have zero fold equity when calling an opponent’s all-in!',
    ],
    formulaOrRule: 'Shove Range > Call Range (Fold Equity Advantage)',
    preset: 'push-fold-clinic',
    scenarioVisual: {
      title: 'Table Example: Nash 10 BB Push/Fold Clinic',
      subtitle: 'Ace-blocker open-jamming from the Button',
      streetName: 'Pre-Flop',
      pot: 150,
      boardCards: [],
      hero: {
        name: 'You (Hero)',
        position: 'BTN',
        chips: 900,
        cards: [
          { rank: 'A', suit: '♦', value: 14 },
          { rank: '4', suit: '♣', value: 4 },
        ],
      },
      opponents: [
        {
          id: 'georgina',
          name: 'Georgina Wearing',
          position: 'SB',
          chips: 1500,
          lastAction: 'SB £50',
        },
        {
          id: 'daniel',
          name: 'Daniel Horne',
          position: 'BB',
          chips: 1800,
          lastAction: 'BB £100',
        },
      ],
      tacticalCallout: {
        badge: 'Nash Jam',
        badgeType: 'optimal',
        actionText: 'All-In 9 BB (£900)',
        rationale:
          'Holding the A♦ cuts opponent Ace-holding combinations in half. Shoving unexploitably collects the blinds £150 uncontested 70%+ of the time.',
      },
      drillPreset: 'push-fold-clinic',
    },
  },
  {
    id: 'mod-wet-boards',
    badge: 'MODULE 5 • POST-FLOP MATH',
    title: 'Board Texture & The Rule of 4 and 2',
    summary:
      'Instant mental calculation of draw equity vs. pot odds separates disciplined sharks from calling stations.',
    keyTakeaways: [
      'On the Flop (2 cards to come), multiply your clean Outs by 4 to get your approximate equity %.',
      'On the Turn (1 card to come), multiply your clean Outs by 2.',
      'Combo draws (Flush Draw + Open-Ended Straight Draw = 15 outs) have ~54% equity on the flop—making you a mathematical favorite over One Pair!',
    ],
    formulaOrRule: 'Flop Equity ≈ Outs × 4 | Turn Equity ≈ Outs × 2',
    preset: 'wet-board-defense',
    scenarioVisual: {
      title: 'Table Example: 15-Out Monster Combo Draw',
      subtitle: 'Semi-bluff raising with 54% equity against top pair',
      streetName: 'Flop',
      pot: 240,
      boardCards: [
        { rank: '9', suit: '♠', value: 9 },
        { rank: '8', suit: '♦', value: 8 },
        { rank: '2', suit: '♠', value: 2 },
      ],
      hero: {
        name: 'You (Hero)',
        position: 'BTN',
        chips: 1100,
        cards: [
          { rank: 'J', suit: '♠', value: 11 },
          { rank: '10', suit: '♠', value: 10 },
        ],
      },
      opponents: [
        {
          id: 'liam',
          name: 'Liam Duxbury',
          position: 'BB',
          chips: 950,
          lastAction: 'Bet £80',
        },
      ],
      tacticalCallout: {
        badge: 'Combo Draw (15 Outs)',
        badgeType: 'optimal',
        actionText: 'Raise to £240 (Semi-Bluff)',
        rationale:
          '9 flush outs + 6 straight outs = 15 outs. By the Rule of 4: 15 × 4 = ~54% equity! You are a favorite over Liam’s Top Pair—raising maximizes fold equity and pot size.',
      },
      drillPreset: 'wet-board-defense',
    },
  },
  {
    id: 'mod-icm',
    badge: 'MODULE 6 • TOURNAMENT ICM',
    title: 'ICM Final Table Bubble & Risk Premium',
    summary:
      'Near the money bubble or E.P.T. Championship pay jumps, chips lost hurt your tournament equity far more than chips won help you.',
    keyTakeaways: [
      'Add an 8%–12% "Risk Premium" to your required pot odds before calling off your tournament life on the bubble.',
      'Big stacks (like Edward Wearing) can pressure medium stacks who are terrified of busting before short stacks.',
      'Short stacks have the lowest ICM risk premium and should shove aggressively first-in.',
    ],
    formulaOrRule: 'ICM Required Equity = Raw Pot Odds % + Risk Premium (8%–12%)',
    preset: 'free-play',
    replayHandId: 'hand-liam-test',
    scenarioVisual: {
      title: 'Table Example: The Liam Test (River Draw-Completing Bet)',
      subtitle: 'Disciplined fold with second pair on river scare card',
      streetName: 'River',
      pot: 630,
      boardCards: [
        { rank: '10', suit: '♥', value: 10 },
        { rank: '9', suit: '♥', value: 9 },
        { rank: '4', suit: '♠', value: 4 },
        { rank: '2', suit: '♣', value: 2 },
        { rank: 'Q', suit: '♥', value: 12 },
      ],
      hero: {
        name: 'You (Hero)',
        position: 'BTN',
        chips: 1035,
        cards: [
          { rank: 'K', suit: '♠', value: 13 },
          { rank: '10', suit: '♦', value: 10 },
        ],
      },
      opponents: [
        {
          id: 'liam',
          name: 'Liam Duxbury',
          position: 'BB',
          chips: 735,
          lastAction: 'Bombed River £300',
        },
      ],
      tacticalCallout: {
        badge: 'The Liam Test Fold',
        badgeType: 'critical',
        actionText: 'Fold Second Pair (Save 34 BB)',
        rationale:
          'When an EPT regular bets pot on a third heart completing card, they have the flush 90%+ of the time. Calling with second pair is torching chips. Fold and keep your stack intact!',
      },
      drillPreset: 'free-play',
    },
  },
];

const ACADEMY_QUIZ_QUESTIONS = [
  {
    category: 'Pre-Flop Math',
    question:
      'You have A♣ K♣ pre-flop. What is the approximate probability you will hit at least a pair on the flop?',
    options: ['10%', '32%', '50%', '65%'],
    answer: 1,
    explanation:
      'Any two unpaired hole cards have 6 outs to pair on the flop, which hits roughly 32.4% of the time (about 1 in 3 flops).',
  },
  {
    category: 'Draw Equity',
    question:
      'You hold J♠ 10♠ on a 9♠ 8♦ 2♠ flop (Flush Draw + Open-Ended Straight Draw). How many clean outs do you have, and are you a favorite over A♥ A♦?',
    options: [
      '9 outs (Underdog vs AA)',
      '12 outs (50/50 Coin Flip)',
      '15 outs (~54% Favorite over AA!)',
      '17 outs (~68% Favorite)',
    ],
    answer: 2,
    explanation:
      'You have 9 spade outs for the flush + 6 non-spade straight outs (Queens and Sevens) = 15 outs. By the Rule of 4, 15 × 4 ≈ 54%–56% equity, making you a mathematical favorite over Pocket Aces on the flop!',
  },
  {
    category: 'Pot Limit Rules',
    question:
      'In a Pot-Limit game, the pot is £100 on the flop. An opponent bets £50. What is the maximum total amount you can raise to?',
    options: ['£150', '£200', '£250', '£300'],
    answer: 2,
    explanation:
      'In Pot Limit, first you match the £50 call (bringing the pot to £100 + £50 + £50 = £200). You can then raise the size of that £200 pot, for a total bet of £50 + £200 = £250!',
  },
  {
    category: 'Bounty Hunter (PKO)',
    question:
      'In a Bounty Hunter game, a short stack shoves 10 BB into a 15 BB pot. Normally you need 40% equity to call. If their bounty is worth 8 BB in chip equity and you cover them, what happens to your required equity?',
    options: [
      'It stays at 40%',
      'It drops to ~30% (10 / (25 + 8))',
      'It increases to 50%',
      'Bounties only count on the river',
    ],
    answer: 1,
    explanation:
      'Adding 8 BB of bounty equity to the 25 BB final pot means you risk 10 BB to win an effective 33 BB pot (10 / 33 ≈ 30.3% equity required), allowing you to call ~10% wider!',
  },
  {
    category: 'All-In or Fold',
    question:
      'With 9 BB in All-In or Fold on the Button, which hand is a better mathematical open-shove: A♦ 4♣ or 8♥ 7♣?',
    options: [
      '8♥ 7♣ because cards are connected',
      'A♦ 4♣ because the Ace blocks opponents’ calling hands and has higher raw equity',
      'Both are automatic folds on the Button',
      'Neither—you should limp',
    ],
    answer: 1,
    explanation:
      'At 9 BB, A4o has an Ace blocker (reducing the chance the blinds wake up with AA, AK, AQ) and higher raw high-card equity when called.',
  },
  {
    category: 'Leak Analysis',
    question:
      'Your Play-Style Tracker shows VPIP: 44% and PFR: 9% over 100 hands. What archetype and leak does this indicate?',
    options: [
      'TAG Shark — Optimal balance',
      'Nit / Rock — Playing too tight',
      'Calling Station — Huge VPIP/PFR gap from excessive open-limping and cold-calling',
      'LAG Maniac — 3-betting too much',
    ],
    answer: 2,
    explanation:
      'A 44% VPIP with only 9% PFR means you are calling/limping 35% of hands without initiative—classic Loose-Passive Calling Station territory.',
  },
  {
    category: 'E.P.T. Scouting',
    question:
      'You are playing against "Tight-Passive Georgina" who checks the turn on a paired board and then check-shoves the river. What is the optimal adjustment?',
    options: [
      'Snap-call with Top Pair Good Kicker',
      'Fold One Pair or Two Pair—this is "The Georgina Trap" indicating a Full House or monster',
      'Re-bluff all-in',
      'Report a misdeal',
    ],
    answer: 1,
    explanation:
      'Against tight-passive trappers with low bluff frequency, a sudden river check-shove is heavily weighted toward Full Houses and nutted hands.',
  },
  {
    category: 'Pot Odds Math',
    question:
      'The pot is £300 on the turn, and your opponent bets £100. What pot odds percentage are you getting on a call?',
    options: ['33%', '25%', '20%', '50%'],
    answer: 2,
    explanation:
      'You must call £100 into a total final pot of (£300 + £100 + £100) = £500. £100 / £500 = 20% required equity.',
  },
];

export default function CurriculumAndQuiz({ onLaunchPresetDrill }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [expandedVisualModuleId, setExpandedVisualModuleId] = useState<string | null>(null);
  const [activeReplayerHandId, setActiveReplayerHandId] = useState<string | null>(null);

  const handleSelectOption = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    if (idx === ACADEMY_QUIZ_QUESTIONS[currentQ].answer) {
      setScore((s) => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQ < ACADEMY_QUIZ_QUESTIONS.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelectedOpt(null);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setScore(0);
    setSelectedOpt(null);
    setQuizFinished(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* 1. Interactive Masterclass Modules Grid */}
      <div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 p-5 bg-black/60 rounded-2xl border border-white/10">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="text-gold" size={22} /> E.P.T. Tactical Curriculum & Format Guides
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Study the math behind every game format, view visual table examples, or watch interactive hand replays with the official E.P.T. 2026 signature deck.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-xl border border-gold/30 shrink-0">
            <img 
              src="/assets/3d/cards/signature-card.jpg" 
              alt="E.P.T. Official Signature Card Deck" 
              className="w-14 h-20 object-cover rounded-lg border border-gold/50 shadow-md" 
            />
            <div className="text-left text-xs pr-2">
              <div className="font-mono text-gold font-bold uppercase text-[10px]">Official Deck</div>
              <div className="font-bold text-white">24k Gold Foil</div>
              <div className="text-[10px] text-zinc-400">Linen Casino Finish</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {MASTERCLASS_MODULES.map((mod) => (
            <div
              key={mod.id}
              className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-gold/40 transition flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold px-2.5 py-1 rounded bg-gold/10 border border-gold/30 inline-block mb-3">
                  {mod.badge}
                </span>
                <h3 className="text-lg font-black text-white mb-2">{mod.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {mod.summary}
                </p>

                <ul className="space-y-2 mb-4">
                  {mod.keyTakeaways.map((pt, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                      <span className="text-gold font-bold mt-0.5">✓</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 text-[11px] font-mono text-cyan-300 text-center">
                  {mod.formulaOrRule}
                </div>

                {/* Example Action Buttons: Table Visual & Animated Hand Replayer */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setExpandedVisualModuleId(
                        expandedVisualModuleId === mod.id ? null : mod.id
                      )
                    }
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      expandedVisualModuleId === mod.id
                        ? 'bg-gold text-black border-gold font-black'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 hover:border-gold/40'
                    }`}
                  >
                    <Eye size={13} />
                    <span>{expandedVisualModuleId === mod.id ? 'Hide Visual' : 'Table Visual'}</span>
                  </button>

                  {mod.replayHandId ? (
                    <button
                      onClick={() => setActiveReplayerHandId(mod.replayHandId!)}
                      className="py-2 px-2.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition flex items-center justify-center gap-1.5"
                    >
                      <Film size={13} />
                      <span>Hand Replay</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onLaunchPresetDrill(mod.preset)}
                      className="py-2 px-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10 transition flex items-center justify-center gap-1.5"
                    >
                      <Play size={13} />
                      <span>Drill Spot</span>
                    </button>
                  )}
                </div>

                {/* Collapsible Native Table Scenario Visual */}
                {expandedVisualModuleId === mod.id && (
                  <div className="pt-2 animate-in fade-in duration-300">
                    <TableScenarioVisual
                      {...mod.scenarioVisual}
                      onLaunchDrill={onLaunchPresetDrill}
                      compact
                    />
                  </div>
                )}

                <button
                  onClick={() => onLaunchPresetDrill(mod.preset)}
                  className="w-full py-2.5 rounded-xl bg-gold/15 hover:bg-gold text-gold hover:text-black border border-gold/40 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                >
                  <Play size={13} fill="currentColor" /> Practice in Bot Arena
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Hand Replayer Modal Dialog */}
      {activeReplayerHandId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-zinc-950 border-2 border-gold shadow-[0_0_60px_rgba(212,175,55,0.4)]">
            <button
              onClick={() => setActiveReplayerHandId(null)}
              className="absolute top-4 right-4 z-40 p-2 rounded-full bg-black/80 hover:bg-ept-red text-zinc-400 hover:text-white border border-white/20 transition"
              title="Close Replayer"
            >
              <X size={18} />
            </button>
            <InteractiveHandReplayer
              sampleHandId={activeReplayerHandId}
              onClose={() => setActiveReplayerHandId(null)}
            />
          </div>
        </div>
      )}

      {/* 2. AI Bot Opponents Scouting Dossier */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="text-ept-red" size={22} /> AI Bot Profiles & Play-Style Tendencies
          </h2>
          <p className="text-sm text-zinc-400">
            Know your opponents in the Arena—each bot emulates distinct VPIP, PFR, and bluffing frequencies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BOT_ROSTER.map((bot) => (
            <div
              key={bot.id}
              className="bg-black/50 rounded-xl p-4 border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={bot.avatar}
                    alt={bot.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gold/40"
                  />
                  <div>
                    <h4 className="text-sm font-black text-white">{bot.name}</h4>
                    <span className="text-[11px] font-bold text-gold">
                      {bot.nickname}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  {bot.bio}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-mono">
                  <div className="bg-zinc-900 p-1.5 rounded">
                    <div className="text-zinc-500">VPIP</div>
                    <div className="text-white font-bold">{bot.vpipTarget}%</div>
                  </div>
                  <div className="bg-zinc-900 p-1.5 rounded">
                    <div className="text-zinc-500">PFR</div>
                    <div className="text-white font-bold">{bot.pfrTarget}%</div>
                  </div>
                  <div className="bg-zinc-900 p-1.5 rounded">
                    <div className="text-zinc-500">BLUFF</div>
                    <div className="text-ept-red font-bold">{bot.bluffFreq}%</div>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-300 bg-white/5 p-2 rounded">
                  <strong className="text-gold">Signature:</strong> {bot.signatureMove}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Interactive Strategy & Scenario Quiz + League Pro Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upgraded Interactive Quiz (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-gold/25 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
              <h2 className="text-2xl font-black text-gold uppercase tracking-wider flex items-center gap-2">
                <Brain size={22} /> E.P.T. Strategy & Math Exam
              </h2>
              {!quizFinished && (
                <span className="text-xs font-mono text-zinc-400">
                  Question {currentQ + 1} / {ACADEMY_QUIZ_QUESTIONS.length} • Score: {score}
                </span>
              )}
            </div>

            {quizFinished ? (
              <div className="py-10 text-center space-y-4">
                <div className="text-6xl">
                  {score >= 7 ? '🦈' : score >= 5 ? '🕶️' : '🐠'}
                </div>
                <h3 className="text-2xl font-black text-white">
                  Exam Complete: {score} / {ACADEMY_QUIZ_QUESTIONS.length} Correct
                </h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  {score >= 7
                    ? 'Certified E.P.T. Shark! You have mastered Pot-Limit sizing, Bounty conversion math, and GTO ranges.'
                    : 'Solid effort! Review the explanations and test your skills live in the AI Bot Arena.'}
                </p>
                <button
                  onClick={resetQuiz}
                  className="px-6 py-2.5 rounded-xl bg-gold text-black font-black uppercase text-xs tracking-wider hover:brightness-110 transition"
                >
                  Retake Strategy Exam
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="px-2.5 py-1 rounded bg-ept-red/20 border border-ept-red/40 text-ept-red text-[10px] font-black uppercase tracking-widest">
                  {ACADEMY_QUIZ_QUESTIONS[currentQ].category}
                </span>
                <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
                  {ACADEMY_QUIZ_QUESTIONS[currentQ].question}
                </h3>

                <div className="space-y-2.5 pt-2">
                  {ACADEMY_QUIZ_QUESTIONS[currentQ].options.map((opt, idx) => {
                    const isAnswered = selectedOpt !== null;
                    const isCorrect = idx === ACADEMY_QUIZ_QUESTIONS[currentQ].answer;
                    const isChosen = idx === selectedOpt;

                    let style =
                      'bg-black/60 border-white/10 text-zinc-200 hover:border-gold/50';
                    if (isAnswered) {
                      if (isCorrect) {
                        style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
                      } else if (isChosen) {
                        style = 'bg-ept-red/20 border-ept-red text-ept-red';
                      } else {
                        style = 'bg-black/30 border-white/5 text-zinc-500 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs md:text-sm font-semibold transition flex items-center justify-between gap-3 ${style}`}
                      >
                        <span>{opt}</span>
                        {isAnswered && isCorrect && (
                          <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
                        )}
                        {isAnswered && isChosen && !isCorrect && (
                          <XCircle className="text-ept-red shrink-0" size={18} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedOpt !== null && (
                  <div className="mt-4 p-4 rounded-xl bg-black/70 border border-gold/30 space-y-3 animate-in fade-in duration-200">
                    <div className="text-xs text-zinc-300 leading-relaxed">
                      <strong className="text-gold">Coach Explanation: </strong>
                      {ACADEMY_QUIZ_QUESTIONS[currentQ].explanation}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleNextQuestion}
                        className="px-5 py-2 rounded-lg bg-gold text-black font-black text-xs uppercase tracking-wider hover:brightness-110 transition"
                      >
                        {currentQ < ACADEMY_QUIZ_QUESTIONS.length - 1
                          ? 'Next Question →'
                          : 'See Exam Results →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* League Pro Tips (5 Cols) */}
        <div className="lg:col-span-5">
          <LeagueProTips />
        </div>
      </div>

      {/* 4. Official Hand Hierarchy & Searchable Poker Lexicon */}
      <HandGuide />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
          <PokerDictionary />
        </div>
        <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-gold/30 shadow-xl relative group">
          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur px-3 py-1.5 border border-gold/50 rounded text-gold font-bold uppercase tracking-widest text-xs z-10">
            Official E.P.T. Hand Hierarchy Reference
          </div>
          <img
            src="/images/metal-poker-hands.jpg"
            alt="Simple Poker Hands Hierarchy Chart"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </div>
  );
}
