'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, Calendar, ChevronDown, ChevronUp, Newspaper } from 'lucide-react';
import Link from 'next/link';
import AIAnnouncer from '@/components/AIAnnouncer';

interface Report {
    id: number;
    title: string;
    episode: string;
    date: string;
    winner: string;
    content: string;
}

const AVATAR_MAP: Record<string, string> = {
    'edward wearing': 'avatar_edward_wearing_1772222877224.png',
    'georgina wearing': 'avatar_georgina_wearing_1772223035422.png',
    'luke daly': 'avatar_luke_daly_1772223102669.png',
    'daniel horne': 'avatar_daniel_horne_1772222954376.png',
    'darren daly': 'avatar_darren_daly_1772222979758.png',
    'chris daly': 'avatar_chris_daly_1772222942062.png',
    'stephen flood': 'avatar_stephen_flood_1772223088474.png',
    'phil landsberger': 'avatar_hoodie.png',
    'liam duxbury': 'avatar_liam_duxbury_1772223048076.png',
    'nathen benson': 'avatar_nathen_benson_1772223077518.png',
    'dave taylor': 'avatar_dave_taylor_1772223007740.png',
};

const getAvatarFilename = (name: string) => {
    const key = name.toLowerCase().trim();
    return AVATAR_MAP[key] || 'avatar_hoodie.png';
};

function ReportCard({ report, index, isLatest }: { report: Report; index: number; isLatest: boolean }) {
    const [expanded, setExpanded] = useState(isLatest);

    return (
        <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.4 }}
            className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${
                isLatest
                    ? 'border-gold/40 bg-black/60 shadow-[0_0_40px_rgba(212,175,55,0.1)]'
                    : 'border-white/10 bg-black/30 hover:border-white/20'
            }`}
        >
            {/* Latest badge */}
            {isLatest && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 bg-gold/20 border border-gold/40 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                    <span className="text-[9px] font-black text-gold uppercase tracking-widest hidden sm:inline">Latest Issue</span>
                    <span className="text-[9px] font-black text-gold uppercase tracking-widest sm:hidden">New</span>
                </div>
            )}

            {/* Card Header */}
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full text-left p-4 sm:p-6 flex items-start gap-3 sm:gap-4 group"
            >
                {/* Winner avatar */}
                {report.winner && (
                    <div className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 ${isLatest ? 'border-gold/40' : 'border-white/10'} bg-black/50`}>
                        <img
                            src={`/avatars/${getAvatarFilename(report.winner)}`}
                            alt={report.winner}
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{report.episode}</span>
                        {report.date && (
                            <>
                                <span className="text-zinc-700">·</span>
                                <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {report.date}
                                </span>
                            </>
                        )}
                    </div>
                    <h2 className={`text-xl font-black uppercase tracking-tight leading-tight ${isLatest ? 'text-gold' : 'text-white group-hover:text-gold transition-colors'}`}>
                        {report.title}
                    </h2>
                    {report.winner && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <Trophy className="w-3 h-3 text-gold" />
                            <span className="text-xs text-gold font-bold">{report.winner}</span>
                        </div>
                    )}
                </div>

                <div className="shrink-0 text-zinc-600 group-hover:text-gold transition-colors mt-1">
                    {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 border-t border-white/5 pt-4">
                            {/* AI Announcer */}
                            <AIAnnouncer
                                text={report.content}
                                title={`${report.episode}: ${report.title}`}
                            />

                            {/* Report content */}
                            <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap font-serif">
                                {report.content}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.article>
    );
}

export default function GazettePage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/reports')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data);
                } else {
                    setError('Failed to load reports.');
                }
            })
            .catch(() => setError('Could not connect to the server.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen font-sans">
            {/* Page Header */}
            <div className="relative overflow-hidden pb-8 md:pb-12 pt-4 md:pt-8 mb-6 md:mb-10 border-b border-white/10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)] pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

                <div className="flex items-center gap-4 mb-4">
                    <Link href="/" className="text-zinc-500 hover:text-gold text-xs font-bold uppercase tracking-widest transition-colors">
                        ← Home
                    </Link>
                </div>

                <div className="flex items-start gap-4">
                    <div className="p-4 bg-gold/10 border border-gold/20 rounded-xl text-gold shrink-0">
                        <Newspaper size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gold/70 uppercase tracking-[0.3em] mb-1">E.P.T. Official Publication</p>
                        <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tight leading-none">
                            The Gazette
                        </h1>
                        <p className="text-zinc-500 mt-2 font-bold uppercase tracking-widest text-xs">
                            Full Archive — Every Issue Ever Printed
                        </p>
                    </div>
                </div>

                {/* Decorative rule */}
                <div className="mt-8 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gold/20" />
                    <BookOpen className="w-4 h-4 text-gold/40" />
                    <div className="h-px flex-1 bg-gold/20" />
                </div>
            </div>

            {/* Content */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Loading the archives...</p>
                </div>
            )}

            {error && (
                <div className="text-center py-24">
                    <p className="text-ept-red font-bold uppercase tracking-widest">{error}</p>
                </div>
            )}

            {!loading && !error && reports.length === 0 && (
                <div className="text-center py-24">
                    <p className="text-zinc-600 font-bold uppercase tracking-widest">No reports published yet.</p>
                    <p className="text-zinc-700 text-sm mt-2">Publish your first report from the Admin Console.</p>
                </div>
            )}

            {!loading && !error && reports.length > 0 && (
                <div className="space-y-4">
                    {/* Stats bar */}
                    <div className="flex items-center justify-between mb-8 px-1">
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            {reports.length} {reports.length === 1 ? 'Issue' : 'Issues'} Published
                        </span>
                        <span className="text-zinc-600 text-xs font-mono">
                            Est. {new Date().getFullYear()}
                        </span>
                    </div>

                    {reports.map((report, index) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            index={index}
                            isLatest={index === 0}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
