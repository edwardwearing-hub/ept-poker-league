import {
  Card,
  CoachFeedback,
  DecisionGrade,
  DifficultyLevel,
  DrawInfo,
  GameMode,
  HandEvaluation,
  LeakCategory,
  PositionName,
  ScenarioConfig,
  Street,
  TrainerPlayer,
} from './types';
import {
  getPreflopHandNotation,
  getPreflopHandPercentileScore,
  POSITION_OPEN_THRESHOLDS,
  RANKS,
  RANK_VALUES,
  SUITS,
} from './constants';

// ==========================================
// 1. DECK GENERATION & SCENARIO DEALING
// ==========================================

export function createShuffledDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUES[rank] });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ==========================================
// 2. EXACT 5-TO-7 CARD HAND EVALUATOR
// ==========================================

const RANK_NAMES_PLURAL: Record<number, string> = {
  14: 'Aces',
  13: 'Kings',
  12: 'Queens',
  11: 'Jacks',
  10: 'Tens',
  9: 'Nines',
  8: 'Eights',
  7: 'Sevens',
  6: 'Sixes',
  5: 'Fives',
  4: 'Fours',
  3: 'Threes',
  2: 'Twos',
};

const RANK_NAMES_SINGULAR: Record<number, string> = {
  14: 'Ace',
  13: 'King',
  12: 'Queen',
  11: 'Jack',
  10: 'Ten',
  9: 'Nine',
  8: 'Eight',
  7: 'Seven',
  6: 'Six',
  5: 'Five',
  4: 'Four',
  3: 'Three',
  2: 'Two',
};

function evaluate5Cards(cards: Card[]): HandEvaluation {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map((c) => c.value);
  const suits = sorted.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight (including A-5 wheel: 14, 5, 4, 3, 2)
  let isStraight = false;
  let straightHigh = values[0];
  if (
    values[0] - values[1] === 1 &&
    values[1] - values[2] === 1 &&
    values[2] - values[3] === 1 &&
    values[3] - values[4] === 1
  ) {
    isStraight = true;
    straightHigh = values[0];
  } else if (
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    isStraight = true;
    straightHigh = 5;
  }

  // Count frequencies
  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;

  const groups = Object.entries(counts)
    .map(([val, count]) => ({ val: Number(val), count }))
    .sort((a, b) => b.count - a.count || b.val - a.val);

  // Tie-breaker encoding helper
  const tieScore = groups.reduce((acc, g, idx) => acc + g.val * Math.pow(15, 4 - idx), 0);

  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        rankCategory: 10,
        rankName: 'Royal Flush',
        exactScore: 10 * 1e7 + 14,
        bestFiveDescription: 'Royal Flush',
      };
    }
    return {
      rankCategory: 9,
      rankName: 'Straight Flush',
      exactScore: 9 * 1e7 + straightHigh,
      bestFiveDescription: `Straight Flush, ${RANK_NAMES_SINGULAR[straightHigh]} High`,
    };
  }

  if (groups[0].count === 4) {
    return {
      rankCategory: 8,
      rankName: 'Four of a Kind',
      exactScore: 8 * 1e7 + tieScore,
      bestFiveDescription: `Four of a Kind, ${RANK_NAMES_PLURAL[groups[0].val]}`,
    };
  }

  if (groups[0].count === 3 && groups[1].count === 2) {
    return {
      rankCategory: 7,
      rankName: 'Full House',
      exactScore: 7 * 1e7 + tieScore,
      bestFiveDescription: `Full House, ${RANK_NAMES_PLURAL[groups[0].val]} full of ${RANK_NAMES_PLURAL[groups[1].val]}`,
    };
  }

  if (isFlush) {
    return {
      rankCategory: 6,
      rankName: 'Flush',
      exactScore: 6 * 1e7 + tieScore,
      bestFiveDescription: `Flush, ${RANK_NAMES_SINGULAR[values[0]]} High`,
    };
  }

  if (isStraight) {
    return {
      rankCategory: 5,
      rankName: 'Straight',
      exactScore: 5 * 1e7 + straightHigh,
      bestFiveDescription: `Straight to the ${RANK_NAMES_SINGULAR[straightHigh]}`,
    };
  }

  if (groups[0].count === 3) {
    return {
      rankCategory: 4,
      rankName: 'Three of a Kind',
      exactScore: 4 * 1e7 + tieScore,
      bestFiveDescription: `Three of a Kind, ${RANK_NAMES_PLURAL[groups[0].val]}`,
    };
  }

  if (groups[0].count === 2 && groups[1].count === 2) {
    return {
      rankCategory: 3,
      rankName: 'Two Pair',
      exactScore: 3 * 1e7 + tieScore,
      bestFiveDescription: `Two Pair, ${RANK_NAMES_PLURAL[groups[0].val]} & ${RANK_NAMES_PLURAL[groups[1].val]}`,
    };
  }

  if (groups[0].count === 2) {
    return {
      rankCategory: 2,
      rankName: 'One Pair',
      exactScore: 2 * 1e7 + tieScore,
      bestFiveDescription: `Pair of ${RANK_NAMES_PLURAL[groups[0].val]}`,
    };
  }

  return {
    rankCategory: 1,
    rankName: 'High Card',
    exactScore: 1 * 1e7 + tieScore,
    bestFiveDescription: `${RANK_NAMES_SINGULAR[values[0]]} High`,
  };
}

export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    // Pre-flop 2-card evaluation
    if (cards.length === 2) {
      const [c1, c2] = cards;
      if (c1.value === c2.value) {
        return {
          rankCategory: 2,
          rankName: 'Pocket Pair',
          exactScore: 2 * 1e7 + c1.value * 1000,
          bestFiveDescription: `Pocket ${RANK_NAMES_PLURAL[c1.value]}`,
        };
      }
      const high = Math.max(c1.value, c2.value);
      const low = Math.min(c1.value, c2.value);
      return {
        rankCategory: 1,
        rankName: 'High Cards',
        exactScore: 1 * 1e7 + high * 100 + low,
        bestFiveDescription: `${RANK_NAMES_SINGULAR[high]}-${RANK_NAMES_SINGULAR[low]} ${c1.suit === c2.suit ? 'Suited' : 'Offsuit'}`,
      };
    }
    return {
      rankCategory: 1,
      rankName: 'High Card',
      exactScore: 0,
      bestFiveDescription: 'Incomplete Hand',
    };
  }

  if (cards.length === 5) {
    return evaluate5Cards(cards);
  }

  // Generate all 5-card combinations from 6 or 7 cards (max 21 combinations)
  let best: HandEvaluation | null = null;
  const n = cards.length;
  for (let i = 0; i < n - 4; i++) {
    for (let j = i + 1; j < n - 3; j++) {
      for (let k = j + 1; k < n - 2; k++) {
        for (let l = k + 1; l < n - 1; l++) {
          for (let m = l + 1; m < n; m++) {
            const combo = [cards[i], cards[j], cards[k], cards[l], cards[m]];
            const evalRes = evaluate5Cards(combo);
            if (!best || evalRes.exactScore > best.exactScore) {
              best = evalRes;
            }
          }
        }
      }
    }
  }
  return best!;
}

