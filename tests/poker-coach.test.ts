import { describe, it, expect } from 'vitest';
import {
  evaluateHeroDecision,
  estimateHeroEquity,
  calculatePotOdds,
  getLiveCoachRecommendation,
} from '@/lib/poker-trainer/engine';
import { Card, ScenarioConfig, TrainerPlayer } from '@/lib/poker-trainer/types';

describe('Poker Coach Advice & Table Context Tests', () => {
  const defaultConfig: ScenarioConfig = {
    gameMode: 'no-limit',
    difficulty: 'regular',
    numPlayers: 6,
    startingBigBlinds: 100,
    smallBlind: 5,
    bigBlind: 10,
    preset: 'free-play',
    liveCoachHints: true,
    autoRebuy: true,
  };

  const createPlayer = (
    id: string,
    position: TrainerPlayer['position'],
    cards: Card[],
    chips = 1000,
    isHero = false,
    currentBet = 0
  ): TrainerPlayer => ({
    id,
    name: isHero ? 'Hero' : `Bot ${id}`,
    avatar: '🎯',
    isHero,
    position,
    seatIndex: 0,
    chips,
    startingChips: 1000,
    currentBet,
    totalCommitted: currentBet,
    cards,
    folded: false,
    isAllIn: false,
    bountyValue: 0,
    bountiesWon: 0,
  });

  // =========================================================================
  // 1. PRE-FLOP COACH ADVICE TESTS
  // =========================================================================
  describe('1. Pre-Flop Advice & Evaluation', () => {
    it('recommends raising or 3-betting premium hands (AKs, QQ) facing a standard raise, never folding', () => {
      // Hero on BTN with A♠ K♠ facing an open-raise to £30 from UTG
      const heroCards: Card[] = [
        { suit: '♠', rank: 'A', value: 14 },
        { suit: '♠', rank: 'K', value: 13 },
      ];
      const hero = createPlayer('hero', 'BTN', heroCards, 1000, true, 0);
      const utg = createPlayer('bot1', 'UTG', [{ suit: '♦', rank: 'Q', value: 12 }, { suit: '♥', rank: 'J', value: 11 }], 970, false, 30);
      const sb = createPlayer('bot2', 'SB', [{ suit: '♣', rank: '2', value: 2 }, { suit: '♦', rank: '7', value: 7 }], 995, false, 5);
      const bb = createPlayer('bot3', 'BB', [{ suit: '♠', rank: '3', value: 3 }, { suit: '♥', rank: '8', value: 8 }], 990, false, 10);

      const activeOpponents = [utg, sb, bb];
      // Pot before action: SB(5) + BB(10) + UTG(30) = 45. Call amount = 30.
      const feedback = evaluateHeroDecision({
        hero,
        action: 'raise',
        betAmount: 90,
        potBeforeAction: 45,
        callAmount: 30,
        communityCards: [],
        street: 'Pre-flop',
        activeOpponents,
        config: defaultConfig,
      });

      expect(feedback.recommendedAction).not.toBe('Fold');
      expect(['3-Bet Raise', 'Call', 'Raise (2.5x–3x BB)']).toContain(feedback.recommendedAction);
      expect(feedback.grade).toBe('A+');
    });

    it('correctly detects a min-raise in the Big Blind and does not treat it as an unopened pot', () => {
      // In the BB (posted £10), UTG min-raises to £20.
      // callAmount is £10.
      const heroCards: Card[] = [
        { suit: '♠', rank: '7', value: 7 },
        { suit: '♥', rank: '2', value: 2 },
      ];
      const hero = createPlayer('hero', 'BB', heroCards, 990, true, 10);
      const utg = createPlayer('bot1', 'UTG', [{ suit: '♦', rank: 'A', value: 14 }, { suit: '♥', rank: 'K', value: 13 }], 980, false, 20);

      // Facing a raise of £10 more: Folding trash 72o should be praised as a fold, NOT recommended to "Check"
      const feedback = evaluateHeroDecision({
        hero,
        action: 'fold',
        betAmount: 0,
        potBeforeAction: 35,
        callAmount: 10,
        communityCards: [],
        street: 'Pre-flop',
        activeOpponents: [utg],
        config: defaultConfig,
      });

      // It should NOT recommend "Check" when facing a min-raise! Check is not a legal move when facing a raise.
      expect(feedback.recommendedAction).toBe('Fold');
      expect(feedback.grade).toBe('A+');
    });

    it('correctly recognizes free check option in the Big Blind when unopened or limped with weak hand', () => {
      // In the BB (posted £10), all players folded or limped (£10).
      // callAmount is £0.
      const heroCards: Card[] = [
        { suit: '♠', rank: '7', value: 7 },
        { suit: '♥', rank: '2', value: 2 },
      ];
      const hero = createPlayer('hero', 'BB', heroCards, 990, true, 10);
      const limper = createPlayer('bot1', 'SB', [{ suit: '♦', rank: '9', value: 9 }, { suit: '♥', rank: '8', value: 8 }], 990, false, 10);

      const feedback = evaluateHeroDecision({
        hero,
        action: 'check',
        betAmount: 0,
        potBeforeAction: 20,
        callAmount: 0,
        communityCards: [],
        street: 'Pre-flop',
        activeOpponents: [limper],
        config: defaultConfig,
      });

      expect(feedback.recommendedAction).toBe('Check');
      expect(feedback.grade).toBe('A+');
    });
  });

  // =========================================================================
  // 2. POST-FLOP COACH ADVICE TESTS
  // =========================================================================
  describe('2. Post-Flop Advice & Evaluation', () => {
    it('treats raising with Two Pair or Trips facing a bet as a Value Raise (Grade A+), not a bluff (Grade D)', () => {
      // Board: K♠ 8♦ 3♣. Hero holds K♥ 8♥ (Two Pair, Top Two).
      // Opponent bets £25 into £50 pot. Hero raises to £75.
      const heroCards: Card[] = [
        { suit: '♥', rank: 'K', value: 13 },
        { suit: '♥', rank: '8', value: 8 },
      ];
      const board: Card[] = [
        { suit: '♠', rank: 'K', value: 13 },
        { suit: '♦', rank: '8', value: 8 },
        { suit: '♣', rank: '3', value: 3 },
      ];
      const hero = createPlayer('hero', 'BTN', heroCards, 900, true, 0);
      const opp = createPlayer('bot1', 'SB', [{ suit: '♣', rank: 'A', value: 14 }, { suit: '♦', rank: 'K', value: 13 }], 875, false, 25);

      const feedback = evaluateHeroDecision({
        hero,
        action: 'raise',
        betAmount: 75,
        potBeforeAction: 75,
        callAmount: 25,
        communityCards: board,
        street: 'Flop',
        activeOpponents: [opp],
        config: defaultConfig,
      });

      // Raising with Two Pair must be graded A+ as a Value Raise, never a "Bluff Raise" or Grade D!
      expect(feedback.grade).toBe('A+');
      expect(feedback.headline).not.toContain('Bluff Raise');
      expect(feedback.headline).toMatch(/Value|Raise/i);
      expect(feedback.leakCategory).toBeUndefined();
    });

    it('does not claim "giving opponents a free card to outdraw you" when checking on the River', () => {
      // Board: A♠ K♦ 8♣ 4♥ 2♦ (River - 5 cards). Hero holds A♥ Q♠ (Top Pair, Top Kicker).
      // Pot is £100, callAmount is £0. Hero checks for showdown / pot control.
      const heroCards: Card[] = [
        { suit: '♥', rank: 'A', value: 14 },
        { suit: '♠', rank: 'Q', value: 12 },
      ];
      const board: Card[] = [
        { suit: '♠', rank: 'A', value: 14 },
        { suit: '♦', rank: 'K', value: 13 },
        { suit: '♣', rank: '8', value: 8 },
        { suit: '♥', rank: '4', value: 4 },
        { suit: '♦', rank: '2', value: 2 },
      ];
      const hero = createPlayer('hero', 'SB', heroCards, 800, true, 0);
      const opp = createPlayer('bot1', 'BTN', [{ suit: '♣', rank: 'A', value: 14 }, { suit: '♦', rank: 'J', value: 11 }], 800, false, 0);

      const feedback = evaluateHeroDecision({
        hero,
        action: 'check',
        betAmount: 0,
        potBeforeAction: 100,
        callAmount: 0,
        communityCards: board,
        street: 'River',
        activeOpponents: [opp],
        config: defaultConfig,
      });

      // On the River, there are no more cards! It should never mention giving a free card or drawing out.
      expect(feedback.explanation).not.toContain('free card to outdraw you');
      expect(feedback.explanation).not.toContain('charge flush and straight draws');
    });

    it('recognizes checking out of position on the Flop as valid pot control or checking to raiser', () => {
      // Hero in BB with A♦ 8♦ on A♠ 9♣ 4♥ board. Unopened Flop (£30 pot).
      // Hero checks to the pre-flop aggressor.
      const heroCards: Card[] = [
        { suit: '♦', rank: 'A', value: 14 },
        { suit: '♦', rank: '8', value: 8 },
      ];
      const board: Card[] = [
        { suit: '♠', rank: 'A', value: 14 },
        { suit: '♣', rank: '9', value: 9 },
        { suit: '♥', rank: '4', value: 4 },
      ];
      const hero = createPlayer('hero', 'BB', heroCards, 970, true, 0);
      const opp = createPlayer('bot1', 'BTN', [{ suit: '♣', rank: 'K', value: 13 }, { suit: '♠', rank: 'Q', value: 12 }], 970, false, 0);

      const feedback = evaluateHeroDecision({
        hero,
        action: 'check',
        betAmount: 0,
        potBeforeAction: 30,
        callAmount: 0,
        communityCards: board,
        street: 'Flop',
        activeOpponents: [opp],
        config: defaultConfig,
      });

      // Checking out of position with marginal top pair should be at least Grade B (Pot Control), not a severe blunder
      expect(['A+', 'B']).toContain(feedback.grade);
    });
  });

  // =========================================================================
  // 3. EQUITY ESTIMATION TESTS
  // =========================================================================
  describe('3. Pre-Flop Equity Estimation', () => {
    it('gives realistic Heads-Up equity for premium hands (AKs, QQ) against 1 active opponent', () => {
      const akSuited: Card[] = [
        { suit: '♠', rank: 'A', value: 14 },
        { suit: '♠', rank: 'K', value: 13 },
      ];
      const equity = estimateHeroEquity(akSuited, [], 1);
      // AKs heads up is ~65-70% against a random range
      expect(equity).toBeGreaterThanOrEqual(60);
      expect(equity).toBeLessThanOrEqual(80);
    });

    it('does not penalize equity when players behind have not entered the pot yet', () => {
      const pocketAces: Card[] = [
        { suit: '♠', rank: 'A', value: 14 },
        { suit: '♥', rank: 'A', value: 14 },
      ];
      const equityHU = estimateHeroEquity(pocketAces, [], 1);
      expect(equityHU).toBeGreaterThanOrEqual(80);
    });
  });

  // =========================================================================
  // 4. LIVE COACH HUD RECOMMENDATION TESTS
  // =========================================================================
  describe('4. Live Coach HUD Recommendation Engine', () => {
    it('provides real-time raise recommendation when holding Pocket Aces unopened pre-flop', () => {
      const heroCards: Card[] = [
        { suit: '♠', rank: 'A', value: 14 },
        { suit: '♥', rank: 'A', value: 14 },
      ];
      const hero = createPlayer('hero', 'BTN', heroCards, 1000, true, 0);
      const rec = getLiveCoachRecommendation({
        hero,
        pot: 15,
        callAmount: 0,
        communityCards: [],
        street: 'Pre-flop',
        activeOpponents: [
          createPlayer('sb', 'SB', [], 995, false, 5),
          createPlayer('bb', 'BB', [], 990, false, 10),
        ],
        config: defaultConfig,
      });

      expect(rec.actionType).toBe('raise');
      expect(rec.recommendedAction).toContain('Raise');
      expect(rec.explanation).toContain('clear raise from BTN');
      expect(rec.suggestedAmount).toBeGreaterThanOrEqual(25);
    });

    it('provides real-time fold recommendation when holding 72o facing an open-raise in BB', () => {
      const heroCards: Card[] = [
        { suit: '♠', rank: '7', value: 7 },
        { suit: '♦', rank: '2', value: 2 },
      ];
      const hero = createPlayer('hero', 'BB', heroCards, 990, true, 10);
      const rec = getLiveCoachRecommendation({
        hero,
        pot: 35,
        callAmount: 15,
        communityCards: [],
        street: 'Pre-flop',
        activeOpponents: [
          createPlayer('utg', 'UTG', [], 975, false, 25),
        ],
        config: defaultConfig,
      });

      expect(rec.actionType).toBe('fold');
      expect(rec.recommendedAction).toBe('Fold');
      expect(rec.explanation).toMatch(/Facing a raise|equity/);
    });

    it('provides real-time value raise recommendation when holding Two Pair facing a bet on the Flop', () => {
      const heroCards: Card[] = [
        { suit: '♥', rank: 'K', value: 13 },
        { suit: '♥', rank: '8', value: 8 },
      ];
      const board: Card[] = [
        { suit: '♠', rank: 'K', value: 13 },
        { suit: '♦', rank: '8', value: 8 },
        { suit: '♣', rank: '3', value: 3 },
      ];
      const hero = createPlayer('hero', 'BTN', heroCards, 900, true, 0);
      const opp = createPlayer('bot1', 'SB', [], 875, false, 25);

      const rec = getLiveCoachRecommendation({
        hero,
        pot: 75,
        callAmount: 25,
        communityCards: board,
        street: 'Flop',
        activeOpponents: [opp],
        config: defaultConfig,
      });

      expect(rec.actionType).toBe('raise');
      expect(rec.recommendedAction).toContain('Raise');
    });

    it('provides real-time check recommendation for pot control / showdown value on the River', () => {
      const heroCards: Card[] = [
        { suit: '♥', rank: 'A', value: 14 },
        { suit: '♠', rank: 'Q', value: 12 },
      ];
      const board: Card[] = [
        { suit: '♠', rank: 'A', value: 14 },
        { suit: '♦', rank: 'K', value: 13 },
        { suit: '♣', rank: '8', value: 8 },
        { suit: '♥', rank: '4', value: 4 },
        { suit: '♦', rank: '2', value: 2 },
      ];
      const hero = createPlayer('hero', 'SB', heroCards, 800, true, 0);
      const opp = createPlayer('bot1', 'BTN', [], 800, false, 0);

      const rec = getLiveCoachRecommendation({
        hero,
        pot: 100,
        callAmount: 0,
        communityCards: board,
        street: 'River',
        activeOpponents: [opp],
        config: defaultConfig,
      });

      expect(rec.actionType).toBe('check');
      expect(rec.recommendedAction).toBe('Check');
    });
  });
});
