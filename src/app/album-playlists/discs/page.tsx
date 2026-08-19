import type { Metadata } from "next";

import DiscsStudy from "@/components/album-playlists/DiscsStudy";
import { loadAlbumPlaylistStudy } from "@/lib/loadAlbumPlaylistStudy";

export const metadata: Metadata = {
  title: "Album playlist inner — Discs",
  robots: { index: false, follow: false },
};

export default async function DiscsPage() {
  const { collections, source } = await loadAlbumPlaylistStudy();
  return <DiscsStudy collections={collections} source={source} />;
}
