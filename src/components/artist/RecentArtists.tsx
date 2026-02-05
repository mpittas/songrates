"use client";

import { useEffect, useState } from "react";
import { getArtistHistory } from "@/lib/history";
import { ArtistVisit } from "@/types/artist";
import { formatTimeAgo, createSlug } from "@/lib/utils";
import PrefetchLink from "@/components/ui/PrefetchLink";

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
      <h2 className="font-mono text-xs text-neutral-500 mb-4 tracking-wide">
        recent_
      </h2>
      <div className="space-y-1">
        {history.map((artist) => (
          <PrefetchLink
            key={artist.id}
            href={`/artist/${createSlug(artist.name, artist.id)}`}
            artistId={artist.id}
            className="flex items-center justify-between p-2 -mx-2 group hover:bg-[#0a0a0d] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 overflow-hidden bg-[#0a0a0d] border border-[#1a1a1f] flex-shrink-0 group-hover:border-[#00f0ff]/30">
                {images[artist.id] ? (
                  <img
                    src={images[artist.id]}
                    alt={artist.name}
                    width={32}
                    height={32}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-all"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    <span className="text-[10px] font-mono">
                      {artist.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-sm text-neutral-400 group-hover:text-[#00f0ff] transition-colors truncate max-w-[200px]">
                {artist.name}
              </span>
            </div>
            <span className="text-[10px] text-neutral-600 font-mono">
              {formatTimeAgo(artist.visitedAt)}
            </span>
          </PrefetchLink>
        ))}
      </div>
    </div>
  );
}
