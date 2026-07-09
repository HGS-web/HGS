import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Fetch every row of a table, paging past PostgREST's max-rows cap
 * (default 1000, which silently truncates plain selects — even for the
 * service role).
 */
export async function fetchAllRows<T = Record<string, unknown>>(
  table: string,
  orderBy: { column: string; ascending: boolean } = {
    column: "created_at",
    ascending: false,
  },
): Promise<T[]> {
  const sb = getSupabaseAdmin();
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from(table)
      .select("*")
      .order(orderBy.column, { ascending: orderBy.ascending })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

export const getSupabaseAdmin = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "SUPABASE_SERVICE_ROLE_KEY must be set in Vercel project env (server-only).",
    );
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return cachedClient;
};
