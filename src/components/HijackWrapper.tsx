'use client';

import React, { useState, useEffect } from 'react';
import ProfileRedemption from './ProfileRedemption';
import { Skull } from 'lucide-react';

interface Props {
    playerName: string;
    enemyQueue: string[];
    children: React.ReactNode;
}

export default function HijackWrapper({ playerName, enemyQueue, children }: Props) {
    const [isHijacked, setIsHijacked] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check if currently hijacked
        const savedState = localStorage.getItem(`hijack_active_${playerName}`);
        if (savedState === 'true') {
            setIsHijacked(true);
        }
        setIsLoaded(true);
    }, [playerName]);

    const handleTriggerHijack = () => {
        localStorage.setItem(`hijack_active_${playerName}`, 'true');
        setIsHijacked(true);
    };

    const handleRedemptionSuccess = () => {
        localStorage.removeItem(`hijack_active_${playerName}`);
        setIsHijacked(false);
    };

    if (!isLoaded) return null; // Prevent hydration flash



    return (
        <div className="relative">
            {/* Secret Hijack Trigger Button (For Testing/Fun) */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={handleTriggerHijack}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black/50 hover:bg-ept-red/20 border border-white/10 hover:border-ept-red/50 rounded-lg text-xs font-mono text-zinc-500 hover:text-ept-red transition-all group"
                    title="Simulate Profile Hijack"
                >
                    <Skull className="w-3 h-3 group-hover:animate-pulse" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">INITIATE HIJACK</span>
                </button>
            </div>
            {isHijacked && (
                <ProfileRedemption playerName={playerName} enemyQueue={enemyQueue} onSuccess={handleRedemptionSuccess} />
            )}

            <div className={isHijacked ? "pointer-events-none select-none blur-[2px]" : ""}>
                {children}
            </div>
        </div>
    );
}
