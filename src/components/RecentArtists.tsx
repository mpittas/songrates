"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getArtistHistory, type ArtistVisit } from "@/lib/history";

export default function RecentArtists() {
  const [history, setHistory] = useState<ArtistVisit[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const data = getArtistHistory();
    setHistory(data);

    if (data.length > 0) {
      const ids = data.map((a) => a.id).join(",");
      fetch(`/api/images/artists?ids=${ids}`)
        .then((res) => res.json())
        .then((data) => {
          setImages((prev) => ({ ...prev, ...data.images }));
        })
        .catch((e) => console.error(e));
    }
  }, []);

  if (history.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-thin text-zinc-400 mb-8 tracking-tight">
        Recently Visited
      </h2>
      <div className="grid gap-1">
        {history.map((artist) => (
          <Link
            key={artist.id}
            href={`/artist/${artist.id}`}
            className="text-zinc-100 hover:text-white transition-colors py-3 px-4 rounded-lg hover:bg-zinc-900/50 block group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Image Placeholder */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                  {images[artist.id] ? (
                    <img
                      src={images[artist.id]}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <span className="text-[10px] font-mono">
                        {artist.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <span className="font-light group-hover:font-normal transition-all">
                  {artist.name}
                </span>
              </div>
              <span className="text-xs text-zinc-600 font-mono">
                {formatTime(artist.visitedAt)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
