import type { Metadata } from "next";
import { Space_Mono, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Providers from "@/components/Providers";
import ReactScan from "@/components/ReactScan";

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
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
        {process.env.NODE_ENV === "development" ? <ReactScan /> : null}
        {/* Providers for auth, search, etc. */}
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
