'use client';

import { FileText, Calendar, Trophy } from 'lucide-react';

export default function LastGameReport() {
    return (
        <div className="glass-panel p-8 rounded-2xl border-l-4 border-gold relative overflow-hidden group">

            {/* Background Accent */}
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none group-hover:bg-gold/10 transition-colors duration-700" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gold/10 rounded-lg text-gold border border-gold/20">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gold">Latest League Report</h2>
                        <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                            <Calendar size={12} /> January 24, 2026
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-4xl font-black text-white italic tracking-tight uppercase leading-none">
                        "The Flop" <span className="text-zinc-600 block text-2xl mt-1">Episode 1</span>
                    </h1>

                    <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed">
                        <p>
                            The chips were flying in Episode 4 as <strong>Liam Duxbury</strong> solidified his position at the top of the table.
                            The night saw intense action, with the "Bounty" <strong>Edward Wearing</strong> taking significant heat from his rivals.
                        </p>
                        <p>
                            Notable plays included a massive river bluff that secured the pot leader position for <strong>Luke Daly</strong>,
                            keeping him in close contention for the crown.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <Trophy className="text-gold w-4 h-4" />
                            <span className="text-white font-bold text-sm">Winner:</span>
                            <span className="text-gold font-mono font-bold">Liam Duxbury</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
