import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'The Arcade | Retro Poker Minigames',
    description: 'Play retro poker minigames including Higher or Lower, Hand Matcher, River Roulette, and Casino Syndicate RPG in the E.P.T. 2026 Arcade.',
    openGraph: {
        title: 'The Arcade | E.P.T. 2026 Poker League',
        description: 'Play retro poker minigames and practice your card reading in the E.P.T. 2026 Arcade.',
        url: '/arcade',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'EPT Arcade' }],
    },
};

export default function ArcadeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
