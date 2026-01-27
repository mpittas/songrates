import Link from "next/link";

interface Artist {
  id: string;
  name: string;
  country?: string;
  disambiguation?: string;
  type?: string;
  lifeSpan?: { begin?: string; end?: string };
}

export default function ArtistList({ artists }: { artists: Artist[] }) {
  if (artists.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-600">No artists found</div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {artists.map((artist) => (
        <Link
          key={artist.id}
          href={`/artist/${artist.id}`}
          className="block group p-4 hover:bg-zinc-800/80 transition-colors first:rounded-t-lg last:rounded-b-lg"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-light text-zinc-100 group-hover:text-white transition-colors truncate">
                {artist.name}
              </h3>
              {artist.disambiguation && (
                <p className="text-xs text-zinc-500 mt-1 font-normal truncate">
                  {artist.disambiguation}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-600 font-mono flex-shrink-0">
              {artist.type && (
                <span className="text-zinc-500">{artist.type}</span>
              )}
              <span>{artist.country || "—"}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
