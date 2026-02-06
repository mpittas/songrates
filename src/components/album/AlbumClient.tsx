"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FaArrowLeft,
  FaWikipediaW,
  FaSpotify,
  FaGlobe,
  FaLock,
} from "react-icons/fa";
import { SiDiscogs, SiBandcamp } from "react-icons/si";

import { AlbumInfo } from "@/types/music";
import { createSlug } from "@/lib/utils";
import OptimizedImage from "@/components/ui/OptimizedImage";
import MySection from "@/components/ui/MySection";
import SearchInput from "@/components/search/SearchInput";
import Button from "@/components/ui/Button";
import AlbumRatingRow from "@/components/rating/AlbumRatingRow";
import TrackItem from "@/components/album/TrackItem";
import { useRatings } from "@/hooks/useRatings";
import { useLastFmPopularity } from "@/hooks/useLastFmPopularity";
import { getCoverArtUrl } from "@/lib/cover-art";

interface AlbumClientProps {
  album: AlbumInfo;
}

export default function AlbumClient({ album }: AlbumClientProps) {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const highlightTrackId = searchParams.get("track");

  const { ratings: myRatings, publicAlbumRatings } = useRatings();

  const [viewingUserRatings, setViewingUserRatings] = useState<Record<
    string,
    number
  > | null>(null);
  const [viewingUserName, setViewingUserName] = useState<string | null>(null);

  const [publicTrackRatings, setPublicTrackRatings] = useState<
    Record<string, { average_rating: number; rating_count: number }>
  >({});

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // 1. Last.fm: Fetch client-side via React Query
  const { data: popularityMap } = useLastFmPopularity(album.artist?.name);

  // Fetch target user ratings if userId is present
  useEffect(() => {
    if (!album || !userId) {
      setViewingUserRatings(null);
      setViewingUserName(null);
      return;
    }

    const fetchUserRatings = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { data: userRatings } = await supabase
        .from("ratings")
        .select("track_id, rating")
        .eq("user_id", userId)
        .eq("album_id", album.id);

      if (userRatings) {
        const map: Record<string, number> = {};
        userRatings.forEach((r) => {
          map[r.track_id] = Number(r.rating);
        });
        setViewingUserRatings(map);
      }
    };

    fetchUserRatings();
  }, [album, userId]);

  // Fetch Public Track Ratings
  useEffect(() => {
    if (!album) return;

    const fetchTrackRatings = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      const { data } = await supabase
        .from("public_track_ratings")
        .select("*")
        .eq("album_id", album.id);

      if (data) {
        const map: Record<
          string,
          { average_rating: number; rating_count: number }
        > = {};
        data.forEach((r) => {
          map[r.track_id] = {
            average_rating: Number(r.average_rating),
            rating_count: r.rating_count,
          };
        });
        setPublicTrackRatings(map);
      }
    };

    fetchTrackRatings();

    // Realtime Subscription
    const subscribeToTrackRatings = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      const channel = supabase
        .channel(`public_track_ratings:${album.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "public_track_ratings",
            filter: `album_id=eq.${album.id}`,
          },
          (payload) => {
            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              const newRecord = payload.new as any;
              setPublicTrackRatings((prev) => ({
                ...prev,
                [newRecord.track_id]: {
                  average_rating: Number(newRecord.average_rating),
                  rating_count: newRecord.rating_count,
                },
              }));
            } else if (payload.eventType === "DELETE") {
              const oldRecord = payload.old as any;
              setPublicTrackRatings((prev) => {
                const next = { ...prev };
                delete next[oldRecord.track_id];
                return next;
              });
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const unsub = subscribeToTrackRatings();
    return () => {
      unsub.then((fn) => fn());
    };
  }, [album]);

  const imageUrl = getCoverArtUrl(album.id, album.title, album.artist?.name);
  const [imageError, setImageError] = useState(false);

  const filteredTracks = (album.tracks || []).filter((track) =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeRatings = viewingUserRatings || myRatings;
  const tracks = album.tracks || [];
  const totalTracks = tracks.length;
  const ratedTracksCount = tracks.filter((t) => activeRatings[t.id] > 0).length;
  const isFullyRated = totalTracks > 0 && ratedTracksCount === totalTracks;
  const currentTotalScore = tracks.reduce(
    (acc, t) => acc + (activeRatings[t.id] || 0),
    0,
  );
  const averageScore =
    ratedTracksCount > 0
      ? (currentTotalScore / ratedTracksCount).toFixed(1)
      : 0;

  const publicData = album ? publicAlbumRatings[album.id] : null;

  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100">
      <MySection className="pt-8 pb-24">
        {userId && (
          <div className="w-full bg-neutral-900/40 border border-[#00f0ff]/20 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f0ff]/5 pointer-events-none" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="flex items-center gap-2 text-[#00f0ff] bg-[#00f0ff]/10 px-3 py-1.5">
                <FaLock size={10} />
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  Read Only
                </span>
              </div>
              {searchParams.get("userName") && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-[#00f0ff]/50 font-mono mb-1">
                    Viewing Ratings By
                  </span>
                  <span className="text-md text-white leading-none">
                    {searchParams.get("userName")}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <Button href={`/album/${album.id}`} variant="secondary" size="sm">
                My Ratings
              </Button>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
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

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start mb-8 relative">
          <div className="w-52 md:w-72 shrink-0 relative group mx-auto md:mx-0">
            <div className="aspect-square relative shadow-2xl shadow-black/50 rounded-sm overflow-hidden bg-neutral-900">
              {!imageError ? (
                <OptimizedImage
                  src={imageUrl}
                  alt={album.title}
                  fill
                  className="object-cover"
                  priority
                  onError={() => setImageError(true)}
                  fallbackText={album.title?.slice(0, 2).toUpperCase() || "??"}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-12 opacity-20">
                  <img
                    src="/vinyl-placeholder.svg"
                    alt=""
                    className="w-full h-full object-contain invert"
                  />
                </div>
              )}
            </div>
            <span className="absolute -bottom-2 left-2 text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-widest px-2 py-1 bg-neutral-900 shadow-md">
              {album.type}
            </span>
          </div>

          <div className="flex-1 min-w-0 pt-2 w-full text-center md:text-left">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 justify-center md:justify-start">
              <div className="text-xs text-neutral-500">Genres:</div>
              {album.genres?.length > 0 ? (
                <div className="flex flex-wrap justify-center md:justify-start gap-x-1">
                  {album.genres.slice(0, 5).map((g, i, arr) => (
                    <span
                      key={g}
                      className="text-xs text-neutral-400 capitalize"
                    >
                      <span className="hover:text-neutral-200 transition-colors cursor-default">
                        {g}
                      </span>
                      {i < arr.length - 1 && ","}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-neutral-700 italic">Unknown</span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 text-xs text-neutral-500 mb-2">
              <span className="font-mono text-neutral-400">
                {album.releaseDate?.split("-")[0]}
              </span>
              <span className="text-neutral-700">•</span>
              <span className="font-mono">
                {album.tracks?.length || 0} tracks
              </span>
            </div>

            <div className="mb-5">
              <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-2 leading-tight">
                {album.title}
              </h1>

              <Link
                href={`/artist/${
                  album.artist?.id
                    ? createSlug(album.artist.name, album.artist.id)
                    : ""
                }`}
                className="block text-xl text-neutral-400 hover:text-[#00f0ff] transition-colors mb-1"
              >
                {album.artist?.name}
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
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
                  iconLeft={<FaGlobe size={12} />}
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
          </div>
        </div>

        <div className="w-full mb-8">
          <AlbumRatingRow
            score={averageScore}
            ratedCount={ratedTracksCount}
            totalTracks={totalTracks}
            isFull={isFullyRated}
            publicRating={publicData?.averageRating}
            publicCount={publicData?.ratingCount}
            userLabel={
              viewingUserRatings
                ? viewingUserName
                  ? `${viewingUserName.toUpperCase()}'S RATING`
                  : "USER RATING"
                : "MY AVERAGE"
            }
          />
        </div>

        <div className="w-full">
          <div className="border border-[#1a1a1f] bg-[#0a0a0d]/30 overflow-hidden rounded-sm">
            <div className="px-4 py-3 border-b border-[#1a1a1f] flex justify-between items-center group/search bg-[#0f0f12]">
              <h3 className="text-neutral-500 font-mono tracking-widest text-[10px] uppercase">
                Tracklist
              </h3>
              <div className="w-32 focus-within:w-48 transition-all duration-300">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  isFocused={isSearchFocused}
                  placeholder="filter tracks..."
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
                  publicRating={publicTrackRatings[track.id]?.average_rating}
                  publicCount={publicTrackRatings[track.id]?.rating_count}
                  listenCount={
                    popularityMap
                      ? popularityMap[track.title.toLowerCase().trim()]
                      : undefined
                  }
                  forcedRating={
                    viewingUserRatings
                      ? viewingUserRatings[track.id] || 0
                      : undefined
                  }
                  highlighted={track.id === highlightTrackId}
                />
              ))}
              {filteredTracks.length === 0 && (
                <div className="p-8 text-center text-neutral-600 font-mono text-xs">
                  No tracks found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      </MySection>
    </main>
  );
}
