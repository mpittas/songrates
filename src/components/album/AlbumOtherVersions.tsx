"use client";

import CardRail from "@/components/ui/CardRail";
import MediaCard from "@/components/ui/MediaCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { createSlug } from "@/lib/utils";
import type { AlbumInfo } from "@/types/music";

type OtherVersion = NonNullable<AlbumInfo["otherVersions"]>[number];

export interface AlbumOtherVersionsProps {
  versions: OtherVersion[] | undefined;
}

export default function AlbumOtherVersions({ versions }: AlbumOtherVersionsProps) {
  if (!versions?.length) return null;

  return (
    <section className="mt-12 w-full sm:mt-16">
      <SectionHeader title="Other versions" count={versions.length} />
      <CardRail columns={6}>
        {versions.map((version) => (
          <MediaCard
            key={version.id}
            href={`/album/${createSlug(version.name, version.id)}`}
            imageUrl={version.artworkUrl}
            title={version.name}
            subtitle={[
              version.releaseDate?.slice(0, 4),
              version.type,
              version.trackCount ? `${version.trackCount} tracks` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        ))}
      </CardRail>
    </section>
  );
}
