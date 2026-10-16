import type { Metadata } from 'next';
import { getLeaderboardData, getGlobalStats } from "@/lib/data";
import TVPresentationClient from "@/components/presentation/TVPresentationClient";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'TV Final Table Broadcast & Presentation',
    description: 'Broadcast-ready TV presentation view showcasing full-screen chip counts, player cards, and championship stakes for game night.',
    openGraph: {
        title: 'TV Final Table Broadcast | E.P.T. 2026',
        description: 'Broadcast-ready TV presentation view showcasing chip counts, player cards, and championship stakes.',
        images: [{ url: '/ept-logo.jpg', width: 1200, height: 630, alt: 'EPT TV Final Table' }],
    },
};

export default async function PresentationPage() {
    const [players, stats] = await Promise.all([
        getLeaderboardData(),
        getGlobalStats()
    ]);

    return (
        <div className="animate-in fade-in duration-500 font-sans pb-16">
            <TVPresentationClient players={players} totalPot={stats.totalPot || 0} />
        </div>
    );
}
