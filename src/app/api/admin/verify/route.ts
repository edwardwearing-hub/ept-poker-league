import { NextResponse } from 'next/server';
import {
    verifyAdminAuth,
    isConfiguredAdminPassword,
    setAdminSessionCookie,
    clearAdminSessionCookie,
} from '@/lib/adminAuth';
import {
    checkRateLimitShared,
    recordFailedAttemptShared,
    resetRateLimitShared,
    getClientIp,
    verifyCsrf,
} from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const isAuthenticated = verifyAdminAuth(request);
    return NextResponse.json({ authenticated: isAuthenticated });
}

export async function POST(request: Request) {
    // CSRF check
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
        return NextResponse.json({ error: csrf.reason || 'Forbidden' }, { status: 403 });
    }

    const ip = getClientIp(request);
    const rateLimitKey = `admin_login_${ip}`;

    // 1. Rate limiting check
    const rateCheck = await checkRateLimitShared(rateLimitKey, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
        return NextResponse.json(
            { error: `Too many failed admin login attempts. Account locked for ${rateCheck.retryAfterSeconds} seconds.` },
            { status: 429 }
        );
    }

    // 2. Fail closed if ADMIN_PASSWORD is unset
    if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.trim() === '') {
        return NextResponse.json(
            { error: 'Server configuration error: ADMIN_PASSWORD is not configured.' },
            { status: 500 }
        );
    }

    // 3. Extract candidate password from header or body
    let candidate = request.headers.get('x-admin-password') || '';
    if (!candidate) {
        try {
            const body = await request.json();
            candidate = body.password || '';
        } catch {}
    }

    // If already authenticated via valid cookie, renew session
    if (!candidate && verifyAdminAuth(request)) {
        const response = NextResponse.json({ success: true, message: 'Admin session renewed' });
        setAdminSessionCookie(response);
        return response;
    }

    if (!candidate || !isConfiguredAdminPassword(candidate)) {
        const failed = await recordFailedAttemptShared(rateLimitKey, 5, 15 * 60 * 1000);
        const msg = failed.locked
            ? 'Access Denied: 5 failed attempts reached. Locked out for 15 minutes.'
            : `Unauthorized: Invalid Admin Password (${failed.remainingAttempts} attempts remaining).`;
        return NextResponse.json({ error: msg }, { status: 401 });
    }

    // Reset rate limit on success
    await resetRateLimitShared(rateLimitKey);

    // Issue HttpOnly admin session cookie
    const response = NextResponse.json({ success: true, message: 'Admin authenticated' });
    setAdminSessionCookie(response);
    return response;
}

export async function DELETE(request: Request) {
    const response = NextResponse.json({ success: true, message: 'Admin logged out' });
    clearAdminSessionCookie(response);
    return response;
}
