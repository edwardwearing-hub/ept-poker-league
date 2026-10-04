'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2, UserCheck } from 'lucide-react';
import { clsx } from 'clsx';

type Registrations = Record<string, boolean>;

export default function NextGameRSVP() {
    const [registrations, setRegistrations] = useState<Registrations>({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [activePlayer, setActivePlayer] = useState<string | null>(null);
    const [guestNotice, setGuestNotice] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/rsvp')
            .then(res => res.json())
            .then(data => {
                setRegistrations(data);
                setLoading(false);
            });

        const updatePlayer = () => {
            setActivePlayer(localStorage.getItem('ept_active_player_v2'));
        };
        updatePlayer();
        window.addEventListener('storage', updatePlayer);
        return () => window.removeEventListener('storage', updatePlayer);
    }, []);

    const toggleRSVP = async (player: string) => {
        const savedPlayer = localStorage.getItem('ept_active_player_v2');
        if (!savedPlayer) {
            setGuestNotice("Guest Mode: Sign in to your locker to RSVP");
            setTimeout(() => setGuestNotice(null), 3500);
            return;
        }

        const isSelfOrAdmin = savedPlayer.toLowerCase().trim() === player.toLowerCase().trim() ||
                              savedPlayer.toLowerCase().includes('edward');
        if (!isSelfOrAdmin) {
            setGuestNotice(`Only ${player} can change their attendance`);
            setTimeout(() => setGuestNotice(null), 3500);
            return;
        }

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

            {guestNotice && (
                <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-center animate-in fade-in duration-200">
                    <p className="text-[10px] font-bold text-amber-400 leading-tight">{guestNotice}</p>
                    {!activePlayer && (
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('ept_open_login'))}
                            className="mt-1 text-[9px] text-gold hover:text-white underline font-bold uppercase tracking-wider inline-block"
                        >
                            Open Player Login
                        </button>
                    )}
                </div>
            )}

            <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                {Object.keys(registrations).map((player) => (
                    <div
                        key={player}
                        onClick={() => toggleRSVP(player)}
                        className={clsx(
                            "flex items-center justify-between px-3 py-2 border-b border-white/5 last:border-0 transition-colors",
                            activePlayer ? "cursor-pointer hover:bg-white/5" : "cursor-pointer hover:bg-white/5",
                            registrations[player] ? "bg-gold/5" : ""
                        )}
                        title={!activePlayer ? "Guest Mode (Log in as player to change)" : `Toggle ${player}`}
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
                {activePlayer ? (
                    <p className="text-[9px] text-zinc-500 italic">Click your name to confirm attendance</p>
                ) : (
                    <p className="text-[9px] text-zinc-500 italic">
                        Guest View •{' '}
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('ept_open_login'))}
                            className="text-gold hover:text-white underline font-semibold"
                        >
                            Player Login to RSVP
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}
