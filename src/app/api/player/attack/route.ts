import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';
import { getPlayerSession } from '@/lib/playerAuth';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { verifyCsrf } from '@/lib/security';
import { normalizePlayerName } from '@/lib/roster';

// In-flight mutex to prevent concurrent attacks from double-deducting tokens
const inFlightAttacks = new Set<string>();

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

        const canonicalAttacker = normalizePlayerName(effectiveAttacker) || effectiveAttacker.trim();
        const canonicalTarget = normalizePlayerName(String(target)) || String(target).trim();

        // Prevent self-attacks
        if (canonicalAttacker.toLowerCase() === canonicalTarget.toLowerCase()) {
            return NextResponse.json({ error: 'You cannot launch an attack against yourself.' }, { status: 400 });
        }

        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Missing spreadsheet configuration' }, { status: 400 });
        }

        // 4. In-flight attack lock (Idempotency / double-click prevention)
        const attackerKey = canonicalAttacker.toLowerCase();
        const lockKey = `${attackerKey}->${canonicalTarget.toLowerCase()}`;
        if (inFlightAttacks.has(attackerKey) || inFlightAttacks.has(lockKey)) {
            return NextResponse.json({ error: 'Attack already in progress. Please wait.' }, { status: 429 });
        }
        inFlightAttacks.add(attackerKey);
        inFlightAttacks.add(lockKey);

        try {
            const sheets = await getSheetsClient();

            // 5. Fetch current PVP_SYSTEM data (Columns B to F)
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'PVP_SYSTEM!B1:F30',
            });
            const rows = response.data.values || [];

            let attackerRow = -1;
            let targetRow = -1;

            for (let i = 0; i < rows.length; i++) {
                const name = rows[i][0]?.toString().trim();
                const normalized = normalizePlayerName(name) || name;
                if (normalized?.toLowerCase() === canonicalAttacker.toLowerCase()) attackerRow = i + 1;
                if (normalized?.toLowerCase() === canonicalTarget.toLowerCase()) targetRow = i + 1;
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

            // 6. Update in PVP_SYSTEM
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
            currentQueue.push(canonicalAttacker);

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `PVP_SYSTEM!E${targetRow}:F${targetRow}`,
                valueInputOption: 'RAW',
                requestBody: { values: [['TRUE', JSON.stringify(currentQueue)]] }
            });

            return NextResponse.json({
                success: true,
                attacker: canonicalAttacker,
                target: canonicalTarget,
                remainingTokens: attackerTokens - 1,
                message: `Successfully launched hijack attack on ${canonicalTarget}!`
            });
        } finally {
            inFlightAttacks.delete(attackerKey);
            inFlightAttacks.delete(lockKey);
        }

    } catch (error: unknown) {
        console.error('Error executing attack:', error);
        const message = (error as Error)?.message || 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
