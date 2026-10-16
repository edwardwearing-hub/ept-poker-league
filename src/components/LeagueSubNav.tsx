'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Table, Crown, BarChart2, History, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
    label: string;
    shortLabel: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
}

const LEAGUE_TABS: NavItem[] = [
    {
        label: 'Official Standings',
        shortLabel: 'Standings',
        href: '/table',
        icon: Table,
    },
    {
        label: 'Road to the Crown',
        shortLabel: 'Grand Final',
        href: '/final',
        icon: Crown,
        badge: 'FINAL',
    },
    {
        label: 'Season Analytics',
        shortLabel: 'Analytics',
        href: '/stats',
        icon: BarChart2,
    },
    {
        label: 'Session Archive',
        shortLabel: 'Archive',
        href: '/history',
        icon: History,
    },
];

export default function LeagueSubNav() {
    const pathname = usePathname();

    return (
        <div className="w-full bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 mb-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 touch-momentum">
                    {LEAGUE_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname === tab.href;

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={clsx(
                                    "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap shrink-0 min-h-[44px]",
                                    isActive
                                        ? "bg-gradient-to-r from-gold via-yellow-400 to-amber-500 text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-[1.02]"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <Icon size={16} className={isActive ? "text-black fill-current" : "text-zinc-400"} />
                                <span className="hidden md:inline">{tab.label}</span>
                                <span className="md:hidden">{tab.shortLabel}</span>
                                {tab.badge && (
                                    <span className={clsx(
                                        "px-1.5 py-0.2 rounded text-[8px] font-black uppercase font-mono tracking-widest",
                                        isActive ? "bg-black text-gold" : "bg-gold/20 text-gold border border-gold/40"
                                    )}>
                                        {tab.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                <Link
                    href="/"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-zinc-500 hover:text-gold transition text-xs font-bold uppercase tracking-wider shrink-0 min-h-[44px]"
                    title="Return to Home Dashboard"
                >
                    <ArrowLeft size={14} />
                    <span>Dashboard</span>
                </Link>
            </div>
        </div>
    );
}
