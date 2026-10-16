'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Tv, Shield, Radio, Sparkles, ChevronRight } from 'lucide-react';

export default function HostOperationsBanner() {
    return (
        <div className="w-full rounded-2xl sm:rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-white/10 p-4 sm:p-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 p-0.5 shrink-0 shadow-lg flex items-center justify-center">
                        <div className="w-full h-full bg-black/80 rounded-[14px] flex items-center justify-center">
                            <Radio className="w-5 h-5 text-gold animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gold font-mono">
                                Live Game Night Operations
                            </span>
                        </div>
                        <h3 className="text-base sm:text-xl font-black uppercase text-white tracking-tight mt-0.5">
                            Table Clocks &amp; TV Presentation Suite
                        </h3>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                    {/* Blinds Clock */}
                    <Link
                        href="/timer"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-gold/40 text-xs font-black uppercase tracking-wider text-white transition active:scale-95 shadow min-h-[44px]"
                    >
                        <Clock size={15} className="text-gold" />
                        <span>Blinds Clock</span>
                    </Link>

                    {/* TV Final Table Broadcast */}
                    <Link
                        href="/presentation"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold via-yellow-400 to-amber-500 text-black hover:brightness-110 text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.3)] min-h-[44px]"
                    >
                        <Tv size={15} className="fill-black" />
                        <span>TV Presentation</span>
                    </Link>

                    {/* Admin Scorekeeper */}
                    <Link
                        href="/admin-update"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 transition text-xs font-mono font-bold uppercase min-h-[44px]"
                        title="Authorized Scorekeeper Admin Console"
                    >
                        <Shield size={13} className="text-zinc-500" />
                        <span className="hidden sm:inline">Scorekeeper</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
