import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/admin-session";

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/database", "/database/:path*", "/api/admin/:path*"],
};
