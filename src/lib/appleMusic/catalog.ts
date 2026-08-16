/**
 * Catalog domain operations.
 *
 * Everything that reads Apple Music catalog data that is not artist
 * discography: search, album detail, charts/explore, browse (moods &
 * categories), Top 100 trending, and playlist detail.
 */

import { cache } from "react";

import {
  appleMusicFetch,
  STOREFRONT,
  APPLE_MUSIC_REVALIDATE_SECONDS,
} from "./core";
import {
  searchCache,
  albumCache,
  playlistCache,
  singleFlight,
  appleTags,
  mapWithConcurrency,
} from "@/lib/cache";
import {
  parseArtist,
  parseAlbum,
  parseSong,
  parsePlaylist,
  parseGenre,
  extractAlbumIdFromUrl,
  artistsFromCatalogSongResource,
  normalizeChartData,
} from "./parsers";
import { fetchAppleSongEnrichmentsByIds } from "./enrichments";
import type {
  AppleSearchResult,
  AppleAlbumResult,
  AppleSongResult,
  AppleAlbumDetail,
  AppleTrack,
  ApplePlaylistResult,
  ApplePlaylistDetail,
  AppleGenreResult,
  AppleExploreData,
  BrowsePillConfig,
  BrowseSubgenre,
  BrowseSection,
  AppleBrowseData,
  AppleChartsResponse,
  AppleGenresResponse,
  ApplePlaylistSearchResponse,
} from "./types";

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * Search Apple Music for artists, albums, and songs
 */
