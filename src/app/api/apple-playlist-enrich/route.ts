import { NextRequest, NextResponse } from "next/server";

import { fetchAppleSongEnrichmentsByIds } from "@/lib/appleMusic/api";
import { playlistEnrichCache } from "@/lib/cache";

const MAX_IDS = 400;
const CACHE_CONTROL = {
  "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=43200",
};

type PlaylistEnrichments = Record<
  string,
  {
    artists: { id: string; name: string }[];
    artistId?: string;
    albumId?: string;
    albumName?: string;
    durationMs?: number;
  }
>;

function buildCacheKey(songIds: string[]): string {
  return songIds.slice().sort().join(",");
}

function normalizeIds(ids: unknown[]): string[] {
  return ids
    .filter((x): x is string => typeof x === "string" && x.length > 0)
    .slice(0, MAX_IDS);
}

async function buildEnrichmentResponse(songIds: string[]) {
  if (songIds.length === 0) {
    return NextResponse.json({ enrichments: {} }, { headers: CACHE_CONTROL });
  }

  const cacheKey = buildCacheKey(songIds);
  const cached = playlistEnrichCache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ enrichments: cached }, { headers: CACHE_CONTROL });
  }

  const map = await fetchAppleSongEnrichmentsByIds(songIds);
  const enrichments: PlaylistEnrichments = {};

  for (const [id, v] of map) {
    enrichments[id] = {
      artists: v.artists,
      artistId: v.artists[0]?.id,
      albumId: v.albumId,
      albumName: v.albumName,
      durationMs: v.durationMs,
    };
  }

  playlistEnrichCache.set(cacheKey, enrichments);

  return NextResponse.json({ enrichments }, { headers: CACHE_CONTROL });
}

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids");
  if (!ids) {
    return NextResponse.json({ error: "ids query required" }, { status: 400 });
  }

  return buildEnrichmentResponse(normalizeIds(ids.split(",")));
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = (body as { ids?: unknown })?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  return buildEnrichmentResponse(normalizeIds(ids));
}
