'use client';

import React, { useState } from 'react';

const DICTIONARY = [
    { term: 'Wet Board', definition: 'Community cards that are heavily coordinated, offering many straight and flush draw possibilities. e.g. 7♥ 8♥ 9♣' },
    { term: 'Dry Board', definition: 'Community cards that are uncoordinated and unlikely to complete straights or flushes. e.g. K♠ 8♦ 2♣' },
    { term: 'Gutshot (Inside Straight Draw)', definition: 'A draw where you need exactly one middle card to complete a straight. e.g. Holding 5-6 on a 8-9-A board requires exactly a 7.' },
    { term: 'Open-Ended Straight Draw', definition: 'A draw where you can hit either the top or bottom card to make a straight. Gives you 8 "outs".' },
    { term: 'Rainbow', definition: 'A flop that contains three different suits, meaning no flush can be completed on the turn.' },
    { term: 'The Nuts', definition: 'The absolute best possible hand given the community cards on the board.' },
    { term: 'Tilt', definition: 'A state of emotional frustration where a player adopts a sub-optimal, overly aggressive strategy.' },
    { term: 'Slow Roll', definition: 'Taking an excessively long time to reveal the winning hand at showdown. Considered highly disrespectful.' },
    { term: 'Limping', definition: 'Entering the pot by just calling the big blind pre-flop instead of raising.' },
    { term: '3-Bet', definition: 'The second raise made pre-flop (the big blind is the 1st bet, the initial raise is the 2nd bet, the re-raise is the 3-bet).' }
];

export default function PokerDictionary() {
    const [search, setSearch] = useState('');

    const filteredTerms = DICTIONARY.filter(item =>
        item.term.toLowerCase().includes(search.toLowerCase()) ||
        item.definition.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-charcoal/50 p-6 rounded-2xl border border-gold/20 shadow-xl flex flex-col h-full">
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-wider border-l-4 border-ept-red pl-3">
                Poker Lexicon
            </h2>

            <input
                type="text"
                placeholder="Search terms (e.g., 'Wet', 'Nuts')..."
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white mb-6 focus:outline-none focus:border-ept-red transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 max-h-[400px]">
                {filteredTerms.length > 0 ? (
                    filteredTerms.map((item, idx) => (
                        <div key={idx} className="bg-black/30 p-4 rounded border border-white/5 hover:border-gold/30 transition">
                            <h3 className="text-gold font-bold text-lg mb-1">{item.term}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{item.definition}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic text-center py-4">No terms found matching "{search}"</p>
                )}
            </div>
        </div>
    );
}
