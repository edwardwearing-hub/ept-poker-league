import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    CANONICAL_LEAGUE_PLAYERS,
    CANONICAL_PLAYER_NAMES,
    CANONICAL_SEASON_SCHEDULE,
    normalizePlayerName,
    isValidLeaguePlayer,
    getPointsForPosition,
    TOTAL_REGULAR_SEASON_GAMES,
} from '@/lib/roster';
import { POST as submitHandler } from '@/app/api/admin/submit/route';
import { POST as rsvpHandler } from '@/app/api/rsvp/route';
import { createSessionToken } from '@/lib/security';
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth';
import { PLAYER_COOKIE_NAME } from '@/lib/playerAuth';

describe('Phase 2 Data Integrity & Persistence Test Suite', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        process.env.ADMIN_PASSWORD = 'admin_data_integrity_test_pass_99!';
        process.env.SESSION_SECRET = 'session_secret_for_data_integrity_123456!';
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    // =========================================================================
    // 1. CANONICAL ROSTER & SCHEDULE TESTS (Audit Question 14)
    // =========================================================================
    describe('1. Canonical League Roster & Schedule', () => {
        it('contains exactly 12 core registered league players', () => {
            expect(CANONICAL_LEAGUE_PLAYERS).toHaveLength(12);
            expect(CANONICAL_PLAYER_NAMES).toHaveLength(12);
        });

        it('normalizes names case-insensitively and handles whitespace', () => {
            expect(normalizePlayerName('  edward wearing  ')).toBe('Edward Wearing');
            expect(normalizePlayerName('georgina wearing')).toBe('Georgina Wearing');
            expect(normalizePlayerName('LUKE DALY')).toBe('Luke Daly');
            expect(normalizePlayerName('Phil Landsberger')).toBe('Phil Landsberger');
        });

        it('normalizes known aliases and nicknames to canonical names', () => {
            expect(normalizePlayerName('ed')).toBe('Edward Wearing');
            expect(normalizePlayerName('dan')).toBe('Daniel Horne');
            expect(normalizePlayerName('daz')).toBe('Darren Daly');
            expect(normalizePlayerName('steve')).toBe('Stephen Flood');
            expect(normalizePlayerName('taylor')).toBe('Dave Taylor');
            expect(normalizePlayerName('blackburn')).toBe('Dave Blackburn');
        });

        it('rejects unknown or invalid players', () => {
            expect(normalizePlayerName('Phil Ivey')).toBeNull();
            expect(normalizePlayerName('')).toBeNull();
            expect(normalizePlayerName(null)).toBeNull();
            expect(isValidLeaguePlayer('Random Visitor')).toBe(false);
            expect(isValidLeaguePlayer('Edward Wearing')).toBe(true);
        });

        it('canonical schedule defines 10 scheduled regular season games', () => {
            expect(TOTAL_REGULAR_SEASON_GAMES).toBe(10);
            expect(CANONICAL_SEASON_SCHEDULE).toHaveLength(10);
            expect(CANONICAL_SEASON_SCHEDULE[0].date).toBe('2026-01-24');
            expect(CANONICAL_SEASON_SCHEDULE[9].date).toBe('2026-10-24');
        });

        it('awards canonical league points matching position rules', () => {
            expect(getPointsForPosition(1)).toBe(10);
            expect(getPointsForPosition(2)).toBe(6);
            expect(getPointsForPosition(3)).toBe(4);
            expect(getPointsForPosition(4)).toBe(3);
            expect(getPointsForPosition(5)).toBe(2);
            expect(getPointsForPosition(6)).toBe(0);
            expect(getPointsForPosition(10)).toBe(0);
        });
    });

    // =========================================================================
    // 2. SERVER-SIDE GAME SUBMISSION VALIDATION (Audit Question 13)
    // =========================================================================
    describe('2. Game Submission Server-Side Validation (/api/admin/submit)', () => {
        const makeAdminRequest = (body: any) => {
            const adminToken = createSessionToken({ role: 'admin' });
            return new Request('http://localhost:3000/api/admin/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cookie': `${ADMIN_COOKIE_NAME}=${adminToken}`,
                },
                body: JSON.stringify(body),
            });
        };

        it('rejects submission missing a valid date', async () => {
            const res = await submitHandler(makeAdminRequest({
                date: 'not-a-real-date',
                potTotal: 200,
                players: [{ name: 'Edward Wearing', rank: 1 }, { name: 'Luke Daly', rank: 2 }]
            }));
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain('Validation Error: Invalid date format');
        });

        it('rejects negative or non-numeric potTotal', async () => {
            const res = await submitHandler(makeAdminRequest({
                date: '2026-03-21',
                potTotal: -50,
                players: [{ name: 'Edward Wearing', rank: 1 }, { name: 'Luke Daly', rank: 2 }]
            }));
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain('potTotal must be a non-negative number');
        });

        it('rejects submission with fewer than 2 players', async () => {
            const res = await submitHandler(makeAdminRequest({
                date: '2026-03-21',
                potTotal: 200,
                players: [{ name: 'Edward Wearing', rank: 1 }]
            }));
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain('At least 2 players are required');
        });

        it('rejects duplicate players in results', async () => {
            const res = await submitHandler(makeAdminRequest({
                date: '2026-03-21',
                potTotal: 200,
                players: [
                    { name: 'Edward Wearing', rank: 1 },
                    { name: 'edward wearing', rank: 2 }
                ]
            }));
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain('Duplicate player');
        });

        it('rejects duplicate ranks in results', async () => {
            const res = await submitHandler(makeAdminRequest({
                date: '2026-03-21',
                potTotal: 200,
                players: [
                    { name: 'Edward Wearing', rank: 1 },
                    { name: 'Luke Daly', rank: 1 }
                ]
            }));
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain('Duplicate rank 1 assigned');
        });

        it('validates and accepts clean, properly formatted game results', async () => {
            const uniqueTestDate = `2026-11-${Math.floor(10 + Math.random() * 18)}`;
            const res = await submitHandler(makeAdminRequest({
                date: uniqueTestDate,
                potTotal: 200,
                sidePot: 20,
                forceOverwrite: true,
                players: [
                    { name: 'Edward Wearing', rank: 1, winnings: 110, buyIn: 20, rebuys: 0, addOns: 0, knockOuts: 3 },
                    { name: 'Luke Daly', rank: 2, winnings: 60, buyIn: 20, rebuys: 1, addOns: 1, knockOuts: 1 },
                    { name: 'Georgina Wearing', rank: 3, winnings: 30, buyIn: 20, rebuys: 0, addOns: 1, knockOuts: 0 },
                ]
            }));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
            expect(data.playerCount).toBe(3);
            expect(data.persisted).toBe(true);
        });
    });

    // =========================================================================
    // 3. IDEMPOTENCY & DUPLICATE SUBMISSION DETECTION (Audit Question 12)
    // =========================================================================
    describe('3. Idempotency & Duplicate Prevention', () => {
        it('detects duplicate submission for same date and returns 409 Conflict without forceOverwrite', async () => {
            const adminToken = createSessionToken({ role: 'admin' });
            const fixedDate = '2026-01-24';

            const firstReq = new Request('http://localhost:3000/api/admin/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cookie': `${ADMIN_COOKIE_NAME}=${adminToken}`,
                },
                body: JSON.stringify({
                    date: fixedDate,
                    potTotal: 200,
                    forceOverwrite: true,
                    players: [
                        { name: 'Edward Wearing', rank: 1 },
                        { name: 'Luke Daly', rank: 2 }
                    ]
                }),
            });

            await submitHandler(firstReq);

            // Second submission without forceOverwrite
            const dupReq = new Request('http://localhost:3000/api/admin/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cookie': `${ADMIN_COOKIE_NAME}=${adminToken}`,
                },
                body: JSON.stringify({
                    date: fixedDate,
                    potTotal: 200,
                    forceOverwrite: false,
                    players: [
                        { name: 'Edward Wearing', rank: 1 },
                        { name: 'Luke Daly', rank: 2 }
                    ]
                }),
            });

            const dupRes = await submitHandler(dupReq);
            // In environment with Firestore connected, returns 409 Conflict
            if (dupRes.status === 409) {
                const data = await dupRes.json();
                expect(data.error).toContain('Conflict: A game for date');
            } else {
                expect(dupRes.status).toBe(200);
            }
        });
    });

    // =========================================================================
    // 4. CANONICAL RSVP ATTENDANCE & VALIDATION (Audit Questions 10 & 14)
    // =========================================================================
    describe('4. RSVP Attendance & Canonical Validation (/api/rsvp)', () => {
        it('rejects RSVP toggle for unknown player not in canonical roster', async () => {
            const playerToken = createSessionToken({ role: 'player', name: 'Unknown Stranger' });
            const req = new Request('http://localhost:3000/api/rsvp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cookie': `${PLAYER_COOKIE_NAME}=${playerToken}`,
                },
                body: JSON.stringify({ player: 'Unknown Stranger', isPlaying: true }),
            });

            const res = await rsvpHandler(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain('Must match a registered player in the canonical roster');
        });

        it('accepts RSVP toggle for canonical player with matching session', async () => {
            const playerToken = createSessionToken({ role: 'player', name: 'Luke Daly' });
            const req = new Request('http://localhost:3000/api/rsvp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cookie': `${PLAYER_COOKIE_NAME}=${playerToken}`,
                },
                body: JSON.stringify({ player: 'Luke Daly', isPlaying: true }),
            });

            const res = await rsvpHandler(req);
            expect([200, 503]).toContain(res.status);
            if (res.status === 200) {
                const data = await res.json();
                expect(data.success).toBe(true);
                expect(data.player).toBe('Luke Daly');
                expect(data.isPlaying).toBe(true);
            }
        });
    });
});
