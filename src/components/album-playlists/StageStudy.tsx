"use client";

import { useMemo, useState } from "react";

import CoverCollage from "@/components/album-playlists/CoverCollage";
import CoverTile from "@/components/album-playlists/CoverTile";
import PlayGlyph from "@/components/album-playlists/PlayGlyph";
import StudyCaption from "@/components/album-playlists/StudyCaption";
import StudyNote from "@/components/album-playlists/StudyNote";
import InstantLink from "@/components/ui/InstantLink";
import { useArtworkPalette } from "@/hooks/useArtworkPalette";
import type { CollectionCardData } from "@/lib/albumCollections";
import { rgbToCss } from "@/lib/artworkPalette";
import type { StudySource } from "@/lib/loadAlbumPlaylistStudy";
import {
  albumPageHref,
  albumsFromCollection,
  crateOpenHref,
} from "@/lib/studyAlbums";
import { cn } from "@/lib/utils";

export default function StageStudy({
  collections,
  source,
}: {
  collections: CollectionCardData[];
  source: StudySource;
}) {
  const [crateId, setCrateId] = useState(collections[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [litAlbumId, setLitAlbumId] = useState("");

  const crate =
    collections.find((collection) => collection.id === crateId) ??
    collections[0];
  const albums = useMemo(
    () => (crate ? albumsFromCollection(crate) : []),
    [crate],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return albums;
    return albums.filter(
      (album) =>
        album.title.toLowerCase().includes(q) ||
        album.artist.toLowerCase().includes(q),
    );
  }, [albums, query]);

  const litAlbum =
    albums.find((album) => album.id === litAlbumId) ?? albums[0];
  const palette = useArtworkPalette(
    litAlbum?.artworkUrl || crate?.coverUrls.find(Boolean) || "",
  );
  const openHref = crate ? crateOpenHref(crate) : undefined;

  if (!crate) {
    return (
      <main className="ap-stage min-h-[calc(100vh-7rem)] bg-[#0b0b0d] px-4 py-16 text-[#f3efe8]">
        <p className="mx-auto max-w-md text-sm text-[#f3efe8]/70">
          No album playlists to open.
        </p>
        <StudyNote source={source} className="mx-auto mt-3 max-w-md text-sm text-[#f3efe8]/55" />
      </main>
    );
  }

  return (
    <main
      className="ap-stage relative min-h-[calc(100vh-7rem)] overflow-hidden bg-[#0b0b0d] text-[#f3efe8]"
      style={
        palette
          ? {
              backgroundImage: `radial-gradient(ellipse 80% 55% at 18% 12%, ${rgbToCss(palette.primary)}, transparent 58%), linear-gradient(180deg, color-mix(in srgb, ${rgbToCss(palette.primary)} 42%, #0b0b0d) 0%, #0b0b0d 52%)`,
            }
          : undefined
      }
    >
      <div className="relative mx-auto grid max-w-[1180px] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14 lg:py-12">
        <section className="lg:sticky lg:top-24">
          <CoverCollage
            urls={crate.coverUrls}
            alt={crate.name}
            className="aspect-square w-full max-w-[26rem] rounded-[14px] shadow-[0_28px_64px_-30px_rgba(0,0,0,0.72)]"
            priority
          />
          <h1 className="ap-font-anybody mt-6 text-[clamp(2.1rem,6vw,3.75rem)] leading-[0.9] font-extrabold tracking-[-0.03em] lowercase">
            {crate.name}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
            <p className="text-sm text-[#f3efe8]/68">
              {crate.itemCount} {crate.itemCount === 1 ? "album" : "albums"}
            </p>
            {openHref ? (
              <InstantLink
                href={openHref}
                className="inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-[#f3efe8] text-[#0b0b0d] motion-safe:transition-transform motion-safe:duration-200 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f3efe8]"
                aria-label={`Open ${crate.name}`}
              >
                <PlayGlyph />
              </InstantLink>
            ) : null}
          </div>
          <StudyNote
            source={source}
            className="mt-4 max-w-sm text-sm text-[#f3efe8]/55"
          />

          {collections.length > 1 ? (
            <ul className="mt-8 hidden space-y-1 lg:block">
              {collections.map((collection) => {
                const active = collection.id === crate.id;
                return (
                  <li key={collection.id}>
                    <button
                      type="button"
                      aria-current={active ? "true" : undefined}
                      onClick={() => {
                        setCrateId(collection.id);
                        setQuery("");
                        setLitAlbumId("");
                      }}
                      className={cn(
                        "w-full cursor-pointer truncate border-b border-white/10 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f3efe8]",
                        active
                          ? "text-[#f3efe8]"
                          : "text-[#f3efe8]/45 hover:text-[#f3efe8]/80",
                      )}
                    >
                      {collection.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <p className="text-sm text-[#f3efe8]/68">
              {filtered.length}{" "}
              {filtered.length === 1 ? "album" : "albums"}
              {query.trim() ? " in this crate" : ""}
            </p>
            <label className="sr-only" htmlFor="stage-search">
              Search albums in this crate
            </label>
            <input
              id="stage-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find an album"
              className="w-40 border-0 border-b border-white/20 bg-transparent py-1 text-right text-sm text-[#f3efe8] outline-hidden placeholder:text-[#f3efe8]/35 focus:border-[#f3efe8] sm:w-52"
            />
          </div>

          {collections.length > 1 ? (
            <div className="mb-6 flex gap-2 overflow-x-auto ap-scroll-hide lg:hidden">
              {collections.map((collection) => {
                const active = collection.id === crate.id;
                return (
                  <button
                    key={collection.id}
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      setCrateId(collection.id);
                      setQuery("");
                      setLitAlbumId("");
                    }}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f3efe8]",
                      active
                        ? "bg-[#f3efe8] text-[#0b0b0d]"
                        : "bg-white/8 text-[#f3efe8]/75",
                    )}
                  >
                    {collection.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <p className="py-16 text-sm text-[#f3efe8]/55">
              No albums match “{query}”.
            </p>
          ) : (
            <ol className="divide-y divide-white/10">
              {filtered.map((album, index) => {
                const href = albumPageHref(album);
                const lit = album.id === litAlbum?.id;
                const rowClass = cn(
                  "flex w-full items-center gap-4 py-3 text-left motion-safe:transition-colors motion-safe:duration-200",
                  lit ? "text-[#f3efe8]" : "text-[#f3efe8]/78 hover:text-[#f3efe8]",
                );
                const body = (
                  <>
                    <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-[#f3efe8]/40">
                      {index + 1}
                    </span>
                    <CoverTile
                      src={album.artworkUrl}
                      alt=""
                      className="size-12 shrink-0 rounded-[4px]"
                      priority={index < 6}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">
                        {album.title}
                      </span>
                      <span className="block truncate text-[13px] text-[#f3efe8]/50">
                        {album.artist}
                      </span>
                    </span>
                  </>
                );

                return (
                  <li
                    key={`${album.id}-${index}`}
                    onMouseEnter={() => setLitAlbumId(album.id)}
                    onFocusCapture={() => setLitAlbumId(album.id)}
                  >
                    {href ? (
                      <InstantLink
                        href={href}
                        className={cn(
                          rowClass,
                          "rounded-[6px] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f3efe8]",
                        )}
                      >
                        {body}
                      </InstantLink>
                    ) : (
                      <div className={rowClass}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <StudyCaption
        name="Stage"
        structure="Sticky crate on the left, numbered albums on the right — the room lights shift as you scan."
        inspiredBy={{
          label: "YouTube Music, album inner",
          href: "https://mobbin.com/screens/49f79604-7dd6-4801-b653-24be31062298",
        }}
        tone="dark"
      />
    </main>
  );
}
