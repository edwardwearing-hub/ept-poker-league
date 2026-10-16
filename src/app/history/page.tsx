import React from 'react';
import type { Metadata } from 'next';
import { getGameHistory } from '@/lib/data';
import HistoryClientLayout from './HistoryClientLayout';
import PointsKey from '@/components/PointsKey';
import LeagueSubNav from '@/components/LeagueSubNav';

// Force dynamic rendering so history updates instantly when Google Sheet changes
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Session Archive & Historical Game Logs',
    description: 'The definitive historical record of games, finish orders, pots, and payouts for the E.P.T. 2026 Season.',
    openGraph: {
        title: 'Session Archive | E.P.T. 2026 Poker League',
        description: 'Complete game logs, winners, payouts, and finish orders for the E.P.T. 2026 Season.',
        images: [{ url: '/ept-logo.jpg', width: 1200, height: 630, alt: 'EPT Session Archive' }],
    },
};

export default async function HistoryPage() {
    const sessions = await getGameHistory();

    return (
        <div className="min-h-screen bg-[#1c1c1c] text-white p-4 md:p-8 font-sans pb-32">
            <div className="max-w-5xl mx-auto space-y-6">
                <LeagueSubNav />

                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-gold via-[#fff2a8] to-gold bg-clip-text text-transparent inline-block mb-4" style={{ fontFamily: 'serif' }}>
                        Session Archive
                    </h1>
                    <p className="text-zinc-400 font-mono tracking-widest uppercase text-sm md:text-base mb-6">
                        The definitive historical record of the E.P.T. 2026 Season
                    </p>
                    <PointsKey />
                </div>

                <HistoryClientLayout initialSessions={sessions} />
            </div>
        </div>
    );
}
