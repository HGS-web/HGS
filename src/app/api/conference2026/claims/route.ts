import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireUser, checkOrigin } from "@/lib/user-guard";
import { isAcceptedEvaluation } from "@/config/conference2026";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  abstract_id: z.string().uuid(),
  abstract_author_id: z.string().uuid().optional(),
  claimed_name: z.string().min(1).max(300),
  message: z.string().max(2000).optional(),
});

/**
 * Submit an authorship claim from the profile (post-registration).
 * Claims are reviewed by the organising committee in /database.
 */
export async function POST(request: NextRequest) {
  const badOrigin = checkOrigin(request);
  if (badOrigin) return badOrigin;

  const { user, denied } = await requireUser();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const input = parsed.data;

  const supabase = getSupabaseAdmin();

  const { data: person } = await supabase
    .from("people_conference2026")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!person) {
    return NextResponse.json(
      { error: "registration_required" },
      { status: 409 }
    );
  }

  const { data: abstract } = await supabase
    .from("abstracts_conference2026")
    .select("id, evaluation")
    .eq("id", input.abstract_id)
    .maybeSingle();
  if (!abstract || !isAcceptedEvaluation(abstract.evaluation)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (input.abstract_author_id) {
    const { data: authorRow } = await supabase
      .from("abstract_authors_conference2026")
      .select("id")
      .eq("id", input.abstract_author_id)
      .eq("abstract_id", input.abstract_id)
      .maybeSingle();
    if (!authorRow) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const { error } = await supabase.from("author_claims_conference2026").insert({
    user_id: user.id,
    person_id: person.id,
    abstract_id: input.abstract_id,
    abstract_author_id: input.abstract_author_id ?? null,
    claimed_name: input.claimed_name,
    message: input.message ?? null,
  });
  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? "claim_exists" : "Service unavailable" },
      { status }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
