import {
  FruityCartridge,
  CartridgeSymbol,
  BoardTile,
  CashLadderRung,
  PaytableEntry,
} from './types';

// ============================================================================
// CARTRIDGE 01: THE VEGAS STRIP FRUITY / MONOPOLY VEGAS STRIP
// E.P.T. High-Roller Edition featuring Edward Wearing (The Pit Boss),
// Dave Blackburn (The Card Shark), Chris Daly (The Magician), and
// Georgina Wearing (Lady Luck).
// ============================================================================

export const VEGAS_STRIP_SYMBOLS: CartridgeSymbol[] = [
  {
    id: 'jackpot_trophy',
    name: 'EPT Vegas Trophy',
    icon: '🏆',
    payout3: 100,
    weight: 2,
    badgeColor: 'bg-amber-500 text-black',
    comicLabel: '£100 JACKPOT',
    triggersDirectJackpot: true,
  },
  {
    id: 'edward_boss',
    name: 'Edward',
    avatarImg: '/avatars/avatar_edward_wearing_1772222877224.png',
    characterRole: 'The Pit Boss',
    payout3: 70,
    weight: 4,
    badgeColor: 'bg-yellow-400 text-black',
    comicLabel: 'THE PIT BOSS',
    triggersDirectFeature: true,
  },
  {
    id: 'dave_blackburn',
    name: 'Dave Blackburn',
    avatarImg: '/avatars/avatar_dave_blackburn_1787685845732.png',
    characterRole: 'The Card Shark',
    payout3: 40,
    weight: 6,
    badgeColor: 'bg-purple-500 text-white',
    comicLabel: 'THE CARD SHARK',
  },
  {
    id: 'chris_daly',
    name: 'Chris Daly',
    avatarImg: '/avatars/avatar_chris_daly_1772222942062.png',
    characterRole: 'The Magician',
    payout3: 25,
    weight: 9,
    badgeColor: 'bg-emerald-500 text-white',
    comicLabel: 'THE MAGICIAN',
  },
  {
    id: 'georgina_luck',
    name: 'Georgina',
    avatarImg: '/avatars/avatar_georgina_wearing_1772223035422.png',
    characterRole: 'Lady Luck',
    payout3: 15,
    weight: 12,
    badgeColor: 'bg-rose-500 text-white',
    comicLabel: 'LADY LUCK',
  },
  {
    id: 'bell',
    name: 'Liberty Bell',
    icon: '🔔',
    payout3: 10,
    weight: 16,
    badgeColor: 'bg-yellow-300 text-black',
    comicLabel: 'BELL CHIME',
  },
  {
    id: 'melon',
    name: 'Strip Melon',
    icon: '🍉',
    payout3: 7,
    weight: 20,
    badgeColor: 'bg-green-500 text-white',
    comicLabel: 'JUICY HIT',
  },
  {
    id: 'grapes',
    name: 'Pub Grapes',
    icon: '🍇',
    payout3: 5,
    weight: 24,
    badgeColor: 'bg-indigo-500 text-white',
    comicLabel: 'ROYAL VINTAGE',
  },
  {
    id: 'lemon',
    name: 'Casino Lemon',
    icon: '🍋',
    payout3: 4,
    weight: 28,
    badgeColor: 'bg-amber-300 text-black',
    comicLabel: 'SOUR SHOT',
  },
  {
    id: 'cherry',
    name: 'Twin Cherries',
    icon: '🍒',
    payout3: 3,
    payout2: 2,
    payout1: 1,
    weight: 34,
    badgeColor: 'bg-red-500 text-white',
    comicLabel: 'PAIR & SHARE',
  },
];

// Physical Stepper Reel Tape (16 symbols per reel strip - Balanced Casino Weighting)
export const VEGAS_STRIP_REEL_TAPE_0: CartridgeSymbol[] = [
  VEGAS_STRIP_SYMBOLS[0], // Jackpot Trophy
  VEGAS_STRIP_SYMBOLS[9], // Cherry (Only 1 cherry on reel 0)
  VEGAS_STRIP_SYMBOLS[8], // Lemon
  VEGAS_STRIP_SYMBOLS[1], // Edward Boss
  VEGAS_STRIP_SYMBOLS[7], // Grapes
  VEGAS_STRIP_SYMBOLS[6], // Melon
  VEGAS_STRIP_SYMBOLS[5], // Bell
  VEGAS_STRIP_SYMBOLS[2], // Dave Blackburn
  VEGAS_STRIP_SYMBOLS[5], // Bell
  VEGAS_STRIP_SYMBOLS[8], // Lemon
  VEGAS_STRIP_SYMBOLS[3], // Chris Daly
  VEGAS_STRIP_SYMBOLS[7], // Grapes
  VEGAS_STRIP_SYMBOLS[4], // Georgina
  VEGAS_STRIP_SYMBOLS[7], // Grapes
  VEGAS_STRIP_SYMBOLS[6], // Melon
  VEGAS_STRIP_SYMBOLS[8], // Lemon
];

