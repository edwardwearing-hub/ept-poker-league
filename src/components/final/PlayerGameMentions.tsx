'use client';

import React, { useState } from 'react';
import { Newspaper, Trophy, Calendar, ChevronDown, ChevronUp, BookOpen, Ghost, Eye } from 'lucide-react';
import Link from 'next/link';

export interface GazetteReport {
    id: number;
    title: string;
    episode: string;
    date: string;
    winner: string;
    content: string;
    imageUrl?: string | null;
}

interface Props {
    playerName: string;
    reports: GazetteReport[];
}

const PLAYER_SEARCH_TERMS: Record<string, string[]> = {
    'edward wearing': ['edward wearing', 'edward', 'eddy', 'eddie'],
    'georgina wearing': ['georgina wearing', 'georgina'],
    'luke daly': ['luke daly', 'luke'],
    'darren daly': ['darren daly', 'darren'],
    'chris daly': ['chris daly', 'chris'],
    'daniel horne': ['daniel horne', 'daniel', 'dan horne', 'horne'],
    'stephen flood': ['stephen flood', 'stephen', 'flood'],
    'dave blackburn': ['dave blackburn', 'david blackburn', 'blackburn'],
    'dave taylor': ['dave taylor', 'david taylor', 'taylor'],
    'liam duxbury': ['liam duxbury', 'liam', 'duxbury'],
    'nathen benson': ['nathen benson', 'nathan benson', 'nathen', 'nathan', 'benson'],
};

function getSearchTerms(name: string): string[] {
    const key = name.toLowerCase().trim();
    if (PLAYER_SEARCH_TERMS[key]) {
        return PLAYER_SEARCH_TERMS[key];
    }
    const parts = key.split(/\s+/).filter(Boolean);
    const terms = [key];
    if (parts.length > 0 && parts[0].length >= 3) {
        terms.push(parts[0]);
    }
    return terms;
}

function HighlightText({ text, terms }: { text: string; terms: string[] }) {
    if (!text) return null;
    const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
    const parts = text.split(pattern);

    return (
        <span>
            {parts.map((part, i) => {
                const isMatch = terms.some(t => t.toLowerCase() === part.toLowerCase());
                if (isMatch) {
                    return (
                        <span
                            key={i}
                            className="text-gold font-black bg-gold/15 px-1 py-0.5 rounded border border-gold/30 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                        >
                            {part}
                        </span>
                    );
                }
                return part;
            })}
        </span>
    );
}

