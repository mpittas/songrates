"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LuSearchX } from "react-icons/lu";

import SearchInput from "@/components/search/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import FilterChips from "@/components/ui/FilterChips";
import MySection from "@/components/ui/MySection";
import OptimizedImage from "@/components/ui/OptimizedImage";
import PageHeader from "@/components/ui/PageHeader";
import SectionHeader from "@/components/ui/SectionHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import {
  artworkUrl,
  type ApplePlaylistResult,
  type BrowsePill,
  type BrowseSubgenre,
} from "@/lib/appleMusic/api";
import { groupGenrePills } from "@/lib/genreGroups";
import PlaylistCard from "@/main-components/PlaylistCard";

const PLAYLIST_GRID =
  "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 lg:grid-cols-5";

function coverForGenre(pill: BrowsePill): string {
  const art = pill.playlists.find((playlist) => playlist.artworkUrl)?.artworkUrl;
  return artworkUrl(art, 600);
}

function genreTint(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, hsl(${hue} 38% 30%), hsl(${(hue + 40) % 360} 32% 16%))`;
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
      className="group relative isolate aspect-square overflow-hidden rounded-xl bg-ink outline-offset-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {cover ? (
        <OptimizedImage
          src={cover}
          alt=""
          fill
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          fallbackSrc="/vinyl-placeholder.svg"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: genreTint(pill.label) }}
        >
          <div className="explore-hero-noise absolute inset-0 opacity-20 mix-blend-overlay" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/[0.06] ring-inset"
      />
      <span className="absolute right-3 bottom-3 left-3 font-display text-base leading-tight font-semibold tracking-[-0.02em] text-white sm:right-4 sm:bottom-3.5 sm:left-4 sm:text-[17px]">
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

function GenreFilterInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full sm:w-72">
      <SearchInput
        value={value}
        onChange={onChange}
        onClear={() => onChange("")}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        isFocused={focused}
        placeholder="Filter styles"
        size="small"
      />
    </div>
  );
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
    const styles = activePill.subgenres ?? [];

    return (
      <div className="animate-fade-in-up">
        <PageHeader
          back={{ href: "/genres", label: "All genres" }}
          eyebrow={subgenre ? activePill.label : "Genre"}
          title={heading}
          description={
            subLoading
              ? "Loading playlists…"
              : `${count} curated playlist${count === 1 ? "" : "s"}`
          }
          tight={styles.length > 0}
        />

        <MySection className="pb-10">
          {styles.length > 0 ? (
            <FilterChips
              ariaLabel={`${activePill.label} styles`}
              activeKey={subgenre?.key ?? "all"}
              items={[
                { key: "all", label: "All", href: `/genres?g=${activePill.key}` },
                ...styles.map((style) => ({
                  key: style.key,
                  label: style.label,
                  href: `/genres?g=${activePill.key}&s=${style.key}`,
                })),
              ]}
              className="mb-6 sm:mb-8"
            />
          ) : null}

          {subLoading ? (
            <CardGridSkeleton count={10} columns={5} />
          ) : count > 0 ? (
            <div className={PLAYLIST_GRID}>
              {shownPlaylists.map((playlist, index) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<LuSearchX size={22} />}
              title="No playlists for this style yet"
              description="Try another style, or browse the whole genre."
            />
          )}
        </MySection>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Browse"
        title="Genres"
        description={`${pills.length} Apple Music styles, grouped by sound, place, and moment.`}
        actions={<GenreFilterInput value={filter} onChange={setFilter} />}
        tight={sections.length > 1 && !filter.trim()}
      />

      <MySection className="pb-10">
        {sections.length > 1 && !filter.trim() ? (
          <FilterChips
            ariaLabel="Genre groups"
            activeKey={null}
            items={sections.map((section) => ({
              key: section.id,
              label: section.title,
              href: `#${section.id}`,
              count: section.pills.length,
            }))}
            className="mb-8 sm:mb-10"
          />
        ) : null}

        {sections.length > 0 ? (
          <div className="flex flex-col gap-12 sm:gap-16">
            {sections.map((section, sectionIndex) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-[calc(var(--header-h)+5rem)] md:scroll-mt-[calc(var(--header-h)+2rem)]"
              >
                <SectionHeader
                  title={section.title}
                  description={section.description}
                  count={section.pills.length}
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
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
          <EmptyState
            icon={<LuSearchX size={22} />}
            title={`No styles match “${filter.trim()}”`}
            description="Check the spelling or try a broader genre."
          />
        )}
      </MySection>
    </div>
  );
}
