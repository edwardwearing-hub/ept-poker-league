
import Leaderboard from "@/components/Leaderboard";
import WantedPoster from "@/components/WantedPoster";
import StatCorner from "@/components/StatCorner";
import LastGameReport from "@/components/LastGameReport";

export const revalidate = 0; // Ensure fresh data on every request

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Newspaper Header */}
      <header className="border-b border-white/10 pb-6 mb-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-gold font-bold uppercase tracking-widest text-sm mb-1">League Update • Season 2026</h2>
            <h1 className="text-5xl font-extrabold text-white leading-tight">
              The River <span className="text-ept-red">Chronicles</span>
            </h1>
          </div>
          <div className="text-right">
            <div className="text-zinc-500 font-mono text-sm">February 28, 2026</div>
            <div className="text-zinc-600 text-xs uppercase tracking-wider">Vol. 4</div>
          </div>
        </div>
        <p className="text-xl text-zinc-300 max-w-2xl leading-relaxed">
          Liam Duxbury takes the lead as the league heats up, while Edward Wearing finds himself with a price on his head.
          The pots are getting bigger, and the rivalries are getting deeper.
        </p>
      </header>

      {/* Latest Report */}
      <div className="mb-8">
        <LastGameReport />
      </div>

      {/* Grid Layout for Widgets */}
      <div className="grid grid-cols-12 gap-8">
        {/* Main Content (Leaderboard) - Spans 8 cols */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Leaderboard />
        </div>

        {/* Sidebar Widgets (Wanted, Stats) - Spans 4 cols */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <WantedPoster />
          <StatCorner />
        </div>
      </div>
    </div>
  );
}
