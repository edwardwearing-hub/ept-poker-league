'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, HeartCrack, Sparkles, X, Shuffle, Gamepad2 } from 'lucide-react';
import { isSfxMuted, setSfxMuted, playChipClack, playChimeSuccess, playKonamiChiptuneFanfare } from '@/lib/felt-audio';
import { triggerHaptic } from '@/lib/haptics';

const BAD_BEAT_QUOTES = [
    "The river is a cruel mistress. Go grab a cold drink and reload.",
    "Variance is just luck in an ill-fitting suit. Don't check-raise the turn next time.",
    "Phil Hellmuth once swore at an entire casino over less. Take a breath.",
    "Statistically speaking, that 2-outer hits 4.3% of the time. You found the 4.3%.",
    "Did you get it in good? That's tournament poker, baby.",
    "Host Ruling: Highly unfortunate, but chips are strictly non-refundable.",
    "Remember: You only lost the hand, not your dignity (well, maybe a little).",
    "May your next pocket rockets crack someone else's flopped set."
];

export function SfxToggle() {
    const [muted, setMuted] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setMuted(isSfxMuted());

        const handleMuteChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail && typeof detail.muted === 'boolean') {
                setMuted(detail.muted);
            }
        };

        window.addEventListener('ept_sfx_mute_changed', handleMuteChange);
        return () => window.removeEventListener('ept_sfx_mute_changed', handleMuteChange);
    }, []);

    const toggle = () => {
        triggerHaptic(12);
        const next = !muted;
        setMuted(next);
        setSfxMuted(next);
        if (!next) {
            playChipClack();
        }
    };

    if (!mounted) return null;

    return (
        <button
            onClick={toggle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-gold/40 bg-zinc-900/80 text-zinc-400 hover:text-gold text-xs transition active:scale-95"
            title={muted ? 'Unmute Felt Sound Effects' : 'Mute Felt Sound Effects'}
            aria-label="Toggle SFX"
        >
            {muted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-green-400" />}
            <span className="font-mono text-[11px]">{muted ? 'Felt SFX: Muted' : 'Felt SFX: Active'}</span>
        </button>
    );
}

export function BadBeatReportButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);

    const openModal = () => {
        triggerHaptic(20);
        playChipClack();
        setQuoteIndex(Math.floor(Math.random() * BAD_BEAT_QUOTES.length));
        setIsOpen(true);
    };

    const nextQuote = () => {
        triggerHaptic(10);
        playChipClack();
        setQuoteIndex(prev => (prev + 1) % BAD_BEAT_QUOTES.length);
    };

    return (
        <>
            <button
                onClick={openModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-500/60 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs transition active:scale-95"
                title="Report a Bad Beat"
            >
                <HeartCrack size={14} className="text-red-400" />
                <span className="font-mono text-[11px]">Bad Beat Hotline</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-zinc-950 border-2 border-red-500/40 rounded-3xl p-6 text-center relative shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        <div className="w-12 h-12 rounded-2xl bg-red-950/50 border border-red-500/50 flex items-center justify-center mx-auto mb-4 text-red-400">
                            <HeartCrack size={24} />
                        </div>

                        <h3 className="text-lg font-black uppercase tracking-wider text-white mb-1">
                            Bad Beat Support Unit
                        </h3>
                        <p className="text-xs text-red-400 font-mono mb-4">
                            Triage Reference: #RIVER-SUCKOUT
                        </p>

                        <div className="bg-black/60 border border-white/10 rounded-2xl p-4 mb-6 min-h-[90px] flex items-center justify-center">
                            <p className="text-sm text-zinc-200 italic font-serif leading-relaxed">
                                &ldquo;{BAD_BEAT_QUOTES[quoteIndex]}&rdquo;
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={nextQuote}
                                className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/30 text-xs font-bold text-zinc-300 flex items-center justify-center gap-1.5 transition active:scale-95"
                            >
                                <Shuffle size={14} /> Another Dose
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                            >
                                I Feel Slightly Better
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const KONAMI_STORAGE_KEY = 'ept_konami_high_roller_v1';

export function getKonamiHighRoller(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem(KONAMI_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

export function setKonamiHighRollerState(active: boolean) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(KONAMI_STORAGE_KEY, String(active));
    } catch {
        // ignore storage errors
    }
    document.documentElement.classList.toggle('konami-high-roller', active);
    window.dispatchEvent(
        new CustomEvent('ept_konami_high_roller_changed', { detail: { active } })
    );
}

export function useKonamiHighRoller() {
    const [isHighRoller, setIsHighRoller] = useState(false);

    useEffect(() => {
        const initial = getKonamiHighRoller();
        setIsHighRoller(initial);
        document.documentElement.classList.toggle('konami-high-roller', initial);

        const handleChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail && typeof detail.active === 'boolean') {
                setIsHighRoller(detail.active);
            } else {
                setIsHighRoller(getKonamiHighRoller());
            }
        };

        window.addEventListener('ept_konami_high_roller_changed', handleChange);
        return () => window.removeEventListener('ept_konami_high_roller_changed', handleChange);
    }, []);

    const toggleHighRoller = () => {
        const next = !getKonamiHighRoller();
        setKonamiHighRollerState(next);
        setIsHighRoller(next);
        return next;
    };

    return { isHighRoller, toggleHighRoller, setHighRoller: setKonamiHighRollerState };
}

