import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * User-agent substrings that signal automated scrapers. Matched case-insensitively
 * via the lowercased UA. This is a defense-in-depth layer behind Vercel Firewall:
 * the firewall blocks most bot traffic at the edge, but anything that slips
 * through to the function is stopped here before the Supabase session refresh
 * runs (which is the main per-request cost in middleware).
 */
const BOT_UA_SUBSTRINGS = [
  // generic
  "bot",
  "crawler",
  "spider",
  "crawl",
  "scrape",
  "scrap",
  "httpx",
  "curl",
  "wget",
  "python-requests",
  "python/",
  "okhttp",
  "go-http-client",
  "java/",
  "libwww-perl",
  "mechanize",
  "phantomjs",
  "headless",
  "selenium",
  "puppeteer",
  "dataprovider",
  "lighthouse",
  // AI training crawlers (also covered by robots.txt + firewall)
  "gptbot",
  "chatgpt-user",
  "oai-searchbot",
  "claude-web",
  "claudebot",
  "anthropic-ai",
  "ccbot",
  "bytespider",
  "diffbot",
  "perplexitybot",
  "amazonbot",
  "meta-externalagent",
  "facebookexternalhit",
  "imagesiftbot",
  "piplbot",
  "cohere-ai",
  "google-extended",
];

function isBotUserAgent(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  if (!ua) return true; // no UA at all is a strong bot signal
  if (ua.length < 20) return true; // real browsers send long UAs
  return BOT_UA_SUBSTRINGS.some((substr) => ua.includes(substr));
}

export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";

  // Block bots before any Supabase work runs. Returning early means no
  // session refresh, no cookie round-trip, and (combined with ISR) lets
  // the framework short-circuit straight to a 403.
  if (isBotUserAgent(userAgent)) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "content-type": "text/plain" },
    });
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml, ads.txt, llms.txt (metadata / crawler files)
     *
     * Metadata files must bypass middleware so crawlers can read them. If
     * robots.txt hits the bot-blocking logic above, every crawler gets 403
     * instead of your disallow rules — the main driver of edge 4xx volume.
     * See https://nextjs.org/docs/app/api-reference/file-conventions/metadata
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|ads.txt|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
