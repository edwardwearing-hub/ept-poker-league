import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { verifyCsrf } from '@/lib/security';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
        return NextResponse.json({ error: csrf.reason || 'Forbidden' }, { status: 403 });
    }

    if (!verifyAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized: Invalid Admin Credentials' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const { date, potTotal, sidePot, players } = data;

        if (!date || !players) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // The system is now fully migrated to a live Google Sheet backend.
        // We log the data for auditing but no longer attempt to write to Vercel's read-only filesystem.
        console.log(`Submitted data for ${date}, pot: £${potTotal}. Google Sheets direct updates handle calculations.`);

        try {
            revalidatePath('/final');
            revalidatePath('/');
            revalidatePath('/presentation');
            revalidatePath('/history');
            revalidatePath('/stats');
        } catch (e) {
            console.warn("Revalidation warning:", e);
        }

        return NextResponse.json({ success: true, file: `virtual-game-${date}.csv` });
    } catch (error) {
        console.error('Error submitting game data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
