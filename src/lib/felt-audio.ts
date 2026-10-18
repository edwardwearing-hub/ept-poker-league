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

/**
 * Classic 8-Bit Arcade Chiptune Fanfare when Konami Code is unlocked
 */
export function playKonamiChiptuneFanfare(): void {
    if (isSfxMuted()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;
        // 8-bit power-up melody + final triumphant chord
        const melody = [
            { f: 523.25, t: 0.0, d: 0.07 },   // C5
            { f: 659.25, t: 0.07, d: 0.07 },  // E5
            { f: 783.99, t: 0.14, d: 0.07 },  // G5
            { f: 1046.50, t: 0.21, d: 0.11 }, // C6
            { f: 783.99, t: 0.32, d: 0.07 },  // G5
            { f: 1046.50, t: 0.39, d: 0.09 }, // C6
            { f: 1318.51, t: 0.48, d: 0.09 }, // E6
            { f: 1567.98, t: 0.57, d: 0.11 }, // G6
            { f: 2093.00, t: 0.68, d: 0.42 }, // C7
        ];

        melody.forEach((note) => {
            const osc = ctx.createOscillator();
            const harmony = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(note.f, now + note.t);

            harmony.type = 'triangle';
            harmony.frequency.setValueAtTime(note.f * 0.5, now + note.t);

            gain.gain.setValueAtTime(0.11, now + note.t);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d * 1.25);

            osc.connect(gain);
            harmony.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + note.t);
            harmony.start(now + note.t);
            osc.stop(now + note.t + note.d * 1.3);
            harmony.stop(now + note.t + note.d * 1.3);
        });
    } catch {}
}

