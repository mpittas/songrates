"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { IoMusicalNotes, IoDisc, IoPerson } from "react-icons/io5";

import { useSearchQuery } from "@/hooks/useSearchQuery";

import type {
  SearchCategory,
  SearchResult,
  SearchResultsProps,
  ArtistSearchResult,
  AlbumSearchResult,
  SongSearchResult,
  GroupedSearchResults,
} from "@/types/search";
import { ArtistVisit } from "@/types/artist";
import { getArtistHistory } from "@/lib/history";
import { formatTimeAgo, createSlug, formatTime } from "@/lib/utils";
import PrefetchLink from "@/components/ui/PrefetchLink";
import { usePrefetchAlbum } from "@/hooks/useAlbumInfo";

// ─── Category Filter Tabs ──────────────────────────────────────────────────────

const CATEGORIES: { key: SearchCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "artist", label: "Artists" },
  { key: "album", label: "Albums" },
  { key: "song", label: "Songs" },
];

function CategoryTabs({
  active,
  onChange,
}: {
  active: SearchCategory;
  onChange: (cat: SearchCategory) => void;
}) {
  return (
    <div className="flex gap-1 px-3 pt-2 pb-1 border-b border-[#1a1a1f]">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(cat.key)}
          className={`px-3 py-1 text-[11px] font-mono tracking-wider uppercase transition-all rounded-sm ${
            active === cat.key
              ? "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30"
              : "text-neutral-500 hover:text-neutral-300 border border-transparent"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ─── Artwork helper ─────────────────────────────────────────────────────────

function ArtworkImage({
  url,
  alt,
  rounded = false,
  fallbackIcon,
}: {
  url?: string;
  alt: string;
  rounded?: boolean;
  fallbackIcon?: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !url) {
    return (
      fallbackIcon || (
        <IoDisc
          className="text-neutral-600 group-hover:text-[#00f0ff]/60"
          size={18}
        />
      )
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      width={40}
      height={40}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={`w-full h-full object-cover transition-all grayscale group-hover:grayscale-0 ${rounded ? "rounded-full" : ""}`}
    />
  );
}

// ─── Individual Result Row Components ──────────────────────────────────────────

function ArtistRow({ result }: { result: ArtistSearchResult }) {
  return (
    <PrefetchLink
      href={`/artist/${createSlug(result.title, result.id)}`}
      artistId={result.id}
      className="flex items-center gap-3 p-3 hover:bg-[#0f0f12] transition-colors group"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0">
        <ArtworkImage
          url={result.artworkUrl}
          alt={result.title}
          rounded
          fallbackIcon={
            <IoPerson
              className="text-neutral-600 group-hover:text-[#00f0ff]/60"
              size={18}
            />
          }
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate">
          {result.title}
        </h3>
        <p className="text-[11px] text-neutral-600 truncate mt-0.5">
          {result.genres && result.genres.length > 0
            ? result.genres.slice(0, 3).join(", ")
            : "Artist"}
        </p>
      </div>
      <span className="text-[10px] text-neutral-600 font-mono flex-shrink-0 uppercase tracking-wider">
        Artist
      </span>
    </PrefetchLink>
  );
}

function AlbumRow({ result }: { result: AlbumSearchResult }) {
  const prefetchAlbum = usePrefetchAlbum();
  const slug = createSlug(result.title, result.id);

  return (
    <Link
      href={`/album/${slug}`}
      onMouseEnter={() => prefetchAlbum(slug)}
      className="flex items-center gap-3 p-3 hover:bg-[#0f0f12] transition-colors group"
    >
      <div className="w-10 h-10 overflow-hidden bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0">
        <ArtworkImage url={result.artworkUrl} alt={result.title} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate">
          {result.title}
        </h3>
        <p className="text-[11px] text-neutral-600 truncate mt-0.5">
          {result.artistName || "Unknown Artist"}
          {result.releaseDate ? ` · ${result.releaseDate.slice(0, 4)}` : ""}
        </p>
      </div>
      <span className="text-[10px] text-neutral-600 font-mono flex-shrink-0 uppercase tracking-wider">
        {result.albumType || "Album"}
      </span>
    </Link>
  );
}

function SongRow({ result }: { result: SongSearchResult }) {
  const prefetchAlbum = usePrefetchAlbum();
  const albumSlug = result.albumId
    ? createSlug(result.albumName || result.title, result.albumId)
    : null;
  const href = albumSlug ? `/album/${albumSlug}?track=${result.id}` : undefined;

  const displayYear = result.releaseDate?.slice(0, 4) || "";

  const content = (
    <>
      <div className="w-10 h-10 overflow-hidden bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0">
        <ArtworkImage
          url={result.artworkUrl}
          alt={result.title}
          fallbackIcon={
            <IoMusicalNotes
              className="text-neutral-600 group-hover:text-[#00f0ff]/60"
              size={18}
            />
          }
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate">
          {result.title}
        </h3>
        <p className="text-[11px] text-neutral-600 truncate mt-0.5">
          {result.artistName || "Unknown Artist"}
          {result.albumName ? ` · ${result.albumName}` : ""}
          {displayYear ? ` · ${displayYear}` : ""}
          {result.durationMs
            ? ` · ${formatTime(result.durationMs, "milliseconds")}`
            : ""}
        </p>
      </div>
      <span className="text-[10px] text-neutral-600 font-mono flex-shrink-0 uppercase tracking-wider">
        Song
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onMouseEnter={() => albumSlug && prefetchAlbum(albumSlug)}
        className="flex items-center gap-3 p-3 hover:bg-[#0f0f12] transition-colors group"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-[#0f0f12] transition-colors group cursor-default">
      {content}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="px-4 py-1.5 border-b border-[#1a1a1f]">
      <h2 className="font-mono text-[10px] text-neutral-500 tracking-wider uppercase">
        {label}
        <span className="ml-1.5 text-neutral-600">({count})</span>
      </h2>
    </div>
  );
}

// ─── Result Renderer ───────────────────────────────────────────────────────────

function ResultRow({ result }: { result: SearchResult }) {
  switch (result.type) {
    case "artist":
      return <ArtistRow result={result} />;
    case "album":
      return <AlbumRow result={result} />;
    case "song":
      return <SongRow result={result} />;
    default:
      return null;
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SearchResults({
  query,
  onClose,
  isFocused,
}: SearchResultsProps) {
  const [category, setCategory] = useState<SearchCategory>("all");

  // History state
  const [history, setHistory] = useState<ArtistVisit[]>([]);

  // ─── TanStack Query: main search ───────────────────────────────────
  const {
    data: searchData,
    isFetching,
    isPlaceholderData,
  } = useSearchQuery(query, category);

  const results = searchData?.results ?? [];
  const grouped = searchData?.grouped ?? null;

  // ─── History when focused and empty ────────────────────────────────
  const loadHistory = useCallback(() => {
    const data = getArtistHistory();
    setHistory(data);
  }, []);

  useEffect(() => {
    if (isFocused && !query) {
      loadHistory();
    }
  }, [isFocused, query, loadHistory]);

  // ─── Determine loading state ───────────────────────────────────────
  const showLoading = isFetching && results.length === 0;

  if (!query && (!isFocused || history.length === 0)) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-[#0a0a0d] border-x border-b border-[#1a1a1f] z-[9999] max-h-[420px] overflow-y-auto shadow-2xl">
      {/* Category Filter Tabs */}
      {query && <CategoryTabs active={category} onChange={setCategory} />}

      {/* Loading skeletons */}
      {query && showLoading && (
        <div className="divide-y divide-[#1a1a1f]/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-10 h-10 rounded bg-[#1a1a1f] flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3.5 bg-[#1a1a1f] rounded w-2/5" />
                <div className="h-2.5 bg-[#1a1a1f]/60 rounded w-3/5" />
              </div>
              <div className="h-3 bg-[#1a1a1f] rounded w-10 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Fetching indicator */}
      {query && isFetching && !showLoading && results.length > 0 && (
        <div className="h-0.5 bg-[#00f0ff]/10 overflow-hidden">
          <div
            className="h-full bg-[#00f0ff]/60 w-1/3"
            style={{ animation: "searchSlide 1s ease-in-out infinite" }}
          />
        </div>
      )}

      {/* Results */}
      {query && !showLoading && results.length > 0 && (
        <div className="divide-y divide-[#1a1a1f]/50">
          {category === "all" && grouped ? (
            <>
              {grouped.artists.length > 0 && (
                <>
                  <SectionHeader
                    label="Artists"
                    count={grouped.artists.length}
                  />
                  {grouped.artists.slice(0, 3).map((r) => (
                    <ResultRow key={r.id} result={r} />
                  ))}
                </>
              )}
              {grouped.albums.length > 0 && (
                <>
                  <SectionHeader label="Albums" count={grouped.albums.length} />
                  {grouped.albums.slice(0, 3).map((r) => (
                    <ResultRow key={r.id} result={r} />
                  ))}
                </>
              )}
              {grouped.songs.length > 0 && (
                <>
                  <SectionHeader label="Songs" count={grouped.songs.length} />
                  {grouped.songs.slice(0, 8).map((r) => (
                    <ResultRow key={r.id} result={r} />
                  ))}
                </>
              )}
            </>
          ) : category === "album" ? (
            (() => {
              const albums = results.filter(
                (r): r is AlbumSearchResult => r.type === "album",
              );
              const mainAlbums = albums.filter((r) => r.albumType === "Album");
              const eps = albums.filter((r) => r.albumType === "EP");
              const singles = albums.filter((r) => r.albumType === "Single");
              const compilations = albums.filter(
                (r) => r.albumType === "Compilation",
              );
              return (
                <>
                  {mainAlbums.length > 0 && (
                    <>
                      <SectionHeader label="Albums" count={mainAlbums.length} />
                      {mainAlbums.map((r) => (
                        <ResultRow key={r.id} result={r} />
                      ))}
                    </>
                  )}
                  {eps.length > 0 && (
                    <>
                      <SectionHeader label="EPs" count={eps.length} />
                      {eps.map((r) => (
                        <ResultRow key={r.id} result={r} />
                      ))}
                    </>
                  )}
                  {singles.length > 0 && (
                    <>
                      <SectionHeader label="Singles" count={singles.length} />
                      {singles.map((r) => (
                        <ResultRow key={r.id} result={r} />
                      ))}
                    </>
                  )}
                  {compilations.length > 0 && (
                    <>
                      <SectionHeader
                        label="Compilations"
                        count={compilations.length}
                      />
                      {compilations.map((r) => (
                        <ResultRow key={r.id} result={r} />
                      ))}
                    </>
                  )}
                </>
              );
            })()
          ) : (
            results.map((r) => <ResultRow key={r.id} result={r} />)
          )}
        </div>
      )}

      {/* No results */}
      {query && !isFetching && !isPlaceholderData && results.length === 0 && (
        <div className="text-center py-8 text-neutral-600 font-mono text-sm">
          no results found for &ldquo;{query}&rdquo;
        </div>
      )}

      {/* Recent Artists */}
      {!query && isFocused && history.length > 0 && (
        <div className="py-2">
          <div className="px-4 py-2 border-b border-[#1a1a1f] mb-1">
            <h2 className="font-mono text-[10px] text-neutral-500 tracking-wider uppercase">
              Recent
            </h2>
          </div>
          <div className="divide-y divide-[#1a1a1f]/50">
            {history.map((artist) => (
              <PrefetchLink
                key={artist.id}
                href={`/artist/${createSlug(artist.name, artist.id)}`}
                artistId={artist.id}
                className="flex items-center justify-between p-3 hover:bg-[#0f0f12] transition-colors group"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 overflow-hidden bg-[#0a0a0d] border border-[#1a1a1f] flex-shrink-0 group-hover:border-[#00f0ff]/30 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-neutral-600">
                      {artist.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-neutral-400 group-hover:text-[#00f0ff] transition-colors">
                    {artist.name}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-600 font-mono">
                  {formatTimeAgo(artist.visitedAt)}
                </span>
              </PrefetchLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
