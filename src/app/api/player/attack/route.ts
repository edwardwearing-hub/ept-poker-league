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

        // 1. Fetch current PVP_SYSTEM data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'PVP_SYSTEM!A1:E30',
        });
        const rows = response.data.values || [];

        let attackerRow = -1;
        let targetRow = -1;

        for (let i = 0; i < rows.length; i++) {
            const name = rows[i][0]?.toString().trim();
            if (name === attacker) attackerRow = i + 1; // 1-indexed for Sheets
            if (name === target) targetRow = i + 1;
        }

        if (attackerRow === -1 || targetRow === -1) {
            return NextResponse.json({ error: 'Player not found in PVP_SYSTEM' }, { status: 404 });
        }

        const attackerData = rows[attackerRow - 1];
        const targetData = rows[targetRow - 1];

        const attackerTokens = parseInt(attackerData[2]) || 0;
        const targetIsHijacked = targetData[3]?.toString().toUpperCase() === 'TRUE';

        if (attackerTokens <= 0) {
            return NextResponse.json({ error: 'No Hack Tokens available' }, { status: 403 });
        }

        if (targetIsHijacked) {
            return NextResponse.json({ error: 'Target already hijacked' }, { status: 400 });
        }

        // 2. Perform updates in PVP_SYSTEM tab
        // Attacker: Deduct 1 Token (Column C)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `PVP_SYSTEM!C${attackerRow}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[attackerTokens - 1]] }
        });

        // Target: Set Profile_Hijacked = TRUE (Column D), Update Queue (Column E)
        let currentQueue: string[] = [];
        try {
            currentQueue = JSON.parse(targetData[4] || '[]');
        } catch (e) { }
        currentQueue.push(attacker);

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `PVP_SYSTEM!D${targetRow}:E${targetRow}`,
            valueInputOption: 'RAW',
            requestBody: { values: [['TRUE', JSON.stringify(currentQueue)]] }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error launching attack:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
