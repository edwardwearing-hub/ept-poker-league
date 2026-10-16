export type WalkUpTheme = 'gladiator' | 'cyberpunk' | 'casino' | 'rock';

export interface ThemeOption {
    id: WalkUpTheme;
    name: string;
    icon: string;
    desc: string;
}

export const WALK_UP_THEMES: ThemeOption[] = [
    { id: 'gladiator', name: 'Gladiator', icon: '⚔️', desc: 'Brass brass fanfare with triumphant stadium chord' },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: '⚡', desc: 'Deep sub-bass laser sweep with futuristic resonance' },
    { id: 'casino', name: 'Casino Royale', icon: '🎰', desc: 'Bright crystalline arpeggio like a high-roller payout' },
    { id: 'rock', name: 'Rock Arena', icon: '🎸', desc: 'Heavy distorted square-wave power chord' },
];

export const DEFAULT_PLAYER_THEMES: Record<string, WalkUpTheme> = {
    'Liam Duxbury': 'gladiator',
    'Edward Wearing': 'rock',
    'Luke Daly': 'cyberpunk',
    'Dave Blackburn': 'casino',
};

export function getPlayerWalkUpTheme(playerName?: string): WalkUpTheme {
    if (typeof window === 'undefined') return 'gladiator';
    if (!playerName) return 'gladiator';

    try {
        const direct = localStorage.getItem(`ept_walkup_theme_${playerName}`);
        if (direct && ['gladiator', 'cyberpunk', 'casino', 'rock'].includes(direct)) {
            return direct as WalkUpTheme;
        }

        const mapRaw = localStorage.getItem('ept_player_walkup_themes');
        if (mapRaw) {
            const map = JSON.parse(mapRaw);
            if (map[playerName] && ['gladiator', 'cyberpunk', 'casino', 'rock'].includes(map[playerName])) {
                return map[playerName];
            }
        }
    } catch {}

    return DEFAULT_PLAYER_THEMES[playerName] || 'gladiator';
}

export function savePlayerWalkUpTheme(playerName: string, theme: WalkUpTheme): void {
    if (typeof window === 'undefined' || !playerName) return;
    try {
        localStorage.setItem(`ept_walkup_theme_${playerName}`, theme);
        const mapRaw = localStorage.getItem('ept_player_walkup_themes');
        const map = mapRaw ? JSON.parse(mapRaw) : { ...DEFAULT_PLAYER_THEMES };
        map[playerName] = theme;
        localStorage.setItem('ept_player_walkup_themes', JSON.stringify(map));
        window.dispatchEvent(new CustomEvent('ept_theme_changed', { detail: { playerName, theme } }));
    } catch {}
}

export function playWalkUpAudio(theme: WalkUpTheme): void {
    if (typeof window === 'undefined') return;
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;

        if (theme === 'gladiator') {
            [440, 554.37, 659.25, 880].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                gain.gain.setValueAtTime(0.22, now + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.12);
                osc.stop(now + 1.8);
            });
        } else if (theme === 'cyberpunk') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 1.2);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 1.5);
        } else if (theme === 'casino') {
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                gain.gain.setValueAtTime(0.25, now + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.1);
                osc.stop(now + 1.6);
            });
        } else {
            // Rock theme
            [110, 164.81, 220].forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 1.4);
            });
        }
    } catch {}
}
