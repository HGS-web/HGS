import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== "undefined") {
      console.error(
        "Supabase client unavailable: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return cachedClient;
};
