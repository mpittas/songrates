"use client";

import { LuEllipsis, LuStarOff } from "react-icons/lu";
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
      className="text-red-700 hover:bg-red-50 hover:text-red-700"
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
            "flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70",
            compact ? "size-7" : "size-8",
          )}
          aria-label="Album options"
        >
          <LuEllipsis size={compact ? 15 : 17} />
        </button>
      )}
    >
      <AlbumFavoriteMenuItem
        album={album}
        onFavoriteChange={onFavoriteChange}
      />
      {showRemoveAllRatings ? (
        <>
          <ContextDropdownDivider />
          <RemoveAllRatingsMenuItem album={album} />
        </>
      ) : null}
    </ContextDropdown>
  );
}
