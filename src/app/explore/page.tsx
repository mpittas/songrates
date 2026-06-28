import Link from "next/link";
import { FaArrowTrendUp, FaMusic } from "react-icons/fa6";
import AlbumCard from "@/components/album/AlbumCard";
import ExploreHero from "@/components/explore/ExploreHero";
import MySection from "@/components/ui/MySection";
import HeadingRow from "@/main-components/HeadingRow";
import PlaylistCard from "@/main-components/PlaylistCard";
import SongRow from "@/main-components/SongRow";
import {
  AppleExploreGenreSection,
  artworkUrl,
  getExploreData,
} from "@/lib/appleMusic/api";
import { formatTime } from "@/lib/utils";
import { Album } from "@/types/music";

/** ISR: regenerate explore page at most once every 6 hours.
 *  Chart/playlist data is slow-moving, and getExploreData makes ~8 parallel
 *  Apple Music API calls per regeneration, so a longer window keeps Vercel
 *  compute + bandwidth costs down. */
export const revalidate = 21600;

export const metadata = {
  title: "Explore | songrates",
  description: "Discover new music with Apple Music charts and playlists.",
};

function albumToCard(album: {
  id: string;
  name: string;
  artistName: string;
  artworkUrl?: string;
  releaseDate?: string;
}): Album {
  return {
    id: album.id,
    title: album.name,
    artistName: album.artistName,
    artworkUrl: artworkUrl(album.artworkUrl, 500),
    releaseDate: album.releaseDate,
  };
}

function EmptyExploreState() {
  return (
    <MySection className="py-16">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <FaMusic className="mx-auto text-neutral-400" size={28} />
        <h2 className="mt-4 text-xl font-semibold text-neutral-900">
          Explore is warming up
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-500">
          Apple Music catalog data is not available right now. Try search while
          the charts refresh.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
        >
          Search music
        </Link>
      </div>
    </MySection>
  );
}

function GenreSection({ section }: { section: AppleExploreGenreSection }) {
  const albums = section.albums.slice(0, 4);
  const songs = section.songs.slice(0, 4);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Genre chart
          </p>
          <h3 className="text-xl font-semibold text-neutral-900">
            {section.genre.name}
          </h3>
        </div>
        <FaArrowTrendUp className="shrink-0 text-neutral-300" size={22} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {albums.map((album, index) => (
            <AlbumCard
              key={album.id}
              album={albumToCard(album)}
              isPriority={index === 0}
              size="compact"
              showRating={false}
              showOptionsMenu={false}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {songs.map((song, index) => (
            <SongRow
              key={song.id}
              index={index + 1}
              title={song.name}
              artist={song.artistName}
              album={song.albumName || "Unknown Album"}
              duration={formatTime(song.durationMs, "milliseconds")}
              artworkUrl={artworkUrl(song.artworkUrl, 80)}
              showAlbumInSubline={false}
              track={{
                id: song.id,
                title: song.name,
                artistName: song.artistName,
                artistId: song.artistId,
                artists: song.artists,
                albumId: song.albumId,
                albumTitle: song.albumName,
                albumImageUrl: artworkUrl(song.artworkUrl, 300),
                length: song.durationMs,
              }}
              albumContext={
                song.albumId
                  ? {
                      albumId: song.albumId,
                      title: song.albumName || "Unknown Album",
                      artistName: song.artistName,
                      totalTracks: 1,
                      artworkUrl: artworkUrl(song.artworkUrl, 300),
                      releaseDate: song.releaseDate,
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ExplorePage() {
  const explore = await getExploreData();
  const hasExploreData =
    explore.topSongs.length > 0 ||
    explore.topAlbums.length > 0 ||
    explore.chartPlaylists.length > 0 ||
    explore.editorialPlaylists.length > 0 ||
    explore.genreSections.length > 0;

  return (
    <main className="min-h-screen bg-[#F2EFED] pb-16 text-neutral-900">
      <ExploreHero />

      {!hasExploreData ? (
        <EmptyExploreState />
      ) : (
        <>
          {explore.topSongs.length > 0 && (
            <MySection className="py-8">
              <HeadingRow title="Top Songs" badgeText="Apple Music charts" />
              <div className="flex flex-col gap-2">
                {explore.topSongs.slice(0, 10).map((song, index) => (
                  <SongRow
                    key={song.id}
                    index={index + 1}
                    title={song.name}
                    artist={song.artistName}
                    album={song.albumName || "Unknown Album"}
                    duration={formatTime(song.durationMs, "milliseconds")}
                    artworkUrl={artworkUrl(song.artworkUrl, 80)}
                    track={{
                      id: song.id,
                      title: song.name,
                      artistName: song.artistName,
                      artistId: song.artistId,
                      artists: song.artists,
                      albumId: song.albumId,
                      albumTitle: song.albumName,
                      albumImageUrl: artworkUrl(song.artworkUrl, 300),
                      length: song.durationMs,
                    }}
                    albumContext={
                      song.albumId
                        ? {
                            albumId: song.albumId,
                            title: song.albumName || "Unknown Album",
                            artistName: song.artistName,
                            totalTracks: 1,
                            artworkUrl: artworkUrl(song.artworkUrl, 300),
                            releaseDate: song.releaseDate,
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            </MySection>
          )}

          {explore.editorialPlaylists.length > 0 && (
            <MySection className="py-8">
              <HeadingRow
                title="Fresh Playlists"
                badgeText="Editorial search"
                seeAllHref="/playlists"
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {explore.editorialPlaylists.slice(0, 8).map((playlist, index) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    index={index}
                  />
                ))}
              </div>
            </MySection>
          )}

          {explore.topAlbums.length > 0 && (
            <MySection className="py-8">
              <HeadingRow title="Albums People Are Playing" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {explore.topAlbums.slice(0, 12).map((album, index) => (
                  <AlbumCard
                    key={album.id}
                    album={albumToCard(album)}
                    isPriority={index < 4}
                    showRating={false}
                    showOptionsMenu={false}
                  />
                ))}
              </div>
            </MySection>
          )}

          {explore.chartPlaylists.length > 0 && (
            <MySection className="py-8">
              <HeadingRow title="Global And City Charts" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {explore.chartPlaylists.map((playlist, index) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    index={index}
                  />
                ))}
              </div>
            </MySection>
          )}

          {explore.genreSections.length > 0 && (
            <MySection className="py-8">
              <HeadingRow title="Explore By Genre" />
              <div className="grid gap-5">
                {explore.genreSections.map((section) => (
                  <GenreSection key={section.genre.id} section={section} />
                ))}
              </div>
            </MySection>
          )}
        </>
      )}
    </main>
  );
}
