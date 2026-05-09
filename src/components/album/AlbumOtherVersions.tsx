"use client";

import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { createSlug } from "@/lib/utils";
import type { AlbumInfo } from "@/types/music";

type OtherVersion = NonNullable<AlbumInfo["otherVersions"]>[number];

export interface AlbumOtherVersionsProps {
  versions: OtherVersion[] | undefined;
}

export default function AlbumOtherVersions({ versions }: AlbumOtherVersionsProps) {
  if (!versions?.length) return null;

  return (
    <div className="mt-10 w-full">
      <h3 className="mb-4 font-mono text-xs uppercase tracking-wide text-neutral-600">
        other versions
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {versions.map((version) => {
          const versionSlug = createSlug(version.name, version.id);
          return (
            <Link key={version.id} href={`/album/${versionSlug}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded-md border border-[#dddddd] bg-white transition-colors group-hover:border-[#c9c9c9]">
                <OptimizedImage
                  src={version.artworkUrl || "/vinyl-placeholder.svg"}
                  alt={version.name}
                  fill
                  className="object-cover"
                  fallbackSrc="/vinyl-placeholder.svg"
                />
              </div>
              <div className="mt-2">
                <p className="truncate text-sm text-neutral-900 transition-colors group-hover:text-black">
                  {version.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-neutral-600">
                  {version.releaseDate?.slice(0, 4) || ""}
                  {version.type ? ` · ${version.type}` : ""}
                  {version.trackCount ? ` · ${version.trackCount} tracks` : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
