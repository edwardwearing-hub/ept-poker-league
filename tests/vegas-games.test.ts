import { describe, it, expect } from 'vitest';
import {
  getBlackjackAdvice,
  getUltimateHoldemAdvice,
  getVideoPokerAdvice,
  getBaccaratAdvice,
  getCrapsAdvice,
} from '../src/lib/vegas/VegasStrategyEngine';

describe('Vegas Games Strategic Coaching & Odds Engine Test Suite', () => {
  // ==========================================
  // 1. BLACKJACK BASIC STRATEGY
  // ==========================================
  describe('Blackjack Basic Strategy Advisor', () => {
    it('recommends SPLIT for Aces and 8s', () => {
      const splitAces = getBlackjackAdvice(
        [{ rank: 'A', value: 11 }, { rank: 'A', value: 11 }],
        { rank: '7', value: 7 }
      );
      expect(splitAces.action).toBe('SPLIT / HIT');
      expect(splitAces.confidence).toBe('Optimal');

      const split8s = getBlackjackAdvice(
        [{ rank: '8', value: 8 }, { rank: '8', value: 8 }],
        { rank: '10', value: 10 }
      );
      expect(split8s.action).toBe('SPLIT / HIT');
    });

    it('recommends STAND on Hard 20 (Tens)', () => {
      const standTens = getBlackjackAdvice(
        [{ rank: 'K', value: 10 }, { rank: 'Q', value: 10 }],
        { rank: '6', value: 6 }
      );
      expect(standTens.action).toBe('STAND');
    });

    it('recommends STAND on Hard 12-16 when dealer shows bust card (2-6)', () => {
      const stand16vs6 = getBlackjackAdvice(
        [{ rank: '10', value: 10 }, { rank: '6', value: 6 }],
        { rank: '6', value: 6 }
      );
      expect(stand16vs6.action).toBe('STAND');

      const stand13vs4 = getBlackjackAdvice(
        [{ rank: '9', value: 9 }, { rank: '4', value: 4 }],
        { rank: '4', value: 4 }
      );
      expect(stand13vs4.action).toBe('STAND');
    });

    it('recommends HIT on Hard 12-16 when dealer shows high card (7-A)', () => {
      const hit16vs10 = getBlackjackAdvice(
        [{ rank: '10', value: 10 }, { rank: '6', value: 6 }],
        { rank: '10', value: 10 }
      );
      expect(hit16vs10.action).toBe('HIT');
    });

    it('recommends DOUBLE on 11', () => {
      const double11 = getBlackjackAdvice(
        [{ rank: '6', value: 6 }, { rank: '5', value: 5 }],
        { rank: '5', value: 5 }
      );
      expect(double11.action).toBe('DOUBLE');
    });

    it('recommends STAND on Hard 17 or higher', () => {
      const stand18 = getBlackjackAdvice(
        [{ rank: '10', value: 10 }, { rank: '8', value: 8 }],
        { rank: 'A', value: 11 }
      );
      expect(stand18.action).toBe('STAND');
    });
  });

  // ==========================================
  // 2. ULTIMATE TEXAS HOLD'EM GTO STRATEGY
  // ==========================================
  describe("Ultimate Texas Hold'em GTO Advisor", () => {
    it('recommends RAISE 4X with pocket pairs (33+)', () => {
      const advice = getUltimateHoldemAdvice(
        'preflop',
        [
          { rank: '8', suit: '♠', value: 8 },
          { rank: '8', suit: '♥', value: 8 },
        ],
        []
      );
      expect(advice.action).toBe('RAISE 4X');
    });

    it('recommends RAISE 4X with any Ace holding', () => {
      const advice = getUltimateHoldemAdvice(
        'preflop',
        [
          { rank: 'A', suit: '♠', value: 14 },
          { rank: '4', suit: '♦', value: 4 },
        ],
        []
      );
      expect(advice.action).toBe('RAISE 4X');
    });

    it('recommends CHECK preflop with marginal/rag holdings', () => {
      const advice = getUltimateHoldemAdvice(
        'preflop',
        [
          { rank: '7', suit: '♠', value: 7 },
          { rank: '2', suit: '♦', value: 2 },
        ],
        []
      );
      expect(advice.action).toBe('CHECK');
    });

    it('recommends RAISE 2X on Flop when hitting a Pair or better', () => {
      const advice = getUltimateHoldemAdvice(
        'flop',
        [
          { rank: 'K', suit: '♠', value: 13 },
          { rank: '9', suit: '♦', value: 9 },
        ],
        [
          { rank: 'K', suit: '♥', value: 13 },
          { rank: '4', suit: '♣', value: 4 },
          { rank: '2', suit: '♠', value: 2 },
        ]
      );
      expect(advice.action).toBe('RAISE 2X');
    });

    it('recommends RAISE 1X on River with a pair, FOLD with high card', () => {
      const winAdvice = getUltimateHoldemAdvice(
        'river',
        [
          { rank: 'Q', suit: '♠', value: 12 },
          { rank: '3', suit: '♦', value: 3 },
        ],
        [
          { rank: 'Q', suit: '♥', value: 12 },
          { rank: '8', suit: '♣', value: 8 },
          { rank: '6', suit: '♠', value: 6 },
          { rank: '4', suit: '♦', value: 4 },
          { rank: '2', suit: '♣', value: 2 },
        ]
      );
      expect(winAdvice.action).toBe('RAISE 1X');

      const foldAdvice = getUltimateHoldemAdvice(
        'river',
        [
          { rank: '9', suit: '♠', value: 9 },
          { rank: '3', suit: '♦', value: 3 },
        ],
        [
          { rank: 'A', suit: '♥', value: 14 },
          { rank: 'K', suit: '♣', value: 13 },
          { rank: 'J', suit: '♠', value: 11 },
          { rank: '7', suit: '♦', value: 7 },
          { rank: '2', suit: '♣', value: 2 },
        ]
      );
      expect(foldAdvice.action).toBe('FOLD');
    });
  });

  // ==========================================
  // 3. VIDEO POKER (JACKS OR BETTER) STRATEGY
  // ==========================================
  describe('Video Poker 9/6 Jacks or Better Advisor', () => {
    it('holds all 5 on a Flush', () => {
      const advice = getVideoPokerAdvice([
        { rank: '2', suit: '♠', value: 2 },
        { rank: '5', suit: '♠', value: 5 },
        { rank: '8', suit: '♠', value: 8 },
        { rank: 'J', suit: '♠', value: 11 },
        { rank: 'A', suit: '♠', value: 14 },
      ]);
      expect(advice.holdIndices).toEqual([0, 1, 2, 3, 4]);
      expect(advice.headline).toContain('Hold All 5');
    });

    it('holds Three of a Kind and discards kickers', () => {
      const advice = getVideoPokerAdvice([
        { rank: '9', suit: '♠', value: 9 },
        { rank: '9', suit: '♥', value: 9 },
        { rank: '9', suit: '♦', value: 9 },
        { rank: '4', suit: '♣', value: 4 },
        { rank: 'K', suit: '♠', value: 13 },
      ]);
      expect(advice.holdIndices).toEqual([0, 1, 2]);
    });

    it('holds high pair (Jacks or Better) to guarantee payout', () => {
      const advice = getVideoPokerAdvice([
        { rank: 'Q', suit: '♠', value: 12 },
        { rank: 'Q', suit: '♥', value: 12 },
        { rank: '7', suit: '♦', value: 7 },
        { rank: '4', suit: '♣', value: 4 },
        { rank: '2', suit: '♠', value: 2 },
      ]);
      expect(advice.holdIndices).toEqual([0, 1]);
      expect(advice.headline).toContain('High Pair');
    });
  });

  // ==========================================
  // 4. BACCARAT & CRAPS ODDS VERIFICATION
  // ==========================================
  describe('Baccarat and Craps Strategy & Odds', () => {
    it('recommends Banker as the lowest house edge in Baccarat', () => {
      const bacc = getBaccaratAdvice();
      expect(bacc.action).toBe('BET BANKER');
      expect(bacc.houseEdgeNote).toContain('1.06%');
    });

    it('recommends Pass Line on Come Out roll and True Odds on established point', () => {
      const comeOut = getCrapsAdvice(null);
      expect(comeOut.action).toBe('PASS LINE');
      expect(comeOut.houseEdgeNote).toContain('1.41%');

      const pointRoll = getCrapsAdvice(6);
      expect(pointRoll.action).toBe('BACK WITH ODDS');
      expect(pointRoll.houseEdgeNote).toContain('0%');
    });
  });
});
