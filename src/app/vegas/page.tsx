import React, { Suspense } from 'react';
import VegasLobby from '@/components/vegas/VegasLobby';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vegas Casino Classics & Tutorials',
  description:
    'Play 8 authentic Las Vegas casino felt games with your Academy bankroll. Features interactive tutorials, authentic felt layouts, and zero-risk practice across Blackjack, Slots, Craps, Roulette, Baccarat, Video Poker, Sportsbook, and Pai Gow.',
  openGraph: {
    title: 'Vegas Casino Classics & Tutorials | E.P.T. 2026 Poker League',
    description:
      'Play 8 authentic Las Vegas casino felt games with your Academy bankroll across Blackjack, Slots, Craps, Roulette, Baccarat, Video Poker, Sportsbook, and Pai Gow.',
    images: [{ url: '/ept-logo.jpg', width: 1200, height: 630, alt: 'EPT Vegas Casino' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vegas Casino Classics & Tutorials | E.P.T. 2026',
    description: 'Play 8 authentic Las Vegas casino felt games with zero-risk practice.',
  },
};

export default function VegasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <VegasLobby />
    </Suspense>
  );
}
