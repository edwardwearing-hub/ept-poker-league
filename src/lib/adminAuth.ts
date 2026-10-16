import { NextRequest } from 'next/server';

/**
 * Validates whether the incoming request contains the correct admin credentials.
 * Checks 'x-admin-password' or 'authorization' headers against ADMIN_PASSWORD or fallback 'ept2026'.
 */
export function verifyAdminAuth(request: Request | NextRequest): boolean {
    const configuredPassword = process.env.ADMIN_PASSWORD || 'ept2026';

    const headerPassword = request.headers.get('x-admin-password');
    if (headerPassword && headerPassword.trim() === configuredPassword.trim()) {
        return true;
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        const parts = authHeader.split(' ');
        const token = parts.length === 2 ? parts[1] : parts[0];
        if (token && token.trim() === configuredPassword.trim()) {
            return true;
        }
    }

    return false;
}
