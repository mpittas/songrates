import {
  getTrendingSongs,
  artworkUrl,
  TOP_100_PLAYLIST_IDS,
} from "@/lib/appleMusic/api";
import SongRow from "@/main-components/SongRow";
import MySection from "@/components/ui/MySection";
import SectionHeader from "@/components/ui/SectionHeader";
import TrackList from "@/components/ui/TrackList";
import { formatTime } from "@/lib/utils";

export default async function TrendingSongs() {
  const songs = await getTrendingSongs(10);

  if (!songs || songs.length === 0) return null;

  return (
    <MySection className="pt-12 pb-10 sm:pt-16 sm:pb-14">
      <SectionHeader
        eyebrow="Global top 100"
        title="Trending songs"
        description="The most played tracks right now. Tap a cover to listen, then rate it."
        href={`/apple-playlist/${TOP_100_PLAYLIST_IDS[0]}`}
        linkLabel="Full chart"
      />

      <TrackList columns={2}>
        {songs.map((song, i) => (
          <SongRow
            key={song.id}
            index={i + 1}
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
  );
}
