'use client';

import React, { useState } from 'react';
import { Brain, Trophy, AlertTriangle, CheckCircle2, XCircle, ArrowRight, RotateCcw, Sparkles, HelpCircle } from 'lucide-react';

interface Card {
    rank: string;
    suit: '♠' | '♥' | '♦' | '♣';
}

interface Scenario {
    id: string;
    title: string;
    episode: string;
    heroName: string;
    heroCards: [Card, Card];
    boardCards: Card[];
    potBeforeBet: number;
    villainBet: number;
    villainName: string;
    effectiveStack: number;
    description: string;
    options: {
        action: 'FOLD' | 'CALL' | 'RAISE';
        label: string;
        isOptimal: boolean;
        verdict: string;
        explanation: string;
    }[];
    tacticalDebrief: {
        potOddsFraction: string;
        breakevenEquityPercent: number;
        coachNotes: string;
        blockerEffect: string;
    };
}

const LEAGUE_PUZZLES: Scenario[] = [
    {
        id: 'puzzle-1',
        title: "Liam's River Bomb vs. The Professor",
        episode: 'Episode 4 — High Stakes River Dilemma',
        heroName: 'Dave Blackburn (The Professor)',
        heroCards: [
            { rank: 'K', suit: '♠' },
            { rank: 'Q', suit: '♠' }
        ],
        boardCards: [
            { rank: 'Q', suit: '♦' },
            { rank: 'J', suit: '♠' },
            { rank: '10', suit: '♥' },
            { rank: '8', suit: '♠' },
            { rank: '2', suit: '♣' }
        ],
        potBeforeBet: 50,
        villainBet: 25,
        villainName: 'Liam Duxbury (TAG Shark)',
        effectiveStack: 35,
        description: 'Liam fired on the flop and turn, and now bombs £25 on a blank river into a £50 pot. You hold Top Pair (Second Kicker) with missed spade combo-draw blockers.',
        options: [
            {
                action: 'FOLD',
                label: 'Fold Hand',
                isOptimal: false,
                verdict: 'Over-Folding Leak (-EV)',
                explanation: 'Folding surrenders £50 without requiring Liam to show a straight. With your K♠ blocker eliminating key straight combos (AK, K9), this fold bleeds long-term expected value.'
            },
            {
                action: 'CALL',
                label: 'Call £25',
                isOptimal: true,
                verdict: 'GTO Optimal Move (+EV)',
                explanation: 'Correct! You are getting 3-to-1 on a call (25% pot share, 33.3% equity required). Liam frequently barrels missed spades (e.g. A♠4♠) and weaker Queens. Your K♠ unblocks his bluffing range.'
            },
            {
                action: 'RAISE',
                label: 'Raise / All-In £35',
                isOptimal: false,
                verdict: 'Blunder (-EV)',
                explanation: 'Raising only folds out the missed draws that you currently beat, while isolating your hand against made straights (9x, AK). You turn a solid bluff-catcher into a negative EV bluff.'
            }
        ],
        tacticalDebrief: {
            potOddsFraction: '£25 to win £75 (3:1)',
            breakevenEquityPercent: 25.0,
            coachNotes: 'In E.P.T. live play, Liam has an Aggression Factor > 3.0 on river boards when flush draws miss. Folding top pair with key blockers gives up +1.8 BB/100.',
            blockerEffect: 'Holding K♠ removes 50% of Liam’s nut straight combos (AK, K9) while preserving his missed spade flush-draw bluffs.'
        }
    },
    {
        id: 'puzzle-2',
        title: "The Bounty's Overbet Shove on the Turn",
        episode: 'Episode 3 — Final Table Bubble Clash',
        heroName: 'Luke Daly (The Duke)',
        heroCards: [
            { rank: 'A', suit: '♥' },
            { rank: 'K', suit: '♦' }
        ],
        boardCards: [
            { rank: 'A', suit: '♣' },
            { rank: '7', suit: '♠' },
            { rank: '4', suit: '♦' },
            { rank: '9', suit: '♣' }
        ],
        potBeforeBet: 60,
        villainBet: 45,
        villainName: 'Edward Wearing (The Bounty)',
        effectiveStack: 45,
        description: 'On the turn, Edward shoves all-in for £45 into a £60 pot. You hold Top Pair Top Kicker with no club redraw on an uncoordinated runout.',
        options: [
            {
                action: 'CALL',
                label: 'Call All-In (£45)',
                isOptimal: true,
                verdict: 'Hero Call (+EV)',
                explanation: 'Correct! Total pot after your call is £150. You only need to be right 30% of the time. Edward’s hyper-aggressive shoving range on the bubble includes weaker Aces (A2-A6) and semi-bluff club draws.'
            },
            {
                action: 'FOLD',
                label: 'Fold Hand',
                isOptimal: false,
                verdict: 'Too Passive (-EV)',
                explanation: 'Folding TPTK against Edward’s wide button range allows him to exploit the table with high VPIP aggression.'
            },
            {
                action: 'RAISE',
                label: 'Re-Raise',
                isOptimal: false,
                verdict: 'Invalid / Redundant',
                explanation: 'Villain is already all-in for the effective stack.'
            }
        ],
        tacticalDebrief: {
            potOddsFraction: '£45 to win £105 (2.33:1)',
            breakevenEquityPercent: 30.0,
            coachNotes: 'Edward’s VPIP exceeds 38%. His turn shoves include flush draws (Q♣J♣, K♣10♣) and pair+draw combinations.',
            blockerEffect: 'Holding A♥ unblocks the nut flush draw (A♣ is on board), leaving Edward with full flush draw combos.'
        }
    }
];

