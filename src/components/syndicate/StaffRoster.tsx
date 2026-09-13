'use client';

import { 
  Users, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Award,
  ShieldAlert,
  Lock 
} from 'lucide-react';
import { GameState, SyndicateStaff } from '@/game/types';
import { formatMoney, formatChips, formatEquity, bailOutStaff } from '@/game/engine';
import { playSound } from '@/game/sound';

interface Props {
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
}

export default function StaffRoster({ state, onStateUpdate }: Props) {
  const handleHireStaff = (staffId: string) => {
    const staff = state.staff[staffId];
    if (!staff || staff.hired) return;

    let canAfford = false;
    let nextCash = state.cash;
    let nextChips = state.chips;
    let nextEquity = state.equity;

    if (staff.costType === 'cash' && state.cash >= staff.cost) {
      nextCash -= staff.cost;
      canAfford = true;
    } else if (staff.costType === 'chips' && state.chips >= staff.cost) {
      nextChips -= staff.cost;
      canAfford = true;
    } else if (staff.costType === 'equity' && state.equity >= staff.cost) {
      nextEquity -= staff.cost;
      canAfford = true;
    }

    if (!canAfford) return;

    playSound.levelUp(state.settings.soundEnabled);

    const nextState: GameState = {
      ...state,
      cash: nextCash,
      chips: nextChips,
      equity: nextEquity,
      staff: {
        ...state.staff,
        [staffId]: {
          ...staff,
          hired: true,
        },
      },
    };

    onStateUpdate(nextState);
  };

  const staffList = Object.values(state.staff);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Users size={18} className="text-gold" />
            Syndicate Staff & Pit Bosses
          </h2>
          <p className="text-xs text-zinc-400">
            Hire enforcers, mechanics, and corrupt accountants to multiply table yields and eliminate police heat.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {staffList.map((staff) => {
          let canAfford = false;
          let costString = '';

          if (staff.costType === 'cash') {
            canAfford = state.cash >= staff.cost;
            costString = formatMoney(staff.cost);
          } else if (staff.costType === 'chips') {
            canAfford = state.chips >= staff.cost;
            costString = formatChips(staff.cost);
          } else if (staff.costType === 'equity') {
            canAfford = state.equity >= staff.cost;
            costString = formatEquity(staff.cost);
          }

          const now = Date.now();
          const isDetained = Boolean(state.detainedStaff?.[staff.id] && now < state.detainedStaff[staff.id].until);
          const detainedSeconds = isDetained ? Math.max(0, Math.ceil((state.detainedStaff[staff.id].until - now) / 1000)) : 0;

          return (
            <div
              key={staff.id}
              className={`rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden transition-all duration-200 ${
                isDetained
                  ? 'bg-amber-950/40 border-2 border-dashed border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  : staff.hired
                  ? 'glass-panel-emerald border border-emerald-500/30'
                  : 'glass-panel border-white/10 hover:border-gold/30'
              }`}
            >
              <div>
                {/* Detained Warning Overlay */}
                {isDetained && (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert size={15} className="text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-300 block">
                          DETAINED IN CITY JAIL
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {Math.floor(detainedSeconds / 60)}m {detainedSeconds % 60}s left
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onStateUpdate(bailOutStaff(state, staff.id))}
                      disabled={state.equity < 15}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer shrink-0"
                    >
                      Bail (15 💎)
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Character Avatar Image */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gold/40 shadow-[0_0_12px_rgba(212,175,55,0.3)] shrink-0 bg-charcoal-dark">
                      {staff.avatar ? (
                        <img 
                          src={staff.avatar} 
                          alt={staff.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-gold/30 flex items-center justify-center font-black text-gold text-sm">
                          {staff.name.split(' ')[0][0]}{staff.name.split(' ')[1] ? staff.name.split(' ')[1][0] : ''}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">
                        {staff.name}
                      </h3>
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">
                        {staff.role}
                      </span>
                    </div>
                  </div>

                  {staff.hired && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <ShieldCheck size={12} />
                      On Payroll
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 mt-2">
                  {staff.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Recruit Bonus</span>
                  <span className="text-xs font-black font-mono text-gold-glow">
                    {staff.hired ? 'Active Permanent' : costString}
                  </span>
                </div>

                {staff.hired ? (
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Check size={16} />
                  </div>
                ) : (
                  <button
                    onClick={() => handleHireStaff(staff.id)}
                    disabled={!canAfford}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-600 via-gold to-yellow-600 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    Hire Staff
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
