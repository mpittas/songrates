import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import {
  fetchAppleAlbumEnrichmentsByIds,
  type AppleAlbumEnrichment,
} from "@/lib/appleMusic/api";

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 50;

export interface LikedAlbumDTO {
  id: string;
  albumId: string;
  title: string;
  artistName: string;
  thumbnailUrl: string | null;
  releaseDate: string | null;
}

/**
 * Returns a user's liked albums, with Apple Music metadata backfilled and
 * persisted for any rows missing it so subsequent loads are instant.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const requestedUserId = url.searchParams.get("userId");
  const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      Number(url.searchParams.get("limit") || DEFAULT_PAGE_SIZE) ||
        DEFAULT_PAGE_SIZE,
    ),
  );
  const q = (url.searchParams.get("q") || "").trim();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetUserId = requestedUserId || user?.id;
  if (!targetUserId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("user_favorites")
    .select(
      "id, item_id, item_name, artist_name, thumbnail_url, created_at",
      { count: "exact" },
    )
    .eq("user_id", targetUserId)
    .eq("item_type", "album");

  if (q) {
    const escaped = q.replace(/,/g, "\\,");
    query = query.or(
      `item_name.ilike.%${escaped}%,artist_name.ilike.%${escaped}%`,
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Liked albums fetch failed:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  type Row = {
    id: string;
    item_id: string;
    item_name: string | null;
    artist_name: string | null;
    thumbnail_url: string | null;
  };

  const rows: Row[] = data || [];
  const total = count ?? 0;
  const hasMore = to + 1 < total;
  const isOwner = user?.id === targetUserId;
  const rowsNeedingPersist = new Set(
    rows
      .filter((r) => !r.item_name || !r.artist_name || !r.thumbnail_url)
      .map((r) => r.id),
  );

  const missingAlbumIds = Array.from(
    new Set(
      rows
        .filter((r) => rowsNeedingPersist.has(r.id))
        .map((r) => r.item_id),
    ),
  );
  let enrichmentMap = new Map<string, AppleAlbumEnrichment>();

  if (missingAlbumIds.length > 0) {
    try {
      enrichmentMap = await fetchAppleAlbumEnrichmentsByIds(missingAlbumIds);

      for (const row of rows) {
        const enriched = enrichmentMap.get(row.item_id);
        if (!enriched) continue;
        if (!row.item_name && enriched.name) row.item_name = enriched.name;
        if (!row.artist_name && enriched.artistName)
          row.artist_name = enriched.artistName;
        if (!row.thumbnail_url && enriched.artworkUrl)
          row.thumbnail_url = enriched.artworkUrl;
      }

      if (isOwner && rowsNeedingPersist.size > 0) {
        const updates = rows.filter((r) => rowsNeedingPersist.has(r.id));
        if (updates.length > 0) {
          await Promise.all(
            updates.map((r) =>
              supabase
                .from("user_favorites")
                .update({
                  item_name: r.item_name,
                  artist_name: r.artist_name,
                  thumbnail_url: r.thumbnail_url,
                })
                .eq("id", r.id),
            ),
          );
        }
      }
    } catch (e) {
      console.error("Apple enrichment for liked albums failed:", e);
    }
  }

  const albums: LikedAlbumDTO[] = rows.map((r) => {
    const enriched = enrichmentMap.get(r.item_id);
    return {
      id: r.id,
      albumId: r.item_id,
      title: r.item_name || enriched?.name || "Unknown album",
      artistName: r.artist_name || enriched?.artistName || "Unknown Artist",
      thumbnailUrl: r.thumbnail_url ?? enriched?.artworkUrl ?? null,
      releaseDate: enriched?.releaseDate ?? null,
    };
  });

  return NextResponse.json(
    { albums, total, page, pageSize, hasMore },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
