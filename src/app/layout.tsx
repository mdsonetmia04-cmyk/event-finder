import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stockseason-intelligence.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "StockSeason Intelligence — Global Adobe Stock Seasonal Calendar",
    template: "%s · StockSeason Intelligence",
  },
  description:
    "Know what to create and when to upload. A global seasonal intelligence platform for Adobe Stock contributors — smart calendar, priority opportunities, market intelligence and production planning.",
  keywords: ["adobe stock", "stock contributor", "seasonal calendar", "upload planner", "microstock", "content planning"],
  authors: [{ name: "Md Sonet Mia" }],
  openGraph: {
    type: "website",
    siteName: "StockSeason Intelligence",
    title: "StockSeason Intelligence — Know What to Create. Know When to Upload.",
    description:
      "Your global seasonal intelligence system for smarter Adobe Stock content planning.",
  },
  twitter: {
    card: "summary_large_image",
    title: "StockSeason Intelligence",
    description: "Plan Smarter. Upload Earlier. Create for Global Demand.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ssi-theme');if(t==='light'){document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
