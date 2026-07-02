import type { NextConfig } from "next";

/** Catalog paths that mirror Apple Music data. Setting `X-Robots-Tag: noindex`
 *  at the header level is a belt-and-suspenders complement to the per-page
 *  metadata `robots` config and `robots.txt`: even if a page renders without
 *  running generateMetadata (e.g. error fallback), the header still tells
 *  crawlers to drop it. This stops catalog enumeration from polluting the
 *  search index and attracting more scraper traffic. */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  async headers() {
    return [
      {
        source: "/((?!album|artist|apple-playlist|playlist|api).*)",
        headers: [
          // Marketing pages stay indexable.
          { key: "X-Robots-Tag", value: "index, follow" },
        ],
      },
      {
        // Catalog + API: never index.
        source: "/(album|artist|apple-playlist|playlist|api)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
