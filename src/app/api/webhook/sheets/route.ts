import { NextResponse } from 'next/server';
import { getLeaderboardData, getGlobalStats } from '@/lib/data';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        // Security check
        if (payload.secret !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [players, stats] = await Promise.all([
            getLeaderboardData(),
            getGlobalStats()
        ]);

        const topPlayers = players.slice(0, 3).map(p => `${p.name} (${p.points} PTS)`).join(', ');

        if (process.env.OPENAI_API_KEY) {
            console.log("Triggering Webhook AI Report...");
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: `You are the snarky, engaging sports journalist for "The E.P.T. Gazette" poker league. Write a fun, dramatic, 150-word newspaper-style report based EXACTLY on these raw notes.
                            Current Pot: £${stats.totalPot}
                            Top 3 Targets: ${topPlayers}`
                        },
                        {
                            role: 'user',
                            content: payload.notes || "A new game was just completed. Summarize the spreadsheet updates!"
                        }
                    ],
                    temperature: 0.7
                })
            });

            if (response.ok) {
                const aiData = await response.json();
                const text = aiData.choices[0].message.content;

                const reportFilePath = path.join(process.cwd(), 'public', 'latest-report.json');
                const savePayload = {
                    title: payload.title || "Breaking News",
                    episode: payload.episode || "The Latest Game",
                    date: new Date().toISOString().split('T')[0],
                    winner: players[0]?.name || "Edward Wearing",
                    content: text
                };

                fs.writeFileSync(reportFilePath, JSON.stringify(savePayload, null, 2));

                return NextResponse.json({ success: true, aiGenerated: true });
            }
        }

        return NextResponse.json({ error: "OpenAI API missing or failed" }, { status: 500 });

    } catch (e) {
        console.error("Webhook error:", e);
        return NextResponse.json({ error: "Webhook Server Error" }, { status: 500 });
    }
}
