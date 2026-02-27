'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Skull, Target, Zap, Shield, ChevronRight, X, Swords } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
    onClose: () => void;
}

export default function PvPRulesModal({ onClose }: Props) {
    const router = useRouter();
    const rules = [
        {
            icon: Target,
            title: "Earn Hack Tokens",
            desc: "Complete your Redemption Gauntlet to earn +1 Hack Token. Use them to strike back!",
            color: "text-blue-400"
        },
        {
            icon: Zap,
            title: "Launch Hijacks",
            desc: "Visit any player's profile. If you have tokens, you can hijack their stats in real-time.",
            color: "text-ept-red"
        },
        {
            icon: Shield,
            title: "Defend Your Honor",
            desc: "Hijacked? Your profile will be locked with an alarm until you win a battle to reclaim it.",
            color: "text-gold"
        }
    ];

    const handleBattleground = () => {
        localStorage.setItem('ept_pvp_onboarded', 'true');
        onClose();
        router.push('/wanted');
    };

    const handleAcknowledge = () => {
        localStorage.setItem('ept_pvp_onboarded', 'true');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900 border-4 border-zinc-800 max-w-2xl w-full relative overflow-hidden shadow-[0_0_100px_rgba(220,38,38,0.3)]"
            >
                {/* Title Graphic */}
                <div className="relative aspect-video w-full bg-black border-b-4 border-zinc-800 overflow-hidden">
                    <img
                        src="/images/hijack-hustle-title.png"
                        alt="The Hijack Hustle"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60" />
                </div>

                <div className="p-8 space-y-8">
                    <p className="text-zinc-400 font-medium leading-relaxed text-sm">
                        The E.P.T. Poker League is no longer just a tracker. It's a battlefield. Read the rules of the new PvP ecosystem below to stay ahead.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {rules.map((rule, idx) => (
                            <div key={idx} className="bg-black/30 border border-white/5 p-4 relative group">
                                <div className={`mb-4 w-10 h-10 flex items-center justify-center bg-zinc-800/50 rounded-lg group-hover:scale-110 transition-transform ${rule.color}`}>
                                    <rule.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-xs font-black text-white uppercase mb-2 tracking-tighter">{rule.title}</h3>
                                <p className="text-[11px] text-zinc-500 leading-tight">{rule.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleBattleground}
                            className="flex-1 bg-ept-red text-white hover:bg-white hover:text-ept-red py-4 font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group border-2 border-transparent hover:border-ept-red"
                        >
                            <Swords className="w-5 h-5 animate-bounce" />
                            Take me to the Battle ground
                        </button>

                        <button
                            onClick={handleAcknowledge}
                            className="flex-1 bg-white text-black hover:bg-zinc-200 py-4 font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            I'm Ready to Fight <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scanline Deco */}
                <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-10" />
            </motion.div>
        </div>
    );
}
