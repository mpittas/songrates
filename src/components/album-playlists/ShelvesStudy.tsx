"use client";

import { useMemo, useState } from "react";

import CoverTile from "@/components/album-playlists/CoverTile";
import StudyCaption from "@/components/album-playlists/StudyCaption";
import StudyNote from "@/components/album-playlists/StudyNote";
import InstantLink from "@/components/ui/InstantLink";
import { playlistHref, type CollectionCardData } from "@/lib/albumCollections";
import type { StudySource } from "@/lib/loadAlbumPlaylistStudy";

export default function ShelvesStudy({
  collections,
  source,
}: {
  collections: CollectionCardData[];
  source: StudySource;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((collection) => {
      if (collection.name.toLowerCase().includes(q)) return true;
      return (collection.albumNames || []).some((name) =>
        name.toLowerCase().includes(q),
      );
    });
  }, [collections, query]);

  return (
    <main className="ap-shelves min-h-[calc(100vh-7rem)] bg-[#d5d8e0] text-[#16161a]">
      <header className="mx-auto max-w-[1240px] px-4 pt-10 pb-6 sm:px-6 sm:pt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="ap-font-redhat text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] font-black tracking-[-0.03em]">
              Shop shelves
            </h1>
            <p className="mt-2 max-w-md text-sm text-[#3a3d48]">
              One crate per rail. Spines on the left, jackets in a line — the
              record-shop way of looking at album playlists.
            </p>
          </div>
          <label className="sr-only" htmlFor="shelves-search">
            Search shelves
          </label>
          <input
            id="shelves-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search shelves"
            className="w-full max-w-xs border-0 border-b border-[#8b90a0] bg-transparent py-2 text-sm outline-hidden placeholder:text-[#5c6170] focus:border-[#16161a] sm:mb-1"
          />
        </div>
        <StudyNote
          source={source}
          className="mt-4 text-sm text-[#3a3d48]"
        />
      </header>

      {filtered.length === 0 ? (
        <p className="px-4 pb-20 text-center text-sm text-[#3a3d48]">
          No shelves match that search.
        </p>
      ) : (
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 pb-20 sm:px-6">
          {filtered.map((collection) => {
            const href = playlistHref(collection);
            const albums = (collection.albumNames || []).map((name, index) => ({
              name,
              artist: collection.artistNames?.[index] || "",
              art: collection.coverUrls[index],
              albumId: collection.albumIds?.[index],
            }));

            const spine = (
              <span className="ap-font-redhat flex h-full min-h-[10.5rem] w-full items-center justify-center px-2 text-center text-[13px] font-bold tracking-[0.14em] text-white uppercase sm:text-[15px]">
                <span className="ap-spine-type">{collection.name}</span>
              </span>
            );

            return (
              <section
                key={collection.id}
                className="grid grid-cols-1 overflow-hidden rounded-[10px] bg-[#eef0f5] shadow-[0_10px_28px_-18px_rgba(22,22,26,0.45)] sm:grid-cols-[4.25rem_minmax(0,1fr)]"
              >
                {href ? (
                  <InstantLink
                    href={href}
                    className="flex min-h-12 items-center bg-[#16161a] px-4 py-3 sm:min-h-[10.5rem] sm:px-0 sm:py-0"
                    aria-label={`Open ${collection.name}`}
                  >
                    {spine}
                  </InstantLink>
                ) : (
                  <div className="flex min-h-12 items-center bg-[#16161a] px-4 py-3 sm:min-h-[10.5rem] sm:px-0 sm:py-0">
                    {spine}
                  </div>
                )}

                <div className="ap-scroll-hide flex gap-3 overflow-x-auto px-4 py-4 sm:gap-4 sm:px-5">
                  {albums.length === 0 ? (
                    <p className="py-8 text-sm text-[#5c6170]">
                      Empty crate — add albums to fill this shelf.
                    </p>
                  ) : (
                    albums.map((album, index) => {
                      const tile = (
                        <>
                          <CoverTile
                            src={album.art}
                            alt={album.name}
                            className="aspect-square w-[8.5rem] rounded-[4px] shadow-[0_8px_18px_-12px_rgba(22,22,26,0.55)] motion-safe:transition-transform motion-safe:duration-200 sm:w-[9.5rem] group-hover:-translate-y-1"
                          />
                          <span className="mt-2 block w-[8.5rem] truncate text-[13px] font-semibold leading-tight sm:w-[9.5rem]">
                            {album.name}
                          </span>
                          {album.artist ? (
                            <span className="mt-0.5 block w-[8.5rem] truncate text-xs text-[#5c6170] sm:w-[9.5rem]">
                              {album.artist}
                            </span>
                          ) : null}
                        </>
                      );

                      return album.albumId ? (
                        <InstantLink
                          key={`${collection.id}-${album.albumId}-${index}`}
                          href={`/album/${album.albumId}`}
                          className="group w-[8.5rem] shrink-0 sm:w-[9.5rem]"
                        >
                          {tile}
                        </InstantLink>
                      ) : (
                        <div
                          key={`${collection.id}-album-${index}`}
                          className="group w-[8.5rem] shrink-0 sm:w-[9.5rem]"
                        >
                          {tile}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <StudyCaption
        name="Shelves"
        structure="Record-shop rails — vertical spines, jackets in a horizontal line."
        inspiredBy={{
          label: "Apple Music, decade shelves",
          href: "https://mobbin.com/screens/e0e5c85e-1854-4ba0-bd09-c1c80a7b4d95",
        }}
        tone="steel"
      />
    </main>
  );
}