export const VEGAS_STRIP_REEL_TAPE_1: CartridgeSymbol[] = [
  VEGAS_STRIP_SYMBOLS[1], // Edward Boss
  VEGAS_STRIP_SYMBOLS[8], // Lemon
  VEGAS_STRIP_SYMBOLS[9], // Cherry (Only 1 cherry on reel 1)
  VEGAS_STRIP_SYMBOLS[2], // Dave Blackburn
  VEGAS_STRIP_SYMBOLS[6], // Melon
  VEGAS_STRIP_SYMBOLS[0], // Jackpot Trophy
  VEGAS_STRIP_SYMBOLS[7], // Grapes
  VEGAS_STRIP_SYMBOLS[5], // Bell
  VEGAS_STRIP_SYMBOLS[6], // Melon
  VEGAS_STRIP_SYMBOLS[3], // Chris Daly
  VEGAS_STRIP_SYMBOLS[8], // Lemon
  VEGAS_STRIP_SYMBOLS[4], // Georgina
  VEGAS_STRIP_SYMBOLS[5], // Bell
  VEGAS_STRIP_SYMBOLS[7], // Grapes
  VEGAS_STRIP_SYMBOLS[6], // Melon
  VEGAS_STRIP_SYMBOLS[5], // Bell
];

export const VEGAS_STRIP_REEL_TAPE_2: CartridgeSymbol[] = [
  VEGAS_STRIP_SYMBOLS[2], // Dave Blackburn
  VEGAS_STRIP_SYMBOLS[9], // Cherry (Only 1 cherry on reel 2)
  VEGAS_STRIP_SYMBOLS[1], // Edward Boss
  VEGAS_STRIP_SYMBOLS[7], // Grapes
  VEGAS_STRIP_SYMBOLS[8], // Lemon
  VEGAS_STRIP_SYMBOLS[3], // Chris Daly
  VEGAS_STRIP_SYMBOLS[5], // Bell
  VEGAS_STRIP_SYMBOLS[6], // Melon
  VEGAS_STRIP_SYMBOLS[7], // Grapes
  VEGAS_STRIP_SYMBOLS[0], // Jackpot Trophy
  VEGAS_STRIP_SYMBOLS[4], // Georgina
  VEGAS_STRIP_SYMBOLS[8], // Lemon
  VEGAS_STRIP_SYMBOLS[8], // Lemon
  VEGAS_STRIP_SYMBOLS[7], // Grapes
  VEGAS_STRIP_SYMBOLS[6], // Melon
  VEGAS_STRIP_SYMBOLS[5], // Bell
];

export const VEGAS_STRIP_REEL_TAPES: [
  CartridgeSymbol[],
  CartridgeSymbol[],
  CartridgeSymbol[],
] = [
  VEGAS_STRIP_REEL_TAPE_0,
  VEGAS_STRIP_REEL_TAPE_1,
  VEGAS_STRIP_REEL_TAPE_2,
];

// Cash ladder rungs from £1 up to £100 Jackpot
export const VEGAS_STRIP_CASH_LADDER: number[] = [
  1, 2, 3, 5, 10, 15, 25, 40, 70, 100,
];

export const VEGAS_STRIP_CASH_LADDER_RUNGS: CashLadderRung[] =
  VEGAS_STRIP_CASH_LADDER.map((value, index, arr) => {
    const isJackpot = index === arr.length - 1;
    let stopperDelayMs = 70;
    if (index >= 8) stopperDelayMs = 28;
    else if (index >= 6) stopperDelayMs = 38;
    else if (index >= 3) stopperDelayMs = 50;

    return {
      index,
      value,
      label: isJackpot ? '🏆 JACKPOT' : `STEP ${index + 1}`,
      isJackpot,
      stopperDelayMs,
    };
  });

