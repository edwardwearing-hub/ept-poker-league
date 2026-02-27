import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/data';

export const revalidate = 0;

export async function GET() {
    try {
        const players = await getLeaderboardData();
        // Return only what's needed for the login dropdown to avoid leaking PINs
        const playerList = players.map(p => ({
            name: p.name,
            avatarUrl: p.avatarUrl,
            nickname: p.nickname
        }));

        return NextResponse.json(playerList);
    } catch (error) {
        console.error('Error fetching player list:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
