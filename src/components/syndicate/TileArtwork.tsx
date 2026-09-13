'use client';

import React from 'react';
import { Lock } from 'lucide-react';

interface TileArtworkProps {
  id: string;
  type: 'table' | 'business' | 'tournament' | 'district' | 'relic';
  name?: string;
  fallbackImage?: string;
  className?: string;
  isLocked?: boolean;
}

export default function TileArtwork({
  id,
  type,
  name,
  fallbackImage,
  className = 'w-full h-24 rounded-xl overflow-hidden mb-3 border border-white/10 group',
  isLocked = false,
}: TileArtworkProps) {
  // If a dedicated raster image exists (like for tables with generated art), we can support it,
  // but if the artwork is custom SVG or fallbackImage is not provided, we render the bespoke SVG artwork!
  const hasDedicatedRasterImage = Boolean(
    fallbackImage && 
    (fallbackImage.includes('hero_dealer_desk') || 
     fallbackImage.includes('table_poker') || 
     fallbackImage.includes('table_roulette') ||
     fallbackImage.includes('vegas_strip_resort'))
  );

  return (
    <div className={`relative overflow-hidden select-none ${className}`}>
      {/* Background artwork renderer */}
      {hasDedicatedRasterImage ? (
        <img
          src={fallbackImage}
          alt={name || id}
          className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
          <ArtworkSVG id={id} type={type} />
        </div>
      )}

      {/* Atmospheric Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark via-charcoal-dark/20 to-transparent opacity-80 pointer-events-none" />

      {/* Locked Glass Shield Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center gap-2 border border-white/10">
          <div className="p-2 rounded-full bg-black/80 border border-white/20 text-zinc-400 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
            <Lock size={16} className="text-zinc-400 group-hover:text-gold transition-colors" />
          </div>
        </div>
      )}
    </div>
  );
}

function ArtworkSVG({ id, type }: { id: string; type: TileArtworkProps['type'] }) {
  switch (id) {
    // ---------------------------------------------------------
    // CASINO TABLES
    // ---------------------------------------------------------
    case 'underground-dice':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="wall-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c1917" />
              <stop offset="60%" stopColor="#0c0a09" />
              <stop offset="100%" stopColor="#050505" />
            </linearGradient>
            <radialGradient id="lamp-light" cx="0.8" cy="0.2" r="0.8">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#b45309" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="dice-red-1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <linearGradient id="cardboard" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#wall-grad)" />
          {/* Brick lines */}
          <path d="M0 30 H320 M0 60 H320 M0 90 H320 M0 120 H320" stroke="#292524" strokeWidth="1.5" strokeDasharray="40 5 35 5" opacity="0.6" />
          <rect width="320" height="180" fill="url(#lamp-light)" />
          {/* Cardboard ground */}
          <polygon points="0,110 320,100 320,180 0,180" fill="url(#cardboard)" opacity="0.85" />
          {/* Crumpled bills */}
          <polygon points="40,135 75,130 85,150 48,155" fill="#065f46" stroke="#047857" strokeWidth="1" />
          <polygon points="42,136 73,132 83,148 50,153" fill="#047857" opacity="0.8" />
          <text x="60" y="145" fill="#a7f3d0" fontSize="8" fontWeight="bold" fontFamily="monospace">$100</text>
          
          <polygon points="190,140 230,135 240,158 200,162" fill="#065f46" stroke="#047857" strokeWidth="1" />
          <text x="212" y="152" fill="#a7f3d0" fontSize="8" fontWeight="bold" fontFamily="monospace">$100</text>
          {/* Poker Chips stack */}
          <ellipse cx="145" cy="155" rx="14" ry="5" fill="#b45309" stroke="#f59e0b" strokeWidth="1" />
          <ellipse cx="145" cy="151" rx="14" ry="5" fill="#b45309" stroke="#f59e0b" strokeWidth="1" />
          <ellipse cx="145" cy="147" rx="14" ry="5" fill="#d97706" stroke="#fbbf24" strokeWidth="1" />
          <ellipse cx="145" cy="143" rx="14" ry="5" fill="#f59e0b" stroke="#fef08a" strokeWidth="1" />
          {/* Dice 1 (shows 4) */}
          <g transform="translate(95, 80) rotate(-15)">
            <rect x="0" y="0" width="34" height="34" rx="6" fill="url(#dice-red-1)" stroke="#f87171" strokeWidth="1.5" />
            <circle cx="9" cy="9" r="3" fill="#ffffff" />
            <circle cx="25" cy="9" r="3" fill="#ffffff" />
            <circle cx="9" cy="25" r="3" fill="#ffffff" />
            <circle cx="25" cy="25" r="3" fill="#ffffff" />
          </g>
          {/* Dice 2 (shows 3) */}
          <g transform="translate(145, 95) rotate(25)">
            <rect x="0" y="0" width="34" height="34" rx="6" fill="url(#dice-red-1)" stroke="#f87171" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="3" fill="#ffffff" />
            <circle cx="17" cy="17" r="3" fill="#ffffff" />
            <circle cx="26" cy="26" r="3" fill="#ffffff" />
          </g>
          <text x="20" y="40" fill="#f59e0b" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif" opacity="0.9">
            STREET CRAPS • LUCKY 7
          </text>
        </svg>
      );

    case 'speakeasy-blackjack':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="felt-red" cx="0.5" cy="0.6" r="0.7">
              <stop offset="0%" stopColor="#881337" />
              <stop offset="60%" stopColor="#4c0519" />
              <stop offset="100%" stopColor="#1f020a" />
            </radialGradient>
            <linearGradient id="card-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="gold-border" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#felt-red)" />
          {/* Table insurance line arch */}
          <path d="M20,160 Q160,80 300,160" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.6" />
          <path d="M40,165 Q160,105 280,165" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
          <text x="160" y="98" fill="#fbbf24" fontSize="7" fontWeight="bold" textAnchor="middle" letterSpacing="1.5" opacity="0.7">
            BLACKJACK PAYS 3 TO 2 • DEALER MUST STAND ON 17
          </text>
          {/* Card 1: Ace of Spades */}
          <g transform="translate(100, 75) rotate(-8)">
            <rect x="0" y="0" width="46" height="66" rx="4" fill="url(#card-grad)" stroke="#94a3b8" strokeWidth="1" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.6))" />
            <text x="6" y="16" fill="#0f172a" fontSize="14" fontWeight="black" fontFamily="sans-serif">A</text>
            <text x="6" y="28" fill="#0f172a" fontSize="11">♠</text>
            <text x="23" y="44" fill="#0f172a" fontSize="24" textAnchor="middle">♠</text>
          </g>
          {/* Card 2: Jack of Clubs (Natural 21!) */}
          <g transform="translate(138, 70) rotate(10)">
            <rect x="0" y="0" width="46" height="66" rx="4" fill="url(#card-grad)" stroke="#94a3b8" strokeWidth="1" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.6))" />
            <text x="6" y="16" fill="#0f172a" fontSize="14" fontWeight="black" fontFamily="sans-serif">J</text>
            <text x="6" y="28" fill="#0f172a" fontSize="11">♣</text>
            <text x="23" y="44" fill="#0f172a" fontSize="22" textAnchor="middle">♣</text>
          </g>
          {/* Single-deck wooden dealing shoe */}
          <polygon points="15,60 55,40 65,75 25,95" fill="#271306" stroke="url(#gold-border)" strokeWidth="1" />
          <rect x="23" y="45" width="28" height="6" fill="#f8fafc" transform="rotate(-26 23 45)" />
          {/* Amber whiskey glass */}
          <ellipse cx="275" cy="85" rx="14" ry="6" fill="#b45309" opacity="0.7" />
          <path d="M263,85 L266,115 Q275,122 284,115 L287,85 Z" fill="#d97706" opacity="0.6" stroke="#fef08a" strokeWidth="0.8" />
          <rect x="270" y="93" width="10" height="10" rx="2" fill="#ffffff" opacity="0.5" />
          <text x="20" y="32" fill="#f43f5e" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            SPEAKEASY 21 • SINGLE DECK
          </text>
        </svg>
      );

    case 'high-roller-holdem':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="felt-gold" cx="0.5" cy="0.5" r="0.7">
              <stop offset="0%" stopColor="#1e3a24" />
              <stop offset="70%" stopColor="#0c1f12" />
              <stop offset="100%" stopColor="#050d08" />
            </radialGradient>
            <linearGradient id="gold-metallic" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#felt-gold)" />
          {/* Table Golden Inlay Ribbon */}
          <ellipse cx="160" cy="110" rx="135" ry="55" fill="none" stroke="url(#gold-metallic)" strokeWidth="2.5" opacity="0.7" />
          <ellipse cx="160" cy="110" rx="115" ry="45" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="8 4" opacity="0.4" />
          
          {/* Dealer Button */}
          <circle cx="160" cy="85" r="16" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))" />
          <text x="160" y="89" fill="#0f172a" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="1">DEALER</text>
          
          {/* High Stakes Rectangular Plaques */}
          <g transform="translate(60, 100) rotate(-15)">
            <rect x="0" y="0" width="36" height="22" rx="3" fill="#1e293b" stroke="url(#gold-metallic)" strokeWidth="1.5" />
            <text x="18" y="14" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">$25,000</text>
          </g>
          <g transform="translate(68, 110) rotate(-10)">
            <rect x="0" y="0" width="36" height="22" rx="3" fill="#0f172a" stroke="url(#gold-metallic)" strokeWidth="1.5" />
            <text x="18" y="14" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">$100,000</text>
          </g>

          {/* Cards Fan: Royal Flush Spades */}
          {[
            { label: '10', rot: -16, x: 195 },
            { label: 'J', rot: -8, x: 207 },
            { label: 'Q', rot: 0, x: 219 },
            { label: 'K', rot: 8, x: 231 },
            { label: 'A', rot: 16, x: 243 }
          ].map((c, i) => (
            <g key={i} transform={`translate(${c.x}, 90) rotate(${c.rot})`}>
              <rect x="0" y="0" width="32" height="48" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))" />
              <text x="4" y="12" fill="#0f172a" fontSize="10" fontWeight="bold">{c.label}</text>
              <text x="4" y="21" fill="#0f172a" fontSize="8">♠</text>
            </g>
          ))}

          <text x="20" y="32" fill="#eab308" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            VIP SANCTUARY • NO LIMIT HOLD'EM
          </text>
        </svg>
      );

    case 'baccarat-penthouse':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="penthouse-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#090514" />
              <stop offset="60%" stopColor="#1e1035" />
              <stop offset="100%" stopColor="#2e1065" />
            </linearGradient>
            <radialGradient id="table-purple" cx="0.5" cy="0.8" r="0.7">
              <stop offset="0%" stopColor="#6b21a8" />
              <stop offset="60%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#140224" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#penthouse-sky)" />
          {/* Skyline buildings */}
          <rect x="30" y="20" width="35" height="100" fill="#0f0728" opacity="0.8" />
          <rect x="80" y="40" width="45" height="80" fill="#09031a" opacity="0.9" />
          <rect x="145" y="15" width="40" height="105" fill="#170c36" opacity="0.8" />
          <rect x="200" y="30" width="50" height="90" fill="#0c0420" opacity="0.9" />
          <rect x="265" y="10" width="45" height="110" fill="#13082b" opacity="0.8" />
          {/* Window dots */}
          <circle cx="45" cy="35" r="1.5" fill="#fef08a" opacity="0.8" />
          <circle cx="55" cy="50" r="1.5" fill="#fef08a" opacity="0.6" />
          <circle cx="160" cy="30" r="1.5" fill="#fbcfe8" opacity="0.7" />
          <circle cx="170" cy="65" r="1.5" fill="#fef08a" opacity="0.8" />
          <circle cx="280" cy="40" r="1.5" fill="#fef08a" opacity="0.7" />
          
          {/* Penthouse table */}
          <path d="M0,110 Q160,85 320,110 L320,180 L0,180 Z" fill="url(#table-purple)" />
          {/* Baccarat Sectors */}
          <path d="M50,140 Q160,120 270,140" fill="none" stroke="#f0abfc" strokeWidth="1.5" opacity="0.7" />
          <text x="100" y="133" fill="#f0abfc" fontSize="9" fontWeight="900" letterSpacing="1">PLAYER</text>
          <text x="160" y="133" fill="#38bdf8" fontSize="9" fontWeight="900" letterSpacing="1" textAnchor="middle">TIE</text>
          <text x="220" y="133" fill="#f43f5e" fontSize="9" fontWeight="900" letterSpacing="1">BANKER</text>
          
          {/* Luxury Champagne Flute */}
          <path d="M285,100 L287,130 Q290,135 293,130 L295,100 Z" fill="#e9d5ff" opacity="0.5" stroke="#ffffff" strokeWidth="0.5" />
          <line x1="290" y1="135" x2="290" y2="155" stroke="#ffffff" strokeWidth="1" />
          <ellipse cx="290" cy="155" rx="7" ry="2" fill="#ffffff" opacity="0.6" />
          
          <text x="20" y="30" fill="#d8b4fe" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            PENTHOUSE BACCARAT • VIP SALON
          </text>
        </svg>
      );

    case 'cosmic-whale-salon':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="vault-core" cx="0.5" cy="0.5" r="0.7">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="70%" stopColor="#0a0f1d" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            <linearGradient id="gold-bar" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#vault-core)" />
          {/* Giant circular steel vault door background */}
          <circle cx="160" cy="90" r="75" fill="none" stroke="#334155" strokeWidth="8" opacity="0.6" />
          <circle cx="160" cy="90" r="60" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="12 6" opacity="0.8" />
          {/* Laser security beams */}
          <line x1="0" y1="40" x2="320" y2="130" stroke="#06b6d4" strokeWidth="1.2" opacity="0.5" />
          <line x1="0" y1="140" x2="320" y2="50" stroke="#06b6d4" strokeWidth="1.2" opacity="0.5" />

          {/* Pyramid of Gold Bullion Bars */}
          <g transform="translate(115, 85)">
            {/* Bottom row */}
            <polygon points="10,40 30,25 60,25 40,40" fill="url(#gold-bar)" stroke="#ca8a04" strokeWidth="0.5" />
            <polygon points="40,40 60,25 60,35 40,50" fill="#a16207" />
            <polygon points="10,40 40,40 40,50 10,50" fill="#ca8a04" />
            
            <polygon points="50,40 70,25 100,25 80,40" fill="url(#gold-bar)" stroke="#ca8a04" strokeWidth="0.5" />
            <polygon points="80,40 100,25 100,35 80,50" fill="#a16207" />
            <polygon points="50,40 80,40 80,50 50,50" fill="#ca8a04" />

            {/* Top row */}
            <polygon points="30,20 50,5 80,5 60,20" fill="url(#gold-bar)" stroke="#fef08a" strokeWidth="0.5" />
            <polygon points="60,20 80,5 80,15 60,30" fill="#a16207" />
            <polygon points="30,20 60,20 60,30 30,30" fill="#ca8a04" />
          </g>

          <text x="20" y="30" fill="#38bdf8" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            THE SYNDICATE VAULT • UNDERGROUND BULLION
          </text>
        </svg>
      );

    case 'sovereign-salon':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="sovereign-sky" cx="0.5" cy="0.4" r="0.8">
              <stop offset="0%" stopColor="#083344" />
              <stop offset="60%" stopColor="#042f2e" />
              <stop offset="100%" stopColor="#021a19" />
            </radialGradient>
            <linearGradient id="cyan-glow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#sovereign-sky)" />
          {/* Gilded arches */}
          <path d="M30,180 Q30,40 90,40 Q150,40 150,180" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.6" />
          <path d="M170,180 Q170,40 230,40 Q290,40 290,180" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.6" />
          
          {/* Sovereign Royal Crown Emblem */}
          <g transform="translate(135, 65) scale(1.3)">
            <path d="M5,25 L10,8 L18,18 L26,8 L31,25 Z" fill="url(#cyan-glow)" stroke="#67e8f9" strokeWidth="1" filter="drop-shadow(0 0 10px rgba(34,211,238,0.7))" />
            <circle cx="10" cy="8" r="2" fill="#ffffff" />
            <circle cx="18" cy="18" r="2" fill="#ffffff" />
            <circle cx="26" cy="8" r="2" fill="#ffffff" />
            <rect x="5" y="27" width="26" height="5" rx="1.5" fill="#0891b2" stroke="#67e8f9" strokeWidth="1" />
          </g>

          <text x="20" y="30" fill="#22d3ee" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            SOVEREIGN DIAMOND SALON • MONACO PALACE
          </text>
        </svg>
      );

    case 'apex-reserve':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="apex-nebula" cx="0.5" cy="0.5" r="0.8">
              <stop offset="0%" stopColor="#311042" />
              <stop offset="50%" stopColor="#100b24" />
              <stop offset="100%" stopColor="#04020a" />
            </radialGradient>
            <linearGradient id="apex-line" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#apex-nebula)" />
          {/* Geodesic Sci-Fi Matrix Lines */}
          <polygon points="160,25 240,65 240,140 160,175 80,140 80,65" fill="none" stroke="url(#apex-line)" strokeWidth="1.8" opacity="0.75" />
          <polygon points="160,45 220,75 220,130 160,155 100,130 100,75" fill="none" stroke="#e2e8f0" strokeWidth="0.8" opacity="0.4" />
          <line x1="160" y1="25" x2="160" y2="175" stroke="url(#apex-line)" strokeWidth="1" opacity="0.6" />
          <line x1="80" y1="65" x2="240" y2="140" stroke="url(#apex-line)" strokeWidth="1" opacity="0.6" />
          <line x1="80" y1="140" x2="240" y2="65" stroke="url(#apex-line)" strokeWidth="1" opacity="0.6" />
          
          {/* Glowing central core */}
          <circle cx="160" cy="100" r="14" fill="#fbbf24" filter="drop-shadow(0 0 15px rgba(251,191,36,0.9))" />
          <text x="160" y="105" fill="#000000" fontSize="14" fontWeight="900" textAnchor="middle">∞</text>

          <text x="20" y="30" fill="#fbbf24" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            THE APEX WORLD RESERVE • TRILLION SANCTUM
          </text>
        </svg>
      );

    case 'chinatown-pai-gow':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="chinatown-red" cx="0.5" cy="0.5" r="0.7">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="60%" stopColor="#450a0a" />
              <stop offset="100%" stopColor="#1a0505" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#chinatown-red)" />
          {/* Paper Lanterns */}
          <ellipse cx="60" cy="35" rx="14" ry="18" fill="#ef4444" stroke="#fef08a" strokeWidth="1" filter="drop-shadow(0 0 10px #ef4444)" />
          <line x1="60" y1="0" x2="60" y2="17" stroke="#fef08a" strokeWidth="1" />
          <ellipse cx="260" cy="35" rx="14" ry="18" fill="#ef4444" stroke="#fef08a" strokeWidth="1" filter="drop-shadow(0 0 10px #ef4444)" />
          <line x1="260" y1="0" x2="260" y2="17" stroke="#fef08a" strokeWidth="1" />
          {/* Traditional Pai Gow Tiles on Mahogany Table */}
          <rect x="0" y="105" width="320" height="75" fill="#3b0704" stroke="#b91c1c" strokeWidth="1.5" />
          <g transform="translate(100, 115)">
            <rect x="0" y="0" width="22" height="42" rx="3" fill="#042f2e" stroke="#10b981" strokeWidth="1.5" />
            <circle cx="11" cy="12" r="3" fill="#ef4444" />
            <circle cx="11" cy="30" r="3" fill="#ffffff" />
            <rect x="28" y="0" width="22" height="42" rx="3" fill="#042f2e" stroke="#10b981" strokeWidth="1.5" />
            <circle cx="39" cy="10" r="3" fill="#ffffff" />
            <circle cx="39" cy="21" r="3" fill="#ef4444" />
            <circle cx="39" cy="32" r="3" fill="#ffffff" />
            <rect x="56" y="0" width="22" height="42" rx="3" fill="#042f2e" stroke="#10b981" strokeWidth="1.5" />
            <circle cx="67" cy="14" r="3" fill="#ffffff" />
            <circle cx="67" cy="28" r="3" fill="#ffffff" />
            <rect x="84" y="0" width="22" height="42" rx="3" fill="#042f2e" stroke="#10b981" strokeWidth="1.5" />
            <circle cx="95" cy="12" r="3" fill="#ef4444" />
            <circle cx="95" cy="30" r="3" fill="#ef4444" />
          </g>
          <text x="20" y="30" fill="#fca5a5" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            CHINATOWN PAI GOW • JADE SALON
          </text>
        </svg>
      );

    case 'red-dragon-sic-bo':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="sicbo-gold" cx="0.5" cy="0.4" r="0.7">
              <stop offset="0%" stopColor="#854d0e" />
              <stop offset="50%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#1a0701" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#sicbo-gold)" />
          {/* Glass & Brass Dice Tumbler Dome */}
          <ellipse cx="160" cy="120" rx="65" ry="18" fill="#ca8a04" stroke="#fef08a" strokeWidth="2" />
          <path d="M110,120 C110,50 210,50 210,120 Z" fill="#fef08a" opacity="0.3" stroke="#fef08a" strokeWidth="1.5" />
          {/* Tumbling 3 Red Dice */}
          <rect x="135" y="80" width="16" height="16" rx="2" fill="#dc2626" stroke="#f87171" strokeWidth="1" transform="rotate(15 143 88)" />
          <circle cx="143" cy="88" r="2" fill="#ffffff" />
          <rect x="165" y="75" width="16" height="16" rx="2" fill="#dc2626" stroke="#f87171" strokeWidth="1" transform="rotate(-20 173 83)" />
          <circle cx="170" cy="80" r="1.5" fill="#ffffff" />
          <circle cx="176" cy="86" r="1.5" fill="#ffffff" />
          <rect x="150" y="98" width="16" height="16" rx="2" fill="#dc2626" stroke="#f87171" strokeWidth="1" transform="rotate(40 158 106)" />
          <circle cx="158" cy="106" r="2" fill="#ffffff" />
          <text x="20" y="30" fill="#fef08a" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            RED DRAGON SIC BO • IMPERIAL TUMBLER
          </text>
        </svg>
      );

    case 'monte-carlo-chemin':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="riviera-teal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="50%" stopColor="#115e59" />
              <stop offset="100%" stopColor="#042f2e" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#riviera-teal)" />
          {/* Intricate Gold Table Felt Pattern */}
          <ellipse cx="160" cy="115" rx="140" ry="55" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.8" />
          <ellipse cx="160" cy="115" rx="90" ry="35" fill="none" stroke="#fef08a" strokeWidth="1" opacity="0.6" />
          {/* Classic Wooden Card Shoe */}
          <polygon points="120,100 170,85 200,95 150,110" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
          <polygon points="170,85 185,75 215,85 200,95" fill="#92400e" stroke="#fbbf24" strokeWidth="1" />
          <text x="20" y="30" fill="#2dd4bf" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            MONTE CARLO CHEMIN DE FER • RIVIERA
          </text>
        </svg>
      );

    case 'high-limit-craps':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="purple-craps" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="60%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#1e0538" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#purple-craps)" />
          {/* Craps Table Diamond Pattern Rubber Bumpers */}
          <path d="M0,70 L320,70" stroke="#a855f7" strokeWidth="4" />
          <path d="M10,75 L20,90 L30,75 L40,90 L50,75 L60,90 L70,75 L80,90 L90,75 L100,90" stroke="#e9d5ff" strokeWidth="1" fill="none" opacity="0.6" />
          {/* Pass Line Arc */}
          <path d="M40,170 Q160,105 280,170" fill="none" stroke="#facc15" strokeWidth="3" />
          <text x="160" y="145" fill="#facc15" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="3">PASS LINE</text>
          {/* Pair of glowing purple loaded dice */}
          <g transform="translate(130, 85)">
            <rect x="0" y="0" width="26" height="26" rx="4" fill="#9333ea" stroke="#d8b4fe" strokeWidth="1.5" transform="rotate(-15)" />
            <circle cx="10" cy="10" r="2.5" fill="#ffffff" />
            <rect x="35" y="5" width="26" height="26" rx="4" fill="#9333ea" stroke="#d8b4fe" strokeWidth="1.5" transform="rotate(25)" />
            <circle cx="48" cy="18" r="2.5" fill="#ffffff" />
          </g>
          <text x="20" y="30" fill="#c084fc" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            HIGH-LIMIT CRAPS • PLATINUM PIT
          </text>
        </svg>
      );

    case 'caribbean-stud-lounge':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="tropical-lagoon" cx="0.5" cy="0.4" r="0.8">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="50%" stopColor="#115e59" />
              <stop offset="100%" stopColor="#042f2e" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#tropical-lagoon)" />
          {/* Progressive Jackpot Digital Meter */}
          <rect x="90" y="45" width="140" height="26" rx="5" fill="#022c22" stroke="#2dd4bf" strokeWidth="2" />
          <text x="160" y="62" fill="#5eead4" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="monospace">
            JACKPOT $2.4M
          </text>
          {/* 5 Card Stud Spread */}
          <g transform="translate(70, 95)">
            <rect x="0" y="0" width="28" height="42" rx="3" fill="#f8fafc" stroke="#0d9488" strokeWidth="1" />
            <text x="14" y="26" fill="#ef4444" fontSize="14" textAnchor="middle">♥</text>
            <rect x="35" y="0" width="28" height="42" rx="3" fill="#f8fafc" stroke="#0d9488" strokeWidth="1" />
            <text x="49" y="26" fill="#000000" fontSize="14" textAnchor="middle">♠</text>
            <rect x="70" y="0" width="28" height="42" rx="3" fill="#f8fafc" stroke="#0d9488" strokeWidth="1" />
            <text x="84" y="26" fill="#ef4444" fontSize="14" textAnchor="middle">♦</text>
            <rect x="105" y="0" width="28" height="42" rx="3" fill="#f8fafc" stroke="#0d9488" strokeWidth="1" />
            <text x="119" y="26" fill="#000000" fontSize="14" textAnchor="middle">♣</text>
            <rect x="140" y="0" width="28" height="42" rx="3" fill="#f8fafc" stroke="#0d9488" strokeWidth="1" />
            <text x="154" y="26" fill="#ef4444" fontSize="14" textAnchor="middle">A♥</text>
          </g>
          <text x="20" y="30" fill="#2dd4bf" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            CARIBBEAN STUD OASIS • PROGRESSIVE
          </text>
        </svg>
      );

    case 'macau-dragon-vip':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="dragon-salon" cx="0.5" cy="0.4" r="0.7">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="60%" stopColor="#450a0a" />
              <stop offset="100%" stopColor="#1a0303" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#dragon-salon)" />
          {/* Gold Dragon Silhouette Motif */}
          <circle cx="160" cy="95" r="48" fill="none" stroke="#fbbf24" strokeWidth="3" opacity="0.8" />
          <path d="M135,95 Q160,65 185,95 Q160,125 135,95" fill="#f59e0b" opacity="0.7" />
          <circle cx="160" cy="95" r="15" fill="#dc2626" stroke="#fbbf24" strokeWidth="1.5" />
          <text x="160" y="100" fill="#fef08a" fontSize="14" fontWeight="bold" textAnchor="middle">龍</text>
          <text x="20" y="30" fill="#fde047" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            MACAU IMPERIAL DRAGON • VIP JUNKET
          </text>
        </svg>
      );

    case 'elysium-high-limit':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="elysium-gold" cx="0.5" cy="0.4" r="0.8">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#1c0c02" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#elysium-gold)" />
          {/* 24k Gold Solid Roulette Wheel */}
          <circle cx="160" cy="100" r="62" fill="#713f12" stroke="#fef08a" strokeWidth="3.5" filter="drop-shadow(0 0 20px rgba(254,240,138,0.5))" />
          <circle cx="160" cy="100" r="46" fill="#1c1917" stroke="#ca8a04" strokeWidth="2" />
          <circle cx="160" cy="100" r="18" fill="#eab308" stroke="#fef08a" strokeWidth="2" />
          <circle cx="178" cy="92" r="3.5" fill="#ffffff" filter="drop-shadow(0 0 4px #ffffff)" />
          <text x="20" y="30" fill="#fef08a" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            ELYSIUM GOLD WHEEL • 24K LIMIT
          </text>
        </svg>
      );

    case 'celestial-infinite-poker':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="galaxy-felt" cx="0.5" cy="0.5" r="0.7">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="50%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#090514" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#galaxy-felt)" />
          {/* Nebula stars */}
          <circle cx="50" cy="40" r="1.5" fill="#c7d2fe" />
          <circle cx="110" cy="70" r="1.2" fill="#ffffff" />
          <circle cx="210" cy="30" r="1.5" fill="#e0e7ff" />
          <circle cx="280" cy="65" r="1.2" fill="#ffffff" />
          {/* Golden Infinity Ring Felt */}
          <path d="M125,100 Q145,80 160,100 Q175,120 195,100 Q215,80 195,100 Q175,120 160,100 Q145,80 125,100" fill="none" stroke="#818cf8" strokeWidth="3" filter="drop-shadow(0 0 12px #818cf8)" />
          <text x="20" y="30" fill="#a5b4fc" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            CELESTIAL INFINITE HOLD'EM • UNCAPPED
          </text>
        </svg>
      );

    case 'omega-syndicate-core':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="omega-core-bg" cx="0.5" cy="0.5" r="0.8">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#omega-core-bg)" />
          {/* Quantum cyber grid */}
          <line x1="0" y1="90" x2="320" y2="90" stroke="#ec4899" strokeWidth="1" opacity="0.6" />
          <line x1="160" y1="0" x2="160" y2="180" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
          {/* Omega Symbol Hologram */}
          <circle cx="160" cy="90" r="45" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="180 30" filter="drop-shadow(0 0 18px #f43f5e)" />
          <text x="160" y="105" fill="#fb7185" fontSize="42" fontWeight="bold" textAnchor="middle">Ω</text>
          <text x="20" y="30" fill="#f43f5e" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            THE OMEGA SYNDICATE CORE • QUANTUM EMPIRE
          </text>
        </svg>
      );

    // ---------------------------------------------------------
    // FRONT BUSINESSES (LAUNDROMAT)
    // ---------------------------------------------------------
    case 'corner-carwash':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="wash-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#083344" />
              <stop offset="60%" stopColor="#0e7490" />
              <stop offset="100%" stopColor="#155e75" />
            </linearGradient>
            <radialGradient id="bubble-grad" cx="0.3" cy="0.3" r="0.7">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#wash-bg)" />
          {/* Car wash archway */}
          <path d="M40,180 L40,60 Q160,20 280,60 L280,180" fill="none" stroke="#22d3ee" strokeWidth="8" opacity="0.8" />
          {/* Rotating giant foam rollers */}
          <rect x="70" y="55" width="24" height="110" rx="6" fill="#06b6d4" opacity="0.8" stroke="#a5f3fc" strokeWidth="1.5" />
          <rect x="226" y="55" width="24" height="110" rx="6" fill="#06b6d4" opacity="0.8" stroke="#a5f3fc" strokeWidth="1.5" />
          {/* Floating soapy bubbles */}
          <circle cx="120" cy="70" r="14" fill="url(#bubble-grad)" stroke="#ffffff" strokeWidth="0.8" />
          <circle cx="180" cy="50" r="18" fill="url(#bubble-grad)" stroke="#ffffff" strokeWidth="0.8" />
          <circle cx="150" cy="110" r="10" fill="url(#bubble-grad)" stroke="#ffffff" strokeWidth="0.6" />
          <circle cx="200" cy="100" r="12" fill="url(#bubble-grad)" stroke="#ffffff" strokeWidth="0.8" />
          
          <text x="160" y="150" fill="#a5f3fc" fontSize="12" fontWeight="900" textAnchor="middle" letterSpacing="2" fontFamily="sans-serif">
            SUDS & SHINE AUTO SPA
          </text>
        </svg>
      );

    case 'retro-laundromat':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="retro-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#042f2e" />
              <stop offset="60%" stopColor="#115e59" />
              <stop offset="100%" stopColor="#134e4a" />
            </linearGradient>
            <radialGradient id="drum-water" cx="0.5" cy="0.5" r="0.6">
              <stop offset="0%" stopColor="#5eead4" stopOpacity="0.8" />
              <stop offset="80%" stopColor="#0d9488" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#115e59" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#retro-bg)" />
          {/* Industrial Washing Machines */}
          {[-70, 45, 160].map((offsetX, idx) => (
            <g key={idx} transform={`translate(${offsetX + 40}, 50)`}>
              <rect x="0" y="0" width="70" height="110" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
              <circle cx="35" cy="55" r="28" fill="url(#drum-water)" stroke="#cbd5e1" strokeWidth="4" />
              {/* Spinning dollar bill in washer */}
              <polygon points="25,50 45,45 42,60 22,65" fill="#047857" stroke="#34d399" strokeWidth="0.8" transform="rotate(25 35 55)" />
              <circle cx="35" cy="18" r="4" fill="#38bdf8" />
              <circle cx="50" cy="18" r="3" fill="#f43f5e" />
            </g>
          ))}

          <text x="20" y="32" fill="#5eead4" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            24/7 SPIN & TUMBLE • COIN LAUNDRY
          </text>
        </svg>
      );

    case 'velvet-nightclub':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="club-bg" cx="0.5" cy="0.3" r="0.8">
              <stop offset="0%" stopColor="#4a044e" />
              <stop offset="60%" stopColor="#1f0224" />
              <stop offset="100%" stopColor="#08010a" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#club-bg)" />
          {/* Laser beams */}
          <line x1="160" y1="10" x2="20" y2="180" stroke="#f43f5e" strokeWidth="2" opacity="0.8" filter="drop-shadow(0 0 6px #f43f5e)" />
          <line x1="160" y1="10" x2="100" y2="180" stroke="#a855f7" strokeWidth="2" opacity="0.8" filter="drop-shadow(0 0 6px #a855f7)" />
          <line x1="160" y1="10" x2="220" y2="180" stroke="#38bdf8" strokeWidth="2" opacity="0.8" filter="drop-shadow(0 0 6px #38bdf8)" />
          <line x1="160" y1="10" x2="300" y2="180" stroke="#ec4899" strokeWidth="2" opacity="0.8" filter="drop-shadow(0 0 6px #ec4899)" />

          {/* Champagne bucket & sparkler */}
          <g transform="translate(145, 95)">
            <polygon points="5,15 25,15 22,45 8,45" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            <rect x="10" y="0" width="10" height="20" rx="2" fill="#047857" />
            {/* Sparkler flare */}
            <circle cx="15" cy="0" r="3" fill="#fef08a" filter="drop-shadow(0 0 8px #fef08a)" />
          </g>

          <text x="20" y="32" fill="#f472b6" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            CLUB OBSIDIAN • VIP BOTTLE SERVICE
          </text>
        </svg>
      );

    case 'offshore-holding':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="cayman-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="40%" stopColor="#b45309" />
              <stop offset="80%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#cayman-sky)" />
          {/* Sun */}
          <circle cx="160" cy="80" r="28" fill="#fef08a" opacity="0.8" filter="drop-shadow(0 0 20px #f59e0b)" />
          {/* Glass Tower */}
          <polygon points="125,180 145,45 175,45 195,180" fill="#0f172a" opacity="0.85" stroke="#38bdf8" strokeWidth="1" />
          <line x1="160" y1="45" x2="160" y2="180" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
          {/* Palm tree silhouettes */}
          <path d="M40,180 Q60,110 70,80 M70,80 Q40,65 30,85 M70,80 Q65,55 85,60 M70,80 Q95,70 100,90" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          <path d="M280,180 Q260,110 250,85 M250,85 Q280,70 290,90 M250,85 Q255,60 235,65 M250,85 Q225,75 220,95" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />

          <text x="20" y="30" fill="#fef08a" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            CAYMAN APEX TRUST • OFFSHORE HOLDINGS
          </text>
        </svg>
      );

    case 'sovereign-real-estate':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="penthouse-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#030712" />
              <stop offset="60%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#penthouse-grad)" />
          {/* Ultra luxury towers */}
          <rect x="50" y="30" width="60" height="150" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" />
          <rect x="130" y="10" width="75" height="170" fill="#090d16" stroke="#93c5fd" strokeWidth="1.2" />
          <rect x="225" y="40" width="55" height="140" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" />
          {/* Helipad on central tower */}
          <ellipse cx="167" cy="20" rx="20" ry="7" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="167" y="23" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">H</text>
          
          {/* Cantilevered infinity pool */}
          <polygon points="130,70 90,75 90,90 130,85" fill="#38bdf8" opacity="0.8" stroke="#93c5fd" strokeWidth="1" />

          <text x="20" y="30" fill="#60a5fa" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            SOVEREIGN REAL ESTATE HOLDINGS
          </text>
        </svg>
      );

    case 'underground-boxing-gym':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="ring-spot" cx="0.5" cy="0.4" r="0.7">
              <stop offset="0%" stopColor="#78350f" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#090807" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#ring-spot)" />
          {/* Boxing Ring Ropes */}
          <line x1="0" y1="70" x2="320" y2="70" stroke="#dc2626" strokeWidth="4" />
          <line x1="0" y1="95" x2="320" y2="95" stroke="#ffffff" strokeWidth="4" />
          <line x1="0" y1="120" x2="320" y2="120" stroke="#2563eb" strokeWidth="4" />
          {/* Corner Post */}
          <rect x="250" y="45" width="16" height="110" rx="3" fill="#1c1917" stroke="#991b1b" strokeWidth="2" />
          {/* Pair of hanging red boxing gloves */}
          <g transform="translate(140, 75)">
            <ellipse cx="12" cy="20" rx="10" ry="14" fill="#dc2626" stroke="#f87171" strokeWidth="1.5" />
            <ellipse cx="28" cy="20" rx="10" ry="14" fill="#dc2626" stroke="#f87171" strokeWidth="1.5" />
            <line x1="12" y1="0" x2="12" y2="10" stroke="#ffffff" strokeWidth="1" />
            <line x1="28" y1="0" x2="28" y2="10" stroke="#ffffff" strokeWidth="1" />
          </g>
          <text x="20" y="30" fill="#f87171" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            UNDERGROUND BOXING GYM • CASH LAUNDERING
          </text>
        </svg>
      );

    case 'vintage-pawn-shop':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="pawn-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="50%" stopColor="#291508" />
              <stop offset="100%" stopColor="#0c0502" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#pawn-bg)" />
          {/* Three golden pawn balls */}
          <g transform="translate(130, 45)">
            <circle cx="30" cy="15" r="10" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
            <circle cx="15" cy="38" r="10" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
            <circle cx="45" cy="38" r="10" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
          </g>
          {/* Display case with antique gold watches & jewels */}
          <rect x="50" y="110" width="220" height="50" rx="4" fill="#1c1917" stroke="#78350f" strokeWidth="2" />
          <circle cx="85" cy="135" r="12" fill="#d97706" stroke="#fef08a" strokeWidth="1.5" />
          <circle cx="160" cy="135" r="14" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="230,123 240,145 220,145" fill="#10b981" stroke="#34d399" strokeWidth="1.5" />
          <text x="20" y="30" fill="#fcd34d" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            VINTAGE PAWN BROKERS • LIQUIDITY FRONT
          </text>
        </svg>
      );

    case 'harbor-shipping-corp':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="harbor-fog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#082f49" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#harbor-fog)" />
          {/* Port Gantry Crane */}
          <path d="M40,160 L70,50 L180,50" fill="none" stroke="#f59e0b" strokeWidth="3" />
          <line x1="140" y1="50" x2="140" y2="90" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Cargo Container Ship Silhouette */}
          <polygon points="120,135 290,135 270,165 140,165" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
          {/* Stacks of colorful shipping containers */}
          <rect x="150" y="115" width="25" height="18" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
          <rect x="177" y="115" width="25" height="18" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
          <rect x="204" y="115" width="25" height="18" fill="#16a34a" stroke="#15803d" strokeWidth="1" />
          <rect x="162" y="95" width="25" height="18" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
          <rect x="189" y="95" width="25" height="18" fill="#0891b2" stroke="#0e7490" strokeWidth="1" />
          <text x="20" y="30" fill="#38bdf8" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            ATLANTIC CARGO SHIPPING • GLOBAL LOGISTICS
          </text>
        </svg>
      );

    case 'swiss-private-bank':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="swiss-steel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#swiss-steel)" />
          {/* Vault Door with Swiss Cross Medallion */}
          <circle cx="160" cy="95" r="55" fill="#1e293b" stroke="#cbd5e1" strokeWidth="4" />
          <circle cx="160" cy="95" r="42" fill="#0f172a" stroke="#64748b" strokeWidth="2" strokeDasharray="8 4" />
          {/* Swiss Cross Red Shield */}
          <rect x="145" y="80" width="30" height="30" rx="4" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
          <rect x="156" y="84" width="8" height="22" fill="#ffffff" />
          <rect x="149" y="91" width="22" height="8" fill="#ffffff" />
          <text x="20" y="30" fill="#cbd5e1" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            ZURICH VAULTS PRIVATE BANK • NUMBERED ACCOUNTS
          </text>
        </svg>
      );

    case 'orbital-aerospace-corp':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="aero-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="50%" stopColor="#0c1938" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#aero-sky)" />
          {/* Curvature of planet Earth */}
          <ellipse cx="160" cy="240" rx="200" ry="90" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
          {/* Supersonic Gulfstream Jet ascending */}
          <polygon points="170,45 220,70 190,80 145,65" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1" />
          <polygon points="190,72 215,95 200,95" fill="#cbd5e1" />
          <line x1="145" y1="65" x2="50" y2="110" stroke="#38bdf8" strokeWidth="3" opacity="0.6" strokeDasharray="12 4" />
          <text x="20" y="30" fill="#7dd3fc" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            AEROAPEX GLOBAL CHARTER • SOVEREIGN JETS
          </text>
        </svg>
      );

    // ---------------------------------------------------------
    // TOURNAMENTS
    // ---------------------------------------------------------
    case 'downtown-freeroll':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="cellar-lamp" cx="0.5" cy="0.3" r="0.7">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#cellar-lamp)" />
          {/* Hanging pendant lamp cord */}
          <line x1="160" y1="0" x2="160" y2="45" stroke="#a8a29e" strokeWidth="2" />
          <polygon points="145,45 175,45 185,60 135,60" fill="#44403c" />
          <circle cx="160" cy="65" r="7" fill="#fef08a" filter="drop-shadow(0 0 15px #f59e0b)" />
          
          {/* Trophy Signet Ring */}
          <g transform="translate(145, 105)">
            <ellipse cx="15" cy="18" rx="14" ry="10" fill="none" stroke="#f59e0b" strokeWidth="4" />
            <rect x="5" y="5" width="20" height="12" rx="2" fill="#d97706" stroke="#fef08a" strokeWidth="1" />
            <text x="15" y="14" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">♠</text>
          </g>

          <text x="20" y="30" fill="#f59e0b" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            DOWNTOWN SPEAKEASY FREEROLL
          </text>
        </svg>
      );

    case 'regional-deepstack':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="emerald-arena" cx="0.5" cy="0.4" r="0.75">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="70%" stopColor="#022c22" />
              <stop offset="100%" stopColor="#01140f" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#emerald-arena)" />
          {/* Championship Poker Oval Table */}
          <ellipse cx="160" cy="115" rx="125" ry="50" fill="#047857" stroke="#10b981" strokeWidth="3" />
          <ellipse cx="160" cy="115" rx="105" ry="40" fill="#065f46" stroke="#34d399" strokeWidth="1" strokeDasharray="6 4" />
          {/* Emerald Trophy Ring */}
          <g transform="translate(145, 90)">
            <circle cx="15" cy="15" r="14" fill="none" stroke="#10b981" strokeWidth="3.5" filter="drop-shadow(0 0 8px #34d399)" />
            <polygon points="15,4 24,15 15,26 6,15" fill="#34d399" stroke="#ffffff" strokeWidth="1" />
          </g>

          <text x="20" y="30" fill="#34d399" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            EMERALD BAY DEEPSTACK CHAMPIONSHIP
          </text>
        </svg>
      );

    case 'vegas-high-roller':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="vegas-spotlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#vegas-spotlight)" />
          {/* Spotlight cones */}
          <polygon points="40,0 120,180 80,180 0,0" fill="#fef08a" opacity="0.15" />
          <polygon points="280,0 200,180 240,180 320,0" fill="#fef08a" opacity="0.15" />
          
          {/* Golden Spade Bracelet */}
          <g transform="translate(130, 85)">
            <rect x="0" y="10" width="60" height="18" rx="4" fill="#d97706" stroke="#fef08a" strokeWidth="2" filter="drop-shadow(0 0 12px rgba(245,158,11,0.8))" />
            <circle cx="30" cy="19" r="12" fill="#b45309" stroke="#fef08a" strokeWidth="1.5" />
            <text x="30" y="24" fill="#ffffff" fontSize="14" textAnchor="middle">♠</text>
          </g>

          <text x="20" y="30" fill="#f59e0b" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            VEGAS HIGH ROLLER CLASSIC • MAIN EVENT
          </text>
        </svg>
      );

    case 'monte-carlo-shr':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="monaco-yacht" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#030712" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e3a5f" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#monaco-yacht)" />
          {/* Yacht deck rail */}
          <line x1="0" y1="120" x2="320" y2="120" stroke="#f8fafc" strokeWidth="2.5" opacity="0.8" />
          <line x1="0" y1="135" x2="320" y2="135" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.6" />
          {/* Teak wooden floor */}
          <rect x="0" y="140" width="320" height="40" fill="#78350f" opacity="0.7" />
          {/* Stars */}
          <circle cx="50" cy="30" r="1.2" fill="#ffffff" />
          <circle cx="90" cy="50" r="1.5" fill="#ffffff" />
          <circle cx="210" cy="25" r="1.2" fill="#ffffff" />
          <circle cx="270" cy="40" r="1.5" fill="#ffffff" />

          {/* Platinum Championship Bracelet */}
          <g transform="translate(130, 80)">
            <rect x="0" y="10" width="60" height="18" rx="4" fill="#94a3b8" stroke="#f8fafc" strokeWidth="2" filter="drop-shadow(0 0 15px rgba(255,255,255,0.8))" />
            <circle cx="30" cy="19" r="12" fill="#475569" stroke="#ffffff" strokeWidth="1.5" />
            <text x="30" y="24" fill="#38bdf8" fontSize="13" textAnchor="middle">💎</text>
          </g>

          <text x="20" y="30" fill="#38bdf8" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            MONTE CARLO SUPER HIGH ROLLER • YACHT
          </text>
        </svg>
      );

    case 'london-mayfair-invitational':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="mayfair-wood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="50%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#090514" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#mayfair-wood)" />
          {/* Classical British Georgian Arches */}
          <path d="M40,180 L40,60 Q90,30 140,60 L140,180" fill="none" stroke="#818cf8" strokeWidth="2" opacity="0.6" />
          <path d="M180,180 L180,60 Q230,30 280,60 L280,180" fill="none" stroke="#818cf8" strokeWidth="2" opacity="0.6" />
          {/* Mayfair Sovereign Silver Trophy Cup */}
          <g transform="translate(135, 75)">
            <path d="M15,10 Q5,30 25,50 L25,60 L10,65 L40,65 L25,60 L25,50 Q45,30 35,10 Z" fill="#e2e8f0" stroke="#ffffff" strokeWidth="1.5" filter="drop-shadow(0 0 10px #c7d2fe)" />
            <circle cx="25" cy="30" r="8" fill="#818cf8" />
          </g>
          <text x="20" y="30" fill="#c7d2fe" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            MAYFAIR BILLIONAIRE INVITATIONAL • LONDON
          </text>
        </svg>
      );

    case 'macau-billionaire-bounty':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="macau-bounty" cx="0.5" cy="0.4" r="0.75">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="60%" stopColor="#022c22" />
              <stop offset="100%" stopColor="#01140e" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#macau-bounty)" />
          {/* Jade Scepter Trophy & Golden Plaques */}
          <g transform="translate(145, 65)">
            <line x1="15" y1="0" x2="15" y2="70" stroke="#10b981" strokeWidth="6" strokeLinecap="round" filter="drop-shadow(0 0 10px #34d399)" />
            <circle cx="15" cy="0" r="12" fill="#047857" stroke="#fbbf24" strokeWidth="2" />
            <polygon points="15,-6 20,4 10,4" fill="#fbbf24" />
          </g>
          <rect x="75" y="115" width="45" height="28" rx="3" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" transform="rotate(-10 97 129)" />
          <rect x="200" y="115" width="45" height="28" rx="3" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" transform="rotate(10 222 129)" />
          <text x="20" y="30" fill="#34d399" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            MACAU IMPERIAL DRAGON BOUNTY
          </text>
        </svg>
      );

    case 'dubai-royal-palace-cup':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="dubai-dusk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="40%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#1c0701" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#dubai-dusk)" />
          {/* Burj Silhouette in Center */}
          <polygon points="160,10 156,130 164,130" fill="#fbbf24" stroke="#fef08a" strokeWidth="1" filter="drop-shadow(0 0 15px #f59e0b)" />
          <polygon points="145,130 175,130 170,160 150,160" fill="#92400e" stroke="#fbbf24" strokeWidth="1" />
          {/* Royal Palace Arches */}
          <path d="M60,160 Q110,80 160,140 Q210,80 260,160" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
          <text x="20" y="30" fill="#fef08a" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            DUBAI ROYAL PALACE WORLD CUP
          </text>
        </svg>
      );

    case 'sovereign-champions-clash':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="sovereign-nebula" cx="0.5" cy="0.4" r="0.8">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="50%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#030712" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#sovereign-nebula)" />
          {/* Sovereign Illuminati Signet Ring in Space */}
          <circle cx="160" cy="95" r="48" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="12 4" filter="drop-shadow(0 0 20px #a855f7)" />
          <polygon points="160,60 185,115 135,115" fill="#facc15" stroke="#fef08a" strokeWidth="2" />
          <circle cx="160" cy="95" r="7" fill="#67e8f9" filter="drop-shadow(0 0 6px #67e8f9)" />
          <text x="20" y="30" fill="#d8b4fe" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            SOVEREIGN ILLUMINATI WORLD CLASH
          </text>
        </svg>
      );

    // ---------------------------------------------------------
    // DISTRICTS
    // ---------------------------------------------------------
    case 'downtown':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="downtown-rain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c1917" />
              <stop offset="60%" stopColor="#0c0a09" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#downtown-rain)" />
          {/* Neon sign lines */}
          <rect x="40" y="30" width="65" height="28" rx="4" fill="none" stroke="#f59e0b" strokeWidth="2" filter="drop-shadow(0 0 8px #f59e0b)" />
          <text x="72" y="48" fill="#f59e0b" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">CASINO</text>
          
          <rect x="210" y="45" width="70" height="25" rx="4" fill="none" stroke="#ef4444" strokeWidth="2" filter="drop-shadow(0 0 8px #ef4444)" />
          <text x="245" y="61" fill="#ef4444" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">BAR & DICE</text>
          
          {/* Wet asphalt reflection */}
          <ellipse cx="160" cy="150" rx="140" ry="25" fill="#292524" opacity="0.6" />

          <text x="20" y="155" fill="#f59e0b" fontSize="12" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            DOWNTOWN NEON ALLEY
          </text>
        </svg>
      );

    case 'vegas':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="vegas-night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="50%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#0c0a09" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#vegas-night)" />
          {/* Vegas Resort Pyramid */}
          <polygon points="160,20 100,150 220,150" fill="#1c1917" stroke="#fbbf24" strokeWidth="2" />
          <line x1="160" y1="20" x2="160" y2="0" stroke="#fef08a" strokeWidth="3" filter="drop-shadow(0 0 10px #fef08a)" />
          {/* Dancing fountain jets */}
          <path d="M50,150 Q65,110 80,150" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.8" />
          <path d="M240,150 Q255,110 270,150" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.8" />

          <text x="20" y="165" fill="#fbbf24" fontSize="12" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            THE LAS VEGAS STRIP
          </text>
        </svg>
      );

    case 'macau':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="macau-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="50%" stopColor="#022c22" />
              <stop offset="100%" stopColor="#06120e" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#macau-gold)" />
          {/* Golden Lotus Tower Outline */}
          <path d="M160,25 Q130,70 120,140 L200,140 Q190,70 160,25" fill="#047857" stroke="#fbbf24" strokeWidth="2" />
          <path d="M160,25 Q100,80 90,140" fill="none" stroke="#34d399" strokeWidth="1.5" />
          <path d="M160,25 Q220,80 230,140" fill="none" stroke="#34d399" strokeWidth="1.5" />
          {/* Harbor reflections */}
          <ellipse cx="160" cy="160" rx="140" ry="15" fill="#10b981" opacity="0.3" filter="blur(3px)" />

          <text x="20" y="165" fill="#34d399" fontSize="12" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            MACAU COTAI BAY • WHALE CAPITAL
          </text>
        </svg>
      );

    case 'monaco':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="monaco-harbor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#082f49" />
              <stop offset="50%" stopColor="#0c4a6e" />
              <stop offset="100%" stopColor="#031d2e" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#monaco-harbor)" />
          {/* Cliff rock of Monaco */}
          <polygon points="0,60 120,75 140,180 0,180" fill="#0f172a" opacity="0.9" />
          {/* Palace casino lights on cliff */}
          <circle cx="60" cy="65" r="2" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)" />
          <circle cx="80" cy="68" r="2" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)" />
          {/* Superyachts anchored */}
          <polygon points="160,140 230,140 220,125 180,125" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
          <polygon points="180,125 210,125 205,115 190,115" fill="#ffffff" />
          
          <text x="20" y="165" fill="#38bdf8" fontSize="12" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            MONACO YACHT HARBOR • SOVEREIGN HAVEN
          </text>
        </svg>
      );

    case 'london-mayfair':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="london-night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#london-night)" />
          {/* Big Ben Clocktower Silhouette */}
          <polygon points="240,15 255,45 255,180 225,180 225,45" fill="#1e293b" stroke="#818cf8" strokeWidth="1" />
          <circle cx="240" cy="65" r="9" fill="#fef08a" opacity="0.8" />
          {/* Victorian gas lamps */}
          <line x1="70" y1="90" x2="70" y2="160" stroke="#94a3b8" strokeWidth="2" />
          <polygon points="65,90 75,90 78,80 62,80" fill="#f59e0b" filter="drop-shadow(0 0 8px #f59e0b)" />
          <line x1="140" y1="90" x2="140" y2="160" stroke="#94a3b8" strokeWidth="2" />
          <polygon points="135,90 145,90 148,80 132,80" fill="#f59e0b" filter="drop-shadow(0 0 8px #f59e0b)" />
          <text x="20" y="165" fill="#c7d2fe" fontSize="12" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            LONDON MAYFAIR ENCLAVE • OLD MONEY
          </text>
        </svg>
      );

    case 'singapore-marina':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="sg-night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#042f2e" />
              <stop offset="50%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#021c15" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#sg-night)" />
          {/* Triple Marina Bay Towers & Skybridge */}
          <rect x="90" y="55" width="26" height="110" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
          <rect x="145" y="55" width="26" height="110" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
          <rect x="200" y="55" width="26" height="110" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
          {/* Skybridge Surfboard */}
          <path d="M75,55 Q160,35 245,55 L240,65 L80,65 Z" fill="#059669" stroke="#34d399" strokeWidth="1.5" filter="drop-shadow(0 0 10px #10b981)" />
          <text x="20" y="165" fill="#34d399" fontSize="12" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            SINGAPORE MARINA BAY • TECH SOVEREIGN
          </text>
        </svg>
      );

    case 'dubai-palm':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="dubai-gold-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#1a0701" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#dubai-gold-sky)" />
          {/* Palm Fronds Archipelago Outline */}
          <ellipse cx="160" cy="110" rx="90" ry="40" fill="none" stroke="#f59e0b" strokeWidth="2.5" opacity="0.7" />
          <line x1="160" y1="70" x2="160" y2="150" stroke="#f59e0b" strokeWidth="3" />
          <path d="M160,90 Q120,80 100,100" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <path d="M160,90 Q200,80 220,100" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <path d="M160,110 Q110,100 85,120" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <path d="M160,110 Q210,100 235,120" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <text x="20" y="165" fill="#fbbf24" fontSize="12" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            DUBAI PALM JUMEIRAH • GOLDEN HAVEN
          </text>
        </svg>
      );

    case 'sovereign-orbit':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="space-abyss" cx="0.5" cy="0.5" r="0.8">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill="url(#space-abyss)" />
          {/* Earth Horizon Curvature */}
          <ellipse cx="160" cy="270" rx="220" ry="110" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          {/* Torus Ring Space Station */}
          <ellipse cx="160" cy="70" rx="70" ry="25" fill="none" stroke="#ec4899" strokeWidth="3.5" filter="drop-shadow(0 0 15px #ec4899)" />
          <circle cx="160" cy="70" r="10" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="100" y1="70" x2="220" y2="70" stroke="#f43f5e" strokeWidth="1.5" />
          <text x="20" y="165" fill="#f43f5e" fontSize="12" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
            THE ORBITAL SOVEREIGN STATION • EXTRATERRITORIAL
          </text>
        </svg>
      );

    // ---------------------------------------------------------
    // RELICS
    // ---------------------------------------------------------
    case 'relic-gold-nugget':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="relic-box" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#1c1917" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" fill="#0a0a0c" />
          <rect x="40" y="30" width="120" height="140" rx="8" fill="url(#relic-box)" stroke="#f59e0b" strokeWidth="2.5" filter="drop-shadow(0 4px 15px rgba(245,158,11,0.4))" />
          <circle cx="100" cy="90" r="30" fill="#b45309" stroke="#fef08a" strokeWidth="2" />
          <text x="100" y="100" fill="#fef08a" fontSize="30" textAnchor="middle">♠</text>
          <text x="100" y="145" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1">1978 GOLD NUGGET</text>
        </svg>
      );

    case 'relic-loaded-dice':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect width="200" height="200" fill="#0a0a0c" />
          <g transform="translate(60, 60)">
            <rect x="0" y="0" width="75" height="75" rx="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" filter="drop-shadow(0 0 20px rgba(56,189,248,0.5))" />
            <circle cx="20" cy="20" r="6" fill="#ef4444" />
            <circle cx="55" cy="20" r="6" fill="#ef4444" />
            <circle cx="20" cy="55" r="6" fill="#ef4444" />
            <circle cx="55" cy="55" r="6" fill="#ef4444" />
            {/* Shimmering mercury weight core in center */}
            <circle cx="37" cy="37" r="10" fill="#38bdf8" opacity="0.6" filter="blur(1px)" />
          </g>
        </svg>
      );

    case 'relic-corrupt-gavel':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect width="200" height="200" fill="#0a0a0c" />
          <g transform="translate(100, 100) rotate(-35)">
            {/* Gavel head */}
            <rect x="-35" y="-50" width="70" height="25" rx="5" fill="#451a03" stroke="#f59e0b" strokeWidth="2" />
            {/* Gavel handle */}
            <rect x="-6" y="-25" width="12" height="90" rx="3" fill="#78350f" stroke="#f59e0b" strokeWidth="1.5" />
            {/* Gold wire wrapping */}
            <line x1="-6" y1="10" x2="6" y2="15" stroke="#fef08a" strokeWidth="2" />
            <line x1="-6" y1="25" x2="6" y2="30" stroke="#fef08a" strokeWidth="2" />
          </g>
        </svg>
      );

    case 'relic-swiss-ledger':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect width="200" height="200" fill="#0a0a0c" />
          <g transform="translate(45, 30)">
            <rect x="0" y="0" width="110" height="140" rx="6" fill="#18181b" stroke="#38bdf8" strokeWidth="2.5" filter="drop-shadow(0 0 15px rgba(6,182,212,0.4))" />
            <rect x="15" y="15" width="80" height="110" fill="#09090b" stroke="#27272a" strokeWidth="1" />
            {/* Cipher wheels */}
            <circle cx="55" cy="70" r="18" fill="#27272a" stroke="#38bdf8" strokeWidth="2" />
            <text x="55" y="74" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">942</text>
          </g>
        </svg>
      );

    case 'relic-royal-flush':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="gold-card-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#eab308" />
              <stop offset="80%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" fill="#0a0a0c" />
          <rect x="45" y="25" width="110" height="150" rx="8" fill="url(#gold-card-bg)" stroke="#ffffff" strokeWidth="2" filter="drop-shadow(0 0 20px rgba(234,179,8,0.7))" />
          <text x="60" y="55" fill="#000000" fontSize="24" fontWeight="900">A</text>
          <text x="60" y="75" fill="#000000" fontSize="16">♠</text>
          <text x="100" y="125" fill="#000000" fontSize="55" textAnchor="middle">♠</text>
        </svg>
      );

    case 'relic-lucky-horseshoe':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect width="200" height="200" fill="#0a0a0c" />
          {/* Diamond Encrusted Brooch */}
          <circle cx="100" cy="100" r="50" fill="#1e1b4b" stroke="#818cf8" strokeWidth="3" filter="drop-shadow(0 0 20px rgba(129,140,248,0.8))" />
          <polygon points="100,55 140,100 100,145 60,100" fill="#c7d2fe" stroke="#ffffff" strokeWidth="2" />
          <polygon points="100,65 130,100 100,135 70,100" fill="#818cf8" opacity="0.8" />
          <circle cx="100" cy="100" r="8" fill="#ffffff" filter="drop-shadow(0 0 6px #ffffff)" />
        </svg>
      );

    case 'relic-antique-chip-rack':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect width="200" height="200" fill="#0a0a0c" />
          <rect x="35" y="50" width="130" height="100" rx="6" fill="#451a03" stroke="#f59e0b" strokeWidth="2" />
          {/* Stacks of antique chips */}
          <rect x="50" y="70" width="20" height="60" rx="3" fill="#dc2626" stroke="#fef08a" strokeWidth="1" />
          <rect x="75" y="60" width="20" height="70" rx="3" fill="#2563eb" stroke="#fef08a" strokeWidth="1" />
          <rect x="100" y="55" width="20" height="75" rx="3" fill="#16a34a" stroke="#fef08a" strokeWidth="1" />
          <rect x="125" y="65" width="20" height="65" rx="3" fill="#1e293b" stroke="#fef08a" strokeWidth="1" />
        </svg>
      );

    case 'relic-federal-pardon':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect width="200" height="200" fill="#0a0a0c" />
          <rect x="45" y="30" width="110" height="140" rx="4" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
          <line x1="60" y1="50" x2="140" y2="50" stroke="#78350f" strokeWidth="2" />
          <line x1="60" y1="65" x2="135" y2="65" stroke="#78350f" strokeWidth="1.5" />
          <line x1="60" y1="80" x2="140" y2="80" stroke="#78350f" strokeWidth="1.5" />
          {/* Wax Seal */}
          <circle cx="100" cy="125" r="18" fill="#dc2626" stroke="#991b1b" strokeWidth="2" filter="drop-shadow(0 0 8px #ef4444)" />
          <polygon points="100,115 108,135 92,135" fill="#fef08a" />
        </svg>
      );

    case 'relic-platinum-watch':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect width="200" height="200" fill="#0a0a0c" />
          <circle cx="100" cy="100" r="48" fill="#18181b" stroke="#38bdf8" strokeWidth="3" filter="drop-shadow(0 0 15px #38bdf8)" />
          <circle cx="100" cy="100" r="38" fill="#09090b" stroke="#64748b" strokeWidth="1" />
          {/* Tourbillon gear */}
          <circle cx="100" cy="115" r="12" fill="#eab308" stroke="#ffffff" strokeWidth="1" />
          <line x1="100" y1="100" x2="100" y2="75" stroke="#ffffff" strokeWidth="2" />
          <line x1="100" y1="100" x2="120" y2="100" stroke="#38bdf8" strokeWidth="1.5" />
        </svg>
      );

    case 'relic-ruby-seal':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect width="200" height="200" fill="#0a0a0c" />
          {/* Ruby Gem Signet */}
          <polygon points="100,45 145,85 100,155 55,85" fill="#b91c1c" stroke="#f87171" strokeWidth="2.5" filter="drop-shadow(0 0 20px #ef4444)" />
          <polygon points="100,60 130,85 100,135 70,85" fill="#ef4444" opacity="0.8" />
          <circle cx="100" cy="85" r="8" fill="#ffffff" opacity="0.7" />
        </svg>
      );

    case 'relic-black-lotus':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect width="200" height="200" fill="#0a0a0c" />
          {/* Mystical Black Lotus Petals */}
          <g transform="translate(100, 100)">
            <path d="M0,0 Q-25,-40 0,-70 Q25,-40 0,0" fill="#4c1d95" stroke="#a855f7" strokeWidth="2" filter="drop-shadow(0 0 15px #c084fc)" />
            <path d="M0,0 Q-50,-20 -65,-45 Q-30,-50 0,0" fill="#312e81" stroke="#818cf8" strokeWidth="1.5" />
            <path d="M0,0 Q50,-20 65,-45 Q30,-50 0,0" fill="#312e81" stroke="#818cf8" strokeWidth="1.5" />
            <circle cx="0" cy="-25" r="6" fill="#facc15" filter="drop-shadow(0 0 8px #facc15)" />
          </g>
        </svg>
      );

    case 'relic-crown-jewel':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect width="200" height="200" fill="#0a0a0c" />
          {/* 95-Carat Blue Diamond */}
          <polygon points="60,65 140,65 170,95 100,165 30,95" fill="#0284c7" stroke="#38bdf8" strokeWidth="3" filter="drop-shadow(0 0 25px #38bdf8)" />
          <polygon points="75,75 125,75 145,95 100,145 55,95" fill="#38bdf8" opacity="0.6" />
          <polygon points="100,75 115,95 100,135 85,95" fill="#bae6fd" opacity="0.8" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect width="320" height="180" fill="#18181b" />
          <circle cx="160" cy="90" r="30" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
          <text x="160" y="95" fill="#a1a1aa" fontSize="12" fontWeight="bold" textAnchor="middle">
            CASINO SYNDICATE
          </text>
        </svg>
      );
  }
}
