
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';

export async function getSheetsClient() {
    let auth;

    // Check if we are running in Vercel/Production with ENV variables injected via Base64 to avoid string escaping issues
    if (process.env.GOOGLE_CREDENTIALS_BASE64) {
        const credentialsJson = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8'));

        auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: credentialsJson.client_email,
                private_key: credentialsJson.private_key,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    } else {
        // Fallback for Local Development
        auth = new google.auth.GoogleAuth({
            keyFile: path.join(process.cwd(), 'google-credentials.json'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }

    return google.sheets({ version: 'v4', auth });
}

export interface PlayerStats {
    rank: number;
    name: string;
    gamesPlayed: number;
    wins: number;
    points: number;
    rebuys: number;
    addOns: number;
    cashPaid: number;
    winnings: number;
    profit: number;
    bonusChips: number;
    knockOuts: number;
    // Advanced Stats from Player Sheet
    rivalPlayer?: string;
    bulliedPlayer?: string;
    winPercentage?: number;
    avgKnockouts?: number;
    cashFlowHistory?: { date: string; profit: number }[];
    nickname?: string;
    avatarUrl?: string;
    enemyQueue?: string[];
    // New Bounty Board Metrics (Phase 8)
    totalHistoricalKOs?: number;        // The Executioner
    totalTimesKnockedOut?: number;      // The Bullet Sponge
    uniquePlayersHijacked?: string[];   // The Hijack King
    koToGameRatio?: number;             // The Apex Predator
    // Module 1-4: PvP Ecosystem Metrics
    secretPin?: string;                 // 4-digit PIN (stored as string to preserve leading zeros)
    hackTokens?: number;                // Offensive currency
    isHijacked?: boolean;               // Current status
    hijackerQueue?: string[];           // List of attackers
}

export async function getLeaderboardData(): Promise<PlayerStats[]> {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
    if (!spreadsheetId) {
        console.warn("No GOOGLE_SHEET_ID provided in .env.local");
        return [];
    }

    try {
        const sheets = await getSheetsClient();

        // 1. Fetch all sheet names
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetNames = meta.data.sheets?.map(s => s.properties?.title || "") || [];

        // 2. We want to pull Sheet1, and every individual player sheet if they exist
        const ranges = ['Sheet1!A1:Z30', 'PVP_SYSTEM!B1:F30'];
        const allowedPlayers = [
            "Edward Wearing", "Georgina Wearing", "Luke Daly", "Daniel Horne",
            "Darren Daly", "Chris Daly", "Stephen Flood", "Phil Landsberger",
            "Liam Duxbury", "Nathen Benson", "Dave Taylor"
        ];

        allowedPlayers.forEach(name => {
            const exactSheetMatch = sheetNames.find(n => n.trim().toLowerCase() === name.toLowerCase());
            if (exactSheetMatch) {
                ranges.push(`'${exactSheetMatch}'!A1:Z30`);
            }
        });

        // 3. Batch fetch
        const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges,
        });

        const valueRanges = response.data.valueRanges || [];
        // The first one is Sheet1
        const mainSheetInfo = valueRanges[0];
        const jsonData = mainSheetInfo.values || [];

        const players: PlayerStats[] = [];
        const seenPlayers = new Set<string>();

        // Phase 8: Accumulate who killed who across all sheets for the Hijack King stat
        const killerToVictimsMap: Record<string, Set<string>> = {};

        const nicknames: Record<string, string> = {
            "Edward Wearing": "The Bounty",
            "Liam Duxbury": "The Shark",
            "Luke Daly": "The Duke",
            "Georgina Wearing": "The Queen",
            "Daniel Horne": "The Joker",
            "Darren Daly": "Double D",
            "Chris Daly": "The Wildcard",
            "Stephen Flood": "The Flash",
            "Phil Landsberger": "The Professor",
            "Nathen Benson": "Big Stack",
            "Dave Taylor": "The Ace"
        };

        const avatars: Record<string, string> = {
            "Edward Wearing": "/avatars/avatar_bounty.png",
            "Liam Duxbury": "/avatars/avatar_shark.png",
            "Luke Daly": "/avatars/avatar_duke.png",
        };

        const defaults = ["/avatars/avatar_hoodie.png"];

        const parseMoney = (val: string | number | undefined | null) => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            return parseFloat(val.toString().replace(/[^0-9.-]+/g, "")) || 0;
        };

        // Main sheet data starts at index 6 in the new API response
        for (let i = 6; i < jsonData.length; i++) {
            const row = jsonData[i];

            // Reached the end (No Of Players row)
            if (row[0] === "No Of Players") break;

            if (!row || !row[0]) continue;

            const rawName = row[0].toString().trim();
            const matchedName = allowedPlayers.find(p => p.toLowerCase() === rawName.toLowerCase());

            if (!matchedName) continue;
            if (seenPlayers.has(matchedName)) continue;
            seenPlayers.add(matchedName);

            // Games played is explicitly listed in Column B (index 1)
            const gamesPlayed = parseInt(row[1]) || 0;

            // Bounty Board Stats
            let rival = "N/A";
            let bullied = "N/A";
            let winPct = 0;
            let avgKo = 0;
            let totalTimesKnockedOut = 0;
            let uniquePlayersHijacked = new Set<string>();
            let totalHistoricalKOs = 0;

            const cashFlow: { date: string; profit: number }[] = [];
            const enemyQueue: string[] = [];

            // Check the batched responses for this player's specific sheet
            const pRange = valueRanges.find(r => r.range?.toLowerCase().includes(matchedName.toLowerCase()));
            if (pRange && pRange.values) {
                const pData = pRange.values;
                if (pData[6]) winPct = parseMoney(pData[6][1]); // Win %
                if (pData[12]) avgKo = parseMoney(pData[12][1]);
                if (pData[18]) {
                    rival = pData[18][0] as string || "None";
                    bullied = pData[18][1] as string || "None";
                }

                if (pData[20] && pData[24]) {
                    for (let c = 1; c < pData[20].length; c++) {
                        const dateRaw = pData[20][c];
                        const profitRaw = pData[24][c];

                        if (!dateRaw && !profitRaw) continue;
                        if (dateRaw === "Total") continue;

                        const dateStr = dateRaw ? String(dateRaw) : `G${c}`;
                        if (profitRaw !== undefined && profitRaw !== null && profitRaw !== "") {
                            cashFlow.push({
                                date: dateStr,
                                profit: parseMoney(profitRaw)
                            });
                        }
                    }
                }

                // Phase 6: Locate "Knocked Out By" table (approx row 29/30) and build the enemyQueue from the most recent game column.
                // We search dynamically to account for varying height charts above it.
                let knockoutRowIdx = -1;
                for (let r = 20; r < pData.length; r++) {
                    if (pData[r] && pData[r][0] && pData[r][0].toString().trim() === "Knocked Out By") {
                        knockoutRowIdx = r;
                        break;
                    }
                }

                if (knockoutRowIdx !== -1) {
                    const dateRow = pData[20] || [];
                    let mostRecentColIdx = -1;

                    // Phase 6: Find most recent game for the Gauntlet enemyQueue
                    for (let c = dateRow.length - 1; c >= 1; c--) {
                        if (dateRow[c] && dateRow[c].toString().trim() !== "Total" && dateRow[c].toString().trim() !== "") {
                            const profitVal = (pData[24] && pData[24][c]) ? String(pData[24][c]).trim() : "";
                            if (profitVal !== "") {
                                mostRecentColIdx = c;
                                break;
                            }
                        }
                    }

                    // Phase 8: Iterate through ALL opponents and ALL columns to build Bounty Board stats
                    for (let r = knockoutRowIdx + 1; r <= knockoutRowIdx + 11; r++) {
                        if (pData[r] && pData[r][0]) {
                            const opponentName = pData[r][0].toString().trim();

                            // 1. Process Most Recent Game for Gauntlet
                            if (mostRecentColIdx !== -1) {
                                const recentKoCountRaw = pData[r][mostRecentColIdx];
                                const recentKoCount = parseInt(recentKoCountRaw) || 0;
                                for (let times = 0; times < recentKoCount; times++) {
                                    enemyQueue.push(opponentName);
                                }
                            }

                            // 2. Process ALL historical games for Bounty metrics (The Bullet Sponge)
                            // We are looking at THIS player's sheet, so "Knocked Out By" means times THEY died.
                            for (let c = 1; c < dateRow.length; c++) {
                                if (dateRow[c] && dateRow[c].toString().trim() !== "Total") {
                                    const koCountRaw = pData[r][c];
                                    const koCount = parseInt(koCountRaw) || 0;
                                    totalTimesKnockedOut += koCount;

                                    // Phase 8: Log this killer's victim for the Hijack King calculation
                                    if (koCount > 0) {
                                        if (!killerToVictimsMap[opponentName]) {
                                            killerToVictimsMap[opponentName] = new Set<string>();
                                        }
                                        killerToVictimsMap[opponentName].add(matchedName); // The killer hijacked this player
                                    }
                                }
                            }
                        }
                    }
                }

                // Phase 8: Calculate "The Executioner" and "Hijack King"
                // To find who *they* knocked out, we actually need to look at the main sheet's total KO stat, 
                // but to find UNIQUE hijack targets we check IF their name appears in other sheets.
                // We will handle the inverse cross-referencing globally later, but for now we set totalHistoricalKOs from row 19
                totalHistoricalKOs = parseInt(row[19]) || 0;
            }

            players.push({
                rank: 0, // Calculated later
                name: matchedName,
                nickname: nicknames[matchedName] || "The Unknown",
                avatarUrl: avatars[matchedName] || defaults[0],
                gamesPlayed: gamesPlayed,
                wins: parseInt(row[3]) || 0,
                points: parseInt(row[5]) || 0,
                rebuys: parseInt(row[7]) || 0,
                addOns: parseInt(row[9]) || 0,
                cashPaid: parseMoney(row[11]),
                winnings: parseMoney(row[13]),
                profit: parseMoney(row[15]),
                bonusChips: parseInt(row[17]) || 0,
                knockOuts: parseInt(row[19]) || 0,
                // Advanced
                rivalPlayer: rival,
                bulliedPlayer: bullied,
                winPercentage: winPct,
                avgKnockouts: avgKo,
                cashFlowHistory: cashFlow,
                enemyQueue: enemyQueue,
                totalHistoricalKOs: totalHistoricalKOs,
                totalTimesKnockedOut: totalTimesKnockedOut,
                uniquePlayersHijacked: [], // Populated in cross-reference pass
                koToGameRatio: gamesPlayed > 0 ? Number((totalHistoricalKOs / gamesPlayed).toFixed(2)) : 0
            });
        }

        // --- PVP SYSTEM MERGE ---
        const pvpData = (response.data.valueRanges?.[1].values as any[][]) || [];
        players.forEach(player => {
            const pvpRow = pvpData.find(row => row[0]?.toString().trim() === player.name);
            if (pvpRow) {
                player.secretPin = pvpRow[1]?.toString() || "0000";
                player.hackTokens = parseInt(pvpRow[2]) || 0;
                player.isHijacked = pvpRow[3]?.toString().toUpperCase() === 'TRUE';
                player.hijackerQueue = pvpRow[4] ? JSON.parse(pvpRow[4]) : [];
            }
        });
        // ------------------------

        // --- SOURCE OF TRUTH: EXCEL ONLY ---
        // Removed the dynamic CSV math overwrite. The Master E.P.T. 2026.xlsx file dictates all points and rivalries.

        // Phase 8 cross-reference: apply the global unique hijack lists
        players.forEach(p => {
            const uniqueVictims = killerToVictimsMap[p.name];
            if (uniqueVictims) {
                p.uniquePlayersHijacked = Array.from(uniqueVictims);
            } else {
                p.uniquePlayersHijacked = [];
            }
        });

        // Sort by Points (descending) to determine rank precisely as defined by the Excel output
        players.sort((a, b) => b.points - a.points);
        players.forEach((p, index) => p.rank = index + 1);

        return players;

    } catch (error) {
        console.error("Critical: Error fetching Leaderboard Data from Google Sheets!");
        console.error("Full Error Details:", JSON.stringify(error, null, 2));
        return []; // Return empty array to prevent 500 errors on the frontend
    }
}

