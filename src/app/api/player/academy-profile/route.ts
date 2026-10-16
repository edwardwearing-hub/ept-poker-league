import { NextResponse } from 'next/server';
import { CareerTrackerStats } from '@/lib/poker-trainer/types';
import {
  computeDerivedMetrics,
  generatePlayerImprovementAdvice,
  getInitialTrackerStats,
} from '@/lib/poker-trainer/tracker';
import { getPlayerDoc, savePlayerDoc } from '@/lib/firebase-admin';

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'Guest Trainee';
    const cleanName = name.trim();

    // Guest mode: always fresh baseline, never read saved stats
    if (cleanName.toLowerCase() === 'guest trainee' || cleanName.toLowerCase() === 'guest') {
      const stats = getInitialTrackerStats();
      const derived = computeDerivedMetrics(stats);
      const advice = generatePlayerImprovementAdvice(stats, 'Guest Trainee');
      return NextResponse.json({
        name: 'Guest Trainee',
        stats,
        derived,
        advice,
        isGuest: true,
      });
    }

    const doc = await getPlayerDoc(cleanName);
    const rawStats: CareerTrackerStats = doc?.stats || getInitialTrackerStats();
    const stats: CareerTrackerStats = {
      ...getInitialTrackerStats(),
      ...rawStats,
      bankruptcyCount: rawStats.bankruptcyCount || 0,
      bailoutChipsReceived: rawStats.bailoutChipsReceived || 0,
    };

    const derived = computeDerivedMetrics(stats);
    const advice = generatePlayerImprovementAdvice(stats, cleanName);

    return NextResponse.json({
      name: cleanName,
      stats,
      derived,
      advice,
      isGuest: false,
    });
  } catch (error) {
    console.error('Error in GET /api/player/academy-profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, stats } = body as { name?: string; stats?: CareerTrackerStats };

    if (!name || !stats) {
      return NextResponse.json({ error: 'Player name and stats are required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const mergedStats: CareerTrackerStats = {
      ...getInitialTrackerStats(),
      ...stats,
      gradeCounts: { ...getInitialTrackerStats().gradeCounts, ...(stats.gradeCounts || {}) },
      leakCounts: { ...getInitialTrackerStats().leakCounts, ...(stats.leakCounts || {}) },
      handsByMode: { ...getInitialTrackerStats().handsByMode, ...(stats.handsByMode || {}) },
      byPosition: { ...getInitialTrackerStats().byPosition, ...(stats.byPosition || {}) },
      recentFeedback: stats.recentFeedback || [],
    };

    // CRITICAL USER RULE: If Guest, do NOT save any data!
    if (cleanName.toLowerCase() === 'guest trainee' || cleanName.toLowerCase() === 'guest') {
      const derived = computeDerivedMetrics(mergedStats);
      const advice = generatePlayerImprovementAdvice(mergedStats, 'Guest Trainee');
      return NextResponse.json({
        success: true,
        name: 'Guest Trainee',
        isGuest: true,
        saved: false,
        message: 'Guest session data is not saved to Firebase or disk.',
        derived,
        advice,
      });
    }

    // Existing or custom player: fetch or update Firestore record
    const existing = await getPlayerDoc(cleanName);
    const updatedRecord = {
      name: cleanName,
      pin: existing?.pin || '0000',
      nickname: existing?.nickname || cleanName.split(' ')[0],
      avatarUrl: existing?.avatarUrl || '/avatars/avatar_shark.png',
      isCustomPlayer: existing?.isCustomPlayer ?? true,
      createdAt: existing?.createdAt || Date.now(),
      lastLoginAt: Date.now(),
      stats: mergedStats,
    };

    await savePlayerDoc(updatedRecord);

    const derived = computeDerivedMetrics(stats);
    const advice = generatePlayerImprovementAdvice(stats, cleanName);

    return NextResponse.json({
      success: true,
      name: cleanName,
      isGuest: false,
      saved: true,
      derived,
      advice,
    });
  } catch (error) {
    console.error('Error in POST /api/player/academy-profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
