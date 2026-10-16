import type { Metadata } from 'next';
import { getLeaderboardData } from '@/lib/data';
import FullLeagueTable from '@/components/FullLeagueTable';
import { Table } from 'lucide-react';
import PointsKey from '@/components/PointsKey';
import LeagueSubNav from '@/components/LeagueSubNav';
import ChipShowcaseClient from '@/components/3d/ChipShowcaseClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Official League Standings & Full Sheet',
    description: 'Complete statistical ledger, points, profit, cash paid, rebuys, and KOs for all players in the E.P.T. 2026 Poker League.',
    openGraph: {
        title: 'Official League Standings & Full Sheet | E.P.T. 2026',
        description: 'Complete statistical ledger, points, profit, and KOs for all players in the E.P.T. 2026 Poker League.',
        images: [{ url: '/ept-logo.jpg', width: 1200, height: 630, alt: 'EPT League Table' }],
    },
};

export default async function TablePage() {
    const players = await getLeaderboardData();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <LeagueSubNav />

            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gold/10 rounded-lg text-gold border border-gold/20">
                    <Table size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Official League Sheet</h1>
                    <p className="text-zinc-400 text-sm">Raw data from Sheet 1</p>
                </div>
            </div>

            <PointsKey />

            <FullLeagueTable data={players} />

            {/* 3D Ceramic Tournament Chip Denomination Showcase */}
            <div className="pt-8 border-t border-white/10">
                <div className="mb-4 text-center">
                    <span className="text-[10px] font-mono text-gold font-bold uppercase tracking-[0.2em]">Official Table Hardware</span>
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Tournament Chip Denominations</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <div className="lg:col-span-2">
                        <ChipShowcaseClient />
                    </div>
                    <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-black/60 p-6 flex flex-col justify-between shadow-xl backdrop-blur-md">
                        <div>
                            <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-white/10 mb-4 group">
                                <img
                                    src="/assets/3d/chips/chips-set.jpg"
                                    alt="E.P.T. Custom Tournament Chips"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                <span className="absolute bottom-2 left-3 text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                                    Official 14g Clay Composite
                                </span>
                            </div>
                            <h4 className="text-base font-black text-white uppercase tracking-tight">Authentic E.P.T. Clay Chips</h4>
                            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                                Heavy casino-grade 14-gram composite clay chips with distinctive dual-tone edge striping and 2026 championship center inlays.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
                            <span>Standard Stack:</span>
                            <span className="text-gold font-bold">10,000 Starting Chips</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
