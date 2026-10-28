'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import SiteFooter from '@/components/SiteFooter';
import { DevModeDock } from '@/components/dev/DevWrapper';

interface Props {
  children: React.ReactNode;
}

export default function AppMainLayout({ children }: Props) {
  const pathname = usePathname();
  // Check if current route is an active E.P.T. game route (Casino / Academy / Sportsbook)
  const isGameRoute =
    pathname?.startsWith('/vegas') ||
    pathname?.startsWith('/academy') ||
    pathname?.startsWith('/arcade');

  return (
    <main
      className={`md:ml-72 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-charcoal-light to-charcoal ${
        isGameRoute
          ? 'p-0 pt-[58px] pb-[58px] md:p-8 md:pb-8'
          : 'px-3 py-4 pt-16 sm:px-6 sm:py-6 sm:pt-20 md:p-8 pb-28 md:pb-8'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
      {!isGameRoute ? (
        <SiteFooter />
      ) : (
        <div className="hidden md:block">
          <SiteFooter />
        </div>
      )}
      <DevModeDock />
    </main>
  );
}