const COIN_PARTICLES = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    left: `${(i * 3.1 + (i % 3) * 1.7) % 98}%`,
    delay: `${(i % 8) * 0.14}s`,
    duration: `${2.2 + (i % 5) * 0.35}s`,
    symbol: i % 4 === 0 ? '👑' : i % 2 === 0 ? '🪙' : '✨',
}));

const KONAMI_SEQUENCE = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
];

const KONAMI_LABELS = ['↑', '↑', '↓', '↓', '←', '→', '←', '→', 'B', 'A'];

export function triggerKonamiCelebrationToggle() {
    triggerHaptic(50);
    const nextState = !getKonamiHighRoller();
    setKonamiHighRollerState(nextState);
    if (nextState) {
        playKonamiChiptuneFanfare();
    } else {
        playChimeSuccess();
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent('ept_konami_celebrate', { detail: { active: nextState } })
        );
    }
    return nextState;
}

export function KonamiArcadePadButton() {
    const { isHighRoller } = useKonamiHighRoller();
    const [isOpen, setIsOpen] = useState(false);
    const [enteredKeys, setEnteredKeys] = useState<{ key: string; label: string }[]>([]);
    const [errorShake, setErrorShake] = useState(false);

    const handlePadInput = (inputKey: string, displayLabel: string) => {
        triggerHaptic(18);
        playChipClack();
        setErrorShake(false);

        const nextBuffer = [...enteredKeys, { key: inputKey, label: displayLabel }];

        if (nextBuffer.length === KONAMI_SEQUENCE.length) {
            const isMatch = nextBuffer.every(
                (item, idx) => item.key.toLowerCase() === KONAMI_SEQUENCE[idx].toLowerCase()
            );
            if (isMatch) {
                setEnteredKeys([]);
                setIsOpen(false);
                triggerKonamiCelebrationToggle();
            } else {
                triggerHaptic(40);
                setEnteredKeys(nextBuffer);
                setErrorShake(true);
                setTimeout(() => {
                    setEnteredKeys([]);
                    setErrorShake(false);
                }, 650);
            }
        } else {
            setEnteredKeys(nextBuffer);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    triggerHaptic(15);
                    playChipClack();
                    setEnteredKeys([]);
                    setErrorShake(false);
                    setIsOpen(true);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition active:scale-95 cursor-pointer ${
                    isHighRoller
                        ? 'border-[#ffd700] bg-[#ffd700]/15 text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.3)]'
                        : 'border-amber-500/30 hover:border-gold/60 bg-amber-950/20 hover:bg-amber-950/40 text-amber-300'
                }`}
                title="Open E.P.T. Arcade Vault Controller"
            >
                <Gamepad2 size={14} className={isHighRoller ? 'text-[#ffd700]' : 'text-amber-400'} />
                <span className="font-mono text-[11px]">
                    {isHighRoller ? '👑 VIP Pad: ON' : '🕹️ Arcade Pad'}
                </span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-zinc-950 border-2 border-gold/60 rounded-3xl p-5 text-center relative shadow-[0_0_50px_rgba(212,175,55,0.35)]">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        <div className="text-[10px] font-mono font-black uppercase tracking-widest text-gold mb-1">
                            🕹️ E.P.T. Retro Arcade Pad
                        </div>
                        <h3 className="text-base font-black uppercase tracking-wider text-white mb-1.5">
                            Vault Override Sequence
                        </h3>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-gold/10 border border-gold/30 text-[11px] font-mono text-gold">
                            <span>💡 Clue:</span>
                            <span className="font-bold text-white">Legendary 8-bit cheat code</span>
                        </div>

                        {/* 10-Slot Encrypted Input Display (No Spoilers!) */}
                        <div
                            className={`flex items-center justify-center gap-1 mb-3 bg-black/90 border rounded-xl p-2 transition-colors ${
                                errorShake
                                    ? 'border-red-500 bg-red-950/40 animate-pulse'
                                    : 'border-white/10'
                            }`}
                        >
                            {Array.from({ length: 10 }).map((_, idx) => {
                                const entry = enteredKeys[idx];
                                const isCurrent = idx === enteredKeys.length;
                                return (
                                    <span
                                        key={idx}
                                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md font-mono text-[10px] sm:text-xs font-black flex items-center justify-center border transition-all ${
                                            errorShake
                                                ? 'bg-red-600/30 text-red-300 border-red-500'
                                                : entry
                                                ? 'bg-gold/25 text-[#ffd700] border-gold shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                                                : isCurrent
                                                ? 'bg-zinc-900 text-gold/70 border-gold/50 animate-pulse'
                                                : 'bg-zinc-900/80 text-zinc-600 border-white/10'
                                        }`}
                                    >
                                        {entry ? entry.label : '•'}
                                    </span>
                                );
                            })}
                        </div>

                        {/* Top L1 / L2 & R1 / R2 Shoulder Triggers */}
                        <div className="grid grid-cols-4 gap-2 mb-2">
                            {[
                                { k: 'l1', l: 'L1' },
                                { k: 'l2', l: 'L2' },
                                { k: 'r2', l: 'R2' },
                                { k: 'r1', l: 'R1' },
                            ].map((btn) => (
                                <button
                                    key={btn.k}
                                    type="button"
                                    onClick={() => handlePadInput(btn.k, btn.l)}
                                    className="py-1.5 rounded-t-xl rounded-b-md bg-gradient-to-b from-zinc-700 to-zinc-900 hover:from-zinc-600 active:bg-gold active:text-black border border-white/20 text-zinc-200 font-mono font-black text-[11px] shadow active:scale-95 transition cursor-pointer"
                                >
                                    {btn.l}
                                </button>
                            ))}
                        </div>

                        {/* Main Controller Body: D-Pad (Left) + 6-Button Arcade Cluster X/Y/Z & A/B/C (Right) */}
                        <div className="flex flex-col gap-3 px-3 py-3.5 bg-gradient-to-b from-zinc-900 to-black rounded-2xl border border-white/15 shadow-inner">
                            <div className="flex items-center justify-between gap-3">
                                {/* 4-Way D-PAD */}
                                <div className="grid grid-cols-3 gap-1 w-28 h-28 shrink-0">
                                    <div />
                                    <button
                                        type="button"
                                        onClick={() => handlePadInput('ArrowUp', '↑')}
                                        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-gold active:text-black border border-white/20 text-white font-black text-sm flex items-center justify-center shadow active:scale-95 transition cursor-pointer"
                                    >
                                        ↑
                                    </button>
                                    <div />
                                    <button
                                        type="button"
                                        onClick={() => handlePadInput('ArrowLeft', '←')}
                                        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-gold active:text-black border border-white/20 text-white font-black text-sm flex items-center justify-center shadow active:scale-95 transition cursor-pointer"
                                    >
                                        ←
                                    </button>
                                    <div className="rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-zinc-800" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handlePadInput('ArrowRight', '→')}
                                        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-gold active:text-black border border-white/20 text-white font-black text-sm flex items-center justify-center shadow active:scale-95 transition cursor-pointer"
                                    >
                                        →
                                    </button>
                                    <div />
                                    <button
                                        type="button"
                                        onClick={() => handlePadInput('ArrowDown', '↓')}
                                        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-gold active:text-black border border-white/20 text-white font-black text-sm flex items-center justify-center shadow active:scale-95 transition cursor-pointer"
                                    >
                                        ↓
                                    </button>
                                    <div />
                                </div>

                                {/* 6-Button Arcade Cluster (X, Y, Z top row / A, B, C bottom row) */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { k: 'x', l: 'X', color: 'from-sky-500 to-blue-700 border-sky-300' },
                                        { k: 'y', l: 'Y', color: 'from-amber-400 to-amber-600 border-amber-200 text-black' },
                                        { k: 'z', l: 'Z', color: 'from-purple-500 to-indigo-700 border-purple-300' },
                                        { k: 'a', l: 'A', color: 'from-red-500 to-red-700 border-red-300' },
                                        { k: 'b', l: 'B', color: 'from-emerald-500 to-green-700 border-emerald-300' },
                                        { k: 'c', l: 'C', color: 'from-rose-500 to-pink-700 border-rose-300' },
                                    ].map((btn) => (
                                        <button
                                            key={btn.k}
                                            type="button"
                                            onClick={() => handlePadInput(btn.k, btn.l)}
                                            className={`w-11 h-11 rounded-full bg-gradient-to-b ${btn.color} hover:brightness-110 active:scale-90 border-2 text-white font-mono font-black text-sm shadow-lg flex items-center justify-center cursor-pointer`}
                                        >
                                            {btn.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Center System Bar: SELECT, START, and CLEAR */}
                            <div className="flex items-center justify-center gap-2.5 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => handlePadInput('select', 'SEL')}
                                    className="px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-white/20 text-[10px] font-mono font-black text-zinc-300 uppercase tracking-wider cursor-pointer"
                                >
                                    SELECT
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePadInput('start', 'STR')}
                                    className="px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-white/20 text-[10px] font-mono font-black text-zinc-300 uppercase tracking-wider cursor-pointer"
                                >
                                    START
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic(10);
                                        setEnteredKeys([]);
                                        setErrorShake(false);
                                    }}
                                    className="px-2.5 py-1 rounded-full bg-red-950/50 hover:bg-red-900/60 active:scale-95 border border-red-500/40 text-[10px] font-mono font-bold text-red-300 uppercase tracking-wider cursor-pointer"
                                >
                                    RESET
                                </button>
                            </div>
                        </div>

                        <p className="text-[10px] text-zinc-500 font-mono mt-3">
                            {errorShake
                                ? '❌ INVALID 10-KEY SEQUENCE — BUFFER RESET'
                                : `ENTER 10-KEY CLASSIFIED CODE (${enteredKeys.length}/10)`}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

