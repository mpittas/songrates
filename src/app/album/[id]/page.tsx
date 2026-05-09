"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import OptimizedImage from "@/components/ui/OptimizedImage";
import Link from "next/link";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import { createSlug } from "@/lib/utils";
import MySection from "@/components/ui/MySection";
import AlbumRatingRowSection from "@/components/album/AlbumRatingRowSection";
import AlbumSkeleton from "@/components/album/AlbumSkeleton";
import SearchInput from "@/components/search/SearchInput";
import Button from "@/components/ui/Button";
import AlbumPlaylistSelectorModal from "@/components/ui/AlbumPlaylistSelectorModal";
import {
  FaArrowLeft,
  FaPlay,
  FaHeart,
  FaRegHeart,
  FaPlus,
} from "react-icons/fa";
import { usePlayer } from "@/context/PlayerContext";
import SongRow from "@/main-components/SongRow";
import { useAlbumInfo } from "@/hooks/useAlbumInfo";
import { LuListMusic } from "react-icons/lu";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { playTrack } = usePlayer();

  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

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
  }, [albumId, userId, searchParams]);

  // Uses albumId extracted from slug so it starts immediately (no waiting for album fetch)
  useEffect(() => {
    if (!albumId) return;
    const checkFavorite = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", albumId)
        .eq("item_type", "album")
        .maybeSingle();

      if (!error && data) {
        setIsFavorite(true);
      }
    };
    checkFavorite();
  }, [albumId]);

  const toggleFavorite = async () => {
    if (!albumId) return;
    setIsFavoriteLoading(true);
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavorite) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", albumId)
          .eq("item_type", "album");
        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase.from("user_favorites").upsert({
          user_id: user.id,
          item_id: albumId,
          item_type: "album",
          item_name: album?.title,
          artist_name: album?.artist?.name,
          thumbnail_url: album?.artworkUrl,
        });
        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleOpenPlaylistModal = async () => {
    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setIsPlaylistModalOpen(true);
  };

  const imageUrl = album?.artworkUrl || "/vinyl-placeholder.svg";

  const queue = useMemo(() => {
    if (!album) return [];
    return (album.tracks || []).map((t) => ({
      id: t.id,
      title: t.title,
      artistName: album.artist?.name,
      artistId: album.artist?.id,
      albumId: album.id,
      albumImageUrl: imageUrl,
      albumTitle: album.title,
      releaseDate: album.releaseDate,
      totalTracks: album.tracks.length,
      artists: t.artists,
      length: t.length,
      number: t.number,
    }));
  }, [album, imageUrl]);

  if (loading) {
    return <AlbumSkeleton />;
  }

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-600 font-mono text-sm">
        album not found
      </div>
    );
  }

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
    <main className="min-h-screen text-neutral-900">
      <MySection className="pb-24" container={false}>
        <div className="bg-linear-to-b from-[#f0e5df] to-[#f0e5df]/0 absolute top-0 left-0 w-full h-[500px] z-0"></div>
        {userId && (
          <div
            className="relative z-10 w-full py-3.5 sm:py-4"
            style={{
              backgroundColor: "#0f0f0f",
              backgroundImage: `repeating-linear-gradient(
                -36deg,
                transparent,
                transparent 5px,
                rgba(255, 255, 255, 0.018) 3px,
                rgba(255, 255, 255, 0.018) 10px
              )`,
            }}
          >
            <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="text-sm leading-snug text-white">
                <span className="text-white/70">Read only · </span>
                {(viewingUserName || searchParams.get("userName")) ? (
                  <>
                    Viewing ratings by{" "}
                    <Link
                      href={`/user/${viewingUserName || searchParams.get("userName")}`}
                      className="text-white underline decoration-white/40 underline-offset-2 transition-colors hover:decoration-white"
                    >
                      @{viewingUserName || searchParams.get("userName")}
                    </Link>
                  </>
                ) : (
                  <span>Viewing another user&apos;s ratings</span>
                )}
              </div>
              <Button
                href={`/album/${slug}`}
                variant="border"
                size="sm"
                className="shrink-0 self-start border-0 bg-white text-neutral-950 hover:bg-neutral-100 sm:self-auto"
              >
                My ratings
              </Button>
            </div>
          </div>
        )}

        <div className="mt-10  relative z-10 mx-auto w-full max-w-[1180px] px-4 sm:px-6">
          <div className="mb-12 flex flex-wrap items-center gap-3 justify-between">
            <Button
              href={`/artist/${
                album.artist?.id
                  ? createSlug(album.artist.name, album.artist.id)
                  : ""
              }`}
              variant="secondary"
              size="xs"
              iconLeft={<FaArrowLeft size={14} className=" mr-2" />}
            >
              BACK TO ARTIST
            </Button>

            <div className="flex items-center gap-3">
              <Button
                onClick={toggleFavorite}
                disabled={isFavoriteLoading}
                variant="secondary"
                size="xs"
                iconLeft={
                  isFavorite ? (
                    <FaHeart size={14} className="fill-current mr-2" />
                  ) : (
                    <FaRegHeart size={14} className="fill-current mr-2" />
                  )
                }
              >
                {isFavorite ? "FAVORITED" : "LIKE ALBUM"}
              </Button>

              <Button
                onClick={handleOpenPlaylistModal}
                variant="secondary"
                size="xs"
                iconLeft={<FaPlus size={14} className=" mr-2" />}
              >
                SAVE ALBUM
              </Button>

              {isPlaylistModalOpen && (
                <AlbumPlaylistSelectorModal
                  albumId={album.id}
                  albumName={album.title}
                  artistName={album.artist?.name}
                  thumbnailUrl={album.artworkUrl}
                  releaseDate={album.releaseDate}
                  totalTracks={album.tracks?.length}
                  onClose={() => setIsPlaylistModalOpen(false)}
                />
              )}
            </div>
          </div>

          


          {/* New Hero Section */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start mb-8 relative">
            {/* Album Cover */}
            <div className="w-40 sm:w-52 md:w-72 shrink-0 relative group self-start">
              <div className="aspect-square relative">
                <OptimizedImage
                  src={imageUrl}
                  alt={album.title}
                  fill
                  className="object-cover rounded-xl"
                  priority
                  fallbackText={album.title?.slice(0, 2).toUpperCase() || "??"}
                  fallbackSrc="/vinyl-placeholder.svg"
                />
              </div>
            </div>

            {/* Album Details */}
            <div className="flex-1 min-w-0 pt-4 w-full flex flex-col items-start justify-center">
              <button
                onClick={() => {
                  if (queue && queue.length > 0) {
                    playTrack(queue[0], queue);
                  }
                }}
                className="flex items-center gap-2 group mb-8 bg-white p-3 rounded-full cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="w-7 h-7 bg-[#e76418] text-white rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FaPlay className="ml-1" size={12} />
                </div>
                <span className="text-lg font-bold text-black tracking-tight">
                  Play album
                </span>
              </button>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-11 text-neutral-900 mb-4">
                {album.title}
              </h1>

              <Link
                href={`/artist/${
                  album.artist?.id
                    ? createSlug(album.artist.name, album.artist.id)
                    : ""
                }`}
                className="text-md text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
              >
                {album.artist?.name}
              </Link>

              <div className="border-t border-neutral-950/10 w-full pt-4 flex flex-wrap items-center gap-2 text-sm text-neutral-00 mb-6 font-mono">
                <span className="bg-neutral-100 px-2 py-1 rounded text-xs font-semibold text-neutral-700">
                  {album.type}
                </span>
                <span>•</span>
                <span>{album.releaseDate?.split("-")[0]}</span>
                <span>•</span>
                <span>{album.tracks?.length || 0} tracks</span>

                {album.genres?.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{album.genres.slice(0, 3).join(", ")}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[240px] shrink-0 mt-4"></div>
          </div>

          <AlbumRatingRowSection
            publicData={publicData}
            viewingUserRatings={viewingUserRatings}
            viewingUserName={viewingUserName}
            averageScore={averageScore}
            isFullyRated={isFullyRated}
            ratedTracksCount={ratedTracksCount}
            totalTracks={totalTracks}
          />

          {/* Tracklist Section */}
          <div className="w-full">
            <div className="rounded-md">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <LuListMusic size={18} />
                  <h3 className="text-xs uppercase">Tracklist</h3>
                </div>

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

              <div className="flex flex-col gap-y-1.5">
                {filteredTracks.map((track, i) => (
                  <div
                    key={track.id}
                    className={
                      track.id === highlightTrackId
                        ? "ring-2 ring-neutral-300 rounded-lg"
                        : ""
                    }
                  >
                    <SongRow
                      index={Number(track.number) || i + 1}
                      title={track.title}
                      artist={
                        track.artists?.[0]?.name ||
                        album.artist?.name ||
                        "Unknown"
                      }
                      album={album.title}
                      duration={String(track.length || "")}
                      artworkUrl={imageUrl}
                      rating={
                        viewingUserRatings
                          ? viewingUserRatings[track.id] || 0
                          : undefined
                      }
                      track={track}
                      artistId={
                        track.artists?.[0]?.id || album.artist?.id || ""
                      }
                      albumId={album.id}
                      albumContext={{
                        albumId: album.id,
                        title: album.title,
                        artistName: album.artist?.name || "Unknown Artist",
                        releaseDate: album.releaseDate,
                        totalTracks: album.tracks?.length || 0,
                        artworkUrl: album.artworkUrl,
                      }}
                    />
                  </div>
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
                      <div className="aspect-square relative bg-white border border-[#dddddd] group-hover:border-[#c9c9c9] transition-colors overflow-hidden rounded-md">
                        <OptimizedImage
                          src={version.artworkUrl || "/vinyl-placeholder.svg"}
                          alt={version.name}
                          fill
                          className="object-cover"
                          fallbackSrc="/vinyl-placeholder.svg"
                        />
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-neutral-900 group-hover:text-black transition-colors truncate">
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
        </div>
      </MySection>
    </main>
  );
}
