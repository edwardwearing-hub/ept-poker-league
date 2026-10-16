'use client';

import React from 'react';
import { Card, PositionName, ScenarioPreset } from '@/lib/poker-trainer/types';
import { POSITION_BRIDGE_LABELS, POSITION_INFO } from '@/lib/poker-trainer/constants';
import {
  Target,
  Play,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  ArrowRight,
  Coins,
} from 'lucide-react';

export interface ScenarioVisualOpponent {
  id: string;
  name: string;
  avatar?: string;
  position: PositionName;
  chips: number;
  bet?: number;
  lastAction?: string;
  isFolded?: boolean;
  cards?: Card[];
}

export interface TableScenarioVisualProps {
  title?: string;
  subtitle?: string;
  streetName?: string;
  pot: number;
  boardCards: Card[];
  hero: {
    name?: string;
    position: PositionName;
    chips: number;
    cards: Card[];
    bet?: number;
  };
  opponents: ScenarioVisualOpponent[];
  tacticalCallout: {
    badge: string;
    badgeType: 'optimal' | 'warning' | 'critical' | 'info';
    actionText: string;
    rationale: string;
  };
  drillPreset?: ScenarioPreset;
  onLaunchDrill?: (preset: ScenarioPreset) => void;
  compact?: boolean;
}

export function renderMiniCard(
  card: Card,
  hidden = false,
  size: 'sm' | 'md' | 'lg' = 'md'
) {
  const dims =
    size === 'sm'
      ? 'w-7 h-10 text-[9px]'
      : size === 'lg'
      ? 'w-12 h-17 text-sm'
      : 'w-9 h-13 text-xs';

  if (hidden) {
    return (
      <div
        key={`${card.rank}-${card.suit}-back`}
        className={`${dims} rounded-md bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] border border-white/80 shadow flex items-center justify-center select-none`}
      >
        <span className="text-[7px] font-black text-gold">EPT</span>
      </div>
    );
  }

  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div
      key={`${card.rank}-${card.suit}-face`}
      className={`${dims} rounded-md bg-white border border-zinc-300 shadow flex flex-col justify-between p-1 font-black select-none ${
        isRed ? 'text-red-600' : 'text-zinc-900'
      }`}
    >
      <div className="leading-none text-left">
        <span className="tracking-tighter">{card.rank}</span>
        <span className="text-[8px] leading-none block">{card.suit}</span>
      </div>
      <div className="text-center leading-none text-base">{card.suit}</div>
      <div className="leading-none text-right rotate-180">
        <span className="tracking-tighter">{card.rank}</span>
      </div>
    </div>
  );
}

