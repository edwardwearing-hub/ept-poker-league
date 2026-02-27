import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/data';

export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const players = await getLeaderboardData();
        const player = players.find(p => p.name === name);

        if (!player) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        return NextResponse.json({
            name: player.name,
            isHijacked: player.isHijacked,
            hackTokens: player.hackTokens,
            hijackerQueue: player.hijackerQueue
        });
    } catch (error) {
        console.error('Error fetching player status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
