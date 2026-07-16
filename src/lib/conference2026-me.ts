import "server-only";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { findPersonByEmail } from "@/lib/conference2026-person";
import { isAcceptedEvaluation } from "@/config/conference2026";
import type {
  AbstractSummary,
  MePayload,
} from "@/lib/conference2026-types";

type PersonRow = {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  affiliation: string | null;
  auth_user_id: string | null;
};

const PERSON_COLUMNS =
  "id, full_name, first_name, last_name, affiliation, auth_user_id";

/**
 * Resolve the person row for an authenticated user: by auth_user_id first,
 * falling back to the e-mail match for imported people whose account was
 * created but never linked (registration not completed). Shared by the
 * profile payload and the per-abstract authorization check.
 */
export async function resolvePersonForUser(
  user: User
): Promise<PersonRow | null> {
  const supabase = getSupabaseAdmin();
  const { data: linked } = await supabase
    .from("people_conference2026")
    .select(PERSON_COLUMNS)
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (linked) return linked as PersonRow;

  const email = user.email!.trim().toLowerCase();
  const { person } = await findPersonByEmail<PersonRow>(
    supabase,
    email,
    PERSON_COLUMNS
  );
  return person;
}

/**
 * Profile bundle for a verified Supabase Auth user. Shared by
 * GET /api/conference2026/me and the server-rendered profile page.
 */
export async function buildMePayload(user: User): Promise<MePayload> {
  const supabase = getSupabaseAdmin();
  const email = user.email!.trim().toLowerCase();

  const [personRow, { data: registration }, { data: receipts }, { data: claims }] =
    await Promise.all([
      resolvePersonForUser(user),
      supabase
        .from("registrations_conference2026")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("payment_receipts_conference2026")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("author_claims_conference2026")
        .select("*, abstracts_conference2026 ( title )")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  let abstracts: AbstractSummary[] = [];
  if (personRow) {
    const { data: links } = await supabase
      .from("abstract_authors_conference2026")
      .select(
        "role, abstracts_conference2026 ( id, code, title, session_label, evaluation )"
      )
      .eq("person_id", personRow.id);

    abstracts = (links ?? [])
      .map((link) => {
        const a = link.abstracts_conference2026 as unknown as {
          id: string;
          code: string;
          title: string;
          session_label: string;
          evaluation: string;
        } | null;
        if (!a || !isAcceptedEvaluation(a.evaluation)) return null;
        return {
          id: a.id,
          code: a.code,
          title: a.title,
          session_label: a.session_label,
          evaluation: a.evaluation as AbstractSummary["evaluation"],
          role: link.role as AbstractSummary["role"],
        };
      })
      .filter((a): a is AbstractSummary => a !== null)
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  return {
    email,
    person: personRow
      ? {
          id: personRow.id,
          full_name: personRow.full_name,
          first_name: personRow.first_name,
          last_name: personRow.last_name,
          affiliation: personRow.affiliation,
        }
      : null,
    registration: registration ?? null,
    receipts: receipts ?? [],
    abstracts,
    claims: (claims ?? []).map((c) => {
      const { abstracts_conference2026: abstractJoin, ...rest } = c;
      return {
        ...rest,
        abstract_title:
          (abstractJoin as unknown as { title: string } | null)?.title ?? null,
      };
    }),
  };
}
