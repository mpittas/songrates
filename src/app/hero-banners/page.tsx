import type { Metadata } from "next";
import {
  Barlow_Condensed,
  Big_Shoulders,
  Bricolage_Grotesque,
  Red_Hat_Display,
} from "next/font/google";

import { artworkUrl, getTrendingSongs } from "@/lib/appleMusic/api";
import GalleryNav from "@/components/hero-banners/GalleryNav";
import HeroCatalogBloom from "@/components/hero-banners/HeroCatalogBloom";
import HeroCoverRiver from "@/components/hero-banners/HeroCoverRiver";
import HeroCutDivide from "@/components/hero-banners/HeroCutDivide";
import HeroRatingStack from "@/components/hero-banners/HeroRatingStack";
import HeroSleeveDisc from "@/components/hero-banners/HeroSleeveDisc";
import StudyCaption from "@/components/hero-banners/StudyCaption";
import type { HeroTrack } from "@/components/hero-banners/types";

import "./hero-banners.css";

const redHat = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-red-hat",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-bricolage",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-barlow",
});

const shoulders = Big_Shoulders({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-shoulders",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Hero banners",
  description: "Five homepage hero directions for songrates.",
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

export default async function HeroBannersPage() {
  const songs = await getTrendingSongs(25);
  const tracks: HeroTrack[] = songs
    .filter((song) => Boolean(song.artworkUrl))
    .map((song) => ({
      id: song.id,
      name: song.name,
      artistName: song.artistName,
      albumName: song.albumName,
      albumId: song.albumId,
      artworkUrl: artworkUrl(song.artworkUrl, 400),
    }));

  const mosaicTracks: HeroTrack[] = songs
    .filter((song) => Boolean(song.artworkUrl))
    .map((song) => ({
      id: song.id,
      name: song.name,
      artistName: song.artistName,
      albumName: song.albumName,
      albumId: song.albumId,
      artworkUrl: artworkUrl(song.artworkUrl, 200),
    }));

  const featured = tracks[0];
  const splitFeatured = tracks[4] ?? tracks[0];

  return (
    <main
      className={`${redHat.variable} ${bricolage.variable} ${barlow.variable} ${shoulders.variable} bg-[#161616]`}
    >
      <GalleryNav />

      <HeroCatalogBloom tracks={mosaicTracks} />
      <StudyCaption
        name="Catalog Bloom"
        structure="Centered search over a fading chart mosaic — the catalog is the atmosphere."
        inspiredBy={{
          label: "Deezer, Full-range catalog",
          href: "https://mobbin.com/sites/sections/43e8a788-819a-4ac6-b890-d7ca354fe598",
        }}
      />

      <HeroSleeveDisc track={featured} />
      <StudyCaption
        name="Sleeve & Disc"
        structure="Gallery split with a physical vinyl object — one record on the counter."
        inspiredBy={{
          label: "A24 shop, Midsommar soundtrack",
          href: "https://mobbin.com/sites/sections/a700ac55-96c3-4cca-a960-19b8c61b735d",
        }}
      />

      <HeroRatingStack tracks={tracks} />
      <StudyCaption
        name="Listening Stack"
        structure="Dark split with overlapping rate-cards — the 1–10 scale is the product."
        inspiredBy={{
          label: "TIDAL, Hear every note",
          href: "https://mobbin.com/sites/sections/76144bfd-525e-4236-a3b1-89389c455e62",
        }}
      />

      <HeroCutDivide track={splitFeatured} />
      <StudyCaption
        name="Cut Divide"
        structure="Diagonal artwork / copy split — one accented verb, one action."
        inspiredBy={{
          label: "TIDAL, Anytime. Anywhere.",
          href: "https://mobbin.com/sites/sections/42591592-6610-411a-9950-98e5294b6cf4",
        }}
      />

      <HeroCoverRiver tracks={mosaicTracks} />
      <StudyCaption
        name="Cover River"
        structure="Two opposing album marquees with a search island in the quiet middle."
        inspiredBy={{
          label: "Flim, Find your influences",
          href: "https://mobbin.com/sites/sections/9e7e811e-bd9f-4901-a54d-ece37ad5a5f1",
        }}
      />
    </main>
  );
}
