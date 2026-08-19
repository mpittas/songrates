import type { Metadata } from "next";

import StudyIndex from "@/components/album-playlists/StudyIndex";
import { loadAlbumPlaylistStudy } from "@/lib/loadAlbumPlaylistStudy";

export const metadata: Metadata = {
  title: "Album playlist studies",
  robots: { index: false, follow: false },
};

export default async function AlbumPlaylistsIndexPage() {
  const { collections, source } = await loadAlbumPlaylistStudy();
  return <StudyIndex collections={collections} source={source} />;
}
