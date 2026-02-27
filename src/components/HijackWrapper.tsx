'use client';

import React, { useState, useEffect } from 'react';
import ProfileRedemption from './ProfileRedemption';

interface Props {
    playerName: string;
    enemyQueue: string[]; // This is the Gauntlet queue (from KOs)
    hijackerQueue?: string[]; // This is the PvP attack queue
    isServerHijacked?: boolean;
    children: React.ReactNode;
}

export default function HijackWrapper({ playerName, enemyQueue, hijackerQueue = [], isServerHijacked = false, children }: Props) {
    const [isHijacked, setIsHijacked] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Merge queues: hijackers first, then gauntlet opponents
    const mergedQueue = [...hijackerQueue, ...enemyQueue];

    useEffect(() => {
        // Check if currently hijacked (Server truth takes priority, localStorage as fallback for local testing)
        const savedState = localStorage.getItem(`hijack_active_${playerName}`);
        if (isServerHijacked || savedState === 'true') {
            setIsHijacked(true);
        }
        setIsLoaded(true);
    }, [playerName, isServerHijacked]);

    const handleRedemptionSuccess = () => {
        localStorage.removeItem(`hijack_active_${playerName}`);
        setIsHijacked(false);
    };

    if (!isLoaded) return null; // Prevent hydration flash

    return (
        <div className="relative">
            {isHijacked && (
                <ProfileRedemption playerName={playerName} enemyQueue={mergedQueue} onSuccess={handleRedemptionSuccess} />
            )}


            <div className={isHijacked ? "pointer-events-none select-none blur-[2px]" : ""}>
                {children}
            </div>
        </div>
    );
}
