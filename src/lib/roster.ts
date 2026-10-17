/**
 * E.P.T. 2026 Poker League - Canonical Roster & Schedule Source of Truth
 * 
 * Centralizes player names, nicknames, season parameters, scoring rules,
 * and scheduled game dates to eliminate scattered duplicate arrays.
 */

export interface CanonicalPlayer {
    name: string;
    nickname: string;
    sheetName: string;
    isCoreMember: boolean;
}

export const CANONICAL_LEAGUE_PLAYERS: readonly CanonicalPlayer[] = [
    { name: "Edward Wearing", nickname: "Ed", sheetName: "Edward Wearing ", isCoreMember: true },
    { name: "Georgina Wearing", nickname: "Georgina", sheetName: "Georgina Wearing", isCoreMember: true },
    { name: "Luke Daly", nickname: "Luke", sheetName: "Luke Daly", isCoreMember: true },
    { name: "Daniel Horne", nickname: "Dan", sheetName: "Daniel Horne", isCoreMember: true },
    { name: "Darren Daly", nickname: "Darren", sheetName: "Darren Daly", isCoreMember: true },
    { name: "Chris Daly", nickname: "Chris", sheetName: "Chris Daly", isCoreMember: true },
    { name: "Stephen Flood", nickname: "Stephen", sheetName: "Stephen Flood", isCoreMember: true },
    { name: "Phil Landsberger", nickname: "Phil", sheetName: "Phil Landsberger", isCoreMember: true },
    { name: "Liam Duxbury", nickname: "Liam", sheetName: "Liam Duxbury", isCoreMember: true },
    { name: "Nathen Benson", nickname: "Nathen", sheetName: "Nathen Benson", isCoreMember: true },
    { name: "Dave Taylor", nickname: "Dave T", sheetName: "Dave Taylor", isCoreMember: true },
    { name: "Dave Blackburn", nickname: "Dave B", sheetName: "Dave Blackburn", isCoreMember: true },
] as const;

export const CANONICAL_PLAYER_NAMES: readonly string[] = CANONICAL_LEAGUE_PLAYERS.map(p => p.name);

/**
 * Normalizes an untrusted or user-supplied player name to its exact canonical name.
 * Case-insensitive, trims leading/trailing whitespace, and handles common nicknames.
 */
export function normalizePlayerName(rawName: string | null | undefined): string | null {
    if (!rawName || typeof rawName !== 'string') return null;
    const clean = rawName.trim().toLowerCase();

    for (const player of CANONICAL_LEAGUE_PLAYERS) {
        if (player.name.toLowerCase() === clean) return player.name;
        if (player.sheetName.trim().toLowerCase() === clean) return player.name;
        if (player.nickname.toLowerCase() === clean) return player.name;
    }

    // Common aliases
    if (clean === 'ed' || clean === 'edward' || clean === 'ted') return 'Edward Wearing';
    if (clean === 'georgina' || clean === 'george') return 'Georgina Wearing';
    if (clean === 'luke') return 'Luke Daly';
    if (clean === 'dan' || clean === 'daniel') return 'Daniel Horne';
    if (clean === 'darren' || clean === 'daz') return 'Darren Daly';
    if (clean === 'chris') return 'Chris Daly';
    if (clean === 'stephen' || clean === 'steve') return 'Stephen Flood';
    if (clean === 'phil') return 'Phil Landsberger';
    if (clean === 'liam') return 'Liam Duxbury';
    if (clean === 'nathen' || clean === 'nathan') return 'Nathen Benson';
    if (clean === 'dave taylor' || clean === 'taylor') return 'Dave Taylor';
    if (clean === 'dave blackburn' || clean === 'blackburn') return 'Dave Blackburn';

    return null;
}

export function isValidLeaguePlayer(name: string | null | undefined): boolean {
    return normalizePlayerName(name) !== null;
}

export interface ScheduledGame {
    gameNumber: number;
    date: string; // YYYY-MM-DD
    targetTime: string; // HH:mm UK
    title: string;
}

export const CANONICAL_SEASON_SCHEDULE: readonly ScheduledGame[] = [
    { gameNumber: 1, date: "2026-01-24", targetTime: "20:00", title: "Game 1 - Season Opener" },
    { gameNumber: 2, date: "2026-02-21", targetTime: "20:00", title: "Game 2 - Winter Clash" },
    { gameNumber: 3, date: "2026-03-21", targetTime: "20:00", title: "Game 3 - Spring Showdown" },
    { gameNumber: 4, date: "2026-04-25", targetTime: "20:00", title: "Game 4 - Mid-Season Sprint" },
    { gameNumber: 5, date: "2026-05-23", targetTime: "20:00", title: "Game 5 - Halfway Mark" },
    { gameNumber: 6, date: "2026-06-27", targetTime: "20:00", title: "Game 6 - Summer Heat" },
    { gameNumber: 7, date: "2026-07-25", targetTime: "20:00", title: "Game 7 - Championship Push" },
    { gameNumber: 8, date: "2026-08-22", targetTime: "20:00", title: "Game 8 - The Penultimate Stretch" },
    { gameNumber: 9, date: "2026-09-26", targetTime: "20:00", title: "Game 9 - Bubble Drama" },
    { gameNumber: 10, date: "2026-10-24", targetTime: "20:00", title: "Game 10 - Regular Season Finale" },
] as const;

export const TOTAL_REGULAR_SEASON_GAMES = 10;
export const GRAND_FINAL_MONTH = "December 2026";

export const LEAGUE_POINTS_RULES = {
    1: 10, // 1st Place
    2: 6,  // 2nd Place
    3: 4,  // 3rd Place
    4: 3,  // 4th Place
    5: 2,  // 5th Place
} as const;

export function getPointsForPosition(position: number): number {
    if (position === 1) return 10;
    if (position === 2) return 6;
    if (position === 3) return 4;
    if (position === 4) return 3;
    if (position === 5) return 2;
    return 0;
}
