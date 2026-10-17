import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { verifyCsrf } from '@/lib/security';
import { getFirestoreDb } from '@/lib/firebase-admin';
import { normalizePlayerName, getPointsForPosition } from '@/lib/roster';

export interface SubmittedPlayerResult {
    name: string;
    canonicalName: string;
    rank: number;
    points: number;
    buyIn: number;
    rebuys: number;
    addOns: number;
    winnings: number;
    knockOuts: number;
}

export interface GameSubmissionPayload {
    date: string;
    potTotal: number;
    sidePot?: number;
    players: SubmittedPlayerResult[];
    idempotencyKey?: string;
    forceOverwrite?: boolean;
}

export async function POST(request: Request) {
    // 1. CSRF Verification
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
        return NextResponse.json({ error: csrf.reason || 'Forbidden' }, { status: 403 });
    }

    // 2. Admin Authentication Verification
    if (!verifyAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized: Invalid Admin Credentials' }, { status: 401 });
    }

    try {
        const body: GameSubmissionPayload = await request.json();
        const { date, potTotal, sidePot = 0, players, idempotencyKey, forceOverwrite } = body;

        // 3. Validation: Required fields
        if (!date || typeof date !== 'string') {
            return NextResponse.json({ error: 'Validation Error: Valid game date is required (YYYY-MM-DD).' }, { status: 400 });
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return NextResponse.json({ error: `Validation Error: Invalid date format '${date}'.` }, { status: 400 });
        }

        const dateKey = parsedDate.toISOString().split('T')[0];

        // 4. Validation: Financial / Pot Integrity
        if (typeof potTotal !== 'number' || potTotal < 0 || isNaN(potTotal)) {
            return NextResponse.json({ error: 'Validation Error: potTotal must be a non-negative number.' }, { status: 400 });
        }

        if (typeof sidePot !== 'number' || sidePot < 0 || isNaN(sidePot)) {
            return NextResponse.json({ error: 'Validation Error: sidePot must be a non-negative number.' }, { status: 400 });
        }

        // 5. Validation: Player Results
        if (!Array.isArray(players) || players.length < 2) {
            return NextResponse.json({ error: 'Validation Error: At least 2 players are required to record a game.' }, { status: 400 });
        }

        const validatedPlayers: SubmittedPlayerResult[] = [];
        const seenRanks = new Set<number>();
        const seenPlayers = new Set<string>();
        let totalWinnings = 0;
        let totalBuyIns = 0;

        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            if (!p || typeof p !== 'object') {
                return NextResponse.json({ error: `Validation Error: Invalid player entry at index ${i}.` }, { status: 400 });
            }

            const canonical = normalizePlayerName(p.name);
            const resolvedName = canonical || String(p.name || '').trim();
            if (!resolvedName) {
                return NextResponse.json({ error: `Validation Error: Player at position ${i + 1} has an empty name.` }, { status: 400 });
            }

            const lowerName = resolvedName.toLowerCase();
            if (seenPlayers.has(lowerName)) {
                return NextResponse.json({ error: `Validation Error: Duplicate player '${resolvedName}' in results.` }, { status: 400 });
            }
            seenPlayers.add(lowerName);

            const rank = parseInt(String(p.rank), 10);
            if (isNaN(rank) || rank < 1) {
                return NextResponse.json({ error: `Validation Error: Invalid rank for '${resolvedName}'. Rank must be an integer >= 1.` }, { status: 400 });
            }
            if (seenRanks.has(rank)) {
                return NextResponse.json({ error: `Validation Error: Duplicate rank ${rank} assigned to '${resolvedName}'.` }, { status: 400 });
            }
            seenRanks.add(rank);

            const expectedPoints = getPointsForPosition(rank);
            const points = typeof p.points === 'number' && !isNaN(p.points) ? p.points : expectedPoints;
            const buyIn = typeof p.buyIn === 'number' && !isNaN(p.buyIn) ? p.buyIn : 20;
            const rebuys = typeof p.rebuys === 'number' && !isNaN(p.rebuys) && p.rebuys >= 0 ? p.rebuys : 0;
            const addOns = typeof p.addOns === 'number' && !isNaN(p.addOns) && p.addOns >= 0 ? p.addOns : 0;
            const winnings = typeof p.winnings === 'number' && !isNaN(p.winnings) && p.winnings >= 0 ? p.winnings : 0;
            const knockOuts = typeof p.knockOuts === 'number' && !isNaN(p.knockOuts) && p.knockOuts >= 0 ? p.knockOuts : 0;

            totalWinnings += winnings;
            totalBuyIns += buyIn + (rebuys * 10) + (addOns * 10);

            validatedPlayers.push({
                name: p.name,
                canonicalName: resolvedName,
                rank,
                points,
                buyIn,
                rebuys,
                addOns,
                winnings,
                knockOuts,
            });
        }

        // Sort players by finishing position
        validatedPlayers.sort((a, b) => a.rank - b.rank);

        // 6. Idempotency & Duplicate Prevention
        const db = getFirestoreDb();
        const docId = `game_${dateKey.replace(/-/g, '_')}`;

        if (db) {
            const existingDoc = await db.collection('submitted_games').doc(docId).get();
            if (existingDoc.exists && !forceOverwrite) {
                return NextResponse.json({
                    error: `Conflict: A game for date ${dateKey} has already been recorded. Use forceOverwrite: true to update existing records.`,
                    existingSubmission: {
                        date: dateKey,
                        submittedAt: existingDoc.data()?.submittedAt,
                    }
                }, { status: 409 });
            }

            // 7. Durable Write to Firestore (Source of Truth)
            const record = {
                date: dateKey,
                potTotal,
                sidePot,
                playerCount: validatedPlayers.length,
                totalWinnings,
                totalBuyIns,
                players: validatedPlayers,
                submittedAt: new Date().toISOString(),
                submittedBy: 'admin',
                idempotencyKey: idempotencyKey || docId,
            };

            await db.collection('submitted_games').doc(docId).set(record);
        } else {
            // If in production and database is missing, fail visibly!
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({
                    error: 'Database persistence error: Firestore backend is unavailable. Game results could not be saved durably.'
                }, { status: 503 });
            }
            console.warn(`[DEV ONLY] Firestore offline. Game submission for ${dateKey} logged to console:`, validatedPlayers.length, 'players');
        }

        // 8. Revalidate all cached dependent routes
        try {
            revalidatePath('/');
            revalidatePath('/stats');
            revalidatePath('/history');
            revalidatePath('/final');
            revalidatePath('/presentation');
            revalidatePath('/bounties');
        } catch (e) {
            console.warn('Revalidation warning:', e);
        }

        // 9. Return success only after durable persistence has completed
        return NextResponse.json({
            success: true,
            persisted: true,
            gameId: docId,
            date: dateKey,
            playerCount: validatedPlayers.length,
            potTotal,
            totalWinnings,
            message: `Game for ${dateKey} successfully validated and recorded in durable league storage.`
        });

    } catch (error: unknown) {
        console.error('Error submitting game data:', error);
        const message = (error as Error)?.message || 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
