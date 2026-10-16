import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/data';
import { getPlayerDoc } from '@/lib/firebase-admin';
import { constantTimeCompare, checkPinRateLimit, recordFailedPinAttempt, resetPinAttempts } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const { name, pin } = await request.json();

    if (!name || !pin) {
      return NextResponse.json({ error: 'Missing name or PIN' }, { status: 400 });
    }

    const cleanName = name.trim();
    const pinStr = pin.toString().trim();

    // Check rate limit on the player name
    const rateLimit = checkPinRateLimit(cleanName.toLowerCase());
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: `Account temporarily locked due to too many failed attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` 
      }, { status: 429 });
    }

    // 1. Check Google Sheet players
    const players = await getLeaderboardData();
    const sheetPlayer = players.find(
      (p) => p.name.toLowerCase().trim() === cleanName.toLowerCase()
    );

    if (sheetPlayer) {
      const expected = sheetPlayer.secretPin || '0000';
      if (constantTimeCompare(expected, pinStr)) {
        resetPinAttempts(cleanName.toLowerCase());
        return NextResponse.json({ success: true, name: sheetPlayer.name });
      } else {
        const attempt = recordFailedPinAttempt(cleanName.toLowerCase());
        const msg = attempt.locked
          ? 'ACCESS DENIED: Account locked for 10 minutes due to 5 failed attempts.'
          : `ACCESS DENIED: Incorrect PIN (${attempt.remainingAttempts} attempts remaining).`;
        return NextResponse.json({ error: msg }, { status: 401 });
      }
    }

    // 2. Check Firebase Firestore players
    const firestorePlayer = await getPlayerDoc(cleanName);
    if (firestorePlayer) {
      if (constantTimeCompare(firestorePlayer.pin, pinStr)) {
        resetPinAttempts(cleanName.toLowerCase());
        return NextResponse.json({ success: true, name: firestorePlayer.name });
      } else {
        const attempt = recordFailedPinAttempt(cleanName.toLowerCase());
        const msg = attempt.locked
          ? 'ACCESS DENIED: Account locked for 10 minutes due to 5 failed attempts.'
          : `ACCESS DENIED: Incorrect PIN (${attempt.remainingAttempts} attempts remaining).`;
        return NextResponse.json({ error: msg }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
