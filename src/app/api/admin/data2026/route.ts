import { NextResponse, type NextRequest } from "next/server";
import { loadConference2026Data } from "@/lib/conference2026-admin-data";
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
    return NextResponse.json(await loadConference2026Data());
  } catch (err) {
    console.error("[admin][data2026] supabase errors:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
