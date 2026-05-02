"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import SongRow from "@/main-components/SongRow";
import ArtistAccordion from "./ArtistAccordion";
import AlbumCard from "@/components/album/AlbumCard";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import { formatTime } from "@/lib/utils";

import { Album, TopSong } from "@/types/music";

interface DiscographyProps {
  artistId: string;
  artistName: string;
  topSongs: TopSong[];
  essentialAlbums: Album[];
  albums: Album[];
  epsAndSingles: Album[];
  appearsOn: Album[];
  searchQuery?: string;
}

// ─── Top Songs list ─────────────────────────────────────────────────────────

function TopSongsList({ songs }: { songs: TopSong[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? songs : songs.slice(0, 10);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {visible.map((song, i) => {
          return (
            <SongRow
              key={song.id}
              index={i + 1}
              title={song.name}
              artist={song.artistName}
              album={song.albumName || "Unknown Album"}
              duration={
                song.durationMs ? formatTime(song.durationMs, "milliseconds") : "—"
              }
              artworkUrl={song.artworkUrl}
              artistId={song.artistId}
              albumId={song.albumId}
              track={{
                id: song.id,
                title: song.name,
                artistName: song.artistName,
                artistId: song.artistId,
                albumId: song.albumId,
                albumTitle: song.albumName,
                albumImageUrl: song.artworkUrl,
                length: song.durationMs,
              }}
              albumContext={
                song.albumId
                  ? {
                      albumId: song.albumId,
                      title: song.albumName || "Unknown Album",
                      artistName: song.artistName,
                      totalTracks: 1,
                      artworkUrl: song.artworkUrl,
                      releaseDate: song.releaseDate,
                    }
                  : undefined
              }
            />
          );
        })}
      </div>

      {songs.length > 10 && (
        <div className="mt-3 flex justify-center border-t border-[#ececec] pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-[10px]  tracking-widest"
          >
            {showAll ? "show_less" : `show_all_${songs.length}_songs`}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Album grid with show more ──────────────────────────────────────────────

function AlbumGridSection({
  albums,
  initialCount = 12,
}: {
  albums: Album[];
  initialCount?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? albums : albums.slice(0, initialCount);
  const hasMore = albums.length > initialCount;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visible.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            ratingMode="full"
            showOptionsMenu={false}
          />
        ))}
      </div>
      {hasMore && (
        <div className="mt-4 flex justify-center border-t border-[#ececec] pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] uppercase tracking-widest"
          >
            {showAll ? "show_less" : `show_all_${albums.length}_releases`}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Discography component ─────────────────────────────────────────────

export default function Discography({
  topSongs,
  essentialAlbums,
  albums,
  epsAndSingles,
  appearsOn,
  searchQuery,
}: DiscographyProps) {
  const { getAlbumRating } = useRatings();

  // Deduplicate albums within a list by ID
  const dedup = (list: Album[]): Album[] => {
    const seen = new Set<string>();
    return list.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  };

  // Apply search filter + attach ratings
  const filterAlbums = (list: Album[]): Album[] => {
    let result = dedup(list);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }
    return result.map((a) => ({ ...a, rating: getAlbumRating(a.id) }));
  };

  const filterSongs = (list: TopSong[]): TopSong[] => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.albumName && s.albumName.toLowerCase().includes(q)),
    );
  };

  const filteredTopSongs = filterSongs(topSongs);
  const filteredEssential = filterAlbums(essentialAlbums);
  const filteredAlbums = filterAlbums(albums);
  const filteredEpsAndSingles = filterAlbums(epsAndSingles);
  const filteredAppearsOn = filterAlbums(appearsOn);

  return (
    <div className="space-y-4">
      {filteredTopSongs.length > 0 && (
        <ArtistAccordion
          title="Top Songs"
          count={filteredTopSongs.length}
          defaultOpen={true}
        >
          <TopSongsList songs={filteredTopSongs} />
        </ArtistAccordion>
      )}

      {/* ── Essential Albums ── */}
      {filteredEssential.length > 0 && (
        <ArtistAccordion
          title="Essential Albums"
          count={filteredEssential.length}
          defaultOpen={true}
        >
          <AlbumGridSection
            albums={filteredEssential}
            initialCount={3}
          />
        </ArtistAccordion>
      )}

      {/* ── Albums ── */}
      {filteredAlbums.length > 0 && (
        <ArtistAccordion
          title="Albums"
          count={filteredAlbums.length}
          defaultOpen={true}
        >
          <AlbumGridSection
            albums={filteredAlbums}
            initialCount={12}
          />
        </ArtistAccordion>
      )}

      {/* ── EPs & Singles ── */}
      {filteredEpsAndSingles.length > 0 && (
        <ArtistAccordion
          title="EPs & Singles"
          count={filteredEpsAndSingles.length}
          defaultOpen={false}
        >
          <AlbumGridSection
            albums={filteredEpsAndSingles}
            initialCount={3}
          />
        </ArtistAccordion>
      )}

      {/* ── Appears On ── */}
      {filteredAppearsOn.length > 0 && (
        <ArtistAccordion
          title="Appears On"
          count={filteredAppearsOn.length}
          defaultOpen={false}
        >
          <AlbumGridSection
            albums={filteredAppearsOn}
            initialCount={3}
          />
        </ArtistAccordion>
      )}
    </div>
  );
}
