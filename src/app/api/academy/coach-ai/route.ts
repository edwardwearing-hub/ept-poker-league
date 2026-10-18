import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, DecisionGrade, GameMode, PositionName } from '@/lib/poker-trainer/types';

interface HandDebriefPayload {
  mode: 'hand_debrief';
  handNumber: number;
  gameMode: GameMode;
  blinds: { sb: number; bb: number; ante?: number };
  heroCards: Card[];
  heroPosition: PositionName;
  communityCards: Card[];
  potWon: number;
  winnerNames: string[];
  winningHandDesc: string;
  heroNetChips: number;
  heroFolded: boolean;
  decisions: {
    street: string;
    actionTaken: string;
    recommendedAction: string;
    grade: DecisionGrade;
    evDelta: number;
    headline: string;
    explanation: string;
    leakCategory?: string;
  }[];
}

interface TournamentReportPayload {
  mode: 'tournament_report';
  tournamentTitle: string;
  heroPlacement: number;
  totalParticipants: number;
  totalHandsPlayed: number;
  totalPrizePool: number;
  heroNetChips: number;
  heroKnockouts: { playerName: string }[];
  coachGrade: DecisionGrade;
  coachAccuracyPercent: number;
  vpipPercent: number;
  pfrPercent: number;
  aggressionFactor: number;
  biggestPotWon?: { pot: number; handDesc: string } | null;
}

type CoachAIRequest = HandDebriefPayload | TournamentReportPayload;

function formatCards(cards: Card[]): string {
  if (!cards || cards.length === 0) return 'None';
  return cards.map((c) => `${c.rank}${c.suit}`).join(' ');
}

function getDeterministicHandFallback(data: HandDebriefPayload) {
  const heroWon = data.heroNetChips > 0;
  const optimalCount = data.decisions.filter((d) => d.grade === 'A+' || d.grade === 'B').length;
  const accuracy = data.decisions.length > 0 ? Math.round((optimalCount / data.decisions.length) * 100) : 100;

  const headline = heroWon
    ? `Strong Performance: £${data.heroNetChips.toLocaleString()} Won`
    : data.heroFolded
    ? 'Disciplined Fold: Chips Preserved'
    : 'Challenging Hand: Review Inflection Points';

  const analysis = data.heroFolded
    ? `You folded ${formatCards(data.heroCards)} from ${data.heroPosition}. Preserving your stack when odds are unfavorable is a fundamental virtue in tournament and cash poker.`
    : `You navigated ${data.communityCards.length > 0 ? `the ${formatCards(data.communityCards)} board` : 'pre-flop'} with ${accuracy}% decision accuracy. Focus on matching bet sizing to board texture.`;

  const keyTakeaway = heroWon
    ? 'Continue extracting value from dominated holdings while denying cheap equity.'
    : 'Ensure your continuing range has sufficient direct pot odds or implied draw value.';

  const recommendedDrill = data.communityCards.length >= 3
    ? 'Spot Drill: Wet & Coordinated Flops'
    : 'Spot Drill: Button vs. Blind Pressure';

  return {
    source: 'fallback' as const,
    headline,
    analysis,
    keyTakeaway,
    recommendedDrill,
  };
}

