import { NextRequest, NextResponse } from "next/server";
import { searchAppleMusic } from "@/lib/appleMusic/api";
import { artworkUrl, classifyAlbumType } from "@/lib/appleMusic/api";
import type {
  SearchCategory,
  SearchApiResponse,
  SearchResult,
  ArtistSearchResult,
  AlbumSearchResult,
  SongSearchResult,
  GroupedSearchResults,
} from "@/types/search";
import { CACHE_HEADERS } from "@/lib/api-utils";

const VALID_CATEGORIES = new Set(["all", "artist", "album", "song"]);

/**
 * GET /api/search?q=hello&category=song
 */
export async function GET(request: NextRequest) {
  const start = performance.now();
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const categoryParam = searchParams.get("category") || "all";

  if (!q || q.trim().length < 2 || q.trim().length > 200) {
    return NextResponse.json(
      { error: "Invalid or missing search query." },
      { status: 400 },
    );
  }

  if (!VALID_CATEGORIES.has(categoryParam)) {
    return NextResponse.json(
      {
        error:
          "Invalid category. Must be one of: 'all', 'artist', 'album', 'song'.",
      },
      { status: 400 },
    );
  }

  const category = categoryParam as SearchCategory;

  try {
    // Determine which Apple Music types to search
    const typeMap: Record<string, ("artists" | "albums" | "songs")[]> = {
      all: ["artists", "albums", "songs"],
      artist: ["artists"],
      album: ["albums"],
      song: ["songs"],
    };

    const limit = category === "all" ? 8 : 20;
    const appleResults = await searchAppleMusic(q, typeMap[category], limit);

    // Map Apple Music results to our search result types
    const artists: ArtistSearchResult[] = appleResults.artists.map((a) => ({
      id: a.id,
      type: "artist" as const,
      title: a.name,
      artworkUrl: a.artworkUrl ? artworkUrl(a.artworkUrl, 100) : undefined,
      genres: a.genres,
    }));

    const albums: AlbumSearchResult[] = appleResults.albums.map((a) => ({
      id: a.id,
      type: "album" as const,
      title: a.name,
      subtitle: a.artistName,
      artworkUrl: a.artworkUrl ? artworkUrl(a.artworkUrl, 100) : undefined,
      artistName: a.artistName,
      artistId: a.artistId,
      releaseDate: a.releaseDate,
      albumType: classifyAlbumType({
        name: a.name,
        isSingle: a.isSingle || false,
        isCompilation: a.isCompilation || false,
        trackCount: a.trackCount,
      }),
    }));

    const songs: SongSearchResult[] = appleResults.songs.map((s) => ({
      id: s.id,
      type: "song" as const,
      title: s.name,
      subtitle: s.artistName,
      artworkUrl: s.artworkUrl ? artworkUrl(s.artworkUrl, 100) : undefined,
      artistName: s.artistName,
      artistId: s.artistId,
      albumName: s.albumName,
      albumId: s.albumId,
      durationMs: s.durationMs,
      releaseDate: s.releaseDate,
    }));

    // Build flat results list
    const results: SearchResult[] = [...artists, ...albums, ...songs];

    // Build grouped results for "all" category
    const grouped: GroupedSearchResults | undefined =
      category === "all" ? { artists, albums, songs } : undefined;

    const took = Math.round(performance.now() - start);

    const response: SearchApiResponse = {
      results,
      meta: { query: q, category, totalResults: results.length, took },
    };

    const body = grouped ? { ...response, grouped } : response;

    return NextResponse.json(body, {
      headers: CACHE_HEADERS.search,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
