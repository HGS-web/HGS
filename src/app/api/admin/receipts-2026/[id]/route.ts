import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.enum(["pending", "accepted", "declined"]),
  admin_notes: z.string().max(4000).optional(),
});

/** Admin evaluation of a 2026 payment receipt (pending / accepted / declined). */
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

  const update: Record<string, unknown> = {
    status: parsed.data.status,
    status_updated_at: new Date().toISOString(),
  };
  if (parsed.data.admin_notes !== undefined) {
    update.admin_notes = parsed.data.admin_notes;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("payment_receipts_conference2026")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    // 23505 = the partial unique index: re-activating a declined receipt when
    // another active receipt of the same kind already exists.
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Another active receipt of this kind already exists for the registration." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, receipt: data });
}
