export type Rgb = { r: number; g: number; b: number };

export type ArtworkPalette = {
  primary: Rgb;
  secondary: Rgb;
};

const HUE_BUCKETS = 12;

export function isPlaceholderArtwork(src: string | undefined | null): boolean {
  if (!src) return true;
  return src.includes("vinyl-placeholder") || /\.svg(?:$|\?)/i.test(src);
}

function downsampleArtworkUrl(src: string, size: number): string {
  if (src.includes("{w}") || src.includes("{h}")) {
    return src.replaceAll("{w}", String(size)).replaceAll("{h}", String(size));
  }
  return src.replace(
    /\/(\d+)x(\d+)(bb|sr|cc)(-\d+)?(?=\.[a-z]|$)/i,
    `/${size}x${size}$3$4`,
  );
}

export function rgbToCss(rgb: Rgb): string {
  return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
}

function mixRgb(from: Rgb, to: Rgb, amountFrom: number): Rgb {
  const t = Math.min(1, Math.max(0, amountFrom));
  return {
    r: Math.round(from.r * t + to.r * (1 - t)),
    g: Math.round(from.g * t + to.g * (1 - t)),
    b: Math.round(from.b * t + to.b * (1 - t)),
  };
}

function rgbToHsl(r: number, g: number, b: number): {
  h: number;
  s: number;
  l: number;
} {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h, s, l };
}

/**
 * Pick 1–2 wash colors from downsampled artwork pixels.
 * Ignores near-black, near-white, and transparent samples so the result
 * tracks the cover's actual hues instead of borders or letterboxing.
 */
export function paletteFromImageData(
  data: Uint8ClampedArray,
): ArtworkPalette | null {
  const buckets = Array.from({ length: HUE_BUCKETS }, () => ({
    r: 0,
    g: 0,
    b: 0,
    weight: 0,
  }));
  let grayR = 0;
  let grayG = 0;
  let grayB = 0;
  let grayW = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const { h, s, l } = rgbToHsl(r, g, b);
    if (l < 0.08 || l > 0.92) continue;

    const mid = 1 - Math.abs(l - 0.5) * 2;
    const weight = (0.35 + s) * (0.4 + mid);

    if (s < 0.12) {
      grayR += r * weight;
      grayG += g * weight;
      grayB += b * weight;
      grayW += weight;
      continue;
    }

    const bucket = Math.min(HUE_BUCKETS - 1, Math.floor(h * HUE_BUCKETS));
    buckets[bucket].r += r * weight;
    buckets[bucket].g += g * weight;
    buckets[bucket].b += b * weight;
    buckets[bucket].weight += weight;
  }

  const ranked = buckets
    .map((bucket, index) => ({ index, ...bucket }))
    .filter((bucket) => bucket.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  if (ranked.length === 0 && grayW === 0) return null;

  const toRgb = (r: number, g: number, b: number, weight: number): Rgb => ({
    r: Math.round(r / weight),
    g: Math.round(g / weight),
    b: Math.round(b / weight),
  });

  const primary = ranked[0]
    ? toRgb(ranked[0].r, ranked[0].g, ranked[0].b, ranked[0].weight)
    : toRgb(grayR, grayG, grayB, grayW);

  let secondary: Rgb | undefined;
  if (ranked[0]) {
    for (const bucket of ranked.slice(1)) {
      const dist = Math.min(
        Math.abs(bucket.index - ranked[0].index),
        HUE_BUCKETS - Math.abs(bucket.index - ranked[0].index),
      );
      if (dist >= 2) {
        secondary = toRgb(bucket.r, bucket.g, bucket.b, bucket.weight);
        break;
      }
    }
  }

  if (!secondary) {
    secondary = mixRgb(primary, { r: 255, g: 255, b: 255 }, 0.72);
  }

  return { primary, secondary };
}

/** CSS gradient: extracted hues mixed heavily into the page background. */
export function artworkWashGradient(palette: ArtworkPalette): string {
  const top = rgbToCss(palette.primary);
  const mid = rgbToCss(palette.secondary);
  return [
    `radial-gradient(ellipse 80% 70% at 18% 28%, color-mix(in srgb, ${top} 22%, transparent), transparent 72%)`,
    `linear-gradient(to bottom, color-mix(in srgb, ${top} 28%, var(--background)) 0%, color-mix(in srgb, ${mid} 16%, var(--background)) 46%, transparent 100%)`,
  ].join(", ");
}

/**
 * Candidate URLs to sample. Prefer a tiny CDN image (Apple artwork allows
 * CORS). Fall back to the same-origin image optimizer if canvas would taint.
 */
export function paletteImageCandidates(src: string): string[] {
  if (isPlaceholderArtwork(src)) return [];

  const sized = downsampleArtworkUrl(src, 64);

  if (sized.startsWith("/") && !sized.startsWith("//")) {
    return [sized];
  }

  const proxied = `/_next/image?url=${encodeURIComponent(sized)}&w=64&q=75`;
  return [sized, proxied];
}
