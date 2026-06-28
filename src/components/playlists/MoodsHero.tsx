import type { ReactNode } from "react";
import { FaBolt } from "react-icons/fa6";

import OptimizedImage from "@/components/ui/OptimizedImage";
import PageHero from "@/components/ui/PageHero";

interface MoodsHeroProps {
  moodCount?: number;
  totalPlaylists?: number;
  heroArtworks?: string[];
}

function StatChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
      {children}
    </span>
  );
}

export default function MoodsHero({
  moodCount,
  totalPlaylists,
  heroArtworks = [],
}: MoodsHeroProps) {
  const hasStats = moodCount !== undefined && totalPlaylists !== undefined;

  return (
    <PageHero
      eyebrow="Moods"
      title="Find Your Vibe"
      subtitle={
        <>
          <p>Curated playlists for every moment you&apos;re in.</p>
          {hasStats ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <StatChip>{moodCount} moods</StatChip>
              <StatChip>{totalPlaylists} playlists</StatChip>
            </div>
          ) : null}
        </>
      }
      icon={<FaBolt size={28} />}
      actions={
        heroArtworks.length > 0 ? (
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
            {heroArtworks.map((src, i) => (
              <div
                key={src}
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-sm sm:h-16 sm:w-16"
              >
                <OptimizedImage
                  src={src}
                  alt="Playlist cover"
                  fill
                  priority={i < 3}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : undefined
      }
    />
  );
}
