"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import OptimizedImage from "@/components/ui/OptimizedImage";
import MySection from "@/components/ui/MySection";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSlug } from "@/lib/utils";
import HeadingRow from "@/main-components/HeadingRow";

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

// Separate component to handle user link navigation without nested <a> tags
function UserLink({ userName }: { userName: string }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/user/${userName}`);
  };

  return (
    <span
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-[10px] text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
    >
      <span className="tracking-wider">By:</span>
      <span className="font-medium">@{userName}</span>
    </span>
  );
}

export default function LatestRatedAlbums() {
  const [ratedAlbums, setRatedAlbums] = useState<RatedAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestRatedAlbums = async () => {
      const supabase = createClient();

      const { data, error } = await supabase.rpc(
        "get_latest_completed_albums",
        {
          limit_count: 4,
        },
      );

      if (error) {
        console.error(
          "LatestRatedAlbums: RPC error:",
          error.message,
          error.details,
          error.hint,
        );
        setLoading(false);
        return;
      }

      if (!data) {
        setLoading(false);
        return;
      }

      const albums: RatedAlbum[] = (data as RPCAlbum[]).map((album) => ({
        userId: album.user_id,
        albumId: album.album_id,
        albumTitle: album.title,
        artistName: album.artist_name,
        rating: Number(album.average_rating),
        ratedAt: album.rated_at,
        thumbnailUrl: album.thumbnail_url || null,
        userName: album.user_name || "Anonymous",
      }));

      setRatedAlbums(albums);
      setLoading(false);
    };

    fetchLatestRatedAlbums();
  }, []);

  if (loading) {
    return (
      <section className="py-12 sm:py-14">
        <MySection>
          <div className="w-full">
            <HeadingRow title="Latest Community Rated Albums" badgeText="" />
            <div className="w-full flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </MySection>
      </section>
    );
  }

  if (ratedAlbums.length === 0) return null;

  return (
    <section className="py-12 sm:py-14">
      <MySection>
        <div className="w-full">
          <HeadingRow
            title="Latest Community Rated Albums"
            badgeText=""
            seeAllHref="/rated"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
            {ratedAlbums.map((album, index) => {
              const imageUrl = album.thumbnailUrl || "/vinyl-placeholder.svg";
              const slug = createSlug(album.albumTitle, album.albumId);
              const href = `/album/${slug}?userId=${album.userId}&userName=${encodeURIComponent(album.userName)}`;

              return (
                <Link
                  key={`${album.albumId}-${index}`}
                  href={href}
                  className="group rounded-xl border border-[#dfdfdf] bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-end items-start text-xs text-neutral-500">
                      <time
                        dateTime={album.ratedAt}
                        className="text-[10px] tracking-wide"
                      >
                        {new Date(album.ratedAt).toLocaleDateString()}
                      </time>
                    </div>

                    <div className="flex gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#ececec]">
                        <OptimizedImage
                          src={imageUrl}
                          alt={album.albumTitle}
                          fill
                          className="object-cover"
                          fallbackSrc="/vinyl-placeholder.svg"
                        />
                      </div>

                      <div className="flex flex-col justify-center min-w-0">
                        <h3 className="font-semibold text-sm text-[#1f1f1f] truncate group-hover:text-black transition-colors">
                          {album.albumTitle}
                        </h3>
                        <p className="text-xs text-neutral-500 truncate mt-0.5">
                          {album.artistName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between border-t border-[#ececec] pt-2.5">
                      <UserLink userName={album.userName} />
                      <span className="rounded-full bg-[#4fbf82] px-2 py-0.5 text-[11px] font-semibold text-white">
                        {album.rating.toFixed(1)}
                      </span>
                    </div>
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
