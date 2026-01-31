import Link from "next/link";
import { Track } from "@/types/music";

interface TrackInfoProps {
  currentTrack: Track;
}

export default function TrackInfo({ currentTrack }: TrackInfoProps) {
  if (!currentTrack) return null;

  return (
    <div className="flex items-center gap-4 min-w-[200px] w-1/4">
      {/* Album Art */}
      {currentTrack.albumImageUrl && (
        <Link
          href={
            currentTrack.artistId ? `/artist/${currentTrack.artistId}` : "#"
          }
          className="w-10 h-10 relative shrink-0 border border-[#1a1a1f] hover:border-[#00f0ff] transition-colors overflow-hidden group/image"
        >
          <img
            src={currentTrack.albumImageUrl}
            alt={currentTrack.artistName}
            width={40}
            height={40}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover transition-all"
          />
        </Link>
      )}

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
