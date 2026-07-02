import type { MetadataRoute } from "next";

/**
 * robots.txt — tell well-behaved crawlers (Google, Bing, AI bots) what to avoid.
 *
 * Catalog pages (/album/*, /artist/*) are the main driver of bot-driven Vercel
 * charges: bots enumerate millions of Apple Music IDs and each one SSRs a fresh
 * page. Disallowing them keeps the home/explore/moods/marketing pages indexable
 * while preventing catalog enumeration from inflating function invocations.
 *
 * See https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Well-behaved search engines: allow marketing pages, block catalog/API/auth/profile.
        userAgent: ["*", "googlebot", "bingbot"],
        allow: ["/", "/explore", "/moods", "/playlists"],
        disallow: [
          "/album",
          "/artist",
          "/apple-playlist",
          "/playlist",
          "/api",
          "/login",
          "/auth",
          "/profile",
          "/user",
          "/settings",
          "/complete-profile",
          "/favourite-artists",
        ],
      },
      {
        // Explicitly block known AI training crawlers. They tend to ignore `*` rules.
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "Claude-Web",
          "ClaudeBot",
          "anthropic-ai",
          "CCBot",
          "Bytespider",
          "Diffbot",
          "PerplexityBot",
          "Amazonbot",
          "Meta-ExternalAgent",
          "facebookexternalhit",
          "ImagesiftBot",
          "PiplBot",
          "cohere-ai",
          "Google-Extended",
        ],
        disallow: "/",
      },
    ],
    // Sitemap intentionally omitted: we don't want to advertise catalog URLs.
  };
}
