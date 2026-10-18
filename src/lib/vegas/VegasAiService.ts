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
  highRoller?: boolean;
}

export async function fetchDealerComment(payload: DealerEventPayload): Promise<string> {
  const isHighRoller =
    payload.highRoller ??
    (typeof window !== 'undefined' &&
      (document.documentElement.classList.contains('konami-high-roller') ||
        localStorage.getItem('ept_konami_high_roller_v1') === 'true'));

  try {
    const res = await fetch('/api/vegas/dealer-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, highRoller: isHighRoller }),
    });

    if (!res.ok) {
      throw new Error(`Dealer AI error: status ${res.status}`);
    }

    const data = await res.json();
    return data.comment || 'Place your chips upon the 24K felt, Your Highness!';
  } catch (err) {
    console.error('Dealer AI fetch failed:', err);
    if (isHighRoller) {
      if (payload.eventType === 'spin_win' || payload.eventType === 'big_win') {
        return 'A royal strike on the 24K Gold felt, Your Highness! The Salon Privé vault bows to the Chairman of the E.P.T.';
      }
      if (payload.eventType === 'spin_loss') {
        return 'Even in the 24K Salon Privé, variance teases the crown, Your Highness. Toss another £5,000 plaque!';
      }
      return 'Welcome to the Konami 24K Salon Privé, Chairman of the E.P.T. The £5,000 whale plaques await your command!';
    }
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
