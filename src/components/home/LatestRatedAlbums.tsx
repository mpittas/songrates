import InstantLink from "@/components/ui/InstantLink";
import CardRail from "@/components/ui/CardRail";
import { MediaCardArt } from "@/components/ui/MediaCard";
import MySection from "@/components/ui/MySection";
import SectionHeader from "@/components/ui/SectionHeader";
import { ratingColor } from "@/components/rating/constants";
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

function formatRatedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** ISR-aligned with home page — avoids a client-side Supabase round-trip per visit. */
export default async function LatestRatedAlbums() {
  const supabase = createPublicClient();

  const { data, error } = await supabase.rpc("get_latest_completed_albums", {
    limit_count: 8,
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
    <MySection className="py-10 sm:py-14">
      <SectionHeader
        eyebrow="Community"
        title="Freshly rated albums"
        description="Albums listeners just finished scoring, every track."
      />

      <CardRail columns={4}>
        {ratedAlbums.map((album, index) => {
          const slug = createSlug(album.albumTitle, album.albumId);
          const href = `/album/${slug}?userId=${album.userId}&userName=${encodeURIComponent(album.userName)}`;

          return (
            <article key={`${album.albumId}-${index}`} className="group min-w-0">
              <InstantLink
                href={href}
                className="block rounded-xl outline-offset-4"
              >
                <MediaCardArt
                  imageUrl={album.thumbnailUrl}
                  alt={album.albumTitle}
                >
                  <span
                    className="absolute bottom-2.5 left-2.5 flex h-7 items-center rounded-lg px-2 text-[13px] font-semibold text-white tabular-nums shadow-[0_6px_16px_-4px_rgb(0_0_0/0.45)]"
                    style={{ backgroundColor: ratingColor(album.rating) }}
                  >
                    {album.rating.toFixed(1)}
                  </span>
                </MediaCardArt>
                <h3 className="mt-3 truncate text-[14px] leading-5 font-medium tracking-[-0.01em] text-ink">
                  {album.albumTitle}
                </h3>
                <p className="truncate text-[13px] leading-5 text-ink-2">
                  {album.artistName}
                </p>
              </InstantLink>

              <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-ink-3">
                <span
                  aria-hidden
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white uppercase"
                >
                  {album.userName.slice(0, 1)}
                </span>
                <InstantLink
                  href={`/user/${album.userName}`}
                  className="min-w-0 truncate font-medium text-ink-2 transition-colors hover:text-ink hover:underline"
                >
                  @{album.userName}
                </InstantLink>
                <span aria-hidden>·</span>
                <time dateTime={album.ratedAt} className="shrink-0">
                  {formatRatedDate(album.ratedAt)}
                </time>
              </p>
            </article>
          );
        })}
      </CardRail>
    </MySection>
  );
}
