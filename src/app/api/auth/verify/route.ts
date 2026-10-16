import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/data';
import { getPlayerDoc, savePlayerDoc } from '@/lib/firebase-admin';
import {
  verifyAndMigratePin,
  hashPin,
  checkRateLimitShared,
  recordFailedAttemptShared,
  resetRateLimitShared,
  getClientIp,
  verifyCsrf,
} from '@/lib/security';
import {
  getPlayerSession,
  setPlayerSessionCookie,
  clearPlayerSessionCookie,
} from '@/lib/playerAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = getPlayerSession(request);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    player: session.name,
    requiresPinChange: session.requiresPinChange || false,
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.reason || 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, pin } = await request.json();

    if (!name || !pin) {
      return NextResponse.json({ error: 'Missing name or PIN' }, { status: 400 });
    }

    const cleanName = name.trim();
    const pinStr = pin.toString().trim();

    // Check shared rate limit
    const ip = getClientIp(request);
    const rateLimitKey = `pin_verify_${cleanName.toLowerCase()}_${ip}`;
    const rateLimit = await checkRateLimitShared(rateLimitKey, 5, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: `Account temporarily locked due to too many failed attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` 
      }, { status: 429 });
    }

    // 1. Check Firestore doc first (supports migrated scrypt hashes)
    const firestoreDoc = await getPlayerDoc(cleanName);
    let expected = firestoreDoc?.pin;

    // 2. Fall back to Google Sheet player roster
    if (!expected) {
      const players = await getLeaderboardData();
      const sheetPlayer = players.find(
        (p) => p.name.toLowerCase().trim() === cleanName.toLowerCase()
      );
      if (sheetPlayer) {
        expected = sheetPlayer.secretPin || '0000';
      }
    }

    if (!expected) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    if (expected === 'RESET_REQUIRED') {
      return NextResponse.json({
        error: 'Your PIN has been reset by an administrator. Please establish a new secure PIN.',
        needsPinSetup: true,
      }, { status: 403 });
    }

    const verifyResult = await verifyAndMigratePin(pinStr, expected);

    if (verifyResult.valid) {
      await resetRateLimitShared(rateLimitKey);

      // Perform in-flight migration to scrypt hash if legacy plaintext was verified
      if (verifyResult.isLegacy && firestoreDoc) {
        const freshHash = verifyResult.migratedHash || (await hashPin(pinStr));
        await savePlayerDoc({
          ...firestoreDoc,
          pin: freshHash,
          lastLoginAt: Date.now(),
        });
      }

      const response = NextResponse.json({
        success: true,
        name: cleanName,
        message: 'PIN verified successfully',
      });

      setPlayerSessionCookie(response, cleanName, pinStr === '0000');
      return response;
    } else {
      const attempt = await recordFailedAttemptShared(rateLimitKey, 5, 10 * 60 * 1000);
      const msg = attempt.locked
        ? 'ACCESS DENIED: Account locked for 10 minutes due to 5 failed attempts.'
        : `ACCESS DENIED: Incorrect PIN (${attempt.remainingAttempts} attempts remaining).`;
      return NextResponse.json({ error: msg }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in /api/auth/verify:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  clearPlayerSessionCookie(response);
  return response;
}
