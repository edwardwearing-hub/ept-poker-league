'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, ChevronRight, AlertTriangle, Eye, Sparkles, UserPlus, Users, Check, Shield, Music, Volume2 } from 'lucide-react';
import { WALK_UP_THEMES, WalkUpTheme, playWalkUpAudio, savePlayerWalkUpTheme, getPlayerWalkUpTheme } from '@/lib/walkup-audio';
import {
    loadTrackerStatsForPlayer,
    transferGuestChipsToPlayer,
} from '@/lib/poker-trainer/tracker';

interface Player {
    name: string;
    avatarUrl: string;
    nickname: string;
    isCustom?: boolean;
}

interface Props {
    onSuccess: (name: string) => void;
    onClose?: () => void;
    initialTab?: 'roster' | 'new-player' | 'guest';
}

const AVAILABLE_AVATARS = [
    { id: 'shark', url: '/avatars/avatar_shark.png', label: 'The Shark' },
    { id: 'bounty', url: '/avatars/avatar_bounty.png', label: 'The Bounty' },
    { id: 'duke', url: '/avatars/avatar_duke.png', label: 'The Duke' },
    { id: 'hoodie', url: '/avatars/avatar_hoodie.png', label: 'The Grinder' },
    { id: 'prof', url: '/avatars/avatar_dave_blackburn_1787685845732.png', label: 'The Brain' },
];

