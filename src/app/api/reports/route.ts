import { NextResponse } from 'next/server';
import { getGazetteReports } from '@/lib/data';

export async function GET() {
    try {
        const reports = await getGazetteReports();
        return NextResponse.json(reports);
    } catch (err) {
        console.error('Failed to fetch all reports:', err);
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}

