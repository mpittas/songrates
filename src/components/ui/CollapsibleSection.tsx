"use client";

import { useState } from "react";
import AlbumGrid from "@/components/album/AlbumGrid";
import { FaChevronDown, FaChevronUp, FaInfoCircle } from "react-icons/fa";
import Tooltip from "@/components/ui/Tooltip";
import { Release } from "@/types/music";

export type AlbumType = Release & {
  wikipediaUrl?: string;
  artistName?: string;
  rating?: number | null;
};

export default function CollapsibleSection({
  title,
  releases,
  onSelectAlbum,
  layout = "list",
  defaultOpen = true,
  tooltipText,
  gridCols,
}: {
  title: string;
  releases: AlbumType[];
  onSelectAlbum: (id: string) => void;
  layout?: "grid" | "list";
  defaultOpen?: boolean;
  tooltipText?: string;
  gridCols?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(false);

  // 12 is a good grid multiple
  const displayCount = isExpanded ? releases.length : 12;
  const visibleReleases = releases.slice(0, displayCount);
  const hasMore = releases.length > 12;

  return (
    <div className="border border-white/5 bg-neutral-900/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
      >
        <span className="text-xs text-neutral-500 group-hover:text-neutral-300 transition-colors font-mono flex items-center gap-1 uppercase tracking-wider">
          {title}
          <span className="text-neutral-600 ml-1">({releases.length})</span>

          {tooltipText && (
            <Tooltip content={tooltipText}>
              <span className="block p-1 hover:text-white transition-colors cursor-help opacity-50">
                <FaInfoCircle size={10} />
              </span>
            </Tooltip>
          )}
        </span>
        <span className="text-neutral-600">
          {isOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
        </span>
      </button>

      {isOpen && (
        <div className="bg-black/20 border-t border-white/5 p-4">
          <AlbumGrid
            albums={visibleReleases}
            onSelectAlbum={onSelectAlbum}
            layout={layout}
            gridCols={gridCols}
          />

          {hasMore && (
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[10px] text-neutral-600 hover:text-cyan-400 transition-colors font-mono uppercase tracking-widest"
              >
                {isExpanded
                  ? "show_less"
                  : `show_all_${releases.length}_releases`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
