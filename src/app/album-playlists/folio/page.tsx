import type { Metadata } from "next";

import FolioStudy from "@/components/album-playlists/FolioStudy";
import { loadAlbumPlaylistStudy } from "@/lib/loadAlbumPlaylistStudy";

export const metadata: Metadata = {
  title: "Album playlist inner — Folio",
  robots: { index: false, follow: false },
};

export default async function FolioPage() {
  const { collections, source } = await loadAlbumPlaylistStudy();
  return <FolioStudy collections={collections} source={source} />;
}
