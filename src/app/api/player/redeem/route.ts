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

        // 1. Fetch current Sheet1 data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A1:V30',
        });
        const rows = response.data.values || [];

        let playerRow = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0]?.toString().trim().toLowerCase() === playerName.toLowerCase()) {
                playerRow = i + 1;
                break;
            }
        }

        if (playerRow === -1) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        const currentTokens = parseInt(rows[playerRow - 1][21]) || 0;

        // 2. Perform updates
        // Set Profile_Hijacked = FALSE (Column W / Index 22)
        // Clear Hijacker_Queue (Column X / Index 23)
        // Increment Hack_Tokens (Column V / Index 21)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!V${playerRow}:X${playerRow}`,
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
