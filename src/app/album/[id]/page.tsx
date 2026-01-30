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
    artists?: { id: string; name: string; joinPhrase?: string }[];
  }[];
}

function TrackItem({
  track,
  artistName,
  artistId,
}: {
  track: AlbumInfo["tracks"][0];
  artistName: string;
  artistId: string;
}) {
  const { ratings, setRating } = useRatings();
  const rating = ratings[track.id] || 0;
  const [expanded, setExpanded] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [lyricsAvailable, setLyricsAvailable] = useState<boolean | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  // Check lyrics availability on mount
  useEffect(() => {
    const checkLyrics = async () => {
      try {
        const res = await fetch(
          `/api/lyrics?artist=${encodeURIComponent(artistName)}&title=${encodeURIComponent(track.title)}`,
        );
        const data = await res.json();
        setLyricsAvailable(data.available);
        if (data.lyrics) {
          setLyrics(data.lyrics);
        }
      } catch {
        setLyricsAvailable(false);
      }
    };
    checkLyrics();
  }, [artistName, track.title]);

  const handleToggleLyrics = async () => {
    if (!lyricsAvailable) return;

    if (expanded) {
      setExpanded(false);
      return;
    }

    if (lyrics) {
      setExpanded(true);
      return;
    }

    setLoadingLyrics(true);
    try {
      const res = await fetch(
        `/api/lyrics?artist=${encodeURIComponent(artistName)}&title=${encodeURIComponent(track.title)}`,
      );
      const data = await res.json();
      if (data.lyrics) {
        setLyrics(data.lyrics);
        setExpanded(true);
      }
    } catch {
      // Failed to load
    }
    setLoadingLyrics(false);
  };

  const formatTime = (ms?: number) => {
    if (!ms) return "-:--";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="border-b border-[#1a1a1f]">
      <div className="flex items-center justify-between py-3 group hover:bg-[#0a0a0d] px-4 transition-colors">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(artistName + " " + track.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-6 h-6 bg-[#0a0a0d] border border-[#1a1a1f] text-neutral-500 transition-all hover:bg-[#00f0ff] hover:border-[#00f0ff] hover:text-[#050507] shrink-0"
            title="Play on YouTube"
          >
            <FaPlay size={8} className="ml-0.5" />
          </a>

          <span className="text-neutral-600 font-mono text-xs w-6 shrink-0 text-left">
            {track.number}
          </span>

          <div className="flex flex-col min-w-0">
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(artistName + " " + track.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate text-sm hover:underline"
            >
              {track.title}
            </a>
            {track.artists && track.artists.length > 0 && (
              <span className="text-neutral-600 text-xs line-clamp-2 leading-relaxed mt-0.5">
                {track.artists
                  .filter((a) => a.id !== artistId)
                  .map((a, i, arr) => (
                    <span key={a.id}>
                      {i === 0 ? "feat. " : ""}
                      <Link
                        href={`/artist/${a.id}`}
                        className="hover:text-[#00f0ff] hover:underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {a.name}
                      </Link>
                      {i < arr.length - 1 ? ", " : ""}
                    </span>
                  ))}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Lyrics Indicator */}
          {lyricsAvailable && (
            <button
              onClick={handleToggleLyrics}
              className={`text-[10px] font-mono px-2 py-1 border transition-all ${
                expanded
                  ? "border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10"
                  : "border-[#1a1a1f] text-neutral-600 hover:border-[#00f0ff]/50 hover:text-neutral-400"
              }`}
              title={expanded ? "Hide lyrics" : "Show lyrics"}
            >
              {loadingLyrics ? "..." : expanded ? "−" : "lyrics"}
            </button>
          )}

          <span className="text-[10px] text-neutral-600 font-mono hidden sm:block">
            {formatTime(track.length)}
          </span>
          <div className="flex gap-1 shrink-0">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(track.id, star)}
                className={`w-2.5 h-2.5 border border-[#1a1a1f] transition-all duration-200 ${
                  rating >= star
                    ? "bg-[#00f0ff] border-[#00f0ff]"
                    : "hover:border-[#00f0ff]/50 bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Lyrics Section */}
      {expanded && lyrics && (
        <div className="px-4 py-4 bg-[#0a0a0d]/50 border-t border-[#1a1a1f]/50">
          <div className="pl-16 pr-4">
            <p className="text-xs text-neutral-500 whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
              {lyrics}
            </p>
            <p className="text-[10px] text-neutral-700 font-mono mt-3">
              lyrics provided by lyrics.ovh
            </p>
          </div>
        </div>
      )}
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
      <div className="min-h-screen bg-[#050507] flex items-center justify-center text-neutral-600 font-mono text-sm animate-pulse">
        loading_album...
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center text-neutral-600 font-mono text-sm">
        album not found
      </div>
    );
  }

  const imageUrl = `https://coverartarchive.org/release-group/${album.id}/front-500`;
  const blurDataURL =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMwYTBhMGQiLz48L3N2Zz4=";

  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100 pb-24">
      <div className="max-w-4xl mx-auto pt-16 px-6">
        {/* Navigation */}
        <Link
          href={`/artist/${album.artist?.id}`}
          className="text-neutral-600 hover:text-[#00f0ff] transition-colors mb-12 inline-block font-mono text-sm"
        >
          ← back to artist
        </Link>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-10 items-start mb-16">
          {/* Album Cover */}
          <div className="w-full md:w-64 shrink-0 aspect-square relative bg-[#0a0a0d] border border-[#1a1a1f]">
            <Image
              src={imageUrl}
              alt={album.title}
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
              sizes="(max-width: 768px) 100vw, 256px"
              priority
              placeholder="blur"
              blurDataURL={blurDataURL}
              unoptimized
            />
          </div>

          {/* Album Details */}
          <div className="flex-1 space-y-4 pt-2">
            <div>
              <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest border border-[#1a1a1f] px-2 py-1">
                {album.type}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-light tracking-tight text-neutral-200 leading-tight">
              {album.title}
            </h1>

            <div className="flex flex-col gap-1">
              <Link
                href={`/artist/${album.artist?.id}`}
                className="text-lg text-neutral-500 hover:text-[#00f0ff] transition-colors"
              >
                {album.artist?.name}
              </Link>
              <span className="text-neutral-600 font-mono text-xs">
                {album.releaseDate?.split("-")[0]} · {album.tracks.length}{" "}
                tracks
              </span>
            </div>

            {album.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {album.genres.map((g) => (
                  <span
                    key={g}
                    className="text-[10px] text-neutral-600 font-mono border border-[#1a1a1f] px-2 py-1"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              {album.rating && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono">
                    rating
                  </span>
                  <span className="text-lg text-neutral-400 font-mono">
                    {album.rating}{" "}
                    <span className="text-neutral-600 text-xs">/ 5</span>
                  </span>
                </div>
              )}
              {album.wikipediaUrl && (
                <a
                  href={album.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-transparent border border-[#1a1a1f] text-neutral-500 px-4 py-2 text-xs font-mono hover:border-[#00f0ff] hover:text-[#00f0ff] transition-colors"
                >
                  wiki →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tracklist Section */}
        <div className="w-full">
          <div className="border border-[#1a1a1f] bg-[#0a0a0d]/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1a1a1f] flex justify-between items-end">
              <h3 className="text-neutral-600 font-mono tracking-wide text-xs uppercase">
                tracklist_
              </h3>
            </div>
            <div>
              {album.tracks.map((track) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  artistName={album.artist?.name || ""}
                  artistId={album.artist?.id || ""}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
