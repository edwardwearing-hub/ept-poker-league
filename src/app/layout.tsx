import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import SidebarContent from "@/components/SidebarContent";
import MobileNav from "@/components/MobileNav";
import OfflineDetector from "@/components/OfflineDetector";
import AuthGuard from "@/components/auth/AuthGuard";
import AppMainLayout from "@/components/layout/AppMainLayout";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { getGlobalStats } from '@/lib/data';

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ['300', '400', '500', '700'],
});

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#121212",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  || 'https://ept-poker-league.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "E.P.T. 2026 Poker League",
    template: "%s | E.P.T. 2026 Poker League"
  },
  description: "The official league tracker, live leaderboard, tournament reports, and GTO Poker Academy for E.P.T. 2026.",
  openGraph: {
    title: "E.P.T. 2026 Poker League",
    description: "The official league tracker, live leaderboard, tournament reports, and GTO Poker Academy for E.P.T. 2026.",
    url: siteUrl,
    siteName: "E.P.T. 2026 Poker League",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "E.P.T. 2026 Poker League Official Championship Banner",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "E.P.T. 2026 Poker League",
    description: "The official league tracker, live leaderboard, tournament reports, and GTO Poker Academy for E.P.T. 2026.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EPT League',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stats = await getGlobalStats();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} antialiased bg-charcoal text-foreground min-h-screen`}
        suppressHydrationWarning
      >
        {/* Google Analytics 4 */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />

        {/* Offline Detection Banner (Basement / Weak Signal Resilience) */}
        <OfflineDetector />

        {/* Mobile Navigation (Visible on small screens) */}
        <MobileNav stats={stats} />

        {/* Desktop Sidebar (Visible on medium+ screens) */}
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 glass-panel border-r border-white/10 flex-col z-50">
          <SidebarContent stats={stats} />
        </aside>

        {/* Main Content Area */}
        <AuthGuard>
          <AppMainLayout>
            {children}
          </AppMainLayout>
        </AuthGuard>
      </body>
    </html>
  );
}
