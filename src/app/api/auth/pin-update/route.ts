import { NextResponse } from 'next/server';
import { getSheetsClient, getLeaderboardData } from '@/lib/data';
import { getPlayerDoc, savePlayerDoc, getFirestoreDb, sanitizeDocId } from '@/lib/firebase-admin';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { getPlayerSession, setPlayerSessionCookie } from '@/lib/playerAuth';
import {
    hashPin,
    isWeakPin,
    verifyAndMigratePin,
    verifyCsrf,
    checkRateLimitShared,
    recordFailedAttemptShared,
    resetRateLimitShared,
    getClientIp,
} from '@/lib/security';

export async function POST(request: Request) {
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
        return NextResponse.json({ error: csrf.reason || 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { playerName, newPin, currentPin } = body;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();

        if (!playerName || !newPin) {
            return NextResponse.json({ error: 'Missing playerName or newPin' }, { status: 400 });
        }

        const cleanPlayerName = String(playerName).trim();
        const cleanNewPin = String(newPin).trim();
        const cleanCurrentPin = currentPin ? String(currentPin).trim() : null;

        // 1. PIN Strength Check (Rejects 0000, 1234, repeating digits)
        const weakCheck = isWeakPin(cleanNewPin);
        if (weakCheck.isWeak) {
            return NextResponse.json({ error: weakCheck.reason || 'Insecure PIN' }, { status: 422 });
        }

        // 2. Shared Rate Limiting for PIN changes
        const ip = getClientIp(request);
        const rateLimitKey = `pin_update_${sanitizeDocId(cleanPlayerName)}_${ip}`;
        const rateCheck = await checkRateLimitShared(rateLimitKey, 5, 15 * 60 * 1000);
        if (!rateCheck.allowed) {
            return NextResponse.json({
                error: `Too many failed attempts. Try again in ${rateCheck.retryAfterSeconds} seconds.`
            }, { status: 429 });
        }

        // 3. Authorization Verification
        const isAdmin = verifyAdminAuth(request);
        const playerSession = getPlayerSession(request);

        const isSelfSession = playerSession && playerSession.name.toLowerCase() === cleanPlayerName.toLowerCase();

        // Player A must NEVER change Player B's PIN
        if (playerSession && !isSelfSession && !isAdmin) {
            return NextResponse.json({
                error: 'Unauthorized: You cannot change another player’s PIN.'
            }, { status: 403 });
        }

        // Retrieve existing stored PIN (Firestore first, Google Sheets second)
        const firestoreDoc = await getPlayerDoc(cleanPlayerName);
        let existingPin = firestoreDoc?.pin;

        if (!existingPin && spreadsheetId) {
            const sheetPlayers = await getLeaderboardData();
            const matched = sheetPlayers.find(p => p.name.toLowerCase() === cleanPlayerName.toLowerCase());
            if (matched) {
                existingPin = matched.secretPin;
            }
        }

        const isInitialSetup = existingPin === 'RESET_REQUIRED' || existingPin === '0000' || firestoreDoc?.needsPinSetup;

        // If not admin and not in initial setup mode, require current PIN verification
        if (!isAdmin && !isInitialSetup) {
            if (!cleanCurrentPin) {
                return NextResponse.json({
                    error: 'Current PIN is required to authorize a PIN change.'
                }, { status: 401 });
            }

            if (!existingPin) {
                return NextResponse.json({ error: 'Player account record not found' }, { status: 404 });
            }

            const currentPinCheck = await verifyAndMigratePin(cleanCurrentPin, existingPin);
            if (!currentPinCheck.valid) {
                const failed = await recordFailedAttemptShared(rateLimitKey, 5, 15 * 60 * 1000);
                const msg = failed.locked
                    ? 'Account locked for 15 minutes due to 5 failed attempts.'
                    : `Incorrect current PIN (${failed.remainingAttempts} attempts remaining).`;
                return NextResponse.json({ error: msg }, { status: 401 });
            }
        }

        // 4. Cryptographic Hashing with Scrypt (NEVER store plaintext)
        const hashedPin = await hashPin(cleanNewPin);

        // 5. Update Firestore
        if (firestoreDoc) {
            await savePlayerDoc({
                ...firestoreDoc,
                pin: hashedPin,
                needsPinSetup: false,
                lastLoginAt: Date.now(),
            });
        } else {
            const db = getFirestoreDb();
            if (db) {
                await db.collection('poker_players').doc(sanitizeDocId(cleanPlayerName)).set(
                    {
                        name: cleanPlayerName,
                        pin: hashedPin,
                        needsPinSetup: false,
                        lastLoginAt: Date.now(),
                    },
                    { merge: true }
                );
            }
        }

        // 6. Update Google Sheets with Hashed PIN (or Secure Mask)
        if (spreadsheetId) {
            try {
                const sheets = await getSheetsClient();
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: 'PVP_SYSTEM!B1:B30',
                });
                const rows = response.data.values || [];

                let playerRow = -1;
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i][0]?.toString().trim().toLowerCase() === cleanPlayerName.toLowerCase()) {
                        playerRow = i + 1;
                        break;
                    }
                }

                if (playerRow !== -1) {
                    await sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: `PVP_SYSTEM!C${playerRow}`,
                        valueInputOption: 'RAW',
                        requestBody: { values: [[hashedPin]] }
                    });
                }
            } catch (sheetErr) {
                console.warn('Google Sheets PIN update warning:', sheetErr);
            }
        }

        await resetRateLimitShared(rateLimitKey);

        const response = NextResponse.json({
            success: true,
            message: 'PIN successfully updated and cryptographically secured.'
        });

        // Set or renew HttpOnly player session
        setPlayerSessionCookie(response, cleanPlayerName, false);
        return response;

    } catch (error) {
        console.error('Error updating PIN:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
