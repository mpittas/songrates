"use client";

import { useEffect, useState } from "react";

interface Release {
  id: string;
  title: string;
  releaseDate?: string;
}

interface GroupedReleases {
  [type: string]: Release[];
}

// Order for displaying categories
const CATEGORY_ORDER = ["Singles", "EPs", "Other Albums", "Other"];

export default function OtherReleases({
  artistId,
  onSelectAlbum,
}: {
  artistId: string;
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

  // Get categories in preferred order
  const sortedCategories = CATEGORY_ORDER.filter(
    (cat) => releases[cat] && releases[cat].length > 0,
  );

  // If no other releases, don't show anything
  if (!loading && sortedCategories.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-12">
        <div className="text-zinc-600 text-sm animate-pulse">
          loading other releases...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-zinc-800 pt-8">
      <h2 className="text-lg font-light text-zinc-400 mb-6">Other Releases</h2>

      <div className="space-y-4">
        {sortedCategories.map((category) => {
          const items = releases[category];
          const isExpanded = expandedCategories.has(category);
          const displayItems = isExpanded ? items : items.slice(0, 5);

          return (
            <div
              key={category}
              className="border border-zinc-800 bg-zinc-900/30"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-sm text-zinc-300">
                  {category}
                  <span className="text-zinc-600 ml-2">({items.length})</span>
                </span>
                <span className="text-zinc-600 text-xs">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </button>

              {/* Items List */}
              <div className="border-t border-zinc-800">
                {displayItems.map((release) => (
                  <div
                    key={release.id}
                    onClick={() => onSelectAlbum(release.id)}
                    className="px-4 py-2 flex items-center justify-between hover:bg-zinc-800/30 cursor-pointer transition-colors border-b border-zinc-800/50 last:border-b-0"
                  >
                    <span className="text-sm text-zinc-400 truncate">
                      {release.title}
                    </span>
                    <span className="text-xs text-zinc-600 flex-shrink-0 ml-4">
                      {release.releaseDate?.split("-")[0] || "—"}
                    </span>
                  </div>
                ))}

                {/* Show more button */}
                {!isExpanded && items.length > 5 && (
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-center"
                  >
                    Show all {items.length} {category.toLowerCase()}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
