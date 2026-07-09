import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Landing endpoint for Supabase Auth e-mail links (signup confirmation and
 * password recovery). Verifies the one-time token, establishes the session
 * cookie and forwards the user:
 *   - signup/email/magiclink → the complete-registration page, which
 *                              prefills the verified person's details
 *   - recovery               → the reset-password page
 * Invalid/expired links land on the matching entry page with an error flag.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  // Recovery links carry next=…/reset-password; everything else is a signup
  // confirmation. The default Supabase templates ({{ .ConfirmationURL }})
  // send neither token_hash nor type, so `next` is the reliable signal.
  const nextParam = searchParams.get("next");
  const isRecovery =
    type === "recovery" || (!type && !!nextParam?.includes("reset-password"));

  const defaultNext = isRecovery
    ? "/en/conference2026/reset-password"
    : "/en/conference2026/register/complete";
  // Same-origin relative paths only (no open redirect).
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : defaultNext;

  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  const supabase = await getSupabaseServer();

  // Custom templates: …/auth/confirm?token_hash={{ .TokenHash }}&type=…
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      // next may carry a query string — resolve it as a URL rather than
      // assigning it to pathname.
      return NextResponse.redirect(new URL(next, redirectTo.href));
    }
  }

  // Default templates ({{ .ConfirmationURL }}): Supabase verifies on its own
  // endpoint and redirects here with a PKCE ?code= (same-browser only).
  if (!tokenHash && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, redirectTo.href));
    }
  }

  if (isRecovery) {
    redirectTo.pathname = "/en/conference2026/forgot-password";
    redirectTo.search = "?error=invalid_link";
  } else {
    redirectTo.pathname = "/en/conference2026/register";
    redirectTo.search = "?error=confirm_invalid";
  }
  return NextResponse.redirect(redirectTo);
}