// ==========================================
// 3. BOARD TEXTURE, DRAWS & OUTS DETECTOR
// ==========================================

export function analyzeDrawsAndTexture(holeCards: Card[], communityCards: Card[]): DrawInfo {
  const allCards = [...holeCards, ...communityCards];
  const drawDescription: string[] = [];

  if (communityCards.length === 0) {
    return {
      flushDraw: false,
      backdoorFlushDraw: false,
      openEndedStraightDraw: false,
      gutshotStraightDraw: false,
      overcards: 0,
      totalOuts: 0,
      drawDescription: ['Pre-flop phase'],
      boardTexture: 'Dry / Rainbow',
    };
  }

  // Board Texture Analysis
  const boardSuits: Record<string, number> = {};
  const boardValues = communityCards.map((c) => c.value).sort((a, b) => a - b);
  const boardValCounts: Record<number, number> = {};

  for (const c of communityCards) {
    boardSuits[c.suit] = (boardSuits[c.suit] || 0) + 1;
    boardValCounts[c.value] = (boardValCounts[c.value] || 0) + 1;
  }

  const maxBoardSuit = Math.max(...Object.values(boardSuits));
  const isPairedBoard = Object.values(boardValCounts).some((count) => count >= 2);

  let connectedPairs = 0;
  for (let i = 0; i < boardValues.length - 1; i++) {
    const diff = boardValues[i + 1] - boardValues[i];
    if (diff >= 1 && diff <= 2) connectedPairs++;
  }

  let boardTexture: DrawInfo['boardTexture'] = 'Dry / Rainbow';
  if (maxBoardSuit >= 3) {
    boardTexture = 'Monotone Danger';
  } else if (isPairedBoard) {
    boardTexture = 'Paired Board';
  } else if (maxBoardSuit === 2 && connectedPairs >= 1) {
    boardTexture = 'Wet / Coordinated';
  } else if (maxBoardSuit === 2 || connectedPairs >= 2) {
    boardTexture = 'Semi-Wet';
  }

  // If already on the River, no future outs exist
  if (communityCards.length >= 5) {
    return {
      flushDraw: false,
      backdoorFlushDraw: false,
      openEndedStraightDraw: false,
      gutshotStraightDraw: false,
      overcards: 0,
      totalOuts: 0,
      drawDescription: ['River complete (0 cards to come)'],
      boardTexture,
    };
  }

  // Check Flush Draw (using at least 1 hole card)
  const suitCounts: Record<string, number> = {};
  const holeSuits = new Set(holeCards.map((c) => c.suit));
  for (const c of allCards) {
    suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  }

  let flushDraw = false;
  let backdoorFlushDraw = false;
  for (const [s, count] of Object.entries(suitCounts)) {
    if (holeSuits.has(s as Card['suit'])) {
      if (count === 4) {
        flushDraw = true;
        drawDescription.push('Flush Draw (9 outs)');
      } else if (count === 3 && communityCards.length === 3) {
        backdoorFlushDraw = true;
      }
    }
  }

  // Check Straight Draws (if not already a straight or better)
  const currentEval = evaluateHand(allCards);
  let openEndedStraightDraw = false;
  let gutshotStraightDraw = false;

  if (currentEval.rankCategory < 5) {
    const uniqueVals = Array.from(new Set(allCards.map((c) => c.value)));
    if (uniqueVals.includes(14)) uniqueVals.push(1); // Ace low

    // Test how many ranks (2..14) would complete a 5-card straight if added
    let completingRanks = 0;
    for (let testRank = 2; testRank <= 14; testRank++) {
      if (uniqueVals.includes(testRank)) continue;
      const testSet = new Set([...uniqueVals, testRank, ...(testRank === 14 ? [1] : [])]);
      let makesStraight = false;
      for (let low = 1; low <= 10; low++) {
        if (
          testSet.has(low) &&
          testSet.has(low + 1) &&
          testSet.has(low + 2) &&
          testSet.has(low + 3) &&
          testSet.has(low + 4)
        ) {
          makesStraight = true;
          break;
        }
      }
      if (makesStraight) completingRanks++;
    }

    if (completingRanks >= 2) {
      openEndedStraightDraw = true;
      drawDescription.push('Open-Ended Straight Draw (8 outs)');
    } else if (completingRanks === 1) {
      gutshotStraightDraw = true;
      drawDescription.push('Gutshot Straight Draw (4 outs)');
    }
  }

  // Check Overcards (when Hero only has High Card)
  const maxBoardCard = Math.max(...communityCards.map((c) => c.value));
  let overcards = 0;
  if (currentEval.rankCategory === 1) {
    for (const hc of holeCards) {
      if (hc.value > maxBoardCard) overcards++;
    }
    if (overcards === 2) drawDescription.push('Two Overcards (6 outs)');
    else if (overcards === 1) drawDescription.push('One Overcard (3 outs)');
  }

  // Calculate total clean outs (accounting for overlap on combo draws)
  let totalOuts = 0;
  if (flushDraw) totalOuts += 9;
  if (openEndedStraightDraw) totalOuts += flushDraw ? 6 : 8;
  else if (gutshotStraightDraw) totalOuts += flushDraw ? 3 : 4;
  if (currentEval.rankCategory === 1 && overcards > 0) {
    totalOuts += overcards * 3;
  }

  return {
    flushDraw,
    backdoorFlushDraw,
    openEndedStraightDraw,
    gutshotStraightDraw,
    overcards,
    totalOuts,
    drawDescription,
    boardTexture,
  };
}

// ==========================================
// 4. EQUITY & POT ODDS / BOUNTY CALCULATOR
// ==========================================

