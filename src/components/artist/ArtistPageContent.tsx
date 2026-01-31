"use client";

import { useEffect, useState } from "react";

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
} from "@/lib/musicbrainz";

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
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");

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

  useEffect(() => {
    if (artistId && artistName) {
      addToHistory(artistId, artistName);
    }
  }, [artistId, artistName]);

  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100">
      <MySection className="py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-4">
          <div className="flex items-baseline gap-6">
            <Link
              href="/"
              className="text-neutral-600 hover:text-[#00f0ff] transition-colors font-mono text-sm"
            >
              ← back
            </Link>
            {artistName && (
              <h1 className="text-3xl md:text-4xl font-light tracking-tight text-neutral-200">
                {artistName}
              </h1>
            )}
          </div>

          {albums.length > 0 && (
            <div className="flex gap-4 text-xs text-neutral-600 font-mono">
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
            </div>
          )}
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
              mainAlbums={sortedAlbums}
              onSelectAlbum={() => {}}
              initialReleases={otherReleases}
            />
          </div>
        </div>
      </MySection>
    </main>
  );
}
