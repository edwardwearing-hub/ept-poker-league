'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Sparkles, 
  X, 
  ArrowRight, 
  GraduationCap, 
  Dices, 
  Trophy,
  Crown,
  Zap,
  Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SyndicateAnnouncementModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if player has already dismissed the new Academy & Vegas announcement
    try {
      const hasSeen = localStorage.getItem('ept_academy_vegas_announced_v2026');
      if (!hasSeen) {
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleClose = () => {
    try {
      localStorage.setItem('ept_academy_vegas_announced_v2026', 'true');
    } catch {}
    setIsOpen(false);
  };

  const handleGoAcademy = () => {
    try {
      localStorage.setItem('ept_academy_vegas_announced_v2026', 'true');
    } catch {}
    setIsOpen(false);
    router.push('/academy');
  };

  const handleGoVegas = () => {
    try {
      localStorage.setItem('ept_academy_vegas_announced_v2026', 'true');
    } catch {}
    setIsOpen(false);
    router.push('/vegas');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#140a1c] via-[#0d0514] to-black border-2 border-gold/50 shadow-[0_0_60px_rgba(212,175,55,0.4)] flex flex-col font-sans"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            aria-label="Close announcement"
            className="absolute top-4 right-4 z-20 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer touch-manipulation backdrop-blur-md"
          >
            <X size={20} />
          </button>

          {/* Hero Header Banner */}
          <div className="relative w-full h-44 sm:h-52 overflow-hidden shrink-0">
            <img
              src="/images/vegas_strip_resort.jpg"
              alt="EPT Academy & Vegas Strip"
              className="w-full h-full object-cover filter brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0514] via-[#0d0514]/60 to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-gold/50 shadow-md">
                <img src="/ept-logo.jpg" alt="EPT" className="w-full h-full object-cover" />
              </div>
              <span className="px-3 py-1 rounded-full bg-gold/20 text-gold-glow border border-gold/40 text-[10px] sm:text-xs font-black uppercase tracking-widest backdrop-blur-md flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                <Flame size={14} className="text-gold" />
                MAJOR 2026 FEATURE RELEASE
              </span>
            </div>

            {/* Title on Backdrop */}
            <div className="absolute bottom-3 left-4 right-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold drop-shadow">
                Official EPT League Expansion
              </span>
              <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
                THE POKER ACADEMY & LAS VEGAS STRIP
              </h2>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 space-y-4">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              We are thrilled to unveil two massive new interactive hubs on the official EPT website! Practice your game with our state-of-the-art <strong className="text-gold-glow">GTO Poker Academy</strong>, or hit the casino tables on the neon <strong className="text-purple-300">Las Vegas Strip</strong> with Sarah the AI Landlady!
            </p>

            {/* Two Main Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Feature 1: The EPT Poker Academy */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/60 via-purple-950/40 to-black border-2 border-blue-500/40 flex flex-col justify-between space-y-3 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-400/40 shrink-0">
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                      Interactive GTO Trainer
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      EPT Poker Academy
                    </h3>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Train in <strong>7 dynamic game modes</strong>: Heads-Up, 6-Max, Bounty Hunter, Push/Fold, ICM Bubble, Bomb Pot & Eliminator. Get instant <strong>A+ to F decision grades</strong> and protect your career stats in a secure <strong>PIN Locker</strong>!
                </p>

                <button
                  type="button"
                  onClick={handleGoAcademy}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Enter Poker Academy</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Feature 2: Las Vegas Casino & Pub Fruity */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 via-red-950/40 to-black border-2 border-amber-500/40 flex flex-col justify-between space-y-3 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-yellow-400 border border-amber-400/40 shrink-0">
                    <Dices size={22} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      11 High-Roller Casino Games
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      Vegas Games & Pub Fruity
                    </h3>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Step up to authentic 3D casino felt: <strong>Blackjack, Craps, European Roulette, Baccarat, Pai Gow, Slots</strong>, plus the genuine <strong>1990s UK Monopoly Pub Fruit Machine</strong> with live commentary from Sarah!
                </p>

                <button
                  type="button"
                  onClick={handleGoVegas}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-gold to-yellow-400 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Visit Vegas Casino</span>
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Close & Continue to League
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
