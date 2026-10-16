import crypto from 'crypto';

/**
 * Constant-time string comparison using crypto.timingSafeEqual to prevent timing attacks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
    const aBuf = Buffer.from(a, 'utf-8');
    const bBuf = Buffer.from(b, 'utf-8');
    if (aBuf.length !== bBuf.length) {
        // Perform a dummy timingSafeEqual on identical buffers to equalize execution timing
        crypto.timingSafeEqual(aBuf, aBuf);
        return false;
    }
    return crypto.timingSafeEqual(aBuf, bBuf);
}

// In-memory rate limiter for PIN attempts: max 5 failed attempts per 10-minute window
interface AttemptRecord {
    count: number;
    lockoutUntil: number;
}

const pinAttempts = new Map<string, AttemptRecord>();

/**
 * Checks whether an account/IP is currently locked out from PIN attempts.
 */
export function checkPinRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
    const now = Date.now();
    const record = pinAttempts.get(identifier);

    if (record) {
        if (record.lockoutUntil > now) {
            return {
                allowed: false,
                remainingAttempts: 0,
                retryAfterSeconds: Math.ceil((record.lockoutUntil - now) / 1000)
            };
        }
        if (record.lockoutUntil > 0 && record.lockoutUntil <= now) {
            pinAttempts.delete(identifier);
        }
    }

    const currentCount = pinAttempts.get(identifier)?.count || 0;
    return { allowed: true, remainingAttempts: Math.max(0, 5 - currentCount) };
}

/**
 * Records a failed PIN attempt and triggers a 10-minute lockout on the 5th failed attempt.
 */
export function recordFailedPinAttempt(identifier: string): { remainingAttempts: number; locked: boolean } {
    const now = Date.now();
    const record = pinAttempts.get(identifier) || { count: 0, lockoutUntil: 0 };
    record.count += 1;

    if (record.count >= 5) {
        record.lockoutUntil = now + 10 * 60 * 1000; // 10 minutes lockout
        pinAttempts.set(identifier, record);
        return { remainingAttempts: 0, locked: true };
    }

    pinAttempts.set(identifier, record);
    return { remainingAttempts: 5 - record.count, locked: false };
}

/**
 * Clears failed attempts upon successful authentication.
 */
export function resetPinAttempts(identifier: string) {
    pinAttempts.delete(identifier);
}
