import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { verifyCsrf } from '@/lib/security';
import { getFirestoreDb, sanitizeDocId } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
        return NextResponse.json({ error: csrf.reason || 'Forbidden' }, { status: 403 });
    }

    if (!verifyAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized: Invalid Admin Credentials' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const targetPlayer = body?.player ? String(body.player).trim() : null;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();

        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Missing Sheet ID' }, { status: 400 });
        }

        const sheets = await getSheetsClient();
        const db = getFirestoreDb();

        // 1. Fetch current PVP_SYSTEM rows
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'PVP_SYSTEM!B1:C30',
        });
        const rows = response.data.values || [];

        // 2. Build reset values — mark as 'RESET_REQUIRED' instead of insecure default '0000'
        const resetValues: string[][] = [];
        let count = 0;

        for (let i = 0; i < rows.length; i++) {
            const name = rows[i][0]?.toString().trim();
            if (name && name !== 'Player_Name' && name !== '') {
                if (!targetPlayer || targetPlayer.toLowerCase() === name.toLowerCase()) {
                    resetValues.push(['RESET_REQUIRED']);
                    count++;

                    // Also flag in Firestore if available
                    if (db) {
                        try {
                            const docId = sanitizeDocId(name);
                            await db.collection('poker_players').doc(docId).set(
                                { needsPinSetup: true, pin: 'RESET_REQUIRED' },
                                { merge: true }
                            );
                        } catch {}
                    }
                } else {
                    resetValues.push([rows[i][1]?.toString() || '']);
                }
            } else {
                resetValues.push([rows[i][1]?.toString() || '']);
            }
        }

        // 3. Batch update in Google Sheets
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `PVP_SYSTEM!C1:C${rows.length}`,
            valueInputOption: 'RAW',
            requestBody: { values: resetValues }
        });

        return NextResponse.json({
            success: true,
            message: `Flagged ${count} player account(s) for secure PIN setup (no insecure default).`
        });
    } catch (error) {
        console.error('Error resetting PINs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