function getDeterministicTournamentFallback(data: TournamentReportPayload) {
  const isChampion = data.heroPlacement === 1;
  const title = isChampion
    ? 'Championship Run: Full Table Domination'
    : `${data.heroPlacement}${data.heroPlacement === 2 ? 'nd' : data.heroPlacement === 3 ? 'rd' : 'th'} Place Finish: Solid Foundation`;

  const narrative = isChampion
    ? `Masterful run across ${data.totalHandsPlayed} hands. You outmaneuvered ${data.totalParticipants - 1} opponents, executed ${data.heroKnockouts.length} eliminations, and secured the £${data.totalPrizePool.toLocaleString()} prize.`
    : `You survived to ${data.heroPlacement} place out of ${data.totalParticipants} participants. With ${data.coachAccuracyPercent}% decision accuracy and ${data.vpipPercent}% VPIP, tightening short-stack play will take you to the championship.`;

  const strategicStrengths = isChampion
    ? [
        `High Knockout Precision: Claimed ${data.heroKnockouts.length} bounties/eliminations`,
        `Consistent Decision Accuracy: ${data.coachAccuracyPercent}% optimal GTO plays`,
        `Balanced Aggression: Maintained ${data.aggressionFactor} AF across escalating blinds`,
      ]
    : [
        `Disciplined Hand Selection: ${data.vpipPercent}% VPIP in line with structured play`,
        `Technical Precision: ${data.coachAccuracyPercent}% EV-positive moves`,
      ];

  const targetedCorrections = [
    'Protect your stack depth by avoiding marginal calls under 15 BB blind pressure.',
    'Increase blind-stealing frequency in late position against tight opponents.',
  ];

  return {
    source: 'fallback' as const,
    title,
    narrative,
    strategicStrengths,
    targetedCorrections,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: CoachAIRequest = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // Fail-Safe Level 1: If API key missing, return deterministic engine fallback instantly
    if (!apiKey) {
      if (body.mode === 'hand_debrief') {
        return NextResponse.json(getDeterministicHandFallback(body));
      }
      return NextResponse.json(getDeterministicTournamentFallback(body));
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    if (body.mode === 'hand_debrief') {
      const prompt = `You are the E.P.T. Poker Academy Head AI Coach. Analyze this completed poker hand:
Hero Cards: ${formatCards(body.heroCards)} from ${body.heroPosition}.
Board: ${formatCards(body.communityCards)}.
Blinds: £${body.blinds.sb}/£${body.blinds.bb}${body.blinds.ante ? ` (Ante £${body.blinds.ante})` : ''}.
Pot Won: £${body.potWon} by ${body.winnerNames.join(', ')} (${body.winningHandDesc}).
Hero Net Result: ${body.heroNetChips >= 0 ? '+' : ''}£${body.heroNetChips}.
Hero Folded: ${body.heroFolded}.
Hero Decisions Made: ${JSON.stringify(
        body.decisions.map((d) => ({
          street: d.street,
          action: d.actionTaken,
          bestAction: d.recommendedAction,
          grade: d.grade,
          evDelta: d.evDelta,
        }))
      )}.

Respond strictly with a JSON object conforming to this schema:
{
  "headline": "Short punchy 4-7 word title of the hand",
  "analysis": "2 concise sentences analyzing the key tactical inflection point of the hand and hero's play",
  "keyTakeaway": "1 actionable sentence stating the core rule or GTO concept to apply next time",
  "recommendedDrill": "Name of recommended drill (e.g., 'Spot Drill: Button vs. Blind Pressure', 'Spot Drill: Wet & Coordinated Flops', or 'Spot Drill: 10BB Push/Fold Clinic')"
}`;

      // Enforce 3.5s timeout for fast UI responsiveness
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI Coach timeout')), 3500)
      );

      const generatePromise = model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const result = (await Promise.race([generatePromise, timeoutPromise])) as any;
      const text = result.response.text();
      const parsed = JSON.parse(text);

      return NextResponse.json({
        source: 'ai' as const,
        headline: parsed.headline || 'Hand Analysis',
        analysis: parsed.analysis || '',
        keyTakeaway: parsed.keyTakeaway || '',
        recommendedDrill: parsed.recommendedDrill || 'Spot Drill: Button vs. Blind Pressure',
      });
    }

    if (body.mode === 'tournament_report') {
      const prompt = `You are the E.P.T. Poker League Head Tournament Coach. Provide a final master retrospective on the player's Sit & Go Eliminator tournament:
Tournament: ${body.tournamentTitle}.
Placement: ${body.heroPlacement} out of ${body.totalParticipants} participants.
Total Hands Played: ${body.totalHandsPlayed}.
Prize Pool: £${body.totalPrizePool}.
Hero Net Chips: ${body.heroNetChips >= 0 ? '+' : ''}£${body.heroNetChips}.
Hero Knockouts: ${body.heroKnockouts.length} eliminated.
Decision Accuracy: ${body.coachAccuracyPercent}% (${body.coachGrade} Grade).
Playstyle Stats: ${body.vpipPercent}% VPIP, ${body.pfrPercent}% PFR, ${body.aggressionFactor} Aggression Factor.
Biggest Pot Won: ${body.biggestPotWon ? `£${body.biggestPotWon.pot} with ${body.biggestPotWon.handDesc}` : 'None'}.

Respond strictly with a JSON object conforming to this schema:
{
  "title": "Short punchy 4-7 word tournament title",
  "narrative": "3 concise sentences evaluating the player's overall tournament run, aggression balance, and survival strategy",
  "strategicStrengths": ["2-3 specific bullet points highlighting what they did well technically"],
  "targetedCorrections": ["2 specific tactical leaks they must plug before entering the next tournament"]
}`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI Coach timeout')), 3500)
      );

      const generatePromise = model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const result = (await Promise.race([generatePromise, timeoutPromise])) as any;
      const text = result.response.text();
      const parsed = JSON.parse(text);

      return NextResponse.json({
        source: 'ai' as const,
        title: parsed.title || 'Tournament Master Report',
        narrative: parsed.narrative || '',
        strategicStrengths: Array.isArray(parsed.strategicStrengths) ? parsed.strategicStrengths : [],
        targetedCorrections: Array.isArray(parsed.targetedCorrections) ? parsed.targetedCorrections : [],
      });
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (err) {
    // Fail-Safe Level 2: If any exception, network error, or timeout occurs, gracefully return fallback
    console.warn('[Coach AI Endpoint] Falling back to deterministic coach engine:', err);
    try {
      const body = await req.clone().json();
      if (body.mode === 'hand_debrief') {
        return NextResponse.json(getDeterministicHandFallback(body));
      }
      return NextResponse.json(getDeterministicTournamentFallback(body));
    } catch {
      return NextResponse.json({
        source: 'fallback',
        headline: 'Hand Analysis',
        analysis: 'Solid poker fundamentals demonstrated. Maintain position and manage pot odds.',
        keyTakeaway: 'Focus on position and positive EV decisions.',
        recommendedDrill: 'Spot Drill: Button vs. Blind Pressure',
      });
    }
  }
}
