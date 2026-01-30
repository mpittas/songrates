import ArtistSkeleton from "@/components/artist/ArtistSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100 p-6 md:px-16 md:py-8">
      <ArtistSkeleton />
    </main>
  );
}
