"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Album {
  id: string;
  title: string;
  releaseDate?: string;
  wikipediaUrl?: string;
}

function AlbumCard({
  album,
  onSelect,
}: {
  album: Album;
  onSelect: (id: string) => void;
}) {
  const [imgSrc, setImgSrc] = useState<string>(
    `https://coverartarchive.org/release-group/${album.id}/front-250`,
  );
  const [error, setError] = useState(false);

  return (
    <div onClick={() => onSelect(album.id)} className="group cursor-pointer">
      <div className="aspect-square bg-zinc-900 mb-3 overflow-hidden relative rounded-md">
        {!error ? (
          <Image
            src={imgSrc}
            alt={album.title}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            sizes="(max-width: 768px) 50vw, 33vw"
            onError={() => setError(true)}
            unoptimized // Bypass Next.js server for speed
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
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white/90 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 backdrop-blur-sm"
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
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} onSelect={onSelectAlbum} />
      ))}
    </div>
  );
}
