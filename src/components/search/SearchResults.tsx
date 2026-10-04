"use client";

import { useState } from "react";
import InstantLink from "@/components/ui/InstantLink";
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
import { createSlug, cn, formatTime } from "@/lib/utils";

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
    <div className="sticky top-0 z-10 flex gap-1 border-b border-line bg-surface/95 px-2.5 py-2 backdrop-blur-md">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(cat.key)}
          className={cn(
            "h-7 cursor-pointer rounded-full px-3 text-xs font-medium transition-colors",
            active === cat.key
              ? "bg-ink text-white"
              : "text-ink-2 hover:bg-ink/[0.05] hover:text-ink",
          )}
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
        <IoDisc className="text-ink-3" size={18} />
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
      className={`h-full w-full object-cover ${rounded ? "rounded-full" : ""}`}
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
    <InstantLink
      href={`/artist/${createSlug(result.title, result.id)}`}
      onClick={onSelect}
      className={`group mx-1.5 flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-ink/[0.045]${reserveRightSpace ? " pr-9" : ""}`}
    >
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-subtle">
        <ArtworkImage
          url={result.artworkUrl}
          alt={result.title}
          rounded
          fallbackIcon={
            <IoPerson className="text-ink-3" size={18} />
          }
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="truncate text-sm font-medium text-ink">
          {result.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-ink-2">
          {result.genres && result.genres.length > 0
            ? result.genres.slice(0, 3).join(", ")
            : "Artist"}
        </p>
      </div>
      <span className="shrink-0 text-[11px] font-medium text-ink-3">
        Artist
      </span>
    </InstantLink>
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
  const slug = createSlug(result.title, result.id);

  return (
    <InstantLink
      href={`/album/${slug}`}
      onClick={onSelect}
      className={`group mx-1.5 flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-ink/[0.045]${reserveRightSpace ? " pr-9" : ""}`}
    >
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-subtle shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)]">
        <ArtworkImage url={result.artworkUrl} alt={result.title} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="truncate text-sm font-medium text-ink">
          {result.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-ink-2">
          {result.artistName || "Unknown Artist"}
          {result.releaseDate ? ` · ${result.releaseDate.slice(0, 4)}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-[11px] font-medium text-ink-3">
        {result.albumType || "Album"}
      </span>
    </InstantLink>
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
  const albumSlug = result.albumId
    ? createSlug(result.albumName || result.title, result.albumId)
    : null;
  const href = albumSlug ? `/album/${albumSlug}?track=${result.id}` : undefined;
  const rowClass = `group mx-1.5 flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-ink/[0.045]${reserveRightSpace ? " pr-9" : ""}`;

  const displayYear = result.releaseDate?.slice(0, 4) || "";

  const content = (
    <>
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-subtle shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)]">
        <ArtworkImage
          url={result.artworkUrl}
          alt={result.title}
          fallbackIcon={
            <IoMusicalNotes className="text-ink-3" size={18} />
          }
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="truncate text-sm font-medium text-ink">
          {result.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-ink-2">
          {result.artistName || "Unknown Artist"}
          {result.albumName ? ` · ${result.albumName}` : ""}
          {displayYear ? ` · ${displayYear}` : ""}
          {result.durationMs
            ? ` · ${formatTime(result.durationMs, "milliseconds")}`
            : ""}
        </p>
      </div>
      <span className="shrink-0 text-[11px] font-medium text-ink-3">
        Song
      </span>
    </>
  );

  if (href) {
    return (
      <InstantLink
        href={href}
        onClick={onSelect}
        scroll={false}
        className={rowClass}
      >
        {content}
      </InstantLink>
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
    <div className="px-4 pt-3 pb-1.5">
      <h2 className="eyebrow text-ink-3">
        {label}
        <span className="ml-1.5 opacity-70">{count}</span>
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
    ? "z-[9999] max-h-[min(65vh,560px)] w-full overflow-y-auto overscroll-contain rounded-2xl bg-white/95 pb-1.5 text-left text-ink shadow-pop backdrop-blur-xl"
    : "z-[9999] max-h-[min(65vh,560px)] w-full overflow-y-auto overscroll-contain rounded-2xl bg-surface pb-1.5 text-left shadow-pop";

  if (query.trim().length === 1) {
    return null;
  }

  // ─── No query: show recently clicked results (logged-in users only) ──
  if (!query) {
    if (!isFocused || history.length === 0) return null;

    return (
      <div className={panelClass}>
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
          <h2 className="eyebrow text-ink-3">Recent</h2>
          {onClearHistory && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onClearHistory}
              className="cursor-pointer text-xs font-medium text-ink-2 transition-colors hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>
        <div className="pt-1">
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
                  className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer rounded-full p-1 text-ink-3 transition-opacity hover:bg-ink/[0.06] hover:text-ink md:opacity-0 md:group-hover/recent:opacity-100"
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
        <div className="pt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mx-1.5 flex animate-pulse items-center gap-3 px-2.5 py-2">
              <div className="size-10 shrink-0 rounded-md bg-subtle" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3.5 w-2/5 rounded bg-subtle" />
                <div className="h-2.5 w-3/5 rounded bg-subtle/70" />
              </div>
              <div className="h-3 w-10 shrink-0 rounded bg-subtle" />
            </div>
          ))}
        </div>
      )}

      {/* Fetching indicator */}
      {query && isFetching && !showLoading && results.length > 0 && (
        <div className="h-0.5 overflow-hidden bg-ink/[0.06]">
          <div
            className="h-full w-1/3 bg-accent"
            style={{ animation: "searchSlide 1s ease-in-out infinite" }}
          />
        </div>
      )}

      {/* Results */}
      {query && !showLoading && results.length > 0 && (
        <div className="pt-1">
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
        <div className="px-4 py-10 text-center text-sm text-ink-2">
          No results for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
