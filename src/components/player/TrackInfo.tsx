import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import { TrackInfoProps } from "@/types/player";

export default function TrackInfo({ currentTrack }: TrackInfoProps) {
  if (!currentTrack) return null;

  return (
    <div className="flex items-center gap-4 min-w-0 flex-1 md:flex-none md:w-1/4">
      {/* Album Art */}
      <Link
        href={currentTrack.albumId ? `/album/${currentTrack.albumId}` : "#"}
        className="w-10 h-10 relative shrink-0 border border-[#1a1a1f] hover:border-[#00f0ff] transition-colors overflow-hidden group/image"
      >
        <OptimizedImage
          src={currentTrack.albumImageUrl || "/vinyl-placeholder.svg"}
          alt={currentTrack.artistName || "Unknown Artist"}
          width={40}
          height={40}
          priority
          className="object-cover transition-all"
          fallbackSrc="/vinyl-placeholder.svg"
          fallbackText={currentTrack.title?.slice(0, 2) || "??"}
        />
      </Link>

      <div className="min-w-0 flex flex-col justify-center">
        <Link
          href={currentTrack.albumId ? `/album/${currentTrack.albumId}` : "#"}
          className="text-sm text-neutral-200 truncate hover:text-[#00f0ff] transition-colors block"
        >
          {currentTrack.title}
        </Link>
        <Link
          href={
            currentTrack.artistId ? `/artist/${currentTrack.artistId}` : "#"
          }
          className="text-xs text-neutral-500 truncate hover:text-[#00f0ff] transition-colors"
        >
          {currentTrack.artistName}
        </Link>
      </div>
    </div>
  );
}
