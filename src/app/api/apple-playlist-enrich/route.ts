import { NextRequest, NextResponse } from "next/server";

import { fetchAppleSongEnrichmentsByIds } from "@/lib/appleMusic/api";
import { playlistEnrichCache } from "@/lib/cache";
import { CACHE_HEADERS, createApiTimer } from "@/lib/api-utils";

const MAX_IDS = 400;

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

async function buildEnrichmentResponse(
  songIds: string[],
  timer: ReturnType<typeof createApiTimer>,
) {
  if (songIds.length === 0) {
    return NextResponse.json(
      { enrichments: {} },
      { headers: timer.headers(CACHE_HEADERS.playlist) },
    );
  }

  const cacheKey = buildCacheKey(songIds);
  const cached = playlistEnrichCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(
      { enrichments: cached },
      { headers: timer.headers({ ...CACHE_HEADERS.playlist, "X-Cache": "HIT" }) },
    );
  }

  const map = await timer.measure("apple_enrich", () =>
    fetchAppleSongEnrichmentsByIds(songIds),
  );
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

  return NextResponse.json(
    { enrichments },
    { headers: timer.headers({ ...CACHE_HEADERS.playlist, "X-Cache": "MISS" }) },
  );
}

export async function GET(request: NextRequest) {
  const timer = createApiTimer();
  const ids = request.nextUrl.searchParams.get("ids");
  if (!ids) {
    return NextResponse.json(
      { error: "ids query required" },
      { status: 400, headers: timer.headers() },
    );
  }

  return buildEnrichmentResponse(normalizeIds(ids.split(",")), timer);
}

export async function POST(request: NextRequest) {
  const timer = createApiTimer();
  let body: unknown;
  try {
    body = await timer.measure("request_json", () => request.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: timer.headers() },
    );
  }

  const ids = (body as { ids?: unknown })?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "ids array required" },
      { status: 400, headers: timer.headers() },
    );
  }

  return buildEnrichmentResponse(normalizeIds(ids), timer);
}