export async function searchAppleMusic(
  query: string,
  types: ("artists" | "albums" | "songs")[] = ["artists", "albums", "songs"],
  limit: number = 10,
): Promise<AppleSearchResult> {
  const cacheKey = `am-search:${query}:${types.join(",")}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as AppleSearchResult;

  return singleFlight(cacheKey, async () => {
    const typesParam = types.join(",");
    const path = `/catalog/${STOREFRONT}/search?term=${encodeURIComponent(query)}&types=${typesParam}&limit=${limit}`;

    const data = await appleMusicFetch<any>(path, {
      tags: [appleTags.search(query)],
      revalidate: 1800,
    });

    const result: AppleSearchResult = {
      artists: (data?.results?.artists?.data || []).map(parseArtist),
      albums: (data?.results?.albums?.data || []).map(parseAlbum),
      songs: (data?.results?.songs?.data || []).map(parseSong),
    };

    if (
      result.artists.length > 0 ||
      result.albums.length > 0 ||
      result.songs.length > 0
    ) {
      searchCache.set(cacheKey, result, 1800);
    }

    return result;
  });
}

// ─── Album Detail ─────────────────────────────────────────────────────────────

/**
 * Get album details including all tracks.
 *
 * Wrapped with React cache() so the album page and any nested component that
 * needs album metadata share a single upstream call within a request.
 */
export const getAlbumDetail = cache(
  async (albumId: string): Promise<AppleAlbumDetail | null> => {
    const cacheKey = `am-album-detail:${albumId}`;
    const cached = albumCache.get(cacheKey);
    if (cached) return cached as AppleAlbumDetail;

    return singleFlight(cacheKey, async () => {
      // Fetch album with tracks relationship and other-versions view
      // include[tracks]=artists fetches all artists (including featured) per track
      const data = await appleMusicFetch<any>(
        `/catalog/${STOREFRONT}/albums/${albumId}?include=tracks,artists&include[songs]=artists,featured-artists&views=other-versions`,
        {
          tags: [appleTags.album(albumId)],
          revalidate: APPLE_MUSIC_REVALIDATE_SECONDS,
        },
      );

      const item = data?.data?.[0];
      if (!item) return null;

      const a = item.attributes || {};
      const artistRel = item.relationships?.artists?.data?.[0];
      const trackItems = item.relationships?.tracks?.data || [];

      // Create a map of included resources for quick lookup
      const includedMap: Record<string, any> = {};
      if (data.included) {
        data.included.forEach((inc: any) => {
          includedMap[`${inc.type}:${inc.id}`] = inc;
        });
      }

      const albumArtistName = a.artistName || "";
      const primaryArtistName =
        (artistRel?.id
          ? includedMap[`artists:${artistRel.id}`]?.attributes?.name
          : undefined) || undefined;

      const tracks: AppleTrack[] = trackItems.map((t: any) => {
        const ta = t.attributes || {};

        // Resolve all artists/featured-artists for this track from the included map
        const artistRefs = [
          ...(t.relationships?.artists?.data || []),
          ...(t.relationships?.["featured-artists"]?.data || []),
        ];

        // De-duplicate by ID to avoid overlapping primary and featured lists
        const uniqueRefs = Array.from(
          new Map(artistRefs.map((r: any) => [r.id, r])).values(),
        );

        const songArtists = uniqueRefs
          .map((ref: any) => includedMap[`artists:${ref.id}`] || ref)
          .map(parseArtist);

        const primaryArtist = songArtists[0];
        return {
          id: t.id,
          name: ta.name || "",
          artistName: ta.artistName || "",
          artistId: primaryArtist?.id,
          trackNumber: ta.trackNumber || 0,
          discNumber: ta.discNumber || 1,
          durationMs: ta.durationInMillis || 0,
          artworkUrl: ta.artwork?.url,
          url: ta.url,
          hasLyrics: ta.hasLyrics,
          genreNames: ta.genreNames || [],
          artists: songArtists,
        };
      });

      // Apple Music's nested include[tracks]=artists doesn't return artist
      // relationships on the albums endpoint.  For tracks whose artistName
      // differs from the album artist (i.e. they have featured artists),
      // batch-fetch via /songs?ids=…&include=artists to get proper IDs.
      const tracksNeedingArtists = tracks.filter(
        (t) =>
          (!t.artists || t.artists.length === 0) &&
          t.artistName !== albumArtistName,
      );

      if (tracksNeedingArtists.length > 0) {
        const ids = tracksNeedingArtists.map((t) => t.id).join(",");
        const songsData = await appleMusicFetch<any>(
          `/catalog/${STOREFRONT}/songs?ids=${ids}&include=artists`,
          {
            tags: [appleTags.album(albumId)],
            revalidate: APPLE_MUSIC_REVALIDATE_SECONDS,
          },
        );

        if (songsData?.data) {
          const artistMap = new Map<string, { id: string; name: string }[]>();
          for (const song of songsData.data) {
            artistMap.set(song.id, artistsFromCatalogSongResource(song));
          }

          for (const track of tracksNeedingArtists) {
            const resolved = artistMap.get(track.id);
            if (resolved && resolved.length > 0) {
              track.artists = resolved;
              if (!track.artistId) {
                track.artistId = resolved[0].id;
              }
            }
          }
        }
      }

      // Sort tracks by disc number then track number
      tracks.sort((a, b) => {
        if (a.discNumber !== b.discNumber) return a.discNumber - b.discNumber;
        return a.trackNumber - b.trackNumber;
      });

      const result: AppleAlbumDetail = {
        id: item.id,
        name: a.name || "",
        artistName: a.artistName || "",
        primaryArtistName,
        artistId: artistRel?.id,
        artworkUrl: a.artwork?.url,
        releaseDate: a.releaseDate,
        trackCount: a.trackCount || tracks.length,
        genreNames: a.genreNames || [],
        isSingle: a.isSingle === true,
        isCompilation: a.isCompilation === true,
        isComplete: a.isComplete === true,
        contentRating: a.contentRating,
        copyright: a.copyright,
        editorialNotes:
          a.editorialNotes?.standard || a.editorialNotes?.short || undefined,
        url: a.url,
        tracks,
        otherVersions: (item.views?.["other-versions"]?.data || []).map(
          (v: any) => {
            const va = v.attributes || {};
            return {
              id: v.id,
              name: va.name || "",
              artworkUrl: va.artwork?.url,
              releaseDate: va.releaseDate,
              isSingle: va.isSingle === true,
              isCompilation: va.isCompilation === true,
              trackCount: va.trackCount,
            };
          },
        ),
      };

      albumCache.set(cacheKey, result, 86400);
      return result;
    });
  },
);

// ─── Charts / Explore ─────────────────────────────────────────────────────────

async function getCatalogCharts({
  storefront = STOREFRONT,
  types,
  limit = 12,
  genre,
  withParam,
}: {
  storefront?: string;
  types: ("songs" | "albums" | "playlists")[];
  limit?: number;
  genre?: string;
  withParam?: string;
}): Promise<{
  songs: AppleSongResult[];
  albums: AppleAlbumResult[];
  playlists: ApplePlaylistResult[];
}> {
  const safeLimit = Math.max(1, Math.min(limit, 25));
  const params = new URLSearchParams({
    types: types.join(","),
    limit: String(safeLimit),
  });

  if (genre) params.set("genre", genre);
  if (withParam) params.set("with", withParam);

  const cacheKey = `am-charts:${storefront}:${params.toString()}`;
  const cached = playlistCache.get(cacheKey);
    if (cached) {
    return cached as {
      songs: AppleSongResult[];
      albums: AppleAlbumResult[];
      playlists: ApplePlaylistResult[];
    };
  }

  const data = await appleMusicFetch<AppleChartsResponse>(
    `/catalog/${storefront}/charts?${params.toString()}`,
    {
      tags: [`apple-charts-${storefront}`],
      revalidate: 3600,
    },
  );

  const charts = {
    songs: normalizeChartData<unknown>(data?.results?.songs).map(parseSong),
    albums: normalizeChartData<unknown>(data?.results?.albums).map(parseAlbum),
    playlists: normalizeChartData<unknown>(data?.results?.playlists).map(
      parsePlaylist,
    ),
  };

  if (
    charts.songs.length > 0 ||
    charts.albums.length > 0 ||
    charts.playlists.length > 0
  ) {
    playlistCache.set(cacheKey, charts, 3600 * 6);
  }

  return charts;
}

async function getCatalogTopGenres(
  storefront: string = STOREFRONT,
  limit: number = 100,
): Promise<AppleGenreResult[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const cacheKey = `am-genres:${storefront}:${safeLimit}`;
  const cached = playlistCache.get(cacheKey);
  if (cached) return cached as AppleGenreResult[];

  const genres: AppleGenreResult[] = [];
  const seen = new Set<string>();
  let path: string | null = `/catalog/${storefront}/genres?limit=${safeLimit}`;

  for (let page = 0; page < 8 && path; page++) {
    const data = await appleMusicFetch<AppleGenresResponse>(path, {
      tags: [`apple-genres-${storefront}`],
      revalidate: 3600 * 24,
    });

    for (const genre of (data?.data || []).map(parseGenre)) {
      if (!genre.name || seen.has(genre.id)) continue;
      seen.add(genre.id);
      genres.push(genre);
    }

    const next = data?.next;
    path = next ? next.replace(/^\/v1/, "") : null;
  }

  if (genres.length > 0) {
    playlistCache.set(cacheKey, genres, 3600 * 12);
  }

  return genres;
}

const EDITORIAL_PLAYLIST_LIMIT = 8;

async function getEditorialPlaylists(
  storefront: string = STOREFRONT,
  queries: string[] = [
    "new music daily",
    "new in music",
    "fresh finds",
    "new releases",
  ],
  limitPerQuery: number = 5,
  limit: number = EDITORIAL_PLAYLIST_LIMIT,
): Promise<ApplePlaylistResult[]> {
  const cacheKey = `am-editorial-playlists:${storefront}:${queries.join("|")}:${limitPerQuery}:${limit}`;
  const cached = playlistCache.get(cacheKey);
  if (cached) return cached as ApplePlaylistResult[];

  const settled = await Promise.all(
    queries.map((query) =>
      appleMusicFetch<ApplePlaylistSearchResponse>(
        `/catalog/${storefront}/search?term=${encodeURIComponent(
          query,
        )}&types=playlists&limit=${Math.max(1, Math.min(limitPerQuery, 10))}`,
        {
          tags: [`apple-editorial-${storefront}`],
          revalidate: 3600 * 6,
        },
      ),
    ),
  );

  const unique = new Map<string, ApplePlaylistResult>();
  for (const result of settled) {
    for (const item of result?.results?.playlists?.data || []) {
      const playlist = parsePlaylist(item);
      if (playlist.id && !unique.has(playlist.id)) {
        unique.set(playlist.id, playlist);
      }
    }
  }

  const playlists = Array.from(unique.values()).slice(0, limit);
  if (playlists.length > 0) {
    playlistCache.set(cacheKey, playlists, 3600 * 6);
  }

  return playlists;
}

export async function getExploreData(
  storefront: string = STOREFRONT,
): Promise<AppleExploreData> {
  const [topCharts, playlistCharts, editorialPlaylists, genres] =
    await Promise.all([
      getCatalogCharts({
        storefront,
        types: ["songs", "albums"],
        limit: 12,
      }),
      getCatalogCharts({
        storefront,
        types: ["playlists"],
        limit: 8,
        withParam: "dailyGlobalTopCharts,cityCharts",
      }),
      getEditorialPlaylists(storefront),
      getCatalogTopGenres(storefront),
    ]);

  const preferredGenreNames = [
    "Pop",
    "Hip-Hop/Rap",
    "R&B/Soul",
    "Alternative",
    "Electronic",
    "Rock",
  ];
  const preferredGenres = preferredGenreNames
    .map((name) => genres.find((genre) => genre.name === name))
    .filter(Boolean) as AppleGenreResult[];

  const genreCandidates =
    preferredGenres.length > 0 ? preferredGenres : genres.slice(0, 4);

  const genreCharts = await Promise.all(
    genreCandidates.slice(0, 4).map(async (genre) => {
      const charts = await getCatalogCharts({
        storefront,
        types: ["songs", "albums"],
        limit: 12,
        genre: genre.id,
      });

      return {
        genre,
        songs: charts.songs,
        albums: charts.albums,
      };
    }),
  );

  return {
    topSongs: topCharts.songs,
    topAlbums: topCharts.albums,
    chartPlaylists: playlistCharts.playlists,
    editorialPlaylists,
    genreSections: genreCharts.filter(
      (section) => section.songs.length > 0 || section.albums.length > 0,
    ),
  };
}

// ─── Browse (Moods & Categories) ──────────────────────────────────────────────

/**
 * Curated browse pills. `query` is the search term sent to Apple Music's
 * catalog search (types=playlists). Keep these editable — each maps a friendly
 * label to a search term that yields good editorial playlists.
 */
export const BROWSE_MOODS: BrowsePillConfig[] = [
  { key: "workout", label: "Workout", query: "workout" },
  { key: "chill", label: "Chill", query: "chill" },
  { key: "party", label: "Party", query: "party" },
  { key: "focus", label: "Focus", query: "focus" },
  { key: "sleep", label: "Sleep", query: "sleep" },
  { key: "romance", label: "Romance", query: "romance" },
  { key: "feelgood", label: "Feel Good", query: "feel good" },
  { key: "throwback", label: "Throwback", query: "throwback" },
  { key: "energize", label: "Energize", query: "energize" },
  { key: "drive", label: "Drive", query: "driving" },
  { key: "study", label: "Study", query: "study" },
  { key: "morning", label: "Morning", query: "morning" },
  { key: "night", label: "Night", query: "late night" },
  { key: "rainy", label: "Rainy Day", query: "rainy day" },
  { key: "summer", label: "Summer", query: "summer" },
  { key: "acoustic", label: "Acoustic", query: "acoustic" },
];

export const BROWSE_CATEGORIES: BrowsePillConfig[] = [
  { key: "pop", label: "Pop", query: "pop" },
  { key: "hiphop", label: "Hip-Hop", query: "hip hop" },
  { key: "electronic", label: "Electronic", query: "electronic" },
  { key: "rock", label: "Rock", query: "rock" },
  { key: "rnb", label: "R&B", query: "r&b" },
  { key: "latin", label: "Latin", query: "latin" },
  { key: "jazz", label: "Jazz", query: "jazz" },
  { key: "country", label: "Country", query: "country" },
  { key: "indie", label: "Indie", query: "indie" },
  { key: "classical", label: "Classical", query: "classical" },
  { key: "metal", label: "Metal", query: "metal" },
  { key: "folk", label: "Folk", query: "folk" },
  { key: "blues", label: "Blues", query: "blues" },
  { key: "soul", label: "Soul", query: "soul" },
  { key: "alternative", label: "Alternative", query: "alternative" },
  { key: "dance", label: "Dance", query: "dance" },
  { key: "reggae", label: "Reggae", query: "reggae" },
  { key: "kpop", label: "K-Pop", query: "k-pop" },
];

/** Non-listening nodes in Apple's Music genre tree. */
const SKIP_GENRE_NAMES = new Set([
  "Music",
  "Music Videos",
  "Karaoke",
  "Spoken Word",
  "Hörspiele",
]);

type ItunesGenreNode = {
  id?: number | string;
  name?: string;
  subgenres?: Record<string, ItunesGenreNode>;
};

function genreSearchQuery(name: string): string {
  return name.replace(/\//g, " ").replace(/\s+/g, " ").trim();
}

function itunesChildren(node: ItunesGenreNode | undefined): ItunesGenreNode[] {
  return Object.values(node?.subgenres || {}).filter(Boolean);
}

function toSubgenre(node: ItunesGenreNode): BrowseSubgenre | null {
  if (!node.name || node.id == null || SKIP_GENRE_NAMES.has(node.name)) {
    return null;
  }
  return {
    key: String(node.id),
    label: node.name,
    query: genreSearchQuery(node.name),
  };
}

function toStyle(node: ItunesGenreNode): BrowsePillConfig | null {
  if (!node.name || node.id == null || SKIP_GENRE_NAMES.has(node.name)) {
    return null;
  }

  const subgenres = itunesChildren(node)
    .map(toSubgenre)
    .filter((sub): sub is BrowseSubgenre => Boolean(sub))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    key: String(node.id),
    label: node.name,
    query: genreSearchQuery(node.name),
    subgenres: subgenres.length > 0 ? subgenres : undefined,
  };
}

/**
 * Apple's full Music genre tree (same IDs as catalog genres). Public iTunes
 * storefront endpoint — no MusicKit token required.
 */
async function getItunesMusicStyles(
  storefront: string,
): Promise<BrowsePillConfig[]> {
  const cacheKey = `itunes-music-styles:${storefront}`;
  const cached = playlistCache.get(cacheKey);
  if (cached) return cached as BrowsePillConfig[];

  try {
    const urls = [
      `https://itunes.apple.com/${storefront}/WebObjects/MZStoreServices.woa/ws/genres?id=34`,
      "https://itunes.apple.com/WebObjects/MZStoreServices.woa/ws/genres?id=34",
    ];

    for (const url of urls) {
      const res = await fetch(url, {
        next: { revalidate: 86400, tags: [`itunes-genres-${storefront}`] },
      });
      if (!res.ok) continue;

      const data = (await res.json()) as
        | Record<string, ItunesGenreNode>
        | ItunesGenreNode;
      const root =
        data && typeof data === "object" && "34" in data
          ? (data as Record<string, ItunesGenreNode>)["34"]
          : (data as ItunesGenreNode);

      const styles = itunesChildren(root)
        .map(toStyle)
        .filter((style): style is BrowsePillConfig => Boolean(style))
        .sort((a, b) => a.label.localeCompare(b.label));

      if (styles.length > 0) {
        playlistCache.set(cacheKey, styles, 86400);
        return styles;
      }
    }

    return [];
  } catch (err) {
    console.error("iTunes genre tree fetch failed:", err);
    return [];
  }
}

