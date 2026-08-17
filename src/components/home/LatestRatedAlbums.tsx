import InstantLink from "@/components/ui/InstantLink";

import OptimizedImage from "@/components/ui/OptimizedImage";
import MySection from "@/components/ui/MySection";
import HeadingRow from "@/main-components/HeadingRow";
import { createSlug } from "@/lib/utils";
import { createPublicClient } from "@/utils/supabase/public";

interface RatedAlbum {
  userId: string;
  albumId: string;
  albumTitle: string;
  artistName: string;
  rating: number;
  ratedAt: string;
  thumbnailUrl: string | null;
  userName: string;
}

interface RPCAlbum {
  user_id: string;
  album_id: string;
  title: string;
  artist_name: string;
  average_rating: number;
  rated_at: string;
  thumbnail_url: string | null;
  album_type: string;
  user_name: string;
}

/** ISR-aligned with home page — avoids a client-side Supabase round-trip per visit. */
export default async function LatestRatedAlbums() {
  const supabase = createPublicClient();

  const { data, error } = await supabase.rpc("get_latest_completed_albums", {
    limit_count: 4,
  });

  if (error) {
    console.error("LatestRatedAlbums: RPC error:", error.message);
    return null;
  }

  if (!data || (data as RPCAlbum[]).length === 0) return null;

  const ratedAlbums: RatedAlbum[] = (data as RPCAlbum[]).map((album) => ({
    userId: album.user_id,
    albumId: album.album_id,
    albumTitle: album.title,
    artistName: album.artist_name,
    rating: Number(album.average_rating),
    ratedAt: album.rated_at,
    thumbnailUrl: album.thumbnail_url || null,
    userName: album.user_name || "Anonymous",
  }));

  return (
    <section className="py-12 sm:py-14">
      <MySection>
        <div className="w-full">
          <HeadingRow title="Latest Community Rated Albums" badgeText="" />

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ratedAlbums.map((album, index) => {
              const imageUrl = album.thumbnailUrl || "/vinyl-placeholder.svg";
              const slug = createSlug(album.albumTitle, album.albumId);
              const href = `/album/${slug}?userId=${album.userId}&userName=${encodeURIComponent(album.userName)}`;

              return (
                <div
                  key={`${album.albumId}-${index}`}
                  className="group rounded-xl border border-[#dfdfdf] bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-end text-xs text-neutral-500">
                      <time
                        dateTime={album.ratedAt}
                        className="text-[10px] tracking-wide"
                      >
                        {new Date(album.ratedAt).toLocaleDateString()}
                      </time>
                    </div>

                    <InstantLink href={href} className="flex gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#ececec]">
                        <OptimizedImage
                          src={imageUrl}
                          alt={album.albumTitle}
                          fill
                          className="object-cover"
                          fallbackSrc="/vinyl-placeholder.svg"
                        />
                      </div>

                      <div className="flex min-w-0 flex-col justify-center">
                        <h3 className="truncate text-sm font-semibold text-[#1f1f1f] transition-colors group-hover:text-black">
                          {album.albumTitle}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-neutral-500">
                          {album.artistName}
                        </p>
                      </div>
                    </InstantLink>

                    <div className="mt-1 flex items-center justify-between border-t border-[#ececec] pt-2.5">
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-neutral-500">
                        <span className="tracking-wider">By:</span>
                        <InstantLink
                          href={`/user/${album.userName}`}
                          className="font-medium transition-colors hover:text-neutral-900 hover:underline"
                        >
                          @{album.userName}
                        </InstantLink>
                      </span>
                      <span className="rounded-full bg-[#4fbf82] px-2 py-0.5 text-[11px] font-semibold text-white">
                        {album.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </MySection>
    </section>
  );
}
