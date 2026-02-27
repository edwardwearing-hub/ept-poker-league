import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/data';

export async function POST(request: Request) {
    try {
        const { name, pin } = await request.json();

        if (!name || !pin) {
            return NextResponse.json({ error: 'Missing name or PIN' }, { status: 400 });
        }

        const players = await getLeaderboardData();
        const player = players.find(p => p.name === name);

        if (!player) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        // Verify PIN (ensure leading zeros match if stored as string)
        if (player.secretPin === pin.toString()) {
            return NextResponse.json({ success: true, name: player.name });
        } else {
            return NextResponse.json({ error: 'ACCESS DENIED' }, { status: 401 });
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