export function estimateHeroEquity(
  holeCards: Card[],
  communityCards: Card[],
  numOpponents: number
): number {
  if (holeCards.length < 2) return 50;
  const activeOpps = Math.max(1, numOpponents);

  // Pre-flop equity estimation
  if (communityCards.length === 0) {
    const isPair = holeCards[0].value === holeCards[1].value;
    const isSuited = holeCards[0].suit === holeCards[1].suit;
    const high = Math.max(holeCards[0].value, holeCards[1].value);
    const low = Math.min(holeCards[0].value, holeCards[1].value);

    let huEquity: number;
    if (isPair) {
      // Pocket pairs range from ~50% (22) to ~85% (AA)
      huEquity = 50 + (high / 14) * 35;
    } else if (isSuited) {
      // Suited holdings: AKs ~67%, AQs ~65%, 76s ~46%, etc.
      huEquity = 33 + (high / 14) * 23 + (low / 14) * 11;
    } else {
      // Offsuit holdings: AKo ~64%, AQo ~61%, 72o ~32%
      huEquity = 29 + (high / 14) * 22 + (low / 14) * 12;
    }

    // Adjust for multiway opponents
    const multiwayFactor = Math.pow(0.85, activeOpps - 1);
    return Math.round(Math.max(12, Math.min(88, huEquity * multiwayFactor)));
  }

  // Post-flop equity estimation (combining made hand strength + draw equity via Rule of 4 and 2)
  const evalRes = evaluateHand([...holeCards, ...communityCards]);
  const drawInfo = analyzeDrawsAndTexture(holeCards, communityCards);
  const maxBoardVal = Math.max(...communityCards.map((c) => c.value));
  const heroHigh = Math.max(holeCards[0].value, holeCards[1].value);

  let baseMadeEquity = 22;
  switch (evalRes.rankCategory) {
    case 10:
    case 9:
    case 8:
      baseMadeEquity = 98;
      break;
    case 7: // Full House
      baseMadeEquity = 95;
      break;
    case 6: // Flush
      baseMadeEquity = 89;
      break;
    case 5: // Straight
      baseMadeEquity = drawInfo.boardTexture === 'Monotone Danger' ? 74 : 85;
      break;
    case 4: // Three of a kind
      baseMadeEquity = 82;
      break;
    case 3: // Two Pair
      baseMadeEquity = 75;
      break;
    case 2: {
      // One Pair: distinguish Top Pair / Overpair vs Middle/Bottom Pair
      const isPocketPair = holeCards[0].value === holeCards[1].value;
      if (isPocketPair && holeCards[0].value > maxBoardVal) {
        baseMadeEquity = 72; // Overpair
      } else if (
        holeCards[0].value === maxBoardVal ||
        holeCards[1].value === maxBoardVal
      ) {
        baseMadeEquity = heroHigh >= 12 ? 66 : 58; // Top pair
      } else {
        baseMadeEquity = 42; // Middle or bottom pair
      }
      break;
    }
    case 1:
    default:
      baseMadeEquity = heroHigh === 14 ? 26 : 18;
      break;
  }

  // Rule of 4 (Flop -> River) or Rule of 2 (Turn -> River)
  const cardsToCome = communityCards.length === 3 ? 2 : communityCards.length === 4 ? 1 : 0;
  const drawEquity = drawInfo.totalOuts * (cardsToCome === 2 ? 3.8 : cardsToCome === 1 ? 2.1 : 0);

  let combinedHuEquity = Math.min(98, baseMadeEquity + (evalRes.rankCategory <= 2 ? drawEquity * 0.75 : drawEquity * 0.25));

  // Multiway penalty (stronger hands retain equity better than one-pair hands)
  const retention = evalRes.rankCategory >= 4 ? 0.92 : 0.82;
  const finalEquity = combinedHuEquity * Math.pow(retention, activeOpps - 1);

  return Math.round(Math.max(5, Math.min(99, finalEquity)));
}

export function calculatePotOdds(
  callAmount: number,
  currentPot: number,
  bountyChipBonus = 0
): { rawPotOdds: number; bountyAdjustedPotOdds: number } {
  if (callAmount <= 0) {
    return { rawPotOdds: 0, bountyAdjustedPotOdds: 0 };
  }
  const totalFinalPot = currentPot + callAmount;
  const rawPotOdds = Math.round((callAmount / totalFinalPot) * 100);

  // In Bounty Hunter (PKO), if you cover an all-in opponent, their bounty adds immediate chip equity to the pot!
  const effectivePotWithBounty = currentPot + callAmount + bountyChipBonus;
  const bountyAdjustedPotOdds = Math.round((callAmount / effectivePotWithBounty) * 100);

  return { rawPotOdds, bountyAdjustedPotOdds };
}

export function getPotLimitMaxTotalBet(
  currentPot: number,
  highestCurrentBet: number,
  playerCurrentBet: number,
  playerRemainingChips: number
): number {
  const callAmount = Math.max(0, highestCurrentBet - playerCurrentBet);
  // Pot-limit formula: after calling, the pot is (currentPot + callAmount).
  // You can raise by that pot size, so total additional chips = callAmount + (currentPot + callAmount)
  const maxAdditional = currentPot + 2 * callAmount;
  const cappedAdditional = Math.min(playerRemainingChips, maxAdditional);
  return playerCurrentBet + cappedAdditional;
}

// ==========================================
// 5. VIRTUAL COACH DECISION GRADER
// ==========================================

