"use client";

import { useMemo } from "react";
import TopSongsList from "./TopSongsList";
import ArtistAlbumGridSection from "./ArtistAlbumGridSection";
import SectionHeader from "@/components/ui/SectionHeader";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import {
  filterAndAnnotateAlbums,
  filterTopSongsByQuery,
} from "@/lib/discographyFilters";
import type { Album, TopSong } from "@/types/music";

interface DiscographyProps {
  topSongs: TopSong[];
  latestSongs: TopSong[];
  essentialAlbums: Album[];
  albums: Album[];
  epsAndSingles: Album[];
  appearsOn: Album[];
  /** Optional filter (e.g. future search UI). */
  searchQuery?: string;
}

/** One rhythm for every discography block: header, then content. */
function DiscographySection({
  title,
  count,
  description,
  children,
}: {
  title: string;
  count: number;
  description?: string;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <section>
      <SectionHeader title={title} count={count} description={description} />
      {children}
    </section>
  );
}

export default function Discography({
  topSongs,
  latestSongs = [],
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

  const filteredLatestSongs = useMemo(
    () => filterTopSongsByQuery(latestSongs, searchQuery),
    [latestSongs, searchQuery],
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
    <div className="flex flex-col gap-14 sm:gap-16">
      <DiscographySection title="Popular" count={filteredTopSongs.length}>
        <TopSongsList songs={filteredTopSongs} />
      </DiscographySection>

      <DiscographySection
        title="Latest releases"
        count={filteredLatestSongs.length}
      >
        <TopSongsList songs={filteredLatestSongs} trailing="releaseDate" />
      </DiscographySection>

      <DiscographySection
        title="Essential albums"
        count={filteredEssential.length}
      >
        <ArtistAlbumGridSection
          albums={filteredEssential}
          initialCount={6}
          columns={6}
        />
      </DiscographySection>

      <DiscographySection title="Albums" count={filteredAlbums.length}>
        <ArtistAlbumGridSection
          albums={filteredAlbums}
          initialCount={12}
          columns={6}
        />
      </DiscographySection>

      <DiscographySection
        title="EPs & singles"
        count={filteredEpsAndSingles.length}
      >
        <ArtistAlbumGridSection
          albums={filteredEpsAndSingles}
          initialCount={6}
          columns={6}
        />
      </DiscographySection>

      <DiscographySection
        title="Appears on"
        count={filteredAppearsOn.length}
        description="Compilations and other artists' releases."
      >
        <ArtistAlbumGridSection
          albums={filteredAppearsOn}
          initialCount={6}
          columns={6}
        />
      </DiscographySection>
    </div>
  );
}
