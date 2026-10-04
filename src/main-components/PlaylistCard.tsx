import MediaCard from "@/components/ui/MediaCard";
import { artworkUrl, type ApplePlaylistResult } from "@/lib/appleMusic/api";

export default function PlaylistCard({
  playlist,
  index = 0,
  subtitle,
}: {
  playlist: ApplePlaylistResult;
  index?: number;
  /** Overrides the curator line under the title. */
  subtitle?: string;
}) {
  return (
    <MediaCard
      href={`/apple-playlist/${playlist.id}`}
      imageUrl={artworkUrl(playlist.artworkUrl, 400)}
      title={playlist.name}
      subtitle={subtitle ?? (playlist.curatorName || "Apple Music")}
      priority={index < 2}
    />
  );
}
