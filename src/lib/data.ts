
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';

async function getSheetsClient() {
    let auth;

    // Check if we are running in Vercel/Production with ENV variables injected
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                // Robustly handle both literal \n and escaped \\n that Vercel might inject
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/\n/g, '\n')
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
    } else {
        // Fallback for Local Development
        auth = new google.auth.GoogleAuth({
            keyFile: path.join(process.cwd(), 'google-credentials.json'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
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
}

export async function getLeaderboardData(): Promise<PlayerStats[]> {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
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
        const ranges = ['Sheet1!A1:Z30'];
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

        // Main sheet data starts at Row 7 (index 6)
        for (let i = 6; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || !row[0]) continue;

            const rawName = row[0].toString().trim();
            const matchedName = allowedPlayers.find(p => p.toLowerCase() === rawName.toLowerCase());

            if (!matchedName) continue;
            if (seenPlayers.has(matchedName)) continue;
            seenPlayers.add(matchedName);

            // Games played at index 1
            const gamesPlayed = parseInt(row[1]) || 0;

            let rival = "N/A";
            let bullied = "N/A";
            let winPct = 0;
            let avgKo = 0;
            const cashFlow: { date: string; profit: number }[] = [];

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
                cashFlowHistory: cashFlow
            });
        }

        // --- SOURCE OF TRUTH: EXCEL ONLY ---
        // Removed the dynamic CSV math overwrite. The Master E.P.T. 2026.xlsx file dictates all points and rivalries.

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
    let nextGameDate = 'February 21, 2026';

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) return { totalPot: 0, totalSidePot: 0, nextGameDate: 'TBD' };

    try {
        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A1:AA100',
        });

        const jsonData = response.data.values || [];

        // Search the 2D array grid for the "Total Side Pot" or similar labels
        for (const row of jsonData) {
            if (row.includes("Total Pot") || row.includes("Total Side Pot")) {
                const idx = row.findIndex(c => typeof c === 'string' && (c.includes("Total Pot") || c.includes("Total Side Pot")));
                if (idx !== -1 && row[idx + 1]) {
                    const matchedVal = parseFloat(row[idx + 1].toString().replace(/[^0-9.-]+/g, ""));
                    if (!isNaN(matchedVal)) totalPot = matchedVal;
                }
            }
        }

    } catch (e) {
        console.error("Critical: Error fetching Global Stats from Google Sheets!");
        console.error("Full Error Details:", JSON.stringify(e, null, 2));
    }

    // Calculate Dynamic Pot additions from submitted CSVs (since Side Pots aren't directly in the main Excel formula yet)
    let totalSidePot = 0;
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');

    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.csv'));
        for (const file of files) {
            const content = fs.readFileSync(path.join(uploadsDir, file), 'utf-8');
            const lines = content.split('\n').filter(l => l.trim().length > 0);
            if (lines.length > 1) {
                const firstRow = lines[1].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (firstRow.length >= 11) {
                    const filePotTotal = parseFloat(firstRow[9]) || 0;
                    const fileSidePot = parseFloat(firstRow[10]) || 0;
                    totalPot += filePotTotal;
                    totalSidePot += fileSidePot;
                }
            }
        }
    }

    // Attempt to pull real Next Game date from API if the countdown API has it saved
    const countdownFile = path.join(process.cwd(), 'data', 'countdown.json');
    if (fs.existsSync(countdownFile)) {
        try {
            const cd = JSON.parse(fs.readFileSync(countdownFile, 'utf-8'));
            if (cd.targetDate) nextGameDate = cd.targetDate;
        } catch (e) { /* ignore */ }
    }

    return {
        totalPot,
        totalSidePot,
        nextGameDate
    };
}
