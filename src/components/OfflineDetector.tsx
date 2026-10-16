'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineDetector() {
    const [isOffline, setIsOffline] = useState(false);
    const [justReconnected, setJustReconnected] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check initial state
        if (!navigator.onLine) {
            setIsOffline(true);
        }

        const handleOffline = () => {
            setIsOffline(true);
            setJustReconnected(false);
            setDismissed(false);
        };

        const handleOnline = () => {
            setIsOffline(false);
            setJustReconnected(true);
            const timer = setTimeout(() => {
                setJustReconnected(false);
            }, 3500);
            return () => clearTimeout(timer);
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (dismissed || (!isOffline && !justReconnected)) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-16 md:top-4 inset-x-4 max-w-md mx-auto z-[200] pointer-events-auto"
            >
                {isOffline ? (
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-zinc-950/95 border border-amber-500/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl text-amber-300">
                        <div className="flex items-center gap-2.5 text-xs font-bold">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                                <WifiOff size={13} className="text-amber-400" />
                            </div>
                            <div>
                                <span className="uppercase tracking-wider font-mono text-[10px] text-amber-400 block font-black">
                                    Basement / Weak Signal
                                </span>
                                <span className="text-zinc-200 text-xs">
                                    Offline Mode — Displaying cached league data.
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition shrink-0"
                            aria-label="Dismiss offline banner"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-zinc-950/95 border border-emerald-500/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl text-emerald-300">
                        <div className="flex items-center gap-2.5 text-xs font-bold">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                                <Wifi size={13} className="text-emerald-400" />
                            </div>
                            <div>
                                <span className="uppercase tracking-wider font-mono text-[10px] text-emerald-400 block font-black">
                                    Connection Restored
                                </span>
                                <span className="text-zinc-200 text-xs">
                                    Back Online — Reconnected to live league cloud.
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition shrink-0"
                            aria-label="Dismiss online banner"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
