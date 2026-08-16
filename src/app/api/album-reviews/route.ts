import { NextRequest, NextResponse } from "next/server";

import { getAlbumInfo } from "@/lib/appleMusic/albumInfo";
import { isReviewableAlbumType } from "@/lib/albumPageStats";
import { resolveAlbumId } from "@/lib/resolveAlbumId";
import {
  ALBUM_REVIEW_MAX_LENGTH,
  ALBUM_REVIEW_MIN_LENGTH,
  enlargeAvatarUrl,
  type AlbumReview,
  type AlbumReviewAuthor,
} from "@/lib/albumReviews";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const NO_STORE = { "Cache-Control": "private, no-store" };

type ReviewRow = {
  id: string;
  user_id: string;
  album_id: string;
  body: string;
  score: number | string;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

function mapReview(
  row: ReviewRow,
  profile: ProfileRow | undefined,
  authAvatarUrl?: string | null,
): AlbumReview {
  const author: AlbumReviewAuthor = {
    username: profile?.username ?? null,
    displayName: profile?.display_name ?? null,
    avatarUrl: enlargeAvatarUrl(profile?.avatar_url ?? authAvatarUrl ?? null),
  };

  return {
    id: row.id,
    userId: row.user_id,
    albumId: row.album_id,
    body: row.body,
    score: Number(row.score),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author,
  };
}

async function attachAuthors(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: ReviewRow[],
): Promise<AlbumReview[]> {
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);

  const profileById = new Map(
    ((profiles || []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );

  const missingAvatarIds = userIds.filter((id) => {
    const profile = profileById.get(id);
    return !profile?.avatar_url;
  });

  const authAvatarById = new Map<string, string>();
  const admin = createAdminClient();
  if (admin && missingAvatarIds.length > 0) {
    const authUsers = await Promise.all(
      missingAvatarIds.map((id) => admin.auth.admin.getUserById(id)),
    );
    for (const { data } of authUsers) {
      const user = data.user;
      if (!user) continue;
      const meta = user.user_metadata ?? {};
      const url =
        (typeof meta.avatar_url === "string" && meta.avatar_url) ||
        (typeof meta.picture === "string" && meta.picture) ||
        null;
      if (url) authAvatarById.set(user.id, url);
    }
  }

  return rows.map((row) =>
    mapReview(row, profileById.get(row.user_id), authAvatarById.get(row.user_id)),
  );
}

export async function GET(request: NextRequest) {
  const albumId = request.nextUrl.searchParams.get("albumId")?.trim();
  if (!albumId) {
    return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("album_reviews")
    .select("id, user_id, album_id, body, score, created_at, updated_at")
    .eq("album_id", resolveAlbumId(albumId))
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Album reviews fetch failed:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  const reviews = await attachAuthors(supabase, (data || []) as ReviewRow[]);
  return NextResponse.json(
    { reviews, count: reviews.length },
    { headers: NO_STORE },
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to write a review" }, { status: 401 });
  }

  let payload: { albumId?: unknown; body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const albumId =
    typeof payload.albumId === "string" ? payload.albumId.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";

  if (!albumId) {
    return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
  }

  if (
    body.length < ALBUM_REVIEW_MIN_LENGTH ||
    body.length > ALBUM_REVIEW_MAX_LENGTH
  ) {
    return NextResponse.json(
      {
        error: `Review must be ${ALBUM_REVIEW_MIN_LENGTH}–${ALBUM_REVIEW_MAX_LENGTH} characters`,
      },
      { status: 400 },
    );
  }

  const resolvedAlbumId = resolveAlbumId(albumId);
  const [album, ratingsResult] = await Promise.all([
    getAlbumInfo(resolvedAlbumId),
    supabase
      .from("ratings")
      .select("track_id, rating")
      .eq("user_id", user.id)
      .eq("album_id", resolvedAlbumId),
  ]);

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  if (!isReviewableAlbumType(album.type)) {
    return NextResponse.json(
      { error: "Reviews are only available for albums and EPs" },
      { status: 400 },
    );
  }

  const trackIds = (album.tracks || []).map((track) => track.id);
  if (trackIds.length === 0) {
    return NextResponse.json(
      { error: "This release has no tracks to rate" },
      { status: 400 },
    );
  }

  const { data: ratingRows, error: ratingsError } = ratingsResult;

  if (ratingsError) {
    console.error("Album review ratings check failed:", ratingsError);
    return NextResponse.json({ error: "Could not verify ratings" }, { status: 500 });
  }

  const ratingByTrack = new Map(
    (ratingRows || []).map((row) => [
      row.track_id as string,
      Number(row.rating),
    ]),
  );
  const missingCount = trackIds.filter(
    (id) => !(ratingByTrack.get(id)! > 0),
  ).length;

  if (missingCount > 0) {
    return NextResponse.json(
      {
        error: `Rate every track before writing a review (${trackIds.length - missingCount}/${trackIds.length})`,
      },
      { status: 400 },
    );
  }

  const score =
    trackIds.reduce((sum, id) => sum + (ratingByTrack.get(id) || 0), 0) /
    trackIds.length;

  const { error: albumRowError } = await supabase.from("user_albums").upsert({
    user_id: user.id,
    album_id: album.id,
    title: album.title,
    artist_name: album.artist?.name ?? null,
    release_date: album.releaseDate,
    total_tracks: trackIds.length,
    thumbnail_url: album.artworkUrl || null,
    album_type: album.type,
  });

  if (albumRowError) {
    console.error("Album review user_albums upsert failed:", albumRowError);
  }

  const { data, error } = await supabase
    .from("album_reviews")
    .upsert(
      {
        user_id: user.id,
        album_id: album.id,
        album_title: album.title,
        artist_name: album.artist?.name ?? null,
        album_type: album.type,
        body,
        score: Number(score.toFixed(1)),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,album_id" },
    )
    .select("id, user_id, album_id, body, score, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("Album review save failed:", error);
    return NextResponse.json(
      { error: "Could not save review. Rate every track first." },
      { status: 400 },
    );
  }

  const [review] = await attachAuthors(supabase, [data as ReviewRow]);
  return NextResponse.json({ review }, { headers: NO_STORE });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const albumId = request.nextUrl.searchParams.get("albumId")?.trim();
  if (!albumId) {
    return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
  }

  const { error } = await supabase
    .from("album_reviews")
    .delete()
    .eq("user_id", user.id)
    .eq("album_id", resolveAlbumId(albumId));

  if (error) {
    console.error("Album review delete failed:", error);
    return NextResponse.json({ error: "Could not delete review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
