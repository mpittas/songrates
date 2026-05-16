"use client";

import { BsThreeDotsVertical } from "react-icons/bs";
import { LuStarOff } from "react-icons/lu";
import ContextDropdown, {
  ContextDropdownDivider,
  ContextDropdownMenuItem,
  useCloseContextDropdown,
} from "@/components/ui/ContextDropdown";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { useRatingsContext } from "@/context/RatingsContext";
import type { Album } from "@/types/music";
import { cn } from "@/lib/utils";

interface AlbumCardDropdownProps {
  album: Album;
  compact?: boolean;
  showRemoveAllRatings?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
  onOpenChange?: (open: boolean) => void;
}

function AlbumFavoriteMenuItem({
  album,
  onFavoriteChange,
}: {
  album: Album;
  onFavoriteChange?: (isFavorite: boolean) => void;
}) {
  const close = useCloseContextDropdown();

  return (
    <FavoriteButton
      itemId={album.id}
      itemType="album"
      itemName={album.title}
      artistName={album.artistName}
      thumbnailUrl={album.artworkUrl}
      variant="menu-item"
      menuTheme="light"
      onMenuClick={close ?? undefined}
      onFavoriteChange={onFavoriteChange}
    />
  );
}

function RemoveAllRatingsMenuItem({ album }: { album: Album }) {
  const close = useCloseContextDropdown();
  const { removeAlbumRating } = useRatingsContext();

  return (
    <ContextDropdownMenuItem
      icon={<LuStarOff size={14} />}
      label="Remove all ratings"
      onClick={() => {
        if (
          !confirm(
            `Remove all your ratings for "${album.title}"? This cannot be undone.`,
          )
        ) {
          return;
        }
        void removeAlbumRating(album.id);
        close?.();
      }}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    />
  );
}

export default function AlbumCardDropdown({
  album,
  compact = false,
  showRemoveAllRatings = false,
  onFavoriteChange,
  onOpenChange,
}: AlbumCardDropdownProps) {
  return (
    <ContextDropdown
      placement="above"
      align="right"
      onOpenChange={onOpenChange}
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }}
          className={cn(
            "rounded-md text-neutral-600 hover:text-neutral-900 bg-white/90 hover:bg-white border border-neutral-200 shadow-sm transition-colors",
            compact ? "p-1" : "p-1.5",
          )}
          aria-label="Album options"
        >
          <BsThreeDotsVertical size={compact ? 12 : 14} />
        </button>
      )}
    >
      <AlbumFavoriteMenuItem album={album} onFavoriteChange={onFavoriteChange} />
      {showRemoveAllRatings ? (
        <>
          <ContextDropdownDivider />
          <RemoveAllRatingsMenuItem album={album} />
        </>
      ) : null}
    </ContextDropdown>
  );
}
