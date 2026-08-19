"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const STUDIES = [
  { href: "/album-playlists", label: "Index" },
  { href: "/album-playlists/releases", label: "Releases" },
  { href: "/album-playlists/booth", label: "Booth" },
  { href: "/album-playlists/shelves", label: "Shelves" },
  { href: "/album-playlists/stage", label: "Stage" },
  { href: "/album-playlists/folio", label: "Folio" },
  { href: "/album-playlists/discs", label: "Discs" },
] as const;

export default function StudyNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Album playlist studies"
      className="sticky top-0 z-40 border-b border-black/10 bg-[#f2efed]/92 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1180px] items-center gap-3 overflow-x-auto px-4 py-3 sm:px-6">
        <Link
          href="/profile/album-playlist"
          className="shrink-0 text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
        >
          Current page
        </Link>
        <span className="shrink-0 text-neutral-300" aria-hidden>
          /
        </span>
        <ul className="flex min-w-0 items-center gap-1.5">
          {STUDIES.map((study) => {
            const active = pathname === study.href;

            return (
              <li key={study.href}>
                <Link
                  href={study.href}
                  className={cn(
                    "inline-flex shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-black/10 bg-white text-neutral-700 hover:border-black/20 hover:text-neutral-950",
                  )}
                >
                  {study.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
