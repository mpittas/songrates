"use client";

interface ArtistInfoProps {
  artistId: string;
  artistName: string;
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

import { useEffect, useState } from "react";

export default function ArtistInfo({ artistId, artistName }: ArtistInfoProps) {
  const [info, setInfo] = useState<ArtistInfoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId) return;

    fetch(`/api/artist-info?id=${artistId}`)
      .then((res) => res.json())
      .then((data) => {
        setInfo(data.artistInfo);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [artistId]);

  if (loading) {
    return (
      <div className="mb-8 animate-pulse">
        <div className="flex gap-6">
          <div className="w-32 h-32 bg-zinc-800 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-800 w-3/4" />
            <div className="h-4 bg-zinc-800 w-1/2" />
          </div>
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
    <div className="mb-10 border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Artist Image */}
        <div className="w-32 h-32 flex-shrink-0 bg-zinc-800 border border-zinc-700 overflow-hidden">
          {info.image ? (
            <img
              src={info.image}
              alt={artistName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <span className="text-2xl font-mono">
                {artistName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          {/* Description */}
          {info.description && (
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              {info.description}
            </p>
          )}

          {/* Links */}
          {hasLinks && (
            <div className="flex flex-wrap gap-3">
              {info.wikipedia && (
                <a
                  href={info.wikipedia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1 border border-zinc-800 px-2 py-1 hover:border-zinc-600"
                >
                  <WikiIcon />
                  wikipedia
                </a>
              )}
              {info.officialSite && (
                <a
                  href={info.officialSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1 border border-zinc-800 px-2 py-1 hover:border-zinc-600"
                >
                  <GlobeIcon />
                  official
                </a>
              )}
              {info.spotify && (
                <a
                  href={info.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1 border border-zinc-800 px-2 py-1 hover:border-zinc-600"
                >
                  <SpotifyIcon />
                  spotify
                </a>
              )}
              {info.twitter && (
                <a
                  href={info.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1 border border-zinc-800 px-2 py-1 hover:border-zinc-600"
                >
                  <TwitterIcon />
                  twitter
                </a>
              )}
              {info.instagram && (
                <a
                  href={info.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1 border border-zinc-800 px-2 py-1 hover:border-zinc-600"
                >
                  <InstagramIcon />
                  instagram
                </a>
              )}
              {info.facebook && (
                <a
                  href={info.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1 border border-zinc-800 px-2 py-1 hover:border-zinc-600"
                >
                  <FacebookIcon />
                  facebook
                </a>
              )}
              {info.youtube && (
                <a
                  href={info.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1 border border-zinc-800 px-2 py-1 hover:border-zinc-600"
                >
                  <YoutubeIcon />
                  youtube
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple SVG Icons
function WikiIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .119-.075.176-.225.176l-.564.031c-.485.029-.727.164-.727.436 0 .135.053.33.166.601 1.082 2.646 4.818 10.521 4.818 10.521l.136.046 2.411-4.81-.482-1.067-1.658-3.264s-.318-.654-.428-.872c-.728-1.443-.712-1.518-1.447-1.617-.207-.023-.313-.05-.313-.149v-.468l.06-.045h4.292l.113.037v.451c0 .105-.076.15-.227.15l-.308.047c-.792.061-.661.381-.136 1.422l1.582 3.252 1.758-3.504c.293-.64.233-.801-.3-.852l-.317-.04c-.151 0-.227-.042-.227-.127v-.478l.051-.045s2.27-.004 3.106-.004l.061.045v.463c0 .1-.081.143-.241.143-.495.06-.817.164-1.033.423-.201.237-.533.681-.878 1.36l-2.156 4.161.462.883 2.987 5.837c.352.726.85.807 1.511.819.215.004.324.049.324.155v.461l-.06.045h-4.82l-.061-.045v-.452c0-.108.076-.162.227-.162l.313-.042c.65-.059.744-.182.389-.889l-2.35-4.672z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      className="w-3 h-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
