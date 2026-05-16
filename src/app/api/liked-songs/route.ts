import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { fetchAppleSongEnrichmentsByIds } from "@/lib/appleMusic/api";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";

export type LikedSongArtist = { id: string; name: string };

export interface LikedSongDTO {
  id: string;
  trackId: string;
  title: string;
  artistName: string;
  artistId: string | null;
  artists: LikedSongArtist[];
  albumId: string | null;
  albumName: string | null;
  thumbnailUrl: string | null;
  durationMs: number | null;
}

function parseStoredArtists(value: unknown): LikedSongArtist[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (a): a is { id: string; name: string } =>
        typeof a === "object" &&
        a !== null &&
        typeof (a as { id?: unknown }).id === "string" &&
        typeof (a as { name?: unknown }).name === "string",
    )
    .map((a) => ({ id: a.id, name: a.name }));
}

function artistsForRow(row: {
  artist_id: string | null;
  artist_name: string | null;
  artists: unknown;
}): LikedSongArtist[] {
  const stored = parseStoredArtists(row.artists);
  if (stored.length > 0) return stored;
  if (row.artist_id && row.artist_name) {
    return [{ id: row.artist_id, name: row.artist_name }];
  }
  return [];
}

/**
 * Returns the authenticated user's liked songs, with Apple Music metadata
 * backfilled and persisted for any rows missing it so subsequent loads are instant.
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

  type Row = {
    id: string;
    item_id: string;
    item_name: string | null;
    artist_name: string | null;
    artist_id: string | null;
    artists: unknown;
    thumbnail_url: string | null;
    album_id: string | null;
    album_name: string | null;
    duration_ms: number | null;
  };

  const { rows: fetchedRows, error } = await fetchAllRows<Row>((from, to) =>
    supabase
      .from("user_favorites")
      .select(
        "id, item_id, item_name, artist_name, artist_id, artists, thumbnail_url, album_id, album_name, duration_ms, created_at",
      )
      .eq("user_id", targetUserId)
      .eq("item_type", "track")
      .order("created_at", { ascending: false })
      .range(from, to),
  );

  if (error) {
    console.error("Liked songs fetch failed:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  const rows: Row[] = fetchedRows;

  const missingMetaIds = rows
    .filter(
      (r) =>
        !r.item_name ||
        !r.album_id ||
        !r.album_name ||
        !r.duration_ms ||
        !r.artist_id ||
        parseStoredArtists(r.artists).length === 0,
    )
    .map((r) => r.item_id);

  const isOwner = user?.id === targetUserId;

  if (missingMetaIds.length > 0) {
    try {
      const enrichmentMap = await fetchAppleSongEnrichmentsByIds(
        Array.from(new Set(missingMetaIds)),
      );

      for (const row of rows) {
        const enriched = enrichmentMap.get(row.item_id);
        if (!enriched) continue;
        if (!row.item_name && enriched.name) row.item_name = enriched.name;
        if (!row.album_id && enriched.albumId) row.album_id = enriched.albumId;
        if (!row.album_name && enriched.albumName)
          row.album_name = enriched.albumName;
        if (!row.duration_ms && enriched.durationMs)
          row.duration_ms = enriched.durationMs;
        if (enriched.artists.length > 0) {
          if (!row.artist_id) row.artist_id = enriched.artists[0]?.id ?? null;
          if (parseStoredArtists(row.artists).length === 0) {
            row.artists = enriched.artists;
          }
        }
      }

      if (isOwner) {
        const updates = rows.filter((r) => enrichmentMap.has(r.item_id));
        if (updates.length > 0) {
          await Promise.all(
            updates.map((r) =>
              supabase
                .from("user_favorites")
                .update({
                  item_name: r.item_name,
                  album_id: r.album_id,
                  album_name: r.album_name,
                  duration_ms: r.duration_ms,
                  artist_id: r.artist_id,
                  artists: parseStoredArtists(r.artists).length
                    ? r.artists
                    : null,
                })
                .eq("id", r.id),
            ),
          );
        }
      }
    } catch (e) {
      console.error("Apple enrichment for liked songs failed:", e);
    }
  }

  const songs: LikedSongDTO[] = rows.map((r) => {
    const artists = artistsForRow(r);
    return {
      id: r.id,
      trackId: r.item_id,
      title: r.item_name || "Unknown track",
      artistName: r.artist_name || artists[0]?.name || "Unknown Artist",
      artistId: r.artist_id ?? artists[0]?.id ?? null,
      artists,
      albumId: r.album_id,
      albumName: r.album_name,
      thumbnailUrl: r.thumbnail_url,
      durationMs: r.duration_ms,
    };
  });

  return NextResponse.json({ songs });
}
