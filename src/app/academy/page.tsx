import React, { Suspense } from 'react';
import AcademyHub from '@/components/academy/AcademyHub';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Poker Academy & AI Trainer',
  description:
    'Master the felt with our AI Bot Scenario Trainer, Ongoing Play-Style Tracker, GTO Range Matrix, and Interactive Curriculum.',
  openGraph: {
    title: 'Poker Academy & AI Trainer | E.P.T. 2026 Poker League',
    description:
      'Master the felt with our AI Bot Scenario Trainer, Ongoing Play-Style Tracker, GTO Range Matrix, and Interactive Curriculum.',
    url: '/academy',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'EPT Poker Academy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Poker Academy & AI Trainer | E.P.T. 2026',
    description: 'Master the felt with AI Bot Scenario Trainer, GTO Range Matrix, and Interactive Curriculum.',
    images: ['/og-image.jpg'],
  },
};

export default function AcademyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AcademyHub defaultTab="arena" />
    </Suspense>
  );
}
