"use client";

import { BsThreeDotsVertical } from "react-icons/bs";
import ContextDropdown, {
  useCloseContextDropdown,
} from "@/components/ui/ContextDropdown";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { cn } from "@/lib/utils";

export interface ArtistCardArtist {
  id: string;
  name: string;
  artworkUrl?: string;
}

interface ArtistCardDropdownProps {
  artist: ArtistCardArtist;
  compact?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
  onOpenChange?: (open: boolean) => void;
}

function ArtistFavoriteMenuItem({
  artist,
  onFavoriteChange,
}: {
  artist: ArtistCardArtist;
  onFavoriteChange?: (isFavorite: boolean) => void;
}) {
  const close = useCloseContextDropdown();

  return (
    <FavoriteButton
      itemId={artist.id}
      itemType="artist"
      itemName={artist.name}
      thumbnailUrl={artist.artworkUrl}
      variant="menu-item"
      menuTheme="light"
      onMenuClick={close ?? undefined}
      onFavoriteChange={onFavoriteChange}
    />
  );
}

export default function ArtistCardDropdown({
  artist,
  compact = false,
  onFavoriteChange,
  onOpenChange,
}: ArtistCardDropdownProps) {
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
          aria-label="Artist options"
        >
          <BsThreeDotsVertical size={compact ? 12 : 14} />
        </button>
      )}
    >
      <ArtistFavoriteMenuItem
        artist={artist}
        onFavoriteChange={onFavoriteChange}
      />
    </ContextDropdown>
  );
}
