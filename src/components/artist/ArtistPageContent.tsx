"use client";

import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";

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
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="flex items-baseline gap-6 w-full">
            <Link
              href="/"
              className="px-4 py-2 border border-white/10 text-neutral-200 text-xs font-mono hover:bg-white hover:text-black transition-all"
            >
              Back
            </Link>
          </div>

          <div className="flex flex-col md:flex-row items-end md:items-center gap-6">
            {/* Search Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-600 group-focus-within:text-[#00f0ff] transition-colors">
                <FaSearch size={12} />
              </div>
              <input
                type="text"
                placeholder="search discography..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0a0a0d] border border-[#1a1a1f] text-neutral-200 text-xs font-mono rounded-full py-1.5 pl-9 pr-4 focus:outline-none focus:border-[#00f0ff]/50 w-48 transition-all"
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-600 font-mono whitespace-nowrap">
              <span>sort:</span>
              <button
                onClick={() => setSortBy("newest")}
                className={`hover:text-[#00f0ff] transition-colors ${
                  sortBy === "newest" ? "text-[#00f0ff]" : ""
                }`}
              >
                new
              </button>
              <button
                onClick={() => setSortBy("oldest")}
                className={`hover:text-[#00f0ff] transition-colors ${
                  sortBy === "oldest" ? "text-[#00f0ff]" : ""
                }`}
              >
                old
              </button>
              <button
                onClick={() => setSortBy("title")}
                className={`hover:text-[#00f0ff] transition-colors ${
                  sortBy === "title" ? "text-[#00f0ff]" : ""
                }`}
              >
                a-z
              </button>
              <button
                onClick={() => setSortBy("popularity")}
                className={`hover:text-[#00f0ff] transition-colors ${
                  sortBy === "popularity" ? "text-[#00f0ff]" : ""
                }`}
              >
                popularity
              </button>
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
