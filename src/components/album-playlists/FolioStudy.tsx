"use client";

import { useMemo, useState } from "react";

import CoverCollage from "@/components/album-playlists/CoverCollage";
import CoverTile from "@/components/album-playlists/CoverTile";
import StudyCaption from "@/components/album-playlists/StudyCaption";
import StudyNote from "@/components/album-playlists/StudyNote";
import InstantLink from "@/components/ui/InstantLink";
import type { CollectionCardData } from "@/lib/albumCollections";
import type { StudySource } from "@/lib/loadAlbumPlaylistStudy";
import {
  albumPageHref,
  albumsFromCollection,
  crateOpenHref,
} from "@/lib/studyAlbums";
import { cn } from "@/lib/utils";

function crateDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FolioStudy({
  collections,
  source,
}: {
  collections: CollectionCardData[];
  source: StudySource;
}) {
  const [crateId, setCrateId] = useState(collections[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [inspectedId, setInspectedId] = useState("");

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

  const inspected =
    albums.find((album) => album.id === inspectedId) ?? albums[0];
  const openHref = crate ? crateOpenHref(crate) : undefined;
  const inspectedHref = inspected ? albumPageHref(inspected) : undefined;
  const updated = crateDate(crate?.updatedAt);
  const others = collections.filter((collection) => collection.id !== crate?.id);

  if (!crate) {
    return (
      <main className="ap-folio min-h-[calc(100vh-7rem)] bg-[#f4f5f8] px-4 py-16 text-[#17181c]">
        <p className="mx-auto max-w-md text-sm text-[#4a4d57]">
          No album playlists to open.
        </p>
        <StudyNote source={source} className="mx-auto mt-3 max-w-md text-sm text-[#5c6070]" />
      </main>
    );
  }

  return (
    <main className="ap-folio min-h-[calc(100vh-7rem)] bg-[#f4f5f8] text-[#17181c]">
      <div className="mx-auto max-w-[1180px] px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="ap-font-gloock text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.95] tracking-[-0.02em]">
              {crate.name}
            </h1>
            <p className="mt-3 text-sm text-[#4a4d57]">
              {crate.itemCount} {crate.itemCount === 1 ? "album" : "albums"}
              {updated ? ` · Updated ${updated}` : ""}
            </p>
            <StudyNote
              source={source}
              className="mt-3 text-sm text-[#5c6070]"
            />
          </div>
          <label className="sr-only" htmlFor="folio-search">
            Search albums in this crate
          </label>
          <input
            id="folio-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search albums"
            className="w-full max-w-xs border-0 border-b border-[#c5c8d2] bg-transparent py-2 text-sm text-[#17181c] outline-hidden placeholder:text-[#8a8e9a] focus:border-[#2546d8] lg:text-right"
          />
        </div>

        <div className="mt-10 grid gap-10 pb-16 lg:grid-cols-[minmax(0,1fr)_16.5rem] lg:items-start">
          <ol className="space-y-2">
            {filtered.length === 0 ? (
              <li className="py-16 text-sm text-[#5c6070]">
                No albums match “{query}”.
              </li>
            ) : (
              filtered.map((album, index) => {
                const href = albumPageHref(album);
                const active = album.id === inspected?.id;
                const row = (
                  <>
                    <CoverTile
                      src={album.artworkUrl}
                      alt=""
                      className="size-[4.75rem] shrink-0 rounded-[3px] sm:size-24"
                      priority={index < 4}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[11px] tabular-nums text-[#8a8e9a]">
                        {index + 1}
                      </span>
                      <span className="mt-0.5 block truncate text-[17px] font-semibold leading-snug">
                        {album.title}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-[#4a4d57]">
                        {album.artist}
                      </span>
                    </span>
                  </>
                );

                return (
                  <li key={`${album.id}-${index}`}>
                    {href ? (
                      <InstantLink
                        href={href}
                        onMouseEnter={() => setInspectedId(album.id)}
                        onFocus={() => setInspectedId(album.id)}
                        className={cn(
                          "flex items-center gap-4 rounded-[8px] px-2 py-2 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2546d8] sm:px-3",
                          active ? "bg-white" : "hover:bg-white/70",
                        )}
                      >
                        {row}
                      </InstantLink>
                    ) : (
                      <div
                        className={cn(
                          "flex items-center gap-4 rounded-[8px] px-2 py-2 sm:px-3",
                          active ? "bg-white" : "",
                        )}
                      >
                        {row}
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ol>

          <aside className="space-y-4 lg:sticky lg:top-24">
            {inspected ? (
              <div className="overflow-hidden rounded-[10px] bg-white">
                <CoverTile
                  src={inspected.artworkUrl}
                  alt={inspected.title}
                  className="aspect-square"
                  priority
                />
                <div className="p-4">
                  <p className="truncate text-[15px] font-semibold">
                    {inspected.title}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-[#4a4d57]">
                    {inspected.artist}
                  </p>
                  {inspectedHref ? (
                    <InstantLink
                      href={inspectedHref}
                      className="mt-3 inline-flex cursor-pointer text-sm font-medium text-[#2546d8] underline-offset-3 hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2546d8]"
                    >
                      Open album
                    </InstantLink>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="rounded-[10px] bg-white p-4">
              {openHref ? (
                <InstantLink
                  href={openHref}
                  className="inline-flex w-full cursor-pointer items-center justify-center rounded-[8px] bg-[#17181c] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2a2c33] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2546d8]"
                >
                  Open this crate
                </InstantLink>
              ) : (
                <p className="text-sm text-[#5c6070]">This crate has no link yet.</p>
              )}
              <p className="mt-3 text-sm text-[#4a4d57]">
                Showing {filtered.length} of {albums.length} albums.
              </p>
            </div>

            {others.length > 0 ? (
              <div className="rounded-[10px] bg-white p-4">
                <p className="text-sm font-medium text-[#17181c]">Other crates</p>
                <ul className="mt-3 space-y-3">
                  {others.slice(0, 4).map((collection) => (
                    <li key={collection.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCrateId(collection.id);
                          setQuery("");
                          setInspectedId("");
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2546d8]"
                      >
                        <CoverCollage
                          urls={collection.coverUrls}
                          alt=""
                          className="size-11 shrink-0 rounded-[4px]"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {collection.name}
                          </span>
                          <span className="block text-[12px] text-[#5c6070]">
                            {collection.itemCount === 1
                              ? "1 album"
                              : `${collection.itemCount} albums`}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      <StudyCaption
        name="Folio"
        structure="Collector document: large jackets in a list, inspected cover in the rail, other crates beside it."
        inspiredBy={{
          label: "Record Club, playlist inner",
          href: "https://mobbin.com/screens/f11bf017-f7b6-4255-ae42-b1251896459b",
        }}
        tone="light"
      />
    </main>
  );
}
