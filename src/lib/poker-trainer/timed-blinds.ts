export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante?: number;
  durationSeconds?: number; // Optional custom duration for this specific level
}

export type BlindSpeedPreset = 'turbo' | 'regular' | 'deepstack' | 'hyperspeed' | 'custom';

export interface TimedBlindsConfig {
  enabled: boolean;
  preset: BlindSpeedPreset;
  defaultLevelDurationSeconds: number; // Duration per level in seconds
  soundAlerts: boolean;
  levels: BlindLevel[];
}

export interface TimedBlindsState {
  currentLevelIndex: number; // 0-indexed
  secondsRemaining: number;
  isRunning: boolean;
  totalTimeElapsed: number;
}

export const BLIND_SPEED_PRESETS_INFO: Record<
  BlindSpeedPreset,
  {
    name: string;
    description: string;
    defaultSeconds: number;
    badge: string;
  }
> = {
  hyperspeed: {
    name: '30-Second Hyper-Turbo',
    description: 'Fast-paced drill with rapid 30-second blind jumps to practice high-stress tournament dynamics.',
    defaultSeconds: 30,
    badge: '30s',
  },
  turbo: {
    name: '1-Minute Turbo',
    description: 'Quick 1-minute blind levels ideal for snappy training sessions and fast stack adjustments.',
    defaultSeconds: 60,
    badge: '1 Min',
  },
  regular: {
    name: '3-Minute Club Regular',
    description: 'Balanced 3-minute blind structure mirroring typical pub and club tournament rhythms.',
    defaultSeconds: 180,
    badge: '3 Min',
  },
  deepstack: {
    name: '5-Minute Deep Championship',
    description: 'Gentle 5-minute levels providing ample post-flop maneuverability and tactical depth.',
    defaultSeconds: 300,
    badge: '5 Min',
  },
  custom: {
    name: 'Custom Structure',
    description: 'Fully customized blind amounts and durations tailored to your exact home-game rules.',
    defaultSeconds: 120,
    badge: 'Custom',
  },
};

export const DEFAULT_TURBO_LEVELS: BlindLevel[] = [
  { level: 1, smallBlind: 5, bigBlind: 10 },
  { level: 2, smallBlind: 10, bigBlind: 20 },
  { level: 3, smallBlind: 15, bigBlind: 30 },
  { level: 4, smallBlind: 25, bigBlind: 50 },
  { level: 5, smallBlind: 50, bigBlind: 100, ante: 10 },
  { level: 6, smallBlind: 75, bigBlind: 150, ante: 15 },
  { level: 7, smallBlind: 100, bigBlind: 200, ante: 25 },
  { level: 8, smallBlind: 150, bigBlind: 300, ante: 30 },
  { level: 9, smallBlind: 200, bigBlind: 400, ante: 50 },
  { level: 10, smallBlind: 300, bigBlind: 600, ante: 75 },
  { level: 11, smallBlind: 500, bigBlind: 1000, ante: 100 },
  { level: 12, smallBlind: 750, bigBlind: 1500, ante: 150 },
  { level: 13, smallBlind: 1000, bigBlind: 2000, ante: 200 },
];

export const DEFAULT_REGULAR_LEVELS: BlindLevel[] = [
  { level: 1, smallBlind: 5, bigBlind: 10 },
  { level: 2, smallBlind: 10, bigBlind: 20 },
  { level: 3, smallBlind: 15, bigBlind: 30 },
  { level: 4, smallBlind: 20, bigBlind: 40 },
  { level: 5, smallBlind: 25, bigBlind: 50, ante: 5 },
  { level: 6, smallBlind: 35, bigBlind: 70, ante: 10 },
  { level: 7, smallBlind: 50, bigBlind: 100, ante: 15 },
  { level: 8, smallBlind: 75, bigBlind: 150, ante: 20 },
  { level: 9, smallBlind: 100, bigBlind: 200, ante: 25 },
  { level: 10, smallBlind: 150, bigBlind: 300, ante: 40 },
  { level: 11, smallBlind: 200, bigBlind: 400, ante: 50 },
  { level: 12, smallBlind: 300, bigBlind: 600, ante: 75 },
  { level: 13, smallBlind: 500, bigBlind: 1000, ante: 100 },
  { level: 14, smallBlind: 750, bigBlind: 1500, ante: 150 },
  { level: 15, smallBlind: 1000, bigBlind: 2000, ante: 200 },
];

