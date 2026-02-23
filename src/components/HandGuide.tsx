import React from 'react';

const HANDS = [
    { rank: 1, name: "Royal Flush", desc: "A, K, Q, J, 10, all the same suit.", odds: "0.00015%" },
    { rank: 2, name: "Straight Flush", desc: "Five cards in a sequence, all in the same suit.", odds: "0.00139%" },
    { rank: 3, name: "Four of a Kind", desc: "All four cards of the same rank.", odds: "0.02401%" },
    { rank: 4, name: "Full House", desc: "Three of a kind with a pair.", odds: "0.1441%" },
    { rank: 5, name: "Flush", desc: "Any five cards of the same suit, but not in a sequence.", odds: "0.1965%" },
    { rank: 6, name: "Straight", desc: "Five cards in a sequence, but not of the same suit.", odds: "0.3925%" },
    { rank: 7, name: "Three of a Kind", desc: "Three cards of the same rank.", odds: "2.1128%" },
    { rank: 8, name: "Two Pair", desc: "Two different pairs.", odds: "4.7539%" },
    { rank: 9, name: "One Pair", desc: "Two cards of the same rank.", odds: "42.2569%" },
    { rank: 10, name: "High Card", desc: "When you haven't made any of the hands above.", odds: "50.1177%" },
];

export default function HandGuide() {
    return (
        <div className="bg-black/40 border border-[#cfb53b]/20 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-[#ffd700] mb-6 border-b border-[#cfb53b]/30 pb-2">Interactive Hand Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {HANDS.map((hand, idx) => (
                    <div key={idx} className="bg-gray-900 border border-gray-700 hover:border-[#ff073a] transition-all p-4 rounded-lg flex flex-col justify-between group cursor-pointer relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#ff073a]/0 to-[#ff073a]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="z-10 relative">
                            <div className="text-4xl font-black text-gray-800 absolute -top-4 -right-2 tracking-tighter mix-blend-overlay">
                                #{hand.rank}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{hand.name}</h3>
                            <p className="text-xs text-gray-400 mb-4">{hand.desc}</p>
                        </div>
                        <div className="z-10 relative mt-auto border-t border-gray-800 pt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500 uppercase tracking-widest">Odds</span>
                            <span className="text-sm font-bold text-[#ff073a]">{hand.odds}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
