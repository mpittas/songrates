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
  const imageUrl = `https://coverartarchive.org/release-group/${album.id}/front-250`;
  const [imageError, setImageError] = useState(false);

  const blurDataURL =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMwYTBhMGQiLz48L3N2Zz4=";

  return (
    <Link href={`/album/${album.id}`} className="group block">
      <div className="aspect-square bg-[#0a0a0d] mb-2 overflow-hidden relative border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 transition-colors">
        {!imageError ? (
          <Image
            src={imageUrl}
            alt={album.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            className="object-cover  transition-all duration-300"
            onError={() => setImageError(true)}
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL={blurDataURL}
            quality={60}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-700 font-mono text-2xl">
            ·
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
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
      <h3 className="text-neutral-300 text-xs truncate group-hover:text-[#00f0ff] transition-colors">
        {album.title}
      </h3>
      <p className="text-neutral-600 text-[10px] font-mono mt-0.5">
        {album.releaseDate?.split("-")[0] || "—"}
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
        <h2 className="font-mono text-xs text-neutral-500 mb-4 tracking-wide">
          {title.toLowerCase()}_
          <span className="text-neutral-700 ml-1">{albums.length}</span>
        </h2>
      )}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {albums.map((album, index) => (
          <AlbumCard
            key={album.id}
            album={album}
            onSelect={onSelectAlbum}
            isPriority={index < 4}
          />
        ))}
      </div>
    </div>
  );
}
