import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { date, potTotal, sidePot, players } = data;

        if (!date || !players) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Convert to CSV
        const headers = ['Player', 'Position', 'Winnings', 'Rebuys', 'AddOns', 'KOs', 'KOsDetails', 'KnockedOutBy', 'Date', 'PotTotal', 'SidePot'];

        let csvContent = headers.join(',') + '\n';

        for (const p of players) {
            const row = [
                p.name,
                p.position || '',
                p.winnings || '',
                p.rebuys || '',
                p.addOns || '',
                p.kos || '',
                // Escape commas in the KOsDetails if the user separates names with commas
                p.kosDetails ? `"${p.kosDetails}"` : '',
                p.knockedOutBy ? `"${p.knockedOutBy}"` : '',
                date,
                potTotal || '',
                sidePot || ''
            ];
            csvContent += row.join(',') + '\n';
        }

        const timestamp = new Date().getTime();
        const filename = `game-${date}-${timestamp}.csv`;
        const uploadsDir = path.join(process.cwd(), 'data', 'uploads');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, csvContent);

        console.log(`Saved new game data to ${filePath}`);

        return NextResponse.json({ success: true, file: filename });
    } catch (error) {
        console.error('Error submitting game data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
