import type { Metadata } from "next";
import StatCorner from "@/components/StatCorner";
import LeagueSubNav from "@/components/LeagueSubNav";

export const metadata: Metadata = {
    title: 'Player Statistics & League Analytics',
    description: 'Deep-dive statistical graphs, season highs, knockout ratios, and profit trajectories for the E.P.T. 2026 Season.',
    openGraph: {
        title: 'Player Statistics & League Analytics | E.P.T. 2026',
        description: 'Deep-dive statistical graphs, season highs, and knockout ratios for the E.P.T. 2026 Season.',
        images: [{ url: '/ept-logo.jpg', width: 1200, height: 630, alt: 'EPT League Statistics' }],
    },
};

export default function StatsPage() {
    return (
        <div className="space-y-6 animate-in float-in-from-bottom-4 duration-700">
            <LeagueSubNav />

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-center mb-6 tracking-tight">
                League <span className="text-gold">Statistics &amp; Analytics</span>
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <StatCorner />

                {/* Additional Placeholders for future stats */}
                <div className="glass-panel p-6 rounded-xl border border-white/5 bg-zinc-900/50">
                    <h3 className="text-xl font-bold text-zinc-400 mb-4">Season Highs</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-zinc-500">Biggest Pot</span>
                            <span className="text-gold font-mono">£200</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-zinc-500">Most KOs (Single Game)</span>
                            <span className="text-ept-red font-mono">5 ☠️</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
