import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import {
  fetchAppleSongEnrichmentsByIds,
  type AppleSongEnrichment,
} from "@/lib/appleMusic/api";

export type RatedSongArtist = { id: string; name: string };

export interface RatedSongDTO {
  id: string;
  trackId: string;
  albumId: string | null;
  rating: number | null;
  title: string;
  artistName: string;
  artistId: string | null;
  artists: RatedSongArtist[];
  albumName: string | null;
  thumbnailUrl: string | null;
  durationMs: number | null;
  createdAt: string;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
type SortOption = "newest" | "oldest" | "title" | "artist";

function parseStoredArtists(value: unknown): RatedSongArtist[] {
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
  const sort = (url.searchParams.get("sort") || "newest") as SortOption;
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

  const baseQuery = supabase
    .from("user_favorites")
    .select(
      "id, item_id, item_name, artist_name, artist_id, artists, thumbnail_url, album_id, album_name, duration_ms, created_at",
      { count: "exact" },
    )
    .eq("user_id", targetUserId)
    .eq("item_type", "track");

  let query = baseQuery;
  if (q) {
    const escaped = q.replace(/,/g, "\\,");
    query = query.or(
      `item_name.ilike.%${escaped}%,artist_name.ilike.%${escaped}%,album_name.ilike.%${escaped}%`,
    );
  }
  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "title") {
    query = query.order("item_name", { ascending: true });
  } else if (sort === "artist") {
    query = query.order("artist_name", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Rated songs fetch failed:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  type FavoriteRow = {
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
    created_at: string;
  };

  const rows: FavoriteRow[] = data || [];
  const total = count ?? 0;
  const hasMore = to + 1 < total;

  if (rows.length === 0) {
    return NextResponse.json({
      songs: [],
      total,
      page,
      pageSize,
      hasMore: false,
    });
  }

  const albumIds = Array.from(
    new Set(rows.map((r) => r.album_id).filter((id): id is string => !!id)),
  );
  const { data: albumRows } = await supabase
    .from("user_albums")
    .select("album_id, title, artist_name, thumbnail_url, total_tracks")
    .eq("user_id", targetUserId)
    .in("album_id", albumIds);

  type AlbumRow = {
    album_id: string;
    title: string;
    artist_name: string;
    thumbnail_url: string | null;
    total_tracks: number;
  };

  const albumMap = new Map<string, AlbumRow>();
  for (const album of (albumRows || []) as AlbumRow[]) {
    albumMap.set(album.album_id, album);
  }

  const trackIds = rows.map((r) => r.item_id);
  let enrichmentMap = new Map<string, AppleSongEnrichment>();

  try {
    enrichmentMap = await fetchAppleSongEnrichmentsByIds(trackIds);
  } catch (e) {
    console.error("Apple enrichment for rated songs failed:", e);
  }

  const ratingTrackIds = rows.map((r) => r.item_id);
  const { data: ratingRows } = await supabase
    .from("ratings")
    .select("track_id, rating")
    .eq("user_id", targetUserId)
    .in("track_id", ratingTrackIds);
  const ratingByTrackId = new Map<string, number>();
  for (const row of ratingRows || []) {
    ratingByTrackId.set(row.track_id as string, Number(row.rating));
  }

  const songs: RatedSongDTO[] = rows.map((row) => {
    const album = row.album_id ? albumMap.get(row.album_id) : undefined;
    const enriched = enrichmentMap.get(row.item_id);
    const primaryArtist = enriched?.artists?.[0];
    const storedArtists = parseStoredArtists(row.artists);
    const artists = enriched?.artists?.length
      ? enriched.artists
      : storedArtists.length
        ? storedArtists
        : row.artist_id && row.artist_name
          ? [{ id: row.artist_id, name: row.artist_name }]
          : [];
    const fallbackArtistName =
      row.artist_name || artists[0]?.name || album?.artist_name || "Unknown Artist";

    return {
      id: row.id,
      trackId: row.item_id,
      albumId: row.album_id,
      rating: ratingByTrackId.get(row.item_id) ?? null,
      title: row.item_name || enriched?.name || "Unknown Track",
      artistName: primaryArtist?.name || fallbackArtistName,
      artistId: primaryArtist?.id ?? row.artist_id ?? artists[0]?.id ?? null,
      artists,
      albumName: row.album_name || enriched?.albumName || album?.title || null,
      thumbnailUrl: row.thumbnail_url ?? album?.thumbnail_url ?? null,
      durationMs: row.duration_ms ?? enriched?.durationMs ?? null,
      createdAt: row.created_at,
    };
  });

  return NextResponse.json({
    songs,
    total,
    page,
    pageSize,
    hasMore,
  });
}
