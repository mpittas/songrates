import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import {
  fetchAppleArtistEnrichmentsByIds,
  type AppleArtistEnrichment,
} from "@/lib/appleMusic/api";

export interface LikedArtistDTO {
  id: string;
  artistId: string;
  name: string;
  thumbnailUrl: string | null;
  genres: string[];
}

/**
 * Returns a user's liked artists, with Apple Music metadata backfilled and
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
    .select("id, item_id, item_name, thumbnail_url, created_at")
    .eq("user_id", targetUserId)
    .eq("item_type", "artist")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Liked artists fetch failed:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  type Row = {
    id: string;
    item_id: string;
    item_name: string | null;
    thumbnail_url: string | null;
  };

  const rows: Row[] = data || [];
  const isOwner = user?.id === targetUserId;
  const rowsNeedingPersist = new Set(
    rows.filter((r) => !r.item_name || !r.thumbnail_url).map((r) => r.id),
  );

  const allArtistIds = Array.from(new Set(rows.map((r) => r.item_id)));
  let enrichmentMap = new Map<string, AppleArtistEnrichment>();

  if (allArtistIds.length > 0) {
    try {
      enrichmentMap = await fetchAppleArtistEnrichmentsByIds(allArtistIds);

      for (const row of rows) {
        const enriched = enrichmentMap.get(row.item_id);
        if (!enriched) continue;
        if (!row.item_name && enriched.name) row.item_name = enriched.name;
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
                  thumbnail_url: r.thumbnail_url,
                })
                .eq("id", r.id),
            ),
          );
        }
      }
    } catch (e) {
      console.error("Apple enrichment for liked artists failed:", e);
    }
  }

  const artists: LikedArtistDTO[] = rows.map((r) => {
    const enriched = enrichmentMap.get(r.item_id);
    return {
      id: r.id,
      artistId: r.item_id,
      name: r.item_name || enriched?.name || "Unknown Artist",
      thumbnailUrl: r.thumbnail_url ?? enriched?.artworkUrl ?? null,
      genres: enriched?.genres ?? [],
    };
  });

  return NextResponse.json(
    { artists },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
