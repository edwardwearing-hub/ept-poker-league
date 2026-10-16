'use client';

import React from 'react';
import VegasFeltSilkscreen from './VegasFeltSilkscreen';

interface Props {
  children: React.ReactNode;
  gameType?: 'blackjack' | 'baccarat' | 'holdem' | 'craps' | 'roulette' | 'paigow' | 'generic';
  tableFeltImage?: string; // Optional photographic or 3D rendered table felt
  watermarkTitle?: string;
  watermarkSubtitle?: string;
  showShoe?: boolean;
  showChipTray?: boolean;
  showDiscardRack?: boolean;
  shoeCardsRemaining?: number;
  className?: string;
}

export default function Vegas3DTableArena({
  children,
  gameType = 'blackjack',
  tableFeltImage,
  watermarkTitle = 'LAS VEGAS STRIP',
  watermarkSubtitle = 'BLACKJACK PAYS 3 TO 2 • DEALER MUST STAND ON 17',
  showShoe = true,
  showChipTray = true,
  showDiscardRack = true,
  shoeCardsRemaining = 184,
  className = '',
}: Props) {
  // Felt background color theme based on game - vibrant, luminous casino felts
  const feltThemeClasses = {
    blackjack: 'from-[#0e823b] via-[#0a6a2f] to-[#054b20]',
    baccarat: 'from-[#831843] via-[#5b0829] to-[#280412]',
    holdem: 'from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a]',
    craps: 'from-[#0e823b] via-[#0a6a2f] to-[#054b20]',
    roulette: 'from-[#0e853e] via-[#0a6e33] to-[#054e23]',
    paigow: 'from-[#0f766e] via-[#115e59] to-[#042f2e]',
    generic: 'from-[#0e823b] via-[#0a6a2f] to-[#054b20]',
  }[gameType];

  return (
    <div
      className={`relative w-full rounded-[2.5rem] bg-black p-2 sm:p-4 select-none overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] antialiased [text-rendering:optimizeLegibility] ${className}`}
    >
      {/* 3D Curved Casino Table Assembly (Crisp High-DPI Perspective) */}
      <div className="relative w-full rounded-[2.2rem] flex flex-col justify-between">
        {/* LAYER 1: OUTER PADDED LEATHER ARMREST RAIL (Beveled & Stitched Cushion) */}
        <div className="relative w-full rounded-[2.2rem] p-3 sm:p-5 bg-gradient-to-b from-[#202024] via-[#0d0d10] to-[#1c1c20] border-4 border-[#2e2e34] shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_3px_6px_rgba(255,255,255,0.22),inset_0_-8px_16px_rgba(0,0,0,0.9)]">
          {/* Double Stitching Detail */}
          <div className="absolute inset-2 sm:inset-3 rounded-[1.8rem] border border-dashed border-amber-600/35 pointer-events-none" />

          {/* LAYER 2: MAHOGANY WOOD RACETRACK INLAY */}
          <div className="relative w-full rounded-[1.8rem] p-2 sm:p-3 bg-gradient-to-b from-[#34160a] via-[#481c10] to-[#1e0b04] border-2 border-[#5c2415] shadow-[inset_0_4px_12px_rgba(0,0,0,0.85),0_2px_4px_rgba(255,255,255,0.12)]">
            {/* Brass Cup Holder Insets (Left & Right Racetrack) */}
            <div className="hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#ffd700] via-[#99771a] to-[#3a2803] border-2 border-gold/70 shadow-[inset_0_2px_6px_rgba(0,0,0,0.85),0_0_12px_rgba(212,175,55,0.3)]" />
            <div className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#ffd700] via-[#99771a] to-[#3a2803] border-2 border-gold/70 shadow-[inset_0_2px_6px_rgba(0,0,0,0.85),0_0_12px_rgba(212,175,55,0.3)]" />

            {/* LAYER 3: THE FELT TABLE BED */}
            <div
              className={`relative w-full rounded-[1.5rem] min-h-[460px] sm:min-h-[500px] border-2 border-gold/50 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col justify-between p-4 sm:p-6 ${
                tableFeltImage ? 'bg-cover bg-center' : `bg-gradient-to-b ${feltThemeClasses}`
              }`}
              style={
                tableFeltImage
                  ? {
                      backgroundImage: `radial-gradient(circle at 50% 30%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%), url('${tableFeltImage}')`,
                    }
                  : undefined
              }
            >
              {/* Overhead Spotlight Beam Cone */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse 65% 55% at 50% 25%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 55%, transparent 75%)',
                }}
              />

              {/* Realistic Felt Micro-Texture Grain */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: `radial-gradient(rgba(255,255,255,0.2) 1px, transparent 0)`,
                  backgroundSize: '4px 4px',
                }}
              />

              {/* Crisp E.P.T. Custom Felt Watermark (Logo + Silkscreen) */}
              {!tableFeltImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                  <div className="flex flex-col items-center opacity-20 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-gold/70 p-1 bg-black/40 backdrop-blur-[1px] shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center overflow-hidden">
                      <img
                        src="/ept-logo.jpg"
                        alt="EPT Poker League Felt Watermark"
                        className="w-full h-full object-contain filter brightness-125 contrast-125"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-[10px] sm:text-xs font-serif font-black tracking-[0.25em] text-gold uppercase">
                        ★ {watermarkTitle} ★
                      </span>
                      <div className="text-[8px] font-mono tracking-widest text-emerald-100 uppercase mt-0.5">
                        {watermarkSubtitle}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Authentic Casino Silkscreen Line Markings (Insurance arc, betting spots, card frames) */}
              <VegasFeltSilkscreen gameType={gameType} />

              {/* 3D ACCESSORY PROPS: TOP DEALER RAIL (Shoe, Sarah The Dealer, Chip Tray, Discard) */}
              <div className="relative z-10 w-full flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                {/* 3D Brass Discard Rack (Top-Left) */}
                {showDiscardRack ? (
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#2a2415] to-[#15120a] border border-gold/50 px-2.5 py-1 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.25)]">
                    <div className="w-4 h-6 rounded-sm bg-gradient-to-b from-[#ffd700] to-[#b38f00] border border-gold/80 shadow-sm flex items-center justify-center text-[8px] font-black text-black">
                      🗄️
                    </div>
                    <div className="text-[10px] font-mono font-black text-amber-300 uppercase tracking-wider">
                      Discard
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* Sarah The Live Dealer Peeking Over The Table Rail (Center) */}
                <div className="flex flex-col items-center -mt-6 sm:-mt-8">
                  <div className="relative">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-t-full rounded-b-xl border-2 border-gold/80 overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.7)] bg-black">
                      <img
                        src="/vegas/dealer_sarah.jpg"
                        alt="Sarah Head Dealer"
                        className="w-full h-full object-cover object-top scale-115 -translate-y-0.5"
                      />
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[7px] font-black uppercase tracking-wider border border-white/60 shadow flex items-center gap-0.5 whitespace-nowrap">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      <span>SARAH</span>
                    </span>
                  </div>

                  {/* 3D Chrome Dealer Chip Tray */}
                  {showChipTray && (
                    <div className="mt-1 flex items-center gap-1 sm:gap-2 px-2.5 py-1 rounded-xl bg-gradient-to-b from-zinc-700 via-zinc-900 to-black border-2 border-zinc-500 shadow-[inset_0_2px_6px_rgba(255,255,255,0.35),0_6px_16px_rgba(0,0,0,0.9)]">
                      {[
                        { bg: 'bg-red-600', val: '£5' },
                        { bg: 'bg-blue-600', val: '£10' },
                        { bg: 'bg-emerald-600', val: '£25' },
                        { bg: 'bg-amber-500', val: '£50' },
                        { bg: 'bg-zinc-900 border border-white/40', val: '£100' },
                        { bg: 'bg-purple-600', val: '£500' },
                      ].map((col, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-0.5 bg-black/70 p-0.5 rounded-lg border border-white/15"
                          title={`Dealer Reserve ${col.val}`}
                        >
                          <div className="flex -space-y-2 flex-col">
                            <div className={`w-3 h-1.5 rounded-full ${col.bg} shadow-sm`} />
                            <div className={`w-3 h-1.5 rounded-full ${col.bg} shadow-sm`} />
                          </div>
                          <span className="text-[7px] sm:text-[8px] font-mono text-zinc-200 font-black">
                            {col.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3D Acrylic Card Shoe (Top-Right) */}
                {showShoe ? (
                  <div className="flex items-center gap-2 bg-gradient-to-l from-white/15 to-black/70 backdrop-blur-md border border-white/30 px-3 py-1.5 rounded-2xl shadow-[0_6px_16px_rgba(0,0,0,0.8),inset_0_1px_3px_rgba(255,255,255,0.4)]">
                    <div className="flex flex-col items-end">
                      <div className="text-[10px] font-mono uppercase font-black text-white flex items-center gap-1">
                        <span>4-Deck Shoe</span>
                      </div>
                      <div className="text-xs font-mono font-black text-gold">
                        {shoeCardsRemaining} Cards
                      </div>
                    </div>
                    {/* Visual 3D acrylic shoe deck preview */}
                    <div className="relative w-6 h-8 rounded-sm bg-gradient-to-tr from-blue-900 to-indigo-700 border border-white/40 shadow-inner flex items-center justify-center">
                      <div className="w-1.5 h-6 bg-black/40 rounded-full" />
                    </div>
                  </div>
                ) : (
                  <div />
                )}
              </div>

              {/* Children (Game Specific Cards, Bets, Dice, Wheels, etc.) */}
              <div className="relative z-10 flex-1 flex flex-col justify-between py-2">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
