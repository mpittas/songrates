"use client";

import { useEffect, useState } from "react";
import AlbumGrid from "@/components/AlbumGrid";
import { FaChevronDown, FaChevronUp, FaInfoCircle } from "react-icons/fa";
import Tooltip from "@/components/Tooltip";

import { Album, GroupedReleases, Release } from "@/types/music";

type AlbumType = Release & { wikipediaUrl?: string };

const FILTER_OUT_CATEGORIES = ["Compilations", "Live"];

// Helper component for Collapsible Section (Grid or List)
function CollapsibleSection({
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

export default function Discography({
  artistId,
  artistName,
  mainAlbums,
  onSelectAlbum,
  initialReleases = {},
  searchQuery,
  sortBy,
}: {
  artistId: string;
  artistName: string;
  mainAlbums: AlbumType[];
  onSelectAlbum: (id: string) => void;
  initialReleases?: GroupedReleases;
  searchQuery?: string;
  sortBy?: "newest" | "oldest" | "title" | "popularity";
}) {
  const [releases, setReleases] = useState<GroupedReleases>(initialReleases);
  const [loading, setLoading] = useState(
    Object.keys(initialReleases).length === 0,
  );
  const [popularityScores, setPopularityScores] = useState<
    Record<string, number>
  >({});
  const [isLoadingPopularity, setIsLoadingPopularity] = useState(false);
  const [hasFetchedPopularity, setHasFetchedPopularity] = useState(false);

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

  // Fetch popularity in the background after mount (delayed)
  useEffect(() => {
    if (hasFetchedPopularity) return; // Already fetched for this artist
    if (!artistName) return;

    setIsLoadingPopularity(true);

    // Use local proxy to avoid CORS/Mixed Content issues with Last.fm API
    fetch(`/api/lastfm/popularity?artistName=${encodeURIComponent(artistName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Proxy fetch failed");
        return res.json();
      })
      .then((scores) => {
        console.log("Popularity scores loaded:", Object.keys(scores).length);
        setPopularityScores(scores);
        setHasFetchedPopularity(true);
      })
      .catch((err) => console.error("Error fetching popularity:", err))
      .finally(() => setIsLoadingPopularity(false));
  }, [artistName, hasFetchedPopularity]);

  const sortReleases = (list: Release[]) => {
    // If not popularity, we assume list is passed in default order (Newest/Oldest/etc)
    // from parent or is raw. But wait, Parent 'ArtistPageContent' handles Newest/Oldest/Title.
    // So if sortBy is NOT popularity, we preserver order?
    // Actually, 'Releases' are fetched internally here, so PARENT sort doesn't affect them.
    // We need to implement ALL sorts here for 'Releases', or at least 'Popularity'.
    // For consistency, let's replicate parent sort or just handle popularity.
    // Given the props say 'sortBy' is passed, we should probably respect it for ALL lists if possible.

    // Parent sorts 'mainAlbums'. We should re-sort mainAlbums only if popularity.
    // For other releases, we should also sort them.

    const sorted = [...list];

    if (sortBy === "popularity") {
      return sorted.sort((a, b) => {
        const titleA = a.title.toLowerCase().trim();
        const titleB = b.title.toLowerCase().trim();
        const scoreA = popularityScores[titleA] || 0;
        const scoreB = popularityScores[titleB] || 0;

        // Secondary sort by date if scores are equal?
        if (scoreB === scoreA) {
          return (b.releaseDate || "").localeCompare(a.releaseDate || "");
        }
        return scoreB - scoreA;
      });
    }

    // If we want to support other sorts for the "other releases" (which are fetched internally):
    if (sortBy === "newest") {
      return sorted.sort((a, b) =>
        (b.releaseDate || "").localeCompare(a.releaseDate || ""),
      );
    }
    if (sortBy === "oldest") {
      return sorted.sort((a, b) =>
        (a.releaseDate || "").localeCompare(b.releaseDate || ""),
      );
    }
    if (sortBy === "title") {
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  };

  const filterReleases = (list: Release[]) => {
    if (!searchQuery) return list;
    const lowerQuery = searchQuery.toLowerCase();
    return list.filter((r) => r.title.toLowerCase().includes(lowerQuery));
  };

  const getReleases = (key: string) => {
    const filtered = filterReleases(releases[key] || []);
    return sortReleases(filtered);
  };

  const eps = getReleases("EPs");
  const otherAlbums = getReleases("Other Albums");
  const singles = getReleases("Singles");

  // Collect other miscellaneous categories
  const miscCategories = Object.keys(releases).filter(
    (key) =>
      !["EPs", "Other Albums", "Singles", "Other"].includes(key) &&
      !FILTER_OUT_CATEGORIES.some(
        (filter) => key.includes(filter) || key === filter,
      ) &&
      getReleases(key).length > 0,
  );

  // Apply popularity sort to mainAlbums as well (if popularity is selected)
  // For other sorts, mainAlbums is already passed sorted from parent, but doing it here again doesn't hurt.
  const processedMainAlbums = sortReleases(filterReleases(mainAlbums));

  return (
    <div className="bg-[#222]/40 p-4 space-y-2">
      {/* Main Albums */}
      {processedMainAlbums.length > 0 && (
        <CollapsibleSection
          title="Albums"
          releases={processedMainAlbums}
          onSelectAlbum={onSelectAlbum}
          layout="grid"
          defaultOpen={true}
          tooltipText="Full-length studio albums, typically containing 7+ tracks."
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
          tooltipText="Extended Plays. Shorter than albums but longer than singles (usually 3-6 tracks)."
        />
      )}

      {/* Other Albums */}
      {!loading && otherAlbums.length > 0 && (
        <CollapsibleSection
          title="Other Albums"
          releases={otherAlbums as AlbumType[]}
          onSelectAlbum={onSelectAlbum}
          layout="grid"
          defaultOpen={true}
          tooltipText="Live albums, compilations, remixes, and soundtracks."
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
              title="Singles & Features"
              releases={singles as AlbumType[]}
              onSelectAlbum={onSelectAlbum}
              layout="list"
              defaultOpen={true}
              tooltipText="Individual songs, guest appearances, and stand-alone releases."
            />
          )}

          {/* Misc Categories */}
          {miscCategories.map((category) => (
            <CollapsibleSection
              key={category}
              title={category}
              releases={getReleases(category) as AlbumType[]}
              onSelectAlbum={onSelectAlbum}
              layout="list"
              defaultOpen={true}
              tooltipText="Miscellaneous releases not fitting into standard categories."
            />
          ))}
        </>
      )}
    </div>
  );
}
