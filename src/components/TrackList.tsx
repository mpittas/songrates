"use client";

import { useRatings } from "@/hooks/useRatings";

interface Track {
  id: string;
  title: string;
  length?: number;
  number?: string;
}

function TrackItem({
  track,
  artistName,
}: {
  track: Track;
  artistName: string;
}) {
  const { ratings, setRating } = useRatings();
  const rating = ratings[track.id] || 0;

  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-900 group">
      <div className="flex items-baseline gap-4 min-w-0 flex-1">
        <span className="text-zinc-700 text-sm font-mono w-6 shrink-0">
          {track.number}
        </span>
        <span className="text-zinc-300 group-hover:text-white transition-colors truncate mr-4">
          {track.title}
        </span>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(artistName + " " + track.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-500 px-2 py-0.5 rounded-full"
        >
          play ▸
        </a>
      </div>

      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(track.id, star)}
            className={`w-4 h-4 rounded-full border border-zinc-800 transition-all duration-300 ${
              rating >= star ? "bg-white border-white" : "hover:border-zinc-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function TrackList({
  tracks,
  albumTitle,
  artistName,
  onClose,
}: {
  tracks: Track[];
  albumTitle: string;
  artistName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-12 shrink-0">
          <div className="min-w-0 pr-8">
            <h2 className="text-3xl font-light text-white truncate">
              {albumTitle}
            </h2>
            <p className="text-zinc-500 text-sm mt-1">{artistName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-xl font-light shrink-0"
          >
            close
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-4 space-y-1 custom-scrollbar">
          {tracks.map((track) => (
            <TrackItem key={track.id} track={track} artistName={artistName} />
          ))}
        </div>
      </div>
    </div>
  );
}
