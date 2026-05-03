'use client';

import React from 'react';

const AVATAR_MAP: Record<string, string> = {
    'edward wearing': 'avatar_edward_wearing_1772222877224.png',
    'georgina wearing': 'avatar_georgina_wearing_1772223035422.png',
    'luke daly': 'avatar_luke_daly_1772223102669.png',
    'daniel horne': 'avatar_daniel_horne_1772222954376.png',
    'darren daly': 'avatar_darren_daly_1772222979758.png',
    'chris daly': 'avatar_chris_daly_1772222942062.png',
    'stephen flood': 'avatar_stephen_flood_1772223088474.png',
    'phil landsberger': 'avatar_hoodie.png',
    'liam duxbury': 'avatar_liam_duxbury_1772223048076.png',
    'nathen benson': 'avatar_nathen_benson_1772223077518.png',
    'dave taylor': 'avatar_dave_taylor_1772223007740.png',
    'unknown hacker': 'avatar_bounty.png'
};

export const getAvatarFilename = (name: string) => {
    const key = name.toLowerCase().trim();
    return AVATAR_MAP[key] || 'avatar_hoodie.png';
};

interface Props {
    playerName: string;
    enemyName: string;
    isNemesis: boolean;
    score: number;
    targetScore: number;
    gauntletCurrent: number;
    gauntletTotal: number;
    lives?: number;
}

export default function GameHUD({ playerName, enemyName, isNemesis, score, targetScore, gauntletCurrent, gauntletTotal, lives = 3 }: Props) {
    return (
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gold/30 bg-black/80 backdrop-blur-md relative z-10 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            {/* Player */}
            <div className="text-center flex flex-col items-center">
                <img
                    src={`/avatars/${getAvatarFilename(playerName)}`}
                    alt="Player"
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow-[0_0_5px_rgba(34,197,94,0.3)] animate-breathe"
                />
                <span className="text-[9px] sm:text-[10px] text-green-500 font-bold uppercase block mt-1">Player</span>
                
                {/* Lives Indicator */}
                <div className="flex gap-1 mt-1">
                    {[...Array(3)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full border ${i < lives ? 'bg-ept-red border-red-400 shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'bg-transparent border-zinc-700'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Center: Gauntlet + Score */}
            <div className="flex flex-col items-center">
                <span className="text-zinc-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1">
                    Gauntlet: {gauntletCurrent} / {gauntletTotal}
                </span>
                <div className="flex space-x-1">
                    {Array.from({ length: targetScore }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 transition-all duration-300 ${i < score
                                    ? 'bg-green-500 border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                                    : 'bg-black border-zinc-700'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Enemy */}
            <div className="text-center">
                <img
                    src={`/avatars/${getAvatarFilename(enemyName)}`}
                    alt={enemyName}
                    className={`w-12 h-12 sm:w-16 sm:h-16 object-contain 
                        ${isNemesis ? 'filter drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse' : 'animate-breathe-delayed'}`}
                />
                <span className={`text-[9px] sm:text-[10px] ${isNemesis ? 'text-ept-red animate-pulse' : 'text-zinc-400'} font-bold uppercase block mt-1`}>
                    {isNemesis ? 'Nemesis' : 'Hijacker'}
                </span>
            </div>
        </div>
    );
}
