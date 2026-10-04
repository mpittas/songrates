"use client";

import { LuMessageSquare } from "react-icons/lu";

import Button from "@/components/ui/Button";

export const ALBUM_REVIEWS_SECTION_ID = "album-reviews";

export function scrollToAlbumReviews() {
  document
    .getElementById(ALBUM_REVIEWS_SECTION_ID)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function AlbumReviewsButton({ count }: { count: number }) {
  return (
    <Button
      variant="border"
      size="lg"
      onClick={scrollToAlbumReviews}
      iconLeft={<LuMessageSquare size={16} />}
      aria-label={`Reviews (${count})`}
      title="Jump to reviews"
    >
      <span className="tabular-nums">{count}</span>
    </Button>
  );
}
