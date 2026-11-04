import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import AppShell from "@/components/AppShell";
import { SWRegister } from "@/components/SWRegister";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sweet-smart-calendar.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sweet Smart Calendar: Global Adobe Stock Seasonal Calendar",
    template: "%s · Sweet Smart Calendar",
  },
  description:
    "Know what to create and when to upload. A global seasonal intelligence platform for Adobe Stock contributors: smart calendar, priority opportunities, market intelligence and production planning.",
  keywords: ["adobe stock", "stock contributor", "seasonal calendar", "upload planner", "microstock", "content planning"],
  authors: [{ name: "Md Sonet Mia" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sweet Smart Calendar",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: "Sweet Smart Calendar",
    title: "Sweet Smart Calendar: Know What to Create. Know When to Upload.",
    description:
      "Your global seasonal intelligence system for smarter Adobe Stock content planning.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sweet Smart Calendar — Plan Smarter. Upload Earlier. Create for Global Demand.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sweet Smart Calendar",
    description: "Plan Smarter. Upload Earlier. Create for Global Demand.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#A66A19",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ssi-theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
        <SWRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
