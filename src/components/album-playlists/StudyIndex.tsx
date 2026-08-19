"use client";

import CoverCollage from "@/components/album-playlists/CoverCollage";
import CoverTile from "@/components/album-playlists/CoverTile";
import StudyNote from "@/components/album-playlists/StudyNote";
import InstantLink from "@/components/ui/InstantLink";
import type { CollectionCardData } from "@/lib/albumCollections";
import type { StudySource } from "@/lib/loadAlbumPlaylistStudy";

const STUDIES = [
  {
    href: "/album-playlists/releases",
    name: "Releases",
    structure:
      "Centered gallery of playlist jackets — every crate treated as a release.",
    inspiredBy: {
      label: "Record Club, Releases",
      href: "https://mobbin.com/screens/53fd0257-8ad0-4b7b-abc6-a29236257ca8",
    },
    tone: "light" as const,
  },
  {
    href: "/album-playlists/booth",
    name: "Booth",
    structure:
      "Listening-booth split: one crate on the counter, the rest as a dark index.",
    inspiredBy: {
      label: "YouTube Music, album + playlist",
      href: "https://mobbin.com/screens/97fa8af3-7b2e-415e-af34-4db73a86ae64",
    },
    tone: "dark" as const,
  },
  {
    href: "/album-playlists/shelves",
    name: "Shelves",
    structure:
      "Record-shop rails — vertical spines, jackets in a horizontal line.",
    inspiredBy: {
      label: "Apple Music, decade shelves",
      href: "https://mobbin.com/screens/e0e5c85e-1854-4ba0-bd09-c1c80a7b4d95",
    },
    tone: "steel" as const,
  },
] as const;

const INNER_STUDIES = [
  {
    href: "/album-playlists/stage",
    name: "Stage",
    structure:
      "Inner page — sticky crate on the left, numbered albums on the right.",
    inspiredBy: {
      label: "YouTube Music, album inner",
      href: "https://mobbin.com/screens/49f79604-7dd6-4801-b653-24be31062298",
    },
    tone: "stage" as const,
  },
  {
    href: "/album-playlists/folio",
    name: "Folio",
    structure:
      "Inner page — collector document with large jackets and a side rail.",
    inspiredBy: {
      label: "Record Club, playlist inner",
      href: "https://mobbin.com/screens/f11bf017-f7b6-4255-ae42-b1251896459b",
    },
    tone: "folio" as const,
  },
  {
    href: "/album-playlists/discs",
    name: "Discs",
    structure:
      "Inner page — circular cover carousel, names-only list underneath.",
    inspiredBy: {
      label: "Liven, playlist inner",
      href: "https://mobbin.com/screens/96c06dfa-c487-4193-ae14-a08b91f7dae2",
    },
    tone: "discs" as const,
  },
] as const;

