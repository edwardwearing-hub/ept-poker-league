import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Console',
    description: 'E.P.T. 2026 League Administrator Console',
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
