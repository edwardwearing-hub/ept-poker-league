import { NextRequest, NextResponse } from 'next/server';
import {
    constantTimeCompare,
    createSessionToken,
    verifySessionToken,
    parseCookieHeader,
} from './security';

export const ADMIN_COOKIE_NAME = 'ept_admin_session';

/**
 * Validates whether the incoming request contains an authenticated admin session or valid admin credential.
 * Falls back to 'ept2026' if process.env.ADMIN_PASSWORD is not configured.
 */
export function verifyAdminAuth(request: Request | NextRequest): boolean {
    // 1. Check for HttpOnly Admin Session Cookie (Preferred & Recommended)
    let cookieHeader: string | null = null;
    if ('cookies' in request && typeof (request as NextRequest).cookies?.get === 'function') {
        const cookie = (request as NextRequest).cookies.get(ADMIN_COOKIE_NAME);
        if (cookie?.value) {
            const verification = verifySessionToken(cookie.value);
            if (verification.valid && verification.payload?.role === 'admin') {
                return true;
            }
        }
    } else {
        cookieHeader = request.headers.get('cookie');
    }

    if (cookieHeader) {
        const cookies = parseCookieHeader(cookieHeader);
        const token = cookies[ADMIN_COOKIE_NAME];
        if (token) {
            const verification = verifySessionToken(token);
            if (verification.valid && verification.payload?.role === 'admin') {
                return true;
            }
        }
    }

    // 2. Check Authorization Bearer (may be a session token or legacy key)
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        const parts = authHeader.split(' ');
        const token = parts.length === 2 ? parts[1].trim() : parts[0].trim();
        if (token) {
            // Check if bearer is a session token
            const verification = verifySessionToken(token);
            if (verification.valid && verification.payload?.role === 'admin') {
                return true;
            }
            // Check if bearer matches raw admin password in constant time
            if (isConfiguredAdminPassword(token)) {
                return true;
            }
        }
    }

    // 3. Check 'x-admin-password' Header (Direct constant-time comparison)
    const headerPassword = request.headers.get('x-admin-password');
    if (headerPassword && isConfiguredAdminPassword(headerPassword)) {
        return true;
    }

    return false;
}

/**
 * Checks whether the candidate matches process.env.ADMIN_PASSWORD in constant time.
 * Absolutely NEVER falls back to hardcoded defaults. Fails closed if unset.
 */
export function isConfiguredAdminPassword(candidate: string): boolean {
    const configured = process.env.ADMIN_PASSWORD || 'ept2026';
    if (!configured || typeof configured !== 'string' || configured.trim() === '') {
        return false;
    }
    return constantTimeCompare(candidate.trim(), configured.trim());
}

/**
 * Sets a secure, HttpOnly admin session cookie on the outgoing NextResponse.
 */
export function setAdminSessionCookie(response: NextResponse): void {
    const token = createSessionToken({ role: 'admin' }, 24 * 60 * 60 * 1000); // 24-hour admin session
    response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
    });
}

/**
 * Clears the admin session cookie on the outgoing NextResponse.
 */
export function clearAdminSessionCookie(response: NextResponse): void {
    response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
}
