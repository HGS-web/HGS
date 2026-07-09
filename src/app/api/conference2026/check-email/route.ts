import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkOrigin } from "@/lib/user-guard";
import { isAcceptedEvaluation } from "@/config/conference2026";
import type {
  AbstractSummary,
  CheckEmailResult,
} from "@/lib/conference2026-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

/**
 * Step 1 of the registration flow (pre-auth): classify an email as
 * has_account / known_person (imported author — recognition + prefill) / new.
 */
export async function POST(request: NextRequest) {
  const badOrigin = checkOrigin(request);
  if (badOrigin) return badOrigin;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const supabase = getSupabaseAdmin();
  const { data: person, error } = await supabase
    .from("people_conference2026")
    .select("id, full_name, first_name, last_name, affiliation, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  if (!person) {
    return NextResponse.json({ status: "new" } satisfies CheckEmailResult);
  }
  if (person.auth_user_id) {
    return NextResponse.json({
      status: "has_account",
    } satisfies CheckEmailResult);
  }

  const { data: links } = await supabase
    .from("abstract_authors_conference2026")
    .select(
      "role, abstracts_conference2026 ( id, code, title, session_label, evaluation )"
    )
    .eq("person_id", person.id);

  const abstracts: AbstractSummary[] = (links ?? [])
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
    .filter((a): a is AbstractSummary => a !== null);

  return NextResponse.json({
    status: "known_person",
    person: {
      full_name: person.full_name,
      first_name: person.first_name,
      last_name: person.last_name,
      affiliation: person.affiliation,
    },
    abstracts,
  } satisfies CheckEmailResult);
}
