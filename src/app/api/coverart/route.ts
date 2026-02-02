import { NextRequest } from "next/server";
import { handleApiRequest, successResponse } from "@/lib/api-utils";

async function fetchCoverArt(id: string) {
  const res = await fetch(`https://coverartarchive.org/release-group/${id}`, {
    next: { revalidate: 86400 },
  });

  if (!res.ok) return { url: null };

  const data = await res.json();
  const image =
    data.images?.find((img: { front?: boolean }) => img.front) ||
    data.images?.[0];

  return {
    url:
      image?.thumbnails?.["250"] ||
      image?.thumbnails?.small ||
      image?.image ||
      null,
  };
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return successResponse({ url: null }, "image");
  }

  return handleApiRequest(
    () => fetchCoverArt(id),
    "Failed to fetch cover art",
    "image",
  );
}
