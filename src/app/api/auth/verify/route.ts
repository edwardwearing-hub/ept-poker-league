import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/data';
import { getPlayerDoc } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { name, pin } = await request.json();

    if (!name || !pin) {
      return NextResponse.json({ error: 'Missing name or PIN' }, { status: 400 });
    }

    const pinStr = pin.toString().trim();

    // 1. Check Google Sheet players
    const players = await getLeaderboardData();
    const sheetPlayer = players.find(
      (p) => p.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (sheetPlayer) {
      if ((sheetPlayer.secretPin || '0000') === pinStr) {
        return NextResponse.json({ success: true, name: sheetPlayer.name });
      } else {
        return NextResponse.json({ error: 'ACCESS DENIED: Incorrect PIN' }, { status: 401 });
      }
    }

    // 2. Check Firebase Firestore players
    const firestorePlayer = await getPlayerDoc(name);
    if (firestorePlayer) {
      if (firestorePlayer.pin === pinStr) {
        return NextResponse.json({ success: true, name: firestorePlayer.name });
      } else {
        return NextResponse.json({ error: 'ACCESS DENIED: Incorrect PIN' }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
