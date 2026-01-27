import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id"); // Can be MBID of Release Group
  if (!id) return NextResponse.json({ url: null });

  try {
    const res = await fetch(`https://coverartarchive.org/release-group/${id}`, {
      next: { revalidate: 86400 }, // Cache for 24h
    });

    if (!res.ok) return NextResponse.json({ url: null });

    const data = await res.json();
    const image =
      data.images?.find((img: any) => img.front) || data.images?.[0];

    return NextResponse.json({
      url: image?.thumbnails?.small || image?.image || null, // Use small thumb for grid
    });
  } catch {
    return NextResponse.json({ url: null });
  }
}
