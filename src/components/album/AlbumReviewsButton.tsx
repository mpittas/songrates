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
      type="button"
      variant="secondary"
      size="xs"
      onClick={scrollToAlbumReviews}
      iconLeft={<LuMessageSquare size={14} className="mr-2" />}
    >
      REVIEWS ({count})
    </Button>
  );
}
