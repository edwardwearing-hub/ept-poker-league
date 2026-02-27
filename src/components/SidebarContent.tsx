'use client';

import Link from 'next/link';
import { Home, Users, BarChart2, Radio, Skull, Trophy, Table, GraduationCap, Gamepad2, Clock, Shield, History, Target, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import RiverReportPlayer from './RiverReportPlayer';
import SidebarCountdown from './SidebarCountdown';
import NextGameRSVP from './NextGameRSVP';
import { usePlayerStatus } from '@/hooks/usePlayerStatus';

const navItems = [
    { name: 'League Home', href: '/', icon: Home },
    { name: 'Leaderboard', href: '/#leaderboard', icon: Trophy },
    { name: 'Session Archive', href: '/history', icon: History },
    { name: 'The Academy', href: '/academy', icon: GraduationCap },
    { name: 'Poker Engine', href: '/game', icon: Gamepad2 },
    { name: 'Blinds Timer', href: '/timer', icon: Clock },
    { name: 'Scouting Reports', href: '/scouting', icon: Users },
    { name: 'Wanted Posters', href: '/wanted', icon: Skull },
    { name: 'Bounty Board', href: '/bounties', icon: Target },
    { name: 'League Sheet', href: '/table', icon: Table },
    { name: 'Stat Corner', href: '/stats', icon: BarChart2 },
    { name: 'Admin Update', href: '/admin-update', icon: Shield },
];

interface Props {
    stats: { totalPot: number; totalSidePot?: number; nextGameDate: string };
    onLinkClick?: () => void;
}

export default function SidebarContent({ stats, onLinkClick }: Props) {
    const { status } = usePlayerStatus();

    return (
        <div className="flex flex-col h-full w-full">
            {/* Brand Header */}
            <div className="p-6 border-b border-white/5 flex flex-col items-center shrink-0">
                <div className="w-full aspect-video relative rounded-lg overflow-hidden border border-white/10 shadow-2xl mb-2">
                    {/* Note: In a real app we might use Next/Image but img is fine for now */}
                    <img src="/ept-logo.jpg" alt="EPT Logo" className="w-full h-full object-cover" />
                </div>

                {/* Module 2: Hack Token Indicator */}
                {status?.hackTokens > 0 && (
                    <div className="flex items-center gap-2 mt-4 px-3 py-1.5 bg-ept-red/10 border border-ept-red/30 rounded-lg animate-pulse-slow">
                        <Zap className="w-4 h-4 text-ept-red fill-current" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                            {status.hackTokens} Hack {status.hackTokens === 1 ? 'Token' : 'Tokens'} Ready
                        </span>
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 py-6">
                {/* Navigation */}
                <nav className="px-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onLinkClick}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                "hover:bg-white/5 hover:text-gold text-zinc-400"
                            )}
                        >
                            <item.icon className="w-5 h-5 group-hover:text-gold transition-colors" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                {/* Next Game Countdown and Stats */}
                <div className="px-4 pt-4 space-y-4">
                    <SidebarCountdown targetDateStr={stats.nextGameDate} />

                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-center">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                            Main Pot
                        </div>
                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#ffe578]">
                            £{stats.totalPot}
                        </div>
                        {stats.totalSidePot !== undefined && stats.totalSidePot > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                                    Total Side Pot
                                </div>
                                <div className="text-lg font-black text-gray-300">
                                    £{stats.totalSidePot}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RSVP Widget */}
                <NextGameRSVP />
            </div>

            {/* The River Report Player (Fixed at bottom) */}
            <div className="p-4 border-t border-white/5 bg-black/20 z-10 bg-charcoal/90 backdrop-blur shrink-0">
                <div className="flex items-center gap-2 mb-3 text-gold">
                    <Radio className="w-4 h-4 animate-pulse-slow" />
                    <span className="text-xs font-bold uppercase tracking-wider">The River Report</span>
                </div>
                <RiverReportPlayer />
            </div>
        </div>
    );
}