export async function getGlobalStats() {
    let totalPot = 0;
    let nextGameDate = 'TBD';

    const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
    if (!spreadsheetId) return { totalPot: 0, totalSidePot: 0, nextGameDate: 'TBD' };

    try {
        const sheets = await getSheetsClient();

        // Fetch prize pot (AF25) and next game date (AH1) in a single batch call
        const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges: ['Sheet1!AF25', 'Sheet1!AH1'],
        });

        const valueRanges = response.data.valueRanges || [];

        // Prize pot
        const potCell = valueRanges[0]?.values?.[0]?.[0];
        if (potCell) {
            const rawPot = potCell.toString().replace(/[^0-9.-]+/g, '');
            if (rawPot) totalPot = parseFloat(rawPot);
        }

        // Next game date
        const dateCell = valueRanges[1]?.values?.[0]?.[0];
        if (dateCell) {
            nextGameDate = dateCell.toString();
        }

    } catch (e) {
        console.error('Critical: Error fetching Global Stats from Google Sheets!');
        console.error('Full Error Details:', JSON.stringify(e, null, 2));
    }

    return {
        totalPot,
        totalSidePot: 0,
        nextGameDate
    };
}

export interface PlayerGameResult {
    name: string;
    place: string;
    winnings: number;
    points: number;
    kos?: number;
}

