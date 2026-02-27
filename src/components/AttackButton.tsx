'use client';

import React, { useState } from 'react';
import { Target, Skull, Share2, Facebook, Link as LinkIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStatus } from '@/hooks/usePlayerStatus';

interface Props {
    targetName: string;
    isTargetHijacked: boolean;
    onAttackSuccess?: () => void;
}

export default function AttackButton({ targetName, isTargetHijacked, onAttackSuccess }: Props) {
    const { status } = usePlayerStatus();
    const [isAnimating, setIsAnimating] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Current logged-in player name is stored in status from the hook
    const attackerName = status?.name;
    const canAttack = status?.hackTokens > 0 && !isTargetHijacked && attackerName !== targetName;

    const handleAttack = async () => {
        if (!canAttack || loading) return;

        setLoading(true);
        setIsAnimating(true);

        try {
            const res = await fetch('/api/player/attack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attacker: attackerName, target: targetName })
            });

            if (res.ok) {
                // Wait for animation to finish before showing modal
                setTimeout(() => {
                    setIsAnimating(false);
                    setShowShareModal(true);
                    onAttackSuccess?.();
                }, 3000);
            } else {
                setIsAnimating(false);
                setLoading(false);
                alert('Attack Failed: ' + (await res.json()).error);
            }
        } catch (err) {
            console.error('Attack error', err);
            setIsAnimating(false);
            setLoading(false);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/scouting/${encodeURIComponent(targetName)}`;
        const shareData = {
            title: 'EPT HIJACK SUCCESSFUL',
            text: `🚨 HIJACK SUCCESSFUL: I have compromised ${targetName}'s Poker Profile! View their locked stats here:`,
            url: url
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback to standard FB sharer if Web Share API is not supported (Desktop)
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        }
    };

    const copyLink = () => {
        const url = `${window.location.origin}/scouting/${encodeURIComponent(targetName)}`;
        navigator.clipboard.writeText(url);
        alert('Compromised Profile Link Copied to Clipboard!');
    };

    return (
        <>
            <div className="relative">
                {canAttack && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAttack}
                        disabled={loading}
                        className="group relative flex items-center gap-3 px-8 py-4 bg-ept-red text-white font-black uppercase tracking-widest border-b-4 border-red-900 overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.4)]"
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        <Target className="w-6 h-6 animate-pulse" />
                        <span className="text-xl italic">Launch Hijack</span>
                        <div className="flex items-center gap-1 ml-2 bg-black/20 px-2 py-0.5 rounded text-[10px]">
                            <Skull className="w-3 h-3" /> Cost: 1
                        </div>
                    </motion.button>
                )}

                {/* Graffiti Animation Overlay */}
                <AnimatePresence>
                    {isAnimating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
                        >
                            <div className="relative w-[500px] h-[500px]">
                                {/* 8-Bit Attacker Sprite Dropping */}
                                <motion.div
                                    initial={{ y: -500 }}
                                    animate={{ y: 0 }}
                                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <img
                                        src={`/avatars/avatar_${attackerName?.toLowerCase().replace(' ', '_')}.png`}
                                        alt=""
                                        className="w-48 h-48 object-contain drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]"
                                        onError={(e) => e.currentTarget.src = '/avatars/avatar_hoodie.png'}
                                    />

                                    {/* Spray Paint Effect */}
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: [1, 1.2, 1.1], opacity: [0, 0.8, 0] }}
                                        transition={{ delay: 1, duration: 1 }}
                                        className="absolute bg-ept-red rounded-full w-96 h-96 blur-[40px]"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.8 }}
                                        className="absolute inset-0 flex items-center justify-center"
                                    >
                                        <span className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_20px_rgba(0,0,0,1)] -rotate-12 translate-y-20">
                                            HIJACKED!
                                        </span>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Post-Attack Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-zinc-900 border-4 border-gold w-full max-w-xl relative overflow-hidden shadow-[0_0_100px_rgba(255,215,0,0.2)] flex flex-col max-h-[90vh]"
                        >
                            {/* Scrollable HUD Container */}
                            <div className="overflow-y-auto flex-1 custom-scrollbar p-6 sm:p-8">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-gold to-red-500 animate-shimmer" />

                                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic mb-2 tracking-tighter text-center">Mission Successful</h2>
                                <p className="text-gold font-bold uppercase text-[9px] sm:text-[10px] tracking-widest mb-6 italic animate-pulse text-center">
                                    Target Neutralized • Stats Compromised
                                </p>

                                {/* Preview Poster */}
                                <div className="relative aspect-[4/5] bg-charcoal border-4 border-zinc-800 mb-6 sm:mb-8 overflow-hidden group max-w-xs mx-auto">
                                    <div className="absolute inset-0 bg-[url('/ept-logo.jpg')] bg-cover opacity-10 bg-center" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                        <div className="relative">
                                            <img
                                                src={`/avatars/avatar_${targetName.toLowerCase().replace(' ', '_')}.png`}
                                                alt=""
                                                className="w-32 h-32 sm:w-40 sm:h-40 object-contain grayscale opacity-50"
                                                onError={(e) => e.currentTarget.src = '/avatars/avatar_hoodie.png'}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-3xl sm:text-5xl font-black text-ept-red uppercase -rotate-12 border-4 border-ept-red px-3 py-1">LOCKED</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-center">
                                            <div className="text-xl sm:text-2xl font-black text-white uppercase">{targetName}</div>
                                            <div className="text-[10px] text-ept-red font-bold uppercase mt-1">Property of: {attackerName}</div>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-red-600/10 pointer-events-none" />
                                </div>

                                <p className="text-zinc-400 text-xs sm:text-sm mb-8 text-center leading-relaxed">
                                    Strike hard while their stats are down. Share this victory to the League group chat and let the trash talk begin.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center justify-center gap-2 bg-[#0084FF] hover:bg-[#0073e6] text-white py-3 font-bold uppercase text-[10px] sm:text-xs transition-all shadow-[0_4px_15px_rgba(0,132,255,0.3)]"
                                    >
                                        <Share2 className="w-4 h-4" /> Share to Messenger
                                    </button>
                                    <button
                                        onClick={copyLink}
                                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 font-bold uppercase text-[10px] sm:text-xs transition-all border border-white/10"
                                    >
                                        <LinkIcon className="w-4 h-4" /> Copy Link
                                    </button>
                                </div>


                                <div className="text-center mt-6">
                                    <button
                                        onClick={() => setShowShareModal(false)}
                                        className="text-zinc-500 hover:text-white uppercase text-[9px] sm:text-[10px] font-bold tracking-widest transition-colors"
                                    >
                                        Return to Scouting
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </>
    );
}
