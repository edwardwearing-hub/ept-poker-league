import { getLeaderboardData, getGlobalStats } from "@/lib/data";
import TVPresentationClient from "@/components/presentation/TVPresentationClient";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

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
