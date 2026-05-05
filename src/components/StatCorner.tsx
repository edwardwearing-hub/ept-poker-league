
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

                {/* Date and Time underneath the timer */}
                <div className="mt-4 text-sm font-bold text-white uppercase tracking-tighter border-t border-white/5 pt-4">
                    <div className="text-ept-red text-[10px] tracking-[0.2em] mb-1 font-black">Official Kickoff</div>
                    {formattedDate}
                </div>

                {/* Future Games Slider */}
                {stats.futureDates && stats.futureDates.length > 1 && (
                    <div className="mt-6 border-t border-white/5 pt-4">
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>Upcoming Schedule</span>
                            <span className="text-ept-red/40">Swipe →</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                            {stats.futureDates.slice(1).map((game, i) => (
                                <div 
                                    key={i} 
                                    className="shrink-0 w-32 snap-start p-3 bg-white/5 border border-white/10 rounded-lg hover:border-ept-red/30 transition-colors group/date"
                                >
                                    <div className="text-[9px] text-zinc-500 font-bold mb-1 uppercase tracking-wider group-hover/date:text-ept-red transition-colors">
                                        {new Date(game.iso).toLocaleDateString('en-GB', { weekday: 'short' })}
                                    </div>
                                    <div className="text-xs font-black text-white uppercase">
                                        {new Date(game.iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
