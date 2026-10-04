"use client";

import { LuEye } from "react-icons/lu";

import InstantLink from "@/components/ui/InstantLink";
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
    <div className="flex flex-col gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-lift sm:flex-row sm:items-center sm:justify-between sm:pl-5">
      <div className="flex min-w-0 items-center gap-3 text-sm leading-snug">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10">
          <LuEye size={15} />
        </span>
        <p className="min-w-0">
          {displayName ? (
            <>
              Viewing{" "}
              <InstantLink
                href={`/user/${displayName}`}
                className="font-semibold underline decoration-white/40 underline-offset-2 transition-colors hover:decoration-white"
              >
                @{displayName}
              </InstantLink>
              &apos;s ratings
            </>
          ) : (
            <span>Viewing another listener&apos;s ratings</span>
          )}
          <span className="text-white/55"> · Read only</span>
        </p>
      </div>
      <Button href={`/album/${slug}`} variant="white" size="sm">
        Show my ratings
      </Button>
    </div>
  );
}
