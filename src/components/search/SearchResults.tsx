"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { IoMusicalNotes, IoDisc, IoPerson } from "react-icons/io5";
import OptimizedImage from "@/components/ui/OptimizedImage";

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
import ListenCountBadge from "@/components/shared/ListenCountBadge";
import Badge from "@/components/shared/Badge";
import PrefetchLink from "@/components/ui/PrefetchLink";
import { getCoverArtUrl } from "@/lib/cover-art";

// ─── Category Filter Tabs ──────────────────────────────────────────────────────

const CATEGORIES: { key: SearchCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "artist", label: "Artists" },
  { key: "album", label: "Albums" },
  { key: "song", label: "Songs" },
];

const CategoryTabs = memo(function CategoryTabs({
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
          onMouseDown={(e) => e.preventDefault()} // Prevent blur
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
});

// ─── Individual Result Row Components ──────────────────────────────────────────

const ArtistRow = memo(function ArtistRow({
  result,
  imageUrl,
}: {
  result: ArtistSearchResult;
  imageUrl?: string;
}) {
  return (
    <PrefetchLink
      href={`/artist/${createSlug(result.title, result.id)}`}
      artistId={result.id}
      className="flex items-center gap-3 p-3 hover:bg-[#0f0f12] transition-colors group"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0 relative">
        {imageUrl ? (
          <OptimizedImage
            src={imageUrl}
            alt={result.title}
            fill
            className="object-cover"
          />
        ) : (
          <IoPerson
            className="text-neutral-600 group-hover:text-[#00f0ff]/60"
            size={18}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate">
          {result.title}
        </h3>
        <p className="text-[11px] text-neutral-600 truncate mt-0.5">
          {result.artistType || "Artist"}
          {result.country ? ` · ${result.country}` : ""}
          {result.disambiguation ? ` · ${result.disambiguation}` : ""}
        </p>
      </div>
      <span className="text-[10px] text-neutral-600 font-mono flex-shrink-0 uppercase tracking-wider">
        Artist
      </span>
    </PrefetchLink>
  );
});

const AlbumRow = memo(function AlbumRow({
  result,
}: {
  result: AlbumSearchResult;
}) {
  return (
    <Link
      href={`/album/${createSlug(result.title, result.id)}`}
      className="flex items-center gap-3 p-3 hover:bg-[#0f0f12] transition-colors group"
    >
      <div className="w-10 h-10 overflow-hidden bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0 relative">
        <OptimizedImage
          src={getCoverArtUrl(result.id, result.title, result.artistName)}
          alt={result.title}
          fill
          className="object-cover"
          fallbackSrc="/vinyl-placeholder.svg"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate">
          {result.title}
        </h3>
        <p className="text-[11px] text-neutral-600 truncate mt-0.5">
          {result.artistName || "Unknown Artist"}
          {result.releaseDate ? ` · ${result.releaseDate.slice(0, 4)}` : ""}
          {result.primaryType ? ` · ${result.primaryType}` : ""}
        </p>
      </div>
      <span className="text-[10px] text-neutral-600 font-mono flex-shrink-0 uppercase tracking-wider">
        Album
      </span>
    </Link>
  );
});

const SongRow = memo(function SongRow({
  result,
  listenCount,
}: {
  result: SongSearchResult;
  listenCount?: number;
}) {
  const albumSlug = result.releaseGroupId
    ? createSlug(
        result.releaseGroupTitle || result.title,
        result.releaseGroupId,
      )
    : null;
  const href = albumSlug ? `/album/${albumSlug}?track=${result.id}` : undefined;

  const effectiveListenCount = listenCount ?? result.listenCount;

  // Display the original album title if available, otherwise the release group title
  const displayAlbumTitle =
    result.originalAlbumTitle || result.releaseGroupTitle;
  // Show the year from original album date, or fall back to first release date
  const displayYear =
    (result.originalAlbumDate || result.firstReleaseDate)?.slice(0, 4) || "";

  const content = (
    <>
      <div className="w-10 h-10 overflow-hidden bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0 relative">
        {result.releaseGroupId ? (
          <OptimizedImage
            src={getCoverArtUrl(
              result.releaseGroupId,
              result.releaseGroupTitle,
              result.artistName,
            )}
            alt={result.title}
            fill
            className="object-cover"
            fallbackSrc="/vinyl-placeholder.svg"
          />
        ) : (
          <IoMusicalNotes
            className="text-neutral-600 group-hover:text-[#00f0ff]/60"
            size={18}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate">
          {result.title}
        </h3>
        <p className="text-[11px] text-neutral-600 truncate mt-0.5">
          {result.artistName || "Unknown Artist"}
          {displayAlbumTitle ? ` · ${displayAlbumTitle}` : ""}
          {displayYear ? ` · ${displayYear}` : ""}
          {result.length
            ? ` · ${formatTime(result.length, "milliseconds")}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {(result.primaryType || result.hasAlbumRelease) && (
          <Badge
            variant="emerald"
            title={`Appears on ${result.primaryType || "Album"}`}
          >
            {result.primaryType || "LP"}
          </Badge>
        )}
        <ListenCountBadge count={effectiveListenCount || 0} />
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
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
});

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

const ResultRow = memo(function ResultRow({
  result,
  listenCounts,
  artistImages,
}: {
  result: SearchResult;
  listenCounts: Record<string, number>;
  artistImages: Record<string, string>;
}) {
  switch (result.type) {
    case "artist":
      return <ArtistRow result={result} imageUrl={artistImages[result.id]} />;
    case "album":
      return <AlbumRow result={result} />;
    case "song":
      return <SongRow result={result} listenCount={listenCounts[result.id]} />;
    default:
      return null;
  }
});

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SearchResults({
  query,
  onClose,
  isFocused,
}: SearchResultsProps) {
  const [category, setCategory] = useState<SearchCategory>("all");
  const prevQueryRef = useRef(query);

  // Reset to "all" tab when the search query changes
  useEffect(() => {
    if (query !== prevQueryRef.current) {
      prevQueryRef.current = query;
      setCategory("all");
    }
  }, [query]);

  // Stable callback for CategoryTabs to prevent re-renders
  const handleCategoryChange = useCallback((cat: SearchCategory) => {
    setCategory(cat);
  }, []);

  // History state
  const [history, setHistory] = useState<ArtistVisit[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});

  // Artist images for search results (fetched via Wikidata)
  const [artistImages, setArtistImages] = useState<Record<string, string>>({});
  const artistImagesRef = useRef(artistImages);
  artistImagesRef.current = artistImages;

  // ─── TanStack Query: main search ───────────────────────────────────
  const {
    data: searchData,
    isFetching,
    isPlaceholderData,
  } = useSearchQuery(query, category);

  const results = searchData?.results ?? [];
  const grouped = searchData?.grouped ?? null;

  // ─── No client-side re-sort needed ────────────────────────────────
  // The server now handles hybrid search ranking (Last.fm + MusicBrainz)
  // so results arrive pre-sorted by popularity.

  // ─── Fetch artist images when results contain artists ─────────────
  useEffect(() => {
    const artists =
      category === "all" && grouped
        ? grouped.artists
        : results.filter((r) => r.type === "artist");

    if (artists.length === 0) return;

    // Only fetch IDs we don't already have
    const newIds = artists
      .map((a) => a.id)
      .filter((id) => !(id in artistImagesRef.current));

    if (newIds.length === 0) return;

    fetch(`/api/images/artists?ids=${newIds.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.images) {
          setArtistImages((prev) => ({ ...prev, ...data.images }));
        }
      })
      .catch(() => {});
  }, [results, grouped, category]);

  // ─── History when focused and empty ────────────────────────────────
  const loadHistory = useCallback(() => {
    const data = getArtistHistory();
    setHistory(data);

    if (data.length > 0) {
      const ids = data.map((a) => a.id).join(",");
      fetch(`/api/images/artists?ids=${ids}`)
        .then((res) => res.json())
        .then((data) => {
          setImages((prev) => ({ ...prev, ...data.images }));
        })
        .catch((e) => console.error(e));
    }
  }, []);

  useEffect(() => {
    if (isFocused && !query) {
      loadHistory();
    }
  }, [isFocused, query, loadHistory]);

  // ─── Determine loading state ───────────────────────────────────────
  // Show loading spinner when fetching if we have no results to show
  // (even if we have placeholder data, if it's empty, we should show loading instead of blank)
  const showLoading = isFetching && results.length === 0;

  if (!query && (!isFocused || history.length === 0)) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-[#0a0a0d] border-x border-b border-[#1a1a1f] z-[9999] max-h-[420px] overflow-y-auto shadow-2xl">
      {/* Category Filter Tabs */}
      {query && (
        <CategoryTabs active={category} onChange={handleCategoryChange} />
      )}

      {/* Loading — only shown when no previous data available */}
      {query && showLoading && (
        <div className="flex items-center justify-center py-12 text-neutral-600 font-mono text-sm tracking-widest uppercase">
          <span>Searching...</span>
        </div>
      )}

      {/* Fetching indicator — subtle, shown when refreshing with existing data */}
      {query && isFetching && !showLoading && results.length > 0 && (
        <div className="h-0.5 bg-[#00f0ff]/20 overflow-hidden">
          <div className="h-full bg-[#00f0ff]/60 animate-pulse w-full" />
        </div>
      )}

      {/* Results — uses server-ranked results directly */}
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
                    <ResultRow
                      key={r.id}
                      result={r}
                      listenCounts={{}}
                      artistImages={artistImages}
                    />
                  ))}
                </>
              )}
              {grouped.albums.length > 0 && (
                <>
                  <SectionHeader label="Albums" count={grouped.albums.length} />
                  {grouped.albums.slice(0, 3).map((r) => (
                    <ResultRow
                      key={r.id}
                      result={r}
                      listenCounts={{}}
                      artistImages={artistImages}
                    />
                  ))}
                </>
              )}
              {grouped.songs.length > 0 && (
                <>
                  <SectionHeader label="Songs" count={grouped.songs.length} />
                  {grouped.songs.slice(0, 8).map((r) => (
                    <ResultRow
                      key={r.id}
                      result={r}
                      listenCounts={{}}
                      artistImages={artistImages}
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            results.map((r) => (
              <ResultRow
                key={r.id}
                result={r}
                listenCounts={{}}
                artistImages={artistImages}
              />
            ))
          )}
        </div>
      )}

      {/* No results */}
      {query && !isFetching && results.length === 0 && (
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
                  <div className="w-8 h-8 overflow-hidden bg-[#0a0a0d] border border-[#1a1a1f] flex-shrink-0 group-hover:border-[#00f0ff]/30">
                    {images[artist.id] ? (
                      <img
                        src={images[artist.id]}
                        alt={artist.name}
                        width={32}
                        height={32}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-all grayscale group-hover:grayscale-0"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <span className="text-[10px] font-mono">
                          {artist.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
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
