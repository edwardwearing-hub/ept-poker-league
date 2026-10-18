'use client';

import React from 'react';
import Link from 'next/link';
import { 
    Table, 
    Crown, 
    BarChart2, 
    History, 
    Users, 
    Target, 
    Newspaper, 
    GraduationCap, 
    Dices, 
    Flame, 
    Clock, 
    Tv, 
    Shield, 
    Lock,
    Key
} from 'lucide-react';
import { SfxToggle, BadBeatReportButton, KonamiHighRoller, KonamiArcadePadButton } from './EasterEggs';

export default function SiteFooter() {
    return (
        <footer className="w-full mt-16 pt-12 pb-24 md:pb-12 border-t border-white/10 bg-black/60 text-zinc-400 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-10 border-b border-white/10">
                    {/* Brand Info */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-3">
                        <div className="flex items-center gap-2.5">
                            <img 
                                src="/ept-logo.jpg" 
                                alt="E.P.T. Poker League" 
                                className="w-8 h-8 rounded-lg border border-white/20 object-cover" 
                            />
                            <div>
                                <span className="text-sm font-black text-white tracking-wider uppercase block">
                                    E.P.T. 2026
                                </span>
                                <span className="text-[9px] font-mono font-bold text-gold tracking-widest uppercase block">
                                    Official Poker League
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Official championship ledger, live telemetry tracking, and GTO training academy for the E.P.T. season.
                        </p>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('ept_open_login'))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 border border-gold/40 text-gold text-xs font-black uppercase tracking-wider transition min-h-[36px]"
                        >
                            <Key size={13} />
                            <span>Player PIN Locker</span>
                        </button>
                    </div>

                    {/* Column 1: The League */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gold font-mono">
                            The League
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <Link href="/table" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <Table size={13} className="text-zinc-500" />
                                    <span>Official Standings</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/final" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <Crown size={13} className="text-gold" />
                                    <span>Road to the Crown</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/stats" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <BarChart2 size={13} className="text-zinc-500" />
                                    <span>Season Analytics</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/history" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <History size={13} className="text-zinc-500" />
                                    <span>Session Archive</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 2: Intel & Media */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gold font-mono">
                            Player Intel
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <Link href="/scouting" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <Users size={13} className="text-zinc-500" />
                                    <span>Scouting Reports</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/bounties" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <Target size={13} className="text-ept-red" />
                                    <span>Bounties &amp; Hit List</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/gazette" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <Newspaper size={13} className="text-zinc-500" />
                                    <span>The Gazette AI</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Play & Casino */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gold font-mono">
                            Play &amp; Training
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <Link href="/academy" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <GraduationCap size={13} className="text-cyan-400" />
                                    <span>EPT Poker Academy</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/vegas" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <Dices size={13} className="text-yellow-400" />
                                    <span>Las Vegas Casino</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/vegas?tab=arcade" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <span className="text-zinc-500 text-xs">🕹️</span>
                                    <span>Arcade Lounge</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/syndicate" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <Flame size={13} className="text-gold" />
                                    <span>Casino Syndicate RPG</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Host Operations (Discreet) */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 font-mono">
                            Host Operations
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <Link href="/timer" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <Clock size={13} className="text-zinc-500" />
                                    <span>Blinds Clock</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/presentation" className="hover:text-white transition flex items-center gap-1.5 py-1">
                                    <Tv size={13} className="text-gold" />
                                    <span>TV Broadcast View</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin-update" className="hover:text-gold transition flex items-center gap-1.5 py-1">
                                    <Shield size={13} className="text-zinc-600" />
                                    <span className="text-zinc-500 hover:text-gold">Admin Console</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Controls & Easter Eggs */}
                <div className="pt-6 pb-2 flex flex-wrap items-center justify-between gap-3 border-b border-white/5">
                    <div className="flex flex-wrap items-center gap-2">
                        <SfxToggle />
                        <BadBeatReportButton />
                        <KonamiArcadePadButton />
                    </div>
                    <div className="text-[11px] text-zinc-600 font-mono hidden md:block">
                        Tip: A classic 1986 10-key arcade cheat unlocks High Roller Mode
                    </div>
                </div>

                {/* Footer Bottom Bar */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
                    <p>© 2026 E.P.T. Poker League. All rights reserved.</p>
                    <div className="flex items-center gap-4 text-[11px] font-mono">
                        <span className="flex items-center gap-1 text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                            Firebase Sync Active
                        </span>
                        <span>•</span>
                        <Link href="/admin-update" className="hover:text-zinc-300 transition">
                            Host Portal
                        </Link>
                    </div>
                </div>
                <KonamiHighRoller />
            </div>
        </footer>
    );
}
