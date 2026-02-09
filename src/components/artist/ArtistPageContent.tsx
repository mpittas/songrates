"use client";

import { useEffect, useState } from "react";
import SearchInput from "@/components/search/SearchInput";

import ArtistInfo from "./ArtistInfo";
import Discography from "./Discography";
import { addToHistory } from "@/lib/history";
import MySection from "@/components/ui/MySection";
import Button from "@/components/ui/Button";
import { FaArrowLeft } from "react-icons/fa";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    if (artistId && artistName) addToHistory(artistId, artistName);
  }, [artistId, artistName]);

  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100">
      <MySection className="pt-8 pb-24">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-12">
          <Button
            href="/"
            iconLeft={<FaArrowLeft size={10} />}
            variant="border"
            size="sm"
            className="self-start md:self-center"
          >
            Back
          </Button>

          <div className="w-full md:w-48">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery("")}
              placeholder="search discography..."
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              isFocused={isSearchFocused}
              size="compact"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 items-start lg:grid-cols-[150px_1fr]">
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
