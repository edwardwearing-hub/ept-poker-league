'use client';

import React, { useState } from 'react';
import { HelpCircle, Trophy, Sparkles, Plus, Check, Trash2, ArrowRight } from 'lucide-react';
import { VegasChipRack } from '../VegasChip';
import VegasWinSplash from '../VegasWinSplash';
import { playChipSound, playWinSound } from '@/lib/vegas/VegasAudio';
import { addGameHistory } from '@/lib/vegas/VegasHistory';

interface Props {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onOpenTutorial: () => void;
}

interface Fixture {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  drawOdds?: number;
  awayOdds: number;
  overOdds: number;
  underOdds: number;
  simulatedScore?: { home: number; away: number };
}

const DEFAULT_FIXTURES: Fixture[] = [
  {
    id: 'f1',
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    homeOdds: 1.85,
    drawOdds: 3.4,
    awayOdds: 4.2,
    overOdds: 1.75,
    underOdds: 2.05,
  },
  {
    id: 'f2',
    league: 'Premier League',
    homeTeam: 'Liverpool',
    awayTeam: 'Man City',
    homeOdds: 2.3,
    drawOdds: 3.5,
    awayOdds: 2.8,
    overOdds: 1.6,
    underOdds: 2.25,
  },
  {
    id: 'f3',
    league: 'Champions League',
    homeTeam: 'Real Madrid',
    awayTeam: 'Bayern Munich',
    homeOdds: 2.1,
    drawOdds: 3.6,
    awayOdds: 3.1,
    overOdds: 1.65,
    underOdds: 2.2,
  },
  {
    id: 'f4',
    league: 'Champions League',
    homeTeam: 'Barcelona',
    awayTeam: 'Paris SG',
    homeOdds: 2.25,
    drawOdds: 3.7,
    awayOdds: 2.9,
    overOdds: 1.55,
    underOdds: 2.4,
  },
  {
    id: 'f5',
    league: 'Championship Title',
    homeTeam: 'Tyson Fury',
    awayTeam: 'Oleksandr Usyk',
    homeOdds: 1.95,
    drawOdds: 14.0,
    awayOdds: 1.85,
    overOdds: 1.9,
    underOdds: 1.9,
  },
];

interface BetSelection {
  fixtureId: string;
  matchName: string;
  pickName: string;
  odds: number;
  outcomeType: 'home' | 'draw' | 'away' | 'over' | 'under';
}

