import { NextRequest, NextResponse } from "next/server";

// Convert Wikimedia Commons URL to a thumbnail URL
// Example: https://commons.wikimedia.org/wiki/Special:FilePath/Image.jpg
// becomes: https://commons.wikimedia.org/wiki/Special:FilePath/Image.jpg?width=200
function toThumbnailUrl(imageUrl: string, width: number = 200): string {
  if (
    imageUrl.includes("commons.wikimedia.org") ||
    imageUrl.includes("upload.wikimedia.org")
  ) {
    // Add width parameter to get a resized thumbnail
    const separator = imageUrl.includes("?") ? "&" : "?";
    return `${imageUrl}${separator}width=${width}`;
  }
  return imageUrl;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json({ images: {} });
  }

  const ids = idsParam.split(",").filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ images: {} });
  }

  // Construct SPARQL query (Wikidata)
  // P434 is MusicBrainz Artist ID
  // P18 is Image
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

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SongRates/1.0 (mpittas@gmail.com)",
        Accept: "application/json",
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!res.ok) {
      console.error("Wikidata API Error:", res.status);
      return NextResponse.json({ images: {} });
    }

    const data = await res.json();
    const images: Record<string, string> = {};

    data.results.bindings.forEach((binding: any) => {
      const mbid = binding.mbid.value;
      const imageUrl = binding.image.value;
      // Wikidata returns http urls sometimes, prefer https if possible (though usually they handle it)
      // Images are usually standard URLs.
      if (mbid && imageUrl) {
        images[mbid] = toThumbnailUrl(imageUrl);
      }
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to fetch images from Wikidata:", error);
    return NextResponse.json({ images: {} });
  }
}
