"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

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
    <Link href={`/album/${album.id}`} className="group block">
      <div className="aspect-square bg-zinc-900 mb-2 overflow-hidden relative border border-zinc-800">
        {!imageError ? (
          <Image
            src={imageUrl}
            alt={album.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
            className="object-cover transition-opacity duration-150"
            onError={() => setImageError(true)}
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL={blurDataURL}
            quality={90}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-800 text-4xl">
            ●
          </div>
        )}

        {album.wikipediaUrl && (
          <div
            onClick={(e) => {
              e.preventDefault();
              window.open(album.wikipediaUrl, "_blank");
            }}
            className="absolute top-1 right-1 bg-black text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 border border-zinc-700 hover:border-white cursor-pointer"
            title="View on Wikipedia"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10 15.3 15.3 0 1 4-10z"></path>
            </svg>
          </div>
        )}
      </div>
      <h3 className="text-zinc-100 text-xs font-bold truncate">
        {album.title}
      </h3>
      <p className="text-zinc-500 text-[10px] mt-0.5">
        {album.releaseDate?.split("-")[0] || "Unknown"}
      </p>
    </Link>
  );
}

export default function AlbumGrid({
  albums,
  onSelectAlbum,
  title,
}: {
  albums: Album[];
  onSelectAlbum: (id: string) => void;
  title?: string;
}) {
  if (albums.length === 0) return null;

  return (
    <div>
      {title && (
        <h2 className="text-lg font-light text-zinc-400 mb-4">
          {title}
          <span className="text-zinc-600 ml-2">({albums.length})</span>
        </h2>
      )}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {albums.map((album, index) => (
          <AlbumCard
            key={album.id}
            album={album}
            onSelect={onSelectAlbum}
            isPriority={index < 4} // Prioritize first row
          />
        ))}
      </div>
    </div>
  );
}
