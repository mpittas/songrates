"use client";

import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import Button from "@/components/ui/Button";
import TrackList from "@/components/ui/TrackList";
import SongRow from "@/main-components/SongRow";
import { cn, formatTime } from "@/lib/utils";
import type { TopSong } from "@/types/music";

const INITIAL_COUNT = 10;

function formatReleaseDate(iso?: string): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month) return iso;
  return new Date(Date.UTC(year, month - 1, day || 1)).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: day ? "numeric" : undefined,
      year: "numeric",
      timeZone: "UTC",
    },
  );
}

export default function TopSongsList({
  songs,
  trailing = "duration",
}: {
  songs: TopSong[];
  trailing?: "duration" | "releaseDate";
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? songs : songs.slice(0, INITIAL_COUNT);

  return (
    <div>
      <TrackList columns={2}>
        {visible.map((song, i) => (
          <SongRow
            key={song.id}
            index={i + 1}
            title={song.name}
            artist={song.artistName}
            album={song.albumName || "Unknown Album"}
            duration={
              trailing === "releaseDate"
                ? formatReleaseDate(song.releaseDate)
                : song.durationMs
                  ? formatTime(song.durationMs, "milliseconds")
                  : "—"
            }
            artworkUrl={song.artworkUrl}
            artistId={song.artistId}
            albumId={song.albumId}
            showAlbumInSubline={false}
            track={{
              id: song.id,
              title: song.name,
              artistName: song.artistName,
              artistId: song.artistId,
              artists: song.artists,
              albumId: song.albumId,
              albumTitle: song.albumName,
              albumImageUrl: song.artworkUrl,
              length: song.durationMs,
              releaseDate: song.releaseDate,
            }}
            albumContext={
              song.albumId
                ? {
                    albumId: song.albumId,
                    title: song.albumName || "Unknown Album",
                    artistName: song.artistName,
                    artworkUrl: song.artworkUrl,
                    releaseDate: song.releaseDate,
                  }
                : undefined
            }
          />
        ))}
      </TrackList>

      {songs.length > INITIAL_COUNT && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="border"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            iconRight={
              <LuChevronDown
                size={15}
                className={cn(
                  "transition-transform duration-200",
                  showAll && "rotate-180",
                )}
              />
            }
          >
            {showAll ? "Show less" : `Show all ${songs.length} songs`}
          </Button>
        </div>
      )}
    </div>
  );
}
