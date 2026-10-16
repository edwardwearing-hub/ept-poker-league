'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Activity,
  Award,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Trash2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { VegasGameTutorial } from './vegas-rules-db';
import { VegasHistoryItem, getGameHistory, clearGameHistory } from '@/lib/vegas/VegasHistory';

interface Props {
  game: VegasGameTutorial;
}

export default function VegasGameCompanion({ game }: Props) {
  const [activeTab, setActiveTab] = useState<'rules' | 'ticker'>('rules');
  const [history, setHistory] = useState<VegasHistoryItem[]>([]);

  // Load history on mount & listen to real-time events
  useEffect(() => {
    setHistory(getGameHistory(game.id));

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ gameId: string; item: VegasHistoryItem | null; all: VegasHistoryItem[] }>;
      if (customEvent.detail && customEvent.detail.gameId === game.id) {
        setHistory(customEvent.detail.all || []);
      }
    };

    window.addEventListener('vegas_history_updated', handleUpdate);
    return () => window.removeEventListener('vegas_history_updated', handleUpdate);
  }, [game.id]);

  // Calculate session statistics
  const netProfit = history.reduce((acc, item) => acc + item.delta, 0);
  const winCount = history.filter((i) => i.delta > 0).length;
  const lossCount = history.filter((i) => i.delta < 0).length;
  const pushCount = history.filter((i) => i.delta === 0).length;

  return (
    <div className="bg-gradient-to-b from-zinc-900 via-black to-zinc-950 rounded-3xl border-2 border-gold/40 p-4 sm:p-5 shadow-2xl space-y-4 select-none">
      {/* Header with Title & House Edge */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black uppercase text-gold bg-gold/15 px-2 py-0.5 rounded border border-gold/30">
              Game #{game.number} Companion
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-400">
              Edge: {game.houseEdge}
            </span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight mt-1 flex items-center gap-1.5">
            <span>{game.title} Guide & Ticker</span>
          </h3>
        </div>

        {/* Live Rounds Pill */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block font-mono">Session</span>
          <span className="text-xs font-mono font-black text-zinc-200">
            {history.length} {history.length === 1 ? 'Round' : 'Rounds'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-black/80 p-1.5 rounded-2xl border border-white/10">
        <button
          onClick={() => setActiveTab('rules')}
          className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
            activeTab === 'rules'
              ? 'bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black shadow-lg'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <BookOpen size={14} />
          <span>Rules & How to Play</span>
        </button>

        <button
          onClick={() => setActiveTab('ticker')}
          className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition relative ${
            activeTab === 'ticker'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Activity size={14} />
          <span>Live Ticker</span>
          {history.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-black font-black text-[9px]">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: HOW TO PLAY & RULES CONTENT */}
      {activeTab === 'rules' && (
        <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1 custom-scrollbar text-xs">
          {/* Overview */}
          <div className="bg-black/60 p-3.5 rounded-2xl border border-white/10 space-y-1.5">
            <div className="text-gold font-black uppercase text-[11px] flex items-center gap-1">
              <Sparkles size={13} />
              <span>Objective</span>
            </div>
            <p className="text-zinc-300 leading-relaxed text-xs">
              {game.overview}
            </p>
          </div>

          {/* Step-by-Step How to Play */}
          <div className="space-y-2">
            <div className="text-white font-black uppercase text-[11px] tracking-wider flex items-center gap-1.5 px-1">
              <span>How to Play Step-by-Step</span>
            </div>
            <div className="space-y-2">
              {game.howToPlay.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/80 p-3 rounded-xl border border-white/10 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-gold text-black font-black font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-zinc-300 leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Rules Matrix */}
          <div className="space-y-2">
            <div className="text-white font-black uppercase text-[11px] tracking-wider px-1">
              House Rules
            </div>
            <div className="grid grid-cols-1 gap-2">
              {game.keyRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="bg-black/60 p-2.5 rounded-xl border border-white/10 space-y-0.5"
                >
                  <div className="font-bold text-gold text-xs">{rule.title}</div>
                  <div className="text-[11px] text-zinc-400">{rule.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Payouts Reference */}
          <div className="space-y-2">
            <div className="text-white font-black uppercase text-[11px] tracking-wider px-1">
              Payouts
            </div>
            <div className="bg-black/70 rounded-xl border border-white/10 overflow-hidden font-mono">
              <div className="grid grid-cols-2 bg-white/5 p-2 text-[10px] font-black uppercase text-zinc-400 border-b border-white/10">
                <span>Wager Type</span>
                <span className="text-right">Payout</span>
              </div>
              <div className="divide-y divide-white/5">
                {game.payouts.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-2 p-2 text-xs">
                    <span className="text-zinc-300 font-sans">{p.bet}</span>
                    <span className="text-right font-black text-amber-300">{p.payout}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vegas Pro Tip */}
          {game.casinoTips && game.casinoTips.length > 0 && (
            <div className="bg-gradient-to-r from-amber-950/60 to-black p-3.5 rounded-2xl border border-gold/30 space-y-1">
              <div className="text-gold font-black uppercase text-[10px] flex items-center gap-1.5">
                <ShieldCheck size={14} />
                <span>Vegas Pro Tip</span>
              </div>
              <p className="text-zinc-300 text-xs italic">
                &ldquo;{game.casinoTips[0]}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE TICKER & HAND / NUMBER HISTORY */}
      {activeTab === 'ticker' && (
        <div className="space-y-4">
          {/* Live Session HUD Bar */}
          <div className="bg-black/80 p-3 rounded-2xl border border-white/10 flex items-center justify-between font-mono text-xs shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Live Feed
              </span>
            </div>

            {/* Net Session P/L */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase">Net P/L:</span>
              <span
                className={`font-black text-sm ${
                  netProfit > 0
                    ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    : netProfit < 0
                    ? 'text-red-400'
                    : 'text-zinc-400'
                }`}
              >
                {netProfit > 0 ? `+£${netProfit.toLocaleString()}` : `£${netProfit.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Summary Scoreboard (W / L / P) */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-emerald-950/50 p-2 rounded-xl border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Wins</span>
              <span className="text-sm font-black text-emerald-300">{winCount}</span>
            </div>
            <div className="bg-red-950/50 p-2 rounded-xl border border-red-500/30">
              <span className="text-[10px] text-red-400 font-bold uppercase block">Losses</span>
              <span className="text-sm font-black text-red-300">{lossCount}</span>
            </div>
            <div className="bg-zinc-900/80 p-2 rounded-xl border border-white/10">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Pushes</span>
              <span className="text-sm font-black text-zinc-300">{pushCount}</span>
            </div>
          </div>

          {/* Live History Event Stream */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-2 bg-black/40 rounded-2xl border border-white/5">
                <Clock size={24} className="mx-auto text-zinc-600" />
                <div className="text-xs font-bold text-zinc-400">No rounds recorded yet</div>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                  Play a hand, spin the wheel, or roll the dice on the table to start streaming live hand and outcome history!
                </p>
              </div>
            ) : (
              history.map((item, idx) => {
                const isWin = item.delta > 0;
                const isLoss = item.delta < 0;
                return (
                  <div
                    key={item.id || idx}
                    className={`p-3 rounded-xl border transition-all text-xs flex items-start justify-between gap-3 ${
                      isWin
                        ? 'bg-emerald-950/40 border-emerald-500/40 shadow-sm'
                        : isLoss
                        ? 'bg-red-950/30 border-red-500/30'
                        : 'bg-zinc-900/70 border-white/10'
                    }`}
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase ${
                            isWin
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                              : isLoss
                              ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                              : 'bg-zinc-800 text-zinc-400 border border-white/10'
                          }`}
                        >
                          {isWin ? 'WIN' : isLoss ? 'LOSS' : 'PUSH'}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-mono font-bold text-gold bg-gold/10 px-1 rounded">
                            {item.badge}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                          {item.timestamp}
                        </span>
                      </div>

                      <div className="font-bold text-white truncate pt-0.5">{item.headline}</div>
                      {item.detail && (
                        <div className="text-[11px] text-zinc-400 font-mono truncate">{item.detail}</div>
                      )}
                    </div>

                    {/* Net Wager Change */}
                    <div className="text-right shrink-0 font-mono font-black text-xs pt-1">
                      {isWin ? (
                        <span className="text-emerald-400">+£{item.delta.toLocaleString()}</span>
                      ) : isLoss ? (
                        <span className="text-red-400">-£{Math.abs(item.delta).toLocaleString()}</span>
                      ) : (
                        <span className="text-zinc-400">£0</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Clear Ticker History Button */}
          {history.length > 0 && (
            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => clearGameHistory(game.id)}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-red-400 transition"
              >
                <Trash2 size={12} />
                <span>Reset Ticker Feed</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