export interface GameHistorySession {
    date: string;
    prizePot: number;
    sidePot: number;
    results: PlayerGameResult[];
}

export async function getGameHistory(): Promise<GameHistorySession[]> {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
    if (!spreadsheetId) {
        return [];
    }

    try {
        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A20:ZZ60',
        });

        const rows = response.data.values;
        if (!rows || rows.length < 5) return []; // Make sure we have at least a few rows

        const parseMoney = (val: string | number | undefined | null) => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            return parseFloat(val.toString().replace(/[^0-9.-]+/g, "")) || 0;
        };

        // Find the actual row index where the "Date" string exists in the first column
        let dateRowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] && rows[i][0] && rows[i][0].toString().trim().toLowerCase() === "date") {
                dateRowIndex = i;
                break;
            }
        }

        if (dateRowIndex === -1) {
            console.error("Critical: Could not find 'Date' row in Game History extraction. Grid might have changed.");
            return [];
        }

        const sessions: GameHistorySession[] = [];

        // The data starts at column B (index 1). Each game takes up 3 columns.
        for (let colStart = 1; colStart < rows[dateRowIndex].length; colStart += 3) {
            const dateVal = rows[dateRowIndex]?.[colStart];
            if (!dateVal || dateVal.toString().trim() === "") continue;

            const parsedPot = parseMoney(rows[dateRowIndex + 1]?.[colStart]);

            // We will build the session first and validate it by checking if anyone played
            const session: GameHistorySession = {
                date: dateVal.toString().trim(),
                prizePot: parsedPot,
                sidePot: parseMoney(rows[dateRowIndex + 2]?.[colStart]),
                results: []
            };

            let totalPointsScoredThisGame = 0;

            // Player rows map to lines starting 5 rows after the Date row, exactly 11 players deep
            // Column 1 = Place, Column 2 = Winnings, Column 3 = Points
            for (let r = dateRowIndex + 5; r <= dateRowIndex + 15; r++) {
                const rowData = rows[r];
                if (!rowData) continue;

                const playerName = rows[r][0]; // Column A (index 0) has the names
                if (!playerName) continue;

                const placeRaw = rowData[colStart]?.toString().trim() || "";
                const pointsObj = rowData[colStart + 2];
                const pts = parseFloat(pointsObj?.toString() || "0") || 0;

                // if points is empty and place is empty, they likely didn't play this game.
                if (!placeRaw && pts === 0) {
                    continue;
                }

                // Derive KOs based on the Points Key
                const placeNum = parseInt(placeRaw);
                let basePoints = 0;
                if (placeNum === 1) basePoints = 10;
                else if (placeNum === 2) basePoints = 6;
                else if (placeNum === 3) basePoints = 4;
                else if (placeNum === 4) basePoints = 3;
                else if (placeNum === 5) basePoints = 2;

                const derivedKOs = Math.max(0, pts - basePoints);

                totalPointsScoredThisGame += pts;

                session.results.push({
                    name: playerName.toString().trim(),
                    place: placeRaw,
                    winnings: parseMoney(rowData[colStart + 1]),
                    points: pts,
                    kos: derivedKOs
                });
            }

            // Only push the session if there's actually a pot OR someone scored points
            if (session.prizePot > 0 || totalPointsScoredThisGame > 0) {
                sessions.push(session);
            }
        } // End of colStart loop

        return sessions;

    } catch (e) {
        console.error("Critical: Error fetching Game History from Google Sheets!");
        console.error(e);
        return [];
    }
}
