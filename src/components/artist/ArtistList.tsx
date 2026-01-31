import Link from "next/link";
import { useEffect, useState } from "react";

interface Artist {
  id: string;
  name: string;
  country?: string;
  disambiguation?: string;
  type?: string;
  lifeSpan?: { begin?: string; end?: string };
}

export default function ArtistList({ artists }: { artists: Artist[] }) {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (artists.length === 0) return;

    const ids = artists.map((a) => a.id).join(",");
    fetch(`/api/images/artists?ids=${ids}`)
      .then((res) => res.json())
      .then((data) => {
        setImages((prev) => ({ ...prev, ...data.images }));
      })
      .catch((e) => console.error(e));
  }, [artists]);

  if (artists.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-600 font-mono text-sm">
        no artists found
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#1a1a1f]">
      {artists.map((artist) => (
        <Link
          key={artist.id}
          href={`/artist/${artist.id}`}
          className="block group p-3 hover:bg-[#0f0f12] transition-colors"
        >
          <div className="flex justify-between items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-[#0a0a0d] border border-[#1a1a1f] group-hover:border-[#00f0ff]/30">
              {images[artist.id] ? (
                <img
                  src={images[artist.id]}
                  alt={artist.name}
                  width={40}
                  height={40}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                  <span className="text-xs font-mono">
                    {artist.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate">
                {artist.name}
              </h3>
              {artist.disambiguation && (
                <p className="text-xs text-neutral-600 truncate mt-0.5">
                  {artist.disambiguation}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-600 font-mono flex-shrink-0">
              {artist.type && (
                <span className="text-neutral-500">{artist.type}</span>
              )}
              <span>{artist.country || "—"}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
