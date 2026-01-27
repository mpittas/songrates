"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getArtistHistory, type ArtistVisit } from "@/lib/history";

export default function RecentArtists() {
  const [history, setHistory] = useState<ArtistVisit[]>([]);

  useEffect(() => {
    setHistory(getArtistHistory());
  }, []);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="text-xl font-thin text-zinc-400 mb-6">Recently Visited</h2>
      <div className="grid gap-2">
        {history.map((artist) => (
          <Link
            key={artist.id}
            href={`/artist/${artist.id}`}
            className="text-zinc-100 hover:text-white transition-colors py-2 px-3 rounded hover:bg-zinc-900/50 block"
          >
            <div className="flex items-center justify-between">
              <span className="font-normal">{artist.name}</span>
              <span className="text-xs text-zinc-600 font-mono">
                {formatTime(artist.visitedAt)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
