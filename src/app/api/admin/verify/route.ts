import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    if (!verifyAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized: Invalid Admin Password' }, { status: 401 });
    }
    return NextResponse.json({ success: true, message: 'Admin authenticated' });
}
