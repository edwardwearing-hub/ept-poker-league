import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';

export async function POST() {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();

        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Missing Sheet ID' }, { status: 400 });
        }

        const sheets = await getSheetsClient();

        // 1. Fetch all player names from PVP_SYSTEM Column B
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'PVP_SYSTEM!B1:C30',
        });
        const rows = response.data.values || [];

        // 2. Build batch update — set Column C to "0000" for every player row
        const resetValues: string[][] = [];
        let count = 0;

        for (let i = 0; i < rows.length; i++) {
            const name = rows[i][0]?.toString().trim();
            if (name && name !== 'Player_Name' && name !== '') {
                resetValues.push(['0000']);
                count++;
            } else {
                resetValues.push([rows[i][1]?.toString() || '']); // Keep header/empty rows as-is
            }
        }

        // 3. Batch update all PINs at once
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `PVP_SYSTEM!C1:C${rows.length}`,
            valueInputOption: 'RAW',
            requestBody: { values: resetValues }
        });

        return NextResponse.json({ success: true, message: `Reset ${count} player PINs to 0000` });
    } catch (error) {
        console.error('Error resetting PINs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
