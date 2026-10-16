import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/data';
import { getPlayerDoc, savePlayerDoc, PokerPlayerRecord, sanitizeDocId } from '@/lib/firebase-admin';
import { getInitialTrackerStats } from '@/lib/poker-trainer/tracker';
import {
  verifyAndMigratePin,
  hashPin,
  isWeakPin,
  checkRateLimitShared,
  recordFailedAttemptShared,
  resetRateLimitShared,
  getClientIp,
  verifyCsrf,
} from '@/lib/security';
import { setPlayerSessionCookie } from '@/lib/playerAuth';

export const revalidate = 0;

export async function POST(request: Request) {
  // 1. CSRF Verification
  const csrf = verifyCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.reason || 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, pin, isGuest, avatarUrl, nickname } = body as {
      name?: string;
      pin?: string;
      isGuest?: boolean;
      avatarUrl?: string;
      nickname?: string;
    };

    // 2. Guest Mode: No data saved, instant entry, no session cookie
    if (isGuest || (name && name.toLowerCase().trim() === 'guest trainee') || (name && name.toLowerCase().trim() === 'guest')) {
      return NextResponse.json({
        success: true,
        isGuest: true,
        name: 'Guest Trainee',
        avatarUrl: '/avatars/avatar_hoodie.png',
        bankroll: 10000,
        message: 'Playing as Guest Trainee. Your chips and hands will not be saved.',
      });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const pinStr = pin ? pin.toString().trim() : '';

    if (!pinStr || pinStr.length !== 4) {
      return NextResponse.json({ error: 'A 4-digit PIN is required' }, { status: 400 });
    }

    // 3. Shared Rate-Limiting across Vercel instances
    const ip = getClientIp(request);
    const rateLimitKey = `player_login_${sanitizeDocId(cleanName)}_${ip}`;
    const rateLimit = await checkRateLimitShared(rateLimitKey, 5, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: `Account temporarily locked due to repeated failed PIN attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.`
      }, { status: 429 });
    }

    // 4. Check if player is one of the 11 League Roster members from Google Sheets
    const sheetPlayers = await getLeaderboardData();
    const matchedSheetPlayer = sheetPlayers.find(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (matchedSheetPlayer) {
      const storedPin = matchedSheetPlayer.secretPin || '';

      if (storedPin === 'RESET_REQUIRED') {
        return NextResponse.json({
          error: 'Your PIN has been reset by an administrator. Please set a new secure PIN to access your account.',
          needsPinSetup: true,
        }, { status: 403 });
      }

      // Check against Firestore doc first if already migrated
      let firestoreDoc = await getPlayerDoc(matchedSheetPlayer.name);
      const effectiveStoredPin = firestoreDoc?.pin || storedPin || '0000';

      const verifyResult = await verifyAndMigratePin(pinStr, effectiveStoredPin);

      if (verifyResult.valid) {
        await resetRateLimitShared(rateLimitKey);

        const needsPinChange = pinStr === '0000' || firestoreDoc?.needsPinSetup === true;

        // Perform safe in-flight migration to scrypt hash if legacy plaintext was used
        if (verifyResult.isLegacy || !firestoreDoc) {
          const freshHash = verifyResult.migratedHash || (await hashPin(pinStr));
          const freshStats = firestoreDoc?.stats || getInitialTrackerStats();
          firestoreDoc = {
            name: matchedSheetPlayer.name,
            pin: freshHash,
            nickname: matchedSheetPlayer.nickname || matchedSheetPlayer.name.split(' ')[0],
            avatarUrl: matchedSheetPlayer.avatarUrl || '/avatars/avatar_shark.png',
            isCustomPlayer: false,
            createdAt: firestoreDoc?.createdAt || Date.now(),
            lastLoginAt: Date.now(),
            stats: freshStats,
            needsPinSetup: needsPinChange,
          };
          await savePlayerDoc(firestoreDoc);
        } else {
          await savePlayerDoc({
            ...firestoreDoc,
            lastLoginAt: Date.now(),
          });
        }

        const totalChips =
          10000 +
          (firestoreDoc.stats.netChipsWon || 0) +
          (firestoreDoc.stats.bountyCashWon || 0) +
          (firestoreDoc.stats.bailoutChipsReceived || 0);

        const response = NextResponse.json({
          success: true,
          isGuest: false,
          isNewPlayer: false,
          name: matchedSheetPlayer.name,
          nickname: matchedSheetPlayer.nickname,
          avatarUrl: matchedSheetPlayer.avatarUrl,
          bankroll: Math.max(0, totalChips),
          stats: firestoreDoc.stats,
          needsPinChange,
          message: `Welcome back, ${matchedSheetPlayer.name}!`,
        });

        // Set HttpOnly signed player session cookie
        setPlayerSessionCookie(response, matchedSheetPlayer.name, needsPinChange);
        return response;
      } else {
        const attempt = await recordFailedAttemptShared(rateLimitKey, 5, 10 * 60 * 1000);
        const msg = attempt.locked
          ? 'ACCESS DENIED: Account locked for 10 minutes due to 5 failed attempts.'
          : `ACCESS DENIED: Incorrect 4-digit PIN (${attempt.remainingAttempts} attempts remaining).`;
        return NextResponse.json({ error: msg }, { status: 401 });
      }
    }

    // 5. Check if player exists in Firebase Firestore
    const existingDoc = await getPlayerDoc(cleanName);

    if (existingDoc) {
      if (existingDoc.pin === 'RESET_REQUIRED' || existingDoc.needsPinSetup) {
        return NextResponse.json({
          error: 'Your PIN has been reset. Please set a new secure PIN.',
          needsPinSetup: true,
        }, { status: 403 });
      }

      const verifyResult = await verifyAndMigratePin(pinStr, existingDoc.pin);

      if (verifyResult.valid) {
        await resetRateLimitShared(rateLimitKey);

        const needsPinChange = pinStr === '0000' || Boolean(existingDoc.needsPinSetup);

        // Migrate to scrypt hash if legacy plaintext
        const targetPin = verifyResult.isLegacy && verifyResult.migratedHash
          ? verifyResult.migratedHash
          : existingDoc.pin;

        await savePlayerDoc({
          ...existingDoc,
          pin: targetPin,
          lastLoginAt: Date.now(),
          needsPinSetup: needsPinChange,
        });

        const totalChips =
          10000 +
          (existingDoc.stats.netChipsWon || 0) +
          (existingDoc.stats.bountyCashWon || 0) +
          (existingDoc.stats.bailoutChipsReceived || 0);

        const response = NextResponse.json({
          success: true,
          isGuest: false,
          isNewPlayer: false,
          name: existingDoc.name,
          nickname: existingDoc.nickname,
          avatarUrl: existingDoc.avatarUrl,
          bankroll: Math.max(0, totalChips),
          stats: existingDoc.stats,
          needsPinChange,
          message: `Welcome back, ${existingDoc.name}!`,
        });

        // Set HttpOnly signed player session cookie
        setPlayerSessionCookie(response, existingDoc.name, needsPinChange);
        return response;
      } else {
        const attempt = await recordFailedAttemptShared(rateLimitKey, 5, 10 * 60 * 1000);
        const msg = attempt.locked
          ? 'ACCESS DENIED: Account locked for 10 minutes due to 5 failed attempts.'
          : `ACCESS DENIED: Incorrect 4-digit PIN for player "${existingDoc.name}" (${attempt.remainingAttempts} attempts remaining).`;
        return NextResponse.json({ error: msg }, { status: 401 });
      }
    }

    // 6. Brand New Player -> Check PIN strength & create record with hashed PIN
    const weakCheck = isWeakPin(pinStr);
    if (weakCheck.isWeak) {
      return NextResponse.json({
        error: `Insecure PIN rejected: ${weakCheck.reason}`,
      }, { status: 422 });
    }

    const hashedPin = await hashPin(pinStr);

    const newRecord: PokerPlayerRecord = {
      name: cleanName,
      pin: hashedPin,
      nickname: nickname || cleanName.split(' ')[0],
      avatarUrl: avatarUrl || '/avatars/avatar_shark.png',
      isCustomPlayer: true,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      stats: getInitialTrackerStats(),
      needsPinSetup: false,
    };

    await savePlayerDoc(newRecord);
    await resetRateLimitShared(rateLimitKey);

    const response = NextResponse.json({
      success: true,
      isGuest: false,
      isNewPlayer: true,
      name: cleanName,
      nickname: newRecord.nickname,
      avatarUrl: newRecord.avatarUrl,
      bankroll: 10000,
      stats: newRecord.stats,
      message: `Welcome to the League, ${cleanName}! Granted £10,000 starting bankroll.`,
    });

    setPlayerSessionCookie(response, cleanName, false);
    return response;

  } catch (error) {
    console.error('Error in /api/auth/player-login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
