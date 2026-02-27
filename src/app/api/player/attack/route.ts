import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';

export async function POST(request: Request) {
    try {
        const { attacker, target } = await request.json();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();

        if (!attacker || !target || !spreadsheetId) {
            return NextResponse.json({ error: 'Missing attacker, target, or Sheet ID' }, { status: 400 });
        }

        const sheets = await getSheetsClient();

        // 1. Fetch current Sheet1 data to find row indices
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A1:X30',
        });
        const rows = response.data.values || [];

        let attackerRow = -1;
        let targetRow = -1;

        for (let i = 0; i < rows.length; i++) {
            const name = rows[i][0]?.toString().trim().toLowerCase();
            if (name === attacker.toLowerCase()) attackerRow = i + 1; // 1-indexed for Sheets
            if (name === target.toLowerCase()) targetRow = i + 1;
        }

        if (attackerRow === -1 || targetRow === -1) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        const attackerData = rows[attackerRow - 1];
        const targetData = rows[targetRow - 1];

        const attackerTokens = parseInt(attackerData[21]) || 0;
        const targetIsHijacked = targetData[22]?.toString().toUpperCase() === 'TRUE';

        if (attackerTokens <= 0) {
            return NextResponse.json({ error: 'No Hack Tokens available' }, { status: 403 });
        }

        if (targetIsHijacked) {
            return NextResponse.json({ error: 'Target already hijacked' }, { status: 400 });
        }

        // 2. Perform updates
        // Attacker: Deduct 1 Token (Column V / Index 21)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!V${attackerRow}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[attackerTokens - 1]] }
        });

        // Target: Set Profile_Hijacked = TRUE (Column W / Index 22)
        // Set Hijacker_Queue = JSON array with attacker (Column X / Index 23)
        // We replace the queue or append? User request says: "Push the attacker's 8-bit avatar string into the target's Hijacker_Queue array."
        // We'll append.
        let currentQueue: string[] = [];
        try {
            currentQueue = JSON.parse(targetData[23] || '[]');
        } catch (e) { }
        currentQueue.push(attacker);

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!W${targetRow}:X${targetRow}`,
            valueInputOption: 'RAW',
            requestBody: { values: [['TRUE', JSON.stringify(currentQueue)]] }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error launching attack:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
