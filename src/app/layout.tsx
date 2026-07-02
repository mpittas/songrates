import type { Metadata } from "next";
import { Space_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Providers from "@/components/Providers";

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      <body className={`${inter.variable} ${spaceMono.variable} antialiased`}>
        {/* Providers for auth, search, etc. */}
        <Providers>
          <Header />
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
