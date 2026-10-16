'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Trophy, Users, Shield, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';
import Vegas3DTableArena from '../Vegas3DTableArena';
import VegasCard from '../VegasCard';
import VegasChip from '../VegasChip';

interface Props {
  onOpenTutorial: () => void;
}

export default function LivePokerPromo({ onOpenTutorial }: Props) {
  return (
    <div className="space-y-6 select-none">
      <Vegas3DTableArena
        gameType="holdem"
        watermarkTitle="BELLAGIO POKER ROOM"
        watermarkSubtitle="NO LIMIT TEXAS HOLD'EM • £2/£5 HIGH STAKES"
        showShoe={true}
        showChipTray={true}
        showDiscardRack={true}
      >
        {/* Header inside Arena */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase tracking-widest">
                Game #6 • The Cardroom King
              </span>
              <span className="text-emerald-400 text-xs font-mono font-bold">0% House Edge (Pure Player Skill)</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
              <span>Live Texas Hold’em Poker Room</span>
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

        {/* 3D Felt Centerpiece: Dealt Hole Cards & Pot Chips */}
        <div className="my-6 flex flex-col items-center justify-center space-y-4">
          {/* Main Pot Center Chip Pile */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono font-black text-gold uppercase tracking-widest bg-black/60 px-3 py-0.5 rounded-full border border-gold/40 mb-2">
              MAIN POT: £1,250
            </span>
            <div className="flex items-center -space-x-3">
              <VegasChip value={100} size="md" />
              <VegasChip value={500} size="lg" />
              <VegasChip value={100} size="md" />
              <VegasChip value={50} size="sm" />
            </div>
          </div>

          {/* Player Pocket Cards & Dealer Button */}
          <div className="flex items-end justify-center gap-4 relative">
            {/* Dealer Puck Button */}
            <div className="w-9 h-9 rounded-full bg-white text-black border-2 border-zinc-400 font-black text-[10px] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.8)] self-center">
              DEALER
            </div>

            {/* Suited Big Slick */}
            <div className="flex items-center -space-x-4">
              <div className="transform -rotate-6 transition-transform hover:-translate-y-2">
                <VegasCard card={{ rank: 'A', suit: '♠', value: 14 }} size="xl" />
              </div>
              <div className="transform rotate-6 transition-transform hover:-translate-y-2">
                <VegasCard card={{ rank: 'K', suit: '♠', value: 13 }} size="xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel & Features Grid */}
        <div className="bg-black/75 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-blue-500/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-white/10 space-y-1">
              <div className="text-xs font-black uppercase text-gold flex items-center gap-1.5">
                <Users size={14} />
                <span>3D Mobile Table Arena</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Play Heads-Up, 6-Max, or 9-Ring full ring tables with authentic felt textures, chips, and animated deals.
              </p>
            </div>

            <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-white/10 space-y-1">
              <div className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
                <Trophy size={14} />
                <span>Full Game Eliminator</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Experience escalating blinds, authentic knockout bounties, and winner-takes-all tournament action.
              </p>
            </div>

            <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-white/10 space-y-1">
              <div className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5">
                <Shield size={14} />
                <span>EPT Bot AI League</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Practice against diverse bot personalities with hand strength analysis and bankroll persistence.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
            <div className="text-xs text-zinc-400 font-mono">
              <span className="text-gold font-bold">EPT Academy Room:</span> Tables running 24/7 with instant seating.
            </div>

            <Link
              href="/academy"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#ffd700] via-[#cfb53b] to-amber-600 text-black font-black uppercase text-xs sm:text-sm tracking-wider shadow-[0_0_25px_rgba(212,175,55,0.5)] hover:brightness-110 active:scale-95 transition"
            >
              <Play size={16} fill="currentColor" />
              <span>Launch Live Texas Hold’em Arena</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </Vegas3DTableArena>
    </div>
  );
}
