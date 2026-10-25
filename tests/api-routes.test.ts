import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as attackHandler } from '@/app/api/player/attack/route';
import { POST as redeemHandler } from '@/app/api/player/redeem/route';
import { POST as academyProfileHandler } from '@/app/api/player/academy-profile/route';
import { POST as rsvpHandler } from '@/app/api/rsvp/route';
import { POST as pinUpdateHandler } from '@/app/api/auth/pin-update/route';
import { POST as adminVerifyHandler } from '@/app/api/admin/verify/route';
import { POST as adminCountdownHandler } from '@/app/api/admin/countdown/route';
import { POST as adminSubmitHandler } from '@/app/api/admin/submit/route';
import { POST as adminResetPinsHandler } from '@/app/api/admin/reset-pins/route';
import { createSessionToken } from '@/lib/security';
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth';
import { PLAYER_COOKIE_NAME } from '@/lib/playerAuth';

describe('API Route Handlers Authorization & Protection', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        process.env.ADMIN_PASSWORD = 'admin_super_secret_testing_password_99!';
        process.env.SESSION_SECRET = 'session_secret_for_api_route_testing_12345!';
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    // =========================================================================
    // 1. ADMIN ROUTES PROTECTION
    // =========================================================================
    describe('Admin Write Endpoints Authorization', () => {
        it('POST /api/admin/verify rejects unauthenticated requests', async () => {
            const req = new Request('http://localhost:3000/api/admin/verify', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                },
                body: JSON.stringify({ password: 'wrong_password' }),
            });
            const res = await adminVerifyHandler(req);
            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toMatch(/unauthorized|invalid/i);
        });

        it('POST /api/admin/verify FAILS CLOSED when ADMIN_PASSWORD is unset', async () => {
            delete process.env.ADMIN_PASSWORD;
            const req = new Request('http://localhost:3000/api/admin/verify', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                },
                body: JSON.stringify({ password: 'ept2026' }),
            });
            const res = await adminVerifyHandler(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
        });

        it('POST /api/admin/verify succeeds with correct password and sets HttpOnly cookie', async () => {
            const req = new Request('http://localhost:3000/api/admin/verify', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                },
                body: JSON.stringify({ password: 'admin_super_secret_testing_password_99!' }),
            });
            const res = await adminVerifyHandler(req);
            expect(res.status).toBe(200);
            const setCookie = res.headers.get('set-cookie');
            expect(setCookie).toBeDefined();
            expect(setCookie).toContain(ADMIN_COOKIE_NAME);
            expect(setCookie).toContain('HttpOnly');
        });

        it('POST /api/admin/countdown rejects unauthenticated callers', async () => {
            const req = new Request('http://localhost:3000/api/admin/countdown', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                },
                body: JSON.stringify({ targetDate: '2026-12-01T20:00:00Z' }),
            });
            const res = await adminCountdownHandler(req);
            expect(res.status).toBe(401);
        });

        it('POST /api/admin/submit rejects unauthenticated callers', async () => {
            const req = new Request('http://localhost:3000/api/admin/submit', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                },
                body: JSON.stringify({ date: '2026-05-01', players: [] }),
            });
            const res = await adminSubmitHandler(req);
            expect(res.status).toBe(401);
        });

        it('POST /api/admin/reset-pins rejects unauthenticated callers', async () => {
            const req = new Request('http://localhost:3000/api/admin/reset-pins', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                },
                body: JSON.stringify({}),
            });
            const res = await adminResetPinsHandler(req);
            expect(res.status).toBe(401);
        });
    });

    // =========================================================================
    // 2. PLAYER MUTATION ROUTES PROTECTION
    // =========================================================================
    describe('Player Mutation Endpoints Authorization', () => {
        it('POST /api/player/attack rejects unauthenticated caller', async () => {
            const req = new Request('http://localhost:3000/api/player/attack', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                },
                body: JSON.stringify({ attacker: 'Player A', target: 'Player B' }),
            });
            const res = await attackHandler(req);
            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toMatch(/unauthorized/i);
        });

        it('POST /api/player/attack prevents self-attack even with valid session', async () => {
            const token = createSessionToken({ role: 'player', name: 'Edward Wearing' }, 60000);
            const req = new Request('http://localhost:3000/api/player/attack', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                    cookie: `${PLAYER_COOKIE_NAME}=${token}`,
                },
                body: JSON.stringify({ target: 'Edward Wearing' }),
            });
            const res = await attackHandler(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toMatch(/cannot launch an attack against yourself/i);
        });

        it('POST /api/player/redeem rejects unauthenticated caller', async () => {
            const req = new Request('http://localhost:3000/api/player/redeem', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                },
                body: JSON.stringify({ playerName: 'Edward Wearing' }),
            });
            const res = await redeemHandler(req);
            expect(res.status).toBe(401);
        });

        it('POST /api/player/redeem prevents Player A from redeeming Player B', async () => {
            const token = createSessionToken({ role: 'player', name: 'Player A' }, 60000);
            const req = new Request('http://localhost:3000/api/player/redeem', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                    cookie: `${PLAYER_COOKIE_NAME}=${token}`,
                },
                body: JSON.stringify({ playerName: 'Player B' }),
            });
            const res = await redeemHandler(req);
            expect(res.status).toBe(403);
            const data = await res.json();
            expect(data.error).toMatch(/cannot redeem another player/i);
        });

        it('POST /api/player/academy-profile rejects unauthenticated stats persistence', async () => {
            const req = new Request('http://localhost:3000/api/player/academy-profile', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                },
                body: JSON.stringify({ name: 'Edward Wearing', stats: { handsPlayed: 50 } }),
            });
            const res = await academyProfileHandler(req);
            expect(res.status).toBe(401);
        });

        it('POST /api/player/academy-profile prevents Player A from overwriting Player B profile', async () => {
            const token = createSessionToken({ role: 'player', name: 'Player A' }, 60000);
            const req = new Request('http://localhost:3000/api/player/academy-profile', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                    cookie: `${PLAYER_COOKIE_NAME}=${token}`,
                },
                body: JSON.stringify({ name: 'Player B', stats: { handsPlayed: 9999 } }),
            });
            const res = await academyProfileHandler(req);
            expect(res.status).toBe(403);
            const data = await res.json();
            expect(data.error).toMatch(/cannot overwrite another player/i);
        });

        it('POST /api/rsvp rejects unauthenticated RSVP toggling', async () => {
            const req = new Request('http://localhost:3000/api/rsvp', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                },
                body: JSON.stringify({ player: 'Edward Wearing', isPlaying: true }),
            });
            const res = await rsvpHandler(req);
            expect(res.status).toBe(401);
        });

        it('POST /api/rsvp prevents Player A from modifying Player B RSVP', async () => {
            const token = createSessionToken({ role: 'player', name: 'Player A' }, 60000);
            const req = new Request('http://localhost:3000/api/rsvp', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                    cookie: `${PLAYER_COOKIE_NAME}=${token}`,
                },
                body: JSON.stringify({ player: 'Player B', isPlaying: true }),
            });
            const res = await rsvpHandler(req);
            expect(res.status).toBe(403);
            const data = await res.json();
            expect(data.error).toMatch(/only update your own attendance/i);
        });
    });

    // =========================================================================
    // 3. PIN UPDATE ENDPOINT PROTECTION
    // =========================================================================
    describe('PIN Update Protection & Strength Enforcement', () => {
        it('POST /api/auth/pin-update rejects weak PINs (0000, 1234)', async () => {
            const req = new Request('http://localhost:3000/api/auth/pin-update', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                },
                body: JSON.stringify({ playerName: 'Edward Wearing', newPin: '0000' }),
            });
            const res = await pinUpdateHandler(req);
            expect(res.status).toBe(422);
            const data = await res.json();
            expect(data.error).toMatch(/insecure PIN|too common/i);
        });

        it('POST /api/auth/pin-update prevents Player A from modifying Player B PIN', async () => {
            const token = createSessionToken({ role: 'player', name: 'Player A' }, 60000);
            const req = new Request('http://localhost:3000/api/auth/pin-update', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                    cookie: `${PLAYER_COOKIE_NAME}=${token}`,
                },
                body: JSON.stringify({ playerName: 'Player B', newPin: '7392' }),
            });
            const res = await pinUpdateHandler(req);
            expect(res.status).toBe(403);
            const data = await res.json();
            expect(data.error).toMatch(/cannot change another player/i);
        });
    });
});

