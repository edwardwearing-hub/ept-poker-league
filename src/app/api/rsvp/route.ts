import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getFirestoreDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const PLAYERS = [
    "Edward Wearing", "Liam Duxbury", "Luke Daly", "Georgina Wearing",
    "Daniel Horne", "Darren Daly", "Chris Daly", "Stephen Flood",
    "Dave Blackburn", "Nathen Benson", "Dave Taylor"
];

// In-memory fallback cache to ensure instant availability
let inMemoryRsvp: Record<string, boolean> = PLAYERS.reduce((acc, p) => ({ ...acc, [p]: false }), {});

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
            console.warn('Firestore RSVP read fallback:', e);
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

async function saveRegistrations(data: Record<string, boolean>) {
    inMemoryRsvp = data;
    const db = getFirestoreDb();
    if (db) {
        try {
            await db.collection('league_state').doc('rsvp').set(data, { merge: true });
            return;
        } catch (e) {
            console.warn('Firestore RSVP save warning:', e);
        }
    }

    // Defensive file writing for local dev and /tmp on Vercel
    for (const file of [DATA_FILE, TMP_FILE]) {
        try {
            fs.writeFileSync(file, JSON.stringify(data, null, 2));
            break;
        } catch {}
    }
}

export async function GET() {
    const data = await getRegistrations();
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { player, isPlaying } = body;

        if (!player) {
            return NextResponse.json({ error: 'Player name required' }, { status: 400 });
        }

        const currentData = await getRegistrations();
        currentData[player] = Boolean(isPlaying);
        await saveRegistrations(currentData);

        return NextResponse.json(currentData);
    } catch (error) {
        console.error('RSVP update error:', error);
        return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 });
    }
}
