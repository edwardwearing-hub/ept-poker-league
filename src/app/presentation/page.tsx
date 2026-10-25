import type { Metadata } from 'next';
import { getLeaderboardData, getGlobalStats, getGameHistory, getGazetteReports } from "@/lib/data";
import TVPresentationClient from "@/components/presentation/TVPresentationClient";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'TV Final Table Broadcast & Ongoing Player Presentation',
    description: 'Broadcast-ready TV presentation showcasing auto-looping player league reports, 16+ career stats, session logs, and live tournament blind clock.',
    openGraph: {
        title: 'TV Final Table Broadcast & Player Showcase | E.P.T. 2026',
        description: 'Auto-looping player league reports, career stats, and live championship broadcast.',
        url: '/presentation',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'EPT TV Final Table' }],
    },
};

export default async function PresentationPage() {
    const [players, stats, history, reports] = await Promise.all([
        getLeaderboardData(),
        getGlobalStats(),
        getGameHistory(),
        getGazetteReports()
    ]);

    return (
        <div className="animate-in fade-in duration-500 font-sans pb-16">
            <TVPresentationClient
                players={players}
                totalPot={stats.totalPot || 0}
                history={history}
                reports={reports}
            />
        </div>
    );
}
