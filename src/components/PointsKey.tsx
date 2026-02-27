import React from 'react';
import { Target, Info } from 'lucide-react';

export default function PointsKey() {
    return (
        <div className="bg-[#1c1c1c]/80 backdrop-blur-sm border border-white/10 rounded-xl p-5 md:p-6 mb-10 max-w-2xl shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                <Info className="w-4 h-4 text-gold" />
                <h3 className="text-gold font-black italic uppercase tracking-widest text-sm">League Points System</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-sm font-mono text-zinc-400 mb-5 pl-2">
                <div className="flex justify-between"><span>1st Place</span> <span className="text-white font-bold">10 pts</span></div>
                <div className="flex justify-between"><span>2nd Place</span> <span className="text-white font-bold">6 pts</span></div>
                <div className="flex justify-between"><span>3rd Place</span> <span className="text-white font-bold">4 pts</span></div>
                <div className="flex justify-between"><span>4th Place</span> <span className="text-white font-bold">3 pts</span></div>
                <div className="flex justify-between"><span>5th Place</span> <span className="text-white font-bold">2 pts</span></div>
                <div className="flex justify-between"><span>6th & Below</span> <span className="text-white font-bold">0 pts</span></div>
            </div>

            <div className="flex items-start gap-3 text-sm text-zinc-400 bg-ept-red/10 p-3.5 rounded-lg border border-ept-red/20">
                <Target className="w-5 h-5 text-ept-red mt-0.5 shrink-0" />
                <p className="leading-relaxed">
                    <strong className="text-white">Knockout Bonus:</strong> Players will receive <strong className="text-white">1 point</strong> for each participant they knock out during a game.
                </p>
            </div>
        </div>
    );
}
