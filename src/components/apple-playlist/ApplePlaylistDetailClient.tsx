"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import AlbumDetailPageLayout from "@/components/album/AlbumDetailPageLayout";
import Button from "@/components/ui/Button";
import { artworkUrl, type ApplePlaylistDetail } from "@/lib/appleMusic/api";
import { mapAppleSongToTrackInfo } from "@/lib/appleMusic/mapAppleSongToTrackInfo";
import { usePlayerCore } from "@/context/PlayerContext";
import SongRow from "@/main-components/SongRow";
import type { AlbumContext, Track } from "@/types/music";
import { FaArrowLeft } from "react-icons/fa";

interface ApplePlaylistDetailClientProps {
  playlist: ApplePlaylistDetail;
}

function albumContextFromTrack(
  track: ReturnType<typeof mapAppleSongToTrackInfo>,
): AlbumContext | undefined {
  if (!track.albumId || !track.albumTitle) return undefined;
  return {
    albumId: track.albumId,
    title: track.albumTitle,
    artistName:
      track.artists?.[0]?.name || track.artistName || "Unknown Artist",
    releaseDate: track.releaseDate,
    totalTracks: track.totalTracks ?? 0,
    artworkUrl: track.albumImageUrl,
  };
}

export default function ApplePlaylistDetailClient({
  playlist,
}: ApplePlaylistDetailClientProps) {
  const searchParams = useSearchParams();
  const highlightTrackId = searchParams.get("track");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { playTrack } = usePlayerCore();

  const heroImageUrl =
    artworkUrl(playlist.artworkUrl, 600) || "/vinyl-placeholder.svg";

  const trackInfos = useMemo(
    () =>
      playlist.tracks.map((s) =>
        mapAppleSongToTrackInfo(s, heroImageUrl),
      ),
    [playlist.tracks, heroImageUrl],
  );

  const filteredTracks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return trackInfos.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.artistName || "").toLowerCase().includes(q) ||
        (t.albumTitle || "").toLowerCase().includes(q),
    );
  }, [trackInfos, searchQuery]);

  const queue: Track[] = useMemo(
    () =>
      trackInfos.map((t) => ({
        id: t.id,
        title: t.title,
        artistName: t.artistName,
        artistId: t.artistId,
        albumId: t.albumId,
        albumImageUrl: t.albumImageUrl,
        albumTitle: t.albumTitle || playlist.name,
        releaseDate: t.releaseDate,
        totalTracks: playlist.trackCount,
        artists: t.artists,
        length: t.length,
        number: t.number,
      })),
    [trackInfos, playlist.name, playlist.trackCount],
  );

  return (
    <AlbumDetailPageLayout
      topBarLeft={
        <Button
          href="/"
          variant="secondary"
          size="xs"
          iconLeft={<FaArrowLeft size={14} className=" mr-2" />}
        >
          BACK TO HOME
        </Button>
      }
      artworkSrc={heroImageUrl}
      artworkAlt={playlist.name}
      onPlayClick={() => {
        if (queue.length > 0) {
          playTrack(queue[0], queue);
        }
      }}
      playLabel="Play playlist"
      title={playlist.name}
      subtitle={
        <p className="text-md mb-4 text-neutral-600">
          Apple Music · {playlist.curatorName}
        </p>
      }
      metaRow={
        <>
          <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700">
            Playlist
          </span>
          <span>•</span>
          <span>{playlist.trackCount} tracks</span>
        </>
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
              track.artists?.[0]?.name || track.artistName || "Unknown"
            }
            album={track.albumTitle || playlist.name}
            duration={String(track.length || "")}
            artworkUrl={track.albumImageUrl || heroImageUrl}
            track={track}
            artistId={track.artists?.[0]?.id || track.artistId || ""}
            albumId={track.albumId || ""}
            albumContext={albumContextFromTrack(track)}
          />
        </div>
      ))}
    />
  );
}
