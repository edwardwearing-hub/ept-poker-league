'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Download, ExternalLink, ChevronDown, Share2, Check } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { playCardSlide } from '@/lib/felt-audio';

interface Props {
    initialTargetDate?: string;
}

function calculateDiff(target: Date | null) {
    if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const distance = target.getTime() - Date.now();
    if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
    };
}

export default function NextGameCountdown({ initialTargetDate }: Props) {
    const [targetDate, setTargetDate] = useState<Date | null>(() => {
        return initialTargetDate ? new Date(initialTargetDate) : null;
    });

    const [timeLeft, setTimeLeft] = useState(() => {
        return calculateDiff(initialTargetDate ? new Date(initialTargetDate) : null);
    });

    const [futureDates, setFutureDates] = useState<{ raw: string; iso: string }[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [copiedInvite, setCopiedInvite] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const handleShareInvite = async () => {
        triggerHaptic(15);
        playCardSlide();
        const dateStr = formattedKickoff || 'Friday Night';
        const text = `♠️ E.P.T. Poker League Game Night is locked in!\n📅 ${dateStr}\n📍 Wearing Poker Room / Club Lounge\n⏱️ Live Table Timer: https://eptpoker.co.uk/timer\n🏆 Standings & RSVP: https://eptpoker.co.uk`;

        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: 'E.P.T. Game Night Invite',
                    text: text,
                    url: 'https://eptpoker.co.uk',
                });
                return;
            } catch {
                // User cancelled or unsupported, fallback to clipboard
            }
        }

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(text);
                setCopiedInvite(true);
                setTimeout(() => setCopiedInvite(false), 2200);
            } catch {}
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setCalendarOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const downloadIcs = () => {
        if (!targetDate) return;
        const startStr = targetDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = new Date(targetDate.getTime() + 4 * 60 * 60 * 1000);
        const endStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//EPT Poker League//Tournament Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:ept-game-${targetDate.getTime()}@eptpokerleague.com`,
            `DTSTAMP:${nowStr}`,
            `DTSTART:${startStr}`,
            `DTEND:${endStr}`,
            'SUMMARY:E.P.T. Poker League - Game Night',
            'DESCRIPTION:E.P.T. 2026 Poker League Live Game Night\\nBlind Structure: 15/20 min levels (5/10 start)\\nBuy-In: £10 + Optional Rebuys\\nOfficial League: https://ept-poker-league.vercel.app',
            'LOCATION:Wearing Poker Room / Club Lounge',
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'ept-poker-game-night.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setCalendarOpen(false);
    };

    const getGoogleCalendarUrl = () => {
        if (!targetDate) return '#';
        const startStr = targetDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = new Date(targetDate.getTime() + 4 * 60 * 60 * 1000);
        const endStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const title = encodeURIComponent('E.P.T. Poker League - Game Night');
        const details = encodeURIComponent('E.P.T. 2026 Poker League Live Game Night\nBlind Structure: 15/20 min levels (5/10 start)\nBuy-In: £10 + Optional Rebuys\nOfficial Platform: https://ept-poker-league.vercel.app');
        const location = encodeURIComponent('Wearing Poker Room / Club Lounge');
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        fetch('/api/admin/countdown')
            .then(res => res.json())
            .then(data => {
                if (data.targetDate) {
                    const parsed = new Date(data.targetDate);
                    setTargetDate(parsed);
                    setTimeLeft(calculateDiff(parsed));
                }
                if (data.allScheduledDates) {
                    setFutureDates(data.allScheduledDates);
                }
            })
            .catch(console.error);
    }, [isMounted]);

    useEffect(() => {
        if (!targetDate) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const formattedKickoff = targetDate ? targetDate.toLocaleString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : '';

    return (
        <section className="relative w-full overflow-hidden rounded-3xl border border-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.1)] py-12 md:py-20 px-4 bg-[#111]">
            {/* Background styling */}
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ept-red-dark/10 via-charcoal-dark to-[#0a0a0a]" />

            {/* Decorative Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent" />

            {/* Content */}
            <div className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center">
                <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-gold/50 bg-gold/5 backdrop-blur-sm mb-6 md:mb-10 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                    <span className="w-3 h-3 rounded-full bg-ept-red animate-pulse shadow-[0_0_10px_rgba(255,7,58,0.8)]" />
                    <span className="text-gold font-bold uppercase tracking-[0.2em] text-sm md:text-base">Next Game Countdown</span>
                </div>

                <h1 className="text-3xl md:text-7xl font-black mb-10 md:mb-16 uppercase tracking-widest drop-shadow-[0_0_20px_rgba(212,175,55,0.4)] bg-gradient-to-r from-[#cfb53b] via-white to-[#cfb53b] bg-clip-text text-transparent px-4" style={{ fontFamily: 'serif' }}>
                    The E.P.T. Ledger of Legends
                </h1>

                {/* The Clock Grid - Fluid 4 columns on all mobile screens */}
                <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-8 lg:gap-10 w-full max-w-4xl mx-auto mb-8 sm:mb-12">
                    {/* Days */}
                    <div className="flex flex-col items-center">
                        <div className="w-full h-20 sm:h-28 md:h-40 lg:h-44 bg-gradient-to-b from-gray-900 to-black rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center border-t-2 border-l-2 border-gray-700/50 border-r border-b border-black shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-1/2 pointer-events-none" />
                            <span className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl font-black text-[#ffd700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] font-mono tabular-nums tracking-tighter">
                                {timeLeft.days.toString().padStart(2, '0')}
                            </span>
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/50" />
                        </div>
                        <span className="mt-2 sm:mt-3 text-gray-500 font-bold uppercase tracking-[0.15em] sm:tracking-[0.3em] text-[9px] sm:text-xs md:text-sm">Days</span>
                    </div>

                    {/* Hours */}
                    <div className="flex flex-col items-center">
                        <div className="w-full h-20 sm:h-28 md:h-40 lg:h-44 bg-gradient-to-b from-gray-900 to-black rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center border-t-2 border-l-2 border-gray-700/50 border-r border-b border-black shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-1/2 pointer-events-none" />
                            <span className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl font-black text-white drop-shadow-lg font-mono tabular-nums tracking-tighter">
                                {timeLeft.hours.toString().padStart(2, '0')}
                            </span>
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/50" />
                        </div>
                        <span className="mt-2 sm:mt-3 text-gray-500 font-bold uppercase tracking-[0.15em] sm:tracking-[0.3em] text-[9px] sm:text-xs md:text-sm">Hours</span>
                    </div>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                        <div className="w-full h-20 sm:h-28 md:h-40 lg:h-44 bg-gradient-to-b from-gray-900 to-black rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center border-t-2 border-l-2 border-gray-700/50 border-r border-b border-black shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-1/2 pointer-events-none" />
                            <span className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl font-black text-white drop-shadow-lg font-mono tabular-nums tracking-tighter">
                                {timeLeft.minutes.toString().padStart(2, '0')}
                            </span>
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/50" />
                        </div>
                        <span className="mt-2 sm:mt-3 text-gray-500 font-bold uppercase tracking-[0.15em] sm:tracking-[0.3em] text-[9px] sm:text-xs md:text-sm">Mins</span>
                    </div>

                    {/* Seconds */}
                    <div className="flex flex-col items-center">
                        <div className="w-full h-20 sm:h-28 md:h-40 lg:h-44 bg-gradient-to-b from-gray-900 to-black rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center border-t-2 border-l-2 border-gray-700/50 border-r border-b border-black shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent h-1/2 pointer-events-none" />
                            <span className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl font-black text-ept-red drop-shadow-[0_0_15px_rgba(230,57,70,0.6)] font-mono tabular-nums tracking-tighter">
                                {timeLeft.seconds.toString().padStart(2, '0')}
                            </span>
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/50" />
                        </div>
                        <span className="mt-2 sm:mt-3 text-gray-500 font-bold uppercase tracking-[0.15em] sm:tracking-[0.3em] text-[9px] sm:text-xs md:text-sm text-ept-red">Secs</span>
                    </div>
                </div>

                {/* Date and Time & Calendar Sync underneath the timer */}
                <div className="mb-10 border-t border-white/5 pt-8 w-full max-w-2xl mx-auto flex flex-col items-center">
                    <div className="text-gold text-xs md:text-sm tracking-[0.4em] mb-2 font-black">Official Kickoff</div>
                    <div className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter mb-4">
                        {formattedKickoff}
                    </div>

                    {/* Action Buttons: WhatsApp / Group Chat Invite & Calendar Sync */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={handleShareInvite}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 border ${copiedInvite ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-green-600/15 hover:bg-green-600/25 text-green-400 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]'}`}
                            title="Share game night details to WhatsApp or Group Chat"
                        >
                            {copiedInvite ? <Check size={15} className="text-emerald-400 animate-in zoom-in" /> : <Share2 size={15} />}
                            <span>{copiedInvite ? 'Invite Copied! ✓' : 'Share Match Invite'}</span>
                        </button>

                        {/* Add to Calendar Dropdown (Feature 5) */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setCalendarOpen(!calendarOpen)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold/10 hover:bg-gold/20 text-gold border border-gold/40 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                            >
                                <Calendar size={15} />
                                <span>Add to Calendar</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${calendarOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {calendarOpen && (
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-zinc-950/95 border border-gold/40 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl p-2 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                                    <a
                                        href={getGoogleCalendarUrl()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setCalendarOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-bold transition group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                            <ExternalLink size={13} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white group-hover:text-gold transition-colors">Google Calendar</div>
                                            <div className="text-[10px] text-zinc-400 font-normal">Opens browser calendar</div>
                                        </div>
                                    </a>

                                    <button
                                        type="button"
                                        onClick={downloadIcs}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-bold transition group text-left"
                                    >
                                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            <Download size={13} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white group-hover:text-gold transition-colors">Apple / Outlook / iCal</div>
                                            <div className="text-[10px] text-zinc-400 font-normal">Downloads .ics file</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Future Games Slider */}
                {futureDates && futureDates.length > 1 && (
                    <div className="w-full max-w-4xl border-t border-white/5 pt-8">
                        <div className="text-[10px] md:text-xs text-zinc-500 font-black uppercase tracking-[0.3em] mb-4 flex items-center justify-between px-4">
                            <span>League Schedule</span>
                            <span className="text-ept-red/60 animate-pulse">Swipe for future dates →</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x px-4">
                            {futureDates.slice(1).map((game, i) => (
                                <div 
                                    key={i} 
                                    className="shrink-0 w-40 md:w-56 snap-start p-4 md:p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-gold/30 hover:bg-gold/5 transition-all group/date"
                                >
                                    <div className="text-[10px] md:text-xs text-zinc-500 font-bold mb-2 uppercase tracking-widest group-hover/date:text-gold transition-colors">
                                        {new Date(game.iso).toLocaleDateString('en-GB', { weekday: 'long' })}
                                    </div>
                                    <div className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
                                        {new Date(game.iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
