
import { getLeaderboardData } from '@/lib/data';
import LeaderboardTable from './LeaderboardTable';

export default async function Leaderboard() {
    const data = await getLeaderboardData();

    return (
        <div className="glass-panel rounded-2xl overflow-hidden border border-gold/10 shadow-2xl shadow-black/50">
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-gold text-2xl">♛</span> League Standings
                </h3>
                <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">
                    Updated: Live
                </div>
            </div>

            <LeaderboardTable initialData={data} />
        </div>
    );
}
