import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireUser, checkOrigin } from "@/lib/user-guard";
import { RECEIPTS_BUCKET } from "@/config/conference2026";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  path: z.string().min(1).max(500),
  receipt_kind: z.enum(["conference", "hgs_membership"]),
  file_name: z.string().min(1).max(300),
  user_notes: z.string().max(2000).optional(),
});

/**
 * Finish a receipt upload: verifies the object landed in the caller's own
 * folder of the receipts bucket, then records the receipt as pending.
 * Replacing a still-pending receipt supersedes it (the old row is declined
 * with an explanatory admin note, preserving history).
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

  if (!input.path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  const { data: registration } = await supabase
    .from("registrations_conference2026")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!registration) {
    return NextResponse.json(
      { error: "registration_required" },
      { status: 409 }
    );
  }

  // Verify the object actually exists in the caller's folder.
  const fileName = input.path.slice(`${user.id}/`.length);
  const { data: objects, error: listErr } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .list(user.id, { search: fileName, limit: 10 });
  const object = (objects ?? []).find((o) => o.name === fileName);
  if (listErr || !object) {
    return NextResponse.json({ error: "upload_not_found" }, { status: 400 });
  }

  const metadata = object.metadata as
    | { size?: number; mimetype?: string }
    | null;

  // Supersede a still-pending receipt of the same kind, keeping history.
  // PostgREST offers no transaction here, so on insert failure the
  // superseded receipt is restored (compensation) rather than left declined.
  const { data: pending } = await supabase
    .from("payment_receipts_conference2026")
    .select("id")
    .eq("registration_id", registration.id)
    .eq("receipt_kind", input.receipt_kind)
    .eq("status", "pending")
    .maybeSingle();
  if (pending) {
    const { error: supersedeErr } = await supabase
      .from("payment_receipts_conference2026")
      .update({
        status: "declined",
        admin_notes: "Superseded by a newer upload from the registrant.",
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", pending.id)
      .eq("status", "pending");
    if (supersedeErr) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 500 }
      );
    }
  }

  const { data: inserted, error } = await supabase
    .from("payment_receipts_conference2026")
    .insert({
      registration_id: registration.id,
      user_id: user.id,
      receipt_kind: input.receipt_kind,
      file_path: input.path,
      file_name: input.file_name,
      mime_type: metadata?.mimetype ?? null,
      size_bytes: metadata?.size ?? null,
      user_notes: input.user_notes ?? null,
    })
    .select("*")
    .single();
  if (error || !inserted) {
    if (pending) {
      // Restore the receipt this upload was meant to replace.
      await supabase
        .from("payment_receipts_conference2026")
        .update({ status: "pending", admin_notes: null, status_updated_at: null })
        .eq("id", pending.id)
        .eq("status", "declined");
    }
    const status = error?.code === "23505" ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? "receipt_exists" : "Service unavailable" },
      { status }
    );
  }

  return NextResponse.json({ ok: true, receipt: inserted }, { status: 201 });
}