export default function StudyIndex({
  collections,
  source,
}: {
  collections: CollectionCardData[];
  source: StudySource;
}) {
  const featured = collections[0];
  const covers = collections.flatMap((c) =>
    (c.coverUrls || []).filter((url): url is string => Boolean(url)),
  );

  return (
    <main className="bg-[#161616]">
      {source !== "user" ? (
        <div className="border-b border-white/10 px-4 py-3 text-center">
          <StudyNote source={source} className="text-sm text-white/65" />
        </div>
      ) : null}
      {STUDIES.map((study, index) => {
        const previewCovers = covers.slice(index * 5, index * 5 + 10);

        return (
          <InstantLink
            key={study.href}
            href={study.href}
            aria-label={`Open ${study.name} layout`}
            className={
              study.tone === "light"
                ? "block bg-[#f7f7f5] text-[#161616]"
                : study.tone === "dark"
                  ? "block bg-[#0c0c0c] text-[#f4f4f2]"
                  : "block bg-[#d5d8e0] text-[#16161a]"
            }
          >
            <article className="mx-auto grid min-h-[70vh] max-w-[1180px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-16">
              <div>
                <h2
                  className={
                    study.tone === "light"
                      ? "ap-font-bricolage text-[clamp(2.5rem,8vw,5rem)] leading-[0.88] font-extrabold tracking-[-0.03em]"
                      : study.tone === "dark"
                        ? "ap-font-shoulders text-[clamp(2.5rem,8vw,5rem)] leading-[0.86] font-extrabold tracking-[-0.03em] uppercase"
                        : "ap-font-redhat text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.9] font-black tracking-[-0.03em]"
                  }
                >
                  {study.name}
                </h2>
                <p
                  className={
                    study.tone === "dark"
                      ? "mt-4 max-w-md text-sm text-[#f4f4f2]/65"
                      : "mt-4 max-w-md text-sm text-current/70"
                  }
                >
                  {study.structure}{" "}
                  <span className="underline decoration-current/30 underline-offset-3">
                    Inspired by {study.inspiredBy.label}
                  </span>
                </p>
              </div>

              {study.tone === "light" ? (
                <ul className="grid grid-cols-5 gap-2">
                  {(previewCovers.length ? previewCovers : ["", "", "", "", ""] )
                    .slice(0, 10)
                    .map((src, i) => (
                      <li key={`${study.href}-${i}`}>
                        <CoverTile
                          src={src || undefined}
                          alt=""
                          className="aspect-square rounded-[4px]"
                          priority={index === 0 && i < 4}
                        />
                      </li>
                    ))}
                </ul>
              ) : null}

              {study.tone === "dark" ? (
                <div className="flex items-end gap-6">
                  <CoverCollage
                    urls={featured?.coverUrls || []}
                    alt=""
                    className="aspect-square w-full max-w-[16rem] rounded-[10px]"
                    priority={index === 0}
                  />
                  <ul className="hidden flex-1 space-y-2 sm:block">
                    {collections.slice(0, 4).map((collection) => (
                      <li
                        key={collection.id}
                        className="truncate border-b border-white/10 py-2 text-sm text-[#f4f4f2]/80"
                      >
                        {collection.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {study.tone === "steel" ? (
                <div className="flex overflow-hidden rounded-[8px] bg-[#eef0f5]">
                  <div className="flex w-12 items-center justify-center bg-[#16161a] sm:w-14">
                    <span className="ap-spine-type ap-font-redhat text-[11px] font-bold tracking-[0.16em] text-white uppercase">
                      {featured?.name || "Crate"}
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-hidden p-3">
                    {(featured?.coverUrls || []).slice(0, 4).map((src, i) => (
                      <CoverTile
                        key={`${study.href}-shelf-${i}`}
                        src={src}
                        alt=""
                        className="aspect-square w-24 shrink-0 rounded-[3px] sm:w-28"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          </InstantLink>
        );
      })}

      <section className="bg-[#161616] px-4 py-10 text-center text-[#f4f4f2] sm:px-6">
        <h2 className="ap-font-anybody text-[clamp(1.75rem,4vw,2.75rem)] leading-none font-extrabold tracking-[-0.03em]">
          Inner page
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
          Three ways to open a crate. Each URL is a full inner-page layout.
        </p>
      </section>

      {INNER_STUDIES.map((study) => {
        const names = featured?.albumNames || collections.map((c) => c.name);

        return (
          <InstantLink
            key={study.href}
            href={study.href}
            aria-label={`Open ${study.name} inner layout`}
            className={
              study.tone === "stage"
                ? "block bg-[#0b0b0d] text-[#f3efe8]"
                : study.tone === "folio"
                  ? "block bg-[#f4f5f8] text-[#17181c]"
                  : "block bg-[#eef3f7] text-[#13202e]"
            }
          >
            <article className="mx-auto grid min-h-[70vh] max-w-[1180px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-16">
              <div>
                <h2
                  className={
                    study.tone === "stage"
                      ? "ap-font-anybody text-[clamp(2.5rem,8vw,5rem)] leading-[0.88] font-extrabold tracking-[-0.03em] lowercase"
                      : study.tone === "folio"
                        ? "ap-font-gloock text-[clamp(2.5rem,8vw,5rem)] leading-[0.92] tracking-[-0.02em]"
                        : "ap-font-anek text-[clamp(2.5rem,8vw,5rem)] leading-[0.9] font-extrabold tracking-[-0.03em]"
                  }
                >
                  {study.name}
                </h2>
                <p className="mt-4 max-w-md text-sm text-current/70">
                  {study.structure}{" "}
                  <span className="underline decoration-current/30 underline-offset-3">
                    Inspired by {study.inspiredBy.label}
                  </span>
                </p>
              </div>

              {study.tone === "stage" ? (
                <div className="flex items-end gap-6">
                  <CoverCollage
                    urls={featured?.coverUrls || []}
                    alt=""
                    className="aspect-square w-full max-w-[14rem] rounded-[12px]"
                  />
                  <ul className="hidden flex-1 space-y-2 sm:block">
                    {names.slice(0, 4).map((name, i) => (
                      <li
                        key={`${name}-${i}`}
                        className="truncate border-b border-white/10 py-2 text-sm text-[#f3efe8]/75"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {study.tone === "folio" ? (
                <ul className="space-y-2">
                  {(featured?.coverUrls || ["", "", ""]).slice(0, 3).map((src, i) => (
                    <li
                      key={`${study.href}-${i}`}
                      className="flex items-center gap-3 rounded-[8px] bg-white px-2 py-2"
                    >
                      <CoverTile
                        src={src || undefined}
                        alt=""
                        className="size-14 rounded-[3px]"
                      />
                      <span className="truncate text-sm font-medium">
                        {featured?.albumNames?.[i] || "Album"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {study.tone === "discs" ? (
                <div className="flex items-center justify-center -space-x-6">
                  {(featured?.coverUrls || ["", "", ""]).slice(0, 3).map((src, i) => (
                    <CoverTile
                      key={`${study.href}-disc-${i}`}
                      src={src || undefined}
                      alt=""
                      className={
                        i === 1
                          ? "ap-disc relative z-10 size-28 rounded-full"
                          : "ap-disc size-20 rounded-full opacity-60"
                      }
                    />
                  ))}
                </div>
              ) : null}
            </article>
          </InstantLink>
        );
      })}
    </main>
  );
}
