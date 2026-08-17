"use client";

import InstantLink from "@/components/ui/InstantLink";
import Button from "@/components/ui/Button";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export interface AlbumReadOnlyBannerProps {
  slug: string;
  viewingUserName: string | null;
  fallbackUserName: string | null;
}

export default function AlbumReadOnlyBanner({
  slug,
  viewingUserName,
  fallbackUserName,
}: AlbumReadOnlyBannerProps) {
  const displayName = viewingUserName || fallbackUserName;

  return (
    <div
      className="relative z-10 w-full py-3.5 sm:py-4"
      style={{
        backgroundColor: "#5d2301",
        backgroundImage: `repeating-linear-gradient(
                -36deg,
                transparent,
                transparent 5px,
                rgba(255, 255, 255, 0.018) 3px,
                rgba(255, 255, 255, 0.018) 10px
              )`,
      }}
    >
      <div
        className={cn(
          PAGE_CONTAINER,
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        <div className="text-sm leading-snug text-white">
          <span className="text-white/70">Read only · </span>
          {displayName ? (
            <>
              Viewing ratings by{" "}
              <InstantLink
                href={`/user/${displayName}`}
                className="text-white underline decoration-white/40 underline-offset-2 transition-colors hover:decoration-white"
              >
                @{displayName}
              </InstantLink>
            </>
          ) : (
            <span>Viewing another user&apos;s ratings</span>
          )}
        </div>
        <Button
          href={`/album/${slug}`}
          variant="border"
          size="sm"
          className="shrink-0 self-start border-0 bg-white text-neutral-950 hover:bg-neutral-100 sm:self-auto"
        >
          My ratings
        </Button>
      </div>
    </div>
  );
}
