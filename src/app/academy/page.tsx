import React from 'react';
import HandGuide from '../../components/HandGuide';
import LeagueProTips from '../../components/LeagueProTips';
import StrategyQuiz from '../../components/StrategyQuiz';
import PokerDictionary from '../../components/PokerDictionary';

export const metadata = {
    title: 'Academy | E.P.T 2026',
    description: 'Master the felt with our interactive poker curriculum.',
};

export default function AcademyPage() {
    return (
        <div className="min-h-screen bg-[#1c1c1c] text-white p-6 md:p-10 font-sans">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] to-[#cfb53b] uppercase tracking-tighter">
                        Mastering the Felt
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Elevate your game with interactive hand guides, league-tested pro tips, and advanced strategy quizzes.
                    </p>
                </div>

                {/* Top Section: Hand Guide */}
                <div className="mb-16 rounded-2xl overflow-hidden border border-[#cfb53b]/30 shadow-[0_0_50px_rgba(212,175,55,0.1)] relative group">
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-4 py-2 border border-[#cfb53b]/50 rounded text-gold font-bold uppercase tracking-widest text-sm z-10">
                        Official E.P.T. Hand Hierarchy Handout
                    </div>
                    <img
                        src="/images/metal-poker-hands.jpg"
                        alt="Simple Poker Hands Hierarchy Chart"
                        className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.01] transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c] via-transparent to-transparent pointer-events-none" />
                </div>

                <HandGuide />

                {/* Bottom Section: Tips & Quiz Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <LeagueProTips />
                    <StrategyQuiz />
                </div>

                {/* Lexicon Section */}
                <div className="max-w-4xl mx-auto">
                    <PokerDictionary />
                </div>

            </div>
        </div>
    );
}
