/**
 * Subtle Felt & Chip Audio Micro-Interactions (Web Audio API)
 * Lightweight, zero-asset, procedural micro-sounds with global mute state.
 */

const SFX_STORAGE_KEY = 'ept_sfx_muted';

export function isSfxMuted(): boolean {
    if (typeof window === 'undefined') return true;
    try {
        return localStorage.getItem(SFX_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

export function setSfxMuted(muted: boolean): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(SFX_STORAGE_KEY, muted ? 'true' : 'false');
        window.dispatchEvent(new CustomEvent('ept_sfx_mute_changed', { detail: { muted } }));
    } catch {}
}

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtxClass) return null;
        const ctx = new AudioCtxClass();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    } catch {
        return null;
    }
}

/**
 * Crisp, muted clay tournament chip clack
 */
export function playChipClack(): void {
    if (isSfxMuted()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.Q.setValueAtTime(3, now);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    } catch {}
}

/**
 * Soft card slide / flick across speed cloth felt
 */
export function playCardSlide(): void {
    if (isSfxMuted()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;
        const bufferSize = ctx.sampleRate * 0.06;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(2200, now + 0.05);
        filter.Q.setValueAtTime(1.5, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.065);
    } catch {}
}

/**
 * Subtle pleasant two-tone confirmation
 */
export function playChimeSuccess(): void {
    if (isSfxMuted()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;
        [587.33, 880].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.12, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.3);
        });
    } catch {}
}
