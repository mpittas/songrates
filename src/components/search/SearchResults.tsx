"use client";

import { useState } from "react";
import Link from "next/link";
import { IoMusicalNotes, IoDisc, IoPerson, IoClose } from "react-icons/io5";

import { useSearchQuery } from "@/hooks/useSearchQuery";

import type {
  SearchCategory,
  SearchResult,
  SearchResultsProps,
  ArtistSearchResult,
  AlbumSearchResult,
  SongSearchResult,
} from "@/types/search";
import { createSlug, formatTime } from "@/lib/utils";
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
    <div className="flex gap-1 px-3 pt-2 pb-1 border-b border-[#e6e6e6]">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(cat.key)}
          className={`px-3 py-1 text-[11px] font-mono tracking-wider uppercase transition-all rounded-sm ${
            active === cat.key
              ? "bg-[#efefef] text-neutral-900 border border-[#d8d8d8]"
              : "text-neutral-500 hover:text-neutral-900 border border-transparent"
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
          className="text-neutral-600 group-hover:text-neutral-900"
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

function ArtistRow({
  result,
  onSelect,
  reserveRightSpace = false,
}: {
  result: ArtistSearchResult;
  onSelect?: () => void;
  reserveRightSpace?: boolean;
}) {
  return (
    <Link
      href={`/artist/${createSlug(result.title, result.id)}`}
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 hover:bg-[#f7f7f7] transition-colors group${reserveRightSpace ? " pr-9" : ""}`}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#efefef] border border-[#dcdcdc] group-hover:border-[#c8c8c8] flex items-center justify-center flex-shrink-0">
        <ArtworkImage
          url={result.artworkUrl}
          alt={result.title}
          rounded
          fallbackIcon={
            <IoPerson
              className="text-neutral-600 group-hover:text-neutral-900"
              size={18}
            />
          }
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-neutral-900 group-hover:text-black transition-colors truncate">
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
    </Link>
  );
}

