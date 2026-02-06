import {
  getArtistAlbums,
  getArtistData,
  resolveArtistId,
} from "@/lib/musicbrainz";
import ArtistPageContent from "@/components/artist/ArtistPageContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtistPage({ params }: PageProps) {
  const { id: slug } = await params;
  const id = await resolveArtistId(slug);

  if (!id) {
    return (
      <main className="min-h-screen bg-[#050507] text-neutral-100 p-6 md:px-16 md:py-8 flex items-center justify-center">
        <div className="text-neutral-500 font-mono">Artist not found</div>
      </main>
    );
  }

  // Fetch all data in parallel
  const [artistData, albums] = await Promise.all([
    getArtistData(id),
    getArtistAlbums(id),
  ]);

  if (!artistData.artist.name) {
    return (
      <main className="min-h-screen bg-[#050507] text-neutral-100 p-6 md:px-16 md:py-8 flex items-center justify-center">
        <div className="text-neutral-500 font-mono">Artist not found</div>
      </main>
    );
  }

  return (
    <ArtistPageContent
      artistId={id}
      artistName={artistData.artist.name}
      artistInfo={artistData.artistInfo}
      albums={albums}
    />
  );
}
