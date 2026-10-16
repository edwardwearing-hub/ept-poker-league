import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface DealerRequest {
  game: string;
  playerName?: string;
  eventType: 'welcome' | 'bet_placed' | 'spin_win' | 'spin_loss' | 'spin_push' | 'big_win' | 'streak_win' | 'streak_loss' | 'double_down' | 'custom';
  wager?: number;
  result?: string | number;
  color?: string;
  netDelta?: number;
  sessionNet?: number;
  streakCount?: number;
}

// Fallback pool of glamorous croupier remarks if Gemini is offline
const FALLBACK_RESPONSES: Record<string, string[]> = {
  welcome: [
    "Welcome to the table, darling. Let's see if fortune favors you tonight!",
    "Ah, a distinguished player joins us. Place your wagers upon the felt!",
    "Good evening, darling. The wheel is warm and the odds are electric.",
  ],
  bet_placed: [
    "Wagers are placed! I admire bold choices on the felt.",
    "Chips on the line. The tension in the air is delightful!",
    "A very stylish wager, darling. Let us see what the ivory ball decides.",
  ],
  spin_win: [
    "Magnificent call, darling! The house pays out with pleasure.",
    "A splendid victory! Keep this momentum and the casino will be yours.",
    "Spot on! Lady Luck is whispering directly into your ear tonight.",
  ],
  spin_loss: [
    "Close one, darling. The ball has a mischievous spirit this round.",
    "Don't fret—fortune loves a player with patience and nerves of steel.",
    "The house takes this spin, but your comeback is already brewing.",
  ],
  big_win: [
    "Sensational! Champagne for the high roller! What an extraordinary hit!",
    "Incredible read! The entire room is watching this table now, darling!",
    "A masterclass! That payout is pure gold. Simply spectacular!",
  ],
  streak_win: [
    "On fire! A brilliant winning streak, darling. You are unstoppable!",
    "Another one! Are you clairvoyant or just extraordinarily gifted?",
  ],
  streak_loss: [
    "Rough breeze, darling, but the tides always turn. Stay composed.",
    "A testing streak, but true champions know when the wheel will flip.",
  ],
};

function getFallback(eventType: string): string {
  const list = FALLBACK_RESPONSES[eventType] || FALLBACK_RESPONSES.spin_win;
  return list[Math.floor(Math.random() * list.length)];
}

export async function POST(req: NextRequest) {
  try {
    const body: DealerRequest = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        comment: getFallback(body.eventType),
        source: 'fallback',
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash which is confirmed active and supported
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const player = body.playerName || 'darling';
    const game = body.game || 'Roulette';

    const isPubGame = game.toLowerCase().includes('pub') || game.toLowerCase().includes('fruity');
    const systemPrompt = isPubGame
      ? `You are Sarah, the witty, cheerful landlady of The Red Lion traditional English pub.
You are watching the player on the classic British fruit machine in the pub corner.
Your tone is authentic British pub banter, cheerful, warm, and humorous (occasionally using phrases like "guv'nor", "mate", "cracking hit", "pint of bitter", "nudge 'em down", "blimey").
Always keep your answer very concise (strictly 1 to 2 short sentences).
React directly to what happened on the fruit machine reels or feature board.`
      : `You are Sarah, the glamorous, witty, and charismatic head croupier at the prestigious EPT Las Vegas Casino lounge.
Your tone is sophisticated, slightly flirtatious, playful, and sharp (like a James Bond high-stakes casino host).
Always keep your answer very concise (strictly 1 to 2 short sentences).
Address the player naturally (you may occasionally call them "${player}" or "darling" or "high roller").
React directly to what happened at the table.`;


    let userContext = `Game: ${game}. Player: ${player}. Event: ${body.eventType}. `;
    if (body.wager) userContext += `Current Wager: £${body.wager}. `;
    if (body.result !== undefined) userContext += `Result: #${body.result} (${body.color || ''}). `;
    if (body.netDelta !== undefined) userContext += `Net Result: ${body.netDelta >= 0 ? '+' : ''}£${body.netDelta}. `;
    if (body.sessionNet !== undefined) userContext += `Session Net: ${body.sessionNet >= 0 ? '+' : ''}£${body.sessionNet}. `;
    if (body.streakCount) userContext += `Streak: ${body.streakCount} in a row. `;

    userContext += `Give a snappy, in-character 1-2 sentence reaction to the player.`;

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nContext:\n${userContext}` }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.8,
      },
    });

    const text = response.response.text().trim().replace(/^["']|["']$/g, '');
    return NextResponse.json({
      comment: text || getFallback(body.eventType),
      source: 'gemini-2.5-flash',
    });
  } catch (error) {
    console.error('Error generating dealer AI comment:', error);
    // Safe graceful fallback
    return NextResponse.json({
      comment: "The wheel spins for no one, darling. Let's see what happens next!",
      source: 'fallback-error',
    });
  }
}
