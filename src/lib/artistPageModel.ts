import {
  classifyAlbumType,
  artworkUrl,
  type AppleArtistAlbum,
  type ArtistDiscography,
} from "@/lib/appleMusic/api";
import type { Album, ArtistInfo, TopSong } from "@/types/music";

function mapAppleAlbum(a: AppleArtistAlbum, typeOverride?: string): Album {
  return {
    id: a.id,
    title: a.name,
    artistName: a.artistName,
    artworkUrl: a.artworkUrl ? artworkUrl(a.artworkUrl, 300) : undefined,
    releaseDate: a.releaseDate,
    type: typeOverride || classifyAlbumType(a),
  };
}

/** Maps Apple API discography fetches into props for `ArtistPageContent`. */
export function mapArtistDiscographyToPageData(
  discography: ArtistDiscography,
  allFullAlbums: AppleArtistAlbum[],
  allSingles: AppleArtistAlbum[],
): {
  artistName: string;
  artistInfo: ArtistInfo;
  topSongs: TopSong[];
  essentialAlbums: Album[];
  albums: Album[];
  epsAndSingles: Album[];
  appearsOn: Album[];
} {
  const { artist } = discography;

  const topSongs: TopSong[] = discography.topSongs.map((s) => ({
    id: s.id,
    name: s.name,
    artistName: s.artistName,
    artistId: s.artistId,
    albumName: s.albumName,
    albumId: s.albumId,
    artworkUrl: s.artworkUrl ? artworkUrl(s.artworkUrl, 100) : undefined,
    releaseDate: s.releaseDate,
    durationMs: s.durationMs,
  }));

  const essentialAlbums = discography.featuredAlbums.map((a) =>
    mapAppleAlbum(a, "Album"),
  );
  const albums = allFullAlbums.map((a) => mapAppleAlbum(a, "Album"));
  const epsAndSingles = allSingles
    .map((a) => mapAppleAlbum(a))
    .sort((x, y) => (y.releaseDate || "").localeCompare(x.releaseDate || ""));
  const appearsOn = discography.appearsOn.map((a) => mapAppleAlbum(a));

  const artistInfo: ArtistInfo = {
    image: artist.artworkUrl ? artworkUrl(artist.artworkUrl, 300) : null,
    url: artist.url || null,
    genres: artist.genres,
  };

  return {
    artistName: artist.name,
    artistInfo,
    topSongs,
    essentialAlbums,
    albums,
    epsAndSingles,
    appearsOn,
  };
}
