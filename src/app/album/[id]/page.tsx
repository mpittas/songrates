"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import OptimizedImage from "@/components/ui/OptimizedImage";
import Link from "next/link";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import { createSlug } from "@/lib/utils";
import MySection from "@/components/ui/MySection";
import AlbumSkeleton from "@/components/album/AlbumSkeleton";
import SearchInput from "@/components/search/SearchInput";
import Button from "@/components/ui/Button";
import FavoriteButton from "@/components/ui/FavoriteButton";
import AddAlbumToPlaylistButton from "@/components/ui/AddAlbumToPlaylistButton";
import {
  FaArrowLeft,
  FaLock,
  FaHeart,
  FaRegHeart,
  FaListUl,
  FaExternalLinkAlt,
} from "react-icons/fa";
import AlbumRatingRow from "@/components/rating/AlbumRatingRow";
import TrackItem from "@/components/album/TrackItem";
import { useAlbumInfo } from "@/hooks/useAlbumInfo";

import { AlbumInfo, TrackInfo, AlbumContext } from "@/types/music";

/**
 * Extract the numeric Apple Music ID from a slug like "album-name-1440833849"
 */
function resolveAlbumId(slug: string): string {
  if (/^\d+$/.test(slug)) return slug;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart)) return lastPart;
  return slug;
}

interface UserRating {
  track_id: string;
  rating: number;
}

interface PublicTrackRating {
  track_id: string;
  average_rating: number;
  rating_count: number;
}

interface RealtimePayload<T> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
  schema: string;
  table: string;
  commit_timestamp: string;
  errors: null | any[];
}

