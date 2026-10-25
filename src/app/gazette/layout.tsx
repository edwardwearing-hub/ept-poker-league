import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'The Gazette | Tournament Recaps & News',
    description: 'Exclusive episode recaps, dramatic hands, player interviews, and high-stakes storylines from The E.P.T. 2026 Poker League.',
    openGraph: {
        title: 'The Gazette | E.P.T. 2026 Poker League',
        description: 'Exclusive episode recaps, dramatic hands, and high-stakes storylines from The E.P.T. 2026 Poker League.',
        url: '/gazette',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'The EPT Gazette' }],
    },
};

export default function GazetteLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
