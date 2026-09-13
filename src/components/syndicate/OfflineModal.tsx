'use client';

import React from 'react';
import { 
  Hourglass, 
  TrendingUp, 
  Sparkles, 
  Check 
} from 'lucide-react';
import { OfflineProgressSummary } from '@/game/types';
import { formatMoney, formatChips, formatEquity, formatTime } from '@/game/engine';

interface Props {
  summary: OfflineProgressSummary | null;
  onClose: () => void;
}

export default function OfflineModal({ summary, onClose }: Props) {
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-panel-gold rounded-3xl border border-gold/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.3)] text-center">
        
        <div className="inline-flex p-3 rounded-2xl bg-gold/20 text-gold-glow mb-3 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
          <Hourglass size={32} className="animate-spin" style={{ animationDuration: '10s' }} />
        </div>

        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
          Welcome Back, Boss
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          While you were away for <strong className="text-white font-mono">{formatTime(summary.secondsOffline)}</strong>, your syndicate continued raking the tables:
        </p>

        <div className="my-6 space-y-2.5">
          <div className="glass-panel p-3 rounded-xl border-white/10 flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-zinc-400">Dirty Cash Collected</span>
            <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
              +{formatMoney(summary.cashEarned)}
            </span>
          </div>

          <div className="glass-panel p-3 rounded-xl border-white/10 flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-zinc-400">Chips Accumulated</span>
            <span className="text-sm sm:text-base font-black text-gold-glow font-mono">
              +{formatChips(summary.chipsEarned)}
            </span>
          </div>

          {summary.equityLaundered > 0 && (
            <div className="glass-panel p-3 rounded-xl border-white/10 flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-zinc-400">Clean Equity Laundered</span>
              <span className="text-sm sm:text-base font-black text-cyan-400 font-mono">
                +{formatEquity(summary.equityLaundered)}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-gold to-yellow-600 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.5)] hover:brightness-110 active:scale-95 transition-all cursor-pointer touch-manipulation"
        >
          Collect Earnings
        </button>

      </div>
    </div>
  );
}
