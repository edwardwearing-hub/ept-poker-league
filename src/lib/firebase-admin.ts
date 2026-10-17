import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';
import { CareerTrackerStats } from './poker-trainer/types';
import { getInitialTrackerStats } from './poker-trainer/tracker';

export interface PokerPlayerRecord {
  name: string;
  pin: string; // scrypt hash ($scrypt$...) or legacy PIN during migration
  nickname?: string;
  avatarUrl: string;
  isCustomPlayer: boolean; // true if created via zero-friction sign-in
  createdAt: number;
  lastLoginAt: number;
  stats: CareerTrackerStats;
  needsPinSetup?: boolean;
}

let firestoreInstance: Firestore | null = null;
let initAttempted = false;

export function getFirestoreDb(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;
  if (initAttempted) return firestoreInstance;
  initAttempted = true;

  try {
    if (getApps().length > 0) {
      firestoreInstance = getFirestore();
      return firestoreInstance;
    }

    let credentialsJson: any = null;

    // 1. Check for Base64 env variable (for Vercel / Cloud deployment)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      credentialsJson = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
      );
    } else {
      // 2. Check local service account file
      const localPath = path.join(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(localPath)) {
        const raw = fs.readFileSync(localPath, 'utf-8');
        credentialsJson = JSON.parse(raw);
      }
    }

    if (credentialsJson) {
      if (credentialsJson.private_key && typeof credentialsJson.private_key === 'string') {
        credentialsJson.private_key = credentialsJson.private_key.replace(/\\n/g, '\n');
      }
      initializeApp({
        credential: cert(credentialsJson),
        projectId: credentialsJson.project_id || 'jabb-new',
      });
      firestoreInstance = getFirestore();
      console.log('✅ Firebase Firestore initialized successfully for EPT Poker League.');
      return firestoreInstance;
    } else {
      console.warn('⚠️ No firebase-service-account.json found. Operating with local file persistence.');
      return null;
    }
  } catch (err) {
    console.warn('⚠️ Firebase Firestore initialization skipped or failed:', err);
    return null;
  }
}

const PLAYERS_COLLECTION = 'poker_players';

export function sanitizeDocId(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
}

/**
 * Fetch a player document from Firestore, with fallback to local JSON.
 */
export async function getPlayerDoc(name: string): Promise<PokerPlayerRecord | null> {
  if (!name || name.toLowerCase().trim() === 'guest trainee' || name.toLowerCase().trim() === 'guest') {
    return null;
  }

  const db = getFirestoreDb();
  const docId = sanitizeDocId(name);

  if (db) {
    try {
      const snap = await db.collection(PLAYERS_COLLECTION).doc(docId).get();
      if (snap.exists) {
        return snap.data() as PokerPlayerRecord;
      }
    } catch (err) {
      console.warn('Firestore fetch failed, checking local profiles:', err);
    }
  }

  // Fallback to local academy-profiles.json
  const local = getLocalProfile(docId);
  if (local) {
    const rawPin = (local as any).secretPin || '';
    return {
      name,
      pin: rawPin,
      nickname: (local as any).nickname || name.split(' ')[0],
      avatarUrl: (local as any).avatarUrl || '/avatars/avatar_shark.png',
      isCustomPlayer: true,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      stats: local,
      needsPinSetup: !rawPin,
    };
  }

  return null;
}

/**
 * Save or update a player document in Firestore and local backup.
 */
export async function savePlayerDoc(record: PokerPlayerRecord): Promise<boolean> {
  if (!record.name || record.name.toLowerCase().trim() === 'guest trainee' || record.name.toLowerCase().trim() === 'guest') {
    // Never persist guest data
    return false;
  }

  const docId = sanitizeDocId(record.name);
  const db = getFirestoreDb();

  // Always save local backup for dev
  saveLocalProfile(docId, record.stats, record.pin, record.avatarUrl, record.nickname);

  if (db) {
    try {
      await db.collection(PLAYERS_COLLECTION).doc(docId).set(
        {
          ...record,
          lastLoginAt: Date.now(),
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error('Firestore save failed:', err);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Database persistence failed. Profile changes could not be saved to Firestore.');
      }
    }
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('Database persistence unavailable: Firestore is not configured or offline.');
  }

  return true;
}

/**
 * List all saved players from Firestore combined with local records.
 */
export async function listSavedPlayers(): Promise<{ name: string; avatarUrl: string; nickname: string; chips: number }[]> {
  const playerMap = new Map<string, { name: string; avatarUrl: string; nickname: string; chips: number }>();

  // 1. Fetch from Firestore if available
  const db = getFirestoreDb();
  if (db) {
    try {
      const snap = await db.collection(PLAYERS_COLLECTION).get();
      snap.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data() as PokerPlayerRecord;
        if (data.name) {
          const stats = data.stats || getInitialTrackerStats();
          const chips = 10000 + (stats.netChipsWon || 0) + (stats.bountyCashWon || 0) + (stats.bailoutChipsReceived || 0);
          playerMap.set(data.name.toLowerCase().trim(), {
            name: data.name,
            avatarUrl: data.avatarUrl || '/avatars/avatar_shark.png',
            nickname: data.nickname || data.name.split(' ')[0],
            chips: Math.max(0, chips),
          });
        }
      });
    } catch (err) {
      console.warn('Could not list players from Firestore:', err);
    }
  }

  // 2. Fetch from local academy-profiles.json
  const localProfiles = getAllLocalProfiles();
  for (const [key, val] of Object.entries(localProfiles)) {
    const rawName = (val as any).playerName || key.replace(/_/g, ' ');
    const lower = rawName.toLowerCase().trim();
    if (lower === 'guest trainee' || lower === 'guest') continue;

    if (!playerMap.has(lower)) {
      const stats = val || getInitialTrackerStats();
      const chips = 10000 + (stats.netChipsWon || 0) + (stats.bountyCashWon || 0) + (stats.bailoutChipsReceived || 0);
      playerMap.set(lower, {
        name: rawName,
        avatarUrl: (val as any).avatarUrl || '/avatars/avatar_shark.png',
        nickname: (val as any).nickname || rawName.split(' ')[0],
        chips: Math.max(0, chips),
      });
    }
  }

  return Array.from(playerMap.values());
}

// Local file persistence helpers
const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'academy-profiles.json');

function getAllLocalProfiles(): Record<string, CareerTrackerStats> {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(PROFILES_FILE)) {
      fs.writeFileSync(PROFILES_FILE, JSON.stringify({}), 'utf-8');
      return {};
    }
    const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getLocalProfile(key: string): CareerTrackerStats | null {
  const all = getAllLocalProfiles();
  return all[key] || null;
}

function saveLocalProfile(
  key: string,
  stats: CareerTrackerStats,
  pin?: string,
  avatarUrl?: string,
  nickname?: string
) {
  try {
    const all = getAllLocalProfiles();
    all[key] = {
      ...stats,
      ...(pin ? { secretPin: pin } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(nickname ? { nickname } : {}),
    } as any;
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save local profile backup:', err);
  }
}
