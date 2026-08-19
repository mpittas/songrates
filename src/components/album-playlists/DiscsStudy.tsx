"use client";

import { useEffect, useMemo, useState } from "react";

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
  type StudyAlbum,
} from "@/lib/studyAlbums";
import { cn } from "@/lib/utils";

function Disc({
  album,
  size,
  active,
  onSelect,
}: {
  album: StudyAlbum;
  size: "side" | "front";
  active?: boolean;
  onSelect?: () => void;
}) {
  const href = albumPageHref(album);
  const front = size === "front";
  const className = cn(
    "ap-disc relative overflow-hidden rounded-full",
    front ? "size-[min(72vw,22rem)]" : "size-[min(38vw,11rem)]",
    !front && "opacity-55",
    active && "ap-disc-active",
  );

  const disc = (
    <>
      <CoverTile
        src={album.artworkUrl}
        alt={front ? album.title : ""}
        className="size-full rounded-full"
        priority={front}
      />
      <span className="ap-disc-hole pointer-events-none absolute inset-[43%] rounded-full" />
    </>
  );

  if (front && href) {
    return (
      <InstantLink
        href={href}
        className={cn(
          className,
          "block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#13202e]",
        )}
        aria-label={`Open ${album.title}`}
      >
        {disc}
      </InstantLink>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        className,
        "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#13202e]",
      )}
      aria-label={front ? album.title : `Show ${album.title}`}
    >
      {disc}
    </button>
  );
}

