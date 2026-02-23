import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import SidebarContent from "@/components/SidebarContent";
import MobileNav from "@/components/MobileNav";
import { getGlobalStats } from '@/lib/data';

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  title: "E.P.T. 2026 Poker League",
  description: "The official league tracker for E.P.T. 2026",
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
        {/* Mobile Navigation (Visible on small screens) */}
        <MobileNav stats={stats} />

        {/* Desktop Sidebar (Visible on medium+ screens) */}
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 glass-panel border-r border-white/10 flex-col z-50">
          <SidebarContent stats={stats} />
        </aside>

        {/* Main Content Area */}
        {/* Added top padding for mobile to account for fixed header */}
        <main className="md:ml-72 min-h-screen p-4 pt-20 md:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-charcoal-light to-charcoal">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
