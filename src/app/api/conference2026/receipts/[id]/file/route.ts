import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireUser } from "@/lib/user-guard";
import { RECEIPTS_BUCKET } from "@/config/conference2026";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Short-lived signed download URL for the caller's own receipt. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, denied } = await requireUser();
  if (denied) return denied;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data: receipt } = await supabase
    .from("payment_receipts_conference2026")
    .select("file_path, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!receipt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: signed, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(receipt.file_path, 300);
  if (error || !signed) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
