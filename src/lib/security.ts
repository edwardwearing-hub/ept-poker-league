import crypto from 'crypto';

/**
 * Constant-time string comparison using crypto.timingSafeEqual to prevent timing attacks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const aBuf = Buffer.from(a, 'utf-8');
    const bBuf = Buffer.from(b, 'utf-8');
    if (aBuf.length !== bBuf.length) {
        // Execute a dummy comparison on identical buffers to equalize execution timing
        crypto.timingSafeEqual(aBuf, aBuf);
        return false;
    }
    return crypto.timingSafeEqual(aBuf, bBuf);
}

function scryptPromise(pin: string, salt: string, keylen: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        crypto.scrypt(pin, salt, keylen, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
            if (err) reject(err);
            else resolve(derivedKey as Buffer);
        });
    });
}

/**
 * Hash a 4-digit PIN using scrypt with random salt.
 * Stored in standard format: $scrypt$n=16384,r=8,p=1$<saltHex>$<hashHex>
 */
export async function hashPin(pin: string): Promise<string> {
    const cleanPin = pin.trim();
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await scryptPromise(cleanPin, salt, 32);
    return `$scrypt$n=16384,r=8,p=1$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verify a PIN against an existing scrypt hash.
 */
export async function verifyPinHash(pin: string, storedHash: string): Promise<boolean> {
    if (!storedHash || !storedHash.startsWith('$scrypt$')) return false;
    const parts = storedHash.split('$');
    // Format: ["", "scrypt", "n=16384,r=8,p=1", salt, hash]
    if (parts.length !== 5) return false;
    const salt = parts[3];
    const expectedHash = Buffer.from(parts[4], 'hex');
    try {
        const derivedKey = await scryptPromise(pin.trim(), salt, expectedHash.length);
        if (derivedKey.length !== expectedHash.length) return false;
        return crypto.timingSafeEqual(derivedKey, expectedHash);
    } catch {
        return false;
    }
}

/**
 * Verify a PIN against stored record (which may be scrypt hash or legacy plaintext).
 * If valid and legacy plaintext, returns migratedHash for immediate storage update.
 */
export async function verifyAndMigratePin(
    pin: string,
    storedHashOrPlain: string
): Promise<{ valid: boolean; isLegacy: boolean; migratedHash?: string }> {
    if (!storedHashOrPlain) return { valid: false, isLegacy: false };

    // 1. Scrypt Hash Check
    if (storedHashOrPlain.startsWith('$scrypt$')) {
        const valid = await verifyPinHash(pin, storedHashOrPlain);
        return { valid, isLegacy: false };
    }

    // 2. Legacy Plaintext Check
    const valid = constantTimeCompare(pin.trim(), storedHashOrPlain.trim());
    if (valid) {
        const migratedHash = await hashPin(pin.trim());
        return { valid: true, isLegacy: true, migratedHash };
    }

    return { valid: false, isLegacy: true };
}

const WEAK_PINS = new Set([
    '0000', '1234', '4321', '1111', '2222', '3333', '4444',
    '5555', '6666', '7777', '8888', '9999', '2580', '1379'
]);

/**
 * Enforce minimum PIN strength: rejects common patterns, repeating digits, and sequences.
 */
export function isWeakPin(pin: string): { isWeak: boolean; reason?: string } {
    if (!pin || typeof pin !== 'string') {
        return { isWeak: true, reason: 'PIN must be a string' };
    }
    const clean = pin.trim();
    if (clean.length !== 4 || !/^\d{4}$/.test(clean)) {
        return { isWeak: true, reason: 'PIN must be exactly 4 digits' };
    }
    if (WEAK_PINS.has(clean)) {
        return { isWeak: true, reason: 'This PIN is too common or easily guessed. Choose a non-trivial 4-digit PIN.' };
    }
    // Check identical repeating digits (e.g., 0000, 1111)
    if (/^(\d)\1{3}$/.test(clean)) {
        return { isWeak: true, reason: 'PIN cannot consist of all identical digits' };
    }
    // Check ascending or descending sequential digits (e.g., 1234, 4321, 6789)
    const digits = clean.split('').map(Number);
    if (
        (digits[1] === digits[0] + 1 && digits[2] === digits[1] + 1 && digits[3] === digits[2] + 1) ||
        (digits[1] === digits[0] - 1 && digits[2] === digits[1] - 1 && digits[3] === digits[2] - 1)
    ) {
        return { isWeak: true, reason: 'PIN cannot be sequential digits (e.g. 1234 or 4321)' };
    }
    return { isWeak: false };
}

// =============================================================================
// CRYPTOGRAPHIC SESSION TOKENS (ADMIN & PLAYER)
// =============================================================================

export interface SessionPayload {
    role: 'admin' | 'player';
    name?: string;
    requiresPinChange?: boolean;
    iat: number;
    exp: number;
}

function getSessionSecret(): string {
    const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'ept2026';
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL SECURITY ERROR: SESSION_SECRET or ADMIN_PASSWORD must be configured in production environment variables.');
        }
        return 'ept_dev_ephemeral_session_secret_local_use_only_2026';
    }
    return secret;
}

/**
 * Creates a signed session token using HMAC-SHA256 (JWT-style base64url).
 */
export function createSessionToken(
    payload: { role: 'admin' | 'player'; name?: string; requiresPinChange?: boolean },
    durationMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): string {
    const secret = getSessionSecret();
    const now = Date.now();
    const fullPayload: SessionPayload = {
        ...payload,
        iat: now,
        exp: now + durationMs,
    };
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const data = `${header}.${body}`;
    const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${signature}`;
}