function AlbumRow({
  result,
  onSelect,
  reserveRightSpace = false,
}: {
  result: AlbumSearchResult;
  onSelect?: () => void;
  reserveRightSpace?: boolean;
}) {
  const prefetchAlbum = usePrefetchAlbum();
  const slug = createSlug(result.title, result.id);

  return (
    <Link
      href={`/album/${slug}`}
      onMouseEnter={() => prefetchAlbum(slug)}
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 hover:bg-[#f7f7f7] transition-colors group${reserveRightSpace ? " pr-9" : ""}`}
    >
      <div className="w-10 h-10 overflow-hidden bg-[#efefef] border border-[#dcdcdc] group-hover:border-[#c8c8c8] flex items-center justify-center flex-shrink-0 rounded-sm">
        <ArtworkImage url={result.artworkUrl} alt={result.title} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-neutral-900 group-hover:text-black transition-colors truncate">
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

function SongRow({
  result,
  onSelect,
  reserveRightSpace = false,
}: {
  result: SongSearchResult;
  onSelect?: () => void;
  reserveRightSpace?: boolean;
}) {
  const prefetchAlbum = usePrefetchAlbum();
  const albumSlug = result.albumId
    ? createSlug(result.albumName || result.title, result.albumId)
    : null;
  const href = albumSlug ? `/album/${albumSlug}?track=${result.id}` : undefined;
  const rowClass = `flex items-center gap-3 p-3 hover:bg-[#f7f7f7] transition-colors group${reserveRightSpace ? " pr-9" : ""}`;

  const displayYear = result.releaseDate?.slice(0, 4) || "";

  const content = (
    <>
      <div className="w-10 h-10 overflow-hidden bg-[#efefef] border border-[#dcdcdc] group-hover:border-[#c8c8c8] flex items-center justify-center flex-shrink-0 rounded-sm">
        <ArtworkImage
          url={result.artworkUrl}
          alt={result.title}
          fallbackIcon={
            <IoMusicalNotes
              className="text-neutral-600 group-hover:text-neutral-900"
              size={18}
            />
          }
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-neutral-900 group-hover:text-black transition-colors truncate">
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
        onClick={onSelect}
        className={rowClass}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={`${rowClass} cursor-default`}>
      {content}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="px-4 py-1.5 border-b border-[#e6e6e6]">
      <h2 className="font-mono text-[10px] text-neutral-500 tracking-wider uppercase">
        {label}
        <span className="ml-1.5 text-neutral-600">({count})</span>
      </h2>
    </div>
  );
}

// ─── Result Renderer ───────────────────────────────────────────────────────────

function ResultRow({
  result,
  onSelect,
  reserveRightSpace = false,
}: {
  result: SearchResult;
  onSelect?: (result: SearchResult) => void;
  reserveRightSpace?: boolean;
}) {
  const handleSelect = onSelect ? () => onSelect(result) : undefined;
  switch (result.type) {
    case "artist":
      return (
        <ArtistRow
          result={result}
          onSelect={handleSelect}
          reserveRightSpace={reserveRightSpace}
        />
      );
    case "album":
      return (
        <AlbumRow
          result={result}
          onSelect={handleSelect}
          reserveRightSpace={reserveRightSpace}
        />
      );
    case "song":
      return (
        <SongRow
          result={result}
          onSelect={handleSelect}
          reserveRightSpace={reserveRightSpace}
        />
      );
    default:
      return null;
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SearchResults({
  query,
  variant = "light",
  isFocused = false,
  history = [],
  onRemoveClick,
  onClearHistory,
  onRecordClick,
}: SearchResultsProps) {
  const [category, setCategory] = useState<SearchCategory>("all");

  // ─── TanStack Query: main search ───────────────────────────────────
  const {
    data: searchData,
    isFetching,
    isPlaceholderData,
  } = useSearchQuery(query, category);

  const results = searchData?.results ?? [];
  const grouped = searchData?.grouped ?? null;

  // ─── determine loading state ───────────────────────────────────────
  const showLoading = isFetching && results.length === 0;

  const isGlass = variant === "glass";
  const panelClass = isGlass
    ? "w-full bg-white/80 backdrop-blur-xl border border-white/30 z-[9999] max-h-[60vh] overflow-y-auto shadow-2xl rounded-xl text-left"
    : "w-full bg-white border border-[#dcdcdc] z-[9999] max-h-[60vh] overflow-y-auto shadow-2xl rounded-xl text-left";

  if (query.trim().length === 1) {
    return null;
  }

  // ─── No query: show recently clicked results (logged-in users only) ──
  if (!query) {
    if (!isFocused || history.length === 0) return null;

    return (
      <div className={panelClass}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6e6e6]">
          <h2 className="font-mono text-[10px] text-neutral-500 tracking-wider uppercase">
            Recent
          </h2>
          {onClearHistory && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onClearHistory}
              className="font-mono text-[10px] text-neutral-500 hover:text-neutral-900 tracking-wider uppercase transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="divide-y divide-[#ececec]">
          {history.map((item) => (
            <div key={item.recordId} className="relative group/recent">
              <ResultRow
                result={item.result}
                onSelect={onRecordClick}
                reserveRightSpace={Boolean(onRemoveClick)}
              />
              {onRemoveClick && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onRemoveClick(item.result.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/90 text-neutral-400 hover:text-neutral-900 opacity-0 group-hover/recent:opacity-100 transition-opacity"
                  aria-label={`Remove ${item.result.title} from recent`}
                >
                  <IoClose size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleResultSelect = onRecordClick;

  return (
    <div className={panelClass}>
      {/* Category Filter Tabs */}
      {query && <CategoryTabs active={category} onChange={setCategory} />}

      {/* Loading skeletons */}
      {query && showLoading && (
        <div className="divide-y divide-[#ececec]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-10 h-10 rounded bg-[#efefef] flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3.5 bg-[#e5e5e5] rounded w-2/5" />
                <div className="h-2.5 bg-[#ececec] rounded w-3/5" />
              </div>
              <div className="h-3 bg-[#e5e5e5] rounded w-10 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Fetching indicator */}
      {query && isFetching && !showLoading && results.length > 0 && (
        <div className="h-0.5 bg-[#e9e9e9] overflow-hidden">
          <div
            className="h-full bg-[#6f6f6f] w-1/3"
            style={{ animation: "searchSlide 1s ease-in-out infinite" }}
          />
        </div>
      )}

      {/* Results */}
      {query && !showLoading && results.length > 0 && (
        <div className="divide-y divide-[#ececec]">
          {category === "all" && grouped ? (
            <>
              {grouped.artists.length > 0 && (
                <>
                  <SectionHeader
                    label="Artists"
                    count={grouped.artists.length}
                  />
                  {grouped.artists.slice(0, 3).map((r) => (
                    <ResultRow key={r.id} result={r} onSelect={handleResultSelect} />
                  ))}
                </>
              )}
              {grouped.albums.length > 0 && (
                <>
                  <SectionHeader label="Albums" count={grouped.albums.length} />
                  {grouped.albums.slice(0, 3).map((r) => (
                    <ResultRow key={r.id} result={r} onSelect={handleResultSelect} />
                  ))}
                </>
              )}
              {grouped.songs.length > 0 && (
                <>
                  <SectionHeader label="Songs" count={grouped.songs.length} />
                  {grouped.songs.slice(0, 8).map((r) => (
                    <ResultRow key={r.id} result={r} onSelect={handleResultSelect} />
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
                        <ResultRow key={r.id} result={r} onSelect={handleResultSelect} />
                      ))}
                    </>
                  )}
                  {eps.length > 0 && (
                    <>
                      <SectionHeader label="EPs" count={eps.length} />
                      {eps.map((r) => (
                        <ResultRow key={r.id} result={r} onSelect={handleResultSelect} />
                      ))}
                    </>
                  )}
                  {singles.length > 0 && (
                    <>
                      <SectionHeader label="Singles" count={singles.length} />
                      {singles.map((r) => (
                        <ResultRow key={r.id} result={r} onSelect={handleResultSelect} />
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
                        <ResultRow key={r.id} result={r} onSelect={handleResultSelect} />
                      ))}
                    </>
                  )}
                </>
              );
            })()
          ) : (
            results.map((r) => <ResultRow key={r.id} result={r} onSelect={handleResultSelect} />)
          )}
        </div>
      )}

      {/* No results */}
      {query && !isFetching && !isPlaceholderData && results.length === 0 && (
        <div className="text-center py-8 text-neutral-600 font-mono text-sm">
          no results found for &ldquo;{query}&rdquo;
        </div>
      )}

      {/* Recent Artists (Hidden for now) */}
      {/* {!query && isFocused && history.length > 0 && (
        <div className="py-2">
          <div className="px-4 py-2 border-b border-[#1a1a1f] mb-1">
            <h2 className="font-mono text-[10px] text-neutral-500 tracking-wider uppercase">
              Recent
            </h2>
          </div>
          <div className="divide-y divide-[#1a1a1f]/50">
            {history.map((artist) => (
              <Link
                key={artist.id}
                href={`/artist/${createSlug(artist.name, artist.id)}`}
                className="flex items-center justify-between p-3 hover:bg-[#0f0f12] transition-colors group"
                onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
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
              </Link>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}
