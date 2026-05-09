"use client";

import { useMemo } from "react";
import { IoDiscOutline } from "react-icons/io5";
import { LuStar, LuListMusic, LuDiscAlbum, LuUsersRound } from "react-icons/lu";
import ArtistAccordion from "./ArtistAccordion";
import TopSongsList from "./TopSongsList";
import ArtistAlbumGridSection from "./ArtistAlbumGridSection";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import {
  filterAndAnnotateAlbums,
  filterTopSongsByQuery,
} from "@/lib/discographyFilters";
import type { Album, TopSong } from "@/types/music";

interface DiscographyProps {
  topSongs: TopSong[];
  essentialAlbums: Album[];
  albums: Album[];
  epsAndSingles: Album[];
  appearsOn: Album[];
  /** Optional filter (e.g. future search UI). */
  searchQuery?: string;
}

export default function Discography({
  topSongs,
  essentialAlbums,
  albums,
  epsAndSingles,
  appearsOn,
  searchQuery,
}: DiscographyProps) {
  const { getAlbumRating } = useRatings();

  const filteredTopSongs = useMemo(
    () => filterTopSongsByQuery(topSongs, searchQuery),
    [topSongs, searchQuery],
  );

  const filteredEssential = useMemo(
    () => filterAndAnnotateAlbums(essentialAlbums, searchQuery, getAlbumRating),
    [essentialAlbums, searchQuery, getAlbumRating],
  );

  const filteredAlbums = useMemo(
    () => filterAndAnnotateAlbums(albums, searchQuery, getAlbumRating),
    [albums, searchQuery, getAlbumRating],
  );

  const filteredEpsAndSingles = useMemo(
    () => filterAndAnnotateAlbums(epsAndSingles, searchQuery, getAlbumRating),
    [epsAndSingles, searchQuery, getAlbumRating],
  );

  const filteredAppearsOn = useMemo(
    () => filterAndAnnotateAlbums(appearsOn, searchQuery, getAlbumRating),
    [appearsOn, searchQuery, getAlbumRating],
  );

  return (
    <div className="space-y-4">
      {filteredTopSongs.length > 0 && (
        <ArtistAccordion
          title="Top Songs"
          count={filteredTopSongs.length}
          icon={<LuListMusic aria-hidden />}
          defaultOpen={true}
        >
          <TopSongsList songs={filteredTopSongs} />
        </ArtistAccordion>
      )}

      {filteredEssential.length > 0 && (
        <ArtistAccordion
          title="Essential Albums"
          count={filteredEssential.length}
          icon={<LuStar aria-hidden />}
          defaultOpen={true}
        >
          <ArtistAlbumGridSection albums={filteredEssential} initialCount={3} />
        </ArtistAccordion>
      )}

      {filteredAlbums.length > 0 && (
        <ArtistAccordion
          title="Albums"
          count={filteredAlbums.length}
          icon={<IoDiscOutline aria-hidden />}
          defaultOpen={true}
        >
          <ArtistAlbumGridSection albums={filteredAlbums} initialCount={12} />
        </ArtistAccordion>
      )}

      {filteredEpsAndSingles.length > 0 && (
        <ArtistAccordion
          title="EPs & Singles"
          count={filteredEpsAndSingles.length}
          icon={<LuDiscAlbum aria-hidden />}
          defaultOpen={false}
        >
          <ArtistAlbumGridSection
            albums={filteredEpsAndSingles}
            initialCount={3}
          />
        </ArtistAccordion>
      )}

      {filteredAppearsOn.length > 0 && (
        <ArtistAccordion
          title="Appears On"
          count={filteredAppearsOn.length}
          icon={<LuUsersRound aria-hidden />}
          defaultOpen={false}
        >
          <ArtistAlbumGridSection albums={filteredAppearsOn} initialCount={3} />
        </ArtistAccordion>
      )}
    </div>
  );
}