export function KonamiHighRoller() {
    const { isHighRoller, toggleHighRoller } = useKonamiHighRoller();
    const [bannerMessage, setBannerMessage] = useState<string | null>(null);
    const [showCoinRain, setShowCoinRain] = useState(false);

    useEffect(() => {
        let keyIdx = 0;

        const onKeyDown = (e: KeyboardEvent) => {
            const active = (document.activeElement?.tagName || '').toLowerCase();
            if (active === 'input' || active === 'textarea') return;

            const expected = KONAMI_SEQUENCE[keyIdx].toLowerCase();
            const pressed = e.key.toLowerCase();

            if (pressed === expected) {
                keyIdx++;
                if (keyIdx === KONAMI_SEQUENCE.length) {
                    keyIdx = 0;
                    triggerKonamiCelebrationToggle();
                }
            } else {
                keyIdx = pressed === KONAMI_SEQUENCE[0].toLowerCase() ? 1 : 0;
            }
        };

        const onCelebrate = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const nextState = detail?.active ?? getKonamiHighRoller();
            if (nextState) {
                setShowCoinRain(true);
                setTimeout(() => setShowCoinRain(false), 4500);
            }
            setBannerMessage(
                nextState
                    ? '👑 24K Gold High Roller Salon Unlocked! Gold Felts, Obsidian Cards & £5k Plaques Active!'
                    : '🎩 Standard Casino Felt Restored (Konami Mode Off)'
            );
            setTimeout(() => setBannerMessage(null), 5500);
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('ept_konami_celebrate', onCelebrate);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('ept_konami_celebrate', onCelebrate);
        };
    }, []);

    return (
        <>
            {/* 24K Gold Coin & Crown Shower when Konami Code is unlocked */}
            {showCoinRain && (
                <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
                    <style>{`
                        @keyframes konamiCoinFall {
                            0% { transform: translateY(-10vh) rotate(0deg) scale(0.8); opacity: 1; }
                            80% { opacity: 1; }
                            100% { transform: translateY(108vh) rotate(720deg) scale(1.15); opacity: 0; }
                        }
                    `}</style>
                    {COIN_PARTICLES.map((p) => (
                        <div
                            key={p.id}
                            style={{
                                left: p.left,
                                animation: `konamiCoinFall ${p.duration} ease-in ${p.delay} forwards`,
                            }}
                            className="absolute -top-8 text-2xl sm:text-3xl drop-shadow-[0_0_12px_rgba(255,215,0,0.9)] select-none"
                        >
                            {p.symbol}
                        </div>
                    ))}
                </div>
            )}

            {isHighRoller && (
                <button
                    onClick={() => {
                        triggerHaptic(20);
                        playChipClack();
                        const next = toggleHighRoller();
                        setBannerMessage(
                            next
                                ? '👑 24K Gold High Roller Felt Mode Active!'
                                : '🎩 Standard Casino Felt Restored'
                        );
                        setTimeout(() => setBannerMessage(null), 3500);
                    }}
                    className="fixed bottom-20 md:bottom-4 right-4 z-40 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#ffd700] via-[#ffe578] to-[#b8860b] text-black font-mono font-black text-[11px] uppercase tracking-wider shadow-[0_0_25px_rgba(255,215,0,0.65)] border-2 border-white/80 hover:scale-105 active:scale-95 transition cursor-pointer"
                    title="Click to toggle 24K Gold High Roller Mode (Konami Code)"
                >
                    <Sparkles size={13} className="text-black" />
                    <span>👑 24K Gold Felt: ON</span>
                </button>
            )}

            {bannerMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 text-black px-6 py-3.5 rounded-2xl shadow-[0_0_50px_rgba(255,215,0,0.9)] border-2 border-white flex items-center gap-3 animate-bounce">
                    <Sparkles size={20} className="text-black shrink-0" />
                    <div className="font-black text-xs sm:text-sm uppercase tracking-widest font-mono">
                        {bannerMessage}
                    </div>
                </div>
            )}
        </>
    );
}



