
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

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
    // Locate the file in the public directory (better for Vercel deployment)
    const filePath = path.join(process.cwd(), 'public', 'E.P.T. 2026.xlsx');

    if (!fs.existsSync(filePath)) {
        console.warn(`Spreadsheet not found at ${filePath}`);
        return [];
    }

    // Read the file
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get the first sheet (Leaderboard)
    const sheetName = workbook.SheetNames[1]; // Using Sheet1 assuming 'Home Page' is index 0 and empty
    // Wait, my inspection showed 'Sheet1' at index 1.
    // Inspection: [ 'Home Page', 'Sheet1', ... ]
    // 'Sheet1' had the data. 'Home Page' was empty.

    const sheet = workbook.Sheets['Sheet1'];
    if (!sheet) return [];

    // Parse rows
    // The sheet structure (based on inspection):
    // Row 2 (index 1) is header.
    // Data starts at Row 3 (index 2).

    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    const players: PlayerStats[] = [];

    const allowedPlayers = [
        "Edward Wearing", "Georgina Wearing", "Luke Daly", "Daniel Horne",
        "Darren Daly", "Chris Daly", "Stephen Flood", "Phil Landsberger",
        "Liam Duxbury", "Nathen Benson", "Dave Taylor"
    ];

    const seenPlayers = new Set<string>();

    // Iterate starting from row index 2 (Row 3 in Excel)
    for (let i = 2; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !row[0]) continue;

        // Normalize name for comparison
        const rawName = row[0].toString().trim();

        // precise match or lenient match
        const matchedName = allowedPlayers.find(p => p.toLowerCase() === rawName.toLowerCase());
        if (!matchedName) continue; // Skip if not in the official list

        if (seenPlayers.has(matchedName)) continue; // Skip duplicates
        seenPlayers.add(matchedName);
        // We filter by ensuring 'Games Played' (index 1) is a number.
        if (typeof row[1] !== 'number') continue;

        // Check if there's a specific sheet for this player
        // Note: The sheet name in Excel might have extra spaces (e.g., "Edward Wearing ")
        // We tried to trim earlier, but let's iterate to find match
        const playerSheetName = workbook.SheetNames.find(n => n.trim().toLowerCase() === row[0].toString().trim().toLowerCase());

        let rival = "N/A";
        let bullied = "N/A";
        let winPct = 0;
        let splitHelperHack = 0; // Ignore
        let cashFlow: { date: string; profit: number }[] = [];
        let avgKo = 0;

        if (playerSheetName) {
            const playerSheet = workbook.Sheets[playerSheetName];
            const pData = XLSX.utils.sheet_to_json(playerSheet, { header: 1 }) as any[][];
            // Based on inspection:
            // Win Percentage: Row 6 (index 6), Col 1 (index 1)
            // Avg Knockouts: Row 12 (index 12), Col 1
            // Rival Player: Row 18 (index 18), Col 0
            // Bullied Player: Row 18 (index 18), Col 1

            if (pData[6]) winPct = Number(pData[6][1]) || 0;
            if (pData[12]) avgKo = Number(pData[12][1]) || 0;
            if (pData[18]) {
                rival = pData[18][0] as string || "None";
                bullied = pData[18][1] as string || "None";
            }

            if (pData[20] && pData[24]) {
                for (let c = 1; c < pData[20].length; c++) {
                    const dateRaw = pData[20][c];
                    const profitRaw = pData[24][c];

                    if (dateRaw === undefined && profitRaw === undefined) continue;
                    if (dateRaw === "Total") continue;

                    let dateStr = `G${c}`;
                    if (typeof dateRaw === 'number') {
                        try {
                            const dateObj = XLSX.SSF.parse_date_code(dateRaw);
                            dateStr = `${dateObj.d}/${dateObj.m}`;
                        } catch (e) { dateStr = String(dateRaw); }
                    } else if (typeof dateRaw === 'string') {
                        dateStr = dateRaw;
                    }

                    if (profitRaw !== undefined && profitRaw !== null && profitRaw !== "") {
                        cashFlow.push({
                            date: dateStr,
                            profit: Number(profitRaw) || 0
                        });
                    }
                }
            }
        }

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

        // Round robin for others or default
        const defaults = ["/avatars/avatar_hoodie.png"];

        players.push({
            rank: 0, // Calculated later
            name: row[0] as string,
            nickname: nicknames[row[0] as string] || "The Unknown",
            avatarUrl: avatars[row[0] as string] || defaults[0],
            gamesPlayed: Number(row[1]) || 0,
            wins: Number(row[3]) || 0,
            points: Number(row[5]) || 0,
            rebuys: Number(row[7]) || 0,
            addOns: Number(row[9]) || 0,
            cashPaid: Number(row[11]) || 0,
            winnings: typeof row[13] === 'number' ? row[13] : 0,
            profit: Number(row[15]) || 0,
            bonusChips: Number(row[17]) || 0,
            knockOuts: Number(row[19]) || 0,
            // Advanced
            rivalPlayer: rival,
            bulliedPlayer: bullied,
            winPercentage: winPct,
            avgKnockouts: avgKo,
            cashFlowHistory: cashFlow
        });
    }

    // Sort by Points (descending) to determine rank
    players.sort((a, b) => b.points - a.points);
    players.forEach((p, index) => p.rank = index + 1);

    return players;
}

export async function getGlobalStats() {
    // We need to fetch the explicit stats from the sheet as shown in the screenshot
    // "2026 League Statistics" block
    const filePath = path.join(process.cwd(), 'public', 'E.P.T. 2026.xlsx');
    if (!fs.existsSync(filePath)) return { totalPot: 0, nextGameDate: 'TBD' };

    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets['Sheet1'];
    if (!sheet) return { totalPot: 0, nextGameDate: 'TBD' };

    // We can access specific cells if we knew the exact range, or browse the json.
    // Based on inspection earlier: 
    // Row 2 (index 2 in json): 'Money Spent this Season' at index 21/22?
    // Let's re-parse and look for the "2026 League Statistics" header or specific keys.
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    // Placeholder match based on typical location (Right side of the sheet)
    // Looking for "Money Spent this Season"
    let totalPot = 0;

    // Search for the stats block
    for (const row of jsonData) {
        if (row.includes("Total Side Pot")) {
            const idx = row.indexOf("Total Side Pot");
            // The value is usually in the next column
            totalPot = Number(row[idx + 1]) || 0;
        } else if (row.includes("Money Spent this Season") && totalPot === 0) {
            // Fallback if Side Pot is missing/zero (optional)
            // const idx = row.indexOf("Money Spent this Season");
            // totalPot = Number(row[idx + 1]) || 0;
        }
    }

    return {
        totalPot: totalPot,
        nextGameDate: 'February 21, 2026'
    };
}
