'use client';

import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import SidebarContent from './SidebarContent';
import { clsx } from 'clsx';
import { usePlayerStatus } from '@/hooks/usePlayerStatus';

interface Props {
    stats: { totalPot: number; totalSidePot?: number; nextGameDate: string };
}

export default function MobileNav({ stats }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const { status } = usePlayerStatus();

    return (
        <div className="md:hidden fixed top-0 left-0 right-0 z-[60]">
            {/* Mobile Header Bar */}
            <div className="bg-charcoal/90 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
                <div className="font-bold text-white tracking-wider flex items-center gap-2">
                    <img src="/ept-logo.jpg" alt="Logo" className="w-8 h-8 rounded border border-white/20" />
                    <span className="text-sm">E.P.T. 2026</span>
                </div>

                <div className="flex items-center gap-3">
                    {status?.hackTokens > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-ept-red/20 border border-ept-red/40 rounded text-[9px] font-black text-ept-red animate-pulse">
                            <Zap className="w-3 h-3 fill-current" />
                            {status.hackTokens}
                        </div>
                    )}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={clsx(
                "fixed top-0 left-0 bottom-0 w-80 bg-charcoal border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out font-sans",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 z-[60] p-1 text-zinc-400 hover:text-white bg-black/20 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="h-full bg-charcoal">
                    <SidebarContent stats={stats} onLinkClick={() => setIsOpen(false)} />
                </div>
            </div>
        </div>
    );
}