export default function TableScenarioVisual({
  title,
  subtitle,
  streetName = 'Flop',
  pot,
  boardCards,
  hero,
  opponents,
  tacticalCallout,
  drillPreset,
  onLaunchDrill,
  compact = false,
}: TableScenarioVisualProps) {
  const badgeStyle = {
    optimal: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    critical: 'bg-red-500/20 text-red-300 border-red-500/50',
    info: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
  }[tacticalCallout.badgeType];

  const badgeIcon = {
    optimal: <CheckCircle2 size={13} className="text-emerald-400" />,
    warning: <AlertTriangle size={13} className="text-amber-400" />,
    critical: <ShieldAlert size={13} className="text-red-400" />,
    info: <Info size={13} className="text-sky-400" />,
  }[tacticalCallout.badgeType];

  return (
    <div className="rounded-2xl bg-zinc-950/90 border border-white/10 overflow-hidden shadow-2xl space-y-0">
      {/* Visual Header */}
      {(title || subtitle) && (
        <div className="px-4 py-3 bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border-b border-white/10 flex items-center justify-between gap-3">
          <div>
            {title && (
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Target size={14} className="text-gold" />
                <span>{title}</span>
              </h4>
            )}
            {subtitle && (
              <p className="text-[11px] text-zinc-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-gold uppercase">
            {streetName}
          </span>
        </div>
      )}

      {/* 3D Stadium Poker Table Felt Snapshot */}
      <div className="relative p-4 sm:p-6 bg-[radial-gradient(circle_at_center,_#133340_0%,_#091820_65%,_#050b0f_100%)] overflow-hidden">
        {/* The Oval Stadium Table */}
        <div className="relative mx-auto w-full max-w-xl min-h-[320px] rounded-[90px] poker-table-rail p-3 flex flex-col justify-between shadow-2xl select-none">
          {/* Inner Casino Felt Surface */}
          <div className="relative w-full h-full min-h-[290px] rounded-[78px] poker-table-rim bg-[radial-gradient(ellipse_at_center,_#166534_0%,_#09361c_62%,_#03170b_100%)] flex items-center justify-center p-2">
            {/* Inner Betting Racetrack */}
            <div className="absolute inset-2.5 rounded-[68px] border border-white/15 pointer-events-none" />

            {/* Top Perimeter Opponents */}
            <div className="absolute top-2 inset-x-4 flex items-center justify-around gap-2 z-20">
              {opponents.map((opp) => (
                <div
                  key={opp.id}
                  className={`flex flex-col items-center transition-all ${
                    opp.isFolded ? 'opacity-40 grayscale' : ''
                  }`}
                >
                  {/* Opponent Hole Cards or Card Backs */}
                  <div className="flex -space-x-1.5 mb-[-6px] relative z-10">
                    {opp.cards && opp.cards.length > 0 ? (
                      opp.cards.map((c) => renderMiniCard(c, false, 'sm'))
                    ) : (
                      <>
                        {renderMiniCard({ rank: 'A', suit: '♠', value: 14 }, true, 'sm')}
                        {renderMiniCard({ rank: 'K', suit: '♦', value: 13 }, true, 'sm')}
                      </>
                    )}
                  </div>

                  {/* Opponent Pod */}
                  <div className="rounded-lg px-2 py-1 bg-black/90 border border-white/20 shadow-md text-center min-w-[70px]">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] font-bold text-white truncate max-w-[55px]">
                        {opp.name.split(' ')[0]}
                      </span>
                      <span className="px-1 rounded bg-gold/20 text-gold text-[8px] font-black">
                        {opp.position}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-emerald-400 font-bold">
                      £{opp.chips.toLocaleString()}
                    </div>
                  </div>

                  {/* Opponent Action Badge */}
                  {opp.lastAction && (
                    <div className="mt-1 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-black font-black text-[8px] shadow">
                      {opp.lastAction}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Table Center: Pot and Community Cards */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-2 my-auto">
              {/* Pot Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/85 border border-gold/50 shadow">
                <Coins size={11} className="text-gold" />
                <span className="text-xs font-mono font-black text-gold">
                  £{pot.toLocaleString()}
                </span>
              </div>

              {/* Board Cards */}
              <div className="flex items-center gap-1.5 min-h-[44px]">
                {boardCards.length === 0 ? (
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    Pre-Flop (No Board)
                  </div>
                ) : (
                  <>
                    {boardCards.map((c) => renderMiniCard(c, false, 'md'))}
                    {Array.from({ length: Math.max(0, 5 - boardCards.length) }).map(
                      (_, i) => (
                        <div
                          key={`empty-slot-${i}`}
                          className="w-9 h-13 rounded-md border border-white/10 bg-black/10"
                        />
                      )
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Bottom Center: Hero Player Pod */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
              {/* Hero's Bet if any */}
              {hero.bet && hero.bet > 0 && (
                <div className="mb-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/85 border border-gold/50 shadow text-[10px] font-mono text-gold font-bold">
                  <span>Bet: £{hero.bet}</span>
                </div>
              )}

              {/* Large Hole Cards */}
              <div className="flex -space-x-1.5 relative z-10 mb-[-6px]">
                {hero.cards.map((c) => renderMiniCard(c, false, 'md'))}
              </div>

              {/* Hero Pod */}
              <div className="rounded-xl px-3 py-1 bg-gradient-to-b from-[#1b2230] to-[#0c0f15] border-2 border-gold shadow-xl text-center min-w-[120px]">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-gold text-black text-[9px] font-black">
                    {hero.position}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {hero.name || 'You (Hero)'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 font-bold mt-0.5">
                  £{hero.chips.toLocaleString()} Stack
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Coach Callout Banner Below Table */}
      <div className="p-4 bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border-t border-white/10 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-bold uppercase ${badgeStyle}`}
            >
              {badgeIcon}
              <span>{tacticalCallout.badge}</span>
            </span>
            <span className="text-sm font-black text-white">
              {tacticalCallout.actionText}
            </span>
          </div>

          {drillPreset && onLaunchDrill && (
            <button
              onClick={() => onLaunchDrill(drillPreset)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/15 hover:bg-gold text-gold hover:text-black border border-gold/40 text-xs font-black uppercase tracking-wider transition self-start sm:self-auto shrink-0"
            >
              <Play size={11} fill="currentColor" />
              <span>Practice This Spot</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          {tacticalCallout.rationale}
        </p>
      </div>
    </div>
  );
}
