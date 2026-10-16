import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Casino Syndicate RPG | The Felt Empire',
    description: 'Build your underground poker empire, hire legendary loan sharks, run speakeasies, and generate passive chip flow in the E.P.T. 2026 Syndicate RPG.',
    openGraph: {
        title: 'Casino Syndicate RPG | E.P.T. 2026',
        description: 'Build your underground poker empire and generate passive chip flow in the E.P.T. 2026 Syndicate RPG.',
        images: [{ url: '/ept-logo.jpg', width: 1200, height: 630, alt: 'EPT Casino Syndicate RPG' }],
    },
};

export default function SyndicateLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
