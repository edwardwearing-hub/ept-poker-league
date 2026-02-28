'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, ChevronRight, AlertTriangle } from 'lucide-react';

interface Player {
    name: string;
    avatarUrl: string;
    nickname: string;
}

interface Props {
    onSuccess: (name: string) => void;
}

export default function LockerPINModal({ onSuccess }: Props) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'select' | 'pin'>('select');

    useEffect(() => {
        fetch('/api/players')
            .then(res => res.json())
            .then(data => setPlayers(data))
            .catch(err => console.error('Failed to fetch players', err));
    }, []);

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const handleSubmit = async () => {
        if (!selectedPlayer || pin.length < 4) return;

        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: selectedPlayer.name, pin })
            });

            if (res.ok) {
                localStorage.setItem('ept_active_player_v2', selectedPlayer.name);
                onSuccess(selectedPlayer.name);
            } else {
                setError(true);
                setPin('');
                // Shake effect triggered by error state
                setTimeout(() => setError(false), 500);
            }
        } catch (err) {
            console.error('Auth error', err);
        } finally {
            setLoading(false);
        }
    };

    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'OK'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl">
            {/* Background scanlines */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-20 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md p-6 bg-zinc-900 border-4 border-zinc-800 rounded-none shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
                {/* 8-bit Header */}
                <div className="bg-black p-4 border-b-4 border-zinc-800 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-ept-red" />
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Locker Authentication</h2>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'select' ? (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">IDENTIFY YOURSELF</label>
                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {players.map(player => (
                                    <button
                                        key={player.name}
                                        onClick={() => {
                                            setSelectedPlayer(player);
                                            setStep('pin');
                                        }}
                                        className="flex items-center gap-4 p-3 bg-zinc-800/50 hover:bg-ept-red/20 border border-white/5 hover:border-ept-red/30 transition-all group"
                                    >
                                        <img src={player.avatarUrl} alt="" className="w-10 h-10 object-contain pixel-antialiased" />
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-white uppercase">{player.name}</div>
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase">{player.nickname}</div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 ml-auto text-zinc-600 group-hover:text-ept-red" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="pin"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <button
                                onClick={() => { setStep('select'); setPin(''); }}
                                className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase flex items-center gap-1"
                            >
                                <ChevronRight className="w-3 h-3 rotate-180" /> Change Player
                            </button>

                            <div className="flex items-center gap-4 p-4 bg-black border-2 border-zinc-800">
                                <img src={selectedPlayer?.avatarUrl} alt="" className="w-12 h-12 object-contain" />
                                <div>
                                    <div className="text-lg font-black text-white uppercase leading-none">{selectedPlayer?.name}</div>
                                    <div className="text-[10px] text-ept-red font-bold uppercase mt-1">Status: Restricted</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* PIN Display */}
                                <div className={`h-16 flex items-center justify-center gap-4 bg-black border-4 ${error ? 'border-ept-red animate-shake' : 'border-zinc-800'}`}>
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="w-3 h-3 rounded-full border-2 border-zinc-700 overflow-hidden">
                                            {pin.length > i && <div className="w-full h-full bg-ept-red animate-pulse" />}
                                        </div>
                                    ))}
                                    {error && <span className="absolute text-[10px] font-bold text-ept-red uppercase animate-pulse">ACCESS DENIED</span>}
                                </div>

                                {/* Keypad */}
                                <div className="grid grid-cols-3 gap-2">
                                    {numbers.map(n => (
                                        <button
                                            key={n}
                                            disabled={loading}
                                            onClick={() => {
                                                if (n === 'CLR') handleDelete();
                                                else if (n === 'OK') handleSubmit();
                                                else handleNumberClick(n);
                                            }}
                                            className={`h-14 flex items-center justify-center font-black text-lg border-2 transition-all active:scale-95
                                                ${n === 'OK' ? 'bg-ept-red/10 border-ept-red/30 text-ept-red hover:bg-ept-red hover:text-white' :
                                                    n === 'CLR' ? 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white' :
                                                        'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'}`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Deco */}
                <div className="mt-8 flex justify-between items-center opacity-30 select-none grayscale">
                    <span className="text-[8px] font-mono text-zinc-500 italic">SECURE 8-BIT ENCRYPTION</span>
                    <AlertTriangle className="w-3 h-3 text-ept-red" />
                </div>
            </motion.div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 3;
                }
                .pixel-antialiased {
                    image-rendering: pixelated;
                }
            `}</style>
        </div>
    );
}
