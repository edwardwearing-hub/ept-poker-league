import { NextResponse } from 'next/server';
import { getLeaderboardData, getSheetsClient } from '@/lib/data';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { revalidatePath } from 'next/cache';

export async function GET() {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
        if (spreadsheetId) {
            const sheets = await getSheetsClient();
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Gazette!A2:F'
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
                    content: lastRow[4] || 'The chips were flying...',
                    imageUrl: lastRow[5] || null
                });
            }
        }

        // Default report data
        return NextResponse.json({
            title: '"The Flop"',
            episode: 'Episode 1',
            date: 'January 24, 2026',
            winner: 'Liam Duxbury',
            content: 'The chips were flying in Episode 4 as Liam Duxbury solidified his position at the top of the table.\n\nThe night saw intense action, with the "Bounty" Edward Wearing taking significant heat from his rivals.\n\nNotable plays included a massive river bluff that secured the pot leader position for Luke Daly, keeping him in close contention for the crown.',
            imageUrl: null
        });
    } catch (err) {
        console.error("Report read error:", err);
        return NextResponse.json({ error: 'Failed to read report' }, { status: 500 });
    }
}

const CANDIDATE_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
];

async function generateGazetteStoryWithFallback(apiKey: string, rawContent: string, standingsContext: string): Promise<{ text?: string; error?: string }> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = `You are the snarky, engaging sports journalist for "The E.P.T. Gazette" poker league. Write a fun, dramatic, 150-word newspaper-style report based EXACTLY on the raw bullet-point notes. Make it sound like a high-stakes casino recap. Reference the players' current leaderboard standings if relevant.${standingsContext}`;

    let lastErrorMsg = '';

    for (const modelName of CANDIDATE_MODELS) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
                const result = await model.generateContent(`RAW GAME NOTES:\n${rawContent}`);
                const text = result.response.text();
                if (text && text.trim().length > 0) {
                    console.log(`[Gazette AI] Successfully generated story using model: ${modelName} (attempt ${attempt})`);
                    return { text: text.trim() };
                }
            } catch (err: any) {
                const msg = err?.message || String(err);
                lastErrorMsg = msg;
                console.warn(`[Gazette AI] Model ${modelName} (attempt ${attempt}) failed: ${msg}`);

                // Check for high traffic, temporary 503, or rate limit 429
                const isTransient = msg.includes('503') || msg.includes('429') || msg.includes('Service Unavailable') || msg.includes('high demand') || msg.includes('overloaded');
                if (isTransient && attempt < 2) {
                    // Brief pause before retry
                    await new Promise(resolve => setTimeout(resolve, 1200));
                } else {
                    // Break out to next candidate model
                    break;
                }
            }
        }
    }

    return { error: lastErrorMsg || 'All candidate AI models were busy or unavailable.' };
}

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        // 1. Standalone AI Generation preview action
        if (payload.action === 'generate') {
            if (!payload.content || !payload.content.trim()) {
                return NextResponse.json({ error: 'Please enter notes to generate a story.' }, { status: 400 });
            }
            if (!process.env.GEMINI_API_KEY) {
                return NextResponse.json({ error: 'Missing GEMINI_API_KEY in environment variables.' }, { status: 400 });
            }

            let standingsContext = "";
            try {
                const standings = await getLeaderboardData();
                standingsContext = "\n\nCURRENT LEAGUE STANDINGS (Rank - Name - Points - Profit):\n" +
                    standings.map(p => `${p.rank}. ${p.name} - ${p.points}pts (£${p.profit}) - KOs: ${p.knockOuts}`).join('\n');
            } catch (e) {
                console.error("Failed to fetch standings for AI context", e);
            }

            const aiResult = await generateGazetteStoryWithFallback(process.env.GEMINI_API_KEY, payload.content, standingsContext);
            if (aiResult.text) {
                return NextResponse.json({ success: true, generatedText: aiResult.text });
            } else {
                return NextResponse.json({ 
                    success: false, 
                    error: `Google AI service is temporarily busy: ${aiResult.error}. Please try again shortly or write custom content.` 
                }, { status: 503 });
            }
        }

        let aiFallbackMsg = '';

        // 2. Publish Gazette Report action:
        // If content is provided and autoGenerate is not disabled
        if (payload.content && payload.autoGenerate !== false) {
            if (!process.env.GEMINI_API_KEY) {
                aiFallbackMsg = "Missing GEMINI_API_KEY in Vercel Environment Variables. Fell back to raw notes.";
                console.warn(aiFallbackMsg);
            } else {
                console.log("Generating AI Report from notes...");

                let standingsContext = "";
                try {
                    const standings = await getLeaderboardData();
                    standingsContext = "\n\nCURRENT LEAGUE STANDINGS (Rank - Name - Points - Profit):\n" +
                        standings.map(p => `${p.rank}. ${p.name} - ${p.points}pts (£${p.profit}) - KOs: ${p.knockOuts}`).join('\n');
                } catch (e) {
                    console.error("Failed to fetch standings for AI context", e);
                }

                const aiResult = await generateGazetteStoryWithFallback(process.env.GEMINI_API_KEY, payload.content, standingsContext);
                if (aiResult.text) {
                    payload.content = aiResult.text;
                } else {
                    aiFallbackMsg = `Google AI was temporarily busy (${aiResult.error}). Published using your raw notes.`;
                    console.warn(aiFallbackMsg);
                }
            }
        }

        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
        if (spreadsheetId) {
            const sheets = await getSheetsClient();
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Gazette!A:F',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        payload.title || '',
                        payload.episode || '',
                        payload.date || '',
                        payload.winner || '',
                        payload.content || '',
                        payload.imageUrl || ''
                    ]]
                }
            });

            // Automatically purge cache and re-sync the final hub, homepage, gazette, and presentation
            try {
                revalidatePath('/final');
                revalidatePath('/');
                revalidatePath('/gazette');
                revalidatePath('/presentation');
            } catch (e) {
                console.warn("Revalidation warning:", e);
            }
        } else {
            console.warn("No GOOGLE_SHEET_ID found, cannot save report.");
        }

        return NextResponse.json({ success: true, aiGenerated: !aiFallbackMsg, aiFallbackMsg });
    } catch (err) {
        console.error("Report save error:", err);
        return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
    }
}
