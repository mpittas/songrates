import {
  artworkWashGradient,
  isPlaceholderArtwork,
  paletteFromImageData,
  paletteImageCandidates,
  rgbToCss,
} from "@/lib/artworkPalette";

function pixels(colors: Array<[number, number, number]>, repeats = 8) {
  const data = new Uint8ClampedArray(colors.length * repeats * 4);
  let offset = 0;
  for (const [r, g, b] of colors) {
    for (let i = 0; i < repeats; i++) {
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
      offset += 4;
    }
  }
  return data;
}

describe("isPlaceholderArtwork", () => {
  it("treats missing and vinyl placeholders as non-extractable", () => {
    expect(isPlaceholderArtwork(undefined)).toBe(true);
    expect(isPlaceholderArtwork("/vinyl-placeholder.svg")).toBe(true);
    expect(isPlaceholderArtwork("https://example.com/cover.jpg")).toBe(false);
  });
});

describe("paletteFromImageData", () => {
  it("returns null for near-white artwork", () => {
    expect(paletteFromImageData(pixels([[255, 255, 255]]))).toBeNull();
  });

  it("extracts a red-dominant cover", () => {
    const palette = paletteFromImageData(pixels([[220, 24, 24]]));
    expect(palette).not.toBeNull();
    expect(palette!.primary.r).toBeGreaterThan(palette!.primary.g);
    expect(palette!.primary.r).toBeGreaterThan(palette!.primary.b);
  });

  it("keeps a second hue from a two-color cover", () => {
    const palette = paletteFromImageData(
      pixels([
        [220, 20, 20],
        [220, 20, 20],
        [24, 48, 210],
        [24, 48, 210],
      ]),
    );
    expect(palette).not.toBeNull();
    expect(palette!.primary.r).not.toEqual(palette!.secondary.r);
  });
});

describe("artworkWashGradient", () => {
  it("builds a faded CSS mix against the page background", () => {
    const css = artworkWashGradient({
      primary: { r: 30, g: 90, b: 200 },
      secondary: { r: 80, g: 20, b: 120 },
    });
    expect(css).toContain("color-mix(in srgb,");
    expect(css).toContain(rgbToCss({ r: 30, g: 90, b: 200 }));
    expect(css).toContain("var(--background)");
    expect(css).toContain("transparent");
  });
});

describe("paletteImageCandidates", () => {
  it("skips placeholders", () => {
    expect(paletteImageCandidates("/vinyl-placeholder.svg")).toEqual([]);
  });

  it("downsamples Apple artwork and falls back to the image optimizer", () => {
    const src =
      "https://is1-ssl.mzstatic.com/image/thumb/Music/album/mza_123/600x600bb.jpg";
    const candidates = paletteImageCandidates(src);
    expect(candidates[0]).toContain("/64x64bb.jpg");
    expect(candidates[1]).toContain("/_next/image?url=");
    expect(candidates[1]).toContain("w=64");
    expect(candidates[1]).toContain("q=75");
  });
});
