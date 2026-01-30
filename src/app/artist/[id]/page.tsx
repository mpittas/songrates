"use client";

import { useEffect, useState } from "react";
import AlbumGrid from "@/components/AlbumGrid";
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
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [artistInfoData, setArtistInfoData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        const nameRes = await fetch(`/api/musicbrainz/artist?id=${id}`);
        const nameData = await nameRes.json();

        if (nameData.artist) {
          setArtistName(nameData.artist.name);
          addToHistory(id as string, nameData.artist.name);
        }

        const infoRes = await fetch(`/api/artist-info?id=${id}`);
        const infoData = await infoRes.json();

        if (infoData.artistInfo) {
          setArtistInfoData(infoData.artistInfo);
        }

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

  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100 p-6 md:px-16 md:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-4">
          <div className="flex items-baseline gap-6">
            <Link
              href="/"
              className="text-neutral-600 hover:text-[#00f0ff] transition-colors font-mono text-sm"
            >
              ← back
            </Link>
            {artistName && (
              <h1 className="text-3xl md:text-4xl font-light tracking-tight text-neutral-200">
                {artistName}
              </h1>
            )}
          </div>

          {albums.length > 0 && (
            <div className="flex gap-4 text-xs text-neutral-600 font-mono">
              <span>sort:</span>
              <button
                onClick={() => setSortBy("newest")}
                className={`hover:text-[#00f0ff] transition-colors ${
                  sortBy === "newest" ? "text-[#00f0ff]" : ""
                }`}
              >
                new
              </button>
              <button
                onClick={() => setSortBy("oldest")}
                className={`hover:text-[#00f0ff] transition-colors ${
                  sortBy === "oldest" ? "text-[#00f0ff]" : ""
                }`}
              >
                old
              </button>
              <button
                onClick={() => setSortBy("title")}
                className={`hover:text-[#00f0ff] transition-colors ${
                  sortBy === "title" ? "text-[#00f0ff]" : ""
                }`}
              >
                a-z
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-12 items-start">
          {/* Sidebar */}
          <div className="lg:sticky lg:top-20">
            {artistName && (
              <ArtistInfo
                artistId={id as string}
                artistName={artistName}
                data={artistInfoData}
                disableFetch={true}
              />
            )}
          </div>

          {/* Discography */}
          <div className="min-w-0 space-y-16">
            {loading ? (
              <div className="text-center text-neutral-600 font-mono text-sm py-20 animate-pulse">
                loading_discography...
              </div>
            ) : (
              <>
                <AlbumGrid
                  albums={sortedAlbums}
                  onSelectAlbum={() => {}}
                  title="Albums"
                />
                <OtherReleases
                  artistId={id as string}
                  onSelectAlbum={() => {}}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
