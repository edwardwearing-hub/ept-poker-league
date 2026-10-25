import type { Metadata } from 'next';
import { getLeaderboardData } from "@/lib/data";
import Link from "next/link";
import { ArrowLeft } from 'lucide-react';
import BountiesClient from './BountiesClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Bounty Board & Wanted Hit Lists',
    description: 'Track the Executioner, Apex Predator, and Bullet Sponge rankings along with active Western-style bounties and knockout intel.',
    openGraph: {
        title: 'Bounty Board & Wanted Hit Lists | E.P.T. 2026',
        description: 'Track knockout leaderboards and active bounty targets in the E.P.T. 2026 Poker League.',
        url: '/bounties',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'EPT Bounty Board' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Bounty Board & Wanted Hit Lists | E.P.T. 2026',
        description: 'Track knockout leaderboards and active bounty targets in the E.P.T. 2026 Poker League.',
        images: ['/og-image.jpg'],
    },
};

interface Props {
    searchParams?: Promise<{ view?: string }>;
}

export default async function BountyBoard(props: Props) {
    const searchParams = props.searchParams ? await props.searchParams : undefined;
    const initialView = searchParams?.view === 'wanted' ? 'wanted' : 'rankings';
    const players = await getLeaderboardData();

    return (
        <div className="min-h-screen bg-black text-white font-mono p-3 sm:p-6 md:p-8 animate-in fade-in duration-700">
            <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
                <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-ept-red transition-colors text-xs font-bold uppercase tracking-wider">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Link>

                <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-ept-red via-red-500 to-orange-500 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] break-words">
                        Bounties &amp; Hit List
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-xs sm:text-sm md:text-base border-y border-zinc-800 py-3 sm:py-4">
                        LIVE GLOBAL ASSASSINATION TRACKING &amp; WANTED POSTERS. ONLY THE RUTHLESS SURVIVE.
                    </p>
                </div>

                <BountiesClient players={players} initialView={initialView} />
            </div>
        </div>
    );
}