/**
 * Top-level Apple Music styles for the Genres page: the complete Music
 * genre tree, merged with catalog top-chart genres from
 * GET /v1/catalog/{storefront}/genres.
 */
async function getAppleMusicStyles(
  storefront: string,
): Promise<BrowsePillConfig[]> {
  const [itunesStyles, catalogGenres] = await Promise.all([
    getItunesMusicStyles(storefront),
    getCatalogTopGenres(storefront),
  ]);

  const byId = new Map<string, BrowsePillConfig>();
  for (const style of itunesStyles) byId.set(style.key, style);

  for (const genre of catalogGenres) {
    if (!genre.name || SKIP_GENRE_NAMES.has(genre.name)) continue;
    if (byId.has(genre.id)) continue;
    byId.set(genre.id, {
      key: genre.id,
      label: genre.name,
      query: genreSearchQuery(genre.name),
    });
  }

  const styles = [...byId.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  return styles.length > 0 ? styles : BROWSE_CATEGORIES;
}

/**
 * Search the Apple Music catalog for playlists matching a single term.
 * Mirrors getEditorialPlaylists() but for one query at a time, with its own
 * cache key and a larger limit so each browse pill has plenty to show.
 */
async function getBrowsePlaylists(
  query: string,
  storefront: string = STOREFRONT,
  limit: number = 12,
): Promise<ApplePlaylistResult[]> {
  const safeLimit = Math.max(1, Math.min(limit, 25));
  const cacheKey = `am-browse-playlists:${storefront}:${query}:${safeLimit}`;
  const cached = playlistCache.get(cacheKey);
  if (cached) return cached as ApplePlaylistResult[];

  const result = await appleMusicFetch<ApplePlaylistSearchResponse>(
    `/catalog/${storefront}/search?term=${encodeURIComponent(
      query,
    )}&types=playlists&limit=${safeLimit}`,
    {
      tags: [`apple-browse-${storefront}-${query}`],
      revalidate: 3600 * 6,
    },
  );

  const playlists = (result?.results?.playlists?.data || [])
    .map(parsePlaylist)
    .filter((playlist) => playlist.id);

  if (playlists.length > 0) {
    playlistCache.set(cacheKey, playlists, 3600 * 6);
  }

  return playlists;
}

export async function searchCatalogPlaylists(
  query: string,
  storefront: string = STOREFRONT,
  limit: number = 12,
): Promise<ApplePlaylistResult[]> {
  return getBrowsePlaylists(query, storefront, limit);
}

/**
 * Pre-fetch browse pills with bounded concurrency. Each pill carries its own
 * playlist array, so the client can switch pills instantly with no extra
 * network calls.
 *
 * Concurrency is capped at 4: bursting all 16–18 pills in parallel was the
 * root cause of the 429 storm observed during `next build` (28 rate-limited
 * requests in a single build). 4 concurrent calls finish in well under the
 * ISR budget while staying under Apple Music's per-JWT rate limit.
 */
async function fetchBrowseSection(
  sectionKey: string,
  sectionLabel: string,
  pills: BrowsePillConfig[],
  storefront: string = STOREFRONT,
  keepEmpty = false,
): Promise<BrowseSection> {
  const resolvedPills = await mapWithConcurrency(pills, 4, async (pill) => ({
    ...pill,
    playlists: await getBrowsePlaylists(
      pill.query,
      storefront,
      keepEmpty ? 8 : 12,
    ),
  }));

  return {
    key: sectionKey,
    label: sectionLabel,
    pills: keepEmpty
      ? resolvedPills
      : resolvedPills.filter((pill) => pill.playlists.length > 0),
  } as BrowseSection;
}

export async function getMoodsBrowseData(
  storefront: string = STOREFRONT,
): Promise<BrowseSection> {
  return fetchBrowseSection("moods", "Moods", BROWSE_MOODS, storefront);
}

export async function getCategoriesBrowseData(
  storefront: string = STOREFRONT,
): Promise<BrowseSection> {
  const styles = await getAppleMusicStyles(storefront);
  return fetchBrowseSection("categories", "Genres", styles, storefront, true);
}

/**
 * Pre-fetch all browse pills (moods + categories) in parallel.
 * Prefer getMoodsBrowseData / getCategoriesBrowseData on single-purpose pages.
 */
export async function getBrowseData(
  storefront: string = STOREFRONT,
): Promise<AppleBrowseData> {
  const [moods, categories] = await Promise.all([
    getMoodsBrowseData(storefront),
    getCategoriesBrowseData(storefront),
  ]);

  return { moods, categories };
}

// ─── Top 100 / Trending ───────────────────────────────────────────────────────

/**
 * Apple Music Official Top 100 Playlist IDs
 */
export const TOP_100_PLAYLIST_IDS = [
  "pl.d25f5d1181894928af76c85c967f8f31", // Top 100: Global
  "pl.606afcbb70264d2eb2b51d8dbcfa6a12", // Top 100: USA
  "pl.c121e42ba15949aba848d795a05b2df5", // Top 100: UK
  "pl.23a4b6562b324ceb8dbbbdcdd13da2ef", // Top 100: Canada
  "pl.4fc87e86cfab4a1eaa26edcc3fba8836", // Top 100: Australia
  "pl.c86f26485ff743a3bb0f1c9fc1ae29e7", // Top 100: Mexico
  "pl.043a2c9876114d95a4659988497567be", // Top 100: Japan
  "pl.11ac7cc7d09741c5822e8c66e5c7edbb", // Top 100: Brazil
  "pl.6e8cfd81d51042648fa36c9df5236b8d", // Top 100: France
  "pl.c10a2c113db14685a0b09fa5834d8e8b", // Top 100: Germany
  "pl.2fc68f6d68004ae993dadfe99de83877", // Top 100: Nigeria
  "pl.d116fa6286734b74acff3d38a740fe0d", // Top 100: Colombia
];

/**
 * Get trending songs (top tracks from Global Top 100 playlist)
 *
 * Wrapped with React cache() because the homepage renders TrendingSongs plus
 * other sections that may all call this during a cold render.
 */
export const getTrendingSongs = cache(
  async (limit: number = 10): Promise<AppleSongResult[]> => {
    // IMPORTANT: The full playlist detail call enriches *all* tracks (up to 100)
    // with a second /songs?ids=... batch call. The homepage only needs a handful,
    // so we fetch + enrich only the first N tracks to keep TTFB low.
    const playlistId = TOP_100_PLAYLIST_IDS[0]; // Global Top 100
    const safeLimit = Math.max(1, Math.min(limit, 25));

    const cacheKey = `am-trending-songs-${STOREFRONT}-${playlistId}-${safeLimit}`;
    const cached = playlistCache.get(cacheKey);
    if (cached) return cached as AppleSongResult[];

    return singleFlight(cacheKey, async () => {
      const data = await appleMusicFetch<any>(
        `/catalog/${STOREFRONT}/playlists/${playlistId}?include=tracks`,
        {
          tags: [appleTags.trending, appleTags.playlist(playlistId)],
          revalidate: 3600,
        },
      );

      const item = data?.data?.[0];
      if (!item) return [];

      const trackItems = (item.relationships?.tracks?.data || []).slice(
        0,
        safeLimit,
      );

      const tracks: AppleSongResult[] = trackItems.map((t: any) => {
        const ta = t.attributes || {};
        return {
          id: t.id,
          name: ta.name || "",
          artistName: ta.artistName || "",
          trackNumber: ta.trackNumber || 0,
          discNumber: ta.discNumber || 1,
          durationMs: ta.durationInMillis || 0,
          artworkUrl: ta.artwork?.url,
          url: ta.url,
          hasLyrics: ta.hasLyrics,
          genreNames: ta.genreNames || [],
          albumName: ta.albumName,
          albumId: extractAlbumIdFromUrl(ta.url),
        } as AppleSongResult;
      });

      // Enrich only these N tracks for clickable artist/album links.
      if (tracks.length > 0) {
        const enrichmentMap = await fetchAppleSongEnrichmentsByIds(
          tracks.map((t) => t.id),
        );
        for (const track of tracks) {
          const enriched = enrichmentMap.get(track.id);
          if (!enriched) continue;
          if (enriched.artists.length > 0) {
            track.artists = enriched.artists;
            track.artistId = enriched.artists[0].id;
          }
          if (enriched.albumId) {
            track.albumId = enriched.albumId;
          }
        }
      }

      playlistCache.set(cacheKey, tracks, 3600 * 6);
      return tracks;
    });
  },
);

/**
 * Get Daily Top 100 playlists from Apple Music
 */
export async function getDailyTop100Playlists(
  storefront: string = STOREFRONT,
  limit: number = 12,
): Promise<ApplePlaylistResult[]> {
  const idsParam = TOP_100_PLAYLIST_IDS.slice(0, limit).join(",");
  const cacheKey = `am-daily-top-100-ids-${storefront}-${idsParam}`;
  const cached = playlistCache.get(cacheKey);
  if (cached) return cached as ApplePlaylistResult[];

  return singleFlight(cacheKey, async () => {
    const data = await appleMusicFetch<any>(
      `/catalog/${storefront}/playlists?ids=${idsParam}`,
      {
        tags: [appleTags.dailyTop100],
        revalidate: 3600 * 6,
      },
    );

    const playlistsData = data?.data || [];

    // Sort them so they match the order of the requested IDs
    const parsed = playlistsData.map(parsePlaylist);
    const playlists = TOP_100_PLAYLIST_IDS.slice(0, limit)
      .map((id) => parsed.find((p: any) => p.id === id))
      .filter(Boolean) as ApplePlaylistResult[];

    if (playlists.length > 0) {
      playlistCache.set(cacheKey, playlists, 3600 * 12);
    }

    return playlists;
  });
}

// ─── Playlist Detail ──────────────────────────────────────────────────────────

/**
 * Get detailed playlist information including tracks
 */
export async function getPlaylistDetail(
  playlistId: string,
  storefront: string = STOREFRONT,
): Promise<ApplePlaylistDetail | null> {
  const cacheKey = `am-playlist-detail-${storefront}-${playlistId}`;
  const cached = playlistCache.get(cacheKey);
  if (cached) return cached as ApplePlaylistDetail;

  return singleFlight(cacheKey, async () => {
    const data = await appleMusicFetch<any>(
      `/catalog/${storefront}/playlists/${playlistId}?include=tracks`,
      {
        tags: [appleTags.playlist(playlistId)],
        revalidate: 3600 * 6,
      },
    );

    const item = data?.data?.[0];
    if (!item) return null;

    const basePlaylist = parsePlaylist(item);
    const trackItems = item.relationships?.tracks?.data || [];

    const tracks: AppleSongResult[] = trackItems.map((t: any) => {
      const ta = t.attributes || {};
      return {
        id: t.id,
        name: ta.name || "",
        artistName: ta.artistName || "",
        trackNumber: ta.trackNumber || 0,
        discNumber: ta.discNumber || 1,
        durationMs: ta.durationInMillis || 0,
        artworkUrl: ta.artwork?.url,
        url: ta.url,
        hasLyrics: ta.hasLyrics,
        genreNames: ta.genreNames || [],
        // For playlist tracks, the album associated to the track isn't included in the relationship.
        // Easiest is to fall back to the text field albumName. Wait until user enters album.
        albumName: ta.albumName,
        albumId: extractAlbumIdFromUrl(ta.url),
      } as AppleSongResult;
    });

    // Artist/album IDs for links are filled in on the client via
    // /api/apple-playlist-enrich so this page is not blocked on a second
    // full-playlist catalog songs request.

    const result: ApplePlaylistDetail = {
      ...basePlaylist,
      tracks,
      trackCount: tracks.length,
    };

    playlistCache.set(cacheKey, result, 3600 * 6);

    return result;
  });
}
