/**
 * Mobile Haptic Feedback utility for tactile poker interactions
 * (Tab toggles, pin keypad, minigames, fold/call buttons)
 */
export function triggerHaptic(durationMs = 12): void {
    if (typeof window === 'undefined') return;
    try {
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
            navigator.vibrate(durationMs);
        }
    } catch {
        // Silently ignore environments that block or lack vibration
    }
}