export default function AlbumPage() {
  const { id: rawSlug } = useParams();

  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const highlightTrackId = searchParams.get("track");

  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const albumId = slug ? resolveAlbumId(slug) : undefined;

  // React Query — cached across navigations, instant on revisit
  const { data: album = null, isLoading: loading } = useAlbumInfo(slug);

  const { ratings: myRatings, publicAlbumRatings } = useRatings();

  // State for "viewing other user's ratings"
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
  const [openLyricsTrackId, setOpenLyricsTrackId] = useState<string | null>(
    null,
  );

  // Fetch target user ratings if userId is present
  // Uses albumId extracted from slug so it starts immediately (no waiting for album fetch)
  useEffect(() => {
    if (!albumId || !userId) {
      setViewingUserRatings(null);
      setViewingUserName(null);
      return;
    }

    const fetchUserRatings = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      // Fetch ratings and current username in parallel
      const [ratingsResult, profileResult] = await Promise.all([
        supabase
          .from("ratings")
          .select("track_id, rating")
          .eq("user_id", userId)
          .eq("album_id", albumId),
        supabase.from("profiles").select("username").eq("id", userId).single(),
      ]);

      if (ratingsResult.data) {
        const map: Record<string, number> = {};
        ratingsResult.data.forEach((r: unknown) => {
          const rating = r as UserRating;
          map[rating.track_id] = Number(rating.rating);
        });
        setViewingUserRatings(map);
      }

      // Use fresh username from profiles, fall back to URL param
      const freshName = profileResult.data?.username;
      setViewingUserName(freshName || searchParams.get("userName") || null);
    };

    fetchUserRatings();
  }, [albumId, userId]);

  // Fetch Public Track Ratings
  // Uses albumId extracted from slug so it starts immediately (no waiting for album fetch)
  useEffect(() => {
    if (!albumId) return;

    const fetchTrackRatings = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      const { data, error } = await supabase
        .from("public_track_ratings")
        .select("*")
        .eq("album_id", albumId);

      if (data) {
        const map: Record<
          string,
          { average_rating: number; rating_count: number }
        > = {};
        data.forEach((r: unknown) => {
          const rating = r as PublicTrackRating;
          map[rating.track_id] = {
            average_rating: Number(rating.average_rating),
            rating_count: rating.rating_count,
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
        .channel(`public_track_ratings:${albumId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "public_track_ratings",
            filter: `album_id=eq.${albumId}`,
          },
          (payload: RealtimePayload<PublicTrackRating>) => {
            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              const newRecord = payload.new as PublicTrackRating;
              setPublicTrackRatings((prev) => ({
                ...prev,
                [newRecord.track_id]: {
                  average_rating: Number(newRecord.average_rating),
                  rating_count: newRecord.rating_count,
                },
              }));
            } else if (payload.eventType === "DELETE") {
              const oldRecord = payload.old as PublicTrackRating;
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
  }, [albumId]);

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

  const imageUrl = album.artworkUrl || "/vinyl-placeholder.svg";

  const filteredTracks = (album.tracks || []).filter((track) =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Rating Stats Logic (Toggle between My Ratings and Viewing User Ratings)
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

              {(viewingUserName || searchParams.get("userName")) && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-[#00f0ff]/50 font-mono mb-1">
                    Viewing Ratings By
                  </span>
                  <Link
                    href={`/user/${viewingUserName || searchParams.get("userName")}`}
                    className="text-md text-white leading-none hover:text-[#00f0ff] transition-colors"
                  >
                    {viewingUserName || searchParams.get("userName")}
                  </Link>
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

        {/* New Hero Section */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start mb-8 relative">
          {/* Background Gradient/Blur Effect could go here if desired */}

          {/* Album Cover */}
          <div className="w-40 sm:w-52 md:w-72 shrink-0 relative group self-start">
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
          <div className="flex-1 min-w-0 pt-2 w-full">
            {/* Genres */}
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900">
              <div className="text-xs">Genres:</div>
              {album.genres?.length > 0 && (
                <div className="flex flex-wrap gap-x-1">
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
                className="block text-neutral-500 hover:text-[#00f0ff] transition-colors text-md mb-3"
              >
                {album.artist?.name}
              </Link>

              {/* Album Type Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">
                  {album.type}
                </span>
              </div>
            </div>

            {/* Actions / Links */}
            {album.url && (
              <div className="flex flex-wrap items-center gap-4 mb-8 font-mono text-[10px] uppercase tracking-widest">
                <a
                  href={album.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-neutral-500 hover:text-[#00f0ff] transition-colors group"
                >
                  <FaExternalLinkAlt
                    size={10}
                    className="group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100"
                  />
                  <span>Apple Music</span>
                </a>
                <FavoriteButton
                  itemId={album.id}
                  itemType="album"
                  itemName={album.title}
                  artistName={album.artist?.name}
                  thumbnailUrl={album.artworkUrl}
                  size="sm"
                  variant="text"
                />
                <AddAlbumToPlaylistButton
                  albumId={album.id}
                  albumName={album.title}
                  artistName={album.artist?.name}
                  thumbnailUrl={album.artworkUrl}
                  releaseDate={album.releaseDate}
                  totalTracks={album.tracks?.length}
                  variant="text"
                />
              </div>
            )}
          </div>
        </div>

        {/* Rating Row Section */}
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
                    artworkUrl: album.artworkUrl,
                  }}
                  publicRating={publicTrackRatings[track.id]?.average_rating}
                  publicCount={publicTrackRatings[track.id]?.rating_count}
                  forcedRating={
                    viewingUserRatings
                      ? viewingUserRatings[track.id] || 0
                      : undefined
                  }
                  highlighted={track.id === highlightTrackId}
                  lyricsOpen={openLyricsTrackId === track.id}
                  onToggleLyrics={(trackId) =>
                    setOpenLyricsTrackId((prev) =>
                      prev === trackId ? null : trackId,
                    )
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Other Versions */}
        {album.otherVersions && album.otherVersions.length > 0 && (
          <div className="w-full mt-10">
            <h3 className="text-neutral-600 font-mono tracking-wide text-xs uppercase mb-4">
              other versions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {album.otherVersions.map((version) => {
                const versionSlug = createSlug(version.name, version.id);
                return (
                  <Link
                    key={version.id}
                    href={`/album/${versionSlug}`}
                    className="group"
                  >
                    <div className="aspect-square relative bg-[#0f0f12] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 transition-colors overflow-hidden">
                      <OptimizedImage
                        src={version.artworkUrl || "/vinyl-placeholder.svg"}
                        alt={version.name}
                        fill
                        className="object-cover"
                        fallbackSrc="/vinyl-placeholder.svg"
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate">
                        {version.name}
                      </p>
                      <p className="text-[11px] text-neutral-600 truncate mt-0.5">
                        {version.releaseDate?.slice(0, 4) || ""}
                        {version.type ? ` · ${version.type}` : ""}
                        {version.trackCount
                          ? ` · ${version.trackCount} tracks`
                          : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </MySection>
    </main>
  );
}
