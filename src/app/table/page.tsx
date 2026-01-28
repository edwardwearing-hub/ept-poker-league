import { getLeaderboardData } from '@/lib/data';
import FullLeagueTable from '@/components/FullLeagueTable';
import { Table } from 'lucide-react';

export default async function TablePage() {
    const players = await getLeaderboardData();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gold/10 rounded-lg text-gold border border-gold/20">
                    <Table size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Official League Sheet</h1>
                    <p className="text-zinc-400 text-sm">Raw data from Sheet 1</p>
                </div>
            </div>

            <FullLeagueTable data={players} />
        </div>
    );
}
