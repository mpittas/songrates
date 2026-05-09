import { getDailyTop100Playlists, artworkUrl } from "@/lib/appleMusic/api";
import OptimizedImage from "@/components/ui/OptimizedImage";
import MySection from "@/components/ui/MySection";
import Link from "next/link";
import HeadingRow from "@/main-components/HeadingRow";

export default async function DailyTop100Playlists() {
  const playlists = await getDailyTop100Playlists("us", 12);

  if (!playlists || playlists.length === 0) return null;

  return (
    <section className="py-12 sm:py-14">
      <MySection>
        <div className="w-full">
          <HeadingRow title="Daily Top 100 Playlists" />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {playlists.slice(0, 5).map((playlist) => {
              const imageUrl = artworkUrl(playlist.artworkUrl, 400);

              return (
                <Link
                  key={playlist.id}
                  href={`/apple-playlist/${playlist.id}`}
                  className="group overflow-hidden rounded-xl border border-[#dfdfdf] bg-white p-2 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#ececec]">
                    <OptimizedImage
                      src={imageUrl}
                      alt={playlist.name}
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      fallbackSrc="/vinyl-placeholder.svg"
                    />
                  </div>

                  <div className="pt-2">
                    <h3 className="line-clamp-1 text-base font-semibold text-[#1f1f1f] transition-colors group-hover:text-black">
                      {playlist.name}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-xs text-[#555]">
                      Top 100 Playlist
                    </p>
                    <p className="mt-1 text-[11px] text-[#9b9b9b]">
                      {playlist.curatorName || "Playlist"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </MySection>
    </section>
  );
}
