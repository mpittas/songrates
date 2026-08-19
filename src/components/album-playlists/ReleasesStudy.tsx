"use client";

import { useMemo, useState } from "react";

import CoverCollage from "@/components/album-playlists/CoverCollage";
import StudyCaption from "@/components/album-playlists/StudyCaption";
import StudyNote from "@/components/album-playlists/StudyNote";
import InstantLink from "@/components/ui/InstantLink";
import { playlistHref, type CollectionCardData } from "@/lib/albumCollections";
import type { StudySource } from "@/lib/loadAlbumPlaylistStudy";
import { cn } from "@/lib/utils";

type SortKey = "all" | "heaviest" | "newest";

export default function ReleasesStudy({
  collections,
  source,
}: {
  collections: CollectionCardData[];
  source: StudySource;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = collections.filter((collection) =>
      q ? collection.name.toLowerCase().includes(q) : true,
    );

    if (sort === "heaviest") {
      return [...next].sort((a, b) => b.itemCount - a.itemCount);
    }
    if (sort === "newest") {
      return [...next].sort((a, b) =>
        (b.updatedAt || "").localeCompare(a.updatedAt || ""),
      );
    }
    return next;
  }, [collections, query, sort]);

  return (
    <main className="ap-releases min-h-[calc(100vh-7rem)] bg-[#f7f7f5] text-[#161616]">
      <header className="mx-auto max-w-[1180px] px-4 pt-10 pb-8 sm:px-6 sm:pt-14">
        <h1 className="ap-font-bricolage text-center text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9] font-extrabold tracking-[-0.03em]">
          Album playlists
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-[#5c5c5c]">
          Every crate as a release. Covers first, names second.
        </p>
        <StudyNote
          source={source}
          className="mx-auto mt-3 max-w-xl text-center text-sm text-[#6a6a6a]"
        />

        <div className="mt-8 flex flex-col items-center gap-4">
          <div
            role="tablist"
            aria-label="Sort playlists"
            className="flex rounded-full bg-[#ecece8] p-1"
          >
            {(
              [
                ["all", "All"],
                ["heaviest", "Heaviest"],
                ["newest", "Newest"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={sort === key}
                onClick={() => setSort(key)}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  sort === key
                    ? "bg-[#ece6ff] text-[#3c2e8a]"
                    : "text-[#5c5c5c] hover:text-[#161616]",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="sr-only" htmlFor="releases-search">
            Search playlists
          </label>
          <input
            id="releases-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search playlists"
            className="w-full max-w-sm border-0 border-b border-[#cfcfc8] bg-transparent px-0 py-2 text-center text-sm text-[#161616] outline-hidden placeholder:text-[#8a8a84] focus:border-[#3c2e8a]"
          />
        </div>

        <p className="mt-6 text-center text-xs tracking-[0.04em] text-[#7a7a74]">
          Showing {filtered.length} of {collections.length}
        </p>
      </header>

      {filtered.length === 0 ? (
        <p className="px-4 pb-20 text-center text-sm text-[#6a6a6a]">
          No playlists match that search.
        </p>
      ) : (
        <ul className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-5 gap-y-9 px-4 pb-16 sm:grid-cols-3 sm:px-6 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((collection, index) => {
            const href = playlistHref(collection);
            const card = (
              <>
                <CoverCollage
                  urls={collection.coverUrls}
                  alt={collection.name}
                  className="aspect-square rounded-[6px] motion-safe:transition-[filter] motion-safe:duration-200 group-hover:brightness-[0.96] group-focus-visible:brightness-[0.96]"
                  priority={index < 4}
                />
                <span className="mt-2.5 block truncate text-[15px] font-semibold leading-tight text-[#161616] group-hover:underline group-hover:underline-offset-3">
                  {collection.name}
                </span>
                <span className="mt-0.5 block text-[13px] text-[#6a6a6a]">
                  {collection.itemCount}{" "}
                  {collection.itemCount === 1 ? "album" : "albums"}
                </span>
              </>
            );

            return (
              <li
                key={collection.id}
                className="ap-release-item"
                style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
              >
                {href ? (
                  <InstantLink
                    href={href}
                    className="group block rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3c2e8a]"
                  >
                    {card}
                  </InstantLink>
                ) : (
                  <div className="group">{card}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <StudyCaption
        name="Releases"
        structure="Centered gallery of playlist jackets — every crate treated as a release."
        inspiredBy={{
          label: "Record Club, Releases",
          href: "https://mobbin.com/screens/53fd0257-8ad0-4b7b-abc6-a29236257ca8",
        }}
        tone="light"
      />
    </main>
  );
}
