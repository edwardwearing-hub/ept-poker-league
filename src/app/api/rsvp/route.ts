import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getFirestoreDb } from '@/lib/firebase-admin';
import { getPlayerSession } from '@/lib/playerAuth';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { verifyCsrf } from '@/lib/security';
import { CANONICAL_PLAYER_NAMES, normalizePlayerName } from '@/lib/roster';

export const dynamic = 'force-dynamic';

// Canonical In-memory fallback cache seeded with the canonical roster
let inMemoryRsvp: Record<string, boolean> = CANONICAL_PLAYER_NAMES.reduce(
    (acc, p) => ({ ...acc, [p]: false }),
    {}
);

const DATA_FILE = path.join(process.cwd(), 'registrations.json');
const TMP_FILE = path.join('/tmp', 'registrations.json');

async function getRegistrations(): Promise<Record<string, boolean>> {
    const db = getFirestoreDb();
    if (db) {
        try {
            const doc = await db.collection('league_state').doc('rsvp').get();
            if (doc.exists) {
                const data = doc.data() as Record<string, boolean>;
                inMemoryRsvp = { ...inMemoryRsvp, ...data };
                return inMemoryRsvp;
            }
        } catch (e) {
            console.warn('Firestore RSVP read warning:', e);
        }
    }

    for (const file of [DATA_FILE, TMP_FILE]) {
        try {
            if (fs.existsSync(file)) {
                const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
                inMemoryRsvp = { ...inMemoryRsvp, ...parsed };
                return inMemoryRsvp;
            }
        } catch {}
    }

    return inMemoryRsvp;
}

async function saveRegistrations(data: Record<string, boolean>): Promise<{ durable: boolean }> {
    inMemoryRsvp = data;
    const db = getFirestoreDb();
    if (db) {
        try {
            await db.collection('league_state').doc('rsvp').set(data, { merge: true });
            return { durable: true };
        } catch (e) {
            console.error('Firestore RSVP save error:', e);
            throw new Error('Database persistence failed. Please try again.');
        }
    }

    let written = false;
    for (const file of [DATA_FILE, TMP_FILE]) {
        try {
            fs.writeFileSync(file, JSON.stringify(data, null, 2));
            written = true;
            break;
        } catch {}
    }

    if (!written && process.env.NODE_ENV === 'production') {
        throw new Error('Persistent storage is not configured or unavailable in production.');
    }

    return { durable: written };
}

export async function GET() {
    const data = await getRegistrations();
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    // 1. CSRF Verification
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
        return NextResponse.json({ error: csrf.reason || 'Forbidden' }, { status: 403 });
    }

    // 2. Authentication & Authorization Check
    const session = getPlayerSession(request);
    const isAdmin = verifyAdminAuth(request);

    if (!session && !isAdmin) {
        return NextResponse.json({
            error: 'Unauthorized: You must log in with your PIN to update RSVP attendance.'
        }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { player, isPlaying } = body;

        if (!player) {
            return NextResponse.json({ error: 'Player name required' }, { status: 400 });
        }

        const targetPlayer = String(player).trim();

        // 3. Authorization Check: A player can ONLY toggle their own RSVP (unless admin)
        if (session && !isAdmin && session.name.toLowerCase() !== targetPlayer.toLowerCase()) {
            return NextResponse.json({
                error: 'Unauthorized: You can only update your own attendance status.'
            }, { status: 403 });
        }

        // 4. Canonical player roster verification
        const canonicalName = normalizePlayerName(targetPlayer);
        if (!canonicalName) {
            return NextResponse.json({ 
                error: `Unknown player '${player}'. Must match a registered player in the canonical roster.` 
            }, { status: 400 });
        }

        const currentData = await getRegistrations();
        currentData[canonicalName] = Boolean(isPlaying);
        
        await saveRegistrations(currentData);

        return NextResponse.json({
            success: true,
            player: canonicalName,
            isPlaying: Boolean(isPlaying),
            registrations: currentData
        });
    } catch (error: unknown) {
        console.error('RSVP update error:', error);
        const message = (error as Error)?.message || 'Failed to update RSVP. Database unreachable.';
        return NextResponse.json({ error: message }, { status: 503 });
    }
}
