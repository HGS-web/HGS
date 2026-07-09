import { NextResponse, type NextRequest } from "next/server";
import { fetchAllRows } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Registration-phase data for the /database dashboard (fetched lazily when
 * the "2026 Registration" section is opened). Paged reads — plain selects
 * are silently capped at 1000 rows by PostgREST.
 */
export async function GET(request: NextRequest) {
  const deniedResponse = await requireAdmin(request);
  if (deniedResponse) return deniedResponse;

  try {
    const [registrations, receipts, people, abstracts, authors, claims] =
      await Promise.all([
        fetchAllRows("registrations_conference2026"),
        fetchAllRows("payment_receipts_conference2026"),
        fetchAllRows("people_conference2026"),
        fetchAllRows("abstracts_conference2026", { column: "code", ascending: true }),
        fetchAllRows("abstract_authors_conference2026", { column: "author_order", ascending: true }),
        fetchAllRows("author_claims_conference2026"),
      ]);

    return NextResponse.json({
      registrations,
      receipts,
      people,
      abstracts,
      authors,
      claims,
    });
  } catch (err) {
    console.error("[admin][data2026] supabase errors:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
