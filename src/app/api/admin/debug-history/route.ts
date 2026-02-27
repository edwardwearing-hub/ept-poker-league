import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';

export async function GET() {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
        if (!spreadsheetId) {
            return NextResponse.json({ error: 'No Sheet ID' });
        }

        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A20:Z37',
        });

        return NextResponse.json({
            rows: response.data.values,
            row20: response.data.values?.[0], // Date layer
            row36: response.data.values?.[16] // No of Players layer
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
