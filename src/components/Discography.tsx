"use client";

import { useEffect, useState } from "react";
import AlbumGrid from "@/components/AlbumGrid";
import Link from "next/link";

interface Release {
  id: string;
  title: string;
  releaseDate?: string;
}

interface GroupedReleases {
  [type: string]: Release[];
}

const CATEGORY_ORDER = ["Singles", "Other"];

export default function Discography({
  artistId,
  mainAlbums,
  onSelectAlbum,
}: {
  artistId: string;
  mainAlbums: any[]; // Using the type from your main page or AlbumGrid
  onSelectAlbum: (id: string) => void;
}) {
  const [releases, setReleases] = useState<GroupedReleases>({});
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (!artistId) return;

    fetch(`/api/musicbrainz/other-releases?artistId=${artistId}`)
      .then((res) => res.json())
      .then((data) => {
        setReleases(data.releases || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [artistId]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const otherAlbums = releases["Other Albums"] || [];
  const eps = releases["EPs"] || [];
  const sortedCategories = CATEGORY_ORDER.filter(
    (cat) => releases[cat] && releases[cat].length > 0,
  );

  const hasMainAlbums = mainAlbums.length > 0;
  const hasOtherAlbums = otherAlbums.length > 0;
  const hasEps = eps.length > 0;
  const hasOtherCategories = sortedCategories.length > 0;

  // We always show the container if there are main albums, even if loading other stuff.
  // If no main albums and loading other stuff, we show loading state?
  // User's page.tsx handles global loading for main albums. This component assumes mainAlbums are loaded (or empty).

  // Section Divider Component
  const Divider = () => <div className="h-px bg-[#1a1a1f] w-full my-12" />;

  return (
    <div className="border border-[#1a1a1f] bg-[#0a0a0d]/40 p-4">
      {/* Main Albums */}
      {hasMainAlbums && (
        <div>
          <AlbumGrid
            albums={mainAlbums}
            onSelectAlbum={onSelectAlbum}
            title="Albums"
          />
        </div>
      )}

      {/* Loading State for Other Releases */}
      {loading && (
        <div className="mt-12">
          {hasMainAlbums && <Divider />}
          <div className="text-neutral-600 text-xs font-mono animate-pulse">
            loading_more_releases...
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Other Albums */}
          {hasOtherAlbums && (
            <>
              {hasMainAlbums && <Divider />}
              <div>
                <AlbumGrid
                  albums={otherAlbums}
                  onSelectAlbum={onSelectAlbum}
                  title="Other Albums"
                />
              </div>
            </>
          )}

          {/* EPs */}
          {hasEps && (
            <>
              {(hasMainAlbums || hasOtherAlbums) && <Divider />}
              <div>
                <AlbumGrid
                  albums={eps}
                  onSelectAlbum={onSelectAlbum}
                  title="EPs"
                />
              </div>
            </>
          )}

          {/* Other Categories (Singles, etc.) */}
          {hasOtherCategories && (
            <>
              {(hasMainAlbums || hasOtherAlbums || hasEps) && <Divider />}
              <div>
                <h2 className="font-mono text-xs text-neutral-500 mb-6 tracking-wide">
                  other_releases_
                </h2>

                <div className="space-y-2">
                  {sortedCategories.map((category) => {
                    const items = releases[category];
                    const isExpanded = expandedCategories.has(category);
                    const displayItems = isExpanded ? items : items.slice(0, 5);

                    return (
                      <div
                        key={category}
                        className="border border-[#1a1a1f] bg-[#0a0a0d]/50"
                      >
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#0f0f12] transition-colors"
                        >
                          <span className="text-sm text-neutral-400">
                            {category}
                            <span className="text-neutral-600 font-mono ml-2 text-xs">
                              {items.length}
                            </span>
                          </span>
                          <span className="text-neutral-600 text-xs font-mono">
                            {isExpanded ? "−" : "+"}
                          </span>
                        </button>

                        <div className="border-t border-[#1a1a1f]">
                          {displayItems.map((release) => (
                            <Link
                              key={release.id}
                              href={`/album/${release.id}`}
                              className="px-4 py-2 flex items-center justify-between hover:bg-[#0f0f12] cursor-pointer transition-colors border-b border-[#1a1a1f]/50 last:border-b-0 group"
                            >
                              <span className="text-sm text-neutral-500 truncate group-hover:text-[#00f0ff]">
                                {release.title}
                              </span>
                              <span className="text-[10px] text-neutral-700 font-mono flex-shrink-0 ml-4">
                                {release.releaseDate?.split("-")[0] || "—"}
                              </span>
                            </Link>
                          ))}

                          {!isExpanded && items.length > 5 && (
                            <button
                              onClick={() => toggleCategory(category)}
                              className="w-full px-4 py-2 text-xs text-neutral-600 hover:text-[#00f0ff] transition-colors text-center font-mono"
                            >
                              show all {items.length}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
