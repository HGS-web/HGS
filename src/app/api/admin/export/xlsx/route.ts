import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TableKey =
  | "membership_applications"
  | "registrations"
  | "abstracts"
  | "thematic_session_submissions_2026"
  | "payment_receipts_membership"
  | "payment_receipts_conference";

const FILENAMES: Record<TableKey, string> = {
  membership_applications: "hgs-membership-registrations",
  registrations: "hgs-conference-registrations",
  abstracts: "hgs-conference-abstracts",
  thematic_session_submissions_2026: "hgs-conference-thematic-sessions",
  payment_receipts_membership: "hgs-membership-receipts",
  payment_receipts_conference: "hgs-conference-receipts",
};

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) out[k] = "";
    else if (typeof v === "object") out[k] = JSON.stringify(v);
    else out[k] = v;
  }
  return out;
}

async function fetchTable(key: TableKey): Promise<Record<string, unknown>[]> {
  const sb = getSupabaseAdmin();
  if (key === "payment_receipts_membership") {
    const { data, error } = await sb
      .from("payment_receipts")
      .select("*")
      .eq("receipt_type", "hgs_membership")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  if (key === "payment_receipts_conference") {
    const { data, error } = await sb
      .from("payment_receipts")
      .select("*")
      .eq("receipt_type", "conference")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  const { data, error } = await sb
    .from(key)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function GET(request: NextRequest) {
  const table = request.nextUrl.searchParams.get("table") as TableKey | null;
  if (!table || !(table in FILENAMES)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  let rows: Record<string, unknown>[];
  try {
    rows = await fetchTable(table);
  } catch (err) {
    console.error("[admin][export-xlsx] fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows.map(serializeRow));
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const today = new Date().toISOString().slice(0, 10);
  const filename = `${FILENAMES[table]}-${today}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
