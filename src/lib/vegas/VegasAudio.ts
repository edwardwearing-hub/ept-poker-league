/**
 * Vegas Procedural Audio Engine
 * Uses the Web Audio API to synthesize realistic casino sound effects
 * (cards, chips, dice, roulette ticks, slot reels, win chimes)
 * with zero external asset dependencies or latency.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const SOUND_STORAGE_KEY = 'ept_vegas_sound_enabled';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(SOUND_STORAGE_KEY);
  if (stored === null) return true; // Default ON
  return stored === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('ept_vegas_sound_change', { detail: enabled }));
}

function isKonamiHighRollerActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      document.documentElement.classList.contains('konami-high-roller') ||
      localStorage.getItem('ept_konami_high_roller_v1') === 'true'
    );
  } catch {
    return false;
  }
}

/**
 * Ceramic Casino Chip Clink (with 8-bit Gold Coin ring in Konami High Roller Mode)
 */
export function playChipSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (isKonamiHighRollerActive()) {
    // 8-Bit Arcade Gold Coin Chime (B5 -> E6)
    [987.77, 1318.51].forEach((freq, idx) => {
      const t = now + idx * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    });
    return;
  }

  // Dual tone ceramic resonance
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(2200, now);
  osc1.frequency.exponentialRampToValueAtTime(800, now + 0.04);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(4400, now);
  osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.03);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.05);
  osc2.stop(now + 0.05);
}

/**
 * Card Slide / Snap from Shoe
 */
export function playCardSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.05; // 50ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1400, now);
  filter.Q.setValueAtTime(3.0, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
}

/**
 * Dice Rattle / Wooden Table Bounce
 */
export function playDiceSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const taps = [0, 0.04, 0.09, 0.15];

  taps.forEach((delay, idx) => {
    const tapTime = now + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = 180 + Math.random() * 120 + idx * 30;
    osc.frequency.setValueAtTime(freq, tapTime);
    osc.frequency.exponentialRampToValueAtTime(60, tapTime + 0.03);

    const vol = 0.25 / (idx + 1);
    gain.gain.setValueAtTime(vol, tapTime);
    gain.gain.exponentialRampToValueAtTime(0.001, tapTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(tapTime);
    osc.stop(tapTime + 0.04);
  });
}

/**
 * Roulette Wheel Frets Tick
 */
export function playWheelTick(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.015);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.02);
}

/**
 * Slot Reel Mechanical Tick
 */
export function playSlotTick(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.025);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.03);
}

/**
 * Slot Reel Mechanical Latch / Stop
 */
export function playSlotStop(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Heavy low thud
  const thud = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(160, now);
  thud.frequency.exponentialRampToValueAtTime(45, now + 0.08);

  thudGain.gain.setValueAtTime(0.35, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  thud.connect(thudGain);
  thudGain.connect(ctx.destination);
  thud.start(now);
  thud.stop(now + 0.09);

  // Metal click snap
  const snap = ctx.createOscillator();
  const snapGain = ctx.createGain();
  snap.type = 'square';
  snap.frequency.setValueAtTime(880, now);
  snap.frequency.exponentialRampToValueAtTime(220, now + 0.04);

  snapGain.gain.setValueAtTime(0.15, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  snap.connect(snapGain);
  snapGain.connect(ctx.destination);
  snap.start(now);
  snap.stop(now + 0.05);
}

/**
 * Win Arpeggio Chime (8-Bit Arcade Victory Arpeggio in Konami High Roller Mode)
 */
export function playWinSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const highRoller = isKonamiHighRollerActive();
  const notes = highRoller
    ? [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98] // 6-note 8-bit fanfare
    : [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, idx) => {
    const step = highRoller ? 0.065 : 0.09;
    const noteTime = now + idx * step;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = highRoller ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(highRoller ? 0.12 : 0.2, noteTime);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.35);
  });
}

/**
 * Big Win / Jackpot Celebration Cascade
 */
export function playJackpotSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const fanfare = [
    { f: 523.25, d: 0.1 },
    { f: 659.25, d: 0.1 },
    { f: 783.99, d: 0.1 },
    { f: 1046.5, d: 0.2 },
    { f: 880.0, d: 0.1 },
    { f: 1046.5, d: 0.1 },
    { f: 1318.51, d: 0.4 },
  ];

  let cumulativeTime = 0;
  fanfare.forEach((n) => {
    const t = now + cumulativeTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(n.f, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + n.d * 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + n.d * 1.5);
    cumulativeTime += n.d;
  });
}

/**
 * British Pub Fruity - Metallic 50p/£1 Coin Drop in Coin Mech
 */
export function playPubCoinDrop(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const clicks = [0, 0.05, 0.11, 0.16];
  clicks.forEach((delay, idx) => {
    const t = now + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(3200 + idx * 400, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.03);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  });
}

/**
 * British Pub Fruity - Pulsing "HOLD ME!" Two-Tone Beep
 */
export function playPubHoldBeep(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.setValueAtTime(1174.66, now + 0.06);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.12);
}

/**
 * British Pub Fruity - Mechanical Reel Nudge Thud
 */
export function playPubNudgeThud(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.06);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.07);
}

/**
 * British Pub Fruity - Hi-Lo Step Up or Buzzer
 */
export function playPubHiLoBeep(win: boolean): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  if (win) {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.1); // E6
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  } else {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.25);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + (win ? 0.18 : 0.25));
}

/**
 * British Pub Fruity - Feature Board Activation Fanfare
 */
export function playPubFeatureFanfare(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
  notes.forEach((freq, idx) => {
    const t = now + idx * 0.06;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  });
}

