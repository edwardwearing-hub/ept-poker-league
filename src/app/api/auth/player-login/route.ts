import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/data';
import { getPlayerDoc, savePlayerDoc, PokerPlayerRecord } from '@/lib/firebase-admin';
import { getInitialTrackerStats } from '@/lib/poker-trainer/tracker';

export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, pin, isGuest, avatarUrl, nickname } = body as {
      name?: string;
      pin?: string;
      isGuest?: boolean;
      avatarUrl?: string;
      nickname?: string;
    };

    // 1. Guest Mode: No data saved, instant entry
    if (isGuest || (name && name.toLowerCase().trim() === 'guest trainee') || (name && name.toLowerCase().trim() === 'guest')) {
      return NextResponse.json({
        success: true,
        isGuest: true,
        name: 'Guest Trainee',
        avatarUrl: '/avatars/avatar_hoodie.png',
        bankroll: 10000,
        message: 'Playing as Guest Trainee. Your chips and hands will not be saved.',
      });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const pinStr = pin ? pin.toString().trim() : '';

    if (!pinStr || pinStr.length < 4) {
      return NextResponse.json({ error: 'A 4-digit PIN is required' }, { status: 400 });
    }

    // 2. Check if player is one of the 11 League Roster members from Google Sheets
    const sheetPlayers = await getLeaderboardData();
    const matchedSheetPlayer = sheetPlayers.find(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (matchedSheetPlayer) {
      const expectedPin = matchedSheetPlayer.secretPin || '0000';
      if (expectedPin === pinStr) {
        // Sync or get existing Firestore doc for this league player
        let firestoreDoc = await getPlayerDoc(matchedSheetPlayer.name);
        if (!firestoreDoc) {
          const freshStats = getInitialTrackerStats();
          firestoreDoc = {
            name: matchedSheetPlayer.name,
            pin: expectedPin,
            nickname: matchedSheetPlayer.nickname || matchedSheetPlayer.name.split(' ')[0],
            avatarUrl: matchedSheetPlayer.avatarUrl || '/avatars/avatar_shark.png',
            isCustomPlayer: false,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            stats: freshStats,
          };
          await savePlayerDoc(firestoreDoc);
        }

        const totalChips =
          10000 +
          (firestoreDoc.stats.netChipsWon || 0) +
          (firestoreDoc.stats.bountyCashWon || 0) +
          (firestoreDoc.stats.bailoutChipsReceived || 0);

        return NextResponse.json({
          success: true,
          isGuest: false,
          isNewPlayer: false,
          name: matchedSheetPlayer.name,
          nickname: matchedSheetPlayer.nickname,
          avatarUrl: matchedSheetPlayer.avatarUrl,
          bankroll: Math.max(0, totalChips),
          stats: firestoreDoc.stats,
          message: `Welcome back, ${matchedSheetPlayer.name}!`,
        });
      } else {
        return NextResponse.json({ error: 'ACCESS DENIED: Incorrect 4-digit PIN.' }, { status: 401 });
      }
    }

    // 3. Check if player already exists in Firebase Firestore
    const existingDoc = await getPlayerDoc(cleanName);

    if (existingDoc) {
      // Existing custom player -> verify PIN
      if (existingDoc.pin === pinStr) {
        const totalChips =
          10000 +
          (existingDoc.stats.netChipsWon || 0) +
          (existingDoc.stats.bountyCashWon || 0) +
          (existingDoc.stats.bailoutChipsReceived || 0);

        await savePlayerDoc({
          ...existingDoc,
          lastLoginAt: Date.now(),
        });

        return NextResponse.json({
          success: true,
          isGuest: false,
          isNewPlayer: false,
          name: existingDoc.name,
          nickname: existingDoc.nickname,
          avatarUrl: existingDoc.avatarUrl,
          bankroll: Math.max(0, totalChips),
          stats: existingDoc.stats,
          message: `Welcome back, ${existingDoc.name}!`,
        });
      } else {
        return NextResponse.json(
          { error: `ACCESS DENIED: Incorrect 4-digit PIN for player "${existingDoc.name}".` },
          { status: 401 }
        );
      }
    }

    // 4. Brand New Player -> Create instant record with £10,000 starting bankroll
    const newRecord: PokerPlayerRecord = {
      name: cleanName,
      pin: pinStr,
      nickname: nickname || cleanName.split(' ')[0],
      avatarUrl: avatarUrl || '/avatars/avatar_shark.png',
      isCustomPlayer: true,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      stats: getInitialTrackerStats(),
    };

    await savePlayerDoc(newRecord);

    return NextResponse.json({
      success: true,
      isGuest: false,
      isNewPlayer: true,
      name: cleanName,
      nickname: newRecord.nickname,
      avatarUrl: newRecord.avatarUrl,
      bankroll: 10000,
      stats: newRecord.stats,
      message: `Welcome to the League, ${cleanName}! Granted £10,000 starting bankroll.`,
    });
  } catch (error) {
    console.error('Error in /api/auth/player-login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
