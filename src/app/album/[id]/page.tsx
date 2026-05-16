"use client";

import { useParams, useSearchParams } from "next/navigation";
import AlbumPageContent from "@/components/album/AlbumPageContent";
import { resolveAlbumId } from "@/lib/resolveAlbumId";

export default function AlbumPage() {
  const { id: rawSlug } = useParams();
  const searchParams = useSearchParams();

  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const albumId = slug ? resolveAlbumId(slug) : undefined;

  return (
    <AlbumPageContent
      slug={slug}
      albumId={albumId}
      viewingUserId={searchParams.get("userId")}
      highlightTrackId={searchParams.get("track")}
      fallbackUserName={searchParams.get("userName")}
    />
  );
}
