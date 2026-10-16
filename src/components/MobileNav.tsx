'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Menu, 
    X, 
    Zap, 
    Key, 
    Home, 
    Crown, 
    GraduationCap, 
    Dices, 
    Clock, 
    Flame,
    Trophy
} from 'lucide-react';
import SidebarContent from './SidebarContent';
import { clsx } from 'clsx';
import { usePlayerStatus } from '@/hooks/usePlayerStatus';

interface Props {
    stats: { totalPot: number; totalSidePot?: number; nextGameDate: string };
}

export default function MobileNav({ stats }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { status } = usePlayerStatus();

    // Lock body scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const bottomTabs = [
        { label: 'Home', href: '/', icon: Home, match: (p: string) => p === '/' },
        { label: 'Standings', href: '/table', icon: Trophy, match: (p: string) => p === '/table' },
        { label: 'Final', href: '/final', icon: Crown, match: (p: string) => p === '/final', badge: 'DEC' },
        { label: 'Academy', href: '/academy', icon: GraduationCap, match: (p: string) => p.startsWith('/academy') },
        { label: 'Casino', href: '/vegas', icon: Dices, match: (p: string) => p.startsWith('/vegas') },
    ];

    return (
        <>
            {/* Top Fixed Mobile Header Bar */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-charcoal/95 backdrop-blur-md border-b border-white/10 pt-safe">
                <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between relative z-[70]">
                    <Link href="/" className="font-bold text-white tracking-wider flex items-center gap-2 active:opacity-80 transition-opacity">
                        <img src="/ept-logo.jpg" alt="E.P.T. 2026 Poker League Logo" className="w-8 h-8 rounded-lg border border-white/20 shadow-md object-cover" />
                        <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-black tracking-wider leading-none">E.P.T. 2026</span>
                            <span className="text-[9px] text-gold font-mono font-bold tracking-widest mt-0.5">POKER LEAGUE</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {!status?.name && (
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('ept_open_login'))}
                                className="flex items-center gap-1.5 px-3 py-2 bg-gold/15 hover:bg-gold/25 active:scale-95 border border-gold/40 rounded-xl text-xs font-black text-gold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer"
                            >
                                <Key className="w-4 h-4" />
                                <span>Login</span>
                            </button>
                        )}
                        {status?.hackTokens > 0 && (
                            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-ept-red/20 border border-ept-red/40 rounded-xl text-xs font-black text-ept-red animate-pulse">
                                <Zap className="w-4 h-4 fill-current" />
                                <span>{status.hackTokens}</span>
                            </div>
                        )}
                        <button
                            onClick={() => setIsOpen(true)}
                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gold bg-white/5 hover:bg-white/15 active:scale-95 rounded-xl border border-gold/30 hover:border-gold/60 transition-all cursor-pointer"
                            aria-label="Open full menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Drawer (Fluid width for small phones, constrained max width) */}
            <div 
                className={clsx(
                    "md:hidden fixed top-0 left-0 bottom-0 w-[85vw] max-w-xs sm:w-80 bg-charcoal border-r border-white/10 z-[90] transform transition-transform duration-300 ease-in-out font-sans shadow-2xl flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation drawer"
            >
                {/* Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-3 right-3 z-[100] min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-white bg-black/50 hover:bg-black/80 border border-white/10 rounded-full transition-all active:scale-95 cursor-pointer"
                    aria-label="Close menu"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="h-full overflow-y-auto touch-momentum pt-2">
                    <SidebarContent stats={stats} onLinkClick={() => setIsOpen(false)} />
                </div>
            </div>

            {/* Mobile Bottom Quick Navigation Bar */}
            <nav 
                aria-label="Mobile Bottom Navigation"
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-xl border-t border-white/10 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
            >
                <div className="grid grid-cols-6 items-center px-1 py-1 sm:px-2">
                    {bottomTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = tab.match(pathname);
                        return (
                            <Link
                                key={tab.label}
                                href={tab.href}
                                className={clsx(
                                    "flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 min-h-[50px] relative group select-none active:scale-95",
                                    isActive
                                        ? "text-gold font-bold"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                <div className={clsx(
                                    "relative p-1 rounded-lg transition-colors",
                                    isActive && "bg-gold/15 text-gold"
                                )}>
                                    <Icon className={clsx("w-4 h-4 sm:w-5 sm:h-5 transition-transform", isActive && "scale-110")} />
                                    {tab.badge && (
                                        <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-gold text-black font-black text-[7px] rounded-full uppercase leading-none shadow">
                                            {tab.badge}
                                        </span>
                                    )}
                                </div>
                                <span className={clsx(
                                    "text-[9px] sm:text-[10px] tracking-tight truncate max-w-full mt-0.5",
                                    isActive ? "font-black text-gold" : "font-medium"
                                )}>
                                    {tab.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Quick Menu Button to open Drawer */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className={clsx(
                            "flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 min-h-[50px] text-zinc-400 hover:text-gold active:scale-95 select-none",
                            isOpen && "text-gold font-bold"
                        )}
                        aria-label="More navigation links"
                    >
                        <div className={clsx("p-1 rounded-lg transition-colors", isOpen && "bg-gold/15 text-gold")}>
                            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-medium tracking-tight truncate max-w-full mt-0.5">
                            More
                        </span>
                    </button>
                </div>
            </nav>
        </>
    );
}
