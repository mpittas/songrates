"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import OptimizedImage from "@/components/OptimizedImage";
import Link from "next/link";
import { useRatings } from "@/hooks/useRatings";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime, createSlug } from "@/lib/utils";
import MySection from "@/components/MySection";
import AlbumSkeleton from "@/components/AlbumSkeleton";
import ColorRating from "@/components/ColorRating";
import SearchInput from "@/components/search/SearchInput";
import Button from "@/components/ui/Button";
import {
  FaPlay,
  FaPause,
  FaSearch,
  FaArrowLeft,
  FaWikipediaW,
  FaSpotify,
  FaGlobe,
} from "react-icons/fa";
import { SiDiscogs, SiBandcamp, SiGenius } from "react-icons/si";
import AlbumRatingBadge from "@/components/AlbumRatingBadge";

import { AlbumInfo, TrackInfo, AlbumContext } from "@/types/music";
import { resolveAlbumId } from "@/lib/musicbrainz";

function TrackItem({
  track,
  artistName,
  artistId,
  albumId,
  albumImageUrl,
  albumContext,
}: {
  track: TrackInfo;
  artistName: string;
  artistId: string;
  albumId: string;
  albumImageUrl: string;
  albumContext: AlbumContext;
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
                albumImageUrl: albumImageUrl || "/vinyl-placeholder.svg",
                albumTitle: albumContext.title,
                releaseDate: albumContext.releaseDate,
                totalTracks: albumContext.totalTracks,
                artists: track.artists,
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
                        href={`/artist/${createSlug(a.name, a.id)}`}
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
            {formatTime(track.length, "milliseconds")}
          </span>
          <ColorRating
            rating={rating}
            onRate={(val) => setRating(track.id, val, albumContext)}
          />
        </div>
      </div>
    </div>
  );
}

