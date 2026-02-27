'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Skull, Target, Zap, Shield, ChevronRight, X } from 'lucide-react';

interface Props {
    onClose: () => void;
}

export default function PvPRulesModal({ onClose }: Props) {
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

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900 border-4 border-zinc-800 max-w-2xl w-full relative overflow-hidden"
            >
                {/* 8-bit Header */}
                <div className="bg-black p-6 border-b-4 border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skull className="w-6 h-6 text-ept-red" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Welcome to the PvP Arena</h2>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <p className="text-zinc-400 font-medium leading-relaxed">
                        The E.P.T. Poker League is no longer just a tracker. It's a battlefield. Read the rules of the new PvP ecosystem below to stay ahead.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {rules.map((rule, idx) => (
                            <div key={idx} className="bg-black/30 border border-white/5 p-4 relative group">
                                <div className={`mb-4 w-10 h-10 flex items-center justify-center bg-zinc-800/50 rounded-lg group-hover:scale-110 transition-transform ${rule.color}`}>
                                    <rule.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-black text-white uppercase mb-2">{rule.title}</h3>
                                <p className="text-[11px] text-zinc-500 leading-tight">{rule.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-ept-red/10 border border-ept-red/30 p-4 flex gap-4 items-center">
                        <div className="w-12 h-12 flex-shrink-0 bg-ept-red rounded flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-ept-red uppercase tracking-widest">Secret Hack</div>
                            <div className="text-white text-xs font-bold italic">"Sharing your hijacks to the group chat increases your social dominance by 200%."</div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            localStorage.setItem('ept_pvp_onboarded', 'true');
                            onClose();
                        }}
                        className="w-full bg-white text-black hover:bg-gold hover:text-white py-4 font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                    >
                        I'm Ready to Fight <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Scanline Deco */}
                <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-10" />
            </motion.div>
        </div>
    );
}
