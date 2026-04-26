import { getPlaylistDetail, artworkUrl } from "@/lib/appleMusic/api";
import Link from "next/link";
import { FaArrowLeft, FaListUl, FaPlay, FaMusic } from "react-icons/fa";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { createSlug, formatTime } from "@/lib/utils";
import MySection from "@/components/ui/MySection";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplePlaylistPage({ params }: PageProps) {
  const { id } = await params;

  const playlist = await getPlaylistDetail(id);

  if (!playlist) {
    return (
      <main className="min-h-screen">
        <MySection className="pt-20">
          <div className="w-full max-w-4xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors text-sm font-mono mb-8"
            >
              <FaArrowLeft size={12} />
              Back to Home
            </Link>
            <div className="py-16 text-center">
              <FaListUl size={32} className="text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500 font-mono text-sm">
                Playlist not found
              </p>
            </div>
          </div>
        </MySection>
      </main>
    );
  }

  const imageUrl = artworkUrl(playlist.artworkUrl, 400);

  return (
    <main className="min-h-screen">
      <MySection className="pt-20 pb-20">
        <div className="w-full max-w-4xl">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors text-sm font-mono mb-8"
          >
            <FaArrowLeft size={12} />
            Back to Home
          </Link>

          {/* Playlist Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
            <div className="relative w-48 h-48 md:w-56 md:h-56 shrink-0 bg-white shadow-xl rounded-md overflow-hidden border border-[#e1e1e1]">
              <OptimizedImage
                src={imageUrl}
                alt={playlist.name}
                fill
                className="object-cover"
                fallbackSrc="/vinyl-placeholder.svg"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col items-center md:items-start text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-light tracking-tight text-neutral-900 mb-2">
                {playlist.name}
              </h1>
              <p className="text-base text-neutral-600 mb-4 font-medium">
                Apple Music • {playlist.curatorName}
              </p>
              {playlist.description && (
                <p className="text-sm text-neutral-500 mb-6 max-w-2xl leading-relaxed">
                  {playlist.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-neutral-600 font-mono uppercase tracking-widest mt-auto">
                <span>{playlist.trackCount} Tracks</span>
              </div>
            </div>
          </div>

          {/* Tracks List (Styled like Top Songs) */}
          <div className="mt-8 border-t border-[#dcdcdc] pt-8">
            <h2 className="text-xs text-neutral-500 font-mono uppercase tracking-widest mb-6 px-1">
              Playlist Tracks
            </h2>

            <div className="divide-y divide-[#e8e8e8]">
              {playlist.tracks.map((song, i) => {
                // Create the album slug using the song's album name and album ID
                // (Note: Apple playlists include albumName, but not albumId natively. See note below)
                // If there's an albumId use it, otherwise fallback. A proper search matches the best.
                const albumSlug = song.albumName
                  ? createSlug(
                      song.albumName,
                      (song as any).albumId || "search",
                    )
                  : null;

                // Only create link if we have album name text
                const trackLink = albumSlug
                  ? `/album/${albumSlug}?track=${song.id}`
                  : null;

                return (
                  <div
                    key={song.id + i}
                    className="flex items-center gap-4 py-3 px-2 group hover:bg-[#f7f7f7] transition-colors rounded-sm"
                  >
                    {/* Number */}
                    <span className="w-6 text-right text-xs font-mono text-neutral-600 shrink-0">
                      {i + 1}
                    </span>

                    {/* Artwork */}
                    {song.artworkUrl ? (
                      <div className="relative w-12 h-12 shrink-0 bg-[#efefef] rounded-sm overflow-hidden">
                        <OptimizedImage
                          src={artworkUrl(song.artworkUrl, 100)}
                          alt={song.name}
                          fill
                          className="object-cover"
                          fallbackSrc="/vinyl-placeholder.svg"
                        />

                        {/* Play overlay for track hover */}
                        {trackLink && (
                          <Link
                            href={trackLink}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <FaPlay className="text-white w-3 h-3 ml-0.5" />
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 shrink-0 bg-[#efefef] rounded-sm flex items-center justify-center">
                        <FaMusic className="text-neutral-600 w-4 h-4" />
                      </div>
                    )}

                    {/* Title + Subtext */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {trackLink ? (
                        <Link
                          href={trackLink}
                          className="text-sm font-medium text-neutral-900 truncate group-hover:text-black transition-colors inline-block"
                        >
                          {song.name}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-black transition-colors">
                          {song.name}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 truncate mt-0.5">
                        <span className="truncate">{song.artistName}</span>
                        {song.albumName && (
                          <>
                            <span className="text-neutral-700">•</span>
                            <span className="truncate text-neutral-600 group-hover:text-neutral-800 transition-colors">
                              {song.albumName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Duration */}
                    {(song.durationMs ?? 0) > 0 && (
                      <span className="text-xs font-mono text-neutral-600 shrink-0 pl-4 hidden sm:block">
                        {formatTime(song.durationMs ?? 0, "milliseconds")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </MySection>
    </main>
  );
}
