"use client";

import { useState, useEffect } from "react";
import ArtistList from "@/components/artist/ArtistList";

import { SearchResultsProps } from "@/types/search";
import { Artist } from "@/types/artist";
import { Album } from "@/types/music";

export default function SearchResults({ query, onClose }: SearchResultsProps) {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);

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

  if (!query) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-[#0a0a0d] border-x border-b border-[#1a1a1f] z-[100] max-h-[400px] overflow-y-auto shadow-2xl">
      {loading ? (
        <div className="flex items-center justify-center py-12 text-neutral-600 font-mono text-sm tracking-widest uppercase">
          <span>Searching...</span>
        </div>
      ) : (
        <ArtistList artists={artists} />
      )}
    </div>
  );
}
