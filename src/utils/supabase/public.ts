import { createServerClient } from "@supabase/ssr";

/**
 * Anon Supabase client with no cookies or session.
 * Use from ISR/static Server Components so `cookies()` does not opt the
 * whole route into dynamic rendering.
 */
export function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    },
  );
}
