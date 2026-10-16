import Link from "next/link";
import Leaderboard from "@/components/Leaderboard";
import WantedPoster from "@/components/WantedPoster";
import StatCorner from "@/components/StatCorner";
import LastGameReport from "@/components/LastGameReport";
import NextGameCountdown from "@/components/NextGameCountdown";
import SyndicateAnnouncementModal from "@/components/SyndicateAnnouncementModal";
import ChampionshipCountdownBanner from "@/components/ChampionshipCountdownBanner";
import { getGlobalStats, getLeaderboardData } from "@/lib/data";
import { GraduationCap, Dices, Sparkles, ArrowRight, Flame, Trophy, Crown } from "lucide-react";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [stats, players] = await Promise.all([
    getGlobalStats(),
    getLeaderboardData()
  ]);

  const gamesPlayedOverall = Math.max(...players.map(p => p.gamesPlayed || 0), 0);
  const gamesRemaining = Math.max(0, 9 - gamesPlayedOverall);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 font-sans">

      {/* New Major Feature Launch Popup Announcement */}
      <SyndicateAnnouncementModal />

      {/* Next Game Countdown Section */}
      <NextGameCountdown />

      {/* December Grand Final Road to Crown Banner */}
      <ChampionshipCountdownBanner 
        totalPot={stats.totalPot} 
        topContenders={players.slice(0, 4)} 
        gamesPlayed={gamesPlayedOverall}
        gamesRemaining={gamesRemaining}
      />

      {/* ============================================================== */}
      {/* FEATURE SPOTLIGHT: THE POKER ACADEMY & LAS VEGAS CASINO SUITE */}
      {/* ============================================================== */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl sm:text-3xl font-black text-white border-l-4 border-gold pl-4 uppercase tracking-tight">
              Featured Interactive Hubs
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-xs font-black uppercase tracking-widest shadow-[0_0_12px_rgba(212,175,55,0.3)]">
              <Sparkles size={13} />
              NEW 2026 RELEASES
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: EPT Poker Academy */}
          <Link
            href="/academy"
            className="group relative rounded-3xl overflow-hidden border-2 border-cyan-500/40 hover:border-cyan-400 bg-gradient-to-br from-blue-950 via-charcoal-card to-black p-5 sm:p-6 shadow-[0_10px_30px_rgba(6,182,212,0.25)] hover:shadow-[0_15px_40px_rgba(6,182,212,0.45)] transition-all duration-300 flex flex-col justify-between min-h-[220px]"
          >
            {/* Background Texture */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700 pointer-events-none"
              style={{ backgroundImage: `url('/images/tournament_poker_room.jpg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                  <GraduationCap size={14} className="text-cyan-400" />
                  GTO Trainer & AI Coach
                </span>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  7 Game Modes
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                <span>The EPT Poker Academy</span>
              </h4>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-2">
                Level up your poker IQ with interactive scenarios: Heads-Up, 6-Max, Bounty Hunter, Push/Fold & ICM Bubble. Get instant A+ to F grades and store career stats in your personal PIN Locker!
              </p>
            </div>

            <div className="relative z-10 pt-4 flex items-center justify-between border-t border-white/10 mt-3">
              <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition">
                Start with 10,000 Training Chips
              </span>
              <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:brightness-110 transition">
                <span>Enter Academy</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          {/* Card 2: Las Vegas Casino & Pub Fruity */}
          <Link
            href="/vegas"
            className="group relative rounded-3xl overflow-hidden border-2 border-amber-500/40 hover:border-amber-400 bg-gradient-to-br from-red-950 via-charcoal-card to-black p-5 sm:p-6 shadow-[0_10px_30px_rgba(245,158,11,0.25)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.45)] transition-all duration-300 flex flex-col justify-between min-h-[220px]"
          >
            {/* Background Texture */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700 pointer-events-none"
              style={{ backgroundImage: `url('/images/vegas_strip_resort.jpg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-yellow-300 border border-yellow-400/50 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                  <Dices size={14} className="text-yellow-400" />
                  11 Casino Games
                </span>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  Live AI Sarah
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight group-hover:text-yellow-300 transition-colors flex items-center gap-2">
                <span>The Vegas Strip & Pub Fruity</span>
              </h4>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-2">
                Authentic 3D casino felt action: Blackjack, Craps, European Roulette, Baccarat, Pai Gow, Slots, plus the 1990s UK Monopoly Pub Fruit Machine with stepper nudges and Hi-Lo board!
              </p>
            </div>

            <div className="relative z-10 pt-4 flex items-center justify-between border-t border-white/10 mt-3">
              <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition">
                Interactive Felt & Rules Tutorials
              </span>
              <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-gold to-yellow-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] group-hover:brightness-110 transition">
                <span>Hit The Strip</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* The Hype Section */}
      <section className="space-y-6 pt-4 md:pt-6">
        <h3 className="text-3xl font-bold text-white border-l-4 border-gold pl-4 print-hidden">League Hype</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Hype Card 1 - Academy Trailer */}
          <Link
            href="/academy"
            className="group relative h-64 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-400 transition-colors block"
          >
            <img
              src="/images/tournament_poker_room.jpg"
              alt="EPT Poker Academy Interactive Training"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                <GraduationCap size={13} />
                Interactive Feature
              </span>
              <h4 className="text-xl font-bold text-white mt-1 group-hover:text-cyan-300 transition">
                EPT Poker Academy: Master GTO & Game Modes
              </h4>
            </div>
          </Link>

          {/* Hype Card 2 - Vegas Strip */}
          <Link
            href="/vegas"
            className="group relative h-64 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-amber-400 transition-colors block"
          >
            <img
              src="/images/vegas_strip_resort.jpg"
              alt="The Las Vegas Strip & Pub Fruity"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                <Dices size={13} />
                Casino Suite
              </span>
              <h4 className="text-xl font-bold text-white mt-1 group-hover:text-yellow-300 transition">
                Vegas Games Floor: 11 Classics & UK Pub Fruity
              </h4>
            </div>
          </Link>

          {/* Hype Card 3 - Grand Final */}
          <Link
            href="/final"
            className="group relative h-64 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-gold transition-colors block"
          >
            <img
              src="/images/hype-dynasty.png"
              alt="December Grand Final Championship"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-gold font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                <Crown size={13} />
                Championship
              </span>
              <h4 className="text-xl font-bold text-white mt-1 group-hover:text-gold transition">
                December Grand Final: Road to the Crown
              </h4>
            </div>
          </Link>
        </div>
      </section>

      {/* Latest Report */}
      <div className="mb-4 md:mb-8 pt-4 md:pt-8 border-t border-white/10">
        <h3 className="text-3xl font-bold text-white border-l-4 border-gold pl-4 mb-6">The Latest Gazette</h3>
        <LastGameReport />
      </div>

      {/* Grid Layout for Widgets */}
      <div className="grid grid-cols-12 gap-8">
        {/* Main Content (Leaderboard) - Spans 8 cols */}
        <div id="leaderboard" className="col-span-12 lg:col-span-8 space-y-6 scroll-mt-24">
          <Leaderboard />
        </div>

        {/* Sidebar Widgets (Wanted, Stats) - Spans 4 cols */}
        <div className="col-span-12 lg:col-span-4 space-y-6 md:space-y-8">
          <WantedPoster />
          <StatCorner />
        </div>
      </div>
    </div>
  );
}