export default function DiscsStudy({
  collections,
  source,
}: {
  collections: CollectionCardData[];
  source: StudySource;
}) {
  const [crateId, setCrateId] = useState(collections[0]?.id ?? "");
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState("");

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

  useEffect(() => {
    setIndex(0);
  }, [crateId, query]);

  const safeIndex =
    filtered.length === 0 ? 0 : Math.min(index, filtered.length - 1);
  const current = filtered[safeIndex];
  const prev = filtered[safeIndex - 1];
  const next = filtered[safeIndex + 1];
  const palette = useArtworkPalette(current?.artworkUrl || "");
  const openHref = crate ? crateOpenHref(crate) : undefined;
  const wash = palette
    ? `radial-gradient(ellipse 70% 50% at 50% 18%, ${rgbToCss(palette.primary)}, transparent 62%), linear-gradient(180deg, color-mix(in srgb, ${rgbToCss(palette.secondary)} 28%, #e4edf4) 0%, #eef3f7 38%)`
    : undefined;

  if (!crate) {
    return (
      <main className="ap-discs min-h-[calc(100vh-7rem)] bg-[#eef3f7] px-4 py-16 text-[#13202e]">
        <p className="mx-auto max-w-md text-sm text-[#3d4d5c]">
          No album playlists to open.
        </p>
        <StudyNote source={source} className="mx-auto mt-3 max-w-md text-sm text-[#5a6b7a]" />
      </main>
    );
  }

  return (
    <main
      className="ap-discs min-h-[calc(100vh-7rem)] text-[#13202e]"
      style={{ backgroundColor: "#eef3f7", backgroundImage: wash }}
    >
      <div className="mx-auto max-w-[720px] px-4 pt-10 pb-16 sm:px-6 sm:pt-12">
        {collections.length > 1 ? (
          <div className="mb-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
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
                  }}
                  className={cn(
                    "cursor-pointer underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#13202e]",
                    active
                      ? "font-semibold text-[#13202e] underline"
                      : "text-[#3d4d5c] hover:text-[#13202e]",
                  )}
                >
                  {collection.name}
                </button>
              );
            })}
          </div>
        ) : null}

        <div
          className="relative flex items-center justify-center py-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#13202e]"
          tabIndex={0}
          role="region"
          aria-label="Album discs"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              setIndex((value) => Math.max(0, value - 1));
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              setIndex((value) => Math.min(filtered.length - 1, value + 1));
            }
          }}
        >
          {prev ? (
            <div className="absolute left-0 z-0 translate-x-[-8%] sm:left-4">
              <Disc album={prev} size="side" onSelect={() => setIndex(safeIndex - 1)} />
            </div>
          ) : (
            <span className="absolute left-0 size-[min(38vw,11rem)] sm:left-4" />
          )}

          {current ? (
            <div className="relative z-10">
              <Disc album={current} size="front" active />
            </div>
          ) : (
            <div className="ap-disc flex size-[min(72vw,22rem)] items-center justify-center rounded-full bg-[#d5dee6] text-sm text-[#5a6b7a]">
              No matching albums
            </div>
          )}

          {next ? (
            <div className="absolute right-0 z-0 translate-x-[8%] sm:right-4">
              <Disc album={next} size="side" onSelect={() => setIndex(safeIndex + 1)} />
            </div>
          ) : (
            <span className="absolute right-0 size-[min(38vw,11rem)] sm:right-4" />
          )}
        </div>

        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
            disabled={safeIndex === 0 || filtered.length === 0}
            className="cursor-pointer rounded-full px-3 py-1.5 text-sm text-[#3d4d5c] disabled:cursor-not-allowed disabled:opacity-30 hover:text-[#13202e] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#13202e]"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setIndex((value) => Math.min(filtered.length - 1, value + 1))
            }
            disabled={safeIndex >= filtered.length - 1}
            className="cursor-pointer rounded-full px-3 py-1.5 text-sm text-[#3d4d5c] disabled:cursor-not-allowed disabled:opacity-30 hover:text-[#13202e] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#13202e]"
          >
            Next
          </button>
        </div>

        <header className="mt-8 text-center">
          <h1 className="ap-font-anek text-[clamp(2rem,6vw,3.4rem)] leading-[1.05] font-extrabold tracking-[-0.03em]">
            {crate.name}
          </h1>
          <p className="mt-2 text-sm text-[#3d4d5c]">
            {crate.itemCount} {crate.itemCount === 1 ? "album" : "albums"}
            {current ? ` · ${current.title}` : ""}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {openHref ? (
              <InstantLink
                href={openHref}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-[#13202e] px-5 text-sm font-medium text-[#eef3f7] hover:bg-[#1c2e40] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#13202e]"
              >
                <PlayGlyph size={12} />
                Open crate
              </InstantLink>
            ) : null}
          </div>
          <StudyNote
            source={source}
            className="mx-auto mt-4 max-w-md text-sm text-[#5a6b7a]"
          />
        </header>

        <div className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <p className="text-sm text-[#3d4d5c]">In this crate</p>
            <label className="sr-only" htmlFor="discs-search">
              Search albums in this crate
            </label>
            <input
              id="discs-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find an album"
              className="w-40 border-0 border-b border-[#b7c4d0] bg-transparent py-1 text-right text-sm outline-hidden placeholder:text-[#7a8b9a] focus:border-[#13202e]"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#5a6b7a]">
              No albums match “{query}”.
            </p>
          ) : (
            <ol>
              {filtered.map((album, albumIndex) => {
                const href = albumPageHref(album);
                const active = albumIndex === safeIndex;
                const rowClass = cn(
                  "flex w-full items-baseline justify-between gap-4 border-b border-[#d3dce5] py-3.5 text-left",
                  active ? "text-[#13202e]" : "text-[#3d4d5c]",
                );
                const body = (
                  <>
                    <span className="min-w-0 truncate text-[16px] font-medium">
                      {album.title}
                    </span>
                    <span className="shrink-0 text-sm text-[#5a6b7a]">
                      {album.artist}
                    </span>
                  </>
                );

                return (
                  <li key={`${album.id}-${albumIndex}`}>
                    {href ? (
                      <InstantLink
                        href={href}
                        onMouseEnter={() => setIndex(albumIndex)}
                        onFocus={() => setIndex(albumIndex)}
                        className={cn(
                          rowClass,
                          "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#13202e]",
                        )}
                      >
                        {body}
                      </InstantLink>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIndex(albumIndex)}
                        className={cn(rowClass, "cursor-pointer")}
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <StudyCaption
        name="Discs"
        structure="Turn the crate like records: a circular cover carousel, names-only list underneath."
        inspiredBy={{
          label: "Liven, playlist inner",
          href: "https://mobbin.com/screens/96c06dfa-c487-4193-ae14-a08b91f7dae2",
        }}
        tone="mist"
      />
    </main>
  );
}
