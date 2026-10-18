/**
 * VegasHaptics.ts
 * Cross-platform mobile tactile haptic feedback using the Web Vibration API (navigator.vibrate).
 * Provides distinct physical vibration patterns for reels, card flicks, chip drops, and win celebrations.
 */

export type HapticType =
  | 'tick'        // Ultra-light 8ms pulse for reel ticks, nudges, wheel steps
  | 'deal'        // Crisp 15ms tap for card deals and chip placing
  | 'hold'        // 20ms click for reel holds
  | 'step'        // 18ms pulse when token walks board squares
  | 'nudge'       // 25ms thud when reel nudges downward
  | 'anticipation'// Rapid low-frequency vibration sequence for suspense reels
  | 'win'         // Double-tap celebratory pattern for standard wins
  | 'big_win'     // Heavy crescendo pattern for Big/Mega wins
  | 'jackpot'     // Deep resonant rumble for major jackpots
  | 'bust';       // Heavy dual buzz on wipeout or bust

export const triggerHaptic = (type: HapticType): void => {
  if (typeof window === 'undefined') return;
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') return;

  try {
    switch (type) {
      case 'tick':
        navigator.vibrate(8);
        break;
      case 'deal':
        navigator.vibrate(15);
        break;
      case 'hold':
        navigator.vibrate(22);
        break;
      case 'step':
        navigator.vibrate(18);
        break;
      case 'nudge':
        navigator.vibrate(28);
        break;
      case 'anticipation':
        navigator.vibrate([15, 40, 15, 40, 20]);
        break;
      case 'win':
        navigator.vibrate([30, 40, 60]);
        break;
      case 'big_win':
        navigator.vibrate([40, 30, 60, 40, 100]);
        break;
      case 'jackpot':
        navigator.vibrate([60, 40, 100, 50, 180, 50, 250]);
        break;
      case 'bust':
        navigator.vibrate([100, 60, 140]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Ignore unsupported browser permission rejections
  }
};
