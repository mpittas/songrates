import type { Metadata } from "next";

import ShelvesStudy from "@/components/album-playlists/ShelvesStudy";
import { loadAlbumPlaylistStudy } from "@/lib/loadAlbumPlaylistStudy";

export const metadata: Metadata = {
  title: "Album playlists — Shelves",
  robots: { index: false, follow: false },
};

export default async function ShelvesPage() {
  const { collections, source } = await loadAlbumPlaylistStudy();
  return <ShelvesStudy collections={collections} source={source} />;
}