export default function HandOfTheWeekPuzzle() {
    const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const puzzle = LEAGUE_PUZZLES[selectedScenarioIdx];
    const chosenOption = puzzle.options.find(o => o.action === selectedAction);

    const handleSelectAction = (action: 'FOLD' | 'CALL' | 'RAISE') => {
        if (submitted) return;
        setSelectedAction(action);
    };

    const handleSubmit = () => {
        if (!selectedAction) return;
        setSubmitted(true);
    };

    const handleReset = () => {
        setSelectedAction(null);
        setSubmitted(false);
    };

    const handleNextPuzzle = () => {
        setSelectedScenarioIdx((prev) => (prev + 1) % LEAGUE_PUZZLES.length);
        setSelectedAction(null);
        setSubmitted(false);
    };

    // Card suit styling helper
    const getSuitClass = (suit: '♠' | '♥' | '♦' | '♣') => {
        if (suit === '♠') return 'text-zinc-900';
        if (suit === '♥') return 'text-red-600';
        if (suit === '♦') return 'text-blue-600';
        return 'text-emerald-600';
    };

    return (
        <section className="glass-panel p-4 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-[0_10px_35px_rgba(6,182,212,0.1)] relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                                Hand of the Week League Puzzle
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-mono font-black uppercase">
                                Real E.P.T. Hands
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-400">
                            {puzzle.episode}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={handleNextPuzzle}
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                    >
                        <span>Next Scenario ({selectedScenarioIdx + 1}/{LEAGUE_PUZZLES.length})</span>
                        <ArrowRight size={13} />
                    </button>
                </div>
            </div>

            {/* Hand Stage & Table Visual */}
            <div className="bg-gradient-to-b from-slate-900/80 via-black to-slate-950/90 rounded-2xl border border-white/10 p-4 sm:p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <span className="text-[10px] font-mono uppercase font-black tracking-widest text-gold block mb-1">
                            {puzzle.title}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-zinc-200">
                            Hero: <span className="text-white font-black">{puzzle.heroName}</span> vs. Villain: <span className="text-rose-400 font-black">{puzzle.villainName}</span>
                        </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-gold/40 text-xs font-mono">
                            <span className="text-zinc-500 uppercase mr-1">Pot:</span>
                            <span className="text-gold font-black">£{puzzle.potBeforeBet}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-rose-500/40 text-xs font-mono">
                            <span className="text-zinc-500 uppercase mr-1">Villain Bet:</span>
                            <span className="text-rose-400 font-black">£{puzzle.villainBet}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/40 text-xs font-mono">
                            <span className="text-zinc-500 uppercase mr-1">Stack:</span>
                            <span className="text-cyan-300 font-black">£{puzzle.effectiveStack}</span>
                        </div>
                    </div>
                </div>

                {/* Cards Display Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-y border-white/10 py-6 my-2">
                    {/* Hero Cards */}
                    <div className="flex flex-col items-center sm:items-start gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-gold" />
                            <span>Hero Hole Cards</span>
                        </span>
                        <div className="flex gap-2">
                            {puzzle.heroCards.map((c, i) => (
                                <div
                                    key={i}
                                    className={`w-14 h-20 sm:w-16 sm:h-24 rounded-xl bg-white border-2 border-zinc-300 shadow-xl flex flex-col justify-between p-2 font-black select-none ${getSuitClass(c.suit)}`}
                                >
                                    <div className="leading-none text-left">
                                        <div className="text-sm sm:text-base">{c.rank}</div>
                                        <div className="text-xs">{c.suit}</div>
                                    </div>
                                    <div className="text-center text-xl sm:text-2xl leading-none">
                                        {c.suit}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Community Board */}
                    <div className="flex flex-col items-center sm:items-start gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                            Community Board Runout
                        </span>
                        <div className="flex gap-2 flex-wrap">
                            {puzzle.boardCards.map((c, i) => (
                                <div
                                    key={i}
                                    className={`w-12 h-18 sm:w-14 sm:h-20 rounded-xl bg-white border-2 border-zinc-300 shadow-md flex flex-col justify-between p-1.5 font-black select-none ${getSuitClass(c.suit)}`}
                                >
                                    <div className="leading-none text-left">
                                        <div className="text-xs sm:text-sm">{c.rank}</div>
                                        <div className="text-[10px]">{c.suit}</div>
                                    </div>
                                    <div className="text-center text-lg sm:text-xl leading-none">
                                        {c.suit}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 italic pt-2">
                    &quot;{puzzle.description}&quot;
                </p>
            </div>

            {/* Interactive Decision Controls */}
            {!submitted ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-300">
                            Select Your Move:
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                            Test your GTO Decision Quality
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {puzzle.options.map((opt) => {
                            const isSelected = selectedAction === opt.action;
                            return (
                                <button
                                    key={opt.action}
                                    type="button"
                                    onClick={() => handleSelectAction(opt.action)}
                                    className={`p-4 rounded-2xl border-2 font-bold text-left transition-all active:scale-95 ${
                                        isSelected
                                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                            : 'bg-black/40 border-white/10 text-zinc-300 hover:border-white/30 hover:bg-white/5'
                                    }`}
                                >
                                    <div className="text-xs font-mono uppercase text-zinc-500 mb-1">
                                        Action
                                    </div>
                                    <div className="text-base sm:text-lg font-black text-white">
                                        {opt.label}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            disabled={!selectedAction}
                            onClick={handleSubmit}
                            className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-xl ${
                                selectedAction
                                    ? 'bg-gradient-to-r from-gold via-amber-400 to-gold text-black hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-white/5'
                            }`}
                        >
                            Submit Tactical Decision
                        </button>
                    </div>
                </div>
            ) : (
                /* Instant Visual Mathematical Feedback & Tactical Debrief */
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    {chosenOption && (
                        <div className={`p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                            chosenOption.isOptimal
                                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                                : 'bg-rose-950/40 border-rose-500/60 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
                        }`}>
                            <div className="flex items-center gap-3">
                                {chosenOption.isOptimal ? (
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                                ) : (
                                    <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                                )}
                                <div>
                                    <div className="text-xs font-mono uppercase tracking-widest font-black">
                                        Your Move: {chosenOption.label} — {chosenOption.verdict}
                                    </div>
                                    <div className="text-sm sm:text-base font-bold text-white mt-1">
                                        {chosenOption.explanation}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 self-end sm:self-auto shrink-0"
                            >
                                <RotateCcw size={13} />
                                <span>Try Again</span>
                            </button>
                        </div>
                    )}

                    {/* Math & GTO Breakdown Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Pot Odds & Breakeven Equity */}
                        <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
                                <HelpCircle size={14} /> Mathematical Pot Odds & Equity
                            </span>
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="text-[10px] text-zinc-500 uppercase font-mono">Pot Odds Offered</div>
                                    <div className="text-base sm:text-lg font-black text-white font-mono mt-0.5">
                                        {puzzle.tacticalDebrief.potOddsFraction}
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="text-[10px] text-zinc-500 uppercase font-mono">Breakeven Calling Equity</div>
                                    <div className="text-base sm:text-lg font-black text-cyan-300 font-mono mt-0.5">
                                        {puzzle.tacticalDebrief.breakevenEquityPercent}%
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-zinc-400 font-mono pt-1">
                                Formula: <code className="text-gold">E = Bet / (Pot + Bet) = £{puzzle.villainBet} / (£{puzzle.potBeforeBet} + £{puzzle.villainBet}) = {puzzle.tacticalDebrief.breakevenEquityPercent}%</code>
                            </div>
                        </div>

                        {/* Blocker & Meta Analysis */}
                        <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                                <Trophy size={14} /> League Meta & Blocker Analysis
                            </span>
                            <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                                {puzzle.tacticalDebrief.coachNotes}
                            </div>
                            <div className="text-xs text-zinc-400 pt-1 border-t border-white/5">
                                <strong className="text-zinc-300">Blocker Effect:</strong> {puzzle.tacticalDebrief.blockerEffect}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
