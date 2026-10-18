'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Users,
    BarChart2,
    Radio,
    Table,
    GraduationCap,
    Clock,
    Shield,
    History,
    Target,
    Zap,
    Key,
    LogOut,
    Newspaper,
    Flame,
    Crown,
    Tv,
    Dices,
    ChevronDown,
    ChevronRight,
    Gamepad2,
    Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import RiverReportPlayer from './RiverReportPlayer';
import SidebarCountdown from './SidebarCountdown';
import NextGameRSVP from './NextGameRSVP';
import { usePlayerStatus } from '@/hooks/usePlayerStatus';
import SetPINModal from './auth/SetPINModal';
import { useKonamiHighRoller } from './EasterEggs';

interface Props {
    stats: { totalPot: number; totalSidePot?: number; nextGameDate: string };
    onLinkClick?: () => void;
    playerName?: string;
}

export default function SidebarContent({ stats, onLinkClick, playerName: initialPlayerName }: Props) {
    const pathname = usePathname();
    const { status } = usePlayerStatus();
    const { isHighRoller } = useKonamiHighRoller();
    const [showSetPin, setShowSetPin] = useState(false);
    const [playerName, setPlayerName] = useState<string | undefined>(initialPlayerName);

    // Accordion expand states (auto-expand if current route matches)
    const isLeagueRoute = ['/table', '/final', '/stats', '/history'].some(r => pathname === r);
    const isIntelRoute = ['/scouting', '/bounties', '/gazette'].some(r => pathname.startsWith(r));
    const isCasinoRoute = ['/vegas', '/syndicate'].some(r => pathname.startsWith(r));

    const [leagueOpen, setLeagueOpen] = useState(true);
    const [intelOpen, setIntelOpen] = useState(true);
    const [casinoOpen, setCasinoOpen] = useState(true);
    const [hostOpen, setHostOpen] = useState(false);

    useEffect(() => {
        if (isLeagueRoute) setLeagueOpen(true);
        if (isIntelRoute) setIntelOpen(true);
        if (isCasinoRoute) setCasinoOpen(true);
    }, [pathname, isLeagueRoute, isIntelRoute, isCasinoRoute]);

    useEffect(() => {
        const updatePlayer = () => {
            const savedPlayer = localStorage.getItem('ept_active_player_v2');
            setPlayerName(savedPlayer || undefined);
        };
        updatePlayer();
        window.addEventListener('storage', updatePlayer);
        return () => window.removeEventListener('storage', updatePlayer);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('ept_active_player_v2');
        localStorage.removeItem('ept_pvp_onboarded_v2');
        setPlayerName(undefined);
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <div className="flex flex-col h-full w-full bg-charcoal font-sans select-none">
            {/* Brand Header */}
            <div className={`p-4 sm:p-5 border-b flex flex-col items-center shrink-0 ${isHighRoller ? 'border-[#ffd700]/50 bg-gradient-to-b from-[#291d02]/60 to-transparent' : 'border-white/5'}`}>
                <Link
                    href="/"
                    onClick={onLinkClick}
                    className={`w-full aspect-video relative rounded-xl overflow-hidden border mb-2 block transition ${
                        isHighRoller
                            ? 'border-2 border-[#ffd700] shadow-[0_0_25px_rgba(255,215,0,0.55)]'
                            : 'border-white/10 shadow-2xl hover:border-gold/50'
                    }`}
                >
                    <img src="/ept-logo.jpg" alt="E.P.T. Poker League 2026 - Official Logo" className="w-full h-full object-cover" />
                </Link>

                {isHighRoller && (
                    <div className="w-full mb-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ffd700] via-[#ffe578] to-[#b8860b] text-black text-[10px] font-mono font-black uppercase tracking-widest text-center shadow-[0_0_15px_rgba(255,215,0,0.45)]">
                        👑 24K VIP HIGH ROLLER
                    </div>
                )}

                {/* Active Player Status */}
                <div className="w-full flex items-center justify-between px-3 py-2 bg-black/40 border border-white/10 rounded-xl mt-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${playerName && playerName !== 'Guest Trainee' ? 'bg-[#00FF41] shadow-[0_0_8px_rgba(0,255,65,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'}`} />
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            {playerName && playerName !== 'Guest Trainee' ? 'Player' : 'Status'}
                        </span>
                    </div>
                    <span className={`text-xs font-black uppercase tracking-tight truncate max-w-[130px] ${playerName && playerName !== 'Guest Trainee' ? 'text-white' : 'text-amber-400'}`}>
                        {playerName && playerName !== 'Guest Trainee' ? playerName : 'Guest Mode'}
                    </span>
                </div>

                {/* Action button: Player Login or Logout */}
                {!playerName || playerName === 'Guest Trainee' ? (
                    <div className="w-full mt-2 space-y-1">
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('ept_open_login'))}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 hover:from-gold/30 hover:to-gold/30 border border-gold/40 hover:border-gold rounded-xl text-gold transition-all group shadow-[0_0_15px_rgba(212,175,55,0.15)] active:scale-98 min-h-[44px] cursor-pointer"
                        >
                            <Key className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-wider">Player Login / Join</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 bg-transparent hover:bg-ept-red/10 border border-white/5 hover:border-ept-red/40 rounded-xl text-zinc-500 hover:text-ept-red transition-all group active:scale-98 min-h-[40px] cursor-pointer"
                    >
                        <LogOut className="w-3.5 h-3.5 group-hover:text-ept-red transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sign Out ({playerName.split(' ')[0]})</span>
                    </button>
                )}

                {/* Module 2: Hack Token Indicator */}
                {status?.hackTokens > 0 && (
                    <div className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-ept-red/10 border border-ept-red/30 rounded-xl animate-pulse-slow w-full justify-center">
                        <Zap className="w-4 h-4 text-ept-red fill-current" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                            {status.hackTokens} Hack {status.hackTokens === 1 ? 'Token' : 'Tokens'} Ready
                        </span>
                    </div>
                )}
            </div>

            {/* Scrollable Navigation Area (5 Core Pillars) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar touch-momentum py-3">
                <nav className="px-3 space-y-2">

                    {/* PILLAR 1: HOME */}
                    <Link
                        href="/"
                        onClick={onLinkClick}
                        className={clsx(
                            "flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group active:scale-98 min-h-[44px]",
                            pathname === '/'
                                ? "bg-gradient-to-r from-gold/20 via-gold/10 to-transparent border border-gold/40 text-gold font-bold shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                                : "text-zinc-300 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Home className={clsx("w-4 h-4 transition-colors", pathname === '/' ? "text-gold" : "text-zinc-400 group-hover:text-white")} />
                            <span className="font-bold text-sm tracking-tight">League Home</span>
                        </div>
                    </Link>

                    {/* PILLAR 2: THE LEAGUE (Grouped Accordion) */}
                    <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setLeagueOpen(!leagueOpen)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 transition min-h-[44px] cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <Table className="w-4 h-4 text-gold" />
                                <span className="font-black text-xs uppercase tracking-wider">The League</span>
                            </div>
                            {leagueOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                        </button>

                        {leagueOpen && (
                            <div className="px-2 pb-2 space-y-0.5 border-t border-white/5 pt-1">
                                {[
                                    { name: 'Standings & Sheet', href: '/table', icon: Table },
                                    { name: 'Road to the Crown', href: '/final', icon: Crown, badge: 'FINAL' },
                                    { name: 'Season Analytics', href: '/stats', icon: BarChart2 },
                                    { name: 'Session Archive', href: '/history', icon: History },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onLinkClick}
                                            className={clsx(
                                                "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all min-h-[40px]",
                                                isActive
                                                    ? "bg-gold/15 text-gold font-bold border border-gold/30"
                                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon size={14} className={isActive ? "text-gold" : "text-zinc-500"} />
                                                <span>{item.name}</span>
                                            </div>
                                            {item.badge && (
                                                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black uppercase bg-gold/20 text-gold border border-gold/40">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* PILLAR 3: PLAYER INTEL (Grouped Accordion) */}
                    <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setIntelOpen(!intelOpen)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 transition min-h-[44px] cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <Users className="w-4 h-4 text-cyan-400" />
                                <span className="font-black text-xs uppercase tracking-wider">Player Intel</span>
                            </div>
                            {intelOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                        </button>

                        {intelOpen && (
                            <div className="px-2 pb-2 space-y-0.5 border-t border-white/5 pt-1">
                                {[
                                    { name: 'Scouting Reports', href: '/scouting', icon: Users },
                                    { name: 'Bounties & Hit List', href: '/bounties', icon: Target },
                                    { name: 'The Gazette AI', href: '/gazette', icon: Newspaper },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onLinkClick}
                                            className={clsx(
                                                "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all min-h-[40px]",
                                                isActive
                                                    ? "bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30"
                                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon size={14} className={isActive ? "text-cyan-400" : "text-zinc-500"} />
                                                <span>{item.name}</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* PILLAR 4: POKER ACADEMY */}
                    <Link
                        href="/academy"
                        onClick={onLinkClick}
                        className={clsx(
                            "flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group active:scale-98 min-h-[44px]",
                            pathname.startsWith('/academy')
                                ? "bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent border border-cyan-500/40 text-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                                : "text-zinc-300 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <GraduationCap className={clsx("w-4 h-4 transition-colors", pathname.startsWith('/academy') ? "text-cyan-400" : "text-zinc-400 group-hover:text-cyan-300")} />
                            <span className="font-bold text-sm tracking-tight">The Academy</span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            GTO
                        </span>
                    </Link>

                    {/* PILLAR 5: THE CASINO (Grouped: Vegas & Syndicate) */}
                    <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setCasinoOpen(!casinoOpen)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 transition min-h-[44px] cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <Dices className="w-4 h-4 text-amber-400" />
                                <span className="font-black text-xs uppercase tracking-wider">The Casino</span>
                            </div>
                            {casinoOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                        </button>

                        {casinoOpen && (
                            <div className="px-2 pb-2 space-y-0.5 border-t border-white/5 pt-1">
                                <Link
                                    href="/vegas"
                                    onClick={onLinkClick}
                                    className={clsx(
                                        "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all min-h-[40px]",
                                        pathname === '/vegas'
                                            ? "bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Dices size={14} className={pathname === '/vegas' ? "text-amber-400" : "text-zinc-500"} />
                                        <span>Vegas Casino Floor</span>
                                    </div>
                                    <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                        VEGAS
                                    </span>
                                </Link>

                                <Link
                                    href="/syndicate"
                                    onClick={onLinkClick}
                                    className={clsx(
                                        "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all min-h-[40px]",
                                        pathname === '/syndicate'
                                            ? "bg-gold/15 text-gold font-bold border border-gold/30"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Flame size={14} className={pathname === '/syndicate' ? "text-gold" : "text-zinc-500"} />
                                        <span>Casino Syndicate</span>
                                    </div>
                                    <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black uppercase bg-gold/20 text-gold border border-gold/40">
                                        RPG
                                    </span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* DISCREET HOST SUITE TRIGGER (Game Night Operations) */}
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setHostOpen(!hostOpen)}
                            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition"
                        >
                            <span className="flex items-center gap-1.5">
                                <Clock size={11} className="text-zinc-500" />
                                <span>Host Tools</span>
                            </span>
                            {hostOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                        </button>

                        {hostOpen && (
                            <div className="mt-1 p-2 bg-black/40 border border-white/5 rounded-xl space-y-1 text-xs">
                                <Link
                                    href="/timer"
                                    onClick={onLinkClick}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
                                >
                                    <Clock size={13} className="text-zinc-500" />
                                    <span>Blinds Timer</span>
                                </Link>
                                <Link
                                    href="/presentation"
                                    onClick={onLinkClick}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-gold hover:bg-white/5 transition"
                                >
                                    <Tv size={13} className="text-gold" />
                                    <span>TV Presentation</span>
                                </Link>
                                <Link
                                    href="/admin-update"
                                    onClick={onLinkClick}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition font-mono text-[11px]"
                                >
                                    <Shield size={12} className="text-zinc-600" />
                                    <span>Admin Console</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Account Security (If Logged In) */}
                {playerName && playerName !== 'Guest Trainee' && (
                    <div className="px-4 mt-6 pt-6 border-t border-white/5 space-y-1">
                        <div className="px-2 py-1 text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono">
                            Locker Security
                        </div>
                        <button
                            onClick={() => setShowSetPin(true)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-gold transition-all text-xs font-bold min-h-[40px] cursor-pointer"
                        >
                            <Key size={14} className="text-zinc-500" />
                            <span>Change Locker PIN</span>
                        </button>
                    </div>
                )}

                {/* Next Game Countdown and Main Pot */}
                <div className="px-4 pt-6 pb-4 space-y-3">
                    <SidebarCountdown targetDateStr={stats.nextGameDate} />

                    <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                            Championship Pot
                        </div>
                        <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#ffe578] font-mono">
                            £{stats.totalPot}
                        </div>
                    </div>

                    <NextGameRSVP />
                </div>
            </div>

            {/* The River Report Audio Player */}
            <div className="p-3 border-t border-white/5 bg-charcoal/95 backdrop-blur shrink-0 pb-safe">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gold">
                        <Radio className="w-3.5 h-3.5 animate-pulse-slow" />
                        <span className="text-[11px] font-black uppercase tracking-wider">The River Report</span>
                    </div>
                    <Link
                        href="/admin-update"
                        onClick={onLinkClick}
                        className="text-zinc-600 hover:text-gold transition-colors p-1"
                        title="Admin Console"
                        aria-label="Admin Console"
                    >
                        <Shield className="w-3 h-3" />
                    </Link>
                </div>
                <RiverReportPlayer />
            </div>

            {/* PIN Reset Modal */}
            {showSetPin && playerName && (
                <SetPINModal
                    playerName={playerName}
                    onSuccess={() => setShowSetPin(false)}
                    onCancel={() => setShowSetPin(false)}
                />
            )}
        </div>
    );
}
