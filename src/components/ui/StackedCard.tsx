"use client";

import { useState } from "react";
import Link from "next/link";
import { artworkUrl } from "@/lib/appleMusic/api";
import { cn } from "@/lib/utils";
import OptimizedImage from "@/components/ui/OptimizedImage";
import StackedCardDropdown from "@/components/ui/StackedCardDropdown";

const MAIN_COVER_SIZE = 600;
const STACK_LAYER_SIZE = 48;

function resolveCoverUrl(url: string | undefined, size: number) {
  if (!url) return undefined;
  const resolved = artworkUrl(url, size);
  return resolved || url;
}

export interface StackedCardProps {
  title: string;
  itemCount: number;
  itemLabel?: string;
  href?: string;
  /** Up to 3 cover URLs: [front, middle, back] — front is the largest layer */
  coverUrls?: (string | undefined)[];
  className?: string;
  /** When set, shows a three-dots menu (edit + delete; caller should confirm before delete). */
  onEdit?: () => void;
  onDelete?: () => void;
}

function StackLayer({
  className,
  coverUrl,
  alt,
  lowQuality = false,
}: {
  className?: string;
  coverUrl?: string;
  alt: string;
  lowQuality?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[#e5e5e5]", className)}>
      {coverUrl ? (
        <>
          <OptimizedImage
            src={
              resolveCoverUrl(
                coverUrl,
                lowQuality ? STACK_LAYER_SIZE : MAIN_COVER_SIZE,
              ) ?? coverUrl
            }
            alt={alt}
            fill
            className={cn(
              "object-cover",
              lowQuality && "scale-110 blur-sm saturate-75 contrast-90",
            )}
            fallbackText="·"
          />
          {lowQuality ? (
            <div className="pointer-events-none absolute inset-0 bg-black/15" />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default function StackedCard({
  title,
  itemCount,
  itemLabel = "items",
  href,
  coverUrls = [],
  className,
  onEdit,
  onDelete,
}: StackedCardProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [front, middle, back] = coverUrls;
  const singular = itemLabel.endsWith("s") ? itemLabel.slice(0, -1) : itemLabel;
  const countLabel = `${itemCount} ${itemCount === 1 ? singular : itemLabel}`;

  const content = (
    <>
      <div className="relative mx-auto flex w-full flex-col items-center">
        {back ? (
          <StackLayer
            coverUrl={back}
            alt=""
            lowQuality
            className="z-0 h-2 w-[70%] shrink-0 rounded-t-lg rounded-b-none bg-[#c4c4c4]"
          />
        ) : (
          <div className="z-0 h-2 w-[70%] shrink-0 rounded-t-lg rounded-b-none bg-[#c4c4c4]" />
        )}

        {middle ? (
          <StackLayer
            coverUrl={middle}
            alt=""
            lowQuality
            className="z-[1] h-2 w-[85%] shrink-0 rounded-t-lg rounded-b-none bg-[#d6d6d6]"
          />
        ) : (
          <div className="z-[1] h-2 w-[85%] shrink-0 rounded-t-lg rounded-b-none bg-[#d6d6d6]" />
        )}

        <StackLayer
          coverUrl={front}
          alt={title}
          className="relative z-10 aspect-square w-full shrink-0 rounded-xl bg-[#e5e5e5]"
        />
      </div>

      <div className="mt-3 text-left">
        <h3 className="text-base font-bold text-neutral-900 truncate leading-tight">
          {title}
        </h3>
        <p className="mt-1 text-sm text-neutral-500">{countLabel}</p>
      </div>
    </>
  );

  const rootClassName = cn("group block w-full", className);

  const showOptionsMenu = Boolean(onEdit || onDelete);

  const optionsMenu = showOptionsMenu ? (
    <div
      className={cn(
        "absolute top-5 right-1 z-30 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100",
        optionsOpen && "opacity-100",
      )}
    >
      <StackedCardDropdown
        onEdit={onEdit ?? (() => {})}
        onDelete={onDelete ?? (() => {})}
        onOpenChange={setOptionsOpen}
      />
    </div>
  ) : null;

  if (href) {
    return (
      <div className={rootClassName}>
        <div className="relative">
          <Link href={href} className="block">
            {content}
          </Link>
          {optionsMenu}
        </div>
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      <div className="relative">
        {content}
        {optionsMenu}
      </div>
    </div>
  );
}
