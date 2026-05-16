import { NextRequest, NextResponse } from "next/server";

import { fetchAppleSongEnrichmentsByIds } from "@/lib/appleMusic/api";

const MAX_IDS = 400;

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

  const songIds = ids
    .filter((x): x is string => typeof x === "string" && x.length > 0)
    .slice(0, MAX_IDS);

  if (songIds.length === 0) {
    return NextResponse.json({ enrichments: {} });
  }

  const map = await fetchAppleSongEnrichmentsByIds(songIds);
  const enrichments: Record<
    string,
    {
      artists: { id: string; name: string }[];
      artistId?: string;
      albumId?: string;
      albumName?: string;
      durationMs?: number;
    }
  > = {};

  for (const [id, v] of map) {
    enrichments[id] = {
      artists: v.artists,
      artistId: v.artists[0]?.id,
      albumId: v.albumId,
      albumName: v.albumName,
      durationMs: v.durationMs,
    };
  }

  return NextResponse.json({ enrichments });
}
