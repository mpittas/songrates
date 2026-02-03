"use client";

import { useState } from "react";
import AlbumGrid from "@/components/AlbumGrid";
import { FaChevronDown, FaChevronUp, FaInfoCircle } from "react-icons/fa";
import Tooltip from "@/components/Tooltip";
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
}: {
  title: string;
  releases: AlbumType[];
  onSelectAlbum: (id: string) => void;
  layout?: "grid" | "list";
  defaultOpen?: boolean;
  tooltipText?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(false); // For "Show More" (>10 items)

  const handleToggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  const handleToggleShowMore = () => {
    setIsExpanded(!isExpanded);
  };

  // Limit initial items mostly for list view or to save DOM elements
  // For grid view, we might want to show more or all, but let's keep consistency
  const displayCount = isExpanded ? releases.length : 12; // 12 fits well in grids (2, 3, 4, 6)
  const visibleReleases = releases.slice(0, displayCount);
  const hasMore = releases.length > 12;

  return (
    <div className="border border-[#1a1a1f] bg-[#0a0a0d]/50">
      <button
        onClick={handleToggleAccordion}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#0f0f12] transition-colors group"
      >
        <span className="text-sm text-neutral-400 group-hover:text-neutral-200 transition-colors font-mono flex items-center gap-1">
          <div className="uppercase">{title}</div>

          <span className="text-neutral-600 text-xs normal-case">
            ({releases.length})
          </span>

          {tooltipText && (
            <Tooltip content={tooltipText}>
              <span className="block p-1 hover:text-neutral-100 transition-colors cursor-help opacity-50 hover:opacity-100">
                <FaInfoCircle size={10} />
              </span>
            </Tooltip>
          )}
        </span>
        <span className="text-neutral-600 text-xs font-mono">
          {isOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-[#1a1a1f] p-4">
          <AlbumGrid
            albums={visibleReleases}
            onSelectAlbum={onSelectAlbum}
            layout={layout}
          />

          {hasMore && (
            <div className="mt-4 pt-4 border-t border-[#1a1a1f]/30 flex justify-center">
              <button
                onClick={handleToggleShowMore}
                className="text-xs text-neutral-500 hover:text-[#00f0ff] transition-colors font-mono"
              >
                {isExpanded
                  ? "show less"
                  : `show all ${releases.length} releases`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
