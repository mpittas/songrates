import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Header from "@/components/layout/Header";
import MobileTabBar from "@/components/layout/MobileTabBar";
import SiteFooter from "@/components/layout/SiteFooter";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** Display face for page, section and detail titles. */
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

/** Small uppercase labels and tabular meta. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

/** metadataBase resolves all relative OG/canonical URLs against the canonical
 *  production origin. We point it at songrates.com (the primary domain) so
 *  OpenGraph image URLs and canonical links emitted by Next.js Metadata
 *  always reference the production host regardless of which deployment
 *  alias served the page (preview, *.vercel.app, or custom domain). */
const PRODUCTION_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://songrates.com";

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCTION_ORIGIN),
  title: "songrates",
  description: "minimal music discovery",
};

export const viewport: Viewport = {
  themeColor: "#f3f1ee",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://s.ytimg.com" />
        <link rel="dns-prefetch" href="https://s.ytimg.com" />
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="preconnect" href="https://api.music.apple.com" />
        <link rel="dns-prefetch" href="https://api.music.apple.com" />
        <link rel="preconnect" href="https://is1-ssl.mzstatic.com" />
        <link rel="dns-prefetch" href="https://is1-ssl.mzstatic.com" />
      </head>
      <body
        className={`${inter.variable} ${interTight.variable} ${geistMono.variable} flex flex-col pb-app-inset antialiased`}
      >
        {/* Providers for auth, search, etc. */}
        <Providers>
          <Header />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
          <MobileTabBar />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
