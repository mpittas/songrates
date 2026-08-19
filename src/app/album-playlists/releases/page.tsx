import type { Metadata } from "next";

import ReleasesStudy from "@/components/album-playlists/ReleasesStudy";
import { loadAlbumPlaylistStudy } from "@/lib/loadAlbumPlaylistStudy";

export const metadata: Metadata = {
  title: "Album playlists — Releases",
  robots: { index: false, follow: false },
};

export default async function ReleasesPage() {
  const { collections, source } = await loadAlbumPlaylistStudy();
  return <ReleasesStudy collections={collections} source={source} />;
}
