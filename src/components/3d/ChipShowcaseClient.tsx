'use client';

import dynamic from 'next/dynamic';

const ChipShowcase = dynamic(() => import('./ChipShowcase'), {
    ssr: false,
    loading: () => (
        <div className="h-64 w-full animate-pulse bg-neutral-900 rounded-3xl border border-white/5 flex items-center justify-center">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Loading 3D Ceramic Chips...</span>
        </div>
    )
});

export default function ChipShowcaseClient() {
    return <ChipShowcase />;
}