export function evaluateHeroDecision(params: {
  hero: TrainerPlayer;
  action: 'fold' | 'check' | 'call' | 'raise' | 'all-in';
  betAmount: number;
  potBeforeAction: number;
  callAmount: number;
  communityCards: Card[];
  street: Street;
  activeOpponents: TrainerPlayer[];
  config: ScenarioConfig;
}): CoachFeedback {
  const {
    hero,
    action,
    betAmount,
    potBeforeAction,
    callAmount,
    communityCards,
    street,
    activeOpponents,
    config,
  } = params;

  const handEval = evaluateHand([...hero.cards, ...communityCards]);
  const drawInfo = analyzeDrawsAndTexture(hero.cards, communityCards);

  // When facing an open-raise pre-flop, measure equity primarily against active bettors, not unacted table seats
  const activeBettors = activeOpponents.filter((opp) => opp.currentBet > 0 || opp.isAllIn);
  const effectiveOpponentsCount =
    street === 'Pre-flop'
      ? Math.max(1, activeBettors.length)
      : Math.max(1, activeOpponents.length);

  const equity = estimateHeroEquity(hero.cards, communityCards, effectiveOpponentsCount);
  const preflopScore = getPreflopHandPercentileScore(hero.cards[0], hero.cards[1]);
  const notation = getPreflopHandNotation(hero.cards[0], hero.cards[1]);
  const bb = config.bigBlind;
  const heroStackBB = Math.round((hero.chips + hero.currentBet) / bb);

  // Check if any all-in opponent is covered by Hero in Bounty Hunter mode
  let bountyChipBonus = 0;
  if (config.gameMode === 'bounty-hunter' && callAmount > 0) {
    const coveredAllInOpps = activeOpponents.filter(
      (opp) => opp.isAllIn && hero.chips >= callAmount
    );
    for (const opp of coveredAllInOpps) {
      // Claiming 50% of their bounty immediately translates to ~33% of starting stack chip equity
      bountyChipBonus += Math.round(opp.bountyValue * 0.5);
    }
  }

  const { rawPotOdds, bountyAdjustedPotOdds } = calculatePotOdds(
    callAmount,
    potBeforeAction,
    bountyChipBonus
  );
  const effectiveRequiredEquity =
    config.gameMode === 'bounty-hunter' && bountyChipBonus > 0
      ? bountyAdjustedPotOdds
      : config.gameMode === 'icm-bubble' && callAmount > hero.chips * 0.4
      ? rawPotOdds + 9 // ICM bubble risk premium!
      : rawPotOdds;

  let grade: DecisionGrade = 'A+';
  let recommendedAction = 'Raise';
  let evDelta = 0.5;
  let headline = 'Sharp Play!';
  let explanation = '';
  let strategicTip = '';
  let leakCategory: LeakCategory | undefined = undefined;

  // ------------------------------------------
  // CASE A: ALL-IN OR FOLD (AoF) MODE
  // ------------------------------------------
  if (config.gameMode === 'all-in-or-fold' || heroStackBB <= 12) {
    const pushThreshold = Math.max(38, POSITION_OPEN_THRESHOLDS[hero.position] - 12);
    const shouldPush =
      street === 'Pre-flop' ? preflopScore >= pushThreshold : equity >= effectiveRequiredEquity;

    recommendedAction = shouldPush ? 'All-In (Push)' : 'Fold';

    if (shouldPush && (action === 'all-in' || action === 'raise')) {
      grade = 'A+';
      evDelta = +1.8;
      headline = 'Optimal Short-Stack Shove!';
      explanation = `With ${notation} (${heroStackBB} BB) from ${hero.position}, your hand is comfortably inside the Nash Equilibrium push range (${ equity }% equity). Maximizing fold equity is key here.`;
      strategicTip = 'Under 12 BB, open-shoving prevents opponents from realizing their post-flop equity against you.';
    } else if (!shouldPush && action === 'fold') {
      grade = 'A+';
      evDelta = +0.6;
      headline = 'Disciplined Short-Stack Fold';
      explanation = `${notation} from ${hero.position} is too weak to risk ${heroStackBB} BB (${equity}% equity). Preserving your fold equity for a better spot is mathematically sound.`;
      strategicTip = 'Wait for Ace-x, pocket pairs, or suited broadways before committing a 10 BB stack.';
    } else if (shouldPush && action === 'fold') {
      grade = 'D';
      evDelta = -1.6;
      leakCategory = 'aof-push-fold-error';
      headline = 'Missed Nash Shove Opportunity';
      explanation = `You folded ${notation} in ${hero.position} with ${heroStackBB} BB. At this stack depth, blinds will eat you alive if you pass up +EV shoves (${equity}% equity).`;
      strategicTip = 'In All-In or Fold / short-stack play, any Ace, pair, or suited connector in late position is a profitable shove.';
    } else {
      grade = 'F';
      evDelta = -2.4;
      leakCategory = 'aof-push-fold-error';
      headline = 'Negative-EV Short-Stack Shove';
      explanation = `Pushing ${notation} from ${hero.position} risks ${heroStackBB} BB with only ${equity}% equity. When called, you are heavily dominated.`;
      strategicTip = 'Tighten your shove range from early/middle position; you need higher card removal (Ace/King blockers).';
    }
  }
  // ------------------------------------------
  // CASE B: PRE-FLOP (STANDARD / POT LIMIT / BOUNTY / ICM)
  // ------------------------------------------
  else if (street === 'Pre-flop') {
    const posThreshold = POSITION_OPEN_THRESHOLDS[hero.position];
    const highestOppBet = activeOpponents.length > 0 ? Math.max(...activeOpponents.map((o) => o.currentBet)) : bb;
    const isPotRaised = highestOppBet > bb || callAmount > bb;
    const isUnopenedOrLimp = !isPotRaised && callAmount <= bb;

    if (isUnopenedOrLimp) {
      if (preflopScore >= posThreshold) {
        recommendedAction = 'Raise (2.5x–3x BB)';
        if (action === 'raise' || action === 'all-in') {
          if (action === 'all-in' && heroStackBB > 25) {
            grade = 'C';
            evDelta = -0.8;
            headline = 'Over-Shove with Deep Stack';
            explanation = `${notation} is strong from ${hero.position}, but open-shoving ${heroStackBB} BB folds out all worse hands and only gets called by monsters.`;
            strategicTip = 'Use a standard 2.5x–3x BB open-raise to keep dominated hands in the pot.';
          } else {
            grade = 'A+';
            evDelta = +1.4;
            headline = 'Textbook Positional Open-Raise!';
            explanation = `${notation} (Top ${100 - preflopScore}% hand) is a clear raise from ${hero.position}. Raising builds the pot with initiative and pressures the blinds.`;
            strategicTip = 'Always enter the pot with a raise when first in—initiative wins pots without showdown.';
          }
        } else if (action === 'call' || action === 'check') {
          if (hero.position === 'BB' && action === 'check') {
            grade = 'B';
            evDelta = +0.2;
            headline = 'Passive Option Check in BB';
            explanation = `Checking your Big Blind option with ${notation} is safe, though raising for value would extract more from limpers.`;
            strategicTip = 'Punish limpers from the Big Blind when holding top-tier hands.';
          } else {
            grade = 'D';
            evDelta = -1.1;
            leakCategory = 'limping-preflop';
            headline = 'The Limp Trap Detected!';
            explanation = `You limped/called with ${notation} from ${hero.position} instead of raising. Limping gives the Big Blind a free flop and denies you fold equity.`;
            strategicTip = 'Rule #1 of E.P.T. Academy: If a hand is worth playing when unopened, it is worth raising!';
          }
        } else {
          // Folded a playable hand
          grade = 'C';
          evDelta = -0.7;
          leakCategory = 'overfolding-equity';
          headline = 'Overly Tight Pre-Flop Fold';
          explanation = `${notation} is strong enough to open from ${hero.position}. Folding here leaves chip value on the table.`;
          strategicTip = `Expand your opening range in ${hero.position} to steal more blinds.`;
        }
      } else {
        // Weak pre-flop hand
        recommendedAction = hero.position === 'BB' && callAmount === 0 ? 'Check' : 'Fold';
        if (action === 'fold' || (action === 'check' && callAmount === 0)) {
          grade = 'A+';
          evDelta = +0.5;
          headline = 'Solid Pre-Flop Discipline';
          explanation = `${notation} is below the profitable threshold for ${hero.position}. Mucking trash hands pre-flop saves your stack for high-equity spots.`;
          strategicTip = 'Tight pre-flop selection in early/middle position avoids costly dominated flops.';
        } else if (action === 'call') {
          grade = 'F';
          evDelta = -1.5;
          leakCategory = 'limping-preflop';
          headline = 'Loose Limp with Speculative Trash';
          explanation = `Limping ${notation} from ${hero.position} is a major chip leak. You have weak high-card strength and poor playability post-flop.`;
          strategicTip = 'Eliminate open-limping with weak offsuit hands—fold and wait for position.';
        } else {
          // Bluff raise with weak hand
          if (hero.position === 'BTN' || hero.position === 'CO') {
            grade = 'B';
            evDelta = +0.1;
            headline = 'Aggressive Late-Position Steal Attempt';
            explanation = `${notation} is slightly below standard range in ${hero.position}, but raising as a blind steal uses your positional leverage.`;
            strategicTip = 'Late-position steals work best against tight blinds (like Dave Blackburn or Liam Duxbury).';
          } else {
            grade = 'D';
            evDelta = -1.3;
            leakCategory = 'positional-looseness';
            headline = 'Loose Out-of-Position Open';
            explanation = `Raising ${notation} from ${hero.position} puts you in tough spots when 3-bet or called by players with position on you.`;
            strategicTip = 'Respect early position—Wait for stronger broadways or pocket pairs.';
          }
        }
      }
    } else {
      // Facing a Pre-Flop Raise / All-In
      const should3Bet = preflopScore >= 78;
      // Hands defending against a raise require real playability (pairs, suited holdings, or high broadway cards)
      const isPair = hero.cards[0].value === hero.cards[1].value;
      const isSuited = hero.cards[0].suit === hero.cards[1].suit;
      const hasDefendableStrength =
        preflopScore >= 38 || isPair || (isSuited && preflopScore >= 28);
      const shouldContinue =
        should3Bet ||
        (hasDefendableStrength && (equity >= effectiveRequiredEquity || preflopScore >= posThreshold + 4));

      recommendedAction = should3Bet ? '3-Bet Raise' : shouldContinue ? 'Call' : 'Fold';

      if (action === 'fold') {
        if (!shouldContinue) {
          grade = 'A+';
          evDelta = +0.8;
          headline = 'Smart Fold Facing Aggression';
          explanation = `Facing a raise of £${callAmount}, you needed ${effectiveRequiredEquity}% equity${bountyChipBonus > 0 ? ' (Bounty-adjusted)' : ''} to continue, and ${notation} has ~${equity}% equity.`;
          strategicTip = 'Folding dominated hands to pre-flop raises is one of the fastest ways to boost your win rate.';
        } else {
          grade = 'D';
          evDelta = -1.4;
          leakCategory = bountyChipBonus > 0 ? 'bounty-miscalculation' : 'overfolding-equity';
          headline = bountyChipBonus > 0 ? 'Missed Profitable Bounty Call!' : 'Over-Folded Playable Equity';
          explanation =
            bountyChipBonus > 0
              ? `With £${bountyChipBonus} in Bounty equity added to the pot, your required equity dropped from ${rawPotOdds}% to ${bountyAdjustedPotOdds}%! ${notation} (${equity}% equity) was a profitable call.`
              : `${notation} has ${equity}% equity against a ${rawPotOdds}% pot-odds price. Folding here surrenders too much equity.`;
          strategicTip =
            bountyChipBonus > 0
              ? 'In Bounty Hunter mode, each 50BB starting bounty you cover lowers your required calling equity by ~8–12%!'
              : 'Defend your big blind and late-position opens when getting favorable pot odds.';
        }
      } else if (action === 'call') {
        if (shouldContinue) {
          grade = should3Bet ? 'B' : 'A+';
          evDelta = +1.1;
          headline = bountyChipBonus > 0 ? 'Great Bounty-Adjusted Call!' : 'Mathematically Sound Call';
          explanation = `Your ${notation} (${equity}% equity) comfortably clears the ${effectiveRequiredEquity}% required equity threshold${bountyChipBonus > 0 ? ` thanks to the +£${bountyChipBonus} bounty incentive` : ''}.`;
          strategicTip = should3Bet
            ? 'Consider 3-betting premium holdings like this to isolate the raiser and build value.'
            : 'Evaluate flop texture carefully and look for favorable equity realization.';
        } else {
          grade = 'D';
          evDelta = -1.6;
          leakCategory = 'calling-without-odds';
          headline = 'Loose Call Against Raise';
          explanation = `Calling £${callAmount} with ${notation} gives you ${equity}% equity when you needed at least ${effectiveRequiredEquity}%${config.gameMode === 'icm-bubble' ? ' (including ICM bubble risk premium)' : ''}.`;
          strategicTip = 'Avoid calling raises with easily dominated offsuit hands.';
        }
      } else {
        // 3-bet / All-In facing a raise
        if (should3Bet || equity >= effectiveRequiredEquity + 5) {
          grade = 'A+';
          evDelta = +2.1;
          headline = 'Power 3-Bet / Re-Raise!';
          explanation = `With ${notation} (${equity}% equity), re-raising applies maximum pressure and extracts value from worse hands.`;
          strategicTip = 'Aggressive 3-betting with your top range balances your occasional semi-bluffs.';
        } else {
          grade = 'C';
          evDelta = -0.9;
          leakCategory = 'positional-looseness';
          headline = 'High-Variance Light 3-Bet Bluff';
          explanation = `3-betting ${notation} (${equity}% equity) relies heavily on fold equity. Against sticky stations, this will get called down.`;
          strategicTip = 'Save light 3-bet bluffs for suited Wheel Aces (A2s–A5s) which have Ace blockers and nut flush draw potential.';
        }
      }
    }
  }
  // ------------------------------------------
  // CASE C: POST-FLOP (FLOP, TURN, RIVER)
  // ------------------------------------------
  else {
    const drawSummary =
      drawInfo.totalOuts > 0
        ? ` plus ${drawInfo.totalOuts} outs (${drawInfo.drawDescription.join(', ')})`
        : '';

    if (callAmount === 0) {
      // Unopened post-flop action (Check vs Bet)
      const isOOP = hero.position === 'SB' || hero.position === 'BB';
      // On the River, one-pair hands are showdown value — checking is standard unless holds monster (two-pair+)
      const shouldCheckRiver = street === 'River' && handEval.rankCategory <= 2;
      // Out of position with marginal holding: checking to the aggressor is standard
      const shouldCheckOOP = isOOP && equity <= 68 && handEval.rankCategory <= 2;
      const isStrongOrGoodDraw =
        !shouldCheckRiver && !shouldCheckOOP && (equity >= 54 || drawInfo.totalOuts >= 8);

      recommendedAction = isStrongOrGoodDraw ? 'Bet (50%–75% Pot)' : 'Check';

      if (action === 'raise' || action === 'all-in') {
        // Check if over-betting in No-Limit when only marginal
        const betToPotRatio = potBeforeAction > 0 ? betAmount / potBeforeAction : 1;
        if (isStrongOrGoodDraw) {
          if (config.gameMode === 'pot-limit' && betToPotRatio >= 0.65) {
            grade = 'A+';
            evDelta = +1.9;
            headline = 'Textbook Pot-Limit Geometric Press!';
            explanation = `With ${handEval.bestFiveDescription}${drawSummary} (${equity}% equity) on a ${drawInfo.boardTexture} board, betting near pot builds geometric pressure for later streets.`;
            strategicTip = 'In Pot Limit, betting 75%–100% pot on the flop sets up a clean pot-sized turn jam.';
          } else {
            grade = 'A+';
            evDelta = +1.6;
            headline = equity >= 60 ? 'Strong Value / Protection Bet!' : 'Profitable Semi-Bluff Barrel!';
            explanation = `You hold ${handEval.bestFiveDescription}${drawSummary} (${equity}% equity) on a ${drawInfo.boardTexture} board. Betting charges draws and denies free equity.`;
            strategicTip = 'Betting strong draws (8+ outs) gives you two ways to win: immediate folds or hitting your outs.';
          }
        } else {
          // Pure bluff with low equity
          if (drawInfo.boardTexture === 'Dry / Rainbow' && activeOpponents.length === 1) {
            grade = 'B';
            evDelta = +0.3;
            headline = 'Opportunistic Dry-Board Stab';
            explanation = `You only have ${handEval.bestFiveDescription} (${equity}% equity), but stabbing at a Heads-Up ${drawInfo.boardTexture} board often takes it down when opponents miss.`;
            strategicTip = 'Keep dry-board C-bets small (33% pot)—you risk less and achieve the same fold frequency.';
          } else {
            grade = 'D';
            evDelta = -1.4;
            leakCategory = 'positional-looseness';
            headline = 'Spewy Bluff into Multiway / Wet Board';
            explanation = `Bluffing ${handEval.bestFiveDescription} (${equity}% equity, ${drawInfo.totalOuts} outs) into ${activeOpponents.length} opponent(s) on a ${drawInfo.boardTexture} board burns chips.`;
            strategicTip = 'Avoid bluffing without outs into multiple opponents—someone almost always connects with a wet board.';
          }
        }
      } else if (action === 'check') {
        if (!isStrongOrGoodDraw) {
          grade = 'A+';
          evDelta = +0.5;
          headline = 'Smart Pot Control Check';
          explanation = `With ${handEval.bestFiveDescription} (${equity}% equity) on a ${drawInfo.boardTexture} board, checking controls the pot size and avoids bloating the pot when behind.`;
          strategicTip = 'Pot control with medium-strength or weak holdings keeps opponents from check-raising you off your equity.';
        } else if (handEval.rankCategory >= 7) {
          // Slowplay monster (Georgina Trap!)
          grade = 'B';
          evDelta = +0.4;
          headline = 'The Georgina Trap (Slowplay Check)';
          explanation = `Checking a monster (${handEval.bestFiveDescription}, ${equity}% equity) disguises your strength to induce bluffs on the next street.`;
          strategicTip = 'Trapping works best against aggressive bluffers like Luke Daly or Edward Wearing—just be sure to bet big on the river!';
        } else if (street === 'River') {
          // On the River, checking for showdown value / pot control is standard!
          grade = equity >= 60 ? 'B' : 'A+';
          evDelta = +0.3;
          headline = 'River Showdown Value / Pot Control Check';
          explanation = `Checking on the river with ${handEval.bestFiveDescription} (${equity}% equity) takes a cheap showdown safely without risking an expensive raise.`;
          strategicTip = 'Checking medium-to-strong pairs on the river is solid poker: it catches bluffs and avoids paying off better hands.';
        } else if (hero.position === 'SB' || hero.position === 'BB' || equity <= 68) {
          // Out of position or pot control check on flop or turn
          grade = 'B';
          evDelta = +0.3;
          headline = 'Out-of-Position Pot Control Check';
          explanation = `Checking ${handEval.bestFiveDescription} (${equity}% equity) keeps the pot controlled and allows you to evaluate opponent aggression.`;
          strategicTip = 'Checking to the pre-flop aggressor or checking for pot control avoids bloating the pot while out of position.';
        } else {
          grade = 'C';
          evDelta = -0.9;
          leakCategory = 'passive-value-miss';
          headline = 'Missed Value / Free Card Given';
          explanation = `You checked ${handEval.bestFiveDescription}${drawSummary} (${equity}% equity) on a ${drawInfo.boardTexture} board, giving opponents a free card to outdraw you.`;
          strategicTip = 'On wet or two-tone boards, always bet your strong top pairs and overpairs to charge flush and straight draws!';
        }
      }
    } else {
      // Facing a Post-Flop Bet!
      const isProfitableContinue = equity >= effectiveRequiredEquity;
      const isValueMadeHand = handEval.rankCategory >= 3 || (handEval.rankCategory === 2 && equity >= 58);
      const isMonsterDraw = drawInfo.totalOuts >= 10 && street !== 'River';
      const isRaiseWorthy = isValueMadeHand || equity >= 62 || isMonsterDraw;

      recommendedAction = isRaiseWorthy
        ? 'Raise for Value / Combo Draw'
        : isProfitableContinue
        ? 'Call (Direct Pot Odds)'
        : 'Fold';

      if (action === 'fold') {
        if (!isProfitableContinue) {
          grade = 'A+';
          evDelta = +1.1;
          headline = 'Disciplined Post-Flop Laydown (Liam Test Passed!)';
          explanation = `Facing a £${callAmount} bet into £${potBeforeAction}, you needed ${effectiveRequiredEquity}% equity. With ${handEval.bestFiveDescription}${drawSummary} (${equity}% equity), folding saves £${callAmount}.`;
          strategicTip = 'Always compare your Equity % against Pot Odds %. When Equity < Pot Odds and implied odds are poor, fold without hesitation.';
        } else {
          grade = 'D';
          evDelta = -1.5;
          leakCategory = 'overfolding-equity';
          headline = 'Over-Folded With Positive Pot Odds!';
          explanation = `You folded ${handEval.bestFiveDescription}${drawSummary} which had ${equity}% equity against a pot-odds price of only ${effectiveRequiredEquity}%!`;
          strategicTip = `With ${drawInfo.totalOuts} outs, use the Rule of 4 & 2 (Outs × 4 on Flop, Outs × 2 on Turn) to quickly see your draw equity.`;
        }
      } else if (action === 'call') {
        if (isProfitableContinue) {
          grade = 'A+';
          evDelta = +1.3;
          headline = 'Mathematically Profitable Call!';
          explanation = `Calling £${callAmount} requires ${effectiveRequiredEquity}% equity, and your ${handEval.bestFiveDescription}${drawSummary} holds ${equity}% equity (+${equity - effectiveRequiredEquity}% edge).`;
          strategicTip = 'When your hand/draw equity exceeds the pot odds price, calling prints long-term profit.';
        } else if (equity + 8 >= effectiveRequiredEquity && drawInfo.totalOuts >= 8) {
          grade = 'B';
          evDelta = +0.2;
          headline = 'Implied Odds Draw Call';
          explanation = `Your direct equity (${equity}%) is slightly below pot odds (${effectiveRequiredEquity}%), but with ${drawInfo.totalOuts} outs, implied odds on future streets can bridge the gap.`;
          strategicTip = 'Be sure to extract a big bet on the next street when your draw hits to justify implied-odds calls!';
        } else {
          grade = 'F';
          evDelta = -2.1;
          leakCategory = 'calling-without-odds';
          headline = 'Calling Station Leak — Chasing Without Odds!';
          explanation = `You called £${callAmount} needing ${effectiveRequiredEquity}% equity, but your ${handEval.bestFiveDescription}${drawSummary} only has ${equity}% equity.`;
          strategicTip = 'Stop paying off big bets with weak pairs or gutshots when the pot odds price is too expensive.';
        }
      } else {
        // Raising / Jamming facing a bet post-flop
        if (isRaiseWorthy) {
          grade = 'A+';
          evDelta = +2.4;
          headline = isValueMadeHand || equity >= 60 ? 'High-Power Value Raise!' : 'Aggressive Semi-Bluff Combo Raise!';
          explanation = `Raising with ${handEval.bestFiveDescription}${drawSummary} (${equity}% equity) builds a massive pot while you hold a commanding equity edge.`;
          strategicTip = 'Fast-playing strong hands and monster combo draws (10+ outs) maximizes expected value.';
        } else {
          grade = 'D';
          evDelta = -1.7;
          leakCategory = 'positional-looseness';
          headline = 'Over-Aggressive Post-Flop Bluff Raise';
          explanation = `Raising with ${handEval.bestFiveDescription} (${equity}% equity) folds out all worse hands and isolates yourself against the top of the opponent's range.`;
        }
      }
    }
  }

  return {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    street,
    position: hero.position,
    heroCards: [...hero.cards],
    communityCards: [...communityCards],
    actionTaken: action.toUpperCase() + (betAmount > 0 ? ` (£${betAmount})` : ''),
    recommendedAction,
    grade,
    evDelta,
    handEquity: equity,
    potOdds: effectiveRequiredEquity,
    outs: drawInfo.totalOuts,
    boardTexture: drawInfo.boardTexture,
    headline,
    explanation,
    strategicTip,
    gameMode: config.gameMode,
    leakCategory,
  };
}

