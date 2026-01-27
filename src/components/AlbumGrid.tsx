"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Album {
  id: string;
  title: string;
  releaseDate?: string;
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
      <div className="aspect-square bg-zinc-900 mb-3 overflow-hidden relative">
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
