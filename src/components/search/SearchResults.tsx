"use client";

import { useState, useEffect } from "react";
import ArtistList from "@/components/artist/ArtistList";

import { SearchResultsProps } from "@/types/search";
import { Artist, ArtistVisit } from "@/types/artist";
import { Album } from "@/types/music";
import { getArtistHistory } from "@/lib/history";
import { formatTimeAgo, createSlug } from "@/lib/utils";
import PrefetchLink from "@/components/ui/PrefetchLink";

export default function SearchResults({
  query,
  onClose,
  isFocused,
}: SearchResultsProps & { isFocused: boolean }) {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);

  // History state
  const [history, setHistory] = useState<ArtistVisit[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});

  // Fetch search results
  useEffect(() => {
    if (!query) {
      setArtists([]);
      return;
    }

    setLoading(true);
    fetch(`/api/musicbrainz/artist?query=${query}`)
      .then((res) => res.json())
      .then((data) => setArtists(data.artists))
      .finally(() => setLoading(false));
  }, [query]);

  // Fetch history when focused and empty
  useEffect(() => {
    if (isFocused && !query) {
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
    }
  }, [isFocused, query]);

  if (!query && (!isFocused || history.length === 0)) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-[#0a0a0d] border-x border-b border-[#1a1a1f] z-[9999] max-h-[320px] overflow-y-auto shadow-2xl">
      {/* Search Loading State */}
      {query && loading && (
        <div className="flex items-center justify-center py-12 text-neutral-600 font-mono text-sm tracking-widest uppercase">
          <span>Searching...</span>
        </div>
      )}

      {/* Search Results */}
      {query && !loading && <ArtistList artists={artists} />}

      {/* Recent Artists */}
      {!query && isFocused && history.length > 0 && (
        <div className="py-2">
          <div className="px-4 py-2 border-b border-[#1a1a1f] mb-1">
            <h2 className="font-mono text-[10px] text-neutral-500 tracking-wider uppercase">
              Recent
            </h2>
          </div>
          <div className="divide-y divide-[#1a1a1f]/50">
            {history.map((artist) => (
              <PrefetchLink
                key={artist.id}
                href={`/artist/${createSlug(artist.name, artist.id)}`}
                artistId={artist.id}
                className="flex items-center justify-between p-3 hover:bg-[#0f0f12] transition-colors group"
                onMouseDown={(e) => {
                  // Prevent input blur before click is registered
                  e.preventDefault();
                }}
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
                        className="w-full h-full object-cover transition-all grayscale group-hover:grayscale-0"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <span className="text-[10px] font-mono">
                          {artist.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-neutral-400 group-hover:text-[#00f0ff] transition-colors">
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
      )}
    </div>
  );
}
