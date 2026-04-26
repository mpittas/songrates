"use client";

import { useState } from "react";
import Link from "next/link";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import AlbumGrid from "@/components/album/AlbumGrid";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import { createSlug, formatTime } from "@/lib/utils";

import { Album, TopSong } from "@/types/music";

interface DiscographyProps {
  artistId: string;
  artistName: string;
  topSongs: TopSong[];
  essentialAlbums: Album[];
  albums: Album[];
  epsAndSingles: Album[];
  appearsOn: Album[];
  searchQuery?: string;
}

// ─── Collapsible accordion section ──────────────────────────────────────────

function Section({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <div className="border border-[#e1e1e1] bg-white rounded-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#f6f6f6] transition-colors group"
      >
        <span className="text-xs text-neutral-500 group-hover:text-neutral-900 transition-colors font-mono flex items-center gap-1 uppercase tracking-wider">
          {title}
          <span className="text-neutral-600 ml-1">({count})</span>
        </span>
        <span className="text-neutral-600">
          {isOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
        </span>
      </button>
      {isOpen && (
        <div className="bg-[#fafafa] border-t border-[#ececec] p-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Top Songs list ─────────────────────────────────────────────────────────

function TopSongsList({ songs }: { songs: TopSong[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? songs : songs.slice(0, 10);

  return (
    <div>
      <div className="divide-y divide-[#ececec]">
        {visible.map((song, i) => {
          const albumSlug = song.albumId
            ? createSlug(song.albumName || song.name, song.albumId)
            : null;

          const trackLink = albumSlug
            ? `/album/${albumSlug}?track=${song.id}`
            : null;

          return (
            <div
              key={song.id}
              className="flex items-center gap-3 py-2 px-1 group hover:bg-[#f5f5f5] transition-colors"
            >
              {/* Number */}
              <span className="w-6 text-right text-[11px] font-mono text-neutral-600 shrink-0">
                {i + 1}
              </span>

              {/* Artwork */}
              {song.artworkUrl && (
                <div className="relative w-10 h-10 shrink-0 bg-[#efefef] rounded-sm overflow-hidden">
                  <OptimizedImage
                    src={song.artworkUrl}
                    alt={song.name}
                    fill
                    className="object-cover"
                    fallbackSrc="/vinyl-placeholder.svg"
                  />
                </div>
              )}

              {/* Title + Album link */}
              <div className="flex-1 min-w-0">
                {trackLink ? (
                  <Link
                    href={trackLink}
                    className="text-sm text-neutral-900 truncate group-hover:text-black transition-colors block"
                  >
                    {song.name}
                  </Link>
                ) : (
                  <p className="text-sm text-neutral-900 truncate group-hover:text-black transition-colors">
                    {song.name}
                  </p>
                )}
                {albumSlug && (
                  <Link
                    href={`/album/${albumSlug}`}
                    className="text-[11px] text-neutral-600 hover:text-neutral-900 transition-colors truncate block"
                  >
                    {song.albumName}
                  </Link>
                )}
              </div>

              {/* Duration */}
              {song.durationMs && (
                <span className="text-[11px] font-mono text-neutral-600 shrink-0">
                  {formatTime(song.durationMs, "milliseconds")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {songs.length > 10 && (
        <div className="mt-3 pt-3 border-t border-[#ececec] flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] text-neutral-600 hover:text-neutral-900 transition-colors font-mono uppercase tracking-widest"
          >
            {showAll ? "show_less" : `show_all_${songs.length}_songs`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Album grid with show more ──────────────────────────────────────────────

function AlbumGridSection({
  albums,
  initialCount = 12,
  gridCols = 3,
}: {
  albums: Album[];
  initialCount?: number;
  gridCols?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? albums : albums.slice(0, initialCount);
  const hasMore = albums.length > initialCount;

  return (
    <div>
      <AlbumGrid
        albums={visible}
        onSelectAlbum={() => {}}
        layout="grid"
        gridCols={gridCols}
      />
      {hasMore && (
        <div className="mt-4 pt-4 border-t border-[#ececec] flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] text-neutral-600 hover:text-neutral-900 transition-colors font-mono uppercase tracking-widest"
          >
            {showAll ? "show_less" : `show_all_${albums.length}_releases`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Discography component ─────────────────────────────────────────────

export default function Discography({
  topSongs,
  essentialAlbums,
  albums,
  epsAndSingles,
  appearsOn,
  searchQuery,
}: DiscographyProps) {
  const { getAlbumRating } = useRatings();

  // Deduplicate albums within a list by ID
  const dedup = (list: Album[]): Album[] => {
    const seen = new Set<string>();
    return list.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  };

  // Apply search filter + attach ratings
  const filterAlbums = (list: Album[]): Album[] => {
    let result = dedup(list);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }
    return result.map((a) => ({ ...a, rating: getAlbumRating(a.id) }));
  };

  const filterSongs = (list: TopSong[]): TopSong[] => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.albumName && s.albumName.toLowerCase().includes(q)),
    );
  };

  const filteredTopSongs = filterSongs(topSongs);
  const filteredEssential = filterAlbums(essentialAlbums);
  const filteredAlbums = filterAlbums(albums);
  const filteredEpsAndSingles = filterAlbums(epsAndSingles);
  const filteredAppearsOn = filterAlbums(appearsOn);

  return (
    <div className="space-y-4">
      {/* ── Top Songs ── */}
      {filteredTopSongs.length > 0 && (
        <Section
          title="Top Songs"
          count={filteredTopSongs.length}
          defaultOpen={true}
        >
          <TopSongsList songs={filteredTopSongs} />
        </Section>
      )}

      {/* ── Essential Albums ── */}
      {filteredEssential.length > 0 && (
        <Section
          title="Essential Albums"
          count={filteredEssential.length}
          defaultOpen={true}
        >
          <AlbumGridSection
            albums={filteredEssential}
            initialCount={6}
            gridCols={3}
          />
        </Section>
      )}

      {/* ── Albums ── */}
      {filteredAlbums.length > 0 && (
        <Section
          title="Albums"
          count={filteredAlbums.length}
          defaultOpen={true}
        >
          <AlbumGridSection
            albums={filteredAlbums}
            initialCount={12}
            gridCols={3}
          />
        </Section>
      )}

      {/* ── EPs & Singles ── */}
      {filteredEpsAndSingles.length > 0 && (
        <Section
          title="EPs & Singles"
          count={filteredEpsAndSingles.length}
          defaultOpen={false}
        >
          <AlbumGridSection
            albums={filteredEpsAndSingles}
            initialCount={12}
            gridCols={3}
          />
        </Section>
      )}

      {/* ── Appears On ── */}
      {filteredAppearsOn.length > 0 && (
        <Section
          title="Appears On"
          count={filteredAppearsOn.length}
          defaultOpen={false}
        >
          <AlbumGridSection
            albums={filteredAppearsOn}
            initialCount={12}
            gridCols={3}
          />
        </Section>
      )}
    </div>
  );
}
