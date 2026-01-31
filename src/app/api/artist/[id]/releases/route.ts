import { NextRequest, NextResponse } from "next/server";
import { getOtherReleases } from "@/lib/musicbrainz";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const releases = await getOtherReleases(id);
    return NextResponse.json(releases, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch releases" },
      { status: 500 },
    );
  }
}
