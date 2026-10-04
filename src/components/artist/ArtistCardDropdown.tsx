"use client";

import { LuEllipsis } from "react-icons/lu";
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
            "flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70",
            compact ? "size-7" : "size-8",
          )}
          aria-label="Artist options"
        >
          <LuEllipsis size={compact ? 15 : 17} />
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