export default function LockerPINModal({ onSuccess, onClose, initialTab = 'roster' }: Props) {
    const [activeTab, setActiveTab] = useState<'roster' | 'new-player' | 'guest'>(initialTab);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [pin, setPin] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'select' | 'pin'>('select');

    // New Player form states
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerPin, setNewPlayerPin] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('/avatars/avatar_shark.png');
    const [selectedTheme, setSelectedTheme] = useState<WalkUpTheme>('gladiator');

    useEffect(() => {
        fetch('/api/players')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPlayers(data);
            })
            .catch(err => console.error('Failed to fetch players', err));
    }, []);

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setErrorMsg(null);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setErrorMsg(null);
    };

    // Verify existing player PIN via /api/auth/player-login
    const handleSubmitPin = async () => {
        if (!selectedPlayer || pin.length < 4) return;

        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await fetch('/api/auth/player-login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ name: selectedPlayer.name, pin })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // If there are guest winnings, transfer them to this player
                transferGuestChipsToPlayer(selectedPlayer.name);
                const currentStats = loadTrackerStatsForPlayer(selectedPlayer.name);

                // Immediately sync to server now that we have an active verified session
                fetch('/api/player/academy-profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ name: selectedPlayer.name, stats: currentStats }),
                }).catch(() => {});

                savePlayerWalkUpTheme(selectedPlayer.name, selectedTheme);
                localStorage.setItem('ept_active_player_v2', selectedPlayer.name);
                window.dispatchEvent(new Event('storage'));
                onSuccess(selectedPlayer.name);
            } else {
                setErrorMsg(data.error || 'ACCESS DENIED');
                setPin('');
                setTimeout(() => setErrorMsg(null), 1500);
            }
        } catch (err) {
            console.error('Auth error', err);
            setErrorMsg('Connection error');
        } finally {
            setLoading(false);
        }
    };

    // Create New Custom Player (Zero Registration, Name + 4-digit PIN)
    const handleCreateNewPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanName = newPlayerName.trim();
        if (!cleanName || cleanName.length < 2) {
            setErrorMsg('Please enter a player name (at least 2 letters)');
            return;
        }
        if (!newPlayerPin || newPlayerPin.length !== 4 || !/^\d{4}$/.test(newPlayerPin)) {
            setErrorMsg('Please choose a 4-digit PIN (numbers only)');
            return;
        }

        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await fetch('/api/auth/player-login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    name: cleanName,
                    pin: newPlayerPin,
                    avatarUrl: selectedAvatar,
                    nickname: cleanName.split(' ')[0],
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // If there are guest winnings, transfer them to this player
                transferGuestChipsToPlayer(cleanName);
                const currentStats = loadTrackerStatsForPlayer(cleanName);

                fetch('/api/player/academy-profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ name: cleanName, stats: currentStats }),
                }).catch(() => {});

                savePlayerWalkUpTheme(cleanName, selectedTheme);
                localStorage.setItem('ept_active_player_v2', cleanName);
                window.dispatchEvent(new Event('storage'));
                onSuccess(cleanName);
            } else {
                setErrorMsg(data.error || 'Could not register player');
            }
        } catch (err) {
            console.error('Registration error', err);
            setErrorMsg('Could not connect to Firebase server');
        } finally {
            setLoading(false);
        }
    };

    // Guest Mode (Unsaved Session)
    const handleContinueAsGuest = () => {
        localStorage.setItem('ept_active_player_v2', 'Guest Trainee');
        window.dispatchEvent(new Event('storage'));
        onSuccess('Guest Trainee');
    };

    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'OK'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            {/* Background scanlines */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-20 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-lg bg-zinc-900 border-4 border-zinc-800 rounded-none shadow-[0_0_50px_rgba(0,0,0,0.7)] relative overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* 8-bit Header */}
                <div className="bg-black p-4 border-b-4 border-zinc-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-ept-red" />
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter italic leading-none">
                                Locker Authentication
                            </h2>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                E.P.T. Cloud Database & Bankroll Vault
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* 3 Mode Tabs (Roster, New Player, Guest) */}
                <div className="grid grid-cols-3 bg-black/80 border-b-2 border-zinc-800 p-1 gap-1 shrink-0 text-xs font-black uppercase">
                    <button
                        onClick={() => {
                            setActiveTab('roster');
                            setStep('select');
                            setErrorMsg(null);
                        }}
                        className={`py-2 px-2 rounded-none transition flex items-center justify-center gap-1.5 ${
                            activeTab === 'roster'
                                ? 'bg-zinc-800 text-white border-b-2 border-gold shadow'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                        }`}
                    >
                        <Users size={13} />
                        <span className="truncate">Roster</span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab('new-player');
                            setErrorMsg(null);
                        }}
                        className={`py-2 px-2 rounded-none transition flex items-center justify-center gap-1.5 ${
                            activeTab === 'new-player'
                                ? 'bg-zinc-800 text-gold border-b-2 border-gold shadow'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                        }`}
                    >
                        <UserPlus size={13} />
                        <span className="truncate">New Player</span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab('guest');
                            setErrorMsg(null);
                        }}
                        className={`py-2 px-2 rounded-none transition flex items-center justify-center gap-1.5 ${
                            activeTab === 'guest'
                                ? 'bg-zinc-800 text-amber-400 border-b-2 border-amber-400 shadow'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                        }`}
                    >
                        <Eye size={13} />
                        <span className="truncate">Guest</span>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="p-2.5 bg-red-950/80 border border-red-500 text-red-200 text-xs font-bold flex items-center gap-2 animate-shake">
                            <AlertTriangle size={14} className="text-red-400 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* ========================================================
                        TAB 1: EXISTING ROSTER & SAVED PLAYERS
                       ======================================================== */}
                    {activeTab === 'roster' && (
                        <AnimatePresence mode="wait">
                            {step === 'select' ? (
                                <motion.div
                                    key="select"
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 15 }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        <span>Select Your Locker</span>
                                        <span>{players.length} Players</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                        {players.map((player) => (
                                            <button
                                                key={player.name}
                                                onClick={() => {
                                                    setSelectedPlayer(player);
                                                    setSelectedTheme(getPlayerWalkUpTheme(player.name));
                                                    setStep('pin');
                                                    setPin('');
                                                    setErrorMsg(null);
                                                }}
                                                className="flex items-center gap-3.5 p-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 hover:border-gold/50 transition-all group text-left"
                                            >
                                                <img
                                                    src={player.avatarUrl}
                                                    alt={player.name}
                                                    className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-bold text-white uppercase truncate flex items-center gap-2">
                                                        <span>{player.name}</span>
                                                        {player.isCustom && (
                                                            <span className="px-1.5 py-0.2 rounded bg-purple-950 border border-purple-500/50 text-[9px] text-purple-300 font-mono">
                                                                Cloud
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400 font-mono">
                                                        {player.nickname}
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-gold transition-transform group-hover:translate-x-1" />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="pin"
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -15 }}
                                    className="space-y-4"
                                >
                                    <button
                                        onClick={() => {
                                            setStep('select');
                                            setPin('');
                                            setErrorMsg(null);
                                        }}
                                        className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase flex items-center gap-1"
                                    >
                                        <ChevronRight className="w-3 h-3 rotate-180" /> Change Player
                                    </button>

                                    <div className="flex items-center gap-3.5 p-3 bg-black border-2 border-zinc-800">
                                        <img
                                            src={selectedPlayer?.avatarUrl}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover border border-gold"
                                        />
                                        <div>
                                            <div className="text-base font-black text-white uppercase">
                                                {selectedPlayer?.name}
                                            </div>
                                            <div className="text-[10px] text-zinc-400 font-mono">
                                                Enter your 4-digit PIN to unlock bankroll
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Table Walk-Up Anthem Quick Selector */}
                                    <div className="p-2 bg-black/70 border border-white/10 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 text-zinc-300">
                                            <Music size={12} className="text-gold" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Anthem:</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {WALK_UP_THEMES.map(th => (
                                                <button
                                                    key={th.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTheme(th.id);
                                                        if (selectedPlayer) savePlayerWalkUpTheme(selectedPlayer.name, th.id);
                                                        playWalkUpAudio(th.id);
                                                    }}
                                                    className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase transition flex items-center gap-1 ${
                                                        selectedTheme === th.id
                                                            ? 'bg-gold text-black shadow-sm'
                                                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                                    }`}
                                                    title={`Entrance Theme: ${th.name} (${th.desc})`}
                                                >
                                                    <span>{th.icon}</span>
                                                    <span>{th.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 4-digit PIN Display */}
                                    <div className="relative h-14 flex items-center justify-center gap-3 bg-black border-2 border-zinc-800">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                                                    pin.length > i
                                                        ? 'bg-gold border-gold shadow-[0_0_10px_rgba(212,175,55,0.7)]'
                                                        : 'border-zinc-700 bg-transparent'
                                                }`}
                                            />
                                        ))}
                                    </div>

                                    {/* Keypad */}
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {numbers.map((n) => (
                                            <button
                                                key={n}
                                                disabled={loading}
                                                onClick={() => {
                                                    if (n === 'CLR') handleDelete();
                                                    else if (n === 'OK') handleSubmitPin();
                                                    else handleNumberClick(n);
                                                }}
                                                className={`h-11 flex items-center justify-center font-black text-base border transition-all active:scale-95 ${
                                                    n === 'OK'
                                                        ? 'bg-gold text-black border-gold hover:brightness-110'
                                                        : n === 'CLR'
                                                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                                                        : 'bg-zinc-800/80 border-zinc-700 text-white hover:bg-zinc-700'
                                                }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* ========================================================
                        TAB 2: NEW PLAYER ZERO-FRICTION JOIN
                       ======================================================== */}
                    {activeTab === 'new-player' && (
                        <form onSubmit={handleCreateNewPlayer} className="space-y-4">
                            <div className="p-3 bg-black/60 border border-gold/40 space-y-1">
                                <div className="text-xs font-black text-gold uppercase flex items-center gap-1.5">
                                    <Sparkles size={13} />
                                    <span>Zero-Registration Vault Creation</span>
                                </div>
                                <p className="text-[11px] text-zinc-300 leading-snug">
                                    No password or email needed! Just enter your name, pick a 4-digit PIN to secure your locker, and receive an instant £10,000 starting bankroll on Firebase.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                    Your Player Name or Poker Handle
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Dave Smith or ChipCrusher"
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-black border border-white/20 text-white font-bold text-sm focus:border-gold focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                    Choose a 4-Digit Locker PIN (Numbers Only)
                                </label>
                                <input
                                    type="password"
                                    maxLength={4}
                                    required
                                    placeholder="e.g. 1234"
                                    value={newPlayerPin}
                                    onChange={(e) => setNewPlayerPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className="w-full px-3 py-2.5 bg-black border border-white/20 text-white font-mono font-bold text-sm tracking-widest focus:border-gold focus:outline-none"
                                />
                                <span className="text-[9px] text-zinc-500 block">
                                    You will use this 4-digit PIN whenever you return to resume your bankroll.
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                    Pick Your Table Avatar
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {AVAILABLE_AVATARS.map((av) => (
                                        <button
                                            type="button"
                                            key={av.id}
                                            onClick={() => setSelectedAvatar(av.url)}
                                            className={`p-1.5 border transition flex flex-col items-center gap-1 ${
                                                selectedAvatar === av.url
                                                    ? 'bg-gold/20 border-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                                                    : 'bg-black border-white/10 hover:border-white/30'
                                            }`}
                                        >
                                            <img src={av.url} alt={av.label} className="w-10 h-10 object-cover rounded-full" />
                                            <span className="text-[8px] font-mono font-bold text-zinc-400 truncate w-full text-center">
                                                {av.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                        Choose Final Table Walk-Up Anthem
                                    </label>
                                    <span className="text-[9px] text-gold font-mono flex items-center gap-1">
                                        <Volume2 size={10} /> Live Web Audio Hook
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {WALK_UP_THEMES.map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedTheme(t.id);
                                                playWalkUpAudio(t.id);
                                            }}
                                            className={`p-2 border text-left flex items-start gap-2 transition ${
                                                selectedTheme === t.id
                                                    ? 'bg-gold/15 border-gold shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                                                    : 'bg-black border-white/10 hover:border-white/30'
                                            }`}
                                        >
                                            <span className="text-base">{t.icon}</span>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-bold text-white flex items-center justify-between">
                                                    <span>{t.name}</span>
                                                    <Volume2 size={11} className="text-gold opacity-75" />
                                                </div>
                                                <div className="text-[9px] text-zinc-400 leading-tight truncate">
                                                    {t.desc}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
                            >
                                <Sparkles size={14} />
                                <span>{loading ? 'Creating Locker...' : 'Claim £10,000 Bankroll & Enter'}</span>
                            </button>
                        </form>
                    )}

                    {/* ========================================================
                        TAB 3: GUEST MODE (DATA IS NOT SAVED)
                       ======================================================== */}
                    {activeTab === 'guest' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-950/40 border border-amber-500/50 space-y-2">
                                <div className="flex items-center gap-2 text-amber-300 font-black text-sm uppercase">
                                    <Eye size={16} />
                                    <span>Guest Play Mode (Unsaved Session)</span>
                                </div>
                                <p className="text-xs text-zinc-300 leading-relaxed">
                                    You can jump straight into the Arena and play unlimited poker hands against the AI bots with temporary starting chips.
                                </p>
                                <div className="p-2.5 bg-black/60 border border-amber-500/30 text-[11px] text-amber-200/90 space-y-1">
                                    <div className="font-bold flex items-center gap-1 text-amber-300">
                                        <span>⚠️</span> Guest Policy:
                                    </div>
                                    <div>• Your chip balance, hands won, and stats will <strong>NOT</strong> be saved to Firebase or disk.</div>
                                    <div>• You will not appear on the official League Leaderboard.</div>
                                    <div>• When you refresh or leave, your guest session will reset.</div>
                                </div>
                            </div>

                            <button
                                onClick={handleContinueAsGuest}
                                className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 border border-amber-400/60 text-amber-300 font-black uppercase text-xs tracking-wider transition flex items-center justify-center gap-2"
                            >
                                <Eye size={15} />
                                <span>Enter Arena as Guest Trainee →</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Deco */}
                <div className="px-5 py-2.5 bg-black border-t border-zinc-800 flex justify-between items-center text-[9px] font-mono text-zinc-500 shrink-0">
                    <span className="flex items-center gap-1">
                        <Shield size={11} className="text-gold" />
                        <span>Firebase Cloud Sync Active</span>
                    </span>
                    <div className="flex items-center gap-3">
                        <a 
                            href="/admin-update" 
                            onClick={onClose}
                            className="text-zinc-600 hover:text-gold transition uppercase font-bold tracking-wider"
                        >
                            Admin Console
                        </a>
                        <span>•</span>
                        <span>Project: jabb-new</span>
                    </div>
                </div>
            </motion.div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 3;
                }
            `}</style>
        </div>
    );
}
