import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Browser client for Supabase Auth (signup/login/logout/password flows).
 * Data access for the conference tables does NOT go through this client —
 * those tables deny anon/authenticated and are served by our API routes.
 */
export const getSupabaseBrowser = (): SupabaseClient | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (typeof window !== "undefined") {
      console.error(
        "Supabase browser client unavailable: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return null;
  }

  if (!cachedClient) {
    cachedClient = createBrowserClient(url, anonKey);
  }

  return cachedClient;
};
