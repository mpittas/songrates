"use client";

import { BsThreeDotsVertical } from "react-icons/bs";
import ContextDropdown, {
  useCloseContextDropdown,
} from "@/components/ui/ContextDropdown";
import FavoriteButton from "@/components/ui/FavoriteButton";
import type { Album } from "@/types/music";
import { cn } from "@/lib/utils";

interface AlbumCardDropdownProps {
  album: Album;
  compact?: boolean;
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

export default function AlbumCardDropdown({
  album,
  compact = false,
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
    </ContextDropdown>
  );
}
