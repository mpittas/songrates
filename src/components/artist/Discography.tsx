"use client";

import { useEffect, useState } from "react";
import AlbumGrid from "@/components/AlbumGrid";
import Link from "next/link";
import { FaChevronDown, FaChevronUp, FaChevronRight } from "react-icons/fa";

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

// Helper component for Collapsible List Section
function CollapsibleListSection({
  title,
  releases,
  onSelectAlbum,
}: {
  title: string;
  releases: AlbumType[];
  onSelectAlbum: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false); // Default logic: "When accordion toggle is clicked it collapsers". Wait, user said "Keep accordions... when toggle is clicked it collapses and hides all list items".
  // Usually this means it starts OPEN? Or CLOSED?
  // "by default show 10 items from each category" implies it is OPEN initially to show those 10 items.
  // So default isOpen = true.

  const [isExpanded, setIsExpanded] = useState(false); // For "Show More" (>10)

  // Wait, let's re-read: "Keep the accordions, by default show 10 items from each category and the when accordion toggle is clicked it collapsers and hides all list items."
  // This confirms:
  // 1. Accordion Header -> Controls visibility of whole list. Default: OPEN (showing 10).
  // 2. "Show More / Hide Items" -> Controls visibility of items > 10. Default: HIDDEN (Limit 10).

  useEffect(() => {
    setIsOpen(true);
  }, []); // Set default open

  const handleToggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  const handleToggleShowMore = () => {
    setIsExpanded(!isExpanded);
  };

  const displayCount = isExpanded ? releases.length : 10;
  const visibleReleases = releases.slice(0, displayCount);
  const hasMore = releases.length > 10;

  return (
    <div className="border border-[#1a1a1f] bg-[#0a0a0d]/50 mb-4">
      <button
        onClick={handleToggleAccordion}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#0f0f12] transition-colors group"
      >
        <span className="text-sm text-neutral-400 group-hover:text-neutral-200 transition-colors">
          {title}
          <span className="text-neutral-600 font-mono ml-2 text-xs">
            {releases.length}
          </span>
        </span>
        <span className="text-neutral-600 text-xs font-mono">
          {isOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-[#1a1a1f]">
          <AlbumGrid
            albums={visibleReleases}
            onSelectAlbum={onSelectAlbum}
            layout="list"
          />

          {hasMore && (
            <button
              onClick={handleToggleShowMore}
              className="w-full px-4 py-3 text-xs text-neutral-500 hover:text-[#00f0ff] transition-colors text-center font-mono border-t border-[#1a1a1f]/50 hover:bg-[#0f0f12]"
            >
              {isExpanded ? "show less" : `show all ${releases.length} items`}
            </button>
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

  // Section Divider Component
  const Divider = () => <div className="h-px bg-[#1a1a1f] w-full my-12" />;

  const getReleases = (key: string) => releases[key] || [];

  const eps = getReleases("EPs");
  const otherAlbums = getReleases("Other Albums");
  const singles = getReleases("Singles");

  // Collect other miscellaneous categories (excluding Grid types, Singles, and Filtered types)
  const miscCategories = Object.keys(releases).filter(
    (key) =>
      !["EPs", "Other Albums", "Singles"].includes(key) &&
      !FILTER_OUT_CATEGORIES.some(
        (filter) => key.includes(filter) || key === filter,
      ) &&
      releases[key].length > 0,
  );

  let hasRenderedPrevious = mainAlbums.length > 0;

  return (
    <div className="bg-[#222]/40 p-4">
      {mainAlbums.length > 0 && (
        <AlbumGrid
          albums={mainAlbums}
          onSelectAlbum={onSelectAlbum}
          title="Albums"
          priorityCount={6}
          layout="grid"
        />
      )}

      {loading && (
        <div className="mt-12">
          {hasRenderedPrevious && <Divider />}
          <div className="text-neutral-600 text-xs font-mono animate-pulse">
            loading_more_releases...
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Grid Sections */}
          {otherAlbums.length > 0 && (
            <>
              {hasRenderedPrevious && <Divider />}
              <AlbumGrid
                albums={otherAlbums as AlbumType[]}
                onSelectAlbum={onSelectAlbum}
                title="Other Albums"
                layout="grid"
              />
              {(hasRenderedPrevious = true)}
            </>
          )}

          {eps.length > 0 && (
            <>
              {hasRenderedPrevious && <Divider />}
              <AlbumGrid
                albums={eps as AlbumType[]}
                onSelectAlbum={onSelectAlbum}
                title="EPs"
                layout="grid"
              />
              {(hasRenderedPrevious = true)}
            </>
          )}

          {/* List Sections (Accordion style) */}
          {(singles.length > 0 || miscCategories.length > 0) && (
            <div className="mt-12 space-y-4">
              {hasRenderedPrevious && (
                <h2 className="font-mono text-xs text-neutral-500 mb-6 tracking-wide">
                  other_releases_
                </h2>
              )}

              {singles.length > 0 && (
                <CollapsibleListSection
                  title="Singles"
                  releases={singles as AlbumType[]}
                  onSelectAlbum={onSelectAlbum}
                />
              )}

              {miscCategories.map((category) => (
                <CollapsibleListSection
                  key={category}
                  title={category}
                  releases={releases[category] as AlbumType[]}
                  onSelectAlbum={onSelectAlbum}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
