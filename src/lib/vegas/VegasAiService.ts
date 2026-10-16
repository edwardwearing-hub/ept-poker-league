/**
 * Vegas AI Dealer Service
 * Communicates with /api/vegas/dealer-ai (powered by Google Gemini 2.5 Flash)
 * to provide real-time, personalized, contextual croupier dialogue.
 */

export interface DealerEventPayload {
  game: string;
  playerName?: string;
  eventType:
    | 'welcome'
    | 'bet_placed'
    | 'spin_win'
    | 'spin_loss'
    | 'spin_push'
    | 'big_win'
    | 'streak_win'
    | 'streak_loss'
    | 'double_down'
    | 'custom';
  wager?: number;
  result?: string | number;
  color?: string;
  netDelta?: number;
  sessionNet?: number;
  streakCount?: number;
}

export async function fetchDealerComment(payload: DealerEventPayload): Promise<string> {
  try {
    const res = await fetch('/api/vegas/dealer-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Dealer AI error: status ${res.status}`);
    }

    const data = await res.json();
    return data.comment || 'Place your chips upon the felt, darling!';
  } catch (err) {
    console.error('Dealer AI fetch failed:', err);
    // Instant fallback
    if (payload.eventType === 'spin_win' || payload.eventType === 'big_win') {
      return "Magnificent hit, darling! The house pays out with pleasure.";
    }
    if (payload.eventType === 'spin_loss') {
      return "The wheel has its whims, darling. Fortune favors the patient.";
    }
    return "Welcome to the table, darling. Let's see what the wheel decides!";
  }
}
