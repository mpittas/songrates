"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import OptimizedImage from "@/components/OptimizedImage";
import Link from "next/link";
import { useRatings } from "@/hooks/useRatings";
import { usePlayer } from "@/context/PlayerContext";
import { formatTimeMs } from "@/lib/utils";
import { FaPlay, FaPause, FaSearch } from "react-icons/fa";
import MySection from "@/components/MySection";
import AlbumSkeleton from "@/components/AlbumSkeleton";

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
  albumId,
  albumImageUrl,
}: {
  track: AlbumInfo["tracks"][0];
  artistName: string;
  artistId: string;
  albumId: string;
  albumImageUrl: string;
}) {
  const { ratings, setRating } = useRatings();
  const { currentTrack, isPlaying, isLoading, playTrack } = usePlayer();
  const rating = ratings[track.id] || 0;
  const isCurrentTrack = currentTrack?.id === track.id;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[#1a1a1f]">
      <div className="flex items-center justify-between py-3 group hover:bg-[#0a0a0d] px-4 transition-colors">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button
            onClick={() =>
              playTrack({
                id: track.id,
                title: track.title,
                artistName: artistName,
                artistId: artistId,
                albumId: albumId,
                albumImageUrl: albumImageUrl,
              })
            }
            className={`flex items-center justify-center w-6 h-6 border shrink-0 transition-all ${
              isCurrentTrack && isPlaying
                ? "bg-[#00f0ff] border-[#00f0ff] text-[#050507]"
                : "bg-[#0a0a0d] border-[#1a1a1f] text-neutral-500 hover:bg-[#00f0ff] hover:border-[#00f0ff] hover:text-[#050507]"
            }`}
            title="Play"
          >
            {isCurrentTrack && isLoading ? (
              <span className="animate-pulse text-[8px]">...</span>
            ) : isCurrentTrack && isPlaying ? (
              <FaPause size={8} />
            ) : (
              <FaPlay size={8} className="ml-0.5" />
            )}
          </button>

          <span className="text-neutral-600 font-mono text-xs w-6 shrink-0 text-left">
            {track.number}
          </span>

          <div className="flex flex-col min-w-0">
            <span className="text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate text-sm">
              {track.title}
            </span>
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
          <span className="text-[10px] text-neutral-600 font-mono hidden sm:block">
            {formatTimeMs(track.length)}
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
    </div>
  );
}

export default function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState<AlbumInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
    return <AlbumSkeleton />;
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center text-neutral-600 font-mono text-sm">
        album not found
      </div>
    );
  }

  const imageUrl = `https://coverartarchive.org/release-group/${album.id}/front-250`;

  const filteredTracks = album.tracks.filter((track) =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100">
      <MySection className="pt-7 pb-24">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-10 items-start mb-16">
          {/* Album Cover */}
          <div className="w-full md:w-64 shrink-0 aspect-square relative bg-[#0a0a0d] border border-[#1a1a1f]">
            <OptimizedImage
              src={imageUrl}
              alt={album.title}
              fill
              className="object-cover transition-all duration-500"
              priority
              fallbackText={album.title?.slice(0, 2).toUpperCase() || "??"}
            />
          </div>

          {/* Album Details */}
          <div className="flex-1 space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest border border-[#1a1a1f] px-2 py-1">
                  {album.type}
                </span>
              </div>

              {/* Navigation */}
              <Link
                href={`/artist/${album.artist?.id}`}
                className="text-neutral-600 hover:text-[#00f0ff] transition-colors inline-block font-mono text-sm"
              >
                ← back to artist
              </Link>
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
            <div className="px-4 py-3 border-b border-[#1a1a1f] flex justify-between items-center group/search">
              <h3 className="text-neutral-600 font-mono tracking-wide text-xs uppercase">
                tracklist_
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-neutral-600 group-focus-within/search:text-[#00f0ff] transition-colors">
                  <FaSearch size={10} />
                </div>
                <input
                  type="text"
                  placeholder="search tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0a0a0d] border border-[#1a1a1f] text-neutral-200 text-[10px] font-mono rounded-full py-1 pl-7 pr-3 focus:outline-none focus:border-[#00f0ff]/50 w-32 focus:w-48 transition-all"
                />
              </div>
            </div>
            <div>
              {filteredTracks.map((track) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  artistName={album.artist?.name || ""}
                  artistId={album.artist?.id || ""}
                  albumId={album.id}
                  albumImageUrl={imageUrl}
                />
              ))}
            </div>
          </div>
        </div>
      </MySection>
    </main>
  );
}
