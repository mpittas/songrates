"use client";

import { useEffect, useMemo, useState } from "react";

import ArtistInfo from "./ArtistInfo";
import Discography from "./Discography";
import { addToHistory } from "@/lib/history";
import MySection from "@/components/ui/MySection";
import Button from "@/components/ui/Button";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { usePlayerCore } from "@/context/PlayerContext";
import { Album, ArtistInfo as ArtistInfoType, TopSong, Track } from "@/types/music";
import { FaArrowLeft, FaPlay } from "react-icons/fa";
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
  const [searchQuery] = useState("");

  useEffect(() => {
    if (artistId && artistName) addToHistory(artistId, artistName);
  }, [artistId, artistName]);

  const { playTrack } = usePlayerCore();

  const topSongsQueue = useMemo((): Track[] => {
    return topSongs.map((s) => ({
      id: s.id,
      title: s.name,
      artistName: s.artistName,
      artistId: s.artistId,
      albumId: s.albumId,
      albumImageUrl: s.artworkUrl,
      albumTitle: s.albumName,
      releaseDate: s.releaseDate,
      length: s.durationMs,
      artists:
        s.artistId && s.artistName
          ? [{ id: s.artistId, name: s.artistName }]
          : undefined,
    }));
  }, [topSongs]);

  return (
    <main className="min-h-screen text-neutral-900">
      <MySection className={cn(PAGE_CONTENT_TOP, "pb-28 md:pb-32")}>
        <div className="absolute left-0 top-0 z-0 h-[500px] w-full bg-linear-to-b from-[#f0e5df] to-[#f0e5df]/0" />
      
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 relative z-10 ">
          <Button
            href="/"
            variant="secondary"
            size="xs"
            iconLeft={<FaArrowLeft size={14} className="mr-2" />}
          >
            BACK TO HOME
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <FavoriteButton
              itemId={artistId}
              itemType="artist"
              itemName={artistName}
              thumbnailUrl={artistInfo.image || undefined}
              variant="secondary"
              buttonSize="xs"
            />
            {topSongsQueue.length > 0 && (
              <Button
                variant="secondary"
                size="xs"
                iconLeft={<FaPlay size={12} className="mr-2" />}
                onClick={() => playTrack(topSongsQueue[0], topSongsQueue)}
              >
                PLAY TOP SONGS
              </Button>
            )}
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-8 items-start lg:grid-cols-[220px_1fr] lg:gap-20">
          <div className="lg:sticky lg:top-20">
            <ArtistInfo
              artistName={artistName}
              data={artistInfo}
              className="w-full"
            />
          </div>

          <div className="min-w-0">
            <Discography
              artistId={artistId}
              artistName={artistName}
              topSongs={topSongs}
              essentialAlbums={essentialAlbums}
              albums={albums}
              epsAndSingles={epsAndSingles}
              appearsOn={appearsOn}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </MySection>
    </main>
  );
}
