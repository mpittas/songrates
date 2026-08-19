import type { Metadata } from "next";
import {
  Anek_Latin,
  Anybody,
  Big_Shoulders,
  Bricolage_Grotesque,
  Gloock,
  Red_Hat_Display,
} from "next/font/google";

import StudyNav from "@/components/album-playlists/StudyNav";

import "./album-playlists.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-ap-bricolage",
});

const shoulders = Big_Shoulders({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-ap-shoulders",
  adjustFontFallback: false,
});

const redHat = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-ap-redhat",
});

const anybody = Anybody({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-ap-anybody",
});

const gloock = Gloock({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-ap-gloock",
});

const anek = Anek_Latin({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-ap-anek",
});

export const metadata: Metadata = {
  title: "Album playlist studies",
  description: "Layout directions for album playlist list and inner pages.",
  robots: { index: false, follow: false },
};

export default function AlbumPlaylistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${bricolage.variable} ${shoulders.variable} ${redHat.variable} ${anybody.variable} ${gloock.variable} ${anek.variable}`}
    >
      <StudyNav />
      {children}
    </div>
  );
}
