"use client";

import { useMemo, useState } from "react";

import CoverCollage from "@/components/album-playlists/CoverCollage";
import StudyCaption from "@/components/album-playlists/StudyCaption";
import StudyNote from "@/components/album-playlists/StudyNote";
import InstantLink from "@/components/ui/InstantLink";
import { useArtworkPalette } from "@/hooks/useArtworkPalette";
import { playlistHref, type CollectionCardData } from "@/lib/albumCollections";
import { rgbToCss } from "@/lib/artworkPalette";
import type { StudySource } from "@/lib/loadAlbumPlaylistStudy";
import { cn } from "@/lib/utils";

export default function BoothStudy({
  collections,
  source,
}: {
  collections: CollectionCardData[];
  source: StudySource;
}) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(collections[0]?.id ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((collection) =>
      collection.name.toLowerCase().includes(q),
    );
  }, [collections, query]);

  const staged =
    filtered.find((collection) => collection.id === activeId) ?? filtered[0];
  const palette = useArtworkPalette(staged?.coverUrls.find(Boolean) || "");
  const href = staged ? playlistHref(staged) : undefined;

  return (
    <main
      className="ap-booth relative min-h-[calc(100vh-7rem)] overflow-hidden bg-[#0c0c0c] text-[#f4f4f2]"
      style={
        palette
          ? {
              backgroundColor: "#0c0c0c",
              backgroundImage: `radial-gradient(ellipse 90% 60% at 16% 18%, ${rgbToCss(palette.primary)}, transparent 62%), linear-gradient(180deg, color-mix(in srgb, ${rgbToCss(palette.primary)} 38%, #0c0c0c) 0%, #0c0c0c 58%)`,
            }
          : undefined
      }
    >
      <div className="relative mx-auto grid max-w-[1180px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-12 lg:py-12">
        {staged ? (
          <section className="lg:sticky lg:top-24">
            <CoverCollage
              urls={staged.coverUrls}
              alt={staged.name}
              className="aspect-square w-full max-w-[28rem] rounded-[12px] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.7)]"
              priority
            />
            <h1 className="ap-font-shoulders mt-6 text-[clamp(2.25rem,6.5vw,4.25rem)] leading-[0.86] font-extrabold tracking-[-0.03em] uppercase">
              {staged.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
              <p className="text-sm text-[#f4f4f2]/65">
                {staged.itemCount}{" "}
                {staged.itemCount === 1 ? "album" : "albums"}
              </p>
              {href ? (
                <InstantLink
                  href={href}
                  className="inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-white text-black motion-safe:transition-transform motion-safe:duration-200 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
                  aria-label={`Open ${staged.name}`}
                >
                  <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
                    <path d="M4 2.2v13.6L15.2 9 4 2.2Z" fill="currentColor" />
                  </svg>
                </InstantLink>
              ) : null}
            </div>
            <StudyNote
              source={source}
              className="mt-3 max-w-md text-sm text-[#f4f4f2]/55"
            />
          </section>
        ) : (
          <p className="text-sm text-[#f4f4f2]/60">No playlists to stage.</p>
        )}

        <section>
          <label className="sr-only" htmlFor="booth-search">
            Find a crate
          </label>
          <input
            id="booth-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a crate"
            className="w-full border-0 border-b border-white/15 bg-transparent py-3 text-sm text-[#f4f4f2] outline-hidden placeholder:text-[#f4f4f2]/35 focus:border-white/55"
          />

          {filtered.length === 0 ? (
            <p className="mt-8 text-sm text-[#f4f4f2]/50">
              No crates match that search.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-white/8">
              {filtered.map((collection) => {
                const selected = staged?.id === collection.id;
                return (
                  <li key={collection.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(collection.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-4 py-3.5 text-left motion-safe:transition-colors motion-safe:duration-150",
                        selected
                          ? "bg-white/8"
                          : "hover:bg-white/4",
                      )}
                    >
                      <CoverCollage
                        urls={collection.coverUrls}
                        alt=""
                        className="size-14 shrink-0 rounded-[4px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[15px]",
                            selected ? "text-white" : "text-[#f4f4f2]/90",
                          )}
                        >
                          {collection.name}
                        </span>
                        <span className="block text-xs text-[#f4f4f2]/45">
                          {collection.itemCount}{" "}
                          {collection.itemCount === 1 ? "album" : "albums"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <StudyCaption
        name="Booth"
        structure="Listening-booth split: one crate on the counter, the rest as a dark index."
        inspiredBy={{
          label: "YouTube Music, album + playlist",
          href: "https://mobbin.com/screens/97fa8af3-7b2e-415e-af34-4db73a86ae64",
        }}
        tone="dark"
      />
    </main>
  );
}
