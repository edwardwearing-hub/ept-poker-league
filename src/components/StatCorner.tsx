
import { getGlobalStats } from '@/lib/data';
import { Coins, Calendar } from 'lucide-react';
import StatCornerCountdown from './StatCornerCountdown';

export default async function StatCorner() {
    const stats = await getGlobalStats();

    const formattedDate = new Date(stats.nextGameDate).toLocaleString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="space-y-4">
            {/* Pot Display */}
            <div className="glass-panel p-5 rounded-xl border-l-4 border-gold relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Coins size={64} className="text-gold" />
                </div>
                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Total Prize Pot</h3>
                <div className="text-4xl font-bold text-white flex items-baseline gap-1">
                    <span className="text-gold">£</span>{stats.totalPot}
                </div>
            </div>

            {/* Next Game Countdown */}
            <div className="glass-panel p-5 rounded-xl border-l-4 border-ept-red relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calendar size={64} className="text-ept-red" />
                </div>
                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Next Game</h3>
                
                <StatCornerCountdown targetDateStr={stats.nextGameDate} />
            </div>
        </div>
    );
}
