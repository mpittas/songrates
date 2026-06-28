/**
 * Apple Music API client — public surface.
 *
 * This module is a barrel that re-exports the public API from the split
 * submodules so existing `@/lib/appleMusic/api` imports keep working
 * unchanged. The implementation lives in:
 *
 *   - core.ts        transport (fetch, ETag, retry) + artworkUrl
 *   - types.ts       all interfaces and response shapes
 *   - parsers.ts     raw Apple JSON → typed shapes (internal)
 *   - enrichments.ts batch fetchApple*EnrichmentsByIds
 *   - artist.ts      getArtistWithViews + classifyAlbumType
 *   - catalog.ts     search, album detail, explore, browse, playlists, trending
 *
 * Caching/edge-request behaviour is identical to the previous monolithic file.
 */

// core
export { artworkUrl } from "./core";

// types
export type {
  AppleSearchResult,
  AppleArtistResult,
  AppleAlbumResult,
  AppleSongResult,
  AppleSongEnrichment,
  AppleAlbumEnrichment,
  AppleArtistEnrichment,
  AppleArtistDetail,
  ArtistDiscography,
  AppleArtistAlbum,
  AppleTopSong,
  AppleAlbumDetail,
  AppleTrack,
  ApplePlaylistResult,
  ApplePlaylistDetail,
  AppleGenreResult,
  AppleExploreGenreSection,
  AppleExploreData,
  BrowsePillConfig,
  BrowsePill,
  BrowseSection,
  AppleBrowseData,
} from "./types";

// enrichments
export {
  fetchAppleSongEnrichmentsByIds,
  fetchAppleAlbumEnrichmentsByIds,
  fetchAppleArtistEnrichmentsByIds,
} from "./enrichments";

// artist
export { getArtistWithViews, classifyAlbumType } from "./artist";

// catalog
export {
  searchAppleMusic,
  getAlbumDetail,
  getExploreData,
  getBrowseData,
  getTrendingSongs,
  getDailyTop100Playlists,
  getPlaylistDetail,
  TOP_100_PLAYLIST_IDS,
  BROWSE_MOODS,
  BROWSE_CATEGORIES,
} from "./catalog";
