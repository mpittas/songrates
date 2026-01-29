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
    <div className="flex items-center justify-between py-1 border-b border-zinc-900 group hover:bg-zinc-900/50 px-2 transition-colors">
      <div className="flex items-baseline gap-4 min-w-0 flex-1">
        <span className="text-zinc-600 text-xs w-6 shrink-0">
          {track.number}
        </span>
        <span className="text-zinc-300 text-xs group-hover:text-white transition-colors truncate mr-4">
          {track.title}
        </span>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(artistName + " " + track.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-500 px-1.5 py-px"
        >
          play ▸
        </a>
      </div>

      <div className="flex gap-0.5 shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(track.id, star)}
            className={`w-3 h-3 border border-zinc-800 transition-all duration-300 ${
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
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg flex flex-col border border-zinc-800 bg-[#0a0a0a] p-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-dashed border-zinc-800 pb-4">
          <div className="min-w-0 pr-4">
            <h2 className="text-xl font-bold text-white truncate lowercase tracking-tight">
              {albumTitle}
            </h2>
            <p className="text-zinc-500 text-xs mt-1">{artistName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-sm shrink-0 hover:underline"
          >
            [close]
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] pr-2 space-y-0 custom-scrollbar">
          {tracks.map((track) => (
            <TrackItem key={track.id} track={track} artistName={artistName} />
          ))}
        </div>
      </div>
    </div>
  );
}
