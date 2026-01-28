
'use client';

import { useState } from 'react';
import { Play, Pause, SkipForward, Volume2 } from 'lucide-react';

export default function RiverReportPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="bg-charcoal-dark border border-white/5 rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gold/10 rounded-md flex items-center justify-center border border-gold/20">
                    <span className="text-lg">🎙️</span>
                </div>
                <div className="overflow-hidden">
                    <h4 className="text-sm font-semibold text-white truncate">Episode 4: The Flop</h4>
                    <p className="text-xs text-zinc-500 truncate">Host: The Dealer</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-2">
                <button className="text-zinc-400 hover:text-white transition">
                    <Volume2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-8 h-8 rounded-full bg-gold text-charcoal-dark flex items-center justify-center hover:bg-gold-glow transition shadow-lg shadow-gold/20"
                    >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <button className="text-zinc-400 hover:text-white transition">
                        <SkipForward className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress bar stub */}
                <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-gold"></div>
                </div>
            </div>
        </div>
    );
}
