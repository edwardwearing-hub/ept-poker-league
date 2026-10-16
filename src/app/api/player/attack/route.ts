import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';
import { getPlayerSession } from '@/lib/playerAuth';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { verifyCsrf } from '@/lib/security';

export async function POST(request: Request) {
    // 1. CSRF Protection
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
        return NextResponse.json({ error: csrf.reason || 'Forbidden' }, { status: 403 });
    }

    // 2. Authentication & Authorization Check
    const session = getPlayerSession(request);
    const isAdmin = verifyAdminAuth(request);

    if (!session && !isAdmin) {
        return NextResponse.json({
            error: 'Unauthorized: You must log in with your PIN before launching a hijack attack.'
        }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { target, attacker: requestedAttacker } = body;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();

        // 3. Authenticated Identity: derive attacker strictly from verified server session (unless admin)
        const effectiveAttacker = isAdmin && requestedAttacker ? requestedAttacker.trim() : session?.name;

        if (!effectiveAttacker) {
            return NextResponse.json({ error: 'Missing attacker session' }, { status: 400 });
        }

        if (!target) {
            return NextResponse.json({ error: 'Missing target player' }, { status: 400 });
        }

        const cleanAttacker = effectiveAttacker.trim();
        const cleanTarget = String(target).trim();

        // Prevent self-attacks
        if (cleanAttacker.toLowerCase() === cleanTarget.toLowerCase()) {
            return NextResponse.json({ error: 'You cannot launch an attack against yourself.' }, { status: 400 });
        }

        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Missing spreadsheet configuration' }, { status: 400 });
        }

        const sheets = await getSheetsClient();

        // 4. Fetch current PVP_SYSTEM data (Columns B to F)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'PVP_SYSTEM!B1:F30',
        });
        const rows = response.data.values || [];

        let attackerRow = -1;
        let targetRow = -1;

        for (let i = 0; i < rows.length; i++) {
            const name = rows[i][0]?.toString().trim();
            if (name?.toLowerCase() === cleanAttacker.toLowerCase()) attackerRow = i + 1;
            if (name?.toLowerCase() === cleanTarget.toLowerCase()) targetRow = i + 1;
        }

        if (attackerRow === -1 || targetRow === -1) {
            return NextResponse.json({ error: 'Player not found in PVP_SYSTEM roster' }, { status: 404 });
        }

        const attackerData = rows[attackerRow - 1];
        const targetData = rows[targetRow - 1];

        const attackerTokens = parseInt(attackerData[2]) || 0; // Col D (rel to B)
        const targetIsHijacked = targetData[3]?.toString().toUpperCase() === 'TRUE'; // Col E

        if (attackerTokens <= 0) {
            return NextResponse.json({ error: 'Insufficient Hack Tokens to launch an attack.' }, { status: 403 });
        }

        if (targetIsHijacked) {
            return NextResponse.json({ error: 'Target profile is already hijacked.' }, { status: 400 });
        }

        // 5. Atomic Update in PVP_SYSTEM
        // Deduct 1 token from attacker
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `PVP_SYSTEM!D${attackerRow}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[attackerTokens - 1]] }
        });

        // Set target hijacked and append to queue
        let currentQueue: string[] = [];
        try {
            currentQueue = JSON.parse(targetData[4] || '[]');
        } catch {}
        currentQueue.push(cleanAttacker);

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `PVP_SYSTEM!E${targetRow}:F${targetRow}`,
            valueInputOption: 'RAW',
            requestBody: { values: [['TRUE', JSON.stringify(currentQueue)]] }
        });

        return NextResponse.json({
            success: true,
            attacker: cleanAttacker,
            target: cleanTarget,
            remainingTokens: attackerTokens - 1,
        });

    } catch (error) {
        console.error('Error launching attack:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
