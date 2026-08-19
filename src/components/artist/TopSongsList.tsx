"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import SongRow from "@/main-components/SongRow";
import { formatTime } from "@/lib/utils";
import type { TopSong } from "@/types/music";

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
  const visible = showAll ? songs : songs.slice(0, 10);

  return (
    <div>
      <div className="flex flex-col gap-1.5 sm:gap-2">
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
      </div>

      {songs.length > 10 && (
        <div className="mt-4 flex justify-center pb-6">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setShowAll(!showAll)}
            className="w-full"
          >
            {showAll ? "Show less" : `Show all ${songs.length} songs`}
          </Button>
        </div>
      )}
    </div>
  );
}
