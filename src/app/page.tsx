
import Leaderboard from "@/components/Leaderboard";
import WantedPoster from "@/components/WantedPoster";
import StatCorner from "@/components/StatCorner";
import LastGameReport from "@/components/LastGameReport";
import NextGameCountdown from "@/components/NextGameCountdown";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="space-y-12 animate-in fade-in duration-500 font-sans">

      {/* Next Game Countdown Section */}
      <NextGameCountdown />

      {/* The Hype Section */}
      <section className="space-y-6 pt-4 md:pt-6">
        <h3 className="text-3xl font-bold text-white border-l-4 border-gold pl-4 print-hidden">League Hype</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Hype Card 1 */}
          <div className="group relative h-64 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-gold transition-colors">
            <img
              src="/images/hype-dynasty.png"
              alt="The Wearing Dynasty vs The Daly Clan"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-ept-red font-bold text-xs uppercase tracking-widest">Trailer</span>
              <h4 className="text-xl font-bold text-white mt-1 group-hover:text-gold transition">The Wearing Dynasty vs The Daly Clan</h4>
            </div>
          </div>

          {/* Hype Card 2 */}
          <div className="group relative h-64 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-gold transition-colors">
            <img
              src="/images/hype-bluff.png"
              alt="Biggest Bluffs of Season 2025"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-ept-red font-bold text-xs uppercase tracking-widest">Highlight Reel</span>
              <h4 className="text-xl font-bold text-white mt-1 group-hover:text-gold transition">Biggest Bluffs of Season 2025</h4>
            </div>
          </div>

          {/* Hype Card 3 */}
          <div className="group relative h-64 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-gold transition-colors hidden lg:block">
            <div className="absolute inset-0 bg-charcoal-light flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mx-auto mb-4 text-gray-500 group-hover:text-gold group-hover:border-gold transition">
                  +
                </div>
                <span className="text-gray-400 font-bold uppercase text-sm tracking-widest">Submit footage for next trailer</span>
              </div>
            </div>
          </div>
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
