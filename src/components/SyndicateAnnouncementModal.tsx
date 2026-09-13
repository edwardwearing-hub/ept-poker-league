'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Sparkles, 
  X, 
  ArrowRight, 
  Gamepad2, 
  Users, 
  ShieldAlert, 
  Trophy,
  Crown
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SyndicateAnnouncementModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if player has already seen or dismissed this announcement
    try {
      const hasSeen = localStorage.getItem('ept_syndicate_announced_v1');
      if (!hasSeen) {
        // Small delay so home page finishes rendering smoothly
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleClose = () => {
    try {
      localStorage.setItem('ept_syndicate_announced_v1', 'true');
    } catch {}
    setIsOpen(false);
  };

  const handlePlayNow = () => {
    try {
      localStorage.setItem('ept_syndicate_announced_v1', 'true');
    } catch {}
    setIsOpen(false);
    router.push('/syndicate');
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
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-charcoal-card via-charcoal-card to-charcoal-dark border-2 border-gold/50 shadow-[0_0_60px_rgba(212,175,55,0.35)] flex flex-col font-sans"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            aria-label="Close announcement"
            className="absolute top-4 right-4 z-20 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer touch-manipulation backdrop-blur-md"
          >
            <X size={20} />
          </button>

          {/* Hero Vegas Backdrop */}
          <div className="relative w-full h-44 sm:h-52 overflow-hidden shrink-0">
            <img
              src="/images/vegas_strip_resort.jpg"
              alt="Casino Syndicate Vegas Strip"
              className="w-full h-full object-cover filter brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark via-charcoal-dark/60 to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-gold/50 shadow-md">
                <img src="/ept-logo.jpg" alt="EPT" className="w-full h-full object-cover" />
              </div>
              <span className="px-3 py-1 rounded-full bg-gold/20 text-gold-glow border border-gold/40 text-[10px] sm:text-xs font-black uppercase tracking-widest backdrop-blur-md flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                <Flame size={14} className="text-gold" />
                NEW FEATURE RELEASE
              </span>
            </div>

            {/* Bottom Title on Backdrop */}
            <div className="absolute bottom-3 left-4 right-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold drop-shadow">
                Official EPT Underworld RPG
              </span>
              <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
                Casino Syndicate: High Roller Empire
              </h2>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 space-y-4">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              We have officially launched <strong className="text-gold-glow">Casino Syndicate</strong> — a full-featured high-roller idle simulation built directly into EPT Poker League. Take command of the underworld gambling circuit!
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/30 shrink-0">
                  <Gamepad2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">18 Casino Tables</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    From \$15 back-alley craps up to \$400T celestial VIP baccarat skyrooms.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Sponsor Real EPT Pros</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    Bankroll Liam, Georgina, Edward, Chris, Daniel & Stephen in 8 world tourneys.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Clean Equity Laundering</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    Wash dirty cash through 10 Front Businesses to execute Strip Buyout resets.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 shrink-0">
                  <Crown size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Heists & Shadow Cabinet</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    Spin the Syndicate Wheel, raid federal reserves, and retain corrupt officials.
                  </p>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={handlePlayNow}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-gold to-yellow-400 text-black font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(212,175,55,0.5)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                <span>Launch Syndicate Empire</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer touch-manipulation"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
