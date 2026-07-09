import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SESSION_COOKIE, verifySession } from "@/lib/admin-session";

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

/**
 * Conference profile area: refresh the Supabase Auth session (Server
 * Components cannot write cookies) and redirect anonymous visitors to the
 * login page. This is UX-only — the profile page and every API route verify
 * the user themselves.
 */
async function handleProfile(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return withSecurityHeaders(NextResponse.next());

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refreshes the session when expired; do not run code in between.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = request.nextUrl.pathname.split("/")[1] === "el" ? "el" : "en";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}/conference2026/login`;
    redirectUrl.search = "";
    const redirect = NextResponse.redirect(redirectUrl);
    // Carry over any refreshed auth cookies onto the redirect.
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => redirect.cookies.set(cookie));
    return withSecurityHeaders(redirect);
  }

  return withSecurityHeaders(supabaseResponse);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Conference registrant area (Supabase Auth session). Match any locale
  // segment — the matcher below sends every /:locale/conference2026/profile
  // request here, and falling through to the admin branch would be wrong.
  if (/^\/[^/]+\/conference2026\/profile(\/|$)/.test(pathname)) {
    return handleProfile(request);
  }

  // Admin area (separate HMAC cookie + secret).
  if (pathname === "/database/login" || pathname === "/api/admin/auth") {
    return withSecurityHeaders(NextResponse.next());
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifySession(cookie);

  if (valid) return withSecurityHeaders(NextResponse.next());

  if (pathname.startsWith("/api/admin")) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = "/database/login";
  url.search = "";
  return withSecurityHeaders(NextResponse.redirect(url));
}

export const config = {
  matcher: [
    "/database",
    "/database/:path*",
    "/api/admin/:path*",
    "/:locale/conference2026/profile",
    "/:locale/conference2026/profile/:path*",
  ],
};
