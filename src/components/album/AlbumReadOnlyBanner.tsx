"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

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
        backgroundColor: "#0f0f0f",
        backgroundImage: `repeating-linear-gradient(
                -36deg,
                transparent,
                transparent 5px,
                rgba(255, 255, 255, 0.018) 3px,
                rgba(255, 255, 255, 0.018) 10px
              )`,
      }}
    >
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="text-sm leading-snug text-white">
          <span className="text-white/70">Read only · </span>
          {displayName ? (
            <>
              Viewing ratings by{" "}
              <Link
                href={`/user/${displayName}`}
                className="text-white underline decoration-white/40 underline-offset-2 transition-colors hover:decoration-white"
              >
                @{displayName}
              </Link>
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