export const DEFAULT_DEEPSTACK_LEVELS: BlindLevel[] = [
  { level: 1, smallBlind: 10, bigBlind: 20 },
  { level: 2, smallBlind: 15, bigBlind: 30 },
  { level: 3, smallBlind: 20, bigBlind: 40 },
  { level: 4, smallBlind: 25, bigBlind: 50 },
  { level: 5, smallBlind: 30, bigBlind: 60 },
  { level: 6, smallBlind: 40, bigBlind: 80 },
  { level: 7, smallBlind: 50, bigBlind: 100, ante: 10 },
  { level: 8, smallBlind: 75, bigBlind: 150, ante: 15 },
  { level: 9, smallBlind: 100, bigBlind: 200, ante: 25 },
  { level: 10, smallBlind: 125, bigBlind: 250, ante: 25 },
  { level: 11, smallBlind: 150, bigBlind: 300, ante: 30 },
  { level: 12, smallBlind: 200, bigBlind: 400, ante: 40 },
  { level: 13, smallBlind: 250, bigBlind: 500, ante: 50 },
  { level: 14, smallBlind: 300, bigBlind: 600, ante: 60 },
  { level: 15, smallBlind: 400, bigBlind: 800, ante: 80 },
  { level: 16, smallBlind: 500, bigBlind: 1000, ante: 100 },
];

export const TIMED_BLINDS_STORAGE_KEY = 'ept_timed_blinds_config_v2';

export function getDefaultTimedBlindsConfig(preset: BlindSpeedPreset = 'turbo'): TimedBlindsConfig {
  let levels = DEFAULT_TURBO_LEVELS;
  let duration = 60;

  if (preset === 'hyperspeed') {
    levels = DEFAULT_TURBO_LEVELS;
    duration = 30;
  } else if (preset === 'regular') {
    levels = DEFAULT_REGULAR_LEVELS;
    duration = 180;
  } else if (preset === 'deepstack') {
    levels = DEFAULT_DEEPSTACK_LEVELS;
    duration = 300;
  }

  return {
    enabled: false,
    preset,
    defaultLevelDurationSeconds: duration,
    soundAlerts: true,
    levels: levels.map((l) => ({ ...l })),
  };
}

export function loadTimedBlindsConfig(): TimedBlindsConfig {
  if (typeof window === 'undefined') return getDefaultTimedBlindsConfig();
  try {
    const raw = localStorage.getItem(TIMED_BLINDS_STORAGE_KEY);
    if (!raw) return getDefaultTimedBlindsConfig();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultTimedBlindsConfig(),
      ...parsed,
      levels: Array.isArray(parsed.levels) && parsed.levels.length > 0
        ? parsed.levels
        : DEFAULT_TURBO_LEVELS,
    };
  } catch {
    return getDefaultTimedBlindsConfig();
  }
}

export function saveTimedBlindsConfig(config: TimedBlindsConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TIMED_BLINDS_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage quota errors
  }
}

export function formatTimeDisplay(totalSeconds: number): string {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  const padMins = mins < 10 ? `0${mins}` : `${mins}`;
  const padSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${padMins}:${padSecs}`;
}

export function playBlindsUpChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Pleasant three-note ascending chime (C5 -> E5 -> G5)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
    osc.frequency.setValueAtTime(1046.5, now + 0.38); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch {
    // Ignore audio policy errors
  }
}
