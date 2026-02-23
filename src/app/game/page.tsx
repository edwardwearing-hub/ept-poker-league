'use client';

import React, { useState, useEffect } from 'react';

// Very basic definitions for a functional prototype
type Card = { suit: string; rank: string };
type Player = { id: string; name: string; type: 'real' | 'ai'; persona?: string; chips: number; cards: Card[]; currentBet: number; folded: boolean };

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function getDeck(): Card[] {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) deck.push({ suit, rank });
    }
    return deck.sort(() => Math.random() - 0.5);
}

const AI_PERSONAS = [
    { name: 'Aggressive Liam', type: 'ai', persona: 'aggressive' },
    { name: 'Tight-Passive Georgina', type: 'ai', persona: 'tight-passive' },
    { name: 'All-In Edward', type: 'ai', persona: 'all-in' },
];

export default function GamePage() {
    const [deck, setDeck] = useState<Card[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [communityCards, setCommunityCards] = useState<Card[]>([]);
    const [pot, setPot] = useState(0);
    const [stage, setStage] = useState<'Waiting' | 'Pre-flop' | 'Flop' | 'Turn' | 'River' | 'Showdown'>('Waiting');
    const [isThinking, setIsThinking] = useState(false);

    // Persistent virtual leaderboard
    const [virtualLeaderboard, setVirtualLeaderboard] = useState<{ [name: string]: number }>({});

    useEffect(() => {
        const stored = localStorage.getItem('ept_virtual_leaderboard');
        if (stored) {
            setVirtualLeaderboard(JSON.parse(stored));
        } else {
            // Initialize basic board with our personas
            const initial = { 'You': 0, 'Aggressive Liam': 0, 'Tight-Passive Georgina': 0, 'All-In Edward': 0 };
            setVirtualLeaderboard(initial);
            localStorage.setItem('ept_virtual_leaderboard', JSON.stringify(initial));
        }
    }, []);

    // Game Initialization
    const startGame = () => {
        const newDeck = getDeck();

        // Set up players
        let hero: Player = { id: 'p1', name: 'You', type: 'real', chips: 1000, cards: [newDeck.pop()!, newDeck.pop()!], currentBet: 0, folded: false };

        let bots: Player[] = AI_PERSONAS.map((p, i) => ({
            id: `bot${i}`, name: p.name, type: 'ai', persona: p.persona, chips: 1000, cards: [newDeck.pop()!, newDeck.pop()!], currentBet: 0, folded: false
        }));

        setPlayers([hero, ...bots]);
        setDeck(newDeck);
        setCommunityCards([]);
        setPot(0);
        setStage('Pre-flop');
    };

    const advanceStage = () => {
        setIsThinking(true);
        setTimeout(() => {
            if (stage === 'Pre-flop') {
                const flop = [deck.pop()!, deck.pop()!, deck.pop()!];
                setCommunityCards(flop);
                setStage('Flop');
                runAIActions();
            } else if (stage === 'Flop') {
                const turn = [...communityCards, deck.pop()!];
                setCommunityCards(turn);
                setStage('Turn');
                runAIActions();
            } else if (stage === 'Turn') {
                const river = [...communityCards, deck.pop()!];
                setCommunityCards(river);
                setStage('River');
                runAIActions();
            } else if (stage === 'River') {
                setStage('Showdown');
                resolveWinner();
                setIsThinking(false);
            } else if (stage === 'Showdown') {
                startGame(); // Reset
                setIsThinking(false);
            }
        }, 1200); // Artificial delay to slow down gameplay
    };

    const runAIActions = () => {
        setIsThinking(true);
        setTimeout(() => {
            setPlayers(prev => prev.map(p => {
                if (p.type === 'real' || p.folded) return p;

                let betAmount = 0;
                let action = 'Check/Call';

                // AI Persona Logic
                if (p.persona === 'all-in' && Math.random() > 0.5) {
                    betAmount = p.chips; // simplistic all in
                    action = 'All In';
                } else if (p.persona === 'aggressive') {
                    betAmount = 50;
                    action = 'Raise';
                } else if (p.persona === 'tight-passive') {
                    if (Math.random() > 0.7) { p.folded = true; action = 'Fold'; }
                }

                if (!p.folded && betAmount > 0) {
                    if (betAmount > p.chips) betAmount = p.chips;
                    p.chips -= betAmount;
                    p.currentBet += betAmount;
                    setPot(pot => pot + betAmount);
                }

                return p;
            }));
            setIsThinking(false);
        }, 1500); // 1.5 second delay for "thinking"
    };

    const playerAction = (action: 'fold' | 'call' | 'raise') => {
        if (action === 'fold') {
            setPlayers(prev => prev.map(p => p.type === 'real' ? { ...p, folded: true } : p));
            advanceStage();
        } else if (action === 'call') {
            // Simplistic call: add 50 to pot
            setPot(p => p + 50);
            setPlayers(prev => prev.map(p => p.type === 'real' ? { ...p, chips: p.chips - 50, currentBet: p.currentBet + 50 } : p));
            advanceStage();
        } else if (action === 'raise') {
            setPot(p => p + 100);
            setPlayers(prev => prev.map(p => p.type === 'real' ? { ...p, chips: p.chips - 100, currentBet: p.currentBet + 100 } : p));
            advanceStage();
        }
    };

    const resolveWinner = () => {
        const active = players.filter(p => !p.folded);
        if (active.length > 0) {
            const winner = active[Math.floor(Math.random() * active.length)];
            setPlayers(prev => prev.map(p => p.id === winner.id ? { ...p, chips: p.chips + pot } : p));

            // Update Virtual Leaderboard tracking
            setVirtualLeaderboard(prev => {
                const updated = { ...prev };
                updated[winner.name] = (updated[winner.name] || 0) + pot;
                localStorage.setItem('ept_virtual_leaderboard', JSON.stringify(updated));
                return updated;
            });

            // Artificial delay before showing winner
            setTimeout(() => {
                alert(`${winner.name} wins pot of ${pot}`);
            }, 500);
        }
    };

    const renderCard = (card: Card, hidden = false) => {
        if (hidden) return <div className="w-16 h-24 bg-red-800 border-2 border-white/20 rounded-lg shadow-xl shadow-black"></div>;
        const isRed = card.suit === '♥' || card.suit === '♦';
        return (
            <div className={`w-16 h-24 bg-white rounded-lg flex flex-col justify-center items-center shadow-xl shadow-black ${isRed ? 'text-red-600' : 'text-black'}`}>
                <span className="text-xl font-bold">{card.rank}</span>
                <span className="text-3xl">{card.suit}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#1c1c1c] text-white font-sans flex overflow-hidden">
            {/* Sidebar Rankings */}
            <div className="w-64 bg-black border-r border-[#cfb53b]/30 p-6 flex flex-col hidden md:flex">
                <h2 className="text-[#ffd700] font-black tracking-widest uppercase mb-6 pb-2 border-b border-gray-800">Virtual Net Chips</h2>
                <div className="flex-1 overflow-y-auto space-y-4">
                    {Object.entries(virtualLeaderboard)
                        .sort(([, a], [, b]) => b - a)
                        .map(([name, net], index) => (
                            <div key={name} className="bg-gray-900 p-3 rounded border justify-between flex border-gray-700 items-center">
                                <span>{index + 1}. {name}</span>
                                <span className={net > 0 ? "text-green-400" : "text-gray-500"}>£{net}</span>
                            </div>
                        ))
                    }
                    <div className="text-gray-500 text-sm mt-4 italic text-center">Data persists in local storage</div>
                </div>
            </div>

            {/* Main Game Table */}
            <div className="flex-1 relative flex items-center justify-center p-6 radial-bg-green overflow-hidden">
                {/* Fake Poker Table UI */}
                <div className="absolute inset-0 z-0">
                    <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-800 to-black opacity-80" />
                </div>

                <div className="relative z-10 w-full max-w-4xl h-[600px] border-[16px] border-[#3b2f2f] bg-green-900 rounded-[200px] shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center p-8">

                    {/* Top Bots */}
                    <div className="absolute top-0 transform -translate-y-1/2 flex gap-12">
                        {players.filter(p => p.type === 'ai').map((p) => (
                            <div key={p.id} className={`flex flex-col items-center bg-black/80 p-3 rounded-xl border ${p.folded ? 'border-gray-700 opacity-50' : 'border-[#cfb53b]'}`}>
                                <div className="text-[#ffd700] font-bold text-sm truncate w-24 text-center">{p.name}</div>
                                <div className="text-green-400 font-mono text-xs mb-2">💰 {p.chips}</div>
                                <div className="flex -space-x-4">
                                    {p.cards.map((c, i) => renderCard(c, stage !== 'Showdown'))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mb-4 min-h-[40px]">
                        {isThinking ? (
                            <h1 className="text-xl text-ept-red font-black uppercase tracking-widest opacity-80 animate-pulse">Dealing...</h1>
                        ) : (
                            <h1 className="text-xl text-[#ffd700] font-black uppercase tracking-widest opacity-50 drop-shadow-md">E.P.T. Virtual Engine</h1>
                        )}
                    </div>

                    {/* Pot Area */}
                    <div className="bg-black/60 px-8 py-4 rounded-full border border-[#cfb53b]/20 mb-8 flex flex-col items-center shadow-lg">
                        <span className="text-sm text-gray-400 font-bold tracking-widest uppercase">Total Pot</span>
                        <span className="text-4xl text-[#ffd700] font-black">£{pot}</span>
                    </div>

                    {/* Community Cards */}
                    <div className="flex gap-2">
                        {stage === 'Waiting' && <div className="text-gray-400 font-bold animate-pulse">Waiting for Players...</div>}
                        {communityCards.map((c, i) => renderCard(c, false))}
                    </div>

                    {/* Bottom Player (Hero) */}
                    {players.filter(p => p.type === 'real').map(p => (
                        <div key={p.id} className={`absolute bottom-0 transform translate-y-1/2 flex flex-col items-center bg-black/90 p-4 rounded-xl border shadow-2xl ${p.folded ? 'border-gray-700 opacity-50' : 'border-[#ff073a]'}`}>
                            <div className="text-white font-bold mb-1">Your Hand</div>
                            <div className="flex -space-x-2 shadow-lg mb-3">
                                {p.cards.map((c, i) => renderCard(c, false))}
                            </div>
                            <div className="text-green-400 font-mono font-bold mb-4">Stack: £{p.chips}</div>

                            {!p.folded && stage !== 'Waiting' && stage !== 'Showdown' && (
                                <div className={`flex gap-2 transition-opacity duration-300 ${isThinking ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                    <button onClick={() => playerAction('fold')} disabled={isThinking} className="px-4 py-2 bg-gray-800 hover:bg-red-900 border border-red-800 rounded font-bold text-xs transition">Fold</button>
                                    <button onClick={() => playerAction('call')} disabled={isThinking} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded font-bold text-xs transition">Call / Check</button>
                                    <button onClick={() => playerAction('raise')} disabled={isThinking} className="px-4 py-2 bg-[#ff073a] hover:bg-red-600 rounded font-bold text-xs shadow-lg shadow-red-500/50 transition">Raise</button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Game Controls */}
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2 flex flex-col gap-4">
                        {stage === 'Waiting' || stage === 'Showdown' ? (
                            <button onClick={startGame} className="px-6 py-3 bg-[#ffd700] text-black font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(255,215,0,0.5)] hover:bg-yellow-400 transition">
                                {stage === 'Waiting' ? 'Deal Hands' : 'Next Game'}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
