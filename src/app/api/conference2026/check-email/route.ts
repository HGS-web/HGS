import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkOrigin } from "@/lib/user-guard";
import type { CheckEmailResult } from "@/lib/conference2026-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

/**
 * Step 1 of the registration flow (pre-auth): only answers whether a
 * completed account already exists for this address. Recognition and
 * prefill data are deliberately NOT returned here — personal data is
 * only revealed after the e-mail address is verified (the complete page
 * reads it from /me with an authenticated session).
 */
export async function POST(request: NextRequest) {
  const badOrigin = checkOrigin(request);
  if (badOrigin) return badOrigin;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const supabase = getSupabaseAdmin();
  const { data: person, error } = await supabase
    .from("people_conference2026")
    .select("id, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  // auth_user_id is linked when a registration is completed — an imported
  // person or a verified-but-unfinished signup should simply get a new link.
  const status: CheckEmailResult["status"] = person?.auth_user_id
    ? "has_account"
    : "ok";
  return NextResponse.json({ status } satisfies CheckEmailResult);
}
