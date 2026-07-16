import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve a person by ANY of their known e-mail addresses:
 * person_emails_conference2026 first (covers aliases and everything the
 * backfill migrated), then people.email as a safety net for person rows
 * created before their alias row existed. `columns` is the
 * people_conference2026 column list to select.
 */
export async function findPersonByEmail<T>(
  supabase: SupabaseClient,
  email: string,
  columns: string
): Promise<{ person: T | null; error: PostgrestError | null }> {
  const { data: alias, error: aliasError } = await supabase
    .from("person_emails_conference2026")
    .select(`person:people_conference2026 ( ${columns} )`)
    .eq("email", email)
    .maybeSingle();
  if (aliasError) return { person: null, error: aliasError };
  const rel = (alias as { person?: unknown } | null)?.person;
  const viaAlias = ((Array.isArray(rel) ? rel[0] : rel) as T | undefined) ?? null;
  if (viaAlias) return { person: viaAlias, error: null };

  const { data, error } = await supabase
    .from("people_conference2026")
    .select(columns)
    .eq("email", email)
    .maybeSingle();
  return { person: ((data as T | null) ?? null), error };
}
