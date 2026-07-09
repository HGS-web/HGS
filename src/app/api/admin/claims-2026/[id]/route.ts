import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  admin_note: z.string().max(4000).optional(),
});

/**
 * Decide an authorship claim. Approval re-points the claimed author link to
 * the claimant's person row, so the abstract appears in their profile.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deniedResponse = await requireAdmin(request);
  if (deniedResponse) return deniedResponse;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const { data: claim } = await sb
    .from("author_claims_conference2026")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!claim) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (claim.status !== "pending") {
    return NextResponse.json({ error: "Claim already decided" }, { status: 409 });
  }

  if (parsed.data.action === "approve") {
    if (!claim.abstract_author_id) {
      return NextResponse.json(
        {
          error:
            "This claim is not attached to a listed author entry. Reject it, or link the person manually in the database.",
        },
        { status: 400 }
      );
    }
    // Defense in depth: never re-point an author link that does not belong
    // to the claimed abstract (the insert routes validate this too).
    const { data: authorRow } = await sb
      .from("abstract_authors_conference2026")
      .select("id")
      .eq("id", claim.abstract_author_id)
      .eq("abstract_id", claim.abstract_id)
      .maybeSingle();
    if (!authorRow) {
      return NextResponse.json(
        {
          error:
            "The claimed author entry does not belong to the claimed abstract — reject this claim.",
        },
        { status: 400 }
      );
    }
    const { error: linkErr } = await sb
      .from("abstract_authors_conference2026")
      .update({ person_id: claim.person_id })
      .eq("id", claim.abstract_author_id);
    // 23505 = the claimant's person is already linked to this abstract —
    // treat as already satisfied and continue with the approval.
    if (linkErr && linkErr.code !== "23505") {
      console.error("[admin][claims-2026] link error:", linkErr);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
  }

  const { data, error } = await sb
    .from("author_claims_conference2026")
    .update({
      status: parsed.data.action === "approve" ? "approved" : "rejected",
      admin_note: parsed.data.admin_note ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, claim: data });
}
