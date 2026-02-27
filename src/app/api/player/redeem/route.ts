import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';

export async function POST(request: Request) {
    try {
        const { playerName } = await request.json();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();

        if (!playerName || !spreadsheetId) {
            return NextResponse.json({ error: 'Missing playerName or Sheet ID' }, { status: 400 });
        }

        const sheets = await getSheetsClient();

        // 1. Fetch current PVP_SYSTEM data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'PVP_SYSTEM!A1:E30',
        });
        const rows = response.data.values || [];

        let playerRow = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0]?.toString().trim() === playerName) {
                playerRow = i + 1;
                break;
            }
        }

        if (playerRow === -1) {
            return NextResponse.json({ error: 'Player not found in PVP_SYSTEM' }, { status: 404 });
        }

        const currentTokens = parseInt(rows[playerRow - 1][2]) || 0;

        // 2. Perform updates
        // Set Profile_Hijacked = FALSE (Col D), Clear Queue (Col E), Increment Tokens (Col C)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `PVP_SYSTEM!C${playerRow}:E${playerRow}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[
                    currentTokens + 1, // Hack_Tokens + 1
                    'FALSE',           // Profile_Hijacked = FALSE
                    '[]'               // Hijacker_Queue = empty
                ]]
            }
        });

        return NextResponse.json({ success: true, tokens: currentTokens + 1 });
    } catch (error) {
        console.error('Error redeeming profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
