import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SongRates",
  description: "Buiilt by SongRates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#0a0a0a]">
      <head>
        {/* Preconnect to image CDNs for faster loading */}
        <link rel="preconnect" href="https://coverartarchive.org" />
        <link rel="dns-prefetch" href="https://coverartarchive.org" />
        <link rel="preconnect" href="https://upload.wikimedia.org" />
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />
        <link rel="preconnect" href="https://commons.wikimedia.org" />
        <link rel="dns-prefetch" href="https://commons.wikimedia.org" />
      </head>
      <body className={`${manrope.variable} antialiased bg-[#0a0a0a]`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
