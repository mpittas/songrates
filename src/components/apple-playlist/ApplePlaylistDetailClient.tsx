"use client";

import { useEffect, useMemo, useState } from "react";

import CollectionDetailPageLayout, {
  MetaDot,
} from "@/components/layout/CollectionDetailPageLayout";
import EmptyState from "@/components/ui/EmptyState";
import TrackList from "@/components/ui/TrackList";
import { useShareLinkParams } from "@/hooks/useShareLinkParams";
import {
  artworkUrl,
  type ApplePlaylistDetail,
  type AppleSongResult,
} from "@/lib/appleMusic/api";
import { mapAppleSongToTrackInfo } from "@/lib/appleMusic/mapAppleSongToTrackInfo";
import { fetchPlaylistEnrichments } from "@/lib/fetchPlaylistEnrichments";
import { usePlayerCore } from "@/context/PlayerContext";
import SongRow from "@/main-components/SongRow";
import type { AlbumContext, Track } from "@/types/music";
import { applePlaylistPlaybackSource } from "@/lib/playbackSource";

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
    artworkUrl: track.albumImageUrl,
  };
}

export default function ApplePlaylistDetailClient({
  playlist,
}: ApplePlaylistDetailClientProps) {
  const { track: highlightTrackId } = useShareLinkParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [tracks, setTracks] = useState<AppleSongResult[]>(playlist.tracks);
  const { playTrack } = usePlayerCore();

  useEffect(() => {
    const idsToEnrich = playlist.tracks
      .filter((t) => !(t.artists && t.artists.length > 0) && !t.artistId)
      .map((t) => t.id);
    if (idsToEnrich.length === 0) return;

    const ac = new AbortController();

    (async () => {
      try {
        const en = await fetchPlaylistEnrichments(idsToEnrich, ac.signal);
        if (Object.keys(en).length === 0) return;

        setTracks((prev) =>
          prev.map((t) => {
            const e = en[t.id];
            if (!e) return t;
            const next = { ...t };
            if (e.artists && e.artists.length > 0) {
              next.artists = e.artists;
              next.artistId = e.artistId ?? e.artists[0]?.id;
            }
            if (e.albumId) {
              next.albumId = e.albumId;
            }
            return next;
          }),
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    })();

    return () => ac.abort();
  }, [playlist.id, playlist.tracks]);

  const heroImageUrl =
    artworkUrl(playlist.artworkUrl, 600) || "/vinyl-placeholder.svg";

  const trackInfos = useMemo(
    () =>
      tracks.map((s, i) => ({
        ...mapAppleSongToTrackInfo(s, heroImageUrl),
        number: String(i + 1),
      })),
    [tracks, heroImageUrl],
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
        artists: t.artists,
        length: t.length,
        number: t.number,
      })),
    [trackInfos, playlist.name],
  );

  const totalDurationMs = tracks.reduce(
    (sum, track) => sum + (track.durationMs || 0),
    0,
  );
  const totalMinutes = Math.round(totalDurationMs / 60000);
  const totalDuration =
    totalMinutes > 0
      ? totalMinutes >= 60
        ? `${Math.floor(totalMinutes / 60)} hr ${totalMinutes % 60} min`
        : `${totalMinutes} min`
      : null;

  const playbackSource = applePlaylistPlaybackSource(
    playlist.id,
    playlist.name,
  );

  return (
    <CollectionDetailPageLayout
      back={{ href: "/explore", label: "Explore" }}
      artworkSrc={heroImageUrl}
      artworkAlt={playlist.name}
      onPlayClick={() => {
        if (queue.length > 0) playTrack(queue[0], queue, playbackSource);
      }}
      playLabel="Play"
      playDisabled={queue.length === 0}
      eyebrow="Playlist"
      title={playlist.name}
      subtitle={playlist.curatorName || "Apple Music"}
      metaRow={
        <>
          <span>
            {playlist.trackCount}{" "}
            {playlist.trackCount === 1 ? "track" : "tracks"}
          </span>
          {totalDuration ? (
            <>
              <MetaDot />
              <span>{totalDuration}</span>
            </>
          ) : null}
        </>
      }
      listCount={playlist.trackCount || undefined}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onSearchClear={() => setSearchQuery("")}
      onSearchFocus={() => setIsSearchFocused(true)}
      onSearchBlur={() => setIsSearchFocused(false)}
      searchFocused={isSearchFocused}
      list={
        filteredTracks.length === 0 ? (
          <EmptyState
            compact
            title={`No tracks match “${searchQuery}”`}
            description="Try a different search."
          />
        ) : (
          <TrackList>
            {filteredTracks.map((track, i) => (
              <SongRow
                key={`${track.number}-${track.id}`}
                highlighted={track.id === highlightTrackId}
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
                queue={queue}
                playbackSource={playbackSource}
                albumContext={albumContextFromTrack(track)}
              />
            ))}
          </TrackList>
        )
      }
    />
  );
}