export default function AlbumPage() {
  const { id: slug } = useParams();
  const [album, setAlbum] = useState<AlbumInfo | null>(null);
  const { ratings } = useRatings();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    if (!slug) return;

    // Resolve short ID to full ID
    const resolve = async () => {
      try {
        const id = await resolveAlbumId(Array.isArray(slug) ? slug[0] : slug);
        if (!id) throw new Error("ID not found");

        const res = await fetch(`/api/musicbrainz/album-info?id=${id}`);
        const data = await res.json();
        setAlbum(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    resolve();
  }, [slug]);

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

  const filteredTracks = (album.tracks || []).filter((track) =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Rating Stats
  const tracks = album.tracks || [];
  const totalTracks = tracks.length;
  const ratedTracksCount = tracks.filter((t) => ratings[t.id] > 0).length;
  const isFullyRated = totalTracks > 0 && ratedTracksCount === totalTracks;
  const currentTotalScore = tracks.reduce(
    (acc, t) => acc + (ratings[t.id] || 0),
    0,
  );
  const averageScore =
    ratedTracksCount > 0
      ? (currentTotalScore / ratedTracksCount).toFixed(1)
      : 0;

  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100">
      <MySection className="pt-8 pb-24">
        <div className="mb-4">
          <Button
            href={`/artist/${
              album.artist?.id
                ? createSlug(album.artist.name, album.artist.id)
                : ""
            }`}
            iconLeft={<FaArrowLeft size={10} />}
            variant="ghost"
            size="xs"
            className="text-neutral-500 hover:text-white pl-0"
          >
            Back to Artist
          </Button>
        </div>

        {/* New Hero Section */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start mb-16 relative">
          {/* Background Gradient/Blur Effect could go here if desired */}

          {/* Album Cover */}
          <div className="w-52 md:w-72 shrink-0 relative group mx-auto md:mx-0">
            <div className="aspect-square relative">
              <OptimizedImage
                src={imageUrl}
                alt={album.title}
                fill
                className="object-cover"
                priority
                fallbackText={album.title?.slice(0, 2).toUpperCase() || "??"}
                fallbackSrc="/vinyl-placeholder.svg"
              />
            </div>

            <span className=" absolute -bottom-2 left-2 text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-widest px-2 py-1 bg-neutral-900">
              {album.type}
            </span>
          </div>

          {/* Album Details */}
          <div className="flex-1 min-w-0 pt-2 w-full text-center md:text-left">
            {/* Genres */}
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900">
              <div className="text-xs">Genres:</div>
              {album.genres?.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-x-1">
                  {album.genres.slice(0, 5).map((g, i, arr) => (
                    <span
                      key={g}
                      className="text-xs text-neutral-500 capitalize"
                    >
                      <span className="hover:text-neutral-300 transition-colors cursor-default">
                        {g}
                      </span>
                      {i < arr.length - 1 && ","}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-600 mb-2">
              <span className="font-mono">
                {album.releaseDate?.split("-")[0]}
              </span>
              <span className="text-neutral-600">•</span>
              <span className="font-mono">
                {album.tracks?.length || 0} tracks
              </span>
            </div>

            <div className="mb-5">
              <h1 className="text-2xl md:text-4xl font-light  tracking-tight text-neutral-200 mb-1">
                {album.title}
              </h1>

              <Link
                href={`/artist/${
                  album.artist?.id
                    ? createSlug(album.artist.name, album.artist.id)
                    : ""
                }`}
                className="block text-neutral-500 hover:text-[#00f0ff] transition-colors text-md mb-1"
              >
                {album.artist?.name}
              </Link>
            </div>

            {/* Actions / Links */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
              {/* External Links */}
              {album.wikipediaUrl && (
                <Button
                  href={album.wikipediaUrl}
                  isExternal
                  iconLeft={<FaWikipediaW size={12} />}
                  variant="border"
                  size="xs"
                >
                  Wiki
                </Button>
              )}
              {album.links?.discogs && (
                <Button
                  href={album.links.discogs}
                  isExternal
                  iconLeft={<SiDiscogs size={12} />}
                  variant="border"
                  size="xs"
                >
                  Discogs
                </Button>
              )}
              {album.links?.bandcamp && (
                <Button
                  href={album.links.bandcamp}
                  isExternal
                  iconLeft={<SiBandcamp size={12} />}
                  variant="border"
                  size="xs"
                  className="text-neutral-400 hover:text-[#00f0ff] hover:border-neutral-800 hover:bg-neutral-800 h-8 transition-colors"
                >
                  Bandcamp
                </Button>
              )}
              {album.links?.allmusic && (
                <Button
                  href={album.links.allmusic}
                  isExternal
                  iconLeft={<FaGlobe size={12} />} // Fallback icon
                  variant="border"
                  size="xs"
                >
                  AllMusic
                </Button>
              )}
              {album.links?.spotify && (
                <Button
                  href={album.links.spotify}
                  isExternal
                  iconLeft={<FaSpotify size={12} />}
                  variant="border"
                  size="xs"
                  className="text-neutral-400 hover:text-[#1DB954] hover:border-neutral-800 hover:bg-neutral-800 h-8 transition-colors"
                >
                  Spotify
                </Button>
              )}
            </div>

            {/* Rating Badge Display */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
              <div className="w-full max-w-[240px]">
                <AlbumRatingBadge
                  score={averageScore}
                  ratedCount={ratedTracksCount}
                  totalTracks={totalTracks}
                  isFull={isFullyRated}
                  position="static"
                  variant="minimal"
                  className="rounded-md"
                />
              </div>

              {/* MB Rating if available */}
              {album.rating && (
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5">
                    MB Rating
                  </span>
                  <span className="text-neutral-300 font-mono text-sm">
                    <span className="text-white font-bold">{album.rating}</span>{" "}
                    / 10
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tracklist Section */}
        <div className="w-full">
          <div className="border border-[#1a1a1f] bg-[#0a0a0d]/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1a1a1f] flex justify-between items-center group/search">
              <h3 className="text-neutral-600 font-mono tracking-wide text-xs uppercase">
                tracklist
              </h3>
              <div className="w-32 focus-within:w-48 transition-all duration-300">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  isFocused={isSearchFocused}
                  placeholder="search tracks..."
                  size="compact"
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
                  albumContext={{
                    albumId: album.id,
                    title: album.title,
                    artistName: album.artist?.name || "Unknown Artist",
                    releaseDate: album.releaseDate,
                    totalTracks: album.tracks?.length || 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </MySection>
    </main>
  );
}
