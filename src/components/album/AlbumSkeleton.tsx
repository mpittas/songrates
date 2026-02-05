import MySection from "@/components/ui/MySection";

export default function AlbumSkeleton() {
  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100">
      <MySection className="pt-7 pb-24 animate-pulse">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-10 items-start mb-16">
          {/* Album Cover */}
          <div className="w-full md:w-64 shrink-0 aspect-square relative bg-[#1a1a1f] border border-[#1a1a1f]"></div>

          {/* Album Details */}
          <div className="flex-1 w-full space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                {/* Type badge */}
                <div className="h-6 w-16 bg-[#1a1a1f] border border-[#1a1a1f]"></div>
              </div>

              {/* Back link */}
              <div className="h-5 w-32 bg-[#1a1a1f]"></div>
            </div>

            {/* Title */}
            <div className="h-10 md:h-14 w-3/4 bg-[#1a1a1f] rounded-none my-2"></div>

            <div className="flex flex-col gap-2">
              {/* Artist Name */}
              <div className="h-7 w-48 bg-[#1a1a1f]"></div>
              {/* Release date & track count */}
              <div className="h-4 w-40 bg-[#1a1a1f]"></div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="h-6 w-16 bg-[#1a1a1f] border border-[#1a1a1f]"></div>
              <div className="h-6 w-20 bg-[#1a1a1f] border border-[#1a1a1f]"></div>
              <div className="h-6 w-14 bg-[#1a1a1f] border border-[#1a1a1f]"></div>
            </div>

            {/* Rating & Wiki */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex flex-col gap-1">
                <div className="h-3 w-12 bg-[#1a1a1f]"></div>
                <div className="h-7 w-16 bg-[#1a1a1f]"></div>
              </div>
              <div className="h-8 w-20 bg-[#1a1a1f] border border-[#1a1a1f]"></div>
            </div>
          </div>
        </div>

        {/* Tracklist Section */}
        <div className="w-full">
          <div className="border border-[#1a1a1f] bg-[#0a0a0d]/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1a1a1f] flex justify-between items-end">
              {/* "TRACKLIST_" */}
              <div className="h-4 w-24 bg-[#1a1a1f]"></div>
            </div>
            <div>
              {/* Track Items */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border-b border-[#1a1a1f]">
                  <div className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Play Button */}
                      <div className="w-6 h-6 border border-[#1a1a1f] bg-[#1a1a1f] shrink-0"></div>

                      {/* Number */}
                      <div className="w-6 h-4 bg-[#1a1a1f] shrink-0"></div>

                      <div className="flex flex-col min-w-0 gap-1 w-full max-w-md">
                        {/* Title */}
                        <div className="h-4 w-3/4 bg-[#1a1a1f]"></div>
                        {/* Artist/features */}
                        {i % 3 === 0 && (
                          <div className="h-3 w-1/3 bg-[#1a1a1f]"></div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Duration */}
                      <div className="h-3 w-10 bg-[#1a1a1f] hidden sm:block"></div>
                      {/* Stars */}
                      <div className="flex gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className="w-2.5 h-2.5 border border-[#1a1a1f] bg-[#1a1a1f]"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MySection>
    </main>
  );
}
