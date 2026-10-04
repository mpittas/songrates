import { Suspense } from "react";

import CoverRiverHero from "@/components/home/CoverRiverHero";
import type { HeroTrack } from "@/components/hero-banners/types";
import SearchBar from "@/components/search/SearchBar";
import { artworkUrl, getTrendingSongs } from "@/lib/appleMusic/api";

export default async function HomeHero() {
  const songs = await getTrendingSongs(25);
  const seenAlbums = new Set<string>();
  const tracks: HeroTrack[] = [];

  for (const song of songs) {
    if (!song.artworkUrl || !song.albumId) continue;
    if (seenAlbums.has(song.albumId)) continue;
    seenAlbums.add(song.albumId);
    tracks.push({
      id: song.id,
      name: song.name,
      artistName: song.artistName,
      albumName: song.albumName,
      albumId: song.albumId,
      artworkUrl: artworkUrl(song.artworkUrl, 300),
    });
  }

  return (
    <CoverRiverHero
      underHeader
      tracks={tracks}
      search={
        <Suspense fallback={null}>
          <SearchBar variant="glass" />
        </Suspense>
      }
    />
  );
}
