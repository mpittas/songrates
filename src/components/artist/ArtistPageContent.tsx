"use client";

import { useEffect, useState } from "react";
import DropdownFilter from "@/components/ui/DropdownFilter";
import SearchInput from "@/components/search/SearchInput";

import ArtistInfo from "./ArtistInfo";
import Discography from "./Discography";
import Link from "next/link";
import { addToHistory } from "@/lib/history";
import MySection from "@/components/MySection";
// Types
import {
  Album,
  ArtistInfo as ArtistInfoType,
  GroupedReleases,
} from "@/types/music";

interface ArtistPageContentProps {
  artistId: string;
  artistName: string;
  artistInfo: ArtistInfoType;
  albums: Album[];
  otherReleases?: GroupedReleases;
}

export default function ArtistPageContent({
  artistId,
  artistName,
  artistInfo,
  albums,
  otherReleases = {},
}: ArtistPageContentProps) {
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "title" | "popularity"
  >("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Track sorting
  const sortedAlbums = [...albums].sort((a, b) => {
    if (sortBy === "newest") {
      return (b.releaseDate || "").localeCompare(a.releaseDate || "");
    }
    if (sortBy === "oldest") {
      return (a.releaseDate || "").localeCompare(b.releaseDate || "");
    }
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const filteredMainAlbums = sortedAlbums.filter((album) =>
    album.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (artistId && artistName) {
      addToHistory(artistId, artistName);
    }
  }, [artistId, artistName]);

  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100">
      <MySection className="pt-8 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6">
          <Link
            href="/"
            className="px-4 py-2 border border-white/10 text-neutral-200 text-xs font-mono hover:bg-white hover:text-black transition-all self-start md:self-center"
          >
            Back
          </Link>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <DropdownFilter
              label="sort:"
              options={[
                { label: "Newest First", value: "newest" },
                { label: "Oldest First", value: "oldest" },
                { label: "Title (A-Z)", value: "title" },
                { label: "Popularity", value: "popularity" },
              ]}
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
            />
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
        </div>

        <div className="grid grid-cols-1 gap-12 items-start lg:grid-cols-[140px_1fr]">
          {/* Sidebar */}
          <div className="lg:sticky lg:top-20">
            <ArtistInfo
              artistId={artistId}
              artistName={artistName}
              data={artistInfo}
              disableFetch={true}
            />
          </div>

          {/* Discography */}
          <div className="min-w-0 space-y-16">
            <Discography
              artistId={artistId}
              artistName={artistName}
              mainAlbums={filteredMainAlbums}
              onSelectAlbum={() => {}}
              initialReleases={otherReleases}
              searchQuery={searchQuery}
              sortBy={sortBy}
            />
          </div>
        </div>
      </MySection>
    </main>
  );
}
