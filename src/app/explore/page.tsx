import { LuCompass } from "react-icons/lu";

import AlbumCard from "@/components/album/AlbumCard";
import ExploreGenreRow from "@/components/explore/ExploreGenreRow";
import FeaturedPlaylistCard from "@/components/explore/FeaturedPlaylistCard";
import Button from "@/components/ui/Button";
import CardRail from "@/components/ui/CardRail";
import EmptyState from "@/components/ui/EmptyState";
import MySection from "@/components/ui/MySection";
import PageHeader from "@/components/ui/PageHeader";
import SectionHeader from "@/components/ui/SectionHeader";
import TrackList from "@/components/ui/TrackList";
import PlaylistCard from "@/main-components/PlaylistCard";
import SongRow from "@/main-components/SongRow";
import { artworkUrl, getExploreData } from "@/lib/appleMusic/api";
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

const SECTION = "py-8 sm:py-10";

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
    artworkUrl: artworkUrl(album.artworkUrl, 300),
    releaseDate: album.releaseDate,
  };
}

export default async function ExplorePage() {
  const explore = await getExploreData();
  const featuredPlaylists = explore.editorialPlaylists.slice(0, 2);
  const morePlaylists = explore.editorialPlaylists.slice(2, 8);
  const topSongs = explore.topSongs.slice(0, 8);
  const hasExploreData =
    explore.topAlbums.length > 0 ||
    explore.chartPlaylists.length > 0 ||
    explore.editorialPlaylists.length > 0 ||
    explore.genreSections.length > 0 ||
    topSongs.length > 0;

  return (
    <main className="min-h-screen pb-6 text-ink">
      <PageHeader
        eyebrow="Browse"
        title="Explore"
        description="Charts, fresh playlists and the albums everyone has on rotation right now."
        actions={
          <>
            <Button href="/moods" variant="border" size="sm">
              Moods
            </Button>
            <Button href="/genres" variant="border" size="sm">
              Genres
            </Button>
          </>
        }
      />

      {!hasExploreData ? (
        <MySection className="pb-16">
          <EmptyState
            icon={<LuCompass size={22} />}
            title="Explore is warming up"
            description="Apple Music catalog data is not available right now. Try search while the charts refresh."
            action={
              <Button href="/" variant="primary" size="md">
                Search music
              </Button>
            }
          />
        </MySection>
      ) : (
        <>
          {featuredPlaylists.length > 0 && (
            <MySection className="pb-8 sm:pb-10">
              <CardRail columns={2} itemWidth="wide">
                {featuredPlaylists.map((playlist, index) => (
                  <FeaturedPlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    priority={index === 0}
                  />
                ))}
              </CardRail>
            </MySection>
          )}

          {morePlaylists.length > 0 && (
            <MySection className={SECTION}>
              <SectionHeader
                title="Fresh playlists"
                description="New and updated editorial playlists."
                href="/genres"
                linkLabel="All genres"
              />
              <CardRail columns={6}>
                {morePlaylists.map((playlist, index) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    index={index}
                  />
                ))}
              </CardRail>
            </MySection>
          )}

          {explore.topAlbums.length > 0 && (
            <MySection className={SECTION}>
              <SectionHeader
                title="Albums people are playing"
                description="The most played albums on Apple Music today."
              />
              <CardRail columns={6}>
                {explore.topAlbums.slice(0, 12).map((album, index) => (
                  <AlbumCard
                    key={album.id}
                    album={albumToCard(album)}
                    isPriority={index < 4}
                    showRating={false}
                    showOptionsMenu={false}
                  />
                ))}
              </CardRail>
            </MySection>
          )}

          {topSongs.length > 0 && (
            <MySection className={SECTION}>
              <SectionHeader
                title="Trending songs"
                description="Tap a cover to listen, then rate it."
              />
              <TrackList columns={2}>
                {topSongs.map((song, index) => (
                  <SongRow
                    key={song.id}
                    index={index + 1}
                    title={song.name}
                    artist={song.artistName}
                    album={song.albumName || "Unknown Album"}
                    duration={formatTime(song.durationMs, "milliseconds")}
                    artworkUrl={artworkUrl(song.artworkUrl, 120)}
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
                            artworkUrl: artworkUrl(song.artworkUrl, 300),
                            releaseDate: song.releaseDate,
                          }
                        : undefined
                    }
                  />
                ))}
              </TrackList>
            </MySection>
          )}

          {explore.chartPlaylists.length > 0 && (
            <MySection className={SECTION}>
              <SectionHeader
                title="Charts"
                description="Daily top 100s, updated every morning."
              />
              <CardRail columns={6}>
                {explore.chartPlaylists.map((playlist, index) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    index={index}
                    subtitle="Daily chart"
                  />
                ))}
              </CardRail>
            </MySection>
          )}

          {explore.genreSections.length > 0 && (
            <MySection className={SECTION}>
              <SectionHeader
                title="By genre"
                description="Top albums across the biggest genres."
                href="/genres"
                linkLabel="All genres"
              />
              <div className="flex flex-col gap-10 sm:gap-12">
                {explore.genreSections.map((section) => (
                  <ExploreGenreRow key={section.genre.id} section={section} />
                ))}
              </div>
            </MySection>
          )}
        </>
      )}
    </main>
  );
}
