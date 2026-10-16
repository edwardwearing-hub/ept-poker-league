export interface VegasHistoryItem {
  id: string;
  gameId: string;
  headline: string;
  detail: string;
  delta: number; // >0 win, <0 loss, 0 push/neutral
  badge?: string;
  timestamp: string;
}

const HISTORY_KEY_PREFIX = 'ept_vegas_history_';

export function getGameHistory(gameId: string): VegasHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(`${HISTORY_KEY_PREFIX}${gameId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addGameHistory(item: Omit<VegasHistoryItem, 'id' | 'timestamp'>): VegasHistoryItem {
  const fullItem: VegasHistoryItem = {
    ...item,
    id: `vh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  if (typeof window !== 'undefined') {
    try {
      const current = getGameHistory(item.gameId);
      const updated = [fullItem, ...current].slice(0, 50); // Keep last 50 events
      sessionStorage.setItem(`${HISTORY_KEY_PREFIX}${item.gameId}`, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('vegas_history_updated', {
          detail: { gameId: item.gameId, item: fullItem, all: updated },
        })
      );
    } catch {
      // ignore
    }
  }

  return fullItem;
}

export function clearGameHistory(gameId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`${HISTORY_KEY_PREFIX}${gameId}`);
    window.dispatchEvent(
      new CustomEvent('vegas_history_updated', {
        detail: { gameId, item: null, all: [] },
      })
    );
  } catch {
    // ignore
  }
}
