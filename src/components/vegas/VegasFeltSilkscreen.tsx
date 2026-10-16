'use client';

import React from 'react';

interface Props {
  gameType?: 'blackjack' | 'baccarat' | 'holdem' | 'craps' | 'roulette' | 'paigow' | 'generic';
  className?: string;
}

export default function VegasFeltSilkscreen({ gameType = 'blackjack', className = '' }: Props) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none select-none z-0 ${className}`}
      viewBox="0 0 1000 560"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Curved text paths for arcs */}
        <path
          id="blackjackInsurancePath"
          d="M 120 370 A 420 220 0 0 1 880 370"
          fill="none"
        />
        <path
          id="blackjackRulesPath"
          d="M 190 280 A 340 160 0 0 1 810 280"
          fill="none"
        />
        <path
          id="baccaratBankerPath"
          d="M 140 330 A 400 180 0 0 1 860 330"
          fill="none"
        />
        <path
          id="baccaratPlayerPath"
          d="M 100 420 A 450 220 0 0 1 900 420"
          fill="none"
        />
        <path
          id="baccaratTiePath"
          d="M 260 250 A 280 120 0 0 1 740 250"
          fill="none"
        />
        <path
          id="holdemBannerPath"
          d="M 180 330 A 350 170 0 0 1 820 330"
          fill="none"
        />
        <path
          id="paigowBannerPath"
          d="M 180 320 A 350 160 0 0 1 820 320"
          fill="none"
        />
      </defs>

      {/* ======================================================== */}
      {/* 1. BLACKJACK CASINO SILKSCREEN MARKINGS                  */}
      {/* ======================================================== */}
      {gameType === 'blackjack' && (
        <g opacity="0.45" strokeLinecap="round" strokeLinejoin="round">
          {/* Outer Table Boundary Arc */}
          <path
            d="M 50 490 A 500 290 0 0 1 950 490"
            fill="none"
            stroke="#ffd700"
            strokeWidth="3"
            opacity="0.6"
          />
          <path
            d="M 65 505 A 480 275 0 0 1 935 505"
            fill="none"
            stroke="#ffd700"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            opacity="0.4"
          />

          {/* Insurance Arc (Double Lines) */}
          <path
            d="M 120 370 A 420 220 0 0 1 880 370"
            fill="none"
            stroke="#ffd700"
            strokeWidth="2.5"
            opacity="0.8"
          />
          <path
            d="M 135 390 A 405 205 0 0 1 865 390"
            fill="none"
            stroke="#ffd700"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            opacity="0.6"
          />

          {/* Insurance Arc Silkscreen Text */}
          <text
            fill="#ffd700"
            fontSize="15"
            fontFamily="serif"
            fontWeight="900"
            letterSpacing="0.25em"
            opacity="0.9"
          >
            <textPath href="#blackjackInsurancePath" startOffset="50%" textAnchor="middle">
              ★ INSURANCE PAYS 2 TO 1 ★
            </textPath>
          </text>

          {/* Dealer Rules Arc */}
          <path
            d="M 190 280 A 340 160 0 0 1 810 280"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <text
            fill="#ffffff"
            fontSize="13"
            fontFamily="sans-serif"
            fontWeight="800"
            letterSpacing="0.18em"
            opacity="0.85"
          >
            <textPath href="#blackjackRulesPath" startOffset="50%" textAnchor="middle">
              BLACKJACK PAYS 3 TO 2 • DEALER MUST STAND ON 17 AND DRAW TO 16
            </textPath>
          </text>

          {/* Dealer Card Placement Frames (2 cards) */}
          <g transform="translate(425, 120)" stroke="#ffd700" strokeWidth="1.5" fill="none" opacity="0.6">
            <rect x="0" y="0" width="65" height="92" rx="6" strokeDasharray="5 3" />
            <rect x="80" y="0" width="65" height="92" rx="6" strokeDasharray="5 3" />
            {/* Corner alignment ticks */}
            <path d="M -5 10 L 0 10 M 10 -5 L 10 0" />
            <path d="M 150 10 L 145 10 M 135 -5 L 135 0" />
          </g>

          {/* 5 Distinct Player Betting Stations (Positions 1 to 5 around the table arc) */}
          {[
            { cx: 160, cy: 430, label: 'SEAT 1' },
            { cx: 330, cy: 460, label: 'SEAT 2' },
            { cx: 500, cy: 475, label: 'YOUR SPOT' },
            { cx: 670, cy: 460, label: 'SEAT 4' },
            { cx: 840, cy: 430, label: 'SEAT 5' },
          ].map((spot, i) => (
            <g key={i} transform={`translate(${spot.cx}, ${spot.cy})`}>
              {/* Main Bet Circle */}
              <circle r="36" fill="none" stroke="#ffd700" strokeWidth="2" opacity={i === 2 ? '0.9' : '0.4'} />
              <circle r="31" fill="none" stroke="#ffd700" strokeWidth="1" strokeDasharray="4 3" opacity={i === 2 ? '0.8' : '0.3'} />
              {/* Radiating Corner Marks */}
              <line x1="0" y1="-42" x2="0" y2="-36" stroke="#ffd700" strokeWidth="2" opacity="0.7" />
              <line x1="0" y1="42" x2="0" y2="36" stroke="#ffd700" strokeWidth="2" opacity="0.7" />
              <line x1="-42" y1="0" x2="-36" y2="0" stroke="#ffd700" strokeWidth="2" opacity="0.7" />
              <line x1="42" y1="0" x2="36" y2="0" stroke="#ffd700" strokeWidth="2" opacity="0.7" />

              {/* Side Bet Spot (21+3 / Perfect Pairs) */}
              <circle cx="34" cy="-30" r="14" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
              <text x="34" y="-27" fill="#ffffff" fontSize="7" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" opacity="0.6">
                21+3
              </text>
            </g>
          ))}
        </g>
      )}

      {/* ======================================================== */}
      {/* 2. BACCARAT PUNTO BANCO CASINO SILKSCREEN MARKINGS       */}
      {/* ======================================================== */}
      {gameType === 'baccarat' && (
        <g opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Top Dealer Commission Boxes */}
          <g transform="translate(180, 110)" stroke="#ffd700" strokeWidth="1.5" fill="none" opacity="0.7">
            {[1, 2, 3, 5, 6, 7, 8, 9].map((num, i) => (
              <g key={i} transform={`translate(${i * 80}, 0)`}>
                <rect x="0" y="0" width="60" height="26" rx="4" strokeDasharray="4 2" />
                <text x="30" y="17" fill="#ffd700" fontSize="11" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
                  COMM {num}
                </text>
              </g>
            ))}
          </g>

          {/* Tie Betting Arc (Top Zone) */}
          <path
            d="M 260 250 A 280 120 0 0 1 740 250"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            opacity="0.8"
          />
          <text
            fill="#10b981"
            fontSize="14"
            fontFamily="serif"
            fontWeight="900"
            letterSpacing="0.25em"
            opacity="0.9"
          >
            <textPath href="#baccaratTiePath" startOffset="50%" textAnchor="middle">
              ★ TIE PAYS 8 TO 1 ★
            </textPath>
          </text>

          {/* Banker Betting Arc (Middle Zone) */}
          <path
            d="M 140 330 A 400 180 0 0 1 860 330"
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            opacity="0.85"
          />
          <path
            d="M 155 350 A 385 165 0 0 1 845 350"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            opacity="0.6"
          />
          <text
            fill="#ef4444"
            fontSize="14"
            fontFamily="sans-serif"
            fontWeight="900"
            letterSpacing="0.22em"
            opacity="0.95"
          >
            <textPath href="#baccaratBankerPath" startOffset="50%" textAnchor="middle">
              BANKER PAYS 1 TO 1 (5% COMMISSION DEDUCTED)
            </textPath>
          </text>

          {/* Player Betting Arc (Outer Zone) */}
          <path
            d="M 100 420 A 450 220 0 0 1 900 420"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            opacity="0.85"
          />
          <text
            fill="#3b82f6"
            fontSize="15"
            fontFamily="sans-serif"
            fontWeight="900"
            letterSpacing="0.25em"
            opacity="0.95"
          >
            <textPath href="#baccaratPlayerPath" startOffset="50%" textAnchor="middle">
              PLAYER PAYS 1 TO 1
            </textPath>
          </text>

          {/* Radiating Sector Dividers across Player / Banker positions */}
          {[200, 320, 440, 560, 680, 800].map((x, i) => (
            <line
              key={i}
              x1={x}
              y1="340"
              x2={x + (x > 500 ? 30 : -30)}
              y2="460"
              stroke="#ffd700"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.45"
            />
          ))}

          {/* Card Landing Zones for Player & Banker */}
          <g transform="translate(240, 150)" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.6">
            <rect x="0" y="0" width="130" height="90" rx="8" strokeDasharray="5 3" />
            <text x="65" y="-8" fill="#3b82f6" fontSize="10" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              PLAYER CARDS
            </text>
          </g>
          <g transform="translate(630, 150)" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.6">
            <rect x="0" y="0" width="130" height="90" rx="8" strokeDasharray="5 3" />
            <text x="65" y="-8" fill="#ef4444" fontSize="10" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              BANKER CARDS
            </text>
          </g>
        </g>
      )}

      {/* ======================================================== */}
      {/* 3. CRAPS LAS VEGAS PIT SILKSCREEN MARKINGS               */}
      {/* ======================================================== */}
      {gameType === 'craps' && (
        <g opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Outer Pass Line Boundary Horseshoe Frame */}
          <path
            d="M 60 120 L 60 480 A 60 60 0 0 0 120 540 L 880 540 A 60 60 0 0 0 940 480 L 940 120"
            fill="none"
            stroke="#ffd700"
            strokeWidth="3.5"
            opacity="0.8"
          />
          <path
            d="M 85 140 L 85 465 A 45 45 0 0 0 130 515 L 870 515 A 45 45 0 0 0 915 465 L 915 140"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            opacity="0.5"
          />

          {/* PASS LINE Text along bottom rail */}
          <text
            x="500"
            y="534"
            fill="#ffd700"
            fontSize="18"
            fontFamily="serif"
            fontWeight="900"
            letterSpacing="0.4em"
            textAnchor="middle"
            opacity="0.9"
          >
            ★ PASS LINE (PAYS 1 TO 1) ★
          </text>
          <text
            x="72"
            y="320"
            fill="#ffd700"
            fontSize="13"
            fontFamily="serif"
            fontWeight="900"
            letterSpacing="0.25em"
            textAnchor="middle"
            transform="rotate(-90, 72, 320)"
            opacity="0.8"
          >
            PASS LINE
          </text>
          <text
            x="928"
            y="320"
            fill="#ffd700"
            fontSize="13"
            fontFamily="serif"
            fontWeight="900"
            letterSpacing="0.25em"
            textAnchor="middle"
            transform="rotate(90, 928, 320)"
            opacity="0.8"
          >
            PASS LINE
          </text>

          {/* DON'T PASS BAR 12 Ribbon */}
          <path
            d="M 120 475 L 880 475"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            opacity="0.7"
          />
          <text
            x="500"
            y="467"
            fill="#ef4444"
            fontSize="12"
            fontFamily="sans-serif"
            fontWeight="900"
            letterSpacing="0.25em"
            textAnchor="middle"
            opacity="0.9"
          >
            DON&apos;T PASS BAR 12
          </text>

          {/* Place Bet Point Grid Silkscreen Outlines (4, 5, SIX, 8, NINE, 10) */}
          <g transform="translate(140, 130)" stroke="#ffd700" strokeWidth="2" fill="none" opacity="0.65">
            {[
              { val: '4' },
              { val: '5' },
              { val: 'SIX' },
              { val: '8' },
              { val: 'NINE' },
              { val: '10' },
            ].map((box, i) => (
              <g key={i} transform={`translate(${i * 120}, 0)`}>
                <rect x="0" y="0" width="110" height="75" rx="8" />
                <rect x="5" y="5" width="100" height="65" rx="5" strokeWidth="1" strokeDasharray="4 3" />
                <text x="55" y="44" fill="#ffd700" fontSize="20" fontFamily="serif" fontWeight="900" textAnchor="middle">
                  {box.val}
                </text>
              </g>
            ))}
          </g>

          {/* COME Bet Central Silkscreen Box */}
          <g transform="translate(140, 225)" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.6">
            <rect x="0" y="0" width="710" height="65" rx="8" />
            <text x="355" y="43" fill="#ffffff" fontSize="26" fontFamily="serif" fontWeight="900" letterSpacing="0.35em" textAnchor="middle">
              C O M E
            </text>
          </g>

          {/* FIELD BET Silkscreen Area */}
          <g transform="translate(140, 310)" stroke="#a855f7" strokeWidth="2" fill="none" opacity="0.7">
            <rect x="0" y="0" width="710" height="70" rx="8" />
            <text x="355" y="24" fill="#a855f7" fontSize="13" fontFamily="sans-serif" fontWeight="900" letterSpacing="0.25em" textAnchor="middle">
              THE FIELD • 2 (2X) • 3 • 4 • 9 • 10 • 11 • 12 (3X)
            </text>
            <circle cx="210" cy="46" r="14" stroke="#ffd700" strokeWidth="1.5" />
            <text x="210" y="51" fill="#ffd700" fontSize="13" fontWeight="900" textAnchor="middle">2</text>
            <circle cx="490" cy="46" r="14" stroke="#ffd700" strokeWidth="1.5" />
            <text x="490" y="51" fill="#ffd700" fontSize="13" fontWeight="900" textAnchor="middle">12</text>
          </g>
        </g>
      )}

      {/* ======================================================== */}
      {/* 4. ULTIMATE TEXAS HOLD'EM CARNIVAL MARKINGS              */}
      {/* ======================================================== */}
      {gameType === 'holdem' && (
        <g opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Semicircular Banner */}
          <path
            d="M 180 330 A 350 170 0 0 1 820 330"
            fill="none"
            stroke="#ffd700"
            strokeWidth="2"
            opacity="0.75"
          />
          <text
            fill="#ffd700"
            fontSize="14"
            fontFamily="serif"
            fontWeight="900"
            letterSpacing="0.25em"
            opacity="0.9"
          >
            <textPath href="#holdemBannerPath" startOffset="50%" textAnchor="middle">
              ★ ULTIMATE TEXAS HOLD&apos;EM • DEALER QUALIFIES WITH PAIR OR BETTER ★
            </textPath>
          </text>

          {/* 5 Community Card Frames on Felt (Flop, Turn, River) */}
          <g transform="translate(260, 160)" stroke="#ffd700" strokeWidth="2" fill="none" opacity="0.75">
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} transform={`translate(${i * 95}, 0)`}>
                <rect x="0" y="0" width="80" height="110" rx="8" strokeDasharray={i < 3 ? 'none' : '6 3'} />
                <rect x="4" y="4" width="72" height="102" rx="6" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                <text x="40" y="-8" fill="#ffd700" fontSize="11" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
                  {i === 0 ? 'FLOP 1' : i === 1 ? 'FLOP 2' : i === 2 ? 'FLOP 3' : i === 3 ? 'TURN' : 'RIVER'}
                </text>
              </g>
            ))}
          </g>

          {/* Dealer Card Frames (Top) */}
          <g transform="translate(415, 60)" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.5">
            <rect x="0" y="0" width="75" height="85" rx="6" strokeDasharray="4 3" />
            <rect x="90" y="0" width="75" height="85" rx="6" strokeDasharray="4 3" />
            <text x="82" y="-6" fill="#ffffff" fontSize="10" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              DEALER HOLE CARDS
            </text>
          </g>

          {/* Player Wager Cluster Silkscreen Circles (Trips, Ante, Blind, Play) */}
          <g transform="translate(500, 430)">
            {/* Trips */}
            <circle cx="-160" cy="0" r="34" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.8" />
            <text x="-160" y="-8" fill="#a855f7" fontSize="12" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              TRIPS
            </text>
            <text x="-160" y="10" fill="#a855f7" fontSize="8" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">
              BONUS
            </text>

            {/* Ante */}
            <circle cx="-55" cy="0" r="34" fill="none" stroke="#ffd700" strokeWidth="2" opacity="0.85" />
            <text x="-55" y="4" fill="#ffd700" fontSize="13" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              ANTE
            </text>

            {/* Blind */}
            <circle cx="55" cy="0" r="34" fill="none" stroke="#ffd700" strokeWidth="2" opacity="0.85" />
            <text x="55" y="4" fill="#ffd700" fontSize="13" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              BLIND
            </text>

            {/* Play */}
            <rect x="120" y="-34" width="90" height="68" rx="10" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.85" />
            <text x="165" y="-6" fill="#22c55e" fontSize="13" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              PLAY
            </text>
            <text x="165" y="12" fill="#22c55e" fontSize="8" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">
              3X • 4X • 1X
            </text>
          </g>
        </g>
      )}

      {/* ======================================================== */}
      {/* 5. PAI GOW POKER CASINO SILKSCREEN MARKINGS              */}
      {/* ======================================================== */}
      {gameType === 'paigow' && (
        <g opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Semicircular Banner */}
          <path
            d="M 180 320 A 350 160 0 0 1 820 320"
            fill="none"
            stroke="#ffd700"
            strokeWidth="2"
            opacity="0.75"
          />
          <text
            fill="#ffd700"
            fontSize="14"
            fontFamily="serif"
            fontWeight="900"
            letterSpacing="0.25em"
            opacity="0.9"
          >
            <textPath href="#paigowBannerPath" startOffset="50%" textAnchor="middle">
              ★ PAI GOW POKER • 5% COMMISSION ON WINNING HANDS ★
            </textPath>
          </text>

          {/* Dealer Card Landing Frames (High 5, Low 2) */}
          <g transform="translate(280, 110)" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.6">
            <rect x="0" y="0" width="260" height="85" rx="8" strokeDasharray="5 3" />
            <text x="130" y="-8" fill="#ffffff" fontSize="10" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              DEALER HIGH HAND (5 CARDS)
            </text>
          </g>
          <g transform="translate(580, 110)" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.6">
            <rect x="0" y="0" width="140" height="85" rx="8" strokeDasharray="5 3" />
            <text x="70" y="-8" fill="#ffffff" fontSize="10" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              DEALER LOW (2)
            </text>
          </g>

          {/* Player Card Landing Frames (High 5, Low 2) */}
          <g transform="translate(240, 360)" stroke="#ffd700" strokeWidth="2" fill="none" opacity="0.7">
            <rect x="0" y="0" width="300" height="100" rx="10" strokeDasharray="6 4" />
            <text x="150" y="-10" fill="#ffd700" fontSize="12" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              PLAYER HIGH HAND (5 CARDS)
            </text>
          </g>
          <g transform="translate(580, 360)" stroke="#ffd700" strokeWidth="2" fill="none" opacity="0.7">
            <rect x="0" y="0" width="180" height="100" rx="10" strokeDasharray="6 4" />
            <text x="90" y="-10" fill="#ffd700" fontSize="12" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
              LOW HAND (2 CARDS)
            </text>
          </g>
        </g>
      )}

      {/* ======================================================== */}
      {/* 6. GENERIC / ALL TABLES CASINO ACCENTS                   */}
      {/* ======================================================== */}
      <g opacity="0.25">
        {/* Subtle perimeter felt stitch line */}
        <rect
          x="20"
          y="20"
          width="960"
          height="520"
          rx="25"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeDasharray="8 6"
        />
      </g>
    </svg>
  );
}