export interface LiveCoachRecommendation {
  recommendedAction: string;
  actionType: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  headline: string;
  explanation: string;
  strategicTip: string;
  suggestedAmount?: number;
}

export function getLiveCoachRecommendation(params: {
  hero: TrainerPlayer;
  pot: number;
  callAmount: number;
  communityCards: Card[];
  street: Street;
  activeOpponents: TrainerPlayer[];
  config: ScenarioConfig;
}): LiveCoachRecommendation {
  const { hero, pot, callAmount, communityCards, street, activeOpponents, config } = params;

  // 1. Probe to determine coach's optimal recommended action
  const probeAction = callAmount === 0 ? 'check' : 'call';
  const probeFeedback = evaluateHeroDecision({
    hero,
    action: probeAction,
    betAmount: callAmount,
    potBeforeAction: pot,
    callAmount,
    communityCards,
    street,
    activeOpponents,
    config,
  });

  const recLower = probeFeedback.recommendedAction.toLowerCase();
  let actionType: LiveCoachRecommendation['actionType'] = 'check';
  let targetAction: 'fold' | 'check' | 'call' | 'raise' | 'all-in' = 'check';

  if (recLower.includes('all-in') || recLower.includes('push')) {
    actionType = 'all-in';
    targetAction = 'all-in';
  } else if (recLower.includes('raise') || recLower.includes('bet')) {
    actionType = street === 'Pre-flop' ? 'raise' : callAmount === 0 ? 'bet' : 'raise';
    targetAction = 'raise';
  } else if (recLower.includes('call')) {
    actionType = 'call';
    targetAction = 'call';
  } else if (recLower.includes('fold')) {
    actionType = 'fold';
    targetAction = 'fold';
  }

  let suggestedAmount: number | undefined;
  if (actionType === 'bet' || actionType === 'raise') {
    if (street === 'Pre-flop') {
      suggestedAmount = Math.min(hero.chips, Math.round(Math.max(config.bigBlind * 2.5, callAmount + config.bigBlind * 2.5)));
    } else {
      suggestedAmount = Math.min(hero.chips, Math.max(config.bigBlind * 2, Math.round((pot * 0.6) / 5) * 5));
    }
  } else if (actionType === 'call') {
    suggestedAmount = Math.min(hero.chips, callAmount);
  }

  // 2. Evaluate with the recommended target action to generate prospective coaching guidance
  const finalFeedback = evaluateHeroDecision({
    hero,
    action: targetAction,
    betAmount: suggestedAmount ?? (targetAction === 'call' ? callAmount : 0),
    potBeforeAction: pot,
    callAmount,
    communityCards,
    street,
    activeOpponents,
    config,
  });

  return {
    recommendedAction: probeFeedback.recommendedAction,
    actionType,
    headline: finalFeedback.headline,
    explanation: finalFeedback.explanation,
    strategicTip: finalFeedback.strategicTip,
    suggestedAmount,
  };
}

