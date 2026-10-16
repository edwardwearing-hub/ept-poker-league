import type { Metadata } from "next";
import { getLeaderboardData, getGlobalStats, getGameHistory, getGazetteReports } from "@/lib/data";
import FinalsHubClient from "@/components/final/FinalsHubClient";
import LeagueSubNav from "@/components/LeagueSubNav";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'December Grand Final | The Road to the Crown',
    description: 'Track the qualification cutoff, championship prize pool, and top contenders for the E.P.T. 2026 December Grand Final.',
    openGraph: {
        title: 'December Grand Final | E.P.T. 2026 Poker League',
        description: 'Track the qualification cutoff, championship prize pool, and top contenders for the E.P.T. 2026 December Grand Final.',
        images: [{ url: '/ept-logo.jpg', width: 1200, height: 630, alt: 'EPT December Grand Final' }],
    },
};

export default async function FinalPage() {
    const [players, stats, history, reports] = await Promise.all([
        getLeaderboardData(),
        getGlobalStats(),
        getGameHistory(),
        getGazetteReports()
    ]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-16">
            <LeagueSubNav />

            <FinalsHubClient 
                players={players} 
                totalPot={stats.totalPot || 0} 
                history={history}
                reports={reports}
            />
        </div>
    );
}
