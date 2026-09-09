import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";
import { loadConference2026Data } from "@/lib/conference2026-admin-data";
import { conference2026ReceiptsWorkbook } from "@/lib/conference2026-receipts-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TableKey =
  | "membership_applications"
  | "registrations"
  | "abstracts"
  | "thematic_session_submissions_2026"
  | "payment_receipts_membership"
  | "payment_receipts_conference"
  | "registrations_conference2026"
  | "payment_receipts_conference2026"
  | "people_conference2026"
  | "person_emails_conference2026"
  | "abstracts_conference2026"
  | "abstract_authors_conference2026"
  | "author_claims_conference2026";

const FILENAMES: Record<TableKey, string> = {
  membership_applications: "hgs-membership-registrations",
  registrations: "hgs-conference-registrations",
  abstracts: "hgs-conference-abstracts",
  thematic_session_submissions_2026: "hgs-conference-thematic-sessions",
  payment_receipts_membership: "hgs-membership-receipts",
  payment_receipts_conference: "hgs-conference-receipts",
  registrations_conference2026: "hgs-2026-registrations",
  payment_receipts_conference2026: "hgs-2026-receipts",
  people_conference2026: "hgs-2026-people",
  person_emails_conference2026: "hgs-2026-person-emails",
  abstracts_conference2026: "hgs-2026-abstracts",
  abstract_authors_conference2026: "hgs-2026-abstract-authors",
  author_claims_conference2026: "hgs-2026-author-claims",
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
  const deniedResponse = await requireAdmin(request);
  if (deniedResponse) return deniedResponse;

  const table = request.nextUrl.searchParams.get("table") as TableKey | null;
  if (!table || !(table in FILENAMES)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  let wb: XLSX.WorkBook;
  try {
    if (table === "payment_receipts_conference2026") {
      wb = conference2026ReceiptsWorkbook(await loadConference2026Data());
    } else {
      const rows = await fetchTable(table);
      wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.map(serializeRow)), "Sheet1");
    }
  } catch (err) {
    console.error("[admin][export-xlsx] fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }

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
