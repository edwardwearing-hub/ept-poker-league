'use client';

import React from 'react';
import { X, HelpCircle, Trophy, Lightbulb, ShieldAlert, Award } from 'lucide-react';
import { VegasGameTutorial } from './vegas-rules-db';

interface Props {
  game: VegasGameTutorial | null;
  onClose: () => void;
  onPlayGame: () => void;
}

export default function VegasTutorialModal({ game, onClose, onPlayGame }: Props) {
  if (!game) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-zinc-900 via-charcoal to-black border-2 border-gold/40 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Table Photographic Header Banner */}
        <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden bg-black shrink-0">
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-black/40 to-black/60 pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border border-white/20 transition backdrop-blur-md"
          >
            <X size={20} />
          </button>

          {/* Floating Badges */}
          <div className="absolute bottom-3 left-6 right-6 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-gold border border-gold/40 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow">
              Game #{game.number} • Official Vegas Guide
            </span>
            <span className="text-emerald-300 font-mono text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/40 shadow">
              House Edge: {game.houseEdge}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Modal Header */}
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {game.title}
            </h3>
            <p className="text-xs text-gold font-bold">
              &quot;{game.tagline}&quot;
            </p>
          </div>

          {/* Overview */}
          <div className="bg-black/60 p-4 rounded-2xl border border-white/10 space-y-1.5">
          <div className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Overview & Objective
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {game.overview}
          </p>
        </div>

        {/* Step-by-Step How to Play */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <HelpCircle size={16} className="text-gold" />
            <span>How to Play (Step-by-Step)</span>
          </div>
          <div className="space-y-2">
            {game.howToPlay.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-200"
              >
                <div className="w-5 h-5 rounded-full bg-gold/20 text-gold border border-gold/40 flex items-center justify-center font-mono font-black text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="leading-relaxed">{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Rules */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <ShieldAlert size={16} className="text-cyan-400" />
            <span>Key Rules to Know</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {game.keyRules.map((rule, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1"
              >
                <div className="text-xs font-black text-cyan-300 uppercase">
                  {rule.title}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payout Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <Trophy size={16} className="text-gold" />
            <span>Standard Vegas Payouts</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black/80 text-[10px] text-zinc-400 uppercase">
                <tr>
                  <th className="py-2 px-3">Bet / Combination</th>
                  <th className="py-2 px-3 text-right">Standard Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-black/40">
                {game.payouts.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="py-2 px-3 font-sans text-zinc-200">{row.bet}</td>
                    <td className="py-2 px-3 text-right text-gold font-bold">{row.payout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Casino Pro Tips */}
        <div className="bg-gradient-to-r from-amber-950/40 via-black to-zinc-900 border border-gold/40 p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gold">
            <Lightbulb size={16} />
            <span>Las Vegas Floor Wisdom & Tips</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {game.casinoTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-gold font-bold">★</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 transition"
          >
            Close Guide
          </button>
          <button
            onClick={() => {
              onClose();
              onPlayGame();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition"
          >
            Play {game.title} Now →
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
