"use client";

import { Album } from "@/types/music";
import AlbumCard from "@/components/album/AlbumCard";

export default function AlbumGrid({
  albums,
  onSelectAlbum,
  title,
  priorityCount = 0,
  layout = "grid",
  className,
  gridCols = 4,
  size = "default",
}: {
  albums: Album[];
  onSelectAlbum: (id: string) => void;
  title?: string;
  priorityCount?: number;
  layout?: "grid" | "list";
  className?: string;
  gridCols?: number;
  size?: "default" | "compact";
}) {
  if (albums.length === 0) return null;

  const colsClass = gridCols === 3 ? "md:grid-cols-3" : "md:grid-cols-4";
  const gapClass = size === "compact" ? "gap-3 sm:gap-4" : "gap-6";

  return (
    <div className={className}>
      {title && (
        <h2 className="font-mono text-[10px] text-neutral-500 mb-4 uppercase tracking-widest">
          {title}_<span className="text-neutral-700 ml-1">{albums.length}</span>
        </h2>
      )}

      {layout === "grid" ? (
        <div className={`grid grid-cols-2 ${gapClass} sm:grid-cols-3 ${colsClass}`}>
          {albums.map((album, index) => (
            <AlbumCard
              key={album.id}
              album={album}
              isPriority={index < priorityCount}
              layout="grid"
              size={size}
            />
          ))}
        </div>
      ) : (
        <div className="border-t border-white/5">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} layout="list" />
          ))}
        </div>
      )}
    </div>
  );
}
