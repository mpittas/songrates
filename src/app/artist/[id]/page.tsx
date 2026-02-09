import {
  getArtistWithViews,
  getArtistFullAlbums,
  getArtistSingles,
  classifyAlbumType,
  artworkUrl,
  type AppleArtistAlbum,
} from "@/lib/appleMusic/api";
import ArtistPageContent from "@/components/artist/ArtistPageContent";
import type { Album, ArtistInfo, TopSong } from "@/types/music";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Resolve an artist ID from a slug like "artist-name-12345"
 * Apple Music IDs are numeric
 */
function resolveArtistId(slug: string): string {
  if (/^\d+$/.test(slug)) return slug;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart)) return lastPart;
  return slug;
}

export default async function ArtistPage({ params }: PageProps) {
  const { id: slug } = await params;
  const id = resolveArtistId(slug);

  // Single API call gets artist + all views (top-songs, featured-albums,
  // full-albums, singles, compilation-albums, appears-on-albums).
  // The ?views= param returns up to 10 items per view.
  // For full lists we paginate full-albums and singles separately.
  const [discography, allFullAlbums, allSingles] = await Promise.all([
    getArtistWithViews(id),
    getArtistFullAlbums(id),
    getArtistSingles(id),
  ]);

  if (!discography) {
    return (
      <main className="min-h-screen bg-[#050507] text-neutral-100 p-6 md:px-16 md:py-8 flex items-center justify-center">
        <div className="text-neutral-500 font-mono">Artist not found</div>
      </main>
    );
  }

  const { artist } = discography;

  // Helper to map Apple albums → our Album type
  const mapAlbum = (a: AppleArtistAlbum, typeOverride?: string): Album => ({
    id: a.id,
    title: a.name,
    artistName: a.artistName,
    artworkUrl: a.artworkUrl ? artworkUrl(a.artworkUrl, 300) : undefined,
    releaseDate: a.releaseDate,
    type: typeOverride || classifyAlbumType(a),
  });

  // ── Top Songs (from views, up to 10) ──
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

  // ── Essential Albums: from featured-albums view (Apple's curated picks) ──
  const essentialAlbums: Album[] = discography.featuredAlbums.map((a) =>
    mapAlbum(a, "Album"),
  );

  // ── Albums: full paginated list from /view/full-albums ──
  const albums: Album[] = allFullAlbums.map((a) => mapAlbum(a, "Album"));

  // ── EPs & Singles: full paginated list from /view/singles ──
  const epsAndSingles: Album[] = allSingles
    .map((a) => mapAlbum(a))
    .sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""));

  // ── Appears On (from views, up to 10) ──
  const appearsOn: Album[] = discography.appearsOn.map((a) => mapAlbum(a));

  const artistInfo: ArtistInfo = {
    image: artist.artworkUrl ? artworkUrl(artist.artworkUrl, 300) : null,
    description: artist.editorialNotes || null,
    url: artist.url || null,
    genres: artist.genres,
  };

  return (
    <ArtistPageContent
      artistId={id}
      artistName={artist.name}
      artistInfo={artistInfo}
      topSongs={topSongs}
      essentialAlbums={essentialAlbums}
      albums={albums}
      epsAndSingles={epsAndSingles}
      appearsOn={appearsOn}
    />
  );
}
