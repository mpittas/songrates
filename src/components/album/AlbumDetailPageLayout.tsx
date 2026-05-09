"use client";

import type { ReactNode } from "react";
import { FaPlay } from "react-icons/fa";
import { LuListMusic } from "react-icons/lu";

import MySection from "@/components/ui/MySection";
import OptimizedImage from "@/components/ui/OptimizedImage";
import SearchInput from "@/components/search/SearchInput";

export interface AlbumDetailPageLayoutProps {
  /** Renders above the max-width column (e.g. full-bleed read-only banner). */
  beforeConstrained?: ReactNode;
  topBarLeft: ReactNode;
  topBarRight?: ReactNode;
  artworkSrc: string;
  artworkAlt: string;
  onPlayClick: () => void;
  playLabel: string;
  title: ReactNode;
  /** Primary line under the title (artist link, curator, etc.). */
  subtitle?: ReactNode;
  /** Mono/meta row under the subtitle (badges, year, genres). */
  metaRow?: ReactNode;
  /** e.g. public + personal rating tiles */
  afterHero?: ReactNode;
  tracklistHeading?: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearchClear: () => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  searchFocused: boolean;
  trackRows: ReactNode;
  /** e.g. other album versions */
  bottom?: ReactNode;
  sectionClassName?: string;
}

export default function AlbumDetailPageLayout({
  beforeConstrained,
  topBarLeft,
  topBarRight,
  artworkSrc,
  artworkAlt,
  onPlayClick,
  playLabel,
  title,
  subtitle,
  metaRow,
  afterHero,
  tracklistHeading = "Tracklist",
  searchQuery,
  onSearchQueryChange,
  onSearchClear,
  onSearchFocus,
  onSearchBlur,
  searchFocused,
  trackRows,
  bottom,
  sectionClassName = "pb-24",
}: AlbumDetailPageLayoutProps) {
  return (
    <main className="min-h-screen text-neutral-900">
      <MySection className={sectionClassName} container={false}>
        <div className="absolute left-0 top-0 z-0 h-[500px] w-full bg-linear-to-b from-[#f0e5df] to-[#f0e5df]/0" />
        {beforeConstrained}

        <div className="relative z-10 mx-auto pt-10 w-full max-w-[1180px] px-4 sm:px-6">
          <div className="mb-12 flex flex-wrap items-center justify-between gap-3">
            {topBarLeft}
            <div className="flex items-center gap-3">{topBarRight}</div>
          </div>

          <div className="relative mb-8 flex flex-col items-start gap-8 md:flex-row md:gap-12">
            <div className="group relative w-40 shrink-0 self-start sm:w-52 md:w-72">
              <div className="relative aspect-square">
                <OptimizedImage
                  src={artworkSrc}
                  alt={artworkAlt}
                  fill
                  className="rounded-xl object-cover"
                  priority
                  fallbackText={artworkAlt?.slice(0, 2).toUpperCase() || "??"}
                  fallbackSrc="/vinyl-placeholder.svg"
                />
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-1 flex-col items-start justify-center pt-4">
              <button
                type="button"
                onClick={onPlayClick}
                className="group mb-8 flex cursor-pointer items-center gap-2 rounded-full bg-white p-3 transition-transform hover:scale-105"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e76418] text-white transition-transform group-hover:scale-105">
                  <FaPlay className="ml-1" size={12} />
                </div>
                <span className="text-lg font-bold tracking-tight text-black">
                  {playLabel}
                </span>
              </button>

              <h1 className="mb-4 text-3xl font-bold leading-11 tracking-tight text-neutral-900 md:text-4xl">
                {title}
              </h1>

              {subtitle != null ? subtitle : null}

              {metaRow != null ? (
                <div className="mb-6 flex w-full flex-wrap items-center gap-2 border-t border-neutral-950/10 pt-4 font-mono text-sm text-neutral-900">
                  {metaRow}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex min-w-[240px] shrink-0 flex-col gap-3" />
          </div>

          {afterHero}

          <div className="w-full">
            <div className="rounded-md">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LuListMusic size={18} />
                  <h3 className="text-xs uppercase">{tracklistHeading}</h3>
                </div>

                <div className="w-32 transition-all duration-300 focus-within:w-48">
                  <SearchInput
                    value={searchQuery}
                    onChange={onSearchQueryChange}
                    onClear={onSearchClear}
                    onFocus={onSearchFocus}
                    onBlur={onSearchBlur}
                    isFocused={searchFocused}
                    placeholder="search tracks..."
                    size="compact"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-y-1.5">{trackRows}</div>
            </div>
          </div>

          {bottom}
        </div>
      </MySection>
    </main>
  );
}
