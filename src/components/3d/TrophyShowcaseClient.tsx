'use client';

import dynamic from 'next/dynamic';

const TrophyShowcase = dynamic(() => import('./TrophyShowcase'), {
    ssr: false,
    loading: () => (
        <div className="h-72 w-full animate-pulse bg-neutral-900 rounded-3xl border border-white/5 flex items-center justify-center">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Loading 3D Trophy...</span>
        </div>
    )
});

export default function TrophyShowcaseClient() {
    return <TrophyShowcase />;
}
