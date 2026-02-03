import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Singleton Supabase client for client-side usage.
 * For Server Components, use the SSR-compatible client from @/utils/supabase/server.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
