import {
  getArtist,
  getArtistAlbums,
  groupArtistAlbums,
  artworkUrl,
} from "@/lib/appleMusic/api";
import ArtistPageContent from "@/components/artist/ArtistPageContent";
import type { Album, ArtistInfo, GroupedReleases } from "@/types/music";

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

  // Fetch artist info and albums in parallel
  const [artist, allAlbums] = await Promise.all([
    getArtist(id),
    getArtistAlbums(id),
  ]);

  if (!artist) {
    return (
      <main className="min-h-screen bg-[#050507] text-neutral-100 p-6 md:px-16 md:py-8 flex items-center justify-center">
        <div className="text-neutral-500 font-mono">Artist not found</div>
      </main>
    );
  }

  // Group albums into categories
  const grouped = groupArtistAlbums(allAlbums);

  // Map to our Album type for the main albums section
  const albums: Album[] = grouped.albums.map((a) => ({
    id: a.id,
    title: a.name,
    artistName: a.artistName,
    artworkUrl: a.artworkUrl ? artworkUrl(a.artworkUrl, 300) : undefined,
    releaseDate: a.releaseDate,
    type: "Album",
  }));

  // Map other releases into GroupedReleases
  const otherReleases: GroupedReleases = {};

  if (grouped.eps.length > 0) {
    otherReleases["EPs"] = grouped.eps.map((a) => ({
      id: a.id,
      title: a.name,
      artworkUrl: a.artworkUrl ? artworkUrl(a.artworkUrl, 300) : undefined,
      releaseDate: a.releaseDate,
      type: "EP",
    }));
  }

  if (grouped.singles.length > 0) {
    otherReleases["Singles"] = grouped.singles.map((a) => ({
      id: a.id,
      title: a.name,
      artworkUrl: a.artworkUrl ? artworkUrl(a.artworkUrl, 300) : undefined,
      releaseDate: a.releaseDate,
      type: "Single",
    }));
  }

  if (grouped.compilations.length > 0) {
    otherReleases["Compilations"] = grouped.compilations.map((a) => ({
      id: a.id,
      title: a.name,
      artworkUrl: a.artworkUrl ? artworkUrl(a.artworkUrl, 300) : undefined,
      releaseDate: a.releaseDate,
      type: "Compilation",
    }));
  }

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
      albums={albums}
      otherReleases={otherReleases}
    />
  );
}
