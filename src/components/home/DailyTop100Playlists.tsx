import { getDailyTop100Playlists, artworkUrl } from "@/lib/appleMusic/api";
import OptimizedImage from "@/components/ui/OptimizedImage";
import PlaylistCarousel from "@/components/home/PlaylistCarousel";
import Link from "next/link";
import { FaPlay } from "react-icons/fa";

export default async function DailyTop100Playlists() {
  const playlists = await getDailyTop100Playlists("us", 12);

  if (!playlists || playlists.length === 0) return null;

  return (
    <section className="relative z-20 py-12 border-t border-white/5">
      <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-6">
        <div className="w-full flex justify-between items-end mb-8">
          <h2 className="text-2xl font-light tracking-tight text-white self-start">
            Daily Top 100 Playlists
          </h2>
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest hidden sm:block mb-1">
            Apple Music Charts
          </span>
        </div>

        <PlaylistCarousel>
          {playlists.map((playlist) => {
            const imageUrl = artworkUrl(playlist.artworkUrl, 400);

            return (
              <Link
                key={playlist.id}
                href={`/apple-playlist/${playlist.id}`}
                className="min-w-[calc(80%-1rem)] sm:min-w-[calc(40%-1rem)] md:min-w-[calc(33.333%-1rem)] lg:w-[calc((100%-4rem)/5)] lg:min-w-[calc((100%-4rem)/5)] shrink-0 snap-start group relative bg-neutral-900/40 border border-white/5 overflow-hidden transition-all duration-300 hover:bg-neutral-900/60 hover:border-white/10 flex flex-col rounded-lg"
              >
                {/* Image Section */}
                <div className="relative w-full aspect-square bg-neutral-800 overflow-hidden shrink-0">
                  <OptimizedImage
                    src={imageUrl}
                    alt={playlist.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    fallbackSrc="/vinyl-placeholder.svg"
                  />

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <FaPlay className="w-5 h-5 ml-1" />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-medium text-base text-white line-clamp-1 group-hover:text-[#00f0ff] transition-colors mb-1.5 min-h-[1.5rem]">
                    {playlist.name}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-2 tracking-wide leading-relaxed min-h-[2.5rem]">
                    {playlist.description || `Curator: ${playlist.curatorName}`}
                  </p>
                </div>
              </Link>
            );
          })}
        </PlaylistCarousel>
      </div>
    </section>
  );
}
