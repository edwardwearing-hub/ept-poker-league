import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';

export async function GET() {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Missing Sheet ID' }, { status: 400 });
        }

        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Gazette!A2:E',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return NextResponse.json([]);
        }

        // Map all rows into report objects and return newest-first
        const reports = rows
            .map((row, index) => ({
                id: index,
                title: row[0] || '',
                episode: row[1] || '',
                date: row[2] || '',
                winner: row[3] || '',
                content: row[4] || '',
            }))
            .filter(r => r.title || r.content) // Skip empty rows
            .reverse(); // Newest first

        return NextResponse.json(reports);
    } catch (err) {
        console.error('Failed to fetch all reports:', err);
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
