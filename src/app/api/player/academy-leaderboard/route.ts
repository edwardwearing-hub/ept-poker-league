import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CareerTrackerStats } from '@/lib/poker-trainer/types';
import {
  buildAcademyLeaderboard,
  AcademyLeaderboardEntry,
} from '@/lib/poker-trainer/leaderboard';
import { getFirestoreDb, sanitizeDocId, listSavedPlayers } from '@/lib/firebase-admin';

export const revalidate = 0;

const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'academy-profiles.json');

async function getMergedProfiles(): Promise<Record<string, CareerTrackerStats>> {
  const profiles: Record<string, CareerTrackerStats> = {};

  // 1. Load from local backup file
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      Object.assign(profiles, parsed);
    }
  } catch (err) {
    console.error('Error reading local academy profiles file:', err);
  }

  // 2. Merge from Firebase Firestore if available
  const db = getFirestoreDb();
  if (db) {
    try {
      const snap = await db.collection('poker_players').get();
      snap.forEach((doc: any) => {
        const data = doc.data();
        if (data && data.name && data.stats) {
          const key = sanitizeDocId(data.name);
          profiles[key] = {
            ...data.stats,
            playerName: data.name,
            avatarUrl: data.avatarUrl,
            nickname: data.nickname,
          } as any;
        }
      });
    } catch (err) {
      console.warn('Could not fetch Firestore profiles for leaderboard:', err);
    }
  }

  return profiles;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get('name');

    const profiles = await getMergedProfiles();
    const leaderboard = buildAcademyLeaderboard(profiles);

    let playerStanding: {
      entry: AcademyLeaderboardEntry | null;
      behindLeaderChips: number;
      nextRankEntry: AcademyLeaderboardEntry | null;
      chipsToNextRank: number;
    } | null = null;

    const isGuest =
      !playerName ||
      playerName.toLowerCase().trim() === 'guest trainee' ||
      playerName.toLowerCase().trim() === 'guest';

    if (playerName && !isGuest) {
      const matchIdx = leaderboard.findIndex(
        (e) => e.name.toLowerCase().trim() === playerName.toLowerCase().trim()
      );
      if (matchIdx !== -1) {
        const entry = leaderboard[matchIdx];
        const leader = leaderboard[0];
        const nextRankEntry = matchIdx > 0 ? leaderboard[matchIdx - 1] : null;

        playerStanding = {
          entry,
          behindLeaderChips: Math.max(0, leader.chips - entry.chips),
          nextRankEntry,
          chipsToNextRank: nextRankEntry ? Math.max(0, nextRankEntry.chips - entry.chips) : 0,
        };
      }
    }

    return NextResponse.json({
      leaderboard,
      playerStanding,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error generating academy leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
