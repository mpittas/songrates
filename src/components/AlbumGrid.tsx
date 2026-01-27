"use client";

import Image from "next/image";
import { useState } from "react";

interface Album {
  id: string;
  title: string;
  releaseDate?: string;
  wikipediaUrl?: string;
}

function AlbumCard({
  album,
  onSelect,
  isPriority = false,
}: {
  album: Album;
  onSelect: (id: string) => void;
  isPriority?: boolean;
}) {
  // Cover Art Archive provides optimized thumbnails at 250px, 500px, and 1200px
  // Using 250px for fastest loading - it's optimized specifically for grid displays
  const imageUrl = `https://coverartarchive.org/release-group/${album.id}/front-250`;
  const [imageError, setImageError] = useState(false);

  // Simple low-quality placeholder for perceived performance
  const blurDataURL =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxODE4MWIiLz48L3N2Zz4=";

  return (
    <div onClick={() => onSelect(album.id)} className="group cursor-pointer">
      <div className="aspect-square bg-zinc-900 mb-3 overflow-hidden relative rounded-md">
        {!imageError ? (
          <Image
            src={imageUrl}
            alt={album.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-150"
            onError={() => setImageError(true)}
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL={blurDataURL}
            quality={90}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-800 text-4xl font-thin">
            ●
          </div>
        )}

        {album.wikipediaUrl && (
          <a
            href={album.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            title="View on Wikipedia"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </a>
        )}
      </div>
      <h3 className="text-zinc-100 font-normal truncate">{album.title}</h3>
      <p className="text-zinc-500 text-sm font-mono mt-1">
        {album.releaseDate?.split("-")[0] || "Unknown"}
      </p>
    </div>
  );
}

export default function AlbumGrid({
  albums,
  onSelectAlbum,
}: {
  albums: Album[];
  onSelectAlbum: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
      {albums.map((album, index) => (
        <AlbumCard
          key={album.id}
          album={album}
          onSelect={onSelectAlbum}
          isPriority={index < 4} // Prioritize first row
        />
      ))}
    </div>
  );
}
