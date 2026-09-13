'use client';

import React, { useState } from 'react';
import { 
  X, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Star, 
  DollarSign, 
  ShieldAlert, 
  Award,
  Coins,
  Gem,
  UserX,
  Layers,
  MapPin,
  Play,
  Users
} from 'lucide-react';
import { GameState, Achievement } from '@/game/types';
import { claimAchievement } from '@/game/engine';
import { playSound } from '@/game/sound';

interface Props {
  state: GameState;
  onClose: () => void;
  onStateUpdate: (newState: GameState) => void;
}

const ACH_ICONS: Record<string, React.ElementType> = {
  Play,
  DollarSign,
  Coins,
  Gem,
  UserX,
  ShieldAlert,
  Trophy,
  Users,
  Layers,
  MapPin,
  Award,
  Sparkles,
};

export default function AchievementsModal({ state, onClose, onStateUpdate }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const achievements = Object.values(state.achievements || {});
  const categories = ['All', 'Wealth', 'Underworld', 'Poker', 'Empire'];

  const filtered = achievements.filter(a => {
    if (selectedCategory === 'All') return true;
    return a.category === selectedCategory;
  });

  const totalUnlocked = achievements.filter(a => a.unlocked).length;
  const totalClaimable = achievements.filter(a => a.unlocked && !a.claimed).length;

  const handleClaim = (achId: string) => {
    const nextState = claimAchievement(state, achId);
    playSound.levelUp(state.settings.soundEnabled);
    onStateUpdate(nextState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel border-gold/40 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(212,175,55,0.3)] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-charcoal-dark/95 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold to-yellow-400 flex items-center justify-center text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              <Trophy size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Syndicate Achievements
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold-glow text-[10px] font-mono font-bold border border-gold/40">
                  {totalUnlocked}/{achievements.length} Unlocked
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Complete milestones across all underworld sectors to earn permanent Mob Tokens (⭐).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close achievements modal"
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-5 sm:px-6 pt-4 pb-2 flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-amber-500 via-gold to-yellow-400 text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Achievements List */}
        <div className="p-5 sm:px-6 sm:pb-6 space-y-3">
          {filtered.map((ach) => {
            const Icon = ACH_ICONS[ach.iconName] || Trophy;

            return (
              <div
                key={ach.id}
                className={`rounded-2xl p-4 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  ach.claimed
                    ? 'bg-black/30 border-white/5 opacity-70'
                    : ach.unlocked
                    ? 'glass-panel-gold border-gold/60 shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-pulse-slow'
                    : 'glass-panel border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    ach.unlocked
                      ? 'bg-gradient-to-br from-amber-500 to-yellow-400 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    <Icon size={22} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">
                        {ach.title}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-zinc-400 uppercase">
                        {ach.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {ach.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <span className="text-xs font-black text-amber-300 font-mono flex items-center gap-1">
                    <Star size={14} className="text-gold fill-gold" />
                    +{ach.rewardTokens} Mob Tokens
                  </span>

                  {ach.claimed ? (
                    <span className="px-3 py-1.5 rounded-xl bg-white/5 text-zinc-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      Claimed
                    </span>
                  ) : ach.unlocked ? (
                    <button
                      onClick={() => handleClaim(ach.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-gold to-yellow-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(212,175,55,0.5)] hover:brightness-110 active:scale-95 cursor-pointer"
                    >
                      Claim Reward
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-500 text-xs font-black uppercase tracking-wider flex items-center gap-1 border border-white/5">
                      <Lock size={12} />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