// 16 MONOPOLY-STYLE SQUARES ARRANGED IN A CLOCKWISE PERIMETER LOOP (5x5 GRID)
export const VEGAS_STRIP_BOARD_TILES: BoardTile[] = [
  // TOP ROW (Left to Right: indices 0..4)
  {
    id: 0,
    title: 'GO ➔',
    subtext: 'COLLECT £2',
    priceTag: '+£2',
    colorBar: 'bg-red-600',
    icon: '🚩',
    type: 'go',
    val: 2,
    isCorner: true,
    row: 'row-start-1',
    col: 'col-start-1',
  },
  {
    id: 1,
    title: 'STRIP LIMO',
    subtext: 'VIP NUDGE',
    priceTag: '+1 NUDGE',
    colorBar: 'bg-purple-700',
    icon: '🍾',
    type: 'nudge',
    val: 1,
    row: 'row-start-1',
    col: 'col-start-2',
  },
  {
    id: 2,
    title: 'FOUNTAINS',
    subtext: 'BELLAGIO',
    priceTag: '£2 CASH',
    colorBar: 'bg-sky-500',
    icon: '⛲',
    type: 'cash',
    val: 2,
    row: 'row-start-1',
    col: 'col-start-3',
  },
  {
    id: 3,
    title: 'MAGICIAN',
    subtext: 'CHRIS DALY',
    priceTag: 'MYSTERY ?',
    colorBar: 'bg-sky-600',
    avatarImg: '/avatars/avatar_chris_daly_1772222942062.png',
    type: 'mystery',
    val: 0,
    row: 'row-start-1',
    col: 'col-start-4',
  },
  {
    id: 4,
    title: 'SECURITY',
    subtext: 'IN JAIL / VISIT',
    priceTag: 'VISITING',
    colorBar: 'bg-amber-600',
    icon: '🚨',
    type: 'jail',
    val: 0,
    isCorner: true,
    row: 'row-start-1',
    col: 'col-start-5',
  },

  // RIGHT COLUMN (Top to Bottom: indices 5..7)
  {
    id: 5,
    title: 'PENTHOUSE',
    subtext: 'SUITE CASH',
    priceTag: '£5 CASH',
    colorBar: 'bg-pink-600',
    icon: '🍸',
    type: 'cash',
    val: 5,
    row: 'row-start-2',
    col: 'col-start-5',
  },
  {
    id: 6,
    title: 'ROULETTE',
    subtext: 'SPIN A WIN',
    priceTag: 'SKILL WHEEL',
    colorBar: 'bg-pink-700',
    icon: '🎡',
    type: 'roulette',
    val: 0,
    row: 'row-start-3',
    col: 'col-start-5',
  },
  {
    id: 7,
    title: 'GOLD OASIS',
    subtext: 'EXTRA LIFE',
    priceTag: '+1 LIFE',
    colorBar: 'bg-orange-500',
    icon: '❤️',
    type: 'life',
    val: 1,
    row: 'row-start-4',
    col: 'col-start-5',
  },

  // BOTTOM ROW (Right to Left: indices 8..11)
  {
    id: 8,
    title: 'PIT BOSS',
    subtext: 'FREE PARKING',
    priceTag: '£10 POT',
    colorBar: 'bg-red-700',
    avatarImg: '/avatars/avatar_edward_wearing_1772222877224.png',
    type: 'parking',
    val: 10,
    isCorner: true,
    row: 'row-start-5',
    col: 'col-start-5',
  },
  {
    id: 9,
    title: 'CABANA',
    subtext: 'ROOFTOP',
    priceTag: '£15 CASH',
    colorBar: 'bg-red-500',
    icon: '🏊',
    type: 'cash',
    val: 15,
    row: 'row-start-5',
    col: 'col-start-4',
  },
  {
    id: 10,
    title: 'CARD SHARK',
    subtext: 'DAVE B',
    priceTag: '£25 CASH',
    colorBar: 'bg-yellow-500',
    avatarImg: '/avatars/avatar_dave_blackburn_1787685845732.png',
    type: 'cash',
    val: 25,
    row: 'row-start-5',
    col: 'col-start-3',
  },
  {
    id: 11,
    title: 'VAULT POT',
    subtext: 'CHANCE',
    priceTag: '£40 CASH',
    colorBar: 'bg-yellow-600',
    icon: '🏨',
    type: 'cash',
    val: 40,
    row: 'row-start-5',
    col: 'col-start-2',
  },

  // LEFT COLUMN (Bottom to Top: indices 12..15)
  {
    id: 12,
    title: 'GO TO JAIL',
    subtext: 'HAZARD PIT',
    priceTag: 'HAZARD ☠️',
    colorBar: 'bg-blue-900',
    icon: '☠️',
    type: 'hazard',
    val: 0,
    isCorner: true,
    row: 'row-start-5',
    col: 'col-start-1',
  },
  {
    id: 13,
    title: 'REPEAT',
    subtext: 'CHANCE',
    priceTag: 'FRENZY!',
    colorBar: 'bg-emerald-600',
    icon: '🔁',
    type: 'repeat',
    val: 0,
    row: 'row-start-4',
    col: 'col-start-1',
  },
  {
    id: 14,
    title: 'LADY LUCK',
    subtext: 'GEORGINA',
    priceTag: '£70 CASH',
    colorBar: 'bg-emerald-700',
    avatarImg: '/avatars/avatar_georgina_wearing_1772223035422.png',
    type: 'cash',
    val: 70,
    row: 'row-start-3',
    col: 'col-start-1',
  },
  {
    id: 15,
    title: 'BOARDWALK',
    subtext: 'SUPER JACKPOT',
    priceTag: '£100 TOP',
    colorBar: 'bg-blue-600',
    icon: '🏆',
    type: 'jackpot',
    val: 100,
    row: 'row-start-2',
    col: 'col-start-1',
  },
];

