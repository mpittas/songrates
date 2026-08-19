import type { Metadata } from "next";

import StageStudy from "@/components/album-playlists/StageStudy";
import { loadAlbumPlaylistStudy } from "@/lib/loadAlbumPlaylistStudy";

export const metadata: Metadata = {
  title: "Album playlist inner — Stage",
  robots: { index: false, follow: false },
};

export default async function StagePage() {
  const { collections, source } = await loadAlbumPlaylistStudy();
  return <StageStudy collections={collections} source={source} />;
}
