"use client";

import type { ReactNode } from "react";
import { FaPlay } from "react-icons/fa";
import { LuListMusic } from "react-icons/lu";

import MySection from "@/components/ui/MySection";
import Tilt3DImage from "@/components/ui/Tilt3DImage";
import SearchInput from "@/components/search/SearchInput";
import { PAGE_CONTAINER, PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export interface CollectionDetailPageLayoutProps {
  /** Renders above the max-width column (e.g. full-bleed read-only banner). */
  beforeConstrained?: ReactNode;
  topBarLeft: ReactNode;
  topBarRight?: ReactNode;
  artworkSrc: string;
  artworkAlt: string;
  onPlayClick?: () => void;
  playLabel?: string;
  playDisabled?: boolean;
  title: ReactNode;
  /** Primary line under the title (artist link, curator, etc.). */
  subtitle?: ReactNode;
  /** Mono/meta row under the subtitle (badges, year, genres). */
  metaRow?: ReactNode;
  /** e.g. public + personal rating tiles */
  afterHero?: ReactNode;
  listHeading?: string;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchClear?: () => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  searchFocused?: boolean;
  searchPlaceholder?: string;
  list?: ReactNode;
  /** e.g. other album versions */
  bottom?: ReactNode;
  sectionClassName?: string;
}

export default function CollectionDetailPageLayout({
  beforeConstrained,
  topBarLeft,
  topBarRight,
  artworkSrc,
  artworkAlt,
  onPlayClick,
  playLabel = "Play",
  playDisabled = false,
  title,
  subtitle,
  metaRow,
  afterHero,
  listHeading = "Tracklist",
  searchQuery = "",
  onSearchQueryChange,
  onSearchClear,
  onSearchFocus,
  onSearchBlur,
  searchFocused = false,
  searchPlaceholder = "search tracks...",
  list,
  bottom,
  sectionClassName = "pb-24",
}: CollectionDetailPageLayoutProps) {
  return (
    <main className="min-h-screen text-neutral-900">
      <MySection className={sectionClassName} container={false}>
        <div className="absolute left-0 top-0 z-0 h-[500px] w-full bg-linear-to-b from-[#f0e5df] to-[#f0e5df]/0" />
        {beforeConstrained}

        <div className={cn("relative z-10", PAGE_CONTAINER, PAGE_CONTENT_TOP)}>
          <div className="mb-12 flex flex-wrap items-center justify-between gap-3">
            {topBarLeft}
            <div className="flex items-center gap-3">{topBarRight}</div>
          </div>

          <div className="relative mb-8 flex flex-col items-start gap-8 md:flex-row md:gap-12">
            <div className="group relative w-full shrink-0 self-start sm:w-52 md:w-72">
              <div className="relative aspect-square">
                <Tilt3DImage
                  src={artworkSrc}
                  alt={artworkAlt}
                  fallbackText={artworkAlt?.slice(0, 2).toUpperCase() || "??"}
                  fallbackSrc="/vinyl-placeholder.svg"
                />
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-1 flex-col items-start justify-center md:pt-4">
              {onPlayClick ? (
                <button
                  type="button"
                  onClick={onPlayClick}
                  disabled={playDisabled}
                  className={cn(
                    "group mb-5 flex w-full cursor-pointer items-center gap-2 rounded-full bg-white p-3 transition-transform md:mb-8 md:w-auto",
                    playDisabled
                      ? "cursor-not-allowed opacity-40"
                      : "hover:scale-105",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e76418] text-white transition-transform group-hover:scale-105 group-disabled:group-hover:scale-100">
                    <FaPlay className="ml-1" size={12} />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-black">
                    {playLabel}
                  </span>
                </button>
              ) : null}

              <h1 className="mb-4 text-3xl leading-9 font-bold tracking-tight text-neutral-900 md:text-4xl md:leading-11">
                {title}
              </h1>

              {subtitle != null ? subtitle : null}

              {metaRow != null ? (
                <div className="flex w-full flex-wrap items-center gap-2 border-t border-neutral-950/10 pt-4 font-mono text-sm text-neutral-900 md:mb-6">
                  {metaRow}
                </div>
              ) : null}
            </div>
          </div>

          {afterHero}

          {list != null ? (
            <div className="w-full">
              <div className="rounded-md">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LuListMusic size={18} />
                    <h3 className="text-xs uppercase">{listHeading}</h3>
                  </div>

                  {onSearchQueryChange && onSearchClear ? (
                    <div className="w-32 transition-all duration-300 focus-within:w-48">
                      <SearchInput
                        value={searchQuery}
                        onChange={onSearchQueryChange}
                        onClear={onSearchClear}
                        onFocus={onSearchFocus}
                        onBlur={onSearchBlur}
                        isFocused={searchFocused}
                        placeholder={searchPlaceholder}
                        size="compact"
                      />
                    </div>
                  ) : null}
                </div>

                {list}
              </div>
            </div>
          ) : null}

          {bottom}
        </div>
      </MySection>
    </main>
  );
}