export default function SportsbookGame({ bankroll, onUpdateBankroll, onOpenTutorial }: Props) {
  const [fixtures, setFixtures] = useState<Fixture[]>(DEFAULT_FIXTURES);
  const [betSlip, setBetSlip] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState(25);
  const [isParlay, setIsParlay] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [splashWin, setSplashWin] = useState<number | null>(null);
  const [settledResult, setSettledResult] = useState<{
    won: boolean;
    totalReturn: number;
    message: string;
  } | null>(null);

  const parlayMultiplier = betSlip.reduce((acc, b) => acc * b.odds, 1);
  const potentialReturn = isParlay
    ? Math.floor(stake * parlayMultiplier)
    : Math.floor(
        stake * (betSlip.reduce((acc, b) => acc + b.odds, 0) / (betSlip.length || 1))
      );

  const toggleSelection = (fixture: Fixture, pickName: string, odds: number, outcomeType: BetSelection['outcomeType']) => {
    setSettledResult(null);
    playChipSound();
    const existingIdx = betSlip.findIndex(
      (b) => b.fixtureId === fixture.id && b.pickName === pickName
    );

    if (existingIdx !== -1) {
      setBetSlip((prev) => prev.filter((_, i) => i !== existingIdx));
    } else {
      // Remove other pick from same fixture if any
      const cleaned = betSlip.filter((b) => b.fixtureId !== fixture.id);
      cleaned.push({
        fixtureId: fixture.id,
        matchName: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
        pickName,
        odds,
        outcomeType,
      });
      setBetSlip(cleaned);
    }
  };

  const isSelected = (fixtureId: string, pickName: string) => {
    return betSlip.some((b) => b.fixtureId === fixtureId && b.pickName === pickName);
  };

  const handleSimulateMatches = () => {
    if (betSlip.length === 0 || stake > bankroll || simulating) return;
    setSimulating(true);
    setSettledResult(null);

    // Deduct stake upfront
    onUpdateBankroll(-stake);

    setTimeout(() => {
      // Generate scores for all fixtures
      const updatedFixtures = fixtures.map((f) => {
        const homeScore = Math.floor(Math.random() * 4);
        const awayScore = Math.floor(Math.random() * 4);
        return {
          ...f,
          simulatedScore: { home: homeScore, away: awayScore },
        };
      });

      setFixtures(updatedFixtures);
      setSimulating(false);

      // Settle Bets
      if (isParlay) {
        // Every leg must win
        let allLegsWon = true;
        for (const pick of betSlip) {
          const match = updatedFixtures.find((f) => f.id === pick.fixtureId)!;
          const score = match.simulatedScore!;
          let legWon = false;

          if (pick.outcomeType === 'home' && score.home > score.away) legWon = true;
          if (pick.outcomeType === 'draw' && score.home === score.away) legWon = true;
          if (pick.outcomeType === 'away' && score.away > score.home) legWon = true;
          if (pick.outcomeType === 'over' && score.home + score.away > 2.5) legWon = true;
          if (pick.outcomeType === 'under' && score.home + score.away < 2.5) legWon = true;

          if (!legWon) {
            allLegsWon = false;
            break;
          }
        }

        if (allLegsWon) {
          const totalWin = potentialReturn;
          onUpdateBankroll(totalWin);
          playWinSound();
          setSplashWin(totalWin);
          setSettledResult({
            won: true,
            totalReturn: totalWin,
            message: `🎉 PARLAY CASHOUT! All ${betSlip.length} legs won! Return: +£${totalWin.toLocaleString()}!`,
          });
          addGameHistory({
            gameId: 'sportsbook',
            headline: 'Parlay Cashed Out! 🎉',
            detail: `${betSlip.length}-leg parlay hit • Return £${totalWin.toLocaleString()}`,
            delta: totalWin - stake,
            badge: `${parlayMultiplier.toFixed(2)}x`,
          });
        } else {
          setSettledResult({
            won: false,
            totalReturn: 0,
            message: `Parlay busted. One or more legs failed to land. Better luck next time!`,
          });
          addGameHistory({
            gameId: 'sportsbook',
            headline: 'Parlay Busted',
            detail: `${betSlip.length}-leg parlay missed • Lost £${stake.toLocaleString()}`,
            delta: -stake,
            badge: 'Busted',
          });
        }
      } else {
        // Singles settlement
        let singlesWinTotal = 0;
        const stakePerLeg = Math.floor(stake / betSlip.length);

        for (const pick of betSlip) {
          const match = updatedFixtures.find((f) => f.id === pick.fixtureId)!;
          const score = match.simulatedScore!;
          let legWon = false;

          if (pick.outcomeType === 'home' && score.home > score.away) legWon = true;
          if (pick.outcomeType === 'draw' && score.home === score.away) legWon = true;
          if (pick.outcomeType === 'away' && score.away > score.home) legWon = true;
          if (pick.outcomeType === 'over' && score.home + score.away > 2.5) legWon = true;
          if (pick.outcomeType === 'under' && score.home + score.away < 2.5) legWon = true;

          if (legWon) {
            singlesWinTotal += Math.floor(stakePerLeg * pick.odds);
          }
        }

        if (singlesWinTotal > 0) {
          onUpdateBankroll(singlesWinTotal);
          if (singlesWinTotal > stake) {
            playWinSound();
            setSplashWin(singlesWinTotal);
          }
          setSettledResult({
            won: singlesWinTotal > stake,
            totalReturn: singlesWinTotal,
            message: `Singles Settled: Returned £${singlesWinTotal.toLocaleString()}!`,
          });
          addGameHistory({
            gameId: 'sportsbook',
            headline: singlesWinTotal >= stake ? 'Singles Profit' : 'Singles Partial Return',
            detail: `Returned £${singlesWinTotal.toLocaleString()} from £${stake.toLocaleString()} stake`,
            delta: singlesWinTotal - stake,
            badge: 'Singles',
          });
        } else {
          setSettledResult({
            won: false,
            totalReturn: 0,
            message: `All singles lost.`,
          });
          addGameHistory({
            gameId: 'sportsbook',
            headline: 'All Singles Lost',
            detail: `Lost £${stake.toLocaleString()} across ${betSlip.length} picks`,
            delta: -stake,
            badge: 'Loss',
          });
        }
      }
    }, 1200);
  };

  return (
    <div className="relative w-full rounded-[2.5rem] bg-gradient-to-b from-[#18181b] via-[#09090b] to-black p-3 sm:p-6 border-4 border-zinc-700 shadow-[0_30px_70px_rgba(0,0,0,0.95)] select-none overflow-hidden space-y-6">
      {/* Stadium Overhead Floodlight Beam */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(212,175,55,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 75%)',
        }}
      />

      {/* Big Win Splash Banner */}
      <VegasWinSplash winAmount={splashWin} title="SPORTSBOOK CASHOUT!" onComplete={() => setSplashWin(null)} />

      {/* Header with Stadium LED Ticker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Game #8 • Westgate SuperBook™
            </span>
            <span className="text-emerald-400 text-xs font-mono font-bold">4K Stadium LED Wall</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
            <span>Vegas VIP Sportsbook & Parlay Lounge</span>
            <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
              Multi-Leg Boosts
            </span>
          </h3>
        </div>

        <button
          onClick={onOpenTutorial}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition"
        >
          <HelpCircle size={14} className="text-gold" />
          <span>Rules & Tutorial</span>
        </button>
      </div>

      {/* Main Sportsbook Grid: LED Fixtures Board (Left 8 cols) + Physical Thermal Bet Slip (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        {/* Left: Stadium LED Fixtures Wall */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between bg-black/80 px-3.5 py-2 rounded-xl border border-zinc-800 text-[11px] font-mono font-black text-amber-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE LAS VEGAS BOARD (ODDS VIA CAESARS BOOK)</span>
            </div>
            <span className="text-zinc-500 hidden sm:inline">MONEYLINE (1 X 2) • OVER/UNDER</span>
          </div>

          <div className="space-y-3">
            {fixtures.map((f) => (
              <div
                key={f.id}
                className="relative bg-gradient-to-b from-zinc-900 via-black to-zinc-950 p-4 rounded-2xl border-2 border-zinc-700/80 shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.1)] hover:border-amber-400/40 transition space-y-3 group"
              >
                {/* Match Info Bar */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-mono font-black uppercase tracking-wider text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/30">
                    {f.league}
                  </span>
                  {f.simulatedScore ? (
                    <span className="font-mono font-black text-emerald-300 px-3 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse">
                      FINAL: {f.homeTeam} {f.simulatedScore.home} - {f.simulatedScore.away} {f.awayTeam}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      BOARD LOCKED • ACCEPTING WAGERS
                    </span>
                  )}
                </div>

                {/* Team Names */}
                <div className="text-base sm:text-lg font-black text-white flex items-center justify-between">
                  <span className="group-hover:text-amber-300 transition-colors">{f.homeTeam}</span>
                  <span className="text-xs text-zinc-500 font-mono font-bold px-2 py-0.5 rounded bg-white/5">VS</span>
                  <span className="group-hover:text-amber-300 transition-colors">{f.awayTeam}</span>
                </div>

                {/* 3D LED Matrix Odds Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs font-mono">
                  {/* Home Win */}
                  <button
                    onClick={() => toggleSelection(f, `${f.homeTeam} Win`, f.homeOdds, 'home')}
                    className={`py-2 px-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-150 active:translate-y-0.5 ${
                      isSelected(f.id, `${f.homeTeam} Win`)
                        ? 'bg-gradient-to-b from-[#ffd700] via-[#f59e0b] to-[#b45309] text-black border-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.7),inset_0_2px_4px_rgba(255,255,255,0.7)] font-black'
                        : 'bg-gradient-to-b from-zinc-800 to-zinc-900 text-zinc-200 border-zinc-700 hover:border-amber-400/50 shadow-sm'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-sans truncate max-w-[85px]">
                      {f.homeTeam}
                    </span>
                    <span className="font-black text-sm mt-0.5">{f.homeOdds.toFixed(2)}</span>
                  </button>

                  {/* Draw */}
                  {f.drawOdds && (
                    <button
                      onClick={() => toggleSelection(f, 'Draw', f.drawOdds!, 'draw')}
                      className={`py-2 px-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-150 active:translate-y-0.5 ${
                        isSelected(f.id, 'Draw')
                          ? 'bg-gradient-to-b from-[#ffd700] via-[#f59e0b] to-[#b45309] text-black border-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.7),inset_0_2px_4px_rgba(255,255,255,0.7)] font-black'
                          : 'bg-gradient-to-b from-zinc-800 to-zinc-900 text-zinc-200 border-zinc-700 hover:border-amber-400/50 shadow-sm'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-sans">Draw</span>
                      <span className="font-black text-sm mt-0.5">{f.drawOdds.toFixed(2)}</span>
                    </button>
                  )}

                  {/* Away Win */}
                  <button
                    onClick={() => toggleSelection(f, `${f.awayTeam} Win`, f.awayOdds, 'away')}
                    className={`py-2 px-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-150 active:translate-y-0.5 ${
                      isSelected(f.id, `${f.awayTeam} Win`)
                        ? 'bg-gradient-to-b from-[#ffd700] via-[#f59e0b] to-[#b45309] text-black border-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.7),inset_0_2px_4px_rgba(255,255,255,0.7)] font-black'
                        : 'bg-gradient-to-b from-zinc-800 to-zinc-900 text-zinc-200 border-zinc-700 hover:border-amber-400/50 shadow-sm'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-sans truncate max-w-[85px]">
                      {f.awayTeam}
                    </span>
                    <span className="font-black text-sm mt-0.5">{f.awayOdds.toFixed(2)}</span>
                  </button>

                  {/* Over 2.5 */}
                  <button
                    onClick={() => toggleSelection(f, 'Over 2.5 Goals', f.overOdds, 'over')}
                    className={`py-2 px-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-150 active:translate-y-0.5 ${
                      isSelected(f.id, 'Over 2.5 Goals')
                        ? 'bg-gradient-to-b from-cyan-400 via-cyan-500 to-blue-600 text-black border-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.7)] font-black'
                        : 'bg-gradient-to-b from-zinc-800 to-zinc-900 text-zinc-200 border-zinc-700 hover:border-cyan-400/50 shadow-sm'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-sans">Over 2.5</span>
                    <span className="font-black text-sm mt-0.5">{f.overOdds.toFixed(2)}</span>
                  </button>

                  {/* Under 2.5 */}
                  <button
                    onClick={() => toggleSelection(f, 'Under 2.5 Goals', f.underOdds, 'under')}
                    className={`py-2 px-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-150 active:translate-y-0.5 ${
                      isSelected(f.id, 'Under 2.5 Goals')
                        ? 'bg-gradient-to-b from-cyan-400 via-cyan-500 to-blue-600 text-black border-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.7)] font-black'
                        : 'bg-gradient-to-b from-zinc-800 to-zinc-900 text-zinc-200 border-zinc-700 hover:border-cyan-400/50 shadow-sm'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-sans">Under 2.5</span>
                    <span className="font-black text-sm mt-0.5">{f.underOdds.toFixed(2)}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Authentic 3D Thermal Paper Sportsbook Ticket */}
        <div className="lg:col-span-4 relative select-none">
          {/* Jagged Serrated Perforations (Top Edge) */}
          <div className="w-full h-3 overflow-hidden leading-none flex">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#fcfbf7]"
              />
            ))}
          </div>

          {/* Physical Thermal Paper Body */}
          <div className="bg-[#fcfbf7] text-zinc-900 p-4 sm:p-5 border-x-2 border-zinc-300 shadow-[0_20px_45px_rgba(0,0,0,0.85),inset_0_0_30px_rgba(0,0,0,0.03)] space-y-3 font-mono relative">
            {/* Red Rubber Winner / Settled Stamp */}
            {settledResult && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none z-30 animate-in zoom-in-50 duration-200">
                <div
                  className={`px-4 py-2 border-4 rounded-xl font-black text-base uppercase tracking-widest text-center shadow-lg ${
                    settledResult.won
                      ? 'border-emerald-600 text-emerald-600 bg-emerald-100/90'
                      : 'border-red-600 text-red-600 bg-red-100/90'
                  }`}
                >
                  {settledResult.won ? '★ OFFICIAL CASHOUT ★' : 'TICKET EXPIRED'}
                  <div className="text-[9px] font-bold">CAESARS PALACE KIOSK #042</div>
                </div>
              </div>
            )}

            {/* Thermal Ticket Header */}
            <div className="text-center border-b-2 border-dashed border-zinc-400 pb-2 space-y-1">
              <div className="text-xs font-black tracking-widest uppercase">
                CAESARS PALACE SPORTSBOOK
              </div>
              <div className="text-[9px] text-zinc-600">
                LAS VEGAS STRIP • TICKET #7894-3321
              </div>
              <div className="text-[8px] text-zinc-500">
                VALID FOR 180 DAYS • ALL RULINGS FINAL
              </div>
            </div>

            {/* Ticket Mode Selector */}
            <div className="grid grid-cols-2 gap-1.5 bg-zinc-200 p-1 rounded-lg text-xs font-bold font-sans">
              <button
                onClick={() => setIsParlay(true)}
                className={`py-1 rounded font-black uppercase text-[11px] transition ${
                  isParlay
                    ? 'bg-zinc-900 text-white shadow'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Parlay ({parlayMultiplier > 1 ? `${parlayMultiplier.toFixed(2)}x` : '—'})
              </button>
              <button
                onClick={() => setIsParlay(false)}
                className={`py-1 rounded font-black uppercase text-[11px] transition ${
                  !isParlay
                    ? 'bg-zinc-900 text-white shadow'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Singles
              </button>
            </div>

            {/* Selections Printed List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 border-b-2 border-dashed border-zinc-300 pb-2">
              {betSlip.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs italic font-sans">
                  Tap any match line from the LED board to print selections on this ticket.
                </div>
              ) : (
                betSlip.map((b) => (
                  <div
                    key={`${b.fixtureId}-${b.pickName}`}
                    className="flex items-center justify-between text-xs border-b border-zinc-200 pb-1"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-black text-zinc-900 truncate">
                        ✓ {b.pickName}
                      </div>
                      <div className="text-[9px] text-zinc-600 truncate">{b.matchName}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-zinc-900">@{b.odds.toFixed(2)}</div>
                      <button
                        onClick={() =>
                          setBetSlip((prev) =>
                            prev.filter(
                              (x) => !(x.fixtureId === b.fixtureId && x.pickName === b.pickName)
                            )
                          )
                        }
                        className="text-[9px] text-red-600 hover:underline"
                      >
                        [void]
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Wager Calculations */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-zinc-700">
                <span>TOTAL WAGER:</span>
                <span className="font-black text-zinc-900 font-mono text-sm">
                  £{stake.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-700">
                <span>ESTIMATED RETURN:</span>
                <span className="font-black text-emerald-700 font-mono text-base">
                  £{potentialReturn.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Barcode Graphic */}
            <div className="pt-2 flex flex-col items-center">
              <div className="h-6 w-full flex items-center justify-between px-2 bg-zinc-100 rounded">
                <span className="font-mono text-xs tracking-tighter text-zinc-900 font-black">
                  |||| | | ||| |||| | || | |||| || | ||||| | ||
                </span>
              </div>
              <span className="text-[8px] text-zinc-500 mt-0.5">AUTH #8849-019-VEGAS</span>
            </div>
          </div>

          {/* Jagged Serrated Perforations (Bottom Edge) */}
          <div className="w-full h-3 overflow-hidden leading-none flex rotate-180">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#fcfbf7]"
              />
            ))}
          </div>

          {/* Betting Desk Controls Under Ticket */}
          <div className="mt-4 bg-gradient-to-b from-zinc-900 to-black p-3.5 rounded-2xl border border-zinc-700 space-y-3 shadow-xl">
            {/* Stake Selector Rack */}
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-zinc-400 font-bold uppercase text-[9px] font-mono">
                Select Stake Chip:
              </span>
              <VegasChipRack
                values={[10, 25, 50, 100, 250]}
                selectedValue={stake}
                onSelect={setStake}
                disabled={simulating}
              />
            </div>

            {/* Settle Result Message */}
            {settledResult && (
              <div
                className={`p-2 rounded-xl border text-xs font-bold text-center ${
                  settledResult.won
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                    : 'bg-red-950/80 text-red-300 border-red-500'
                }`}
              >
                {settledResult.message}
              </div>
            )}

            {/* Action Button */}
            <button
              disabled={betSlip.length === 0 || stake > bankroll || simulating}
              onClick={handleSimulateMatches}
              className={`w-full py-3.5 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-2xl transition active:translate-y-0.5 ${
                simulating
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#ffd700] text-black hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.5)] disabled:opacity-40'
              }`}
            >
              <Sparkles size={14} />
              <span>
                {simulating
                  ? 'TRANSMITTING & SIMULATING...'
                  : `PRINT TICKET (£${stake}) & SIMULATE`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
