"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useRatings } from "@/hooks/useRatings";
import { FaPlay } from "react-icons/fa";

interface AlbumInfo {
  id: string;
  title: string;
  artist: { name: string; id: string };
  type: string;
  releaseDate: string;
  genres: string[];
  rating: number | null;
  wikipediaUrl: string | null;
  tracks: {
    id: string;
    title: string;
    number: string;
    length?: number;
  }[];
}

function TrackItem({
  track,
  artistName,
}: {
  track: AlbumInfo["tracks"][0];
  artistName: string;
}) {
  const { ratings, setRating } = useRatings();
  const rating = ratings[track.id] || 0;

  // Format milliseconds to mm:ss
  const formatTime = (ms?: number) => {
    if (!ms) return "-:--";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-900 group hover:bg-zinc-900/30 px-4 transition-colors">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(artistName + " " + track.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 transition-all hover:bg-white hover:text-black shrink-0"
          title="Play on YouTube"
        >
          <FaPlay size={10} className="ml-0.5" />
        </a>

        <span className="text-zinc-600 font-mono text-sm w-6 shrink-0 text-left">
          {track.number}
        </span>

        <div className="flex flex-col min-w-0">
          <span className="text-zinc-300 font-medium group-hover:text-white transition-colors truncate text-base">
            {track.title}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <span className="text-xs text-zinc-600 font-mono hidden sm:block">
          {formatTime(track.length)}
        </span>
        <div className="flex gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(track.id, star)}
              className={`w-3 h-3 rounded-full border border-zinc-800 transition-all duration-200 ${
                rating >= star
                  ? "bg-white border-white scale-110"
                  : "hover:border-zinc-500 bg-zinc-900"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState<AlbumInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/musicbrainz/album-info?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        setAlbum(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-600 animate-pulse">
        loading album details...
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">
        Album not found.
      </div>
    );
  }

  const imageUrl = `https://coverartarchive.org/release-group/${album.id}/front-500`;

  return (
    <main className="min-h-screen bg-black text-zinc-100 pb-24">
      <div className="max-w-5xl mx-auto pt-20 px-6 sm:px-8">
        {/* Navigation */}
        <Link
          href={`/artist/${album.artist.id}`}
          className="text-zinc-500 hover:text-white transition-colors mb-8 inline-block"
        >
          ← back to artist
        </Link>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-10 items-start mb-20">
          {/* Album Cover */}
          <div className="w-full md:w-80 shrink-0 aspect-square relative bg-zinc-900 border border-zinc-800 shadow-2xl">
            <Image
              src={imageUrl}
              alt={album.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
              priority
              unoptimized
            />
          </div>

          {/* Album Details */}
          <div className="flex-1 space-y-4 pt-2">
            <div>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest border border-zinc-800 px-2 py-1 rounded-sm">
                {album.type}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white uppercase leading-[0.9]">
              {album.title}
            </h1>

            <div className="flex flex-col gap-1">
              <Link
                href={`/artist/${album.artist.id}`}
                className="text-2xl text-zinc-400 hover:text-white transition-colors"
              >
                {album.artist.name}
              </Link>
              <span className="text-zinc-600 font-mono text-sm">
                {album.releaseDate?.split("-")[0]} • {album.tracks.length}{" "}
                tracks
              </span>
            </div>

            {album.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {album.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-full border border-zinc-800/50"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 pt-6">
              {album.rating && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                    Rating
                  </span>
                  <span className="text-xl text-zinc-300 font-mono">
                    {album.rating}{" "}
                    <span className="text-zinc-600 text-sm">/ 5</span>
                  </span>
                </div>
              )}
              {album.wikipediaUrl && (
                <a
                  href={album.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-black px-4 py-2 text-sm font-bold hover:bg-zinc-200 transition-colors"
                >
                  Wiki
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tracklist Section */}
        <div className="w-full">
          <div className="border border-zinc-800/50 bg-zinc-900/10 backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800/50 flex justify-between items-end">
              <h3 className="text-zinc-400 font-light tracking-wide text-sm uppercase">
                Tracklist
              </h3>
            </div>
            <div>
              {album.tracks.map((track) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  artistName={album.artist.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
