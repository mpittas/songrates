"use client";

import { useEffect, useState } from "react";

import {
  isPlaceholderArtwork,
  paletteFromImageData,
  paletteImageCandidates,
  type ArtworkPalette,
} from "@/lib/artworkPalette";

const cache = new Map<string, ArtworkPalette | "failed">();

function loadImage(src: string, cors: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("artwork palette image failed"));
    img.src = src;
  });
}

function readPalette(img: HTMLImageElement): ArtworkPalette | null {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  return paletteFromImageData(data);
}

async function extractPalette(src: string): Promise<ArtworkPalette | null> {
  const cached = cache.get(src);
  if (cached === "failed") return null;
  if (cached) return cached;

  const candidates = paletteImageCandidates(src);
  for (const candidate of candidates) {
    const cors = !candidate.startsWith("/_next/image") && !candidate.startsWith("/");
    try {
      const img = await loadImage(candidate, cors);
      const palette = readPalette(img);
      if (palette) {
        cache.set(src, palette);
        return palette;
      }
    } catch {
      // Try the next candidate (optimizer vs raw CDN, CORS, etc.).
    }
  }

  cache.set(src, "failed");
  return null;
}

export function useArtworkPalette(src: string | undefined): ArtworkPalette | null {
  const [palette, setPalette] = useState<ArtworkPalette | null>(() => {
    if (!src || isPlaceholderArtwork(src)) return null;
    const cached = cache.get(src);
    return cached && cached !== "failed" ? cached : null;
  });

  useEffect(() => {
    if (!src || isPlaceholderArtwork(src)) {
      setPalette(null);
      return;
    }

    const cached = cache.get(src);
    if (cached && cached !== "failed") {
      setPalette(cached);
      return;
    }
    if (cached === "failed") {
      setPalette(null);
      return;
    }

    setPalette(null);
    let cancelled = false;

    extractPalette(src).then((next) => {
      if (!cancelled) setPalette(next);
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return palette;
}
