'use client';
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TIPS = [
    {
        player: "Georgina Wearing",
        title: "The Georgina Trap",
        tip: "When holding a Full House, check the turn to feign weakness, then shove the river when an opponent bets.",
        tags: ["Full House", "Trapping"]
    },
    {
        player: "Liam Duxbury",
        title: "The Liam Duxbury Test",
        tip: "If you only have One Pair on a wet board and face a large 3-bet, ask yourself: 'Does this opponent bluff here?' Liam usually folds One Pair to extreme aggression.",
        tags: ["One Pair", "Discipline"]
    },
    {
        player: "Edward Wearing",
        title: "The Bounty Push",
        tip: "Use your large stack to pressure short stacks near the bubble. Any ace or suited connector is enough to shove from the button if the blinds are tight.",
        tags: ["Aggression", "Bullying"]
    }
];

export default function LeagueProTips() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (idx: number) => {
        if (openIndex === idx) setOpenIndex(null);
        else setOpenIndex(idx);
    };

    return (
        <div className="bg-black/40 border border-[#cfb53b]/20 p-6 rounded-xl shadow-lg h-full">
            <h2 className="text-2xl font-bold text-[#ffd700] mb-6 border-b border-[#cfb53b]/30 pb-2">League Pro-Tips</h2>
            <div className="space-y-3">
                {TIPS.map((item, idx) => (
                    <div key={idx} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden transition-all duration-300">
                        <button
                            onClick={() => toggle(idx)}
                            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-800 focus:outline-none"
                        >
                            <div>
                                <span className="text-xs font-bold text-[#ff073a] uppercase tracking-wider mb-1 block">By {item.player}</span>
                                <h3 className="text-white font-semibold text-lg">{item.title}</h3>
                            </div>
                            <div className="text-gray-400">
                                {openIndex === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </button>

                        {openIndex === idx && (
                            <div className="p-4 bg-black/60 border-t border-gray-800 text-gray-300 text-sm leading-relaxed">
                                <p className="mb-3">&quot;{item.tip}&quot;</p>
                                <div className="flex gap-2">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="text-xs px-2 py-1 bg-gray-800 rounded-full text-[#cfb53b] border border-[#cfb53b]/30">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
