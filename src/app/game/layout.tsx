import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Poker Engine & Hands Arena',
    description: 'Play live hands against the Poker AI Engine, practice preflop shoving ranges, and test heads-up decisions in the E.P.T. 2026 League.',
    openGraph: {
        title: 'Poker Engine & Hands Arena | E.P.T. 2026',
        description: 'Play live hands against the Poker AI Engine and practice preflop ranges in the E.P.T. 2026 League.',
        images: [{ url: '/ept-logo.jpg', width: 1200, height: 630, alt: 'EPT Poker Engine' }],
    },
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
