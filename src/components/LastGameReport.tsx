'use client';

import { FileText, Calendar, Trophy, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import WantedVideo from './WantedVideo';
import AIAnnouncer from './AIAnnouncer';

export default function LastGameReport() {
    const [report, setReport] = useState({
        title: 'Loading...',
        episode: '',
        date: '',
        winner: 'Edward Wearing', // default for video
        content: 'Loading latest report...'
    });

    useEffect(() => {
        fetch('/api/admin/report')
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setReport(data);
                }
            })
            .catch(console.error);
    }, []);

    return (
        <div className="glass-panel p-8 rounded-2xl border-l-4 border-gold relative overflow-hidden group">

            {/* Background Accent */}
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none group-hover:bg-gold/10 transition-colors duration-700" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gold/10 rounded-lg text-gold border border-gold/20">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gold">Latest League Report</h2>
                        <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                            <Calendar size={12} /> {report.date}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 space-y-6">
                        <h1 className="text-4xl font-black text-white italic tracking-tight uppercase leading-none">
                            {report.title} <span className="text-zinc-600 block text-2xl mt-1">{report.episode}</span>
                        </h1>

                        <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {report.content}
                        </div>

                        {/* AI Announcer */}
                        {report.content && report.content !== 'Loading latest report...' && (
                            <AIAnnouncer
                                text={report.content}
                                title={`${report.episode}: ${report.title}`}
                            />
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <Trophy className="text-gold w-4 h-4" />
                                <span className="text-white font-bold text-sm">Winner:</span>
                                <span className="text-gold font-mono font-bold">{report.winner}</span>
                            </div>
                            <Link
                                href="/gazette"
                                className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 hover:text-gold uppercase tracking-widest transition-colors group"
                            >
                                <BookOpen className="w-3.5 h-3.5 group-hover:text-gold" />
                                View Full Archive
                            </Link>
                        </div>
                    </div>

                    <div className="lg:col-span-5 w-full bg-black rounded-xl overflow-hidden border-2 border-gold/30 shadow-[0_0_30px_rgba(212,175,55,0.2)] relative group/video flex items-center justify-center min-h-[250px]">
                        {/* Winner's Highlight Video */}
                        <WantedVideo
                            playerName={report.winner}
                            className="w-full h-auto max-h-[500px] object-contain grayscale contrast-125 transition-opacity z-10"
                        />

                        {/* Dramatic Overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
                        <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 bg-ept-red/90 text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-lg backdrop-blur z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Live Cam
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 text-center z-10 pointer-events-none">
                            <span className="text-gold font-black uppercase text-2xl tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">Champion</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
