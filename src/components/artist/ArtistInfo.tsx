import { ArtistInfo as ArtistInfoType } from "@/types/music";
import {
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaWikipediaW,
  FaSpotify,
  FaGlobe,
} from "react-icons/fa";

interface Props {
  artistId: string;
  artistName: string;
  data: ArtistInfoType;
  disableFetch?: boolean;
}

export default function ArtistInfo({
  artistId,
  artistName,
  data,
  disableFetch,
}: Props) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      {/* Artist Image & Name */}
      <div className="space-y-4">
        <div className="relative w-full aspect-square max-w-[140px] mx-auto lg:mx-0">
          {data.image ? (
            <img
              src={data.image}
              alt={artistName}
              className="w-full h-full object-cover rounded-full lg:rounded-none lg:grayscale hover:grayscale-0 transition-all duration-500 border border-white/10"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5 border border-white/10 rounded-full lg:rounded-none">
              <span className="text-2xl font-mono text-white/20">
                {artistName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="text-center lg:text-left">
          <h1 className="text-lg text-white tracking-tight leading-tight">
            {artistName}
          </h1>
          {data.country && (
            <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider">
              {data.country}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div className="text-neutral-400 text-xs line-clamp-6 hover:line-clamp-none transition-all duration-300">
          {data.description}
        </div>
      )}

      {/* Genres */}
      {data.genres && data.genres.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
          {data.genres.slice(0, 5).map((genre) => (
            <span
              key={genre}
              className="px-2 py-1 bg-white/5 border border-white/5 text-[10px] text-neutral-400 hover:text-white hover:border-white/20 transition-colors uppercase tracking-wider"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Social Links */}
      <div className="flex flex-wrap gap-4 text-neutral-500 justify-center lg:justify-start pt-4 mt-2 border-t border-white/5">
        {data.spotify && (
          <a
            href={data.spotify}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#1DB954] transition-colors"
            title="Spotify"
          >
            <FaSpotify size={16} />
          </a>
        )}
        {data.youtube && (
          <a
            href={data.youtube}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#FF0000] transition-colors"
            title="YouTube"
          >
            <FaYoutube size={16} />
          </a>
        )}
        {data.instagram && (
          <a
            href={data.instagram}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#E4405F] transition-colors"
            title="Instagram"
          >
            <FaInstagram size={16} />
          </a>
        )}
        {data.twitter && (
          <a
            href={data.twitter}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#1DA1F2] transition-colors"
            title="Twitter"
          >
            <FaTwitter size={16} />
          </a>
        )}
        {data.facebook && (
          <a
            href={data.facebook}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#1877F2] transition-colors"
            title="Facebook"
          >
            <FaFacebook size={16} />
          </a>
        )}
        {data.wikipedia && (
          <a
            href={data.wikipedia}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
            title="Wikipedia"
          >
            <FaWikipediaW size={16} />
          </a>
        )}
        {data.officialSite && (
          <a
            href={data.officialSite}
            target="_blank"
            rel="noreferrer"
            className="hover:text-cyan-400 transition-colors"
            title="Official Site"
          >
            <FaGlobe size={16} />
          </a>
        )}
      </div>

      {/* Dates */}
      {(data.beginDate || data.endDate) && (
        <div className="text-[10px] text-neutral-600 font-mono pt-2 border-t border-white/5 text-center lg:text-left">
          {data.beginDate && <span>Est. {data.beginDate.split("-")[0]}</span>}
          {data.endDate && <span> - {data.endDate.split("-")[0]}</span>}
        </div>
      )}
    </div>
  );
}
