"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import ListenCountBadge from "@/components/ui/ListenCountBadge";
import Badge from "@/components/ui/Badge";
import { usePrefetchAlbum } from "@/hooks/useAlbumInfo";

// ─── Album classification helper ────────────────────────────────────────────

const OTHER_ALBUM_SECONDARY_TYPES = [
  "Soundtrack",
  "Live",
  "Remix",
  "DJ-mix",
  "Mixtape/Street",
  "Spokenword",
  "Interview",
  "Audiobook",
  "Audio drama",
  "Demo",
];

function classifyAlbum(result: AlbumSearchResult): "album" | "other" | "ep" {
  if (result.primaryType === "EP") return "ep";
  const secondary = result.secondaryTypes || [];
  if (secondary.some((t) => OTHER_ALBUM_SECONDARY_TYPES.includes(t)))
    return "other";
  return "album";
}

function getAlbumTypeLabel(result: AlbumSearchResult): string {
  const kind = classifyAlbum(result);
  if (kind === "ep") return "EP";
  if (kind === "other") {
    const secondary = result.secondaryTypes || [];
    const match = secondary.find((t) =>
      OTHER_ALBUM_SECONDARY_TYPES.includes(t),
    );
    return match || "Other album";
  }
  return "Album";
}

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
}

// ─── Individual Result Row Components ──────────────────────────────────────────

// ─── Cover Art Archive helper ────────────────────────────────────────────────

function CoverArtImage({
  releaseGroupId,
  alt,
  rounded = false,
}: {
  releaseGroupId: string;
  alt: string;
  rounded?: boolean;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !releaseGroupId) {
    return (
      <IoDisc
        className="text-neutral-600 group-hover:text-[#00f0ff]/60"
        size={18}
      />
    );
  }

  return (
    <img
      src={`https://coverartarchive.org/release-group/${releaseGroupId}/front-250`}
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

function ArtistRow({
  result,
  imageUrl,
}: {
  result: ArtistSearchResult;
  imageUrl?: string;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <PrefetchLink
      href={`/artist/${createSlug(result.title, result.id)}`}
      artistId={result.id}
      className="flex items-center gap-3 p-3 hover:bg-[#0f0f12] transition-colors group"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={result.title}
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-all grayscale group-hover:grayscale-0 rounded-full"
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
          {result.tags && result.tags.length > 0
            ? ` · ${result.tags.join(", ")}`
            : ""}
          {result.disambiguation ? ` · ${result.disambiguation}` : ""}
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
        <CoverArtImage releaseGroupId={result.id} alt={result.title} />
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
        {getAlbumTypeLabel(result)}
      </span>
    </Link>
  );
}

function SongRow({
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
      <div className="w-10 h-10 overflow-hidden bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0">
        {result.releaseGroupId ? (
          <CoverArtImage
            releaseGroupId={result.releaseGroupId}
            alt={result.releaseGroupTitle || result.title}
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
        {result.releaseType && (
          <Badge variant="green" title={`From: ${result.releaseType}`}>
            {result.releaseType}
          </Badge>
        )}
        {effectiveListenCount != null && effectiveListenCount > 0 && (
          <ListenCountBadge listenCount={effectiveListenCount} />
        )}
        <span className="text-[10px] text-neutral-600 font-mono uppercase tracking-wider">
          Song
        </span>
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

function ResultRow({
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
  const [images, setImages] = useState<Record<string, string>>({});

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

  // ─── Fetch artist images when search results change ───────────────
  useEffect(() => {
    const artistIds = results
      .filter((r) => r.type === "artist")
      .map((r) => r.id);
    if (artistIds.length === 0) return;

    const newIds = artistIds.filter((id) => !images[id]);
    if (newIds.length === 0) return;

    fetch(`/api/images/artists?ids=${newIds.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.images) {
          setImages((prev) => ({ ...prev, ...data.images }));
        }
      })
      .catch((e) => console.error(e));
  }, [results]);

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

  // ─── Extract LastFM listen counts from search results ───────────────────
  const listenCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach((result) => {
      if (
        result.type === "song" &&
        result.listenCount != null &&
        result.listenCount > 0
      ) {
        counts[result.id] = result.listenCount;
      }
    });
    return counts;
  }, [results]);

  // ─── Determine loading state ───────────────────────────────────────
  // Show loading spinner when fetching if we have no results to show
  // (even if we have placeholder data, if it's empty, we should show loading instead of blank)
  const showLoading = isFetching && results.length === 0;

  if (!query && (!isFocused || history.length === 0)) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-[#0a0a0d] border-x border-b border-[#1a1a1f] z-[9999] max-h-[420px] overflow-y-auto shadow-2xl">
      {/* Category Filter Tabs */}
      {query && <CategoryTabs active={category} onChange={setCategory} />}

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
                      listenCounts={listenCounts}
                      artistImages={images}
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
                      listenCounts={listenCounts}
                      artistImages={images}
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
                      listenCounts={listenCounts}
                      artistImages={images}
                    />
                  ))}
                </>
              )}
            </>
          ) : category === "album" ? (
            (() => {
              const albums = results.filter(
                (r): r is AlbumSearchResult => r.type === "album",
              );
              const mainAlbums = albums.filter(
                (r) => classifyAlbum(r) === "album",
              );
              const otherAlbums = albums.filter(
                (r) => classifyAlbum(r) === "other",
              );
              const eps = albums.filter((r) => classifyAlbum(r) === "ep");
              return (
                <>
                  {mainAlbums.length > 0 && (
                    <>
                      <SectionHeader label="Albums" count={mainAlbums.length} />
                      {mainAlbums.map((r) => (
                        <ResultRow
                          key={r.id}
                          result={r}
                          listenCounts={listenCounts}
                          artistImages={images}
                        />
                      ))}
                    </>
                  )}
                  {otherAlbums.length > 0 && (
                    <>
                      <SectionHeader
                        label="Other albums"
                        count={otherAlbums.length}
                      />
                      {otherAlbums.map((r) => (
                        <ResultRow
                          key={r.id}
                          result={r}
                          listenCounts={listenCounts}
                          artistImages={images}
                        />
                      ))}
                    </>
                  )}
                  {eps.length > 0 && (
                    <>
                      <SectionHeader label="EPs" count={eps.length} />
                      {eps.map((r) => (
                        <ResultRow
                          key={r.id}
                          result={r}
                          listenCounts={listenCounts}
                          artistImages={images}
                        />
                      ))}
                    </>
                  )}
                </>
              );
            })()
          ) : (
            results.map((r) => (
              <ResultRow
                key={r.id}
                result={r}
                listenCounts={listenCounts}
                artistImages={images}
              />
            ))
          )}
        </div>
      )}

      {/* No results — only show when fetch completed and no placeholder data is being shown */}
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
