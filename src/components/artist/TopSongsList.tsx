"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import SongRow from "@/main-components/SongRow";
import { formatTime } from "@/lib/utils";
import type { TopSong } from "@/types/music";

export default function TopSongsList({ songs }: { songs: TopSong[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? songs : songs.slice(0, 10);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {visible.map((song, i) => (
          <SongRow
            key={song.id}
            index={i + 1}
            title={song.name}
            artist={song.artistName}
            album={song.albumName || "Unknown Album"}
            duration={
              song.durationMs ? formatTime(song.durationMs, "milliseconds") : "—"
            }
            artworkUrl={song.artworkUrl}
            artistId={song.artistId}
            albumId={song.albumId}
            track={{
              id: song.id,
              title: song.name,
              artistName: song.artistName,
              artistId: song.artistId,
              albumId: song.albumId,
              albumTitle: song.albumName,
              albumImageUrl: song.artworkUrl,
              length: song.durationMs,
            }}
            albumContext={
              song.albumId
                ? {
                    albumId: song.albumId,
                    title: song.albumName || "Unknown Album",
                    artistName: song.artistName,
                    totalTracks: 1,
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
