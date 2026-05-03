import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';

// The next game date is stored in Sheet1!AH1 in the Google Sheet.
// This avoids writing to the filesystem which is read-only on Vercel.
const COUNTDOWN_RANGE = 'Sheet1!AH1';

export async function GET() {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Missing Sheet ID' }, { status: 400 });
        }

        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: COUNTDOWN_RANGE,
        });

        const dateValue = response.data.values?.[0]?.[0];
        if (dateValue) {
            return NextResponse.json({ targetDate: dateValue });
        }

        // Default if no date set yet
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        return NextResponse.json({ targetDate: defaultDate.toISOString() });
    } catch (err) {
        console.error('Countdown read error:', err);
        return NextResponse.json({ error: 'Failed to read countdown' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { targetDate } = await request.json();

        if (!targetDate) {
            return NextResponse.json({ error: 'Missing targetDate' }, { status: 400 });
        }

        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Missing Sheet ID' }, { status: 400 });
        }

        const sheets = await getSheetsClient();

        // Write the ISO date string to Sheet1!AH1
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: COUNTDOWN_RANGE,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[new Date(targetDate).toISOString()]],
            },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Countdown save error:', err);
        return NextResponse.json({ error: 'Failed to save countdown' }, { status: 500 });
    }
}
