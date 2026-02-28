'use client';

import React, { useState, useEffect } from 'react';
import LockerPINModal from './LockerPINModal';
import PvPRulesModal from './PvPRulesModal';
import SetPINModal from './SetPINModal';
import { Skull, AlertOctagon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [activePlayer, setActivePlayer] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showSiren, setShowSiren] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [showSetPin, setShowSetPin] = useState(false);
    const [playerStatus, setPlayerStatus] = useState<any>(null);

    useEffect(() => {
        const savedPlayer = localStorage.getItem('ept_active_player_v2');
        const hasOnboarded = localStorage.getItem('ept_pvp_onboarded_v2');

        if (savedPlayer) {
            setActivePlayer(savedPlayer);
            checkPlayerStatus(savedPlayer);
            if (!hasOnboarded) {
                setShowRules(true);
            }
        }
        setIsLoaded(true);
    }, []);

    const checkPlayerStatus = async (name: string) => {
        try {
            const res = await fetch(`/api/player/status?name=${encodeURIComponent(name)}`);
            if (res.ok) {
                const status = await res.json();
                setPlayerStatus(status);

                // If PIN is default, force setup
                if (status.secretPin === "0000") {
                    setShowSetPin(true);
                }

                if (status.isHijacked) {
                    setShowSiren(true);
                    playAlarm();
                }
            }
        } catch (err) {
            console.error('Failed to check player status', err);
        }
    };

    const playAlarm = () => {
        const audio = new Audio('/sounds/8bit-alarm.mp3'); // Assuming asset exists or will be added
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play blocked'));
    };

    const handleLoginSuccess = (name: string) => {
        setActivePlayer(name);
        checkPlayerStatus(name);
        const hasOnboarded = localStorage.getItem('ept_pvp_onboarded_v2');
        if (!hasOnboarded) {
            setShowRules(true);
        }
    };

    if (!isLoaded) return null;

    return (
        <>
            <AnimatePresence>
                {!activePlayer && (
                    <LockerPINModal onSuccess={handleLoginSuccess} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showRules && (
                    <PvPRulesModal onClose={() => setShowRules(false)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSetPin && activePlayer && (
                    <SetPINModal
                        playerName={activePlayer}
                        isMandatory={true}
                        onSuccess={() => setShowSetPin(false)}
                    />
                )}
            </AnimatePresence>

            {/* Module 4: Login Siren Alert */}
            <AnimatePresence>
                {showSiren && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-red-950/90 backdrop-blur-md"
                    >
                        {/* Red Flash Pulse */}
                        <div className="absolute inset-0 bg-red-600/20 animate-pulse" />

                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-black border-8 border-ept-red p-8 max-w-lg w-full text-center relative z-10 shadow-[0_0_100px_rgba(220,38,38,0.5)]"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-ept-red rounded-full animate-bounce">
                                    <AlertOctagon className="w-12 h-12 text-white" />
                                </div>
                            </div>

                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">
                                Profile Compromised
                            </h2>

                            <p className="text-ept-red font-bold text-lg mb-8 animate-pulse uppercase tracking-widest">
                                Critical Security Breach Detected
                            </p>

                            <div className="bg-zinc-900 p-6 border-2 border-zinc-800 mb-8 relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ept-red text-white text-[10px] px-2 font-bold py-0.5">MESSAGE FROM HIJACKER</div>
                                <p className="text-zinc-300 italic">"Your stats belong to me now. Try and win them back if you can."</p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Link
                                    href={`/scouting/${encodeURIComponent(activePlayer || '')}`}
                                    onClick={() => setShowSiren(false)}
                                    className="bg-ept-red hover:bg-red-600 text-white font-black py-4 uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-105"
                                >
                                    <Zap className="w-5 h-5 fill-current" /> Initialize Redemption Gauntlet
                                </Link>

                                <button
                                    onClick={() => setShowSiren(false)}
                                    className="text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest"
                                >
                                    Proceed to Dashboard (Stats Locked)
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={!activePlayer ? "hidden" : ""}>
                {children}
            </div>

            <style jsx global>{`
                @keyframes red-siren {
                    0%, 100% { background-color: rgba(220, 38, 38, 0.1); }
                    50% { background-color: rgba(220, 38, 38, 0.3); }
                }
                .animate-siren {
                    animation: red-siren 1s infinite;
                }
            `}</style>
        </>
    );
}
