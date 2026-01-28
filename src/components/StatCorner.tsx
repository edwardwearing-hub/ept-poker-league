
import { getGlobalStats } from '@/lib/data';
import { Coins, Calendar, Trophy } from 'lucide-react';

export default async function StatCorner() {
    const stats = await getGlobalStats();

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
                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Next Game</h3>
                <div className="text-xl font-bold text-white">
                    {stats.nextGameDate}
                </div>
                <div className="mt-2 flex gap-2 text-center">
                    {/* Simplified static countdown for demo - typically would use client component for tick */}
                    <div className="bg-black/30 rounded p-1.5 min-w-[3rem]">
                        <div className="text-lg font-bold text-ept-red">24</div>
                        <div className="text-[9px] uppercase text-zinc-500">Days</div>
                    </div>
                    <div className="bg-black/30 rounded p-1.5 min-w-[3rem]">
                        <div className="text-lg font-bold text-white">08</div>
                        <div className="text-[9px] uppercase text-zinc-500">Hrs</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
