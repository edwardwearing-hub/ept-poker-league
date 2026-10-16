'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, Grid, Target } from 'lucide-react';
import { PositionName, Rank } from '@/lib/poker-trainer/types';
import {
  getPreflopHandPercentileScore,
  POSITION_INFO,
  POSITION_OPEN_THRESHOLDS,
  RANK_VALUES,
} from '@/lib/poker-trainer/constants';
import { calculatePotOdds, getPotLimitMaxTotalBet } from '@/lib/poker-trainer/engine';
import InfoTooltip from './InfoTooltip';

const MATRIX_RANKS: Rank[] = [
  'A',
  'K',
  'Q',
  'J',
  '10',
  '9',
  '8',
  '7',
  '6',
  '5',
  '4',
  '3',
  '2',
];

type RangeMode = 'standard-100bb' | 'aof-10bb-push' | 'bounty-hunter-call';

export default function RangeAndOddsLab() {
  const [selectedPosition, setSelectedPosition] = useState<PositionName>('BTN');
  const [rangeMode, setRangeMode] = useState<RangeMode>('standard-100bb');
  const [inspectedHand, setInspectedHand] = useState<{
    label: string;
    score: number;
    type: 'Pair' | 'Suited' | 'Offsuit';
  }>({
    label: 'AKs',
    score: 91,
    type: 'Suited',
  });

  // Calculator state
  const [calcPot, setCalcPot] = useState(200);
  const [calcCall, setCalcCall] = useState(100);
  const [calcOuts, setCalcOuts] = useState(9);
  const [calcStreet, setCalcStreet] = useState<'Flop' | 'Turn'>('Flop');
  const [calcBounty, setCalcBounty] = useState(200);

  // Threshold for selected position & mode
  const activeThreshold = useMemo(() => {
    const base = POSITION_OPEN_THRESHOLDS[selectedPosition];
    if (rangeMode === 'aof-10bb-push') return Math.max(38, base - 10);
    if (rangeMode === 'bounty-hunter-call') return Math.max(40, base - 8);
    return base;
  }, [selectedPosition, rangeMode]);

  // Build 13x13 grid cells
  const gridCells = useMemo(() => {
    const rows: {
      label: string;
      score: number;
      type: 'Pair' | 'Suited' | 'Offsuit';
      action: 'raise' | 'marginal' | 'fold';
    }[][] = [];

    for (let r = 0; r < MATRIX_RANKS.length; r++) {
      const rowArr = [];
      for (let c = 0; c < MATRIX_RANKS.length; c++) {
        const rankRow = MATRIX_RANKS[r];
        const rankCol = MATRIX_RANKS[c];
        const rDisp = rankRow === '10' ? 'T' : rankRow;
        const cDisp = rankCol === '10' ? 'T' : rankCol;

        let label = '';
        let isSuited = false;
        let type: 'Pair' | 'Suited' | 'Offsuit' = 'Offsuit';

        if (r === c) {
          label = `${rDisp}${cDisp}`;
          type = 'Pair';
        } else if (r < c) {
          label = `${rDisp}${cDisp}s`;
          isSuited = true;
          type = 'Suited';
        } else {
          label = `${cDisp}${rDisp}o`;
          type = 'Offsuit';
        }

        const score = getPreflopHandPercentileScore(
          {
            rank: r <= c ? rankRow : rankCol,
            suit: '♠',
            value: RANK_VALUES[r <= c ? rankRow : rankCol],
          },
          {
            rank: r <= c ? rankCol : rankRow,
            suit: isSuited ? '♠' : '♥',
            value: RANK_VALUES[r <= c ? rankCol : rankRow],
          }
        );

        let action: 'raise' | 'marginal' | 'fold' = 'fold';
        if (score >= activeThreshold) action = 'raise';
        else if (score >= activeThreshold - 6) action = 'marginal';

        rowArr.push({ label, score, type, action });
      }
      rows.push(rowArr);
    }
    return rows;
  }, [activeThreshold]);

  const playablePercentage = useMemo(() => {
    let combosPlayable = 0;
    for (const row of gridCells) {
      for (const cell of row) {
        const weight = cell.type === 'Pair' ? 6 : cell.type === 'Suited' ? 4 : 12;
        if (cell.action === 'raise') combosPlayable += weight;
        else if (cell.action === 'marginal') combosPlayable += weight * 0.5;
      }
    }
    return Math.round((combosPlayable / 1326) * 100);
  }, [gridCells]);

  // Calculator Results
  const calcResults = useMemo(() => {
    const bountyChipBonus = Math.round(calcBounty * 0.5);
    const { rawPotOdds, bountyAdjustedPotOdds } = calculatePotOdds(
      calcCall,
      calcPot,
      bountyChipBonus
    );
    const drawEquity = Math.min(
      95,
      calcOuts * (calcStreet === 'Flop' ? 4 : 2) - (calcOuts > 8 ? calcOuts - 8 : 0)
    );
    const maxPotLimitTotal = getPotLimitMaxTotalBet(calcPot, calcCall, 0, 5000);
    return {
      rawPotOdds,
      bountyAdjustedPotOdds,
      bountyChipBonus,
      drawEquity,
      maxPotLimitTotal,
    };
  }, [calcPot, calcCall, calcOuts, calcStreet, calcBounty]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-300">
      {/* LEFT 7 COLS: 13x13 INTERACTIVE PRE-FLOP RANGE MATRIX */}
      <div className="xl:col-span-7 glass-panel rounded-2xl p-6 border border-gold/25">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Grid className="text-gold" size={20} />
              <InfoTooltip
                title="How to Read a 13×13 Poker Range Grid"
                description="All 169 possible starting hands are arranged in a 13×13 square. The diagonal from top-left (AA) to bottom-right (22) shows Pocket Pairs. Everything above the diagonal is Suited ('s', 4 combos each). Everything below the diagonal is Offsuit ('o', 12 combos each)."
              >
                <span>Interactive 13×13 Pre-Flop Range Visualizer</span>
              </InfoTooltip>
            </h3>
            <p className="text-xs text-zinc-400">
              Upper-right triangle = Suited (`s`) • Diagonal = Pocket Pairs • Lower-left = Offsuit (`o`)
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-gold/15 border border-gold/40 text-gold text-xs font-black">
            <InfoTooltip
              title="Playable Combos Percentage"
              description="Out of 1,326 total two-card combinations in a 52-card deck, this shows the exact percentage of hands recommended to play from the selected seat and format."
            >
              <span>Playable Range: ~{playablePercentage}% of Hands</span>
            </InfoTooltip>
          </div>
        </div>

        {/* Position & Format Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as PositionName[]).map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                title={`${POSITION_INFO[pos]?.title}: ${POSITION_INFO[pos]?.description}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition border ${
                  selectedPosition === pos
                    ? 'bg-gold text-black border-gold shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                    : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                }`}
              >
                {pos}
              </button>
            ))}
            <InfoTooltip
              title={POSITION_INFO[selectedPosition]?.title || selectedPosition}
              description={POSITION_INFO[selectedPosition]?.description || ''}
              example={POSITION_INFO[selectedPosition]?.rangeTip}
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                {
                  id: 'standard-100bb',
                  label: '100BB Standard',
                  tip: 'Standard 100 BB open-raise ranges for cash games and early tournament levels.',
                },
                {
                  id: 'aof-10bb-push',
                  label: '10BB Push/Fold',
                  tip: 'Short-stack All-In or Fold Nash Equilibrium shove ranges when sitting around 10 Big Blinds.',
                },
                {
                  id: 'bounty-hunter-call',
                  label: 'Bounty Wide',
                  tip: 'Expanded Bounty Hunter (PKO) ranges when covering a short-stacked opponent with a juicy bounty.',
                },
              ] as { id: RangeMode; label: string; tip: string }[]
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setRangeMode(m.id)}
                title={m.tip}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                  rangeMode === m.id
                    ? 'bg-ept-red text-white border-ept-red'
                    : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 13x13 Hand Chart Grid */}
        <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1 bg-black/60 p-2 rounded-xl border border-white/10 select-none">
          {gridCells.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isInspected = inspectedHand.label === cell.label;
              const cellStyle =
                cell.action === 'raise'
                  ? 'bg-emerald-600/85 hover:bg-emerald-500 text-white border-emerald-400/50'
                  : cell.action === 'marginal'
                  ? 'bg-amber-500/75 hover:bg-amber-400 text-black border-amber-300/50'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-500 border-white/5';

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  onClick={() =>
                    setInspectedHand({
                      label: cell.label,
                      score: cell.score,
                      type: cell.type,
                    })
                  }
                  title={`${cell.label} (${cell.type}) • Strength: ${cell.score}/100 • Action in ${selectedPosition}: ${cell.action.toUpperCase()}`}
                  className={`aspect-square rounded flex items-center justify-center text-[9px] sm:text-[11px] font-black border transition ${cellStyle} ${
                    isInspected ? 'ring-2 ring-gold scale-110 z-10' : ''
                  }`}
                >
                  {cell.label}
                </button>
              );
            })
          )}
        </div>

        {/* Legend & Inspected Hand Inspector */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/50 p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <strong className="text-white">
                {rangeMode === 'aof-10bb-push' ? 'All-In Push' : 'Raise / Open'}
              </strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
              <strong className="text-white">Mixed / Situational</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-zinc-800 border border-white/20 inline-block" />
              <strong className="text-zinc-400">Fold</strong>
            </span>
          </div>

          <div className="text-xs text-right">
            <span className="text-zinc-400">Selected Hand: </span>
            <strong className="text-gold text-sm font-black">{inspectedHand.label}</strong>{' '}
            <span className="text-zinc-400">
              ({inspectedHand.type} • Power Rating: {inspectedHand.score}/100)
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT 5 COLS: POT ODDS, OUTS & BOUNTY HUNTER CALCULATOR */}
      <div className="xl:col-span-5 glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
            <Calculator className="text-gold" size={20} />
            <InfoTooltip
              title="Interactive Pot Odds, Pot-Limit & Bounty Calculator"
              description="Drag the sliders below to test any live game scenario. Instantly compares your Draw Equity % against both Standard Pot Odds % and Bounty-Adjusted Pot Odds %."
            >
              <span>Pot Odds, Pot-Limit & Bounty Lab</span>
            </InfoTooltip>
          </h3>
          <p className="text-xs text-zinc-400 mb-6 pb-3 border-b border-white/10">
            Interactive calculator for Draw Equity, Pot-Limit max bets, and PKO Bounty chip-equity discounts.
          </p>

          <div className="space-y-4">
            {/* Current Pot Input */}
            <div className="bg-black/50 p-3.5 rounded-xl border border-white/10">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <InfoTooltip
                  title="Pot Size Before Your Call"
                  description="The total amount currently in the middle of the table (including the opponent's bet) before you put in your matching call."
                >
                  <span className="text-zinc-300">Pot Size Before Call:</span>
                </InfoTooltip>
                <span className="text-gold font-mono">£{calcPot}</span>
              </div>
              <input
                type="range"
                min={20}
                max={2000}
                step={10}
                value={calcPot}
                onChange={(e) => setCalcPot(Number(e.target.value))}
                className="w-full accent-gold cursor-pointer"
              />
            </div>

            {/* Bet to Call Input */}
            <div className="bg-black/50 p-3.5 rounded-xl border border-white/10">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <InfoTooltip
                  title="Opponent Bet to Call"
                  description="The exact chip amount you must put into the pot to match your opponent's bet and see the next card."
                >
                  <span className="text-zinc-300">Opponent Bet to Call:</span>
                </InfoTooltip>
                <span className="text-emerald-400 font-mono">£{calcCall}</span>
              </div>
              <input
                type="range"
                min={10}
                max={1500}
                step={10}
                value={calcCall}
                onChange={(e) => setCalcCall(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Outs & Street Selector */}
            <div className="bg-black/50 p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <InfoTooltip
                  title="Clean Outs & The Rule of 4 and 2"
                  description="An 'Out' is any unseen card in the deck that improves your hand to the winner. On the Flop (with Turn and River still to come), multiply Outs × 4. On the Turn (only River left), multiply Outs × 2."
                >
                  <span className="text-zinc-300">Your Clean Outs ({calcOuts} Outs):</span>
                </InfoTooltip>
                <div className="flex gap-1">
                  {(['Flop', 'Turn'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setCalcStreet(st)}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                        calcStreet === st
                          ? 'bg-cyan-500 text-black'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {st} ({st === 'Flop' ? '×4' : '×2'})
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={calcOuts}
                onChange={(e) => setCalcOuts(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: 'Gutshot (4)', val: 4 },
                  { label: 'Two Overcards (6)', val: 6 },
                  { label: 'Open-Ended (8)', val: 8 },
                  { label: 'Flush Draw (9)', val: 9 },
                  { label: 'Monster Combo (15)', val: 15 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setCalcOuts(preset.val)}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-zinc-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opponent Bounty Value (for Bounty Hunter Mode) */}
            <div className="bg-black/50 p-3.5 rounded-xl border border-ept-red/30">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <InfoTooltip
                  title="Covered Opponent Bounty (PKO)"
                  description="In Bounty Hunter (PKO) tournaments, if an opponent is all-in and you have more chips than them ('cover them'), knocking them out wins 50% of their bounty immediately—adding extra reward to the pot!"
                >
                  <span className="text-ept-red flex items-center gap-1">
                    <Target size={13} /> Covered All-In Opponent Bounty:
                  </span>
                </InfoTooltip>
                <span className="text-ept-red font-mono">£{calcBounty}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1000}
                step={25}
                value={calcBounty}
                onChange={(e) => setCalcBounty(Number(e.target.value))}
                className="w-full accent-ept-red cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Computed Output Cards */}
        <div className="mt-6 space-y-3 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-black/60 p-3 rounded-xl border border-white/10">
              <div className="text-[10px] uppercase text-zinc-400 font-bold">
                <InfoTooltip
                  title="Estimated Draw Equity (%)"
                  description="Your probability of hitting one of your Outs by the River."
                  size={11}
                >
                  <span>Draw Equity</span>
                </InfoTooltip>
              </div>
              <div className="text-xl font-black text-cyan-400 mt-0.5">
                {calcResults.drawEquity}%
              </div>
            </div>
            <div className="bg-black/60 p-3 rounded-xl border border-white/10">
              <div className="text-[10px] uppercase text-zinc-400 font-bold">
                <InfoTooltip
                  title="Standard Pot Odds (%)"
                  description="Required equity to call in a normal game with no bounties."
                  formula="Call / (Pot + Call)"
                  size={11}
                >
                  <span>Std Pot Odds</span>
                </InfoTooltip>
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {calcResults.rawPotOdds}%
              </div>
            </div>
            <div className="bg-black/60 p-3 rounded-xl border border-ept-red/40">
              <div className="text-[10px] uppercase text-ept-red font-bold">
                <InfoTooltip
                  title="Bounty-Adjusted Pot Odds (%)"
                  description="Required equity to call when covering an all-in player in Bounty Hunter mode."
                  formula="Call / (Pot + Call + 50% Bounty)"
                  size={11}
                >
                  <span>Bounty Odds</span>
                </InfoTooltip>
              </div>
              <div className="text-xl font-black text-ept-red mt-0.5">
                {calcResults.bountyAdjustedPotOdds}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
            <InfoTooltip
              title="Pot-Limit Maximum Bet Formula"
              description="In Pot-Limit formats, the maximum you can raise to is the current pot plus twice the call amount."
              formula={`£${calcPot} + (2 × £${calcCall}) = £${calcResults.maxPotLimitTotal}`}
            >
              <span className="text-cyan-200 font-semibold">
                Pot-Limit Max Total Bet/Raise:
              </span>
            </InfoTooltip>
            <span className="font-mono font-black text-cyan-400 text-sm">
              £{calcResults.maxPotLimitTotal}
            </span>
          </div>

          <div
            className={`p-3.5 rounded-xl border text-center font-black text-xs uppercase tracking-wider ${
              calcResults.drawEquity >= calcResults.rawPotOdds
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : calcResults.drawEquity >= calcResults.bountyAdjustedPotOdds
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-ept-red/20 border-ept-red text-ept-red'
            }`}
          >
            {calcResults.drawEquity >= calcResults.rawPotOdds
              ? `✅ +EV Direct Call in All Formats (${calcResults.drawEquity}% Equity >= ${calcResults.rawPotOdds}% Odds)`
              : calcResults.drawEquity >= calcResults.bountyAdjustedPotOdds
              ? `🎯 +EV Call in Bounty Hunter Mode Only (${calcResults.drawEquity}% >= ${calcResults.bountyAdjustedPotOdds}% Bounty Odds)`
              : `❌ -EV Call Without Implied Odds (${calcResults.drawEquity}% Equity < ${calcResults.bountyAdjustedPotOdds}% Required)`}
          </div>
        </div>
      </div>
    </div>
  );
}
