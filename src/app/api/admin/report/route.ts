import { NextResponse } from 'next/server';
import { getLeaderboardData, getSheetsClient } from '@/lib/data';

export async function GET() {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
        if (spreadsheetId) {
            const sheets = await getSheetsClient();
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Gazette!A2:E'
            });

            const rows = response.data.values;
            if (rows && rows.length > 0) {
                // Return the very last row in the Gazette sheet
                const lastRow = rows[rows.length - 1];
                return NextResponse.json({
                    title: lastRow[0] || '"The Flop"',
                    episode: lastRow[1] || 'Episode 1',
                    date: lastRow[2] || 'January 24, 2026',
                    winner: lastRow[3] || 'Liam Duxbury',
                    content: lastRow[4] || 'The chips were flying...'
                });
            }
        }

        // Default report data
        return NextResponse.json({
            title: '"The Flop"',
            episode: 'Episode 1',
            date: 'January 24, 2026',
            winner: 'Liam Duxbury',
            content: 'The chips were flying in Episode 4 as Liam Duxbury solidified his position at the top of the table.\n\nThe night saw intense action, with the "Bounty" Edward Wearing taking significant heat from his rivals.\n\nNotable plays included a massive river bluff that secured the pot leader position for Luke Daly, keeping him in close contention for the crown.'
        });
    } catch (err) {
        console.error("Report read error:", err);
        return NextResponse.json({ error: 'Failed to read report' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        // If the user provided notes and we have an API key, generate a story
        if (payload.content && process.env.OPENAI_API_KEY) {
            console.log("Generating AI Report from notes...");

            // Inject the live leaderboard data so the AI knows who the players are and their current ranks
            let standingsContext = "";
            try {
                const standings = await getLeaderboardData();
                standingsContext = "\n\nCURRENT LEAGUE STANDINGS (Rank - Name - Points - Profit):\n" +
                    standings.map(p => `${p.rank}. ${p.name} - ${p.points}pts (£${p.profit}) - KOs: ${p.knockOuts}`).join('\n');
            } catch (e) {
                console.error("Failed to fetch standings for AI context", e);
            }

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
                            content: `You are the snarky, engaging sports journalist for "The E.P.T. Gazette" poker league. Write a fun, dramatic, 150-word newspaper-style report based EXACTLY on the raw bullet-point notes. Make it sound like a high-stakes casino recap. Reference the players' current leaderboard standings if relevant.` + standingsContext
                        },
                        {
                            role: 'user',
                            content: `RAW GAME NOTES:\n${payload.content}`
                        }
                    ],
                    temperature: 0.7
                })
            });

            if (response.ok) {
                const aiData = await response.json();
                const aiReport = aiData.choices[0].message.content;
                payload.content = aiReport; // Replace the raw notes with the AI story
            } else {
                console.error("OpenAI API Error:", await response.text());
                // Fall back to raw notes if AI fails
            }
        }

        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
        if (spreadsheetId) {
            const sheets = await getSheetsClient();
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Gazette!A:E',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        payload.title || '',
                        payload.episode || '',
                        payload.date || '',
                        payload.winner || '',
                        payload.content || ''
                    ]]
                }
            });
        } else {
            console.warn("No GOOGLE_SHEET_ID found, cannot save report.");
        }

        return NextResponse.json({ success: true, aiGenerated: !!process.env.OPENAI_API_KEY });
    } catch (err) {
        console.error("Report save error:", err);
        return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
    }
}
