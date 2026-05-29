import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import {
  fetchAppleAlbumEnrichmentsByIds,
  type AppleAlbumEnrichment,
} from "@/lib/appleMusic/api";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetUserId = requestedUserId || user?.id;
  if (!targetUserId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_favorites")
    .select(
      "id, item_id, item_name, artist_name, thumbnail_url, created_at",
    )
    .eq("user_id", targetUserId)
    .eq("item_type", "album")
    .order("created_at", { ascending: false });

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
  const isOwner = user?.id === targetUserId;
  const rowsNeedingPersist = new Set(
    rows
      .filter((r) => !r.item_name || !r.artist_name || !r.thumbnail_url)
      .map((r) => r.id),
  );

  const allAlbumIds = Array.from(new Set(rows.map((r) => r.item_id)));
  let enrichmentMap = new Map<string, AppleAlbumEnrichment>();

  if (allAlbumIds.length > 0) {
    try {
      enrichmentMap = await fetchAppleAlbumEnrichmentsByIds(allAlbumIds);

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
    { albums },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
