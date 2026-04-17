import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = getSupabaseAdmin();

  const [membership, registrations, abstracts, sessions, receipts] = await Promise.all([
    sb
      .from("membership_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    sb.from("registrations").select("*").order("created_at", { ascending: false }),
    sb.from("abstracts").select("*").order("created_at", { ascending: false }),
    sb
      .from("thematic_session_submissions_2026")
      .select("*")
      .order("created_at", { ascending: false }),
    sb.from("payment_receipts").select("*").order("created_at", { ascending: false }),
  ]);

  const errors = [membership, registrations, abstracts, sessions, receipts]
    .map((r) => r.error)
    .filter(Boolean);
  if (errors.length > 0) {
    console.error("[admin][data] supabase errors:", errors);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }

  const allReceipts = receipts.data ?? [];

  return NextResponse.json({
    membership: {
      registrations: membership.data ?? [],
      receipts: allReceipts.filter((r) => r.receipt_type === "hgs_membership"),
    },
    conference: {
      sessions: sessions.data ?? [],
      abstracts: abstracts.data ?? [],
      receipts: allReceipts.filter((r) => r.receipt_type === "conference"),
    },
  });
}
