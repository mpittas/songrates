import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import type { RecentSearchClick, SearchResult } from "@/types/search";

const HISTORY_LIMIT = 10;
const VALID_TYPES = new Set(["artist", "album", "song"]);

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * GET /api/search-history
 * Returns the authenticated user's most recently clicked results.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ searches: [] }, { headers: NO_STORE });
  }

  const { data, error } = await supabase
    .from("user_searches")
    .select("id, result, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    console.error("Search history fetch failed:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  const searches: RecentSearchClick[] = (data || []).map((r) => ({
    recordId: r.id as string,
    result: r.result as SearchResult,
    clickedAt: r.created_at as string,
  }));

  return NextResponse.json({ searches }, { headers: NO_STORE });
}

/**
 * POST /api/search-history  { result: SearchResult }
 * Records (or refreshes) a clicked result for the authenticated user.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let body: { result?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = body.result as Partial<SearchResult> | undefined;

  if (
    !result ||
    typeof result.id !== "string" ||
    typeof result.title !== "string" ||
    typeof result.type !== "string" ||
    !VALID_TYPES.has(result.type)
  ) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  const { error } = await supabase.from("user_searches").upsert(
    {
      user_id: user.id,
      result_id: result.id,
      result_type: result.type,
      result,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id,result_id" },
  );

  if (error) {
    console.error("Search history save failed:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { headers: NO_STORE });
}

/**
 * DELETE /api/search-history             → clears all recent results
 * DELETE /api/search-history?resultId=x  → removes a single result
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const resultId = request.nextUrl.searchParams.get("resultId");

  let request_ = supabase.from("user_searches").delete().eq("user_id", user.id);
  if (resultId) {
    request_ = request_.eq("result_id", resultId);
  }

  const { error } = await request_;

  if (error) {
    console.error("Search history delete failed:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { headers: NO_STORE });
}
