import { getLeaderboardData, getGlobalStats } from "@/lib/data";
import FinalsHubClient from "@/components/final/FinalsHubClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function FinalPage() {
    const [players, stats] = await Promise.all([
        getLeaderboardData(),
        getGlobalStats()
    ]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-16">
            <Link
                href="/"
                className="inline-flex items-center text-zinc-500 hover:text-gold transition-colors text-xs font-bold uppercase tracking-widest"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Link>

            <FinalsHubClient players={players} totalPot={stats.totalPot || 0} />
        </div>
    );
}