// ==========================================
// 6. ADAPTIVE AI BOT DECISION ENGINE
// ==========================================

export function decideBotAction(params: {
  bot: TrainerPlayer;
  communityCards: Card[];
  street: Street;
  pot: number;
  highestBet: number;
  activePlayers: TrainerPlayer[];
  config: ScenarioConfig;
  heroStatsSummary?: {
    vpipPercent: number;
    pfrPercent: number;
    foldToPressurePercent: number;
  };
}): {
  action: 'fold' | 'check' | 'call' | 'raise' | 'all-in';
  betAmount: number;
  reasoning: string;
} {
  const {
    bot,
    communityCards,
    street,
    pot,
    highestBet,
    activePlayers,
    config,
    heroStatsSummary,
  } = params;

  const callAmount = Math.max(0, highestBet - bot.currentBet);
  const bb = config.bigBlind;
  const equity = estimateHeroEquity(bot.cards, communityCards, activePlayers.length - 1);
  const preflopScore = getPreflopHandPercentileScore(bot.cards[0], bot.cards[1]);
  const handEval = evaluateHand([...bot.cards, ...communityCards]);

  // All-In or Fold mode: strictly All-In or Fold
  if (config.gameMode === 'all-in-or-fold') {
    const pushCutoff =
      bot.persona === 'lag-maniac' || bot.persona === 'bounty-hunter'
        ? 44
        : bot.persona === 'nit-rock'
        ? 64
        : 52;
    if (preflopScore >= pushCutoff || equity >= 52) {
      return {
        action: 'all-in',
        betAmount: bot.chips,
        reasoning: `Pushing ${getPreflopHandNotation(bot.cards[0], bot.cards[1])} in AoF mode`,
      };
    }
    if (callAmount === 0) {
      return { action: 'check', betAmount: 0, reasoning: 'Checking option' };
    }
    return { action: 'fold', betAmount: 0, reasoning: 'Outside AoF push range' };
  }

  // Adaptive Shark adjustment based on Hero's tracked playstyle!
  let sharkBluffBoost = 0;
  let sharkValueTightness = 0;
  if (config.difficulty === 'shark' && heroStatsSummary) {
    if (heroStatsSummary.foldToPressurePercent > 55) {
      // Hero folds too much -> Bot bluffs more!
      sharkBluffBoost = 15;
    } else if (heroStatsSummary.vpipPercent > 42) {
      // Hero is a Calling Station -> Bot stops bluffing and value bets wider!
      sharkBluffBoost = -15;
      sharkValueTightness = -6;
    }
  }

  // Persona adjustments
  let loosenessMod = 0;
  let aggressionMod = 0;
  if (bot.persona === 'lag-maniac') {
    loosenessMod = -14;
    aggressionMod = +22;
  } else if (bot.persona === 'bounty-hunter') {
    loosenessMod = -10;
    aggressionMod = +18;
  } else if (bot.persona === 'calling-station') {
    loosenessMod = -18;
    aggressionMod = -20;
  } else if (bot.persona === 'nit-rock') {
    loosenessMod = +10;
    aggressionMod = -8;
  } else if (bot.persona === 'tight-passive') {
    loosenessMod = +4;
    aggressionMod = -15;
  }

  // Difficulty modifier
  if (config.difficulty === 'rookie') {
    loosenessMod -= 10; // Rookies play too many hands
  }

  const { rawPotOdds, bountyAdjustedPotOdds } = calculatePotOdds(
    callAmount,
    pot,
    config.gameMode === 'bounty-hunter' ? bb * 18 : 0
  );
  const reqEquity =
    config.gameMode === 'bounty-hunter' ? bountyAdjustedPotOdds : rawPotOdds;

  // Street: Pre-flop
  if (street === 'Pre-flop') {
    const openTarget =
      POSITION_OPEN_THRESHOLDS[bot.position] + loosenessMod + sharkValueTightness;

    if (callAmount <= bb) {
      if (preflopScore >= openTarget) {
        // Decide between standard raise and limp
        if (bot.persona === 'calling-station' && preflopScore < 76 && Math.random() < 0.65) {
          return {
            action: 'call',
            betAmount: callAmount,
            reasoning: 'Station limp to see a cheap flop',
          };
        }
        const desiredRaiseTotal = highestBet + bb * 2.5;
        const maxAllowed =
          config.gameMode === 'pot-limit'
            ? getPotLimitMaxTotalBet(pot, highestBet, bot.currentBet, bot.chips)
            : bot.currentBet + bot.chips;
        const finalRaiseTotal = Math.min(maxAllowed, Math.round(desiredRaiseTotal));
        const additional = Math.min(bot.chips, Math.max(callAmount + bb, finalRaiseTotal - bot.currentBet));
        return {
          action: additional >= bot.chips ? 'all-in' : 'raise',
          betAmount: additional,
          reasoning: `Opening ${getPreflopHandNotation(bot.cards[0], bot.cards[1])} from ${bot.position}`,
        };
      } else {
        if (callAmount === 0) {
          return { action: 'check', betAmount: 0, reasoning: 'Checking BB option' };
        }
        return { action: 'fold', betAmount: 0, reasoning: 'Pre-flop fold outside range' };
      }
    } else {
      // Facing a raise pre-flop
      if (preflopScore >= 82 - aggressionMod * 0.2 && bot.chips > callAmount * 2) {
        const desired3BetTotal = highestBet * 2.8;
        const maxAllowed =
          config.gameMode === 'pot-limit'
            ? getPotLimitMaxTotalBet(pot, highestBet, bot.currentBet, bot.chips)
            : bot.currentBet + bot.chips;
        const finalTotal = Math.min(maxAllowed, Math.round(desired3BetTotal));
        const additional = Math.min(bot.chips, Math.max(callAmount + bb, finalTotal - bot.currentBet));
        return {
          action: additional >= bot.chips ? 'all-in' : 'raise',
          betAmount: additional,
          reasoning: `3-betting strong holding (${getPreflopHandNotation(bot.cards[0], bot.cards[1])})`,
        };
      }
      if (equity >= reqEquity - (bot.persona === 'calling-station' ? 12 : 3)) {
        const actualCall = Math.min(bot.chips, callAmount);
        return {
          action: actualCall >= bot.chips ? 'all-in' : 'call',
          betAmount: actualCall,
          reasoning: 'Defending pre-flop with pot odds',
        };
      }
      return { action: 'fold', betAmount: 0, reasoning: 'Folding to pre-flop raise' };
    }
  }

  // Street: Post-flop (Flop, Turn, River)
  // Georgina Trap check: if tight-passive with Full House or better on Flop/Turn, check to trap!
  if (
    bot.persona === 'tight-passive' &&
    handEval.rankCategory >= 6 &&
    street !== 'River' &&
    callAmount === 0
  ) {
    return {
      action: 'check',
      betAmount: 0,
      reasoning: 'The Georgina Trap — slow-playing monster until River!',
    };
  }

  if (callAmount === 0) {
    // Decide between Check and Bet
    const shouldValueBet = equity >= 56 - sharkValueTightness;
    const shouldBluff =
      Math.random() * 100 < 22 + aggressionMod + sharkBluffBoost && street !== 'River';

    if (shouldValueBet || shouldBluff) {
      const sizingFraction =
        config.gameMode === 'pot-limit' ? 0.75 : shouldValueBet ? 0.65 : 0.5;
      let betSize = Math.max(bb, Math.round((pot * sizingFraction) / 5) * 5);
      if (config.gameMode === 'pot-limit') {
        const maxPL = getPotLimitMaxTotalBet(pot, highestBet, bot.currentBet, bot.chips) - bot.currentBet;
        betSize = Math.min(betSize, maxPL);
      }
      betSize = Math.min(bot.chips, betSize);
      return {
        action: betSize >= bot.chips ? 'all-in' : 'raise',
        betAmount: betSize,
        reasoning: shouldValueBet
          ? `Betting ${handEval.rankName} for value`
          : 'Applying semi-bluff barrel pressure',
      };
    }
    return { action: 'check', betAmount: 0, reasoning: 'Pot control check' };
  } else {
    // Facing a bet post-flop
    if (equity >= 72 && bot.chips > callAmount * 1.5) {
      let raiseTotal = highestBet * 2.4;
      if (config.gameMode === 'pot-limit') {
        const maxPL = getPotLimitMaxTotalBet(pot, highestBet, bot.currentBet, bot.chips);
        raiseTotal = Math.min(raiseTotal, maxPL);
      }
      const additional = Math.min(bot.chips, Math.max(callAmount + bb, Math.round(raiseTotal - bot.currentBet)));
      return {
        action: additional >= bot.chips ? 'all-in' : 'raise',
        betAmount: additional,
        reasoning: `Raising with ${handEval.rankName} (${equity}% equity)`,
      };
    }

    const stationSlack = bot.persona === 'calling-station' ? 14 : 0;
    if (equity + stationSlack >= reqEquity) {
      const actualCall = Math.min(bot.chips, callAmount);
      return {
        action: actualCall >= bot.chips ? 'all-in' : 'call',
        betAmount: actualCall,
        reasoning: `Calling with ${handEval.rankName} (${equity}% vs ${reqEquity}% odds)`,
      };
    }

    return {
      action: 'fold',
      betAmount: 0,
      reasoning: `Disciplined fold (${equity}% equity < ${reqEquity}% pot odds)`,
    };
  }
}
