"use client";

import { FaPlay } from "react-icons/fa";

import Button from "@/components/ui/Button";
import FavoriteButton from "@/components/ui/FavoriteButton";
import type { ArtistInfo as ArtistInfoType, Track } from "@/types/music";

export interface ArtistPageHeaderProps {
  artistId: string;
  artistName: string;
  artistInfo: ArtistInfoType;
  topSongsQueue: Track[];
  onPlayTopSongs: () => void;
}

/** Artist hero: portrait, name, genres and primary actions. */
export default function ArtistPageHeader({
  artistId,
  artistName,
  artistInfo,
  topSongsQueue,
  onPlayTopSongs,
}: ArtistPageHeaderProps) {
  const genres = (artistInfo.genres ?? [])
    .filter((genre) => genre !== "Music")
    .slice(0, 4);

  return (
    <header className="flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:gap-10 md:text-left">
      <div className="relative aspect-square w-[min(56vw,220px)] shrink-0 overflow-hidden rounded-full bg-subtle shadow-[0_28px_60px_-24px_rgb(21_20_19/0.55)] ring-1 ring-black/5 md:w-52 lg:w-60">
        {artistInfo.image ? (
          <img
            src={artistInfo.image}
            alt={artistName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-5xl font-semibold text-ink-3">
            {artistName.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex w-full min-w-0 flex-1 flex-col items-center md:items-start md:pb-1">
        <p className="eyebrow text-ink-2">Artist</p>
        <h1 className="mt-3 max-w-full font-display text-[2.5rem] leading-[1] font-semibold tracking-[-0.05em] text-balance break-words text-ink sm:text-6xl lg:text-7xl">
          {artistName}
        </h1>

        {genres.length > 0 ? (
          <ul className="mt-4 flex flex-wrap justify-center gap-1.5 md:justify-start">
            {genres.map((genre) => (
              <li
                key={genre}
                className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-medium text-ink-2"
              >
                {genre}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 flex w-full items-center justify-center gap-2 sm:w-auto md:justify-start">
          {topSongsQueue.length > 0 ? (
            <Button
              variant="primary"
              size="lg"
              iconLeft={<FaPlay size={13} />}
              onClick={onPlayTopSongs}
              className="flex-1 sm:flex-none sm:px-7"
            >
              Play top songs
            </Button>
          ) : null}
          <FavoriteButton
            itemId={artistId}
            itemType="artist"
            itemName={artistName}
            thumbnailUrl={artistInfo.image || undefined}
            variant="secondary"
            buttonSize="lg"
            iconOnly
          />
        </div>
      </div>
    </header>
  );
}
