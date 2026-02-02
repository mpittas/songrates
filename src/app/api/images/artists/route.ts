import { NextRequest } from "next/server";
import { imageCache } from "@/lib/cache";
import { successResponse, handleApiRequest } from "@/lib/api-utils";
import { toThumbnailUrl } from "@/lib/musicbrainz";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";

interface WikidataBinding {
  mbid: { value: string };
  image: { value: string };
}

async function fetchArtistImages(ids: string[]) {
  const idsString = ids.map((id) => `"${id}"`).join(" ");
  const query = `
    SELECT ?mbid ?image WHERE {
      VALUES ?mbid { ${idsString} }
      ?item wdt:P434 ?mbid .
      ?item wdt:P18 ?image .
    }
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(
    query,
  )}&format=json`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": MB_USER_AGENT,
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`Wikidata API Error: ${res.status}`);
  }

  const data = await res.json();
  const images: Record<string, string> = {};

  data.results.bindings.forEach((binding: WikidataBinding) => {
    const mbid = binding.mbid.value;
    const imageUrl = binding.image.value;
    if (mbid && imageUrl) {
      images[mbid] = toThumbnailUrl(imageUrl);
    }
  });

  // Cache individual image URLs for 7 days
  Object.entries(images).forEach(([mbid, url]) => {
    imageCache.set(`artist-image:${mbid}`, url, 604800);
  });

  return { images };
}

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");

  if (!idsParam) {
    return successResponse({ images: {} }, "image");
  }

  const ids = idsParam.split(",").filter(Boolean);
  if (ids.length === 0) {
    return successResponse({ images: {} }, "image");
  }

  return handleApiRequest(
    () => fetchArtistImages(ids),
    "Failed to fetch artist images",
    "image",
  );
}
