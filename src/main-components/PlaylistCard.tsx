import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { artworkUrl, type ApplePlaylistResult } from "@/lib/appleMusic/api";

export default function PlaylistCard({
  playlist,
  index = 0,
}: {
  playlist: ApplePlaylistResult;
  index?: number;
}) {
  return (
    <Link
      href={`/apple-playlist/${playlist.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#dfdfdf] bg-white p-2 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#ececec]">
        <OptimizedImage
          src={artworkUrl(playlist.artworkUrl, 500)}
          alt={playlist.name}
          fill
          priority={index < 2}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          fallbackSrc="/vinyl-placeholder.svg"
        />
      </div>
      <div className="pt-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-neutral-900 group-hover:underline">
          {playlist.name}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
          {playlist.curatorName || "Apple Music"}
        </p>
      </div>
    </Link>
  );
}
