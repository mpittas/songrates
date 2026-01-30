"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaSpotify,
  FaTwitter,
  FaWikipediaW,
  FaYoutube,
} from "react-icons/fa";

interface ArtistInfoProps {
  artistId: string;
  artistName: string;
  data?: ArtistInfoData | null;
  disableFetch?: boolean;
}

interface ArtistInfoData {
  image: string | null;
  description: string | null;
  wikipedia: string | null;
  twitter: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  spotify: string | null;
  officialSite: string | null;
}

export default function ArtistInfo({
  artistId,
  artistName,
  data,
  disableFetch = false,
}: ArtistInfoProps) {
  const [info, setInfo] = useState<ArtistInfoData | null>(data || null);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (data) {
      setInfo(data);
      setLoading(false);
      return;
    }

    if (disableFetch) return;

    if (!artistId) return;

    fetch(`/api/artist-info?id=${artistId}`)
      .then((res) => res.json())
      .then((data) => {
        setInfo(data.artistInfo);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [artistId, data, disableFetch]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="w-full aspect-square bg-[#0a0a0d] mb-4" />
        <div className="space-y-2">
          <div className="h-3 bg-[#0a0a0d] w-3/4" />
          <div className="h-3 bg-[#0a0a0d] w-1/2" />
        </div>
      </div>
    );
  }

  if (!info) return null;

  const hasLinks =
    info.wikipedia ||
    info.officialSite ||
    info.spotify ||
    info.twitter ||
    info.instagram ||
    info.facebook ||
    info.youtube;

  return (
    <div className="space-y-4">
      {/* Artist Image */}
      <div className="w-full aspect-square bg-[#0a0a0d] border border-[#1a1a1f] overflow-hidden relative">
        {info.image ? (
          <Image
            src={info.image}
            alt={artistName}
            fill
            className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
            sizes="(max-width: 768px) 100vw, 200px"
            loading="lazy"
            quality={60}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-700">
            <span className="text-3xl font-mono">
              {artistName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      {info.description && (
        <p className="text-xs text-neutral-500 leading-relaxed line-clamp-4">
          {info.description}
        </p>
      )}

      {/* Links */}
      {hasLinks && (
        <div className="space-y-1">
          {info.wikipedia && (
            <LinkItem
              href={info.wikipedia}
              icon={<FaWikipediaW className="w-3 h-3" />}
              label="wiki"
            />
          )}
          {info.officialSite && (
            <LinkItem
              href={info.officialSite}
              icon={<FaGlobe className="w-3 h-3" />}
              label="official"
            />
          )}
          {info.spotify && (
            <LinkItem
              href={info.spotify}
              icon={<FaSpotify className="w-3 h-3" />}
              label="spotify"
            />
          )}
          {info.twitter && (
            <LinkItem
              href={info.twitter}
              icon={<FaTwitter className="w-3 h-3" />}
              label="twitter"
            />
          )}
          {info.instagram && (
            <LinkItem
              href={info.instagram}
              icon={<FaInstagram className="w-3 h-3" />}
              label="instagram"
            />
          )}
          {info.facebook && (
            <LinkItem
              href={info.facebook}
              icon={<FaFacebook className="w-3 h-3" />}
              label="facebook"
            />
          )}
          {info.youtube && (
            <LinkItem
              href={info.youtube}
              icon={<FaYoutube className="w-3 h-3" />}
              label="youtube"
            />
          )}
        </div>
      )}
    </div>
  );
}

function LinkItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 py-1.5 text-xs text-neutral-600 hover:text-[#00f0ff] transition-colors font-mono"
    >
      {icon}
      {label}
    </a>
  );
}
