"use client";

import type { ReactNode } from "react";
import { FaPlay } from "react-icons/fa";
import { LuChevronLeft } from "react-icons/lu";

import ArtworkColorWash from "@/components/layout/ArtworkColorWash";
import SearchInput from "@/components/search/SearchInput";
import Button from "@/components/ui/Button";
import InstantLink from "@/components/ui/InstantLink";
import SectionHeader from "@/components/ui/SectionHeader";
import Tilt3DImage from "@/components/ui/Tilt3DImage";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export interface CollectionDetailPageLayoutProps {
  /** Full-width notice above the hero (e.g. read-only ratings banner). */
  notice?: ReactNode;
  back?: { href: string; label: string };
  /** Secondary actions next to the play button (like, save, edit…). */
  actions?: ReactNode;
  artworkSrc: string;
  artworkAlt: string;
  onPlayClick?: () => void;
  playLabel?: string;
  playDisabled?: boolean;
  /** Small uppercase line above the title ("Album · 2026"). */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Primary line under the title (artist link, curator, etc.). */
  subtitle?: ReactNode;
  /** Muted facts under the subtitle (track count, genres…). */
  metaRow?: ReactNode;
  /** e.g. public + personal rating cards */
  afterHero?: ReactNode;
  listHeading?: string;
  listCount?: number;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchClear?: () => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  searchFocused?: boolean;
  searchPlaceholder?: string;
  list?: ReactNode;
  /** e.g. reviews, other album versions */
  bottom?: ReactNode;
}

export default function CollectionDetailPageLayout({
  notice,
  back,
  actions,
  artworkSrc,
  artworkAlt,
  onPlayClick,
  playLabel = "Play",
  playDisabled = false,
  eyebrow,
  title,
  subtitle,
  metaRow,
  afterHero,
  listHeading = "Tracklist",
  listCount,
  searchQuery = "",
  onSearchQueryChange,
  onSearchClear,
  onSearchFocus,
  onSearchBlur,
  searchFocused = false,
  searchPlaceholder = "Search tracks",
  list,
  bottom,
}: CollectionDetailPageLayoutProps) {
  const hasActions = Boolean(onPlayClick || actions);

  return (
    <main className="relative min-h-screen pb-12 text-ink">
      <ArtworkColorWash src={artworkSrc} />

      <div className={cn("relative z-10", PAGE_CONTAINER, "pt-4 sm:pt-6")}>
        {notice ? <div className="mb-4">{notice}</div> : null}

        {back ? (
          <InstantLink
            href={back.href}
            className="-ml-1 inline-flex max-w-full items-center gap-1 rounded-full py-1 pr-3 pl-1 text-sm font-medium text-ink-2 transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <LuChevronLeft size={17} aria-hidden className="shrink-0" />
            <span className="truncate">{back.label}</span>
          </InstantLink>
        ) : null}

        <header className="mt-5 flex flex-col items-center gap-6 text-center sm:mt-8 md:flex-row md:items-end md:gap-10 md:text-left">
          <div className="w-[min(68vw,280px)] shrink-0 md:w-60 lg:w-72">
            <div className="relative aspect-square rounded-2xl shadow-[0_28px_60px_-24px_rgb(21_20_19/0.55)]">
              <Tilt3DImage
                src={artworkSrc}
                alt={artworkAlt}
                fallbackText={artworkAlt?.slice(0, 2).toUpperCase() || "??"}
                fallbackSrc="/vinyl-placeholder.svg"
              />
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-1 flex-col items-center md:items-start md:pb-1">
            {eyebrow ? <p className="eyebrow text-ink-2">{eyebrow}</p> : null}
            <h1 className="mt-3 max-w-full font-display text-[2rem] leading-[1.05] font-semibold tracking-[-0.045em] text-balance break-words text-ink sm:text-5xl lg:text-[3.5rem]">
              {title}
            </h1>
            {subtitle != null ? (
              <div className="mt-3 text-base font-medium text-ink sm:text-lg">
                {subtitle}
              </div>
            ) : null}
            {metaRow != null ? (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-ink-2 md:justify-start">
                {metaRow}
              </div>
            ) : null}

            {hasActions ? (
              <div className="mt-6 flex w-full items-center justify-center gap-2 sm:w-auto md:justify-start">
                {onPlayClick ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={onPlayClick}
                    disabled={playDisabled}
                    iconLeft={<FaPlay size={13} />}
                    className="flex-1 sm:flex-none sm:px-7"
                  >
                    {playLabel}
                  </Button>
                ) : null}
                {actions}
              </div>
            ) : null}
          </div>
        </header>

        {afterHero ? <div className="mt-10 sm:mt-12">{afterHero}</div> : null}

        {list != null ? (
          <section className="mt-10 sm:mt-12">
            <SectionHeader
              title={listHeading}
              count={listCount}
              actions={
                onSearchQueryChange && onSearchClear ? (
                  <div className="w-36 transition-[width] duration-300 ease-out focus-within:w-52 sm:w-44 sm:focus-within:w-60">
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
                ) : undefined
              }
            />
            {list}
          </section>
        ) : null}

        {bottom}
      </div>
    </main>
  );
}

/** Dot separator for `metaRow` items. */
export function MetaDot() {
  return (
    <span aria-hidden className="text-ink-3/70">
      ·
    </span>
  );
}
