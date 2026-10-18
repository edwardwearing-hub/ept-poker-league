'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, HeartCrack, Sparkles, X, Shuffle } from 'lucide-react';
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

export function KonamiHighRoller() {
    const { isHighRoller, toggleHighRoller } = useKonamiHighRoller();
    const [bannerMessage, setBannerMessage] = useState<string | null>(null);
    const [showCoinRain, setShowCoinRain] = useState(false);

    useEffect(() => {
        const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let keyIdx = 0;

        const onKeyDown = (e: KeyboardEvent) => {
            const active = (document.activeElement?.tagName || '').toLowerCase();
            if (active === 'input' || active === 'textarea') return;

            const expected = code[keyIdx].toLowerCase();
            const pressed = e.key.toLowerCase();

            if (pressed === expected) {
                keyIdx++;
                if (keyIdx === code.length) {
                    keyIdx = 0;
                    triggerHaptic(50);
                    const nextState = !getKonamiHighRoller();
                    setKonamiHighRollerState(nextState);
                    if (nextState) {
                        playKonamiChiptuneFanfare();
                        setShowCoinRain(true);
                        setTimeout(() => setShowCoinRain(false), 4500);
                    } else {
                        playChimeSuccess();
                    }
                    setBannerMessage(
                        nextState
                            ? '👑 24K Gold High Roller Salon Unlocked! Gold Felts, Obsidian Cards & £5k Plaques Active!'
                            : '🎩 Standard Casino Felt Restored (Konami Mode Off)'
                    );
                    setTimeout(() => setBannerMessage(null), 5500);
                }
            } else {
                keyIdx = pressed === code[0].toLowerCase() ? 1 : 0;
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
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
                    className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#ffd700] via-[#ffe578] to-[#b8860b] text-black font-mono font-black text-[11px] uppercase tracking-wider shadow-[0_0_25px_rgba(255,215,0,0.65)] border-2 border-white/80 hover:scale-105 active:scale-95 transition cursor-pointer"
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


