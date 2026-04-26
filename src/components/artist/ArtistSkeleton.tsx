import MySection from "@/components/ui/MySection";

export default function ArtistSkeleton() {
  return (
    <main className="min-h-screen bg-[#f7f7f7] text-neutral-900">
      <MySection className="py-8 md:py-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-4">
          <div className="flex items-baseline gap-6 w-full">
            <div className="h-4 w-12 bg-[#e8e8e8] rounded"></div>{" "}
            {/* Back link */}
            <div className="h-8 md:h-10 w-64 bg-[#e8e8e8] rounded"></div>{" "}
            {/* Artist Name */}
          </div>
          {/* Sort buttons skeleton */}
          <div className="flex gap-4">
            <div className="h-3 w-8 bg-[#e8e8e8] rounded"></div>
            <div className="h-3 w-8 bg-[#e8e8e8] rounded"></div>
            <div className="h-3 w-8 bg-[#e8e8e8] rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[140px_1fr] gap-12 items-start">
          {/* Sidebar Skeleton */}
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="w-full aspect-square bg-[#e8e8e8] border border-[#dddddd]"></div>{" "}
            {/* Artist Image */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-[#e8e8e8] rounded"></div>
              <div className="h-3 w-3/4 bg-[#e8e8e8] rounded"></div>
              <div className="h-3 w-1/2 bg-[#e8e8e8] rounded"></div>
            </div>
          </div>

          {/* Discography Skeleton */}
          <div className="min-w-0 space-y-16">
            {/* Main Albums Section */}
            <div className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[#dddddd] pb-2">
                <div className="h-4 w-32 bg-[#e8e8e8] rounded"></div>{" "}
                {/* Section Title */}
                <div className="h-3 w-12 bg-[#e8e8e8] rounded"></div>{" "}
                {/* Count */}
              </div>

              {/* Grid of Albums - Matching AlbumGrid.tsx: 2 cols mobile, 3 sm, 4 md */}
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-square bg-[#e8e8e8] border border-[#dddddd]"></div>{" "}
                    {/* Album Cover */}
                    <div className="space-y-1.5">
                      <div className="h-3 w-3/4 bg-[#e8e8e8] rounded"></div>{" "}
                      {/* Title */}
                      <div className="h-2 w-1/2 bg-[#e8e8e8] rounded"></div>{" "}
                      {/* Year */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MySection>
    </main>
  );
}
