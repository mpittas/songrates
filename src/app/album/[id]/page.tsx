"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import OptimizedImage from "@/components/ui/OptimizedImage";
import Link from "next/link";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import { createSlug } from "@/lib/utils";
import AlbumDetailPageLayout from "@/components/album/AlbumDetailPageLayout";
import AlbumRatingRowSection from "@/components/album/AlbumRatingRowSection";
import AlbumSkeleton from "@/components/album/AlbumSkeleton";
import Button from "@/components/ui/Button";
import AlbumPlaylistSelectorModal from "@/components/ui/AlbumPlaylistSelectorModal";
import { FaArrowLeft, FaHeart, FaRegHeart, FaPlus } from "react-icons/fa";
import { usePlayerCore } from "@/context/PlayerContext";
import SongRow from "@/main-components/SongRow";
import { useAlbumInfo } from "@/hooks/useAlbumInfo";

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
  const { playTrack } = usePlayerCore();

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

  const primaryArtist = album.tracks?.[0]?.artists?.[0] ?? album.artist ?? null;

  const subtitleArtists =
    album.tracks?.[0]?.artists && album.tracks[0].artists.length > 0
      ? album.tracks[0].artists
      : album.artist
        ? [album.artist]
        : [];

  const playLabel = (() => {
    const type = (album.type || "").toLowerCase();
    if (type.includes("single")) return "Play single";
    if (type.includes("ep")) return "Play EP";
    if (type.includes("compilation")) return "Play compilation";
    return "Play album";
  })();

  return (
    <AlbumDetailPageLayout
      beforeConstrained={
        userId ? (
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
                {viewingUserName || searchParams.get("userName") ? (
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
        ) : undefined
      }
      topBarLeft={
        <Button
          href={
            primaryArtist?.id
              ? `/artist/${createSlug(primaryArtist.name, primaryArtist.id)}`
              : "/"
          }
          variant="secondary"
          size="xs"
          iconLeft={<FaArrowLeft size={14} className=" mr-2" />}
        >
          BACK TO ARTIST
        </Button>
      }
      topBarRight={
        <>
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
        </>
      }
      artworkSrc={imageUrl}
      artworkAlt={album.title}
      onPlayClick={() => {
        if (queue.length > 0) {
          playTrack(queue[0], queue);
        }
      }}
      playLabel={playLabel}
      title={album.title}
      subtitle={
        <div className="text-md mb-4 text-neutral-600">
          {subtitleArtists.map((a, i, arr) => (
            <span key={a.id ?? `${a.name}-${i}`}>
              {a.id ? (
                <Link
                  href={`/artist/${createSlug(a.name, a.id)}`}
                  className="transition-colors hover:text-neutral-900 hover:underline"
                >
                  {a.name}
                </Link>
              ) : (
                <span>{a.name}</span>
              )}
              {i < arr.length - 1 && <span className="text-neutral-400">, </span>}
            </span>
          ))}
        </div>
      }
      metaRow={
        <>
          <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700">
            {album.type}
          </span>
          <span>•</span>
          <span>{album.releaseDate?.split("-")[0]}</span>
          <span>•</span>
          <span>{album.tracks?.length || 0} tracks</span>

          {album.genres?.length ? (
            <>
              <span>•</span>
              <span>{album.genres.slice(0, 3).join(", ")}</span>
            </>
          ) : null}
        </>
      }
      afterHero={
        <AlbumRatingRowSection
          publicData={publicData}
          viewingUserRatings={viewingUserRatings}
          viewingUserName={viewingUserName}
          averageScore={averageScore}
          isFullyRated={isFullyRated}
          ratedTracksCount={ratedTracksCount}
          totalTracks={totalTracks}
        />
      }
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onSearchClear={() => setSearchQuery("")}
      onSearchFocus={() => setIsSearchFocused(true)}
      onSearchBlur={() => setIsSearchFocused(false)}
      searchFocused={isSearchFocused}
      trackRows={filteredTracks.map((track, i) => (
        <div
          key={track.id}
          className={
            track.id === highlightTrackId
              ? "rounded-lg ring-2 ring-neutral-300"
              : ""
          }
        >
          <SongRow
            index={Number(track.number) || i + 1}
            title={track.title}
            artist={
              track.artists?.[0]?.name || album.artist?.name || "Unknown"
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
            artistId={track.artists?.[0]?.id || album.artist?.id || ""}
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
      bottom={
        album.otherVersions && album.otherVersions.length > 0 ? (
          <div className="mt-10 w-full">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-wide text-neutral-600">
              other versions
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {album.otherVersions.map((version) => {
                const versionSlug = createSlug(version.name, version.id);
                return (
                  <Link
                    key={version.id}
                    href={`/album/${versionSlug}`}
                    className="group"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-md border border-[#dddddd] bg-white transition-colors group-hover:border-[#c9c9c9]">
                      <OptimizedImage
                        src={version.artworkUrl || "/vinyl-placeholder.svg"}
                        alt={version.name}
                        fill
                        className="object-cover"
                        fallbackSrc="/vinyl-placeholder.svg"
                      />
                    </div>
                    <div className="mt-2">
                      <p className="truncate text-sm text-neutral-900 transition-colors group-hover:text-black">
                        {version.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-neutral-600">
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
        ) : undefined
      }
    />
  );
}
