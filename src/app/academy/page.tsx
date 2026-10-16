import React from 'react';
import AcademyHub from '@/components/academy/AcademyHub';

export const metadata = {
  title: 'Poker Academy & AI Trainer | E.P.T 2026',
  description:
    'Master the felt with our AI Bot Scenario Trainer, Ongoing Play-Style Tracker, GTO Range Matrix, and Interactive Curriculum.',
};

export default function AcademyPage() {
  return <AcademyHub defaultTab="arena" />;
}
