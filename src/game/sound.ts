// Web Audio API Synthesizer for Casino & Syndicate Sound Effects
// Generates responsive, zero-latency retro/modern casino sound effects without external audio files.

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
    audioCtx.resume();
  }
  return audioCtx;
}

export const playSound = {
  // Soft, satisfying poker chip stack clink
  chip: (enabled = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400 + Math.random() * 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  },

  // Snappy card slide / dealing tick
  card: (enabled = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.065);
  },

  // Crisp chip slide / bet placement click
  betPlaced: (enabled = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.055);
  },

  // Two-tone bell cash register ding
  cash: (enabled = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    [1567.98, 2093.00].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.05));

      gain.gain.setValueAtTime(0.25, ctx.currentTime + (i * 0.05));
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35 + (i * 0.05));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + (i * 0.05));
      osc.stop(ctx.currentTime + 0.4 + (i * 0.05));
    });
  },

  // Ascending 3-tone level-up chime
  levelUp: (enabled = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.06));

      gain.gain.setValueAtTime(0.2, ctx.currentTime + (i * 0.06));
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25 + (i * 0.06));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + (i * 0.06));
      osc.stop(ctx.currentTime + 0.3 + (i * 0.06));
    });
  },

  // Big Jackpot / Blackjack Trumpet Fanfare
  jackpot: (enabled = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.07));

      gain.gain.setValueAtTime(0.2, ctx.currentTime + (i * 0.07));
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6 + (i * 0.07));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + (i * 0.07));
      osc.stop(ctx.currentTime + 0.7 + (i * 0.07));
    });
  },

  // Police raid alert siren
  raid: (enabled = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  },
};
