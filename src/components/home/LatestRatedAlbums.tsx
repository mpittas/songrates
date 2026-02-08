import { createAdminClient } from "@/utils/supabase/admin";

import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface RatedAlbum {
  userId: string;
  userName: string;
  albumId: string;
  albumTitle: string;
  artistName: string;
  rating: number;
  ratedAt: string;
  thumbnailUrl: string | null;
  albumType: string;
}

interface RPCAlbum {
  user_id: string;
  album_id: string;
  title: string;
  artist_name: string;
  average_rating: number;
  rated_at: string;
  user_first_name: string | null;
  user_last_name: string | null;
  user_email: string | null;
  thumbnail_url: string | null;
  album_type: string;
}

async function getLatestRatedAlbums(
  filterType?: string,
): Promise<RatedAlbum[]> {
  const supabase = createAdminClient();

  if (!supabase) {
    return [];
  }

  // Use the optimized RPC function
  const { data, error } = await supabase.rpc("get_latest_completed_albums", {
    limit_count: 4,
    filter_type: filterType || null,
  });

  if (error) {
    console.error("Error fetching latest rated albums:", error);
    return [];
  }

  if (!data) return [];

  return (data as RPCAlbum[]).map((album) => {
    let userName = "Anonymous";

    // Prioritize First Name
    if (album.user_first_name) {
      userName = album.user_first_name;
    }
    // Fallback to email username
    else if (album.user_email) {
      userName = album.user_email.split("@")[0];
    }

    return {
      userId: album.user_id,
      userName,
      albumId: album.album_id,
      albumTitle: album.title,
      artistName: album.artist_name,
      rating: Number(album.average_rating),
      ratedAt: album.rated_at,
      thumbnailUrl: album.thumbnail_url,
      albumType: album.album_type,
    };
  });
}

export default async function LatestRatedAlbums({
  filterType,
  sectionTitle = "Latest Community Ratings",
}: {
  filterType?: string;
  sectionTitle?: string;
}) {
  const ratedAlbums = await getLatestRatedAlbums(filterType);

  if (ratedAlbums.length === 0) return null;

  return (
    <section className="relative z-20 py-12 border-t border-white/5">
      <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-light tracking-tight text-white mb-8 self-start">
          {sectionTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {ratedAlbums.map((album) => {
            const imageUrl =
              album.thumbnailUrl ||
              `https://coverartarchive.org/release-group/${album.albumId}/front-250`;

            return (
              <Link
                key={`${album.userId}-${album.albumId}`}
                href={`/album/${album.albumId}?userId=${album.userId}&userName=${encodeURIComponent(album.userName)}`}
                className="group relative bg-neutral-900/40 border border-white/5 overflow-hidden transition-all duration-300 hover:bg-neutral-900/60 hover:border-white/10"
              >
                <div className="p-4 flex flex-col gap-4">
                  {/* Header: User & Time */}
                  <div className="flex justify-between items-start text-xs text-neutral-400">
                    <span className="font-medium text-white/80 line-clamp-1 max-w-[60%]">
                      {album.userName}
                    </span>
                    <time
                      dateTime={album.ratedAt}
                      className="text-[10px] uppercase tracking-wider opacity-60"
                    >
                      {new Date(album.ratedAt).toLocaleDateString()}
                    </time>
                  </div>

                  {/* Album Content */}
                  <div className="flex gap-4">
                    <div className="relative w-16 h-16 shrink-0 bg-neutral-800 shadow-lg">
                      <OptimizedImage
                        src={imageUrl}
                        alt={album.albumTitle}
                        fill
                        className="object-cover"
                        fallbackSrc="/vinyl-placeholder.svg"
                      />
                    </div>

                    <div className="flex flex-col justify-center min-w-0">
                      <h3 className="font-medium text-sm text-white truncate group-hover:text-[#00f0ff] transition-colors">
                        {album.albumTitle}
                      </h3>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        {album.artistName}
                      </p>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                      RATED
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-white">
                        {album.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-neutral-600">/ 10</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
