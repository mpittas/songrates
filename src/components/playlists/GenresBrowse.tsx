"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft } from "react-icons/fa6";

import OptimizedImage from "@/components/ui/OptimizedImage";
import {
  artworkUrl,
  type ApplePlaylistResult,
  type BrowsePill,
  type BrowseSubgenre,
} from "@/lib/appleMusic/api";
import { groupGenrePills } from "@/lib/genreGroups";
import { cn } from "@/lib/utils";
import PlaylistCard from "@/main-components/PlaylistCard";

function coverForGenre(pill: BrowsePill): string {
  const art = pill.playlists.find((playlist) => playlist.artworkUrl)?.artworkUrl;
  return artworkUrl(art, 600);
}

function genreTint(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360} 32% 22%)`;
}

function GenreTile({
  pill,
  priority,
}: {
  pill: BrowsePill;
  priority?: boolean;
}) {
  const cover = coverForGenre(pill);

  return (
    <Link
      href={`/genres?g=${pill.key}`}
      prefetch={false}
      className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-900 outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900"
    >
      {cover ? (
        <OptimizedImage
          src={cover}
          alt=""
          fill
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          fallbackSrc="/vinyl-placeholder.svg"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: genreTint(pill.label) }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <span className="absolute bottom-3 left-3 right-3 text-[15px] font-medium tracking-tight text-white sm:bottom-3.5 sm:left-3.5 sm:text-base">
        {pill.label}
      </span>
    </Link>
  );
}

function useSubgenrePlaylists(subgenre: BrowseSubgenre | undefined) {
  const [playlists, setPlaylists] = useState<ApplePlaylistResult[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subgenre) {
      setPlaylists(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setPlaylists(null);

    fetch(`/api/browse-playlists?q=${encodeURIComponent(subgenre.query)}`)
      .then((res) => (res.ok ? res.json() : { playlists: [] }))
      .then((data: { playlists?: ApplePlaylistResult[] }) => {
        if (!cancelled) setPlaylists(data.playlists ?? []);
      })
      .catch(() => {
        if (!cancelled) setPlaylists([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subgenre]);

  return { playlists, loading };
}

export default function GenresBrowse({ pills }: { pills: BrowsePill[] }) {
  const searchParams = useSearchParams();
  const activeKey = searchParams.get("g");
  const subKey = searchParams.get("s");
  const activePill = pills.find((pill) => pill.key === activeKey);
  const subgenre = activePill?.subgenres?.find((style) => style.key === subKey);
  const { playlists: subPlaylists, loading: subLoading } =
    useSubgenrePlaylists(subgenre);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (window.location.hash && !activeKey) return;
    window.scrollTo(0, 0);
  }, [activeKey, subKey]);

  const visiblePills = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return pills;
    return pills.filter(
      (pill) =>
        pill.label.toLowerCase().includes(q) ||
        pill.subgenres?.some((style) => style.label.toLowerCase().includes(q)),
    );
  }, [filter, pills]);

  const sections = useMemo(
    () => groupGenrePills(visiblePills),
    [visiblePills],
  );

  if (activePill) {
    const shownPlaylists = subgenre
      ? (subPlaylists ?? [])
      : activePill.playlists;
    const count = shownPlaylists.length;
    const heading = subgenre?.label ?? activePill.label;

    return (
      <div className="animate-fade-in-up">
        <div>
          <Link
            href="/genres"
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <FaChevronLeft size={11} />
            All genres
          </Link>
          <h1 className="mt-2 text-4xl font-medium tracking-tight text-neutral-950 sm:text-5xl">
            {heading}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {subLoading
              ? "Loading playlists"
              : `${count} curated playlist${count === 1 ? "" : "s"}`}
          </p>
        </div>

        {activePill.subgenres && activePill.subgenres.length > 0 ? (
          <nav
            aria-label={`${activePill.label} styles`}
            className="mt-6 flex flex-wrap gap-1.5"
          >
            <Link
              href={`/genres?g=${activePill.key}`}
              prefetch={false}
              className={cn(
                "rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
                !subgenre
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:text-neutral-900",
              )}
            >
              All
            </Link>
            {activePill.subgenres.map((style) => (
              <Link
                key={style.key}
                href={`/genres?g=${activePill.key}&s=${style.key}`}
                prefetch={false}
                className={cn(
                  "rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
                  style.key === subgenre?.key
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:text-neutral-900",
                )}
                aria-current={style.key === subgenre?.key ? "page" : undefined}
              >
                {style.label}
              </Link>
            ))}
          </nav>
        ) : null}

        {subLoading ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-xl bg-neutral-900/10"
              />
            ))}
          </div>
        ) : count > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shownPlaylists.map((playlist, index) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
            No playlists found for this style.
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-medium tracking-tight text-neutral-950 sm:text-5xl">
            Genres
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {pills.length} Apple Music styles, grouped by sound, place, and
            moment.
          </p>
        </div>
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Filter styles</span>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter styles"
            className="w-full rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </label>
      </div>

      {sections.length > 1 && !filter.trim() ? (
        <nav
          aria-label="Genre groups"
          className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5 text-sm"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="font-medium text-neutral-500 transition-colors hover:text-neutral-900"
            >
              {section.title}
            </a>
          ))}
        </nav>
      ) : null}

      {sections.length > 0 ? (
        <div className="mt-10 flex flex-col gap-14">
          {sections.map((section, sectionIndex) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-8"
            >
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium tracking-tight text-neutral-950">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {section.description}
                  </p>
                </div>
                <p className="pb-0.5 text-sm text-neutral-400">
                  {section.pills.length}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
                {section.pills.map((pill, index) => (
                  <GenreTile
                    key={pill.key}
                    pill={pill}
                    priority={sectionIndex === 0 && index < 6}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          No styles match “{filter.trim()}”.
        </div>
      )}
    </div>
  );
}
