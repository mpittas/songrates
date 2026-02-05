import type { Metadata } from "next";
import { Space_Mono, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Providers from "@/components/Providers";

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "songrates",
  description: "minimal music discovery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#050507]">
      <head>
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://s.ytimg.com" />
        <link rel="dns-prefetch" href="https://s.ytimg.com" />
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="preconnect" href="https://coverartarchive.org" />
        <link rel="dns-prefetch" href="https://coverartarchive.org" />
        <link rel="preconnect" href="https://upload.wikimedia.org" />
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />
        <link rel="preconnect" href="https://commons.wikimedia.org" />
        <link rel="dns-prefetch" href="https://commons.wikimedia.org" />
      </head>
      <body
        className={`${inter.variable} ${spaceMono.variable} antialiased bg-[#050507]`}
      >
        {/* Providers for auth, search, etc. */}
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
