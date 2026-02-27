import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';

export async function POST(request: Request) {
    try {
        const { playerName, newPin } = await request.json();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();

        if (!playerName || !newPin || !spreadsheetId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
        }

        const sheets = await getSheetsClient();

        // 1. Fetch current PVP_SYSTEM data (Starting from Column B)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'PVP_SYSTEM!B1:B30',
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

        // 2. Update Secret_PIN (Column C)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `PVP_SYSTEM!C${playerRow}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[newPin]] }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating PIN:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
