import { NextRequest, NextResponse } from "next/server";
import { albumCache } from "@/lib/cache";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

export async function GET(request: NextRequest) {
  const artistId = request.nextUrl.searchParams.get("artistId");
  if (!artistId) return NextResponse.json({ albums: [] });

  // Check in-memory cache first
  const cacheKey = `albums:${artistId}`;
  const cached = albumCache.get(cacheKey);
  if (cached) {
    const response = NextResponse.json(cached);
    response.headers.set("X-Cache", "HIT");
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    );
    return response;
  }

  // Fetch Release Groups (Albums) with URL relations
  // primary-type=Album filters for main albums
  // release-group-status=website-default excludes bootlegs, promos, and pseudo-releases (matches MusicBrainz website behavior)
  const url = `${MB_BASE_URL}/release-group?artist=${artistId}&type=album&release-group-status=website-default&fmt=json&limit=100&inc=url-rels`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("MB API Error");
    const data = await res.json();

    // Filter for official studio albums
    // Include: Regular albums, soundtracks, remixes
    // Exclude: Compilations, live albums, interviews, demos, etc.
    const excludedSecondaryTypes = [
      "Compilation",
      "Live",
      "Spokenword",
      "Interview",
      "Audiobook",
      "Audio drama",
      "Mixtape/Street",
      "Demo",
      "DJ-mix",
      "Field recording",
    ];

    const basicAlbums = data["release-groups"]
      .filter((rg: any) => {
        // Must be primary type Album
        if (rg["primary-type"] !== "Album") return false;

        // If no secondary types, it's a regular studio album - include it
        if (!rg["secondary-types"] || rg["secondary-types"].length === 0)
          return true;

        // If has secondary types, check if any are in the excluded list
        const hasExcludedType = rg["secondary-types"].some((type: string) =>
          excludedSecondaryTypes.includes(type),
        );

        return !hasExcludedType;
      })
      .map((rg: any) => {
        // Extract Wikidata ID if available
        const wikidataRel = rg.relations?.find(
          (rel: any) => rel.type === "wikidata",
        );
        const wikidataId = wikidataRel?.url?.resource?.split("/").pop();

        return {
          id: rg.id,
          title: rg.title,
          releaseDate: rg["first-release-date"],
          wikidataId,
        };
      })
      .sort((a: any, b: any) =>
        (b.releaseDate || "").localeCompare(a.releaseDate || ""),
      );

    // Collect all Wikidata IDs
    const wikidataIds = basicAlbums
      .map((a: any) => a.wikidataId)
      .filter(Boolean);

    // Batch fetch Wikipedia URLs from Wikidata
    const wikiMap = new Map<string, string>();
    if (wikidataIds.length > 0) {
      // Wikidata API limit matches to 50 entities per request usually, but let's do chunks if needed.
      // For simplicity, we'll assume < 50 for a single artist main albums list or just slice.
      // Usually main studio albums are < 50.
      const idsChunk = wikidataIds.slice(0, 50).join("|");
      const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${idsChunk}&props=sitelinks/urls&format=json`;

      try {
        const wdRes = await fetch(wdUrl, {
          next: { revalidate: 3600 },
        });
        if (wdRes.ok) {
          const wdData = await wdRes.json();
          const entities = wdData.entities || {};

          Object.keys(entities).forEach((id) => {
            const entity = entities[id];
            // Prefer English Wikipedia, fall back to others if needed?
            // Let's stick to enwiki for now based on user request implication.
            const siteLink = entity.sitelinks?.enwiki;
            if (siteLink?.url) {
              wikiMap.set(id, siteLink.url);
            }
          });
        }
      } catch (e) {
        console.error("Wikidata fetch error:", e);
        // Continue without links on error
      }
    }

    // Merge Wikipedia URLs
    const albums = basicAlbums.map((album: any) => ({
      id: album.id,
      title: album.title,
      releaseDate: album.releaseDate,
      wikipediaUrl: album.wikidataId
        ? wikiMap.get(album.wikidataId)
        : undefined,
    }));

    // Cache result for 24 hours
    const result = { albums };
    albumCache.set(cacheKey, result, 86400);

    const response = NextResponse.json(result);
    response.headers.set("X-Cache", "MISS");
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    );
    return response;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ albums: [] });
  }
}
