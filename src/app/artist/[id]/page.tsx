"use client";

import { useEffect, useState } from "react";
import AlbumGrid from "@/components/AlbumGrid";
import TrackList from "@/components/TrackList";
import ArtistInfo from "@/components/ArtistInfo";
import OtherReleases from "@/components/OtherReleases";
import Link from "next/link";
import { useParams } from "next/navigation";
import { addToHistory } from "@/lib/history";

export default function ArtistPage() {
  const { id } = useParams();
  const [albums, setAlbums] = useState([]);
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(true);

  // Sorting State
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");

  // Tracklist State
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [tracks, setTracks] = useState([]);
  const [currentAlbumTitle, setCurrentAlbumTitle] = useState("");

  // Fetch Albums & Artist Info
  const [artistInfoData, setArtistInfoData] = useState<any>(null);

  // Fetch Albums & Artist Info
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        // 1. Fetch Artist Name (Fastest check)
        const nameRes = await fetch(`/api/musicbrainz/artist?id=${id}`);
        const nameData = await nameRes.json();

        if (nameData.artist) {
          setArtistName(nameData.artist.name);
          addToHistory(id as string, nameData.artist.name);
        }

        // 2. Fetch Artist Info (Images, Bio, Links) - Wait for this before starting albums
        const infoRes = await fetch(`/api/artist-info?id=${id}`);
        const infoData = await infoRes.json();

        if (infoData.artistInfo) {
          setArtistInfoData(infoData.artistInfo);
        }

        // 3. Now fetch the discography logic
        const albumsRes = await fetch(`/api/musicbrainz/albums?artistId=${id}`);
        const albumsData = await albumsRes.json();

        setAlbums(albumsData.albums || []);
        setLoading(false);
      } catch (error) {
        console.error("Error loading artist data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Sort Albums
  const sortedAlbums = [...albums].sort((a: any, b: any) => {
    if (sortBy === "newest") {
      return (b.releaseDate || "").localeCompare(a.releaseDate || "");
    }
    if (sortBy === "oldest") {
      return (a.releaseDate || "").localeCompare(b.releaseDate || "");
    }
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Fetch Tracks when album selected
  useEffect(() => {
    if (!selectedAlbumId) return;

    fetch(`/api/musicbrainz/tracks?albumId=${selectedAlbumId}`)
      .then((res) => res.json())
      .then((data) => {
        setTracks(data.tracks);
        setCurrentAlbumTitle(data.title);
      });
  }, [selectedAlbumId]);

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-8 md:p-24 font-light">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-4">
          <div className="flex items-baseline gap-4">
            <Link
              href="/"
              className="text-zinc-500 hover:text-white transition-colors"
            >
              ← search
            </Link>
            {artistName && (
              <h1 className="text-4xl font-thin tracking-tight text-white">
                {artistName}
              </h1>
            )}
          </div>

          {albums.length > 0 && (
            <div className="flex gap-4 text-sm text-zinc-500 font-mono">
              <span>sort by:</span>
              <button
                onClick={() => setSortBy("newest")}
                className={`hover:text-white transition-colors ${sortBy === "newest" ? "text-white underline decoration-zinc-700 underline-offset-4" : ""}`}
              >
                newest
              </button>
              <button
                onClick={() => setSortBy("oldest")}
                className={`hover:text-white transition-colors ${sortBy === "oldest" ? "text-white underline decoration-zinc-700 underline-offset-4" : ""}`}
              >
                oldest
              </button>
              <button
                onClick={() => setSortBy("title")}
                className={`hover:text-white transition-colors ${sortBy === "title" ? "text-white underline decoration-zinc-700 underline-offset-4" : ""}`}
              >
                a-z
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 items-start">
          {/* Left Sidebar - Artist Info */}
          <div className="lg:sticky lg:top-8">
            {artistName && (
              <ArtistInfo
                artistId={id as string}
                artistName={artistName}
                data={artistInfoData}
                disableFetch={true}
              />
            )}
          </div>

          {/* Right Section - Discography */}
          <div className="min-w-0 space-y-16">
            {loading ? (
              <div className="text-center text-zinc-600 animate-pulse py-20">
                loading discography...
              </div>
            ) : (
              <>
                <AlbumGrid
                  albums={sortedAlbums}
                  onSelectAlbum={setSelectedAlbumId}
                  title="Albums"
                />
                <OtherReleases
                  artistId={id as string}
                  onSelectAlbum={setSelectedAlbumId}
                />
              </>
            )}
          </div>
        </div>

        {selectedAlbumId && (
          <TrackList
            tracks={tracks}
            albumTitle={currentAlbumTitle}
            artistName={artistName}
            onClose={() => setSelectedAlbumId(null)}
          />
        )}
      </div>
    </main>
  );
}
