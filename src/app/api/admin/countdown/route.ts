import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';

// Game schedule dates live in Sheet1!B22:AC22 (merged 3 cols per date)
const SCHEDULE_RANGE = 'Sheet1!B22:AC22';
// Manual admin override lives in Sheet1!AH1
const OVERRIDE_RANGE = 'Sheet1!AH1';

/**
 * Parse a date string from the Google Sheet into a JS Date.
 * Handles common formats: "23/05/2026", "23/05/2026 20:00", ISO strings.
 * Returns null if parsing fails.
 */
function parseSheetDate(raw: string): Date | null {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // ISO format (from our own writes)
    if (trimmed.includes('T') || trimmed.match(/^\d{4}-\d{2}-\d{2}/)) {
        const d = new Date(trimmed);
        return isNaN(d.getTime()) ? null : d;
    }

    // DD/MM/YYYY or DD/MM/YYYY HH:MM
    const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (dmyMatch) {
        const [, day, month, year, hour = '20', minute = '00'] = dmyMatch;
        const d = new Date(
            parseInt(year), parseInt(month) - 1, parseInt(day),
            parseInt(hour), parseInt(minute)
        );
        return isNaN(d.getTime()) ? null : d;
    }

    // Try native parse as last resort
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
}

export async function GET() {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Missing Sheet ID' }, { status: 400 });
        }

        const sheets = await getSheetsClient();

        // Fetch schedule row and override cell in one batch call
        const batch = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges: [SCHEDULE_RANGE, OVERRIDE_RANGE],
        });

        const valueRanges = batch.data.valueRanges || [];

        // --- Check for admin override first ---
        const overrideRaw = valueRanges[1]?.values?.[0]?.[0];
        const overrideDate = overrideRaw ? parseSheetDate(overrideRaw) : null;
        if (overrideDate && overrideDate > new Date()) {
            return NextResponse.json({
                targetDate: overrideDate.toISOString(),
                source: 'override',
                allScheduledDates: [],
            });
        }

        // --- Read schedule from B22:AC22 ---
        // Merged cells: only the first cell of each merge has a value.
        // The rest are empty. We filter out empty strings.
        const scheduleRow = valueRanges[0]?.values?.[0] || [];
        const now = new Date();

        const allDates: { raw: string; date: Date }[] = [];
        for (const cell of scheduleRow) {
            if (cell && cell.trim()) {
                const d = parseSheetDate(cell);
                if (d) {
                    allDates.push({ raw: cell.trim(), date: d });
                }
            }
        }

        // Sort ascending and find the next future date
        allDates.sort((a, b) => a.date.getTime() - b.date.getTime());
        const nextDate = allDates.find(d => d.date > now);

        if (nextDate) {
            return NextResponse.json({
                targetDate: nextDate.date.toISOString(),
                source: 'schedule',
                allScheduledDates: allDates.map(d => ({ raw: d.raw, iso: d.date.toISOString() })),
            });
        }

        // All dates have passed — return the last one in the schedule
        const lastDate = allDates[allDates.length - 1];
        if (lastDate) {
            return NextResponse.json({
                targetDate: lastDate.date.toISOString(),
                source: 'schedule_ended',
                allScheduledDates: allDates.map(d => ({ raw: d.raw, iso: d.date.toISOString() })),
            });
        }

        // Absolute fallback if sheet is empty
        const fallback = new Date();
        fallback.setDate(fallback.getDate() + 7);
        return NextResponse.json({
            targetDate: fallback.toISOString(),
            source: 'fallback',
            allScheduledDates: [],
        });

    } catch (err) {
        console.error('Countdown read error:', err);
        return NextResponse.json({ error: 'Failed to read countdown' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Missing Sheet ID' }, { status: 400 });
        }

        const sheets = await getSheetsClient();

        // POST with { clear: true } removes the override — reverts to auto schedule
        if (body.clear) {
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: OVERRIDE_RANGE,
            });
            return NextResponse.json({ success: true, cleared: true });
        }

        const { targetDate } = body;
        if (!targetDate) {
            return NextResponse.json({ error: 'Missing targetDate' }, { status: 400 });
        }

        const parsed = new Date(targetDate);
        if (isNaN(parsed.getTime())) {
            return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
        }

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: OVERRIDE_RANGE,
            valueInputOption: 'RAW',
            requestBody: { values: [[parsed.toISOString()]] },
        });

        return NextResponse.json({ success: true, cleared: false });
    } catch (err) {
        console.error('Countdown save error:', err);
        return NextResponse.json({ error: 'Failed to save countdown' }, { status: 500 });
    }
}
