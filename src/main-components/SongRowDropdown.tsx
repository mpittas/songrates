"use client";

import { FaPlus } from "react-icons/fa6";
import { LuEllipsis } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { HiOutlineMicrophone } from "react-icons/hi2";
import { FiShare2 } from "react-icons/fi";
import FavoriteButton from "@/components/ui/FavoriteButton";
import ContextDropdown, {
  ContextDropdownDivider,
  ContextDropdownMenuItem,
  useCloseContextDropdown,
} from "@/components/ui/ContextDropdown";

interface SongRowDropdownProps {
  isLyricsOpen: boolean;
  onToggleLyrics: () => void;
  onAddToPlaylist: () => void;
  onShare?: () => void;
  /** Warm lyrics cache when user hovers "Show Lyrics" before clicking */
  onPrefetchLyrics?: () => void;
  trackId?: string;
  trackName?: string;
  artistName?: string;
  thumbnailUrl?: string | null;
  albumId?: string;
  albumName?: string;
  durationMs?: number;
  artistId?: string;
  artists?: { id: string; name: string }[];
  onFavoriteChange?: (isFavorite: boolean) => void;
}

function TrackFavoriteMenuItem({
  trackId,
  trackName,
  artistName,
  thumbnailUrl,
  albumId,
  albumName,
  durationMs,
  artistId,
  artists,
  onFavoriteChange,
}: Pick<
  SongRowDropdownProps,
  | "trackId"
  | "trackName"
  | "artistName"
  | "thumbnailUrl"
  | "albumId"
  | "albumName"
  | "durationMs"
  | "artistId"
  | "artists"
  | "onFavoriteChange"
>) {
  const close = useCloseContextDropdown();

  if (!trackId || !trackName) return null;

  return (
    <FavoriteButton
      itemId={trackId}
      itemType="track"
      itemName={trackName}
      artistName={artistName}
      thumbnailUrl={thumbnailUrl ?? undefined}
      albumId={albumId}
      albumName={albumName}
      durationMs={durationMs}
      artistId={artistId}
      artists={artists}
      variant="menu-item"
      menuTheme="light"
      onMenuClick={close ?? undefined}
      onFavoriteChange={onFavoriteChange}
    />
  );
}

export default function SongRowDropdown({
  isLyricsOpen,
  onToggleLyrics,
  onAddToPlaylist,
  onShare,
  onPrefetchLyrics,
  trackId,
  trackName,
  artistName,
  thumbnailUrl,
  albumId,
  albumName,
  durationMs,
  artistId,
  artists,
  onFavoriteChange,
}: SongRowDropdownProps) {
  return (
    <ContextDropdown
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={() => toggle()}
          aria-label="More options"
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "flex size-8 cursor-pointer items-center justify-center rounded-full text-ink-3 transition-[color,background-color,opacity] hover:bg-ink/[0.06] hover:text-ink focus-visible:opacity-100",
            open
              ? "bg-ink/[0.06] text-ink"
              : "pointer-fine:opacity-0 pointer-fine:group-hover/row:opacity-100",
          )}
        >
          <LuEllipsis size={18} />
        </button>
      )}
    >
      <TrackFavoriteMenuItem
        trackId={trackId}
        trackName={trackName}
        artistName={artistName}
        thumbnailUrl={thumbnailUrl}
        albumId={albumId}
        albumName={albumName}
        durationMs={durationMs}
        artistId={artistId}
        artists={artists}
        onFavoriteChange={onFavoriteChange}
      />

      <ContextDropdownMenuItem
        icon={<FaPlus size={12} />}
        label="Add to Playlist"
        onClick={onAddToPlaylist}
      />

      <ContextDropdownMenuItem
        icon={<HiOutlineMicrophone size={12} />}
        label={isLyricsOpen ? "Hide Lyrics" : "Show Lyrics"}
        onClick={onToggleLyrics}
        onMouseEnter={onPrefetchLyrics}
      />

      <ContextDropdownDivider />

      {onShare && (
        <ContextDropdownMenuItem
          icon={<FiShare2 size={12} />}
          label="Share"
          onClick={onShare}
        />
      )}
    </ContextDropdown>
  );
}
