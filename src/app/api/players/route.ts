import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/data';
import { listSavedPlayers } from '@/lib/firebase-admin';

export const revalidate = 0;

export async function GET() {
  try {
    const sheetPlayers = await getLeaderboardData();
    const customPlayers = await listSavedPlayers();

    const playerMap = new Map<string, { name: string; avatarUrl: string; nickname: string; isCustom?: boolean }>();

    for (const p of sheetPlayers) {
      playerMap.set(p.name.toLowerCase().trim(), {
        name: p.name,
        avatarUrl: p.avatarUrl || '/avatars/avatar_hoodie.png',
        nickname: p.nickname || p.name.split(' ')[0],
        isCustom: false,
      });
    }

    for (const p of customPlayers) {
      const key = p.name.toLowerCase().trim();
      if (!playerMap.has(key)) {
        playerMap.set(key, {
          name: p.name,
          avatarUrl: p.avatarUrl || '/avatars/avatar_shark.png',
          nickname: p.nickname || p.name.split(' ')[0],
          isCustom: true,
        });
      }
    }

    return NextResponse.json(Array.from(playerMap.values()));
  } catch (error) {
    console.error('Error fetching player list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
