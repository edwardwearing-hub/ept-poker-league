export interface VegasGameTutorial {
  id: string;
  number: number;
  title: string;
  tagline: string;
  category: 'table' | 'machine' | 'poker' | 'sports';
  houseEdge: string;
  appeal: string;
  minBet: number;
  maxBet: number;
  image: string;
  overview: string;
  howToPlay: string[];
  keyRules: { title: string; description: string }[];
  payouts: { bet: string; payout: string; odds?: string }[];
  casinoTips: string[];
}

export const VEGAS_GAMES_CATALOG: VegasGameTutorial[] = [
  {
    id: 'blackjack',
    number: 1,
    title: 'Blackjack',
    tagline: 'The undisputed king of Las Vegas table games (21)',
    category: 'table',
    houseEdge: '~0.5%',
    appeal: 'Simple to pick up with one of the lowest house edges on the casino floor using standard basic strategy.',
    minBet: 10,
    maxBet: 1000,
    image: '/vegas/tables/blackjack.jpg',
    overview:
      'Players compete directly against the dealer to reach a total hand value closest to 21 without going bust (exceeding 21). Cards 2-10 count at face value, Face cards (J, Q, K) count as 10, and Aces count as either 1 or 11.',
    howToPlay: [
      'Place your wager on the felt betting circle.',
      'You are dealt two face-up cards; the dealer receives one face-up and one face-down (the "hole" card).',
      'Hit (take another card) or Stand (keep your hand). You may also Double Down (double your bet for exactly one extra card) or Split matching pairs.',
      'Once all player actions finish, the dealer reveals their hole card. The dealer MUST hit until reaching at least 17.',
      'If your hand is closer to 21 than the dealer without busting, you win 1:1! An original 2-card 21 (Ace + 10/Face) is a "Natural Blackjack" and pays 3:2.',
    ],
    keyRules: [
      {
        title: 'Dealer Stands on 17',
        description: 'The house rules mandate the dealer must draw on 16 and stand on any 17 or higher.',
      },
      {
        title: 'Double Down',
        description: 'You can double your original bet on your starting two cards. You receive exactly one additional card.',
      },
      {
        title: 'Splitting Pairs',
        description: 'If dealt two cards of identical rank (e.g. 8-8), you can split them into two independent hands by matching your original wager.',
      },
      {
        title: 'Natural Blackjack',
        description: 'Ace + 10-value card pays 3:2 instantly unless the dealer also shows a natural blackjack (which pushes).',
      },
    ],
    payouts: [
      { bet: 'Natural Blackjack (A + 10/J/Q/K)', payout: '3:2' },
      { bet: 'Standard Win', payout: '1:1' },
      { bet: 'Insurance Bet', payout: '2:1' },
      { bet: 'Tie / Push', payout: 'Stake Returned' },
    ],
    casinoTips: [
      'Always split Aces and 8s; never split 10s or 5s.',
      'Double down on hard 11 against any dealer up-card except an Ace.',
      'Never take Insurance—statistically it carries a high 7.4% house edge.',
    ],
  },
  {
    id: 'slots',
    number: 2,
    title: 'Slot Machines',
    tagline: 'Vegas Neon Multi-Line Reels & Megabucks Jackpots',
    category: 'machine',
    houseEdge: '5% – 12%',
    appeal: 'Low barrier to entry, vibrant visuals, instant multi-line wins, and the thrill of hitting progressive jackpots.',
    minBet: 5,
    maxBet: 250,
    image: '/vegas/tables/slots.jpg',
    overview:
      'Occupying the vast majority of Las Vegas casino floors, slots range from traditional 3-reel mechanical spinners to massive video machines with wild multipliers, scatter symbols, and jackpot bonus lines.',
    howToPlay: [
      'Select your bet denomination and number of active paylines.',
      'Hit "Spin" to set the reels in motion.',
      'Match 3 or more symbols across paylines from left to right to trigger payouts.',
      'Watch for Wild symbols (substitute for all standard symbols) and Bonus Scatters to trigger massive multipliers or the Megabucks Jackpot!',
    ],
    keyRules: [
      {
        title: 'Paylines',
        description: 'Winning combinations must follow predefined horizontal, diagonal, or zigzag paylines across the reels.',
      },
      {
        title: 'Wild Symbols',
        description: 'Wilds act as chameleons, substituting for regular icons to complete top-paying lines.',
      },
      {
        title: 'Progressive Jackpot',
        description: 'A portion of every wager feeds the grand jackpot pool until one lucky spinner aligns the 777 Diamond combo.',
      },
    ],
    payouts: [
      { bet: '3x Megabucks Wild Diamond', payout: '500:1 (Jackpot)' },
      { bet: '3x Lucky Triple Sevens (777)', payout: '100:1' },
      { bet: '3x Gold Bells', payout: '40:1' },
      { bet: '3x Triple Bars', payout: '25:1' },
      { bet: '3x Double Bars', payout: '15:1' },
      { bet: '3x Cherries', payout: '8:1' },
      { bet: 'Any 2 Cherries', payout: '3:1' },
    ],
    casinoTips: [
      'Slots are pure RNG (Random Number Generation)—each spin is completely independent with no "due" cycles.',
      'Betting maximum credits often unlocks the highest tier payout ratio on top jackpots.',
    ],
  },
  {
    id: 'craps',
    number: 3,
    title: 'Craps',
    tagline: 'The loudest, highest-energy dice game on the Strip',
    category: 'table',
    houseEdge: '1.41% (Pass Line) / 0% (True Odds)',
    appeal: 'Electric communal camaraderie where the entire table roots for the shooter to roll winning numbers together.',
    minBet: 10,
    maxBet: 500,
    image: '/vegas/tables/craps.jpg',
    overview:
      'Players take turns as the "Shooter" throwing two dice across the felt. Bets are wagered on the outcome of the roll, structured around the "Come Out Roll" and establishing a "Point".',
    howToPlay: [
      'Place a bet on the Pass Line before the Come Out Roll.',
      'Shooter rolls two dice: If the roll is a 7 or 11, the Pass Line wins immediately (Natural). If a 2, 3, or 12 is rolled, the Pass Line loses (Craps).',
      'If any other number is rolled (4, 5, 6, 8, 9, or 10), that number becomes the "Point" and the ON puck is placed on it.',
      'The shooter keeps rolling: If the shooter rolls the Point again before rolling a 7, the table WINS! If a 7 is rolled first (Seven Out), the table loses and dice pass to the next shooter.',
    ],
    keyRules: [
      {
        title: 'Pass Line',
        description: 'Wins on 7/11 on the Come Out roll; loses on 2/3/12. After a Point is set, wins if Point is repeated before a 7.',
      },
      {
        title: 'Don’t Pass',
        description: 'The inverse "dark side" bet. Wins on 2/3 on the Come Out roll (12 pushes); loses on 7/11. Wins if 7 rolls before the Point.',
      },
      {
        title: 'Field Bet',
        description: 'A 1-roll wager that wins if 2, 3, 4, 9, 10, 11, or 12 rolls (2 pays 2:1, 12 pays 3:1).',
      },
      {
        title: 'Free Odds',
        description: 'Once a Point is set, players can place additional Odds behind their Pass Line bet that carry 0.00% house edge.',
      },
    ],
    payouts: [
      { bet: 'Pass Line / Don’t Pass', payout: '1:1' },
      { bet: 'Field (3, 4, 9, 10, 11)', payout: '1:1' },
      { bet: 'Field (2 rolls double)', payout: '2:1' },
      { bet: 'Field (12 rolls triple)', payout: '3:1' },
      { bet: 'Any 7 (Single roll)', payout: '4:1' },
      { bet: 'Hard 6 or Hard 8 (Pair of 3s or 4s)', payout: '9:1' },
    ],
    casinoTips: [
      'Stick to Pass Line and backing it with Maximum Odds—it reduces the casino advantage to less than 1%.',
      'Avoid high house-edge "proposition" bets in the center of the table (like Any 7 which has a punishing 16.7% edge).',
    ],
  },
  {
    id: 'roulette',
    number: 4,
    title: 'Roulette',
    tagline: 'The iconic spinning wheel and ivory ball of Las Vegas',
    category: 'table',
    houseEdge: '2.7% (European) / 5.26% (American)',
    appeal: 'Straightforward betting choices ranging from safe even-money flips to thrilling 35:1 single-number payouts.',
    minBet: 5,
    maxBet: 500,
    image: '/vegas/tables/roulette.jpg',
    overview:
      'A spinning wheel partitioned with 37 or 38 numbered pockets (0, 00, and 1-36). A small ball is launched in reverse direction and lands in a pocket as the wheel slows down. Players place chips across the layout covering individual numbers or groups.',
    howToPlay: [
      'Place your chips on any individual number, split line, street, corner, or outside section (Red/Black, Odd/Even, 1-18, 19-36, Dozens, Columns).',
      'Hit "Spin Wheel" to release the ball into the spinning wheel cylinder.',
      'The ball settles into a winning pocket, and all winning wagers are paid out instantly according to the paytable!',
    ],
    keyRules: [
      {
        title: 'Inside Bets',
        description: 'Wagers placed directly on single numbers or small clusters (Straight Up pays 35:1, Split pays 17:1, Corner pays 8:1).',
      },
      {
        title: 'Outside Bets',
        description: 'Wagers placed on broader categories with high hit rates: Red/Black, Even/Odd, Low (1-18), High (19-36), Dozens, and Columns.',
      },
      {
        title: 'Zero & Double Zero',
        description: 'Green pockets (0 and 00) provide the house edge on outside bets (all Red/Black bets lose if the ball lands on 0/00).',
      },
    ],
    payouts: [
      { bet: 'Straight Up (Single Number)', payout: '35:1' },
      { bet: 'Split (2 Numbers)', payout: '17:1' },
      { bet: 'Street (3 Numbers)', payout: '11:1' },
      { bet: 'Corner / Square (4 Numbers)', payout: '8:1' },
      { bet: 'Dozens (1st, 2nd, 3rd 12)', payout: '2:1' },
      { bet: 'Columns (12 Numbers)', payout: '2:1' },
      { bet: 'Red / Black or Odd / Even', payout: '1:1' },
      { bet: 'High (19-36) / Low (1-18)', payout: '1:1' },
    ],
    casinoTips: [
      'Single-zero (European) roulette offers half the house edge (2.70%) compared to American double-zero (5.26%).',
      'Beware betting systems like Martingale—table maximums and bankroll limits prevent guaranteed wins.',
    ],
  },
  {
    id: 'baccarat',
    number: 5,
    title: 'Baccarat (Punto Banco)',
    tagline: 'High-roller elegance with a low 1.06% house edge',
    category: 'table',
    houseEdge: '1.06% (Banker) / 1.24% (Player) / 14.36% (Tie)',
    appeal: 'Requires zero in-game decision making, plays rapidly, and boasts one of the lowest house edges in the entire casino.',
    minBet: 10,
    maxBet: 1000,
    image: '/vegas/tables/baccarat.jpg',
    overview:
      'Players wager on which of two hands—the "Player" or the "Banker"—will achieve a point total closest to 9, or whether the hand will end in a Tie. Tens and face cards count as 0, Aces count as 1, and only the last digit of the total counts (e.g. 7 + 8 = 15 -> 5).',
    howToPlay: [
      'Bet on Player, Banker, or Tie.',
      'Two cards are dealt to the Player hand and two to the Banker hand.',
      'If either hand totals 8 or 9, it is a "Natural" and no more cards are dealt.',
      'Otherwise, standard strict drawing rules (the Tableau) dictate whether the Player or Banker receives a single third card.',
      'The hand closest to 9 wins! Winning Banker bets pay 1:1 minus a 5% house commission (0.95:1) due to its statistical advantage.',
    ],
    keyRules: [
      {
        title: 'Point Calculation',
        description: 'Only the last digit matters. A hand of 9 + 6 = 15 counts as 5 points.',
      },
      {
        title: 'Player 3rd Card Rule',
        description: 'Player draws a third card on 0-5; stands on 6 or 7.',
      },
      {
        title: 'Banker 3rd Card Rule',
        description: 'If Player stands on two cards, Banker draws on 0-5 and stands on 6-7. If Player draws, Banker follows the official tableau chart.',
      },
      {
        title: '5% Banker Commission',
        description: 'Because Banker acts second and wins 50.68% of non-tie hands, a 5% fee is deducted from Banker wins.',
      },
    ],
    payouts: [
      { bet: 'Player Hand Win', payout: '1:1' },
      { bet: 'Banker Hand Win', payout: '0.95:1 (1:1 minus 5% commission)' },
      { bet: 'Tie Hand', payout: '8:1' },
      { bet: 'Player Pair / Banker Pair', payout: '11:1' },
    ],
    casinoTips: [
      'Statistically, betting Banker every hand offers the optimal expected value (~1.06% house edge).',
      'Never bet the Tie—an 8:1 payout might seem enticing, but it carries a brutal 14.36% casino advantage.',
    ],
  },
  {
    id: 'live-poker',
    number: 6,
    title: 'Live Texas Hold’em Poker',
    tagline: 'The ultimate game of skill, position, and psychology',
    category: 'poker',
    houseEdge: '0% (Player vs Player / Casino rake)',
    appeal: 'Unlike house games where you compete against mathematical odds, in poker you compete against other players where skill and strategy prevail.',
    minBet: 10,
    maxBet: 5000,
    image: '/vegas/tables/live-poker.jpg',
    overview:
      'From the Bellagio and Aria to the World Series of Poker on the Strip, Texas Hold’em is the defining game of Las Vegas. Players are dealt two private hole cards and share five community cards to create the strongest five-card poker hand.',
    howToPlay: [
      'Two players post mandatory Small and Big Blinds to generate the starting pot.',
      'Pre-Flop: Players receive 2 hole cards and decide to Fold, Call the big blind, or Raise.',
      'Flop: Dealer burns one card and spreads 3 community cards face-up. Another round of betting ensues.',
      'Turn & River: Fourth and fifth community cards are dealt with betting after each street.',
      'Showdown: Remaining players reveal their cards. The best 5-card combination wins the pot, or a well-timed bluff wins uncontested!',
    ],
    keyRules: [
      {
        title: 'Table Position',
        description: 'Acting last on the Button or Cutoff gives you maximum information on opponents before you commit chips.',
      },
      {
        title: 'Pot Odds & Equity',
        description: 'Calculate whether the size of the pot justifies the cost of calling with drawing hands like flush and straight draws.',
      },
      {
        title: 'No-Limit Structure',
        description: 'You can wager any amount up to your entire chip stack at any time during a hand.',
      },
    ],
    payouts: [
      { bet: 'Pots Won', payout: '100% of Contested Pot (minus small rake)' },
      { bet: 'Tournaments', payout: 'Top 10-15% of field paid according to prize ladder' },
    ],
    casinoTips: [
      'Play in position! Acting last on the Flop, Turn, and River gives you immense tactical power.',
      'Tight is right for beginners: play only the top 15-20% of starting hands from early position.',
    ],
  },
  {
    id: 'video-poker',
    number: 7,
    title: 'Video Poker (Jacks or Better)',
    tagline: 'Bar-top classic with 99.54% Return to Player',
    category: 'machine',
    houseEdge: '0.46% (Full-Pay 9/6)',
    appeal: 'Significantly higher returns than traditional slots. Blends the speed of electronic gaming with the skill of optimal draw strategy.',
    minBet: 5,
    maxBet: 100,
    image: '/vegas/tables/video-poker.jpg',
    overview:
      'Found across bar counters in virtually every Vegas resort. Players receive a five-card hand, choose which cards to hold, and draw replacements. Payouts begin at a pair of Jacks or Better.',
    howToPlay: [
      'Select your coin bet (1 to 5 coins). Playing Max Bet (5 coins) unlocks the boosted 4,000 coin Royal Flush jackpot!',
      'Click "Deal" to receive five initial cards.',
      'Click the cards you wish to keep ("HELD"). You can hold none, some, or all five cards.',
      'Click "Draw" to discard unheld cards and replace them with fresh cards from the deck.',
      'If your final five cards form a qualifying poker hand (Jacks or Better or higher), you are paid according to the paytable.',
    ],
    keyRules: [
      {
        title: 'Jacks or Better Minimum',
        description: 'Low pairs (2s through 10s) do not pay anything. A pair of Jacks, Queens, Kings, or Aces returns 1:1.',
      },
      {
        title: 'Full Pay 9/6 Machine',
        description: 'Full pay machines award 9 coins per unit bet for a Full House and 6 coins for a Flush, yielding a 99.54% theoretical return.',
      },
      {
        title: '5-Coin Royal Flush Boost',
        description: 'Betting 1-4 coins pays 250:1 on a Royal Flush, but 5 coins awards a massive 800:1 (4,000 coins).',
      },
    ],
    payouts: [
      { bet: 'Royal Flush (Max 5 Coins)', payout: '800:1 (4,000 Coins)' },
      { bet: 'Straight Flush', payout: '50:1' },
      { bet: 'Four of a Kind', payout: '25:1' },
      { bet: 'Full House', payout: '9:1' },
      { bet: 'Flush', payout: '6:1' },
      { bet: 'Straight', payout: '4:1' },
      { bet: 'Three of a Kind', payout: '3:1' },
      { bet: 'Two Pair', payout: '2:1' },
      { bet: 'Pair of Jacks or Better', payout: '1:1' },
    ],
    casinoTips: [
      'Always play Max Bet (5 coins) to qualify for the 800:1 Royal Flush bonus.',
      'Never hold an unsuited high card kicker when you already have a Low Pair (hold the pair instead).',
    ],
  },
  {
    id: 'sportsbook',
    number: 8,
    title: 'Vegas Sportsbook',
    tagline: 'Stadium LED boards, live match odds & parlay slips',
    category: 'sports',
    houseEdge: '4.5% – 5.5% (Vig/Juice)',
    appeal: 'Turns live sports viewing into an electrifying betting event with Moneylines, Spreads, Totals, and multi-leg Parlays.',
    minBet: 10,
    maxBet: 2000,
    image: '/vegas/tables/sportsbook.jpg',
    overview:
      'Las Vegas sportsbooks feature colossal panoramic displays and private leather club seating. Bettors wager on domestic and international football, NFL, basketball, and marquee boxing/UFC title bouts.',
    howToPlay: [
      'Browse the Sportsbook fixture board for upcoming matches and live odds.',
      'Choose your bet type: Moneyline (outright match winner), Point Spread / Handicap, or Over/Under Total Goals/Points.',
      'Add one or multiple selections to your Bet Slip.',
      'Bet as a Single wager or combine selections into a high-octane Parlay where all legs must win for multiplied payouts!',
      'Watch the live match simulation and cash out your winnings upon final whistle.',
    ],
    keyRules: [
      {
        title: 'Moneyline (1X2)',
        description: 'Pick the outright winner of the fixture (Home Win, Draw, or Away Win).',
      },
      {
        title: 'Point Spread / Goal Handicap',
        description: 'The underdog receives extra points/goals (+1.5) while the favorite must win by more than the spread (-1.5).',
      },
      {
        title: 'Over / Under (Totals)',
        description: 'Wager whether the combined score of both teams will be higher or lower than the benchmark (e.g. Over 2.5 Goals).',
      },
      {
        title: 'Parlay / Accumulator Multipliers',
        description: 'Multiplying odds together across 2, 3, or 4 games creates huge payouts from small stakes, but every selection must win.',
      },
    ],
    payouts: [
      { bet: 'Moneyline Singles', payout: 'Based on decimal odds (e.g. 2.10x return)' },
      { bet: 'Standard Point Spread (-110)', payout: '1.91:1' },
      { bet: '2-Leg Parlay', payout: '~3.6:1' },
      { bet: '3-Leg Parlay', payout: '~6.8:1' },
      { bet: '4-Leg Mega Parlay', payout: '~12.5:1' },
    ],
    casinoTips: [
      'Look for value in underdog spreads rather than blindly backing heavy favorites.',
      'Keep parlays small (2 or 3 legs)—each added leg compounds the house margin.',
    ],
  },
  {
    id: 'ultimate-holdem',
    number: 9,
    title: 'Ultimate Texas Hold’em',
    tagline: 'The #1 carnival table game on the Strip',
    category: 'table',
    houseEdge: '~2.2% (on Ante)',
    appeal: 'Combines Texas Hold’em card gameplay with a casino table layout where early aggression (4x pre-flop raise) yields huge mathematical edge.',
    minBet: 10,
    maxBet: 500,
    image: '/vegas/tables/ultimate-holdem.jpg',
    overview:
      'Players go head-to-head against the dealer. Equal bets are placed on Ante and Blind, with an optional Trips bonus. Five community cards are shared, and players can bet early for 4x their ante, or wait for the Flop or River at reduced multiples.',
    howToPlay: [
      'Place equal bets on "Ante" and "Blind" (and optional Trips bonus).',
      'You and the dealer receive 2 private hole cards.',
      'Pre-Flop Decision: Check or make the "Play" bet of 3x or 4x your Ante.',
      'Flop: If you checked pre-flop, the 3-card Flop is revealed. You can Check or make the Play bet at 2x your Ante.',
      'River: If you checked through the Flop, Turn and River are dealt. You must either bet 1x your Ante or Fold.',
      'Showdown: Dealer reveals cards. The dealer needs at least a Pair to "Qualify". High hand wins according to ranking rules!',
    ],
    keyRules: [
      {
        title: 'Dealer Qualifies on Pair',
        description: 'If the dealer does not have at least a Pair, the Ante bet pushes (returned). Play and Blind bets still pay if you beat the dealer!',
      },
      {
        title: 'Early 4x Raise Advantage',
        description: 'Unlike poker where you want to trap, raising 4x pre-flop with strong hands (Pairs, Ace-high, suited Kings) minimizes the house edge.',
      },
      {
        title: 'Blind Bet Payouts',
        description: 'The Blind bet pushes if you win with less than a Straight. Straights and above receive bonus odds up to 500:1 for a Royal Flush!',
      },
    ],
    payouts: [
      { bet: 'Play Bet Win', payout: '1:1' },
      { bet: 'Ante Win (Dealer Qualifies)', payout: '1:1' },
      { bet: 'Blind: Royal Flush', payout: '500:1' },
      { bet: 'Blind: Straight Flush', payout: '50:1' },
      { bet: 'Blind: Four of a Kind', payout: '10:1' },
      { bet: 'Blind: Full House', payout: '3:1' },
      { bet: 'Blind: Flush', payout: '3:2' },
      { bet: 'Blind: Straight', payout: '1:1' },
      { bet: 'Trips Bonus: Three of a Kind or Better', payout: '3:1 to 50:1' },
    ],
    casinoTips: [
      'Always raise 4x pre-flop with any pair of 3s or higher, Ace-high, or King-Five suited or better.',
      'Never fold on the River if you have a pair or better—you only need to risk 1x Ante to see showdown.',
    ],
  },
  {
    id: 'pai-gow',
    number: 10,
    title: 'Pai Gow Poker',
    tagline: '7-Card East-meets-West classic with 41% Push rate',
    category: 'table',
    houseEdge: '~2.8%',
    appeal: 'A leisurely, social game where over 40% of hands result in a push, allowing your bankroll to last for hours while mastering hand setting.',
    minBet: 10,
    maxBet: 500,
    image: '/vegas/tables/pai-gow.jpg',
    overview:
      'Players receive 7 cards and must split them into two hands: a 5-card "High Hand" and a 2-card "Low Hand". To win, both of your hands must rank higher than both of the dealer’s hands.',
    howToPlay: [
      'Place your wager on the Pai Gow betting circle.',
      'You and the dealer are dealt 7 cards each.',
      'Split your 7 cards into a 5-card High Hand (Behind) and a 2-card Low Hand (In Front).',
      'CRITICAL RULE: Your 5-card High Hand must be ranked higher than your 2-card Low Hand! If your low hand is stronger, your hand is a "Foul" and automatically loses.',
      'Showdown: The dealer sets their hand using the casino’s standardized "House Way" rules. Compare your hands side-by-side.',
      'Result: If you win BOTH hands, you win 1:1 (minus 5% commission). If you win one and lose one, it is a PUSH (no money lost). If the dealer wins both or ties copies, the house wins.',
    ],
    keyRules: [
      {
        title: 'The 5-Card & 2-Card Split',
        description: 'The 5-card hand uses standard poker rankings. The 2-card hand can only be a Pair or High Cards (Pair of Aces is the best 2-card hand).',
      },
      {
        title: 'Foul Hand Rule',
        description: 'If you set a Pair of Kings in the 2-card hand and only Ace-high in the 5-card hand, you foul and forfeit your bet.',
      },
      {
        title: 'Dealer Wins Copies (Ties)',
        description: 'If your 2-card hand exactly ties the dealer’s 2-card hand (e.g. Ace-King vs Ace-King), the dealer wins that sub-hand.',
      },
      {
        title: 'The 41% Push Phenomenon',
        description: 'Because winning one hand and losing the other pushes, Pai Gow is the ultimate game for stretching session bankrolls.',
      },
    ],
    payouts: [
      { bet: 'Win Both Hands', payout: '0.95:1 (1:1 minus 5% commission)' },
      { bet: 'Win One, Lose One', payout: 'Push (Bet Returned)' },
      { bet: 'Lose Both Hands', payout: 'Loss' },
    ],
    casinoTips: [
      'With Two Pair, split them if you have Aces or high pairs; keep them together in the 5-card hand only if you have a strong Ace to put in the 2-card hand.',
      'With a Full House, put the Three of a Kind in the 5-card hand and the Pair in the 2-card hand.',
    ],
  },
  {
    id: 'pub-fruity',
    number: 11,
    title: 'The Vegas Strip Fruity',
    tagline: 'Authentic 1990s UK Pub Fruit Machine (MPU4) with 8-Bit High Rollers, Stepper Nudges & Top Glass',
    category: 'machine',
    houseEdge: '15% – 20% (Compensated 80% RTP)',
    appeal: 'The authentic British pub fruity experience! 3 mechanical stepper reels, single winline, 1-8 number trail with trail held, Hold After Nudge (HAN), and the top glass feature board with Skill Cash Stopper and Reel Roulette.',
    minBet: 0.25,
    maxBet: 2,
    image: '/vegas/tables/pub-fruity-v2.jpg?v=20261016_2',
    overview:
      'Unlike Vegas slots where bonuses are passive free spins, a classic UK pub fruit machine (Category C / MPU4) uses the bottom reels as an entry mechanism into the interactive top glass. Features a true compensated ledger engine, stepper recoil bounce, and 3 entry pathways.',
    howToPlay: [
      'Choose your stake (25p, 50p, £1, or £2) and hit START to spin the 3 mechanical stepper reels.',
      'Pathway A (Reel Trail): Numbers on the winline advance the 1-8 trail. Step 4 awards Reel Bonuses (Turban Boost, Add Again); Step 8 unlocks the Top Glass! If near the top, "Trail Held" preserves progress.',
      'Pathway B (Direct Line-Up): Align 3 EPT Trophies (£100 Jackpot) or 3 Edward Boss symbols for instant direct entry.',
      'Pathway C (Exchange to Feature): On any basic fruit win (Cherries, Lemons, Grapes), press [EXCHANGE] to Hi-Lo gamble directly into the Top Glass rather than taking small cash!',
      'Holds & Nudges: Flashing HOLD buttons lock reels. Awarded nudges (1-4) step individual reels down. Press AUTO-NUDGE to solve the best combination.',
      'Top Glass Board: Roll dice or guess HI-LO to navigate 16 squares, climb the Cash Ladder, and trigger mini-games like Skill Cash Stopper and Reel Roulette.',
    ],
    keyRules: [
      {
        title: 'Hold After Nudge (HAN) Exploit',
        description: 'If you nudge in a winning combination on the winline, the machine guarantees HOLD on all 3 reels for the next paid spin to award the win a second time!',
      },
      {
        title: 'Pathway C: Exchange to Feature',
        description: 'Lining up a basic fruit win allows choosing between taking cash or pressing EXCHANGE to gamble on Hi-Lo to unlock the Top Glass board.',
      },
      {
        title: 'Compensated Ledger Engine',
        description: 'The MPU4 software monitors Total In vs Total Out (80% target RTP). In TIGHT mode, skill stops slip; in GIVING mode, true skill is enabled and repeaters flash YES.',
      },
      {
        title: 'Skill Cash Stopper & Reel Roulette',
        description: 'Board mini-games test timing and reflexes: freeze the bouncing light on the £100 jackpot or stop the spinning center wheel.',
      },
    ],
    payouts: [
      { bet: '3x EPT Vegas Trophy (Jackpot)', payout: '100x Stake (£100 Jackpot + Repeater)' },
      { bet: '3x Edward Wearing (The Pit Boss)', payout: '70x Stake (or Direct Board Entry)' },
      { bet: '3x Dave Blackburn (The Card Shark)', payout: '40x Stake' },
      { bet: '3x Chris Daly (The Magician)', payout: '25x Stake' },
      { bet: '3x Georgina (Lady Luck)', payout: '15x Stake' },
      { bet: '3x Liberty Bells', payout: '10x Stake' },
      { bet: '3x Strip Melons', payout: '7x Stake' },
      { bet: '3x Pub Grapes', payout: '5x Stake' },
      { bet: '3x Casino Lemons', payout: '4x Stake' },
      { bet: '3x Twin Cherries', payout: '3x Stake' },
      { bet: '2x Cherries / 1x Cherry', payout: '2x / 1x Stake' },
    ],
    casinoTips: [
      'Always exploit Hold After Nudge (HAN): if you nudged in a winning combination, hold all 3 reels on the next spin for an automatic duplicate win.',
      'On small fruit wins (e.g. £1 or £2), consider pressing EXCHANGE—climbing to the top glass offers a far higher expected return and jackpot shots.',
      'Watch the machine status: when in GIVING mode, the Skill Cash Stopper allows true reflex stops without software slip.',
    ],
  },
];

