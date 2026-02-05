"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { IoMusicalNotes, IoDisc, IoPerson, IoFlame } from "react-icons/io5";

import { SearchResultsProps } from "@/types/search";
import type {
  SearchCategory,
  SearchResult,
  ArtistSearchResult,
  AlbumSearchResult,
  SongSearchResult,
  GroupedSearchResults,
} from "@/types/search";
import { ArtistVisit } from "@/types/artist";
import { getArtistHistory } from "@/lib/history";
import { formatTimeAgo, createSlug, formatTime } from "@/lib/utils";
import PrefetchLink from "@/components/ui/PrefetchLink";

// ─── Client-side Result Cache ──────────────────────────────────────────────────
// Caches results in memory so switching between tabs or re-typing a previous
// query is instant. No network request needed.

const resultCache = new Map<
  string,
  { results: SearchResult[]; grouped: GroupedSearchResults | null; ts: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    resultCache.delete(key);
    return null;
  }
  return entry;
}

function setCache(
  key: string,
  results: SearchResult[],
  grouped: GroupedSearchResults | null,
) {
  // Evict old entries if cache grows too large
  if (resultCache.size > 100) {
    const oldest = resultCache.keys().next().value;
    if (oldest) resultCache.delete(oldest);
  }
  resultCache.set(key, { results, grouped, ts: Date.now() });
}

// ─── ListenBrainz listen count cache ───────────────────────────────────────────
const listenCountCache = new Map<string, number>();

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