// Structured Paytable Entries
export const VEGAS_STRIP_PAYTABLE: PaytableEntry[] = [
  {
    id: 'pay_3x_trophy',
    combination: '3x EPT Vegas Trophy',
    symbolIds: ['jackpot_trophy', 'jackpot_trophy', 'jackpot_trophy'],
    matchCount: 3,
    multiplier: 100,
    specialReward: 'Direct £100 Jackpot + Repeater Chance',
    badge: '🏆 DIRECT JACKPOT',
  },
  {
    id: 'pay_3x_edward',
    combination: '3x Edward (The Pit Boss)',
    symbolIds: ['edward_boss', 'edward_boss', 'edward_boss'],
    matchCount: 3,
    multiplier: 70,
    specialReward: 'Direct Monopoly Board Entry (Pit Boss Corner + 20x Pot + 1 Life)',
    badge: '🎩 THE PIT BOSS',
  },
  {
    id: 'pay_3x_dave',
    combination: '3x Dave Blackburn (The Card Shark)',
    symbolIds: ['dave_blackburn', 'dave_blackburn', 'dave_blackburn'],
    matchCount: 3,
    multiplier: 40,
    badge: '🦈 THE CARD SHARK',
  },
  {
    id: 'pay_3x_chris',
    combination: '3x Chris Daly (The Magician)',
    symbolIds: ['chris_daly', 'chris_daly', 'chris_daly'],
    matchCount: 3,
    multiplier: 25,
    badge: '🔮 THE MAGICIAN',
  },
  {
    id: 'pay_3x_georgina',
    combination: '3x Georgina (Lady Luck)',
    symbolIds: ['georgina_luck', 'georgina_luck', 'georgina_luck'],
    matchCount: 3,
    multiplier: 15,
    badge: '🌹 LADY LUCK',
  },
  {
    id: 'pay_3x_bell',
    combination: '3x Liberty Bell',
    symbolIds: ['bell', 'bell', 'bell'],
    matchCount: 3,
    multiplier: 10,
    badge: '🔔 BELL CHIME',
  },
  {
    id: 'pay_3x_melon',
    combination: '3x Strip Melon',
    symbolIds: ['melon', 'melon', 'melon'],
    matchCount: 3,
    multiplier: 7,
    badge: '🍉 JUICY HIT',
  },
  {
    id: 'pay_3x_grapes',
    combination: '3x Pub Grapes',
    symbolIds: ['grapes', 'grapes', 'grapes'],
    matchCount: 3,
    multiplier: 5,
    badge: '🍇 ROYAL VINTAGE',
  },
  {
    id: 'pay_3x_lemon',
    combination: '3x Casino Lemon',
    symbolIds: ['lemon', 'lemon', 'lemon'],
    matchCount: 3,
    multiplier: 4,
    badge: '🍋 SOUR SHOT',
  },
  {
    id: 'pay_3x_cherry',
    combination: '3x Twin Cherries',
    symbolIds: ['cherry', 'cherry', 'cherry'],
    matchCount: 3,
    multiplier: 3,
    badge: '🍒 PAIR & SHARE',
  },
  {
    id: 'pay_2x_cherry',
    combination: '2x Twin Cherries (Left + Center)',
    symbolIds: ['cherry', 'cherry'],
    matchCount: 2,
    multiplier: 2,
    badge: '🍒 TWO CHERRIES',
  },
  {
    id: 'pay_1x_cherry',
    combination: '1x Twin Cherry (Left Reel)',
    symbolIds: ['cherry'],
    matchCount: 1,
    multiplier: 1,
    badge: '🍒 ONE CHERRY',
  },
];

