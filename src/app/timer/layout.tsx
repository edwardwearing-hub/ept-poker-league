import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tournament Blinds Clock & Structure Timer',
    description: 'Official tournament blinds clock with audio cues, customizable level structures, and live chip value denominations for the E.P.T. 2026 Poker League.',
    openGraph: {
        title: 'Tournament Blinds Clock | E.P.T. 2026 Poker League',
        description: 'Official tournament blinds clock with audio cues and customizable level structures.',
        images: [{ url: '/ept-logo.jpg', width: 1200, height: 630, alt: 'EPT Blinds Timer' }],
    },
};

export default function TimerLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