function ArtistRow({ result }: { result: ArtistSearchResult }) {
  return (
    <PrefetchLink
      href={`/artist/${createSlug(result.title, result.id)}`}
      artistId={result.id}
      className="flex items-center gap-3 p-3 hover:bg-[#0f0f12] transition-colors group"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0">
        <IoPerson
          className="text-neutral-600 group-hover:text-[#00f0ff]/60"
          size={18}
        />
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
}

function AlbumRow({ result }: { result: AlbumSearchResult }) {
  return (
    <Link
      href={`/album/${createSlug(result.title, result.id)}`}
      className="flex items-center gap-3 p-3 hover:bg-[#0f0f12] transition-colors group"
    >
      <div className="w-10 h-10 overflow-hidden bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0">
        <IoDisc
          className="text-neutral-600 group-hover:text-[#00f0ff]/60"
          size={18}
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

  const content = (
    <>
      <div className="w-10 h-10 overflow-hidden bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0">
        <IoMusicalNotes
          className="text-neutral-600 group-hover:text-[#00f0ff]/60"
          size={18}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate">
          {result.title}
        </h3>
        <p className="text-[11px] text-neutral-600 truncate mt-0.5">
          {result.artistName || "Unknown Artist"}
          {result.releaseGroupTitle ? ` · ${result.releaseGroupTitle}` : ""}
          {result.firstReleaseDate
            ? ` · ${result.firstReleaseDate.slice(0, 4)}`
            : ""}
          {result.length
            ? ` · ${formatTime(result.length, "milliseconds")}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {result.releaseCount > 0 && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#00f0ff]/5 text-[#00f0ff]/70 border border-[#00f0ff]/10"
            title={`Appears on ${result.releaseCount} releases (Fame Index)`}
          >
            {result.releaseCount} rel
          </span>
        )}
        {effectiveListenCount != null && effectiveListenCount > 0 && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-orange-500/10 text-orange-400/80 border border-orange-500/20 flex items-center gap-0.5"
            title={`${effectiveListenCount.toLocaleString()} total listens on ListenBrainz`}
          >
            <IoFlame size={10} />
            {effectiveListenCount >= 1000
              ? `${Math.round(effectiveListenCount / 1000)}k`
              : effectiveListenCount}
          </span>
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
}: {
  result: SearchResult;
  listenCounts: Map<string, number>;
}) {
  switch (result.type) {
    case "artist":
      return <ArtistRow result={result} />;
    case "album":
      return <AlbumRow result={result} />;
    case "song":
      return (
        <SongRow result={result} listenCount={listenCounts.get(result.id)} />
      );
    default:
      return null;
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SearchResults({
  query,
  onClose,
  isFocused,
}: SearchResultsProps & { isFocused: boolean }) {
  const [category, setCategory] = useState<SearchCategory>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [grouped, setGrouped] = useState<GroupedSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [listenCounts, setListenCounts] = useState<Map<string, number>>(
    new Map(),
  );

  // History state
  const [history, setHistory] = useState<ArtistVisit[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});

  // Track current request to prevent stale updates
  const requestIdRef = useRef(0);

  // ─── Fetch search results with client-side caching ─────────────────
  useEffect(() => {
    if (!query) {
      setResults([]);
      setGrouped(null);
      return;
    }

    const cacheKey = `${query}:${category}`;
    const cached = getCached(cacheKey);

    if (cached) {
      // Instant result from client cache
      setResults(cached.results);
      setGrouped(cached.grouped);
      setLoading(false);
      return;
    }

    const currentReqId = ++requestIdRef.current;
    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(query)}&category=${category}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        // Only update if this is still the latest request
        if (currentReqId !== requestIdRef.current) return;

        const newResults = data.results || [];
        const newGrouped = data.grouped || null;

        setResults(newResults);
        setGrouped(newGrouped);
        setCache(cacheKey, newResults, newGrouped);
      })
      .catch((err) => {
        if (
          err.name !== "AbortError" &&
          currentReqId === requestIdRef.current
        ) {
          console.error("Search fetch error:", err);
          setResults([]);
          setGrouped(null);
        }
      })
      .finally(() => {
        if (currentReqId === requestIdRef.current) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [query, category]);

  // ─── Lazy ListenBrainz enrichment ──────────────────────────────────
  // Fires AFTER main results are rendered, enriches songs with listen counts.
  useEffect(() => {
    if (results.length === 0) return;

    const songResults = results.filter(
      (r): r is SongSearchResult => r.type === "song",
    );
    if (songResults.length === 0) return;

    // Only enrich songs that aren't already cached
    const toEnrich = songResults
      .slice(0, 5)
      .map((s) => s.id)
      .filter((id) => !listenCountCache.has(id));

    if (toEnrich.length === 0) {
      // All cached — update state from cache
      const fromCache = new Map<string, number>();
      songResults.forEach((s) => {
        const cached = listenCountCache.get(s.id);
        if (cached !== undefined) fromCache.set(s.id, cached);
      });
      if (fromCache.size > 0) {
        setListenCounts((prev) => new Map([...prev, ...fromCache]));
      }
      return;
    }

    // Fire-and-forget enrichment (non-blocking)
    fetch("/api/search/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mbids: toEnrich }),
    })
      .then((res) => res.json())
      .then((data) => {
        const counts = data.counts || {};
        const newCounts = new Map<string, number>();

        Object.entries(counts).forEach(([id, count]) => {
          listenCountCache.set(id, count as number);
          newCounts.set(id, count as number);
        });

        // Also include previously cached counts
        songResults.forEach((s) => {
          const cached = listenCountCache.get(s.id);
          if (cached !== undefined) newCounts.set(s.id, cached);
        });

        setListenCounts((prev) => new Map([...prev, ...newCounts]));
      })
      .catch(() => {
        // Silently fail — enrichment is optional
      });
  }, [results]);

  // ─── History when focused and empty ────────────────────────────────
  useEffect(() => {
    if (isFocused && !query) {
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
    }
  }, [isFocused, query]);

  if (!query && (!isFocused || history.length === 0)) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-[#0a0a0d] border-x border-b border-[#1a1a1f] z-[9999] max-h-[420px] overflow-y-auto shadow-2xl">
      {/* Category Filter Tabs */}
      {query && <CategoryTabs active={category} onChange={setCategory} />}

      {/* Loading */}
      {query && loading && (
        <div className="flex items-center justify-center py-12 text-neutral-600 font-mono text-sm tracking-widest uppercase">
          <span>Searching...</span>
        </div>
      )}

      {/* Results */}
      {query && !loading && results.length > 0 && (
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
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            results.map((r) => (
              <ResultRow key={r.id} result={r} listenCounts={listenCounts} />
            ))
          )}
        </div>
      )}

      {/* No results */}
      {query && !loading && results.length === 0 && (
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
