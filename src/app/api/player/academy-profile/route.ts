import { NextResponse } from 'next/server';
import { getPlayerDoc, savePlayerDoc } from '@/lib/firebase-admin';
import { CareerTrackerStats } from '@/lib/poker-trainer/types';
import { computeDerivedMetrics, generatePlayerImprovementAdvice, getInitialTrackerStats } from '@/lib/poker-trainer/tracker';
import { getPlayerSession } from '@/lib/playerAuth';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { verifyCsrf } from '@/lib/security';

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name || name.toLowerCase().trim() === 'guest trainee' || name.toLowerCase().trim() === 'guest') {
      const stats = getInitialTrackerStats();
      const derived = computeDerivedMetrics(stats);
      const advice = generatePlayerImprovementAdvice(stats, 'Guest Trainee');
      return NextResponse.json({
        name: 'Guest Trainee',
        isGuest: true,
        stats,
        derived,
        advice,
      });
    }

    const doc = await getPlayerDoc(name.trim());
    const stats = doc?.stats || getInitialTrackerStats();
    const derived = computeDerivedMetrics(stats);
    const advice = generatePlayerImprovementAdvice(stats, name);

    return NextResponse.json({
      name: doc?.name || name,
      nickname: doc?.nickname,
      avatarUrl: doc?.avatarUrl,
      isGuest: false,
      stats,
      derived,
      advice,
    });
  } catch (error) {
    console.error('Error in GET /api/player/academy-profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // 1. CSRF Verification
  const csrf = verifyCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.reason || 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, stats } = body as { name?: string; stats?: CareerTrackerStats };

    if (!name || !stats) {
      return NextResponse.json({ error: 'Player name and stats are required' }, { status: 400 });
    }

    const cleanName = name.trim();

    // 2. CRITICAL USER RULE: If Guest, do NOT save any data, just return advice
    if (cleanName.toLowerCase() === 'guest trainee' || cleanName.toLowerCase() === 'guest') {
      const mergedStats: CareerTrackerStats = {
        ...getInitialTrackerStats(),
        ...stats,
      };
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

    // 3. Authorization Verification: Caller must have a valid session matching the targeted player
    const session = getPlayerSession(request);
    const isAdmin = verifyAdminAuth(request);

    if (!session && !isAdmin) {
      return NextResponse.json({
        error: 'Unauthorized: You must log in with your PIN to persist training stats.'
      }, { status: 401 });
    }

    if (session && !isAdmin && session.name.toLowerCase() !== cleanName.toLowerCase()) {
      return NextResponse.json({
        error: 'Unauthorized: You cannot overwrite another player’s academy profile.'
      }, { status: 403 });
    }

    const mergedStats: CareerTrackerStats = {
      ...getInitialTrackerStats(),
      ...stats,
      gradeCounts: { ...getInitialTrackerStats().gradeCounts, ...(stats.gradeCounts || {}) },
      leakCounts: { ...getInitialTrackerStats().leakCounts, ...(stats.leakCounts || {}) },
      handsByMode: { ...getInitialTrackerStats().handsByMode, ...(stats.handsByMode || {}) },
      byPosition: { ...getInitialTrackerStats().byPosition, ...(stats.byPosition || {}) },
      recentFeedback: stats.recentFeedback || [],
    };

    // 4. Update Firestore / Persistent Profile (preserving existing scrypt hash)
    const existing = await getPlayerDoc(cleanName);
    const updatedRecord = {
      name: cleanName,
      pin: existing?.pin || '', // never inject insecure default '0000'
      nickname: existing?.nickname || cleanName.split(' ')[0],
      avatarUrl: existing?.avatarUrl || '/avatars/avatar_shark.png',
      isCustomPlayer: existing?.isCustomPlayer ?? true,
      createdAt: existing?.createdAt || Date.now(),
      lastLoginAt: Date.now(),
      stats: mergedStats,
      needsPinSetup: existing?.needsPinSetup || false,
    };

    await savePlayerDoc(updatedRecord);

    const derived = computeDerivedMetrics(mergedStats);
    const advice = generatePlayerImprovementAdvice(mergedStats, cleanName);

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
