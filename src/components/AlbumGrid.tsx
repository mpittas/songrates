"use client";

import OptimizedImage from "@/components/OptimizedImage";
import { useState } from "react";
import Link from "next/link";
import { FaWikipediaW } from "react-icons/fa";

import { Album } from "@/types/music";

interface AlbumCardProps {
  album: Album;
  onSelect: (id: string) => void;
  isPriority?: boolean;
  layout?: "grid" | "list";
}

function AlbumCard({
  album,
  onSelect,
  isPriority = false,
  layout = "grid",
}: AlbumCardProps) {
  const imageUrl = `https://coverartarchive.org/release-group/${album.id}/front-250`;
  const [imageError, setImageError] = useState(false);

  if (layout === "list") {
    return (
      <Link
        href={`/album/${album.id}`}
        className="flex items-center gap-4 p-1.5 hover:bg-[#0a0a0d] border-b border-[#1a1a1f] last:border-0 group transition-colors"
      >
        <div className="relative w-8 h-8 shrink-0 border border-[#1a1a1f] overflow-hidden bg-[#0a0a0d]">
          {!imageError ? (
            <OptimizedImage
              src={imageUrl}
              alt={album.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              fallbackText="·"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0a0a0d] p-2 opacity-40">
              <img
                src="/vinyl-placeholder.svg"
                alt="No art"
                className="w-full h-full object-contain invert"
              />
            </div>
          )}
        </div>
        <div className="flex bg-transparent min-w-0 flex-1 justify-between items-baseline gap-4">
          <h3 className="text-neutral-300 text-sm truncate group-hover:text-[#00f0ff] transition-colors">
            {album.title}
          </h3>
          <span className="text-neutral-600 font-mono text-[10px] shrink-0">
            {album.releaseDate?.split("-")[0] || "—"}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/album/${album.id}`} className="group block">
      <div className="aspect-square bg-[#0a0a0d] mb-2 overflow-hidden relative border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 transition-colors">
        {!imageError ? (
          <OptimizedImage
            src={imageUrl}
            alt={album.title}
            fill
            className="object-cover transition-all duration-300"
            onError={() => setImageError(true)}
            priority={isPriority}
            fallbackText="·"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0a0a0d] p-10 opacity-20 group-hover:opacity-30 transition-opacity">
            <img
              src="/vinyl-placeholder.svg"
              alt="No art"
              className="w-full h-full object-contain invert"
            />
          </div>
        )}

        {album.wikipediaUrl && (
          <div
            onClick={(e) => {
              e.preventDefault();
              window.open(album.wikipediaUrl, "_blank");
            }}
            className="absolute top-2 right-2 bg-[#050507]/90 text-neutral-400 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 border border-[#1a1a1f] hover:text-[#00f0ff] hover:border-[#00f0ff]/50 cursor-pointer"
            title="Wikipedia"
          >
            <FaWikipediaW size={10} />
          </div>
        )}
      </div>
      <h3 className="text-neutral-300 text-xs truncate group-hover:text-[#00f0ff] transition-colors">
        {album.title}
      </h3>
      <p className="text-neutral-500 text-[10px] font-mono mt-0.5">
        {album.releaseDate?.split("-")[0] || "—"}
      </p>
    </Link>
  );
}

export default function AlbumGrid({
  albums,
  onSelectAlbum,
  title,
  priorityCount = 0,
  layout = "grid",
}: {
  albums: Album[];
  onSelectAlbum: (id: string) => void;
  title?: string;
  priorityCount?: number;
  layout?: "grid" | "list";
}) {
  if (albums.length === 0) return null;

  return (
    <div>
      {title && (
        <h2 className="font-mono text-xs text-neutral-500 mb-4 tracking-wide">
          {title.toLowerCase()}_
          <span className="text-neutral-700 ml-1">{albums.length}</span>
        </h2>
      )}

      {layout === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
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
