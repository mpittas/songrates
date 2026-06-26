/** Hosts allowed to receive post-auth redirects. */
const ALLOWED_AUTH_HOSTS = new Set([
  "songrates.com",
  "www.songrates.com",
  "songrates.vercel.app",
  "localhost:3000",
  "localhost:3001",
]);

/** Primary production domain used as a safe fallback. */
export const PRIMARY_SITE_ORIGIN = "https://songrates.com";

export function getSafeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  return next;
}

function isAllowedHost(host: string) {
  return ALLOWED_AUTH_HOSTS.has(host.toLowerCase());
}

function originFromHost(host: string, proto = "https") {
  if (host.startsWith("localhost")) {
    return `http://${host}`;
  }

  return `${proto}://${host}`;
}

/** Resolve the app origin from an incoming request (supports Vercel custom domains). */
export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = forwardedHost?.split(",")[0]?.trim() ?? url.hostname;

  if (isAllowedHost(host)) {
    return originFromHost(host, forwardedProto);
  }

  if (process.env.NODE_ENV === "development") {
    return url.origin;
  }

  return PRIMARY_SITE_ORIGIN;
}

/** Build an absolute redirect URL on the same domain as the request. */
export function getRedirectUrl(request: Request, path: string) {
  const safePath = getSafeNextPath(path);
  return `${getRequestOrigin(request)}${safePath}`;
}

/** Build the Supabase OAuth/email callback URL for the current browser origin. */
export function buildAuthCallbackUrl(
  origin: string,
  nextPath?: string | null,
) {
  const callbackUrl = new URL("/auth/callback", origin);
  const next = getSafeNextPath(nextPath);

  if (next !== "/") {
    callbackUrl.searchParams.set("next", next);
  }

  return callbackUrl.toString();
}
