import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Landing endpoint for Supabase Auth e-mail links (password recovery).
 * Verifies the one-time token, establishes the session cookie and forwards
 * the user to the reset-password page. Invalid/expired links land on the
 * forgot-password page with an explanatory error.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/en/conference2026/reset-password";
  // Same-origin relative paths only (no open redirect).
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : "/en/conference2026/reset-password";

  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  if (tokenHash && type) {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      redirectTo.pathname = next;
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = "/en/conference2026/forgot-password";
  redirectTo.search = "?error=invalid_link";
  return NextResponse.redirect(redirectTo);
}