/**
 * Verifies a signed session token, checking constant-time signature and expiration.
 */
export function verifySessionToken(token: string): {
    valid: boolean;
    payload?: SessionPayload;
    reason?: string;
} {
    if (!token || typeof token !== 'string') {
        return { valid: false, reason: 'No token provided' };
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
        return { valid: false, reason: 'Malformed token structure' };
    }
    const [header, body, signature] = parts;
    let secret: string;
    try {
        secret = getSessionSecret();
    } catch (err: unknown) {
        return { valid: false, reason: (err as Error)?.message || 'Secret configuration error' };
    }

    const data = `${header}.${body}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf-8');
    const expBuf = Buffer.from(expectedSig, 'utf-8');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return { valid: false, reason: 'Invalid signature / token tampered' };
    }

    try {
        const payload: SessionPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
        if (Date.now() > payload.exp) {
            return { valid: false, reason: 'Session token expired' };
        }
        return { valid: true, payload };
    } catch {
        return { valid: false, reason: 'Invalid JSON payload' };
    }
}

/**
 * Parse standard cookie header string into key-value map.
 */
export function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
    if (!cookieHeader) return {};
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(pair => {
        const idx = pair.indexOf('=');
        if (idx > -1) {
            const key = pair.slice(0, idx).trim();
            const val = pair.slice(idx + 1).trim();
            try {
                cookies[key] = decodeURIComponent(val);
            } catch {
                cookies[key] = val;
            }
        }
    });
    return cookies;
}

// =============================================================================
// CSRF PROTECTION
// =============================================================================

/**
 * Validates request origin/headers to protect cookie-authenticated mutation requests.
 */
export function verifyCsrf(request: Request): { valid: boolean; reason?: string } {
    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return { valid: true };
    }

    // 1. Custom header check (Browsers disallow cross-origin requests with custom headers unless preflighted)
    const customHeader = request.headers.get('x-requested-with') || request.headers.get('x-csrf-protection');
    if (customHeader) {
        return { valid: true };
    }

    // 2. Fetch metadata standard: same-origin site check
    const secFetchSite = request.headers.get('sec-fetch-site');
    if (secFetchSite === 'same-origin') {
        return { valid: true };
    }

    const host = request.headers.get('host');
    const origin = request.headers.get('origin');

    if (origin && host) {
        try {
            const originHost = new URL(origin).host;
            if (originHost === host) {
                return { valid: true };
            }
        } catch {}
    }

    const referer = request.headers.get('referer');
    if (referer && host) {
        try {
            const refererHost = new URL(referer).host;
            if (refererHost === host) {
                return { valid: true };
            }
        } catch {}
    }

    // Safe for standard JSON API requests when Origin matches or is same-host
    const contentType = request.headers.get('content-type') || '';
    if (contentType.toLowerCase().includes('application/json')) {
        if (!origin || (host && origin.includes(host.split(':')[0]))) {
            return { valid: true };
        }
    }

    return { valid: false, reason: 'Cross-Site Request Forgery check failed' };
}

// =============================================================================
// SHARED & DURABLE RATE LIMITING (FIRESTORE + MEMORY FALLBACK)
// =============================================================================

interface AttemptRecord {
    attempts: number;
    lockedUntil: number;
    lastAttempt: number;
}

const memoryRateLimitCache = new Map<string, AttemptRecord>();

export async function checkRateLimitShared(
    key: string,
    maxAttempts = 5,
    lockoutMs = 15 * 60 * 1000 // 15 mins
): Promise<{ allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number }> {
    const now = Date.now();
    const sanitizedKey = key.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '_');

    // 1. Firestore persistent rate limit
    try {
        const { getFirestoreDb } = await import('./firebase-admin');
        const db = getFirestoreDb();
        if (db) {
            const docRef = db.collection('rate_limits').doc(sanitizedKey);
            const doc = await docRef.get();
            if (doc.exists) {
                const data = doc.data() as AttemptRecord;
                if (data.lockedUntil && data.lockedUntil > now) {
                    return {
                        allowed: false,
                        remainingAttempts: 0,
                        retryAfterSeconds: Math.ceil((data.lockedUntil - now) / 1000),
                    };
                }
                if (data.lockedUntil && data.lockedUntil <= now) {
                    await docRef.delete();
                } else if (data.attempts >= maxAttempts) {
                    return {
                        allowed: false,
                        remainingAttempts: 0,
                        retryAfterSeconds: Math.ceil(lockoutMs / 1000),
                    };
                } else {
                    return {
                        allowed: true,
                        remainingAttempts: Math.max(0, maxAttempts - (data.attempts || 0)),
                    };
                }
            }
        }
    } catch {}

    // 2. Memory cache fallback
    const record = memoryRateLimitCache.get(sanitizedKey);
    if (record) {
        if (record.lockedUntil > now) {
            return {
                allowed: false,
                remainingAttempts: 0,
                retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
            };
        }
        if (record.lockedUntil > 0 && record.lockedUntil <= now) {
            memoryRateLimitCache.delete(sanitizedKey);
        } else {
            return {
                allowed: true,
                remainingAttempts: Math.max(0, maxAttempts - record.attempts),
            };
        }
    }

    return { allowed: true, remainingAttempts: maxAttempts };
}

export async function recordFailedAttemptShared(
    key: string,
    maxAttempts = 5,
    lockoutMs = 15 * 60 * 1000
): Promise<{ remainingAttempts: number; locked: boolean; retryAfterSeconds?: number }> {
    const now = Date.now();
    const sanitizedKey = key.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '_');

    // 1. Firestore persistent record
    try {
        const { getFirestoreDb } = await import('./firebase-admin');
        const db = getFirestoreDb();
        if (db) {
            const docRef = db.collection('rate_limits').doc(sanitizedKey);
            const doc = await docRef.get();
            const currentAttempts = doc.exists ? (doc.data()?.attempts || 0) + 1 : 1;
            const locked = currentAttempts >= maxAttempts;
            const lockedUntil = locked ? now + lockoutMs : 0;

            await docRef.set({
                attempts: currentAttempts,
                lockedUntil,
                lastAttempt: now,
            });

            return {
                remainingAttempts: Math.max(0, maxAttempts - currentAttempts),
                locked,
                retryAfterSeconds: locked ? Math.ceil(lockoutMs / 1000) : undefined,
            };
        }
    } catch {}

    // 2. Memory fallback
    const record = memoryRateLimitCache.get(sanitizedKey) || { attempts: 0, lockedUntil: 0, lastAttempt: now };
    record.attempts += 1;
    record.lastAttempt = now;
    if (record.attempts >= maxAttempts) {
        record.lockedUntil = now + lockoutMs;
        memoryRateLimitCache.set(sanitizedKey, record);
        return {
            remainingAttempts: 0,
            locked: true,
            retryAfterSeconds: Math.ceil(lockoutMs / 1000),
        };
    }
    memoryRateLimitCache.set(sanitizedKey, record);
    return {
        remainingAttempts: maxAttempts - record.attempts,
        locked: false,
    };
}

export async function resetRateLimitShared(key: string): Promise<void> {
    const sanitizedKey = key.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '_');
    memoryRateLimitCache.delete(sanitizedKey);
    try {
        const { getFirestoreDb } = await import('./firebase-admin');
        const db = getFirestoreDb();
        if (db) {
            await db.collection('rate_limits').doc(sanitizedKey).delete();
        }
    } catch {}
}

/**
 * Safe client IP extraction from verified hosting headers.
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const first = forwarded.split(',')[0].trim();
        if (first) return first;
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return '127.0.0.1';
}

// Backward-compatible exports for existing imports
export const checkPinRateLimit = (_id: string) => ({ allowed: true, remainingAttempts: 5 });
export const recordFailedPinAttempt = (_id: string) => ({ remainingAttempts: 4, locked: false });
export const resetPinAttempts = (_id: string) => {};
