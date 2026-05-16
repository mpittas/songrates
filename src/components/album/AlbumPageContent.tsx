"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import { createSlug } from "@/lib/utils";
import AlbumDetailPageLayout from "@/components/album/AlbumDetailPageLayout";
import AlbumRatingRowSection from "@/components/album/AlbumRatingRowSection";
import AlbumSkeleton from "@/components/album/AlbumSkeleton";
import Button from "@/components/ui/Button";
import AlbumPlaylistSelectorModal from "@/components/ui/AlbumPlaylistSelectorModal";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { usePlayerCore } from "@/context/PlayerContext";
import SongRow from "@/main-components/SongRow";
import { useAlbumInfo } from "@/hooks/useAlbumInfo";
import { useAlbumViewingUserRatings } from "@/hooks/useAlbumViewingUserRatings";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import {
  computeTrackRatingStats,
  getAlbumPlayLabel,
  getAlbumSubtitleArtists,
} from "@/lib/albumPageStats";
import AlbumReadOnlyBanner from "./AlbumReadOnlyBanner";
import AlbumOtherVersions from "./AlbumOtherVersions";

export interface AlbumPageContentProps {
  slug: string | undefined;
  albumId: string | undefined;
  viewingUserId: string | null;
  highlightTrackId: string | null;
  fallbackUserName: string | null;
}

export default function AlbumPageContent({
  slug,
  albumId,
  viewingUserId,
  highlightTrackId,
  fallbackUserName,
}: AlbumPageContentProps) {
  const { data: album = null, isLoading: loading } = useAlbumInfo(slug);
  const { ratings: myRatings, publicAlbumRatings } = useRatings();
  const { viewingUserRatings, viewingUserName } = useAlbumViewingUserRatings(
    albumId,
    viewingUserId,
    fallbackUserName,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { playTrack } = usePlayerCore();
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const queue = useMemo(() => {
    if (!album) return [];
    const imageUrl = album.artworkUrl || "/vinyl-placeholder.svg";
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
  }, [album]);

  const filteredTracks = useMemo(() => {
    if (!album) return [];
    const tracks = album.tracks || [];
    const q = searchQuery.toLowerCase();
    return tracks.filter((t) => t.title.toLowerCase().includes(q));
  }, [album, searchQuery]);

  if (loading) {
    return <AlbumSkeleton />;
  }

  if (!album) {
    return (
      <div
        className={cn(
          "min-h-screen px-4 text-neutral-600 font-mono text-sm sm:px-6",
          PAGE_CONTENT_TOP,
        )}
      >
        album not found
      </div>
    );
  }

  const imageUrl = album.artworkUrl || "/vinyl-placeholder.svg";
  const activeRatings = viewingUserRatings || myRatings;
  const tracks = album.tracks || [];
  const {
    totalTracks,
    ratedTracksCount,
    isFullyRated,
    averageScore,
  } = computeTrackRatingStats(tracks, activeRatings);

  const publicData = publicAlbumRatings[album.id] ?? null;
  const primaryArtist =
    album.tracks?.[0]?.artists?.[0] ?? album.artist ?? null;
  const subtitleArtists = getAlbumSubtitleArtists(album);
  const playLabel = getAlbumPlayLabel(album.type);

  const handleOpenPlaylistModal = async () => {
    const { createClient } = await import("@/utils/supabase/client");
    const {
      data: { user },
    } = await createClient().auth.getUser();
    if (!user) return;
    setIsPlaylistModalOpen(true);
  };

  return (
    <AlbumDetailPageLayout
      beforeConstrained={
        viewingUserId && slug ? (
          <AlbumReadOnlyBanner
            slug={slug}
            viewingUserName={viewingUserName}
            fallbackUserName={fallbackUserName}
          />
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
          <FavoriteButton
            itemId={album.id}
            itemType="album"
            itemName={album.title}
            artistName={album.artist?.name}
            thumbnailUrl={album.artworkUrl}
            variant="secondary"
            buttonSize="xs"
          />

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
            <span key={a.id || `${a.name}-${i}`}>
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
              {i < arr.length - 1 && (
                <span className="px-1 tracking-tight text-neutral-400">
                  ft.
                </span>
              )}
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
      bottom={<AlbumOtherVersions versions={album.otherVersions} />}
    />
  );
}
