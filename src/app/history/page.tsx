import React from 'react';
import { getGameHistory } from '@/lib/data';
import HistoryClientLayout from './HistoryClientLayout';
import PointsKey from '@/components/PointsKey';

// Force dynamic rendering so history updates instantly when Google Sheet changes
export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
    const sessions = await getGameHistory();

    return (
        <div className="min-h-screen bg-[#1c1c1c] text-white p-4 md:p-8 font-sans pb-32">
            <div className="max-w-5xl mx-auto">
                <div className="mb-12 text-center md:text-left">
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
