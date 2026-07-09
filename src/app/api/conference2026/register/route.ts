import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireUser, checkOrigin } from "@/lib/user-guard";
import { currentFee, isAcceptedEvaluation } from "@/config/conference2026";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  first_name: z.string().min(1).max(200),
  last_name: z.string().min(1).max(200),
  affiliation: z.string().min(1).max(500),
  country: z.string().min(1).max(200),
  registration_type: z.enum(["regular", "hgs_member", "student", "hgs_student"]),
  gdpr_consent: z.literal(true),
  mailing_consent: z.boolean(),
  claims: z
    .array(
      z.object({
        abstract_id: z.string().uuid(),
        abstract_author_id: z.string().uuid().optional(),
        claimed_name: z.string().min(1).max(300),
        message: z.string().max(2000).optional(),
      })
    )
    .max(10)
    .optional(),
});

/**
 * Final step of the registration flow. The caller has just signed up (or in)
 * with Supabase Auth; this creates/links their person row and inserts the
 * registration with a server-computed fee snapshot. Strict solo: one
 * registration per auth user.
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
  const email = user.email!.trim().toLowerCase();

  const supabase = getSupabaseAdmin();

  // Strict solo — one registration per account.
  const { data: existing } = await supabase
    .from("registrations_conference2026")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "already_registered" },
      { status: 409 }
    );
  }

  // Find or create the person row for this email, and link the auth user.
  const { data: person, error: personErr } = await supabase
    .from("people_conference2026")
    .select("id, auth_user_id")
    .eq("email", email)
    .maybeSingle();
  if (personErr) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  let personId: string;
  if (person) {
    if (person.auth_user_id && person.auth_user_id !== user.id) {
      // Should be impossible (auth emails are unique) — refuse rather than relink.
      return NextResponse.json({ error: "email_conflict" }, { status: 409 });
    }
    personId = person.id;
    if (!person.auth_user_id) {
      const { error } = await supabase
        .from("people_conference2026")
        .update({ auth_user_id: user.id })
        .eq("id", person.id);
      if (error) {
        return NextResponse.json(
          { error: "Service unavailable" },
          { status: 500 }
        );
      }
    }
  } else {
    const { data: created, error } = await supabase
      .from("people_conference2026")
      .insert({
        email,
        full_name: `${input.first_name} ${input.last_name}`.trim(),
        first_name: input.first_name,
        last_name: input.last_name,
        affiliation: input.affiliation,
        source: "signup",
        auth_user_id: user.id,
      })
      .select("id")
      .single();
    if (error || !created) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 500 }
      );
    }
    personId = created.id;
  }

  // Fee snapshot is computed server-side — the client only sends the type.
  const fee = currentFee(input.registration_type);

  const { error: regErr } = await supabase
    .from("registrations_conference2026")
    .insert({
      user_id: user.id,
      person_id: personId,
      email,
      first_name: input.first_name,
      last_name: input.last_name,
      affiliation: input.affiliation,
      country: input.country,
      registration_type: input.registration_type,
      fee_label: fee.label,
      fee_amount_eur: fee.amountEur,
      gdpr_consent: input.gdpr_consent,
      mailing_consent: input.mailing_consent,
    });
  if (regErr) {
    const status = regErr.code === "23505" ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? "already_registered" : "Service unavailable" },
      { status }
    );
  }

  // Authorship claims made during registration (best-effort; reported back).
  const claimErrors: string[] = [];
  for (const claim of input.claims ?? []) {
    const { data: abstract } = await supabase
      .from("abstracts_conference2026")
      .select("id, evaluation")
      .eq("id", claim.abstract_id)
      .maybeSingle();
    if (!abstract || !isAcceptedEvaluation(abstract.evaluation)) {
      claimErrors.push(claim.abstract_id);
      continue;
    }
    // The claimed author entry must belong to the claimed abstract — without
    // this check an approved claim would re-point an author link on a
    // DIFFERENT abstract (authorship hijack).
    if (claim.abstract_author_id) {
      const { data: authorRow } = await supabase
        .from("abstract_authors_conference2026")
        .select("id")
        .eq("id", claim.abstract_author_id)
        .eq("abstract_id", claim.abstract_id)
        .maybeSingle();
      if (!authorRow) {
        claimErrors.push(claim.abstract_id);
        continue;
      }
    }
    const { error } = await supabase
      .from("author_claims_conference2026")
      .insert({
        user_id: user.id,
        person_id: personId,
        abstract_id: claim.abstract_id,
        abstract_author_id: claim.abstract_author_id ?? null,
        claimed_name: claim.claimed_name,
        message: claim.message ?? null,
      });
    if (error && error.code !== "23505") claimErrors.push(claim.abstract_id);
  }

  return NextResponse.json(
    { ok: true, claim_errors: claimErrors },
    { status: 201 }
  );
}
