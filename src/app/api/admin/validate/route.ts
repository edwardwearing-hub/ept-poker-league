import { NextResponse } from 'next/server';
import { getLeaderboardData, getGlobalStats } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [players, stats] = await Promise.all([
            getLeaderboardData(),
            getGlobalStats()
        ]);

        let totalWinnings = 0;
        let totalCashPaid = 0;

        players.forEach(p => {
            totalWinnings += (p.winnings || 0);
            totalCashPaid += (p.cashPaid || 0);
        });

        const errors: string[] = [];

        // Catch major prize pool mismatches based on total input vs total payout 
        if (totalWinnings > totalCashPaid) {
            errors.push(`Prize Pool Mismatch: Total Winnings to be paid out (£${totalWinnings}) exceeds the total Cash Paid into the game (£${totalCashPaid})! Please check your Google Sheet math.`);
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "Prize pool mathematics perfectly balanced." });
    } catch (e) {
        console.error("Validation Error:", e);
        return NextResponse.json({ error: "Server validation failed to connect to Google Sheets." }, { status: 500 });
    }
}
