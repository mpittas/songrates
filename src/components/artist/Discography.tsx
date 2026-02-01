"use client";

import { useEffect, useState } from "react";
import AlbumGrid from "@/components/AlbumGrid";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface Release {
  id: string;
  title: string;
  releaseDate?: string;
  wikipediaUrl?: string;
}

interface GroupedReleases {
  [type: string]: Release[];
}

type AlbumType = Release & { wikipediaUrl?: string };

const FILTER_OUT_CATEGORIES = ["Compilations", "Live"];

// Helper component for Collapsible Section (Grid or List)
function CollapsibleSection({
  title,
  releases,
  onSelectAlbum,
  layout = "list",
  defaultOpen = true,
}: {
  title: string;
  releases: AlbumType[];
  onSelectAlbum: (id: string) => void;
  layout?: "grid" | "list";
  defaultOpen?: boolean;
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
        <span className="text-sm text-neutral-400 group-hover:text-neutral-200 transition-colors uppercase font-mono tracking-wider">
          {title}
          <span className="text-neutral-600 ml-2 text-xs normal-case">
            ({releases.length})
          </span>
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

export default function Discography({
  artistId,
  mainAlbums,
  onSelectAlbum,
  initialReleases = {},
}: {
  artistId: string;
  mainAlbums: any[];
  onSelectAlbum: (id: string) => void;
  initialReleases?: GroupedReleases;
}) {
  const [releases, setReleases] = useState<GroupedReleases>(initialReleases);
  const [loading, setLoading] = useState(
    Object.keys(initialReleases).length === 0,
  );

  useEffect(() => {
    if (Object.keys(initialReleases).length > 0) return;
    if (!artistId) return;

    fetch(`/api/musicbrainz/other-releases?artistId=${artistId}`)
      .then((res) => res.json())
      .then((data) => {
        setReleases(data.releases || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [artistId, initialReleases]);

  const getReleases = (key: string) => releases[key] || [];

  const eps = getReleases("EPs");
  const otherAlbums = getReleases("Other Albums");
  const singles = getReleases("Singles");

  // Collect other miscellaneous categories
  const miscCategories = Object.keys(releases).filter(
    (key) =>
      !["EPs", "Other Albums", "Singles"].includes(key) &&
      !FILTER_OUT_CATEGORIES.some(
        (filter) => key.includes(filter) || key === filter,
      ) &&
      releases[key].length > 0,
  );

  return (
    <div className="bg-[#222]/40 p-4 space-y-2">
      {/* Main Albums */}
      {mainAlbums.length > 0 && (
        <CollapsibleSection
          title="Albums"
          releases={mainAlbums}
          onSelectAlbum={onSelectAlbum}
          layout="grid"
          defaultOpen={true}
        />
      )}

      {/* EPs */}
      {!loading && eps.length > 0 && (
        <CollapsibleSection
          title="EPs"
          releases={eps as AlbumType[]}
          onSelectAlbum={onSelectAlbum}
          layout="grid"
          defaultOpen={true}
        />
      )}

      {/* Other Albums */}
      {!loading && otherAlbums.length > 0 && (
        <CollapsibleSection
          title="Other Albums"
          releases={otherAlbums as AlbumType[]}
          onSelectAlbum={onSelectAlbum}
          layout="grid"
          defaultOpen={false}
        />
      )}

      {loading && (
        <div className="py-12 flex justify-center">
          <div className="text-neutral-600 text-xs font-mono animate-pulse">
            loading_more_releases...
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Singles */}
          {singles.length > 0 && (
            <CollapsibleSection
              title="Singles"
              releases={singles as AlbumType[]}
              onSelectAlbum={onSelectAlbum}
              layout="list"
              defaultOpen={false}
            />
          )}

          {/* Misc Categories */}
          {miscCategories.map((category) => (
            <CollapsibleSection
              key={category}
              title={category}
              releases={releases[category] as AlbumType[]}
              onSelectAlbum={onSelectAlbum}
              layout="list"
              defaultOpen={false}
            />
          ))}
        </>
      )}
    </div>
  );
}
