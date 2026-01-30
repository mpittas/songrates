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
    <div className="flex items-center justify-between py-2 border-b border-[#1a1a1f] group hover:bg-[#0a0a0d] px-3 transition-colors">
      <div className="flex items-baseline gap-4 min-w-0 flex-1">
        <span className="text-neutral-600 text-xs font-mono w-6 shrink-0">
          {track.number}
        </span>
        <span className="text-neutral-400 text-sm group-hover:text-neutral-200 transition-colors truncate mr-4">
          {track.title}
        </span>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(artistName + " " + track.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-neutral-600 hover:text-[#00f0ff] border border-[#1a1a1f] hover:border-[#00f0ff]/50 px-1.5 py-0.5"
        >
          ▸
        </a>
      </div>

      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(track.id, star)}
            className={`w-2.5 h-2.5 border border-[#1a1a1f] transition-all duration-200 ${
              rating >= star
                ? "bg-[#00f0ff] border-[#00f0ff]"
                : "hover:border-[#00f0ff]/50"
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
    <div className="fixed inset-0 z-50 bg-[#050507]/95 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg flex flex-col border border-[#1a1a1f] bg-[#050507] p-6">
        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-[#1a1a1f] pb-4">
          <div className="min-w-0 pr-4">
            <h2 className="text-xl text-neutral-200 truncate tracking-tight">
              {albumTitle}
            </h2>
            <p className="text-neutral-600 text-xs font-mono mt-1">
              {artistName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-600 hover:text-[#00f0ff] transition-colors text-xs font-mono shrink-0"
          >
            [×]
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] space-y-0">
          {tracks.map((track) => (
            <TrackItem key={track.id} track={track} artistName={artistName} />
          ))}
        </div>
      </div>
    </div>
  );
}
