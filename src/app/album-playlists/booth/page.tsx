import type { Metadata } from "next";

import BoothStudy from "@/components/album-playlists/BoothStudy";
import { loadAlbumPlaylistStudy } from "@/lib/loadAlbumPlaylistStudy";

export const metadata: Metadata = {
  title: "Album playlists — Booth",
  robots: { index: false, follow: false },
};

export default async function BoothPage() {
  const { collections, source } = await loadAlbumPlaylistStudy();
  return <BoothStudy collections={collections} source={source} />;
}
