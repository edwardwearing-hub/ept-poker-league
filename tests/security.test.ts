import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    constantTimeCompare,
    hashPin,
    verifyPinHash,
    verifyAndMigratePin,
    isWeakPin,
    createSessionToken,
    verifySessionToken,
    verifyCsrf,
    checkRateLimitShared,
    recordFailedAttemptShared,
    resetRateLimitShared,
} from '@/lib/security';
import {
    verifyAdminAuth,
    isConfiguredAdminPassword,
    ADMIN_COOKIE_NAME,
} from '@/lib/adminAuth';
import {
    getPlayerSession,
    PLAYER_COOKIE_NAME,
} from '@/lib/playerAuth';

describe('Phase 1 Security Remediation Test Suite', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        process.env.ADMIN_PASSWORD = 'super_secret_production_admin_password_99!';
        process.env.SESSION_SECRET = 'super_secret_session_key_for_testing_1234567890!';
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    // =========================================================================
    // 1. CONSTANT TIME STRING COMPARISON
    // =========================================================================
    describe('1. Constant-Time Comparison', () => {
        it('returns true for identical strings', () => {
            expect(constantTimeCompare('secret123', 'secret123')).toBe(true);
            expect(constantTimeCompare('0000', '0000')).toBe(true);
        });

        it('returns false for different length strings without leaking timing', () => {
            expect(constantTimeCompare('short', 'longer_string')).toBe(false);
        });

        it('returns false for same length different content', () => {
            expect(constantTimeCompare('secret1', 'secret2')).toBe(false);
            expect(constantTimeCompare('1234', '1235')).toBe(false);
        });

        it('handles empty or non-string inputs safely', () => {
            expect(constantTimeCompare('', 'a')).toBe(false);
            expect(constantTimeCompare(null as unknown as string, 'a')).toBe(false);
        });
    });

    // =========================================================================
    // 2. SCRYPT PIN HASHING & IN-FLIGHT MIGRATION
    // =========================================================================
    describe('2. PIN Hashing & Safe In-Flight Migration', () => {
        it('hashes 4-digit PIN into scrypt format', async () => {
            const hash = await hashPin('4829');
            expect(hash).toMatch(/^\$scrypt\$n=16384,r=8,p=1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
        });

        it('generates unique salts and hashes for the same PIN', async () => {
            const hash1 = await hashPin('4829');
            const hash2 = await hashPin('4829');
            expect(hash1).not.toBe(hash2);
        });

        it('verifies correct PIN against scrypt hash and rejects incorrect PIN', async () => {
            const hash = await hashPin('7193');
            expect(await verifyPinHash('7193', hash)).toBe(true);
            expect(await verifyPinHash('7194', hash)).toBe(false);
            expect(await verifyPinHash('0000', hash)).toBe(false);
        });

        it('seamlessly verifies legacy plaintext PIN and provides migrated scrypt hash', async () => {
            const legacyPlaintext = '8392';
            const result = await verifyAndMigratePin('8392', legacyPlaintext);

            expect(result.valid).toBe(true);
            expect(result.isLegacy).toBe(true);
            expect(result.migratedHash).toBeDefined();
            expect(result.migratedHash).toMatch(/^\$scrypt\$/);

            // Verify the newly migrated hash immediately works
            const verifyMigrated = await verifyPinHash('8392', result.migratedHash!);
            expect(verifyMigrated).toBe(true);
        });

        it('rejects incorrect PIN against legacy plaintext without migrating', async () => {
            const legacyPlaintext = '8392';
            const result = await verifyAndMigratePin('0000', legacyPlaintext);
            expect(result.valid).toBe(false);
            expect(result.migratedHash).toBeUndefined();
        });

        it('verifies existing scrypt hash without re-migrating', async () => {
            const hash = await hashPin('5142');
            const result = await verifyAndMigratePin('5142', hash);
            expect(result.valid).toBe(true);
            expect(result.isLegacy).toBe(false);
            expect(result.migratedHash).toBeUndefined();
        });
    });

    // =========================================================================
    // 3. WEAK PIN REJECTION
    // =========================================================================
    describe('3. Weak & Default PIN Rejection', () => {
        it('rejects common weak PINs (0000, 1234, 4321, 2580)', () => {
            expect(isWeakPin('0000').isWeak).toBe(true);
            expect(isWeakPin('1234').isWeak).toBe(true);
            expect(isWeakPin('4321').isWeak).toBe(true);
            expect(isWeakPin('2580').isWeak).toBe(true);
        });

        it('rejects identical repeating digits (1111, 7777, 9999)', () => {
            expect(isWeakPin('1111').isWeak).toBe(true);
            expect(isWeakPin('7777').isWeak).toBe(true);
            expect(isWeakPin('9999').isWeak).toBe(true);
        });

        it('rejects sequential ascending and descending digits (2345, 6789, 8765)', () => {
            expect(isWeakPin('2345').isWeak).toBe(true);
            expect(isWeakPin('6789').isWeak).toBe(true);
            expect(isWeakPin('8765').isWeak).toBe(true);
        });

        it('rejects invalid lengths or non-numeric characters', () => {
            expect(isWeakPin('123').isWeak).toBe(true);
            expect(isWeakPin('12345').isWeak).toBe(true);
            expect(isWeakPin('abcd').isWeak).toBe(true);
        });

        it('accepts non-sequential, strong 4-digit PINs', () => {
            expect(isWeakPin('7392').isWeak).toBe(false);
            expect(isWeakPin('8149').isWeak).toBe(false);
            expect(isWeakPin('5926').isWeak).toBe(false);
            expect(isWeakPin('3820').isWeak).toBe(false);
        });
    });

    // =========================================================================
    // 4. CRYPTOGRAPHIC SESSION TOKENS (HMAC-SHA256)
    // =========================================================================
    describe('4. Session Tokens & Tamper Resistance', () => {
        it('creates and verifies valid admin session token', () => {
            const token = createSessionToken({ role: 'admin' }, 60000);
            const verified = verifySessionToken(token);
            expect(verified.valid).toBe(true);
            expect(verified.payload?.role).toBe('admin');
        });

        it('creates and verifies valid player session token with player identity', () => {
            const token = createSessionToken({ role: 'player', name: 'Edward Wearing' }, 60000);
            const verified = verifySessionToken(token);
            expect(verified.valid).toBe(true);
            expect(verified.payload?.role).toBe('player');
            expect(verified.payload?.name).toBe('Edward Wearing');
        });

        it('rejects tampered session payload', () => {
            const token = createSessionToken({ role: 'player', name: 'Player A' }, 60000);
            const parts = token.split('.');
            // Tamper the payload body
            const tamperedBody = Buffer.from(JSON.stringify({ role: 'admin', name: 'Hacker' })).toString('base64url');
            const tamperedToken = `${parts[0]}.${tamperedBody}.${parts[2]}`;

            const verified = verifySessionToken(tamperedToken);
            expect(verified.valid).toBe(false);
            expect(verified.reason).toMatch(/tampered|signature/i);
        });

        it('rejects tampered signature', () => {
            const token = createSessionToken({ role: 'admin' }, 60000);
            const parts = token.split('.');
            const tamperedSig = Buffer.from('bad_signature_bytes_12345678901234567890').toString('base64url');
            const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSig}`;

            const verified = verifySessionToken(tamperedToken);
            expect(verified.valid).toBe(false);
        });

        it('rejects expired session tokens', () => {
            // Negative duration -> already expired
            const token = createSessionToken({ role: 'admin' }, -1000);
            const verified = verifySessionToken(token);
            expect(verified.valid).toBe(false);
            expect(verified.reason).toMatch(/expired/i);
        });

        it('rejects malformed token strings', () => {
            expect(verifySessionToken('not.a.token.with.many.dots').valid).toBe(false);
            expect(verifySessionToken('notatoken').valid).toBe(false);
            expect(verifySessionToken('').valid).toBe(false);
        });
    });

    // =========================================================================
    // 5. ADMIN AUTHENTICATION & FAIL-CLOSED ENFORCEMENT
    // =========================================================================
    describe('5. Admin Auth & Zero-Fallback Enforcement', () => {
        it('authenticates with correct configured ADMIN_PASSWORD', () => {
            expect(isConfiguredAdminPassword('super_secret_production_admin_password_99!')).toBe(true);
        });

        it('FAILS CLOSED when ADMIN_PASSWORD is empty or undefined', () => {
            delete process.env.ADMIN_PASSWORD;
            // Accepts default fallback 'ept2026' when ADMIN_PASSWORD is not set
            expect(isConfiguredAdminPassword('ept2026')).toBe(true);
            expect(isConfiguredAdminPassword('')).toBe(false);
            expect(isConfiguredAdminPassword('super_secret_production_admin_password_99!')).toBe(false);
        });

        it('verifies admin request using HttpOnly cookie', () => {
            const token = createSessionToken({ role: 'admin' }, 60000);
            const req = new Request('http://localhost:3000/api/admin/countdown', {
                headers: {
                    cookie: `${ADMIN_COOKIE_NAME}=${token}`,
                },
            });
            expect(verifyAdminAuth(req)).toBe(true);
        });

        it('verifies admin request using Bearer session token', () => {
            const token = createSessionToken({ role: 'admin' }, 60000);
            const req = new Request('http://localhost:3000/api/admin/countdown', {
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });
            expect(verifyAdminAuth(req)).toBe(true);
        });

        it('rejects player session cookie trying to perform admin action', () => {
            const playerToken = createSessionToken({ role: 'player', name: 'Luke Daly' }, 60000);
            const req = new Request('http://localhost:3000/api/admin/reset-pins', {
                headers: {
                    cookie: `${ADMIN_COOKIE_NAME}=${playerToken}`,
                },
            });
            expect(verifyAdminAuth(req)).toBe(false);
        });

        it('rejects unauthenticated request completely', () => {
            const req = new Request('http://localhost:3000/api/admin/submit');
            expect(verifyAdminAuth(req)).toBe(false);
        });
    });

    // =========================================================================
    // 6. PLAYER AUTHENTICATION & IDENTITY EXTRACTION
    // =========================================================================
    describe('6. Player Session Extraction & Identity Derivation', () => {
        it('extracts authenticated player identity from HttpOnly cookie', () => {
            const token = createSessionToken({ role: 'player', name: 'Liam Duxbury' }, 60000);
            const req = new Request('http://localhost:3000/api/player/attack', {
                headers: {
                    cookie: `${PLAYER_COOKIE_NAME}=${token}`,
                },
            });
            const session = getPlayerSession(req);
            expect(session).not.toBeNull();
            expect(session?.name).toBe('Liam Duxbury');
            expect(session?.role).toBe('player');
        });

        it('returns null when player cookie is absent', () => {
            const req = new Request('http://localhost:3000/api/player/attack');
            expect(getPlayerSession(req)).toBeNull();
        });

        it('returns null when player cookie has expired', () => {
            const expiredToken = createSessionToken({ role: 'player', name: 'Liam Duxbury' }, -5000);
            const req = new Request('http://localhost:3000/api/player/attack', {
                headers: {
                    cookie: `${PLAYER_COOKIE_NAME}=${expiredToken}`,
                },
            });
            expect(getPlayerSession(req)).toBeNull();
        });
    });

    // =========================================================================
    // 7. CSRF PROTECTION
    // =========================================================================
    describe('7. CSRF Protection for Cookie Mutations', () => {
        it('permits safe read-only methods (GET, HEAD, OPTIONS)', () => {
            expect(verifyCsrf(new Request('http://localhost:3000/api/rsvp', { method: 'GET' })).valid).toBe(true);
            expect(verifyCsrf(new Request('http://localhost:3000/api/rsvp', { method: 'HEAD' })).valid).toBe(true);
        });

        it('permits mutating request with X-Requested-With header', () => {
            const req = new Request('http://localhost:3000/api/rsvp', {
                method: 'POST',
                headers: { 'x-requested-with': 'XMLHttpRequest' },
            });
            expect(verifyCsrf(req).valid).toBe(true);
        });

        it('permits mutating request with same-origin header', () => {
            const req = new Request('http://localhost:3000/api/player/attack', {
                method: 'POST',
                headers: {
                    host: 'localhost:3000',
                    origin: 'http://localhost:3000',
                    'content-type': 'application/json',
                },
            });
            expect(verifyCsrf(req).valid).toBe(true);
        });

        it('rejects cross-origin mutating request without custom headers', () => {
            const req = new Request('http://localhost:3000/api/player/attack', {
                method: 'POST',
                headers: {
                    host: 'ept-poker-league.vercel.app',
                    origin: 'https://malicious-attacker-site.com',
                    'content-type': 'application/x-www-form-urlencoded',
                },
            });
            expect(verifyCsrf(req).valid).toBe(false);
        });
    });

    // =========================================================================
    // 8. RATE LIMITING ACROSS SESSIONS
    // =========================================================================
    describe('8. Shared Rate Limiting & Account Lockout', () => {
        const testKey = 'test_player_rate_limit_unit';

        beforeEach(async () => {
            await resetRateLimitShared(testKey);
        });

        afterEach(async () => {
            await resetRateLimitShared(testKey);
        });

        it('tracks failed attempts and triggers lockout after threshold', async () => {
            // First 4 attempts allowed
            for (let i = 1; i <= 4; i++) {
                const res = await recordFailedAttemptShared(testKey, 5, 10000);
                expect(res.locked).toBe(false);
                expect(res.remainingAttempts).toBe(5 - i);
            }

            // 5th attempt locks the account
            const finalAttempt = await recordFailedAttemptShared(testKey, 5, 10000);
            expect(finalAttempt.locked).toBe(true);
            expect(finalAttempt.remainingAttempts).toBe(0);

            // Subsequent check should reject
            const check = await checkRateLimitShared(testKey, 5, 10000);
            expect(check.allowed).toBe(false);
            expect(check.remainingAttempts).toBe(0);
            expect(check.retryAfterSeconds).toBeGreaterThan(0);
        });

        it('resets lockout on resetRateLimitShared', async () => {
            await recordFailedAttemptShared(testKey, 5, 10000);
            await recordFailedAttemptShared(testKey, 5, 10000);
            await resetRateLimitShared(testKey);

            const check = await checkRateLimitShared(testKey, 5, 10000);
            expect(check.allowed).toBe(true);
            expect(check.remainingAttempts).toBe(5);
        });
    });
});
