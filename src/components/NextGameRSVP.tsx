'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2, UserCheck } from 'lucide-react';
import { clsx } from 'clsx';

type Registrations = Record<string, boolean>;

export default function NextGameRSVP() {
    const [registrations, setRegistrations] = useState<Registrations>({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/rsvp')
            .then(res => res.json())
            .then(data => {
                setRegistrations(data);
                setLoading(false);
            });
    }, []);

    const toggleRSVP = async (player: string) => {
        const newState = !registrations[player];
        setUpdating(player);

        // Optimistic update
        setRegistrations(prev => ({ ...prev, [player]: newState }));

        try {
            await fetch('/api/rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player, isPlaying: newState })
            });
        } catch {
            // Revert on error
            setRegistrations(prev => ({ ...prev, [player]: !newState }));
        } finally {
            setUpdating(null);
        }
    };

    const confirmedCount = Object.values(registrations).filter(Boolean).length;
    const totalCount = Object.keys(registrations).length;

    if (loading) return (
        <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-gold" />
        </div>
    );

    return (
        <div className="px-4 mb-6">
            <div className="flex items-center justify-between gap-2 mb-3 text-zinc-400">
                <div className="flex items-center gap-2">
                    <UserCheck size={14} className="text-gold" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gold">Player Check-In</span>
                </div>
                <span className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-white">
                    {confirmedCount}/{totalCount}
                </span>
            </div>

            <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                {Object.keys(registrations).map((player) => (
                    <div
                        key={player}
                        onClick={() => toggleRSVP(player)}
                        className={clsx(
                            "flex items-center justify-between px-3 py-2 border-b border-white/5 last:border-0 cursor-pointer transition-colors hover:bg-white/5",
                            registrations[player] ? "bg-gold/5" : ""
                        )}
                    >
                        <span className={clsx(
                            "text-xs font-medium truncate max-w-[140px]",
                            registrations[player] ? "text-white" : "text-zinc-500"
                        )}>
                            {player}
                        </span>

                        <div className="text-gold">
                            {updating === player ? (
                                <Loader2 size={14} className="animate-spin opacity-50" />
                            ) : registrations[player] ? (
                                <CheckCircle2 size={14} className="fill-gold stroke-charcoal" />
                            ) : (
                                <Circle size={14} className="text-zinc-600" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-center mt-2">
                <p className="text-[9px] text-zinc-600 italic">Click name to confirm attendance</p>
            </div>
        </div>
    );
}
