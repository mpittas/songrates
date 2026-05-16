"use client";

import { useEffect, useMemo } from "react";

import ArtistInfo from "./ArtistInfo";
import Discography from "./Discography";
import ArtistPageHeader from "./ArtistPageHeader";
import { addToHistory } from "@/lib/history";
import MySection from "@/components/ui/MySection";
import { usePlayerCore } from "@/context/PlayerContext";
import { topSongsToTrackQueue } from "@/lib/topSongsQueue";
import {
  Album,
  ArtistInfo as ArtistInfoType,
  TopSong,
} from "@/types/music";
import { cn } from "@/lib/utils";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";

interface ArtistPageContentProps {
  artistId: string;
  artistName: string;
  artistInfo: ArtistInfoType;
  topSongs: TopSong[];
  essentialAlbums: Album[];
  albums: Album[];
  epsAndSingles: Album[];
  appearsOn: Album[];
}

export default function ArtistPageContent({
  artistId,
  artistName,
  artistInfo,
  topSongs,
  essentialAlbums,
  albums,
  epsAndSingles,
  appearsOn,
}: ArtistPageContentProps) {
  useEffect(() => {
    if (artistId && artistName) addToHistory(artistId, artistName);
  }, [artistId, artistName]);

  const { playTrack } = usePlayerCore();

  const topSongsQueue = useMemo(
    () => topSongsToTrackQueue(topSongs),
    [topSongs],
  );

  return (
    <main className="min-h-screen text-neutral-900">
      <MySection className={cn(PAGE_CONTENT_TOP, "pb-28 md:pb-32")}>
        <div className="absolute left-0 top-0 z-0 h-[500px] w-full bg-linear-to-b from-[#f0e5df] to-[#f0e5df]/0" />

        <ArtistPageHeader
          artistId={artistId}
          artistName={artistName}
          artistInfo={artistInfo}
          topSongsQueue={topSongsQueue}
          onPlayTopSongs={() => playTrack(topSongsQueue[0], topSongsQueue)}
        />

        <div className="relative z-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[220px_1fr] lg:gap-20">
          <div className="lg:sticky lg:top-20">
            <ArtistInfo
              artistName={artistName}
              data={artistInfo}
              className="w-full"
            />
          </div>

          <div className="min-w-0">
            <Discography
              topSongs={topSongs}
              essentialAlbums={essentialAlbums}
              albums={albums}
              epsAndSingles={epsAndSingles}
              appearsOn={appearsOn}
            />
          </div>
        </div>
      </MySection>
    </main>
  );
}
