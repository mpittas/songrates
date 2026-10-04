"use client";

import { useEffect, useMemo } from "react";

import Discography from "./Discography";
import ArtistPageHeader from "./ArtistPageHeader";
import ArtworkColorWash from "@/components/layout/ArtworkColorWash";
import { addToHistory } from "@/lib/history";
import { usePlayerCore } from "@/context/PlayerContext";
import { topSongsToTrackQueue } from "@/lib/topSongsQueue";
import { artistPlaybackSource } from "@/lib/playbackSource";
import {
  Album,
  ArtistInfo as ArtistInfoType,
  TopSong,
} from "@/types/music";
import { cn } from "@/lib/utils";
import { PAGE_CONTAINER } from "@/lib/pageLayout";

interface ArtistPageContentProps {
  artistId: string;
  artistName: string;
  artistInfo: ArtistInfoType;
  topSongs: TopSong[];
  latestSongs: TopSong[];
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
  latestSongs,
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
    <main className="relative min-h-screen pb-12 text-ink">
      <ArtworkColorWash src={artistInfo.image || "/vinyl-placeholder.svg"} />

      <div className={cn("relative z-10", PAGE_CONTAINER, "pt-8 sm:pt-12")}>
        <ArtistPageHeader
          artistId={artistId}
          artistName={artistName}
          artistInfo={artistInfo}
          topSongsQueue={topSongsQueue}
          onPlayTopSongs={() =>
            playTrack(
              topSongsQueue[0],
              topSongsQueue,
              artistPlaybackSource(artistId, artistName),
            )
          }
        />

        <div className="mt-12 sm:mt-16">
          <Discography
            topSongs={topSongs}
            latestSongs={latestSongs}
            essentialAlbums={essentialAlbums}
            albums={albums}
            epsAndSingles={epsAndSingles}
            appearsOn={appearsOn}
          />
        </div>
      </div>
    </main>
  );
}
