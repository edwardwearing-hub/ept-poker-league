import { NextRequest, NextResponse } from 'next/server';
import {
    createSessionToken,
    verifySessionToken,
    parseCookieHeader,
} from './security';

export const PLAYER_COOKIE_NAME = 'ept_player_session';

export interface PlayerSession {
    name: string;
    role: 'player';
    requiresPinChange?: boolean;
}

/**
 * Extracts and verifies the player's server-side session from HttpOnly cookies or Bearer token.
 * Returns null if the session is absent, expired, or tampered.
 */
export function getPlayerSession(request: Request | NextRequest): PlayerSession | null {
    let token: string | null = null;

    // 1. NextRequest cookies API
    if ('cookies' in request && typeof (request as NextRequest).cookies?.get === 'function') {
        const cookie = (request as NextRequest).cookies.get(PLAYER_COOKIE_NAME);
        if (cookie?.value) {
            token = cookie.value;
        }
    }

    // 2. Cookie header fallback
    if (!token) {
        const cookieHeader = request.headers.get('cookie');
        if (cookieHeader) {
            const cookies = parseCookieHeader(cookieHeader);
            token = cookies[PLAYER_COOKIE_NAME] || null;
        }
    }

    // 3. Authorization Bearer header fallback
    if (!token) {
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7).trim();
        }
    }

    if (!token) return null;

    const result = verifySessionToken(token);
    if (!result.valid || !result.payload || result.payload.role !== 'player' || !result.payload.name) {
        return null;
    }

    return {
        name: result.payload.name,
        role: 'player',
        requiresPinChange: Boolean(result.payload.requiresPinChange),
    };
}

/**
 * Sets a secure, HttpOnly player session cookie.
 */
export function setPlayerSessionCookie(
    response: NextResponse,
    playerName: string,
    requiresPinChange = false
): void {
    const token = createSessionToken(
        { role: 'player', name: playerName, requiresPinChange },
        7 * 24 * 60 * 60 * 1000 // 7 days
    );

    response.cookies.set({
        name: PLAYER_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
    });
}

/**
 * Clears the player session cookie on logout.
 */
export function clearPlayerSessionCookie(response: NextResponse): void {
    response.cookies.set({
        name: PLAYER_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
}
