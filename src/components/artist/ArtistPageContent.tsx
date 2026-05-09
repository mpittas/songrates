"use client";

import { useEffect, useState } from "react";

import ArtistInfo from "./ArtistInfo";
import Discography from "./Discography";
import { addToHistory } from "@/lib/history";
import MySection from "@/components/ui/MySection";
import { Album, ArtistInfo as ArtistInfoType, TopSong } from "@/types/music";

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

  return (
    <main className="min-h-screen bg-[#F2EFED] text-neutral-900">
      <MySection className="pt-10 pb-28 md:pt-16 md:pb-32">
        <div className="grid grid-cols-1 gap-8 items-start lg:grid-cols-[220px_1fr] lg:gap-20">
          <div className="lg:sticky lg:top-20">
            <ArtistInfo
              artistId={artistId}
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