export default function PlayerGameMentions({ playerName, reports }: Props) {
    const [isExpandedAll, setIsExpandedAll] = useState(false);
    const [expandedFullReportId, setExpandedFullReportId] = useState<number | null>(null);

    const terms = getSearchTerms(playerName);
    const regexes = terms.map(t => new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'));

    // Process mentions
    const mentions: {
        id: number;
        episode: string;
        date: string;
        title: string;
        winner: string;
        isWinner: boolean;
        snippets: string[];
        fullContent: string;
        imageUrl?: string | null;
    }[] = [];

    const seenContent = new Set<string>();

    (reports || []).forEach((r) => {
        const fullContent = (r.content || '').trim();
        // Skip duplicate drafts in the same episode
        const contentKey = `${r.episode}_${fullContent.slice(0, 100)}`;
        if (seenContent.has(contentKey)) return;
        seenContent.add(contentKey);

        const isWinner = terms.some(t => new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(r.winner || ''));
        const titleMatch = terms.some(t => new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(r.title || ''));

        // Split content into paragraphs or meaningful blocks
        const paragraphs = fullContent.split(/\n+/).map(p => p.trim()).filter(Boolean);
        const matchingSnippets: string[] = [];

        paragraphs.forEach(para => {
            if (regexes.some(rx => rx.test(para))) {
                matchingSnippets.push(para);
            }
        });

        // If winner or title matched but no paragraph directly mentioned them
        if (matchingSnippets.length === 0 && (isWinner || titleMatch)) {
            if (paragraphs.length > 0) {
                matchingSnippets.push(paragraphs[0]);
            }
        }

        if (isWinner || titleMatch || matchingSnippets.length > 0) {
            mentions.push({
                id: r.id,
                episode: r.episode || 'Game Report',
                date: r.date,
                title: r.title && r.title !== '"The Flop"' ? r.title.replace(/^["']|["']$/g, '') : '',
                winner: r.winner,
                isWinner,
                snippets: matchingSnippets,
                fullContent: r.content,
                imageUrl: r.imageUrl
            });
        }
    });

    const displayMentions = isExpandedAll ? mentions : mentions.slice(0, 2);

    return (
        <div className="p-4 bg-zinc-950/80 border border-white/10 rounded-2xl space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase">
                <span className="text-gold flex items-center gap-1.5">
                    <Newspaper className="w-3.5 h-3.5" />
                    Game Reports &amp; Gazette Mentions
                </span>
                {mentions.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                        {mentions.length} {mentions.length === 1 ? 'Mention' : 'Mentions'} Found
                    </span>
                ) : (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-white/5">
                        0 Mentions
                    </span>
                )}
            </div>

            {/* Zero mentions notice */}
            {mentions.length === 0 && (
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center gap-2.5 text-zinc-500 text-xs">
                    <Ghost className="w-4 h-4 text-zinc-600 shrink-0" />
                    <span>No mentions recorded in official game reports or Gazette issues. Operating in complete radio silence.</span>
                </div>
            )}

            {/* Mentions List */}
            {mentions.length > 0 && (
                <div className="space-y-3">
                    {displayMentions.map((m) => {
                        const isFullExpanded = expandedFullReportId === m.id;
                        return (
                            <div
                                key={m.id}
                                className="p-3 rounded-xl bg-black/50 border border-white/5 hover:border-gold/30 transition-all space-y-2 group"
                            >
                                {/* Mention Sub-header */}
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-gold/10 text-gold text-[10px] font-black uppercase font-mono tracking-wider border border-gold/20">
                                            {m.episode}
                                        </span>
                                        {m.date && (
                                            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {m.date}
                                            </span>
                                        )}
                                        {m.isWinner && (
                                            <span className="px-2 py-0.5 rounded-md bg-gold/20 text-gold border border-gold/40 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Trophy className="w-3 h-3 text-gold" />
                                                Winner
                                            </span>
                                        )}
                                    </div>

                                    {m.title && (
                                        <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-tight truncate max-w-[220px]">
                                            {m.title}
                                        </span>
                                    )}
                                </div>

                                {/* Snippets */}
                                <div className="space-y-1.5">
                                    {m.snippets.map((snip, sIdx) => (
                                        <div
                                            key={sIdx}
                                            className="text-xs text-zinc-300 leading-relaxed font-sans bg-zinc-900/60 p-2.5 rounded-lg border-l-2 border-gold/50"
                                        >
                                            <HighlightText text={snip} terms={terms} />
                                        </div>
                                    ))}
                                </div>

                                {/* Toggle Full Dispatch */}
                                <div className="flex items-center justify-between pt-1">
                                    <button
                                        onClick={() => setExpandedFullReportId(isFullExpanded ? null : m.id)}
                                        className="text-[10px] text-zinc-500 hover:text-gold font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                                    >
                                        <Eye className="w-3 h-3" />
                                        {isFullExpanded ? 'Hide Full Dispatch' : 'Read Full Dispatch'}
                                        {isFullExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>

                                    <Link
                                        href="/gazette"
                                        className="text-[10px] text-zinc-600 hover:text-gold uppercase tracking-wider transition-colors"
                                    >
                                        Gazette Issue →
                                    </Link>
                                </div>

                                {/* Full content view */}
                                {isFullExpanded && (
                                    <div className="p-3 bg-zinc-950/90 rounded-lg border border-white/10 space-y-2 mt-2">
                                        {m.imageUrl && (
                                            <div className="rounded-lg overflow-hidden border border-gold/20 max-h-48 mb-2">
                                                <img src={m.imageUrl} alt={m.title} className="w-full h-full object-cover max-h-48" />
                                            </div>
                                        )}
                                        <div className="text-xs text-zinc-300 leading-relaxed font-serif whitespace-pre-wrap">
                                            {m.fullContent}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Expand all button if more than 2 mentions */}
                    {mentions.length > 2 && (
                        <button
                            onClick={() => setIsExpandedAll(!isExpandedAll)}
                            className="w-full py-2 px-3 rounded-xl bg-zinc-900/80 hover:bg-gold/10 hover:border-gold/30 border border-white/5 text-[11px] font-black uppercase text-gold tracking-wider flex items-center justify-center gap-1.5 transition-all"
                        >
                            {isExpandedAll ? (
                                <>
                                    <span>Show Fewer Mentions</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                </>
                            ) : (
                                <>
                                    <span>View All {mentions.length} Game Mentions (+{mentions.length - 2} More)</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    )}

                    {/* Bottom link to Gazette */}
                    <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="font-mono">Live Sync from Gazette Sheet</span>
                        <Link
                            href="/gazette"
                            className="text-zinc-500 hover:text-gold font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                        >
                            <BookOpen className="w-3 h-3" /> Full Gazette Archive
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