export const VEGAS_STRIP_CARTRIDGE: FruityCartridge = {
  id: '01-vegas-strip',
  slug: 'vegas-strip',
  title: 'The Vegas Strip Fruity',
  boardTitle: 'MONOPOLY VEGAS STRIP',
  cabinetTitle: 'THE VEGAS STRIP: MONOPOLY PUB FRUITY 🎰 🎩',
  hardwareBadge: 'UK Pub Fruit Machine (MPU4)',
  theme: {
    backdropUrl: '/backgrounds/8bit_night_skyline.png',
    boardTokenIcon: '🎩',
    hostess: {
      name: 'Sarah',
      title: 'Sarah • The Red Lion Landlady',
      avatarImg: '/vegas/dealer_sarah.jpg',
      defaultComment:
        'Right then, mate! The high rollers are on the Monopoly board! Roll around the park and aim for Boardwalk!',
      aiGameContext: 'The Red Lion English Pub Fruity - Monopoly Vegas High Rollers',
    },
    castCameos: [
      {
        name: 'Edward',
        role: 'Edward (The Pit Boss)',
        avatarImg: '/avatars/avatar_edward_wearing_1772222877224.png',
        borderColorClass: 'border-yellow-400',
      },
      {
        name: 'Dave Blackburn',
        role: 'Dave Blackburn (The Card Shark)',
        avatarImg: '/avatars/avatar_dave_blackburn_1787685845732.png',
        borderColorClass: 'border-purple-400',
      },
      {
        name: 'Chris Daly',
        role: 'Chris Daly (The Magician)',
        avatarImg: '/avatars/avatar_chris_daly_1772222942062.png',
        borderColorClass: 'border-emerald-400',
      },
      {
        name: 'Georgina',
        role: 'Georgina (Lady Luck)',
        avatarImg: '/avatars/avatar_georgina_wearing_1772223035422.png',
        borderColorClass: 'border-rose-400',
      },
    ],
    defaultTickerMessage:
      'MONOPOLY VEGAS STRIP • ROLL AROUND THE PARK • HIT 8 ON TRAIL OR EXCHANGE TO ENTER',
  },
  mechanics: {
    targetRTP: 0.74,
    initialLedgerIn: 30,
    initialLedgerOut: 28,
    stakes: [0.25, 0.5, 1, 2],
    defaultStake: 1,
    maxJackpot: 100,
    trailLength: 8,
    trailBonusStep: 4,
    passGoBonus: 2,
    directFeatureSymbolId: 'edward_boss',
    directFeatureStartTile: 8,
    directFeatureStartingPotMultiplier: 20,
    directFeatureStartingLives: 1,
    directJackpotSymbolId: 'jackpot_trophy',
  },
  symbols: VEGAS_STRIP_SYMBOLS,
  paytable: VEGAS_STRIP_PAYTABLE,
  reelTapes: VEGAS_STRIP_REEL_TAPES,
  boardTiles: VEGAS_STRIP_BOARD_TILES,
  cashLadder: VEGAS_STRIP_CASH_LADDER,
  cashLadderRungs: VEGAS_STRIP_CASH_LADDER_RUNGS,
  reelBonuses: [
    'CHRIS DALY TURBAN BOOST (+2 STEPS)',
    'DAVE B RE-SPIN CHANCE',
    'EDWARD SKILL STOPPER',
    'ADD AGAIN (DOUBLE NUMBERS)',
  ],
  mysteryRewards: [
    { id: 'extra_lives_2', text: '+2 EXTRA LIVES', type: 'lives', value: 2 },
    { id: 'cash_boost_15', text: '£15 CASH BOOST', type: 'cash', value: 15 },
    { id: 'stepper_nudges_3', text: '+3 STEPPER NUDGES', type: 'nudges', value: 3 },
    { id: 'equal_wins', text: 'EQUAL WINS ACTIVATED', type: 'equal_wins', value: 1 },
  ],
  oracleTips: [
    '🔮 ORACLE PREDICTION: IN {spinsUntilBoard} SPINS YOU WILL GET ON THE BOARD! 🔮',
    '🔮 ORACLE: NUDGE POTENTIAL DETECTED ON REEL 2! 🔮',
    '🔮 TIP: 3x EDWARD BOSSES TRIGGER DIRECT BOARD ENTRY! 🔮',
    '🔮 TIP: USE WIN OR BUST ON UPPER BOARD FOR 50/50 RANDOM JACKPOT! 🔮',
    '🔮 ORACLE: REPEAT CHANCE READY TO STRIKE! 🔮',
  ],
};

export default VEGAS_STRIP_CARTRIDGE;
