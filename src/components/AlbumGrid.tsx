"use client";

import { Album } from "@/types/music";
import AlbumCard from "@/components/AlbumCard";

export default function AlbumGrid({
  albums,
  onSelectAlbum,
  title,
  priorityCount = 0,
  layout = "grid",
  className,
  gridCols,
}: {
  albums: Album[];
  onSelectAlbum: (id: string) => void;
  title?: string;
  priorityCount?: number;
  layout?: "grid" | "list";
  className?: string;
  gridCols?: number;
}) {
  if (albums.length === 0) return null;

  const defaultGridCols =
    gridCols === 3
      ? "bg-transparent md:grid-cols-3"
      : "bg-transparent md:grid-cols-4";

  return (
    <div>
      {title && (
        <h2 className="font-mono text-xs text-neutral-500 mb-4 tracking-wide">
          {title.toLowerCase()}_
          <span className="text-neutral-700 ml-1">{albums.length}</span>
        </h2>
      )}

      {layout === "grid" ? (
        <div
          className={`grid grid-cols-2 gap-6 sm:grid-cols-3 ${defaultGridCols} ${className || ""}`}
        >
          {albums.map((album, index) => (
            <AlbumCard
              key={album.id}
              album={album}
              onSelect={onSelectAlbum}
              isPriority={index < priorityCount}
              layout="grid"
            />
          ))}
        </div>
      ) : (
        <div className="border-t border-[#1a1a1f]">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onSelect={onSelectAlbum}
              layout="list"
            />
          ))}
        </div>
      )}
    </div>
  );
}
