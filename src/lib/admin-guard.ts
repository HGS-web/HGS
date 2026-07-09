import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/admin-session";

/**
 * In-handler admin authorization for /api/admin/* routes.
 * The proxy middleware is the outer layer; every handler must ALSO verify
 * the admin session itself so a matcher change can never expose a
 * service-role endpoint.
 *
 * Usage:
 *   const denied = await requireAdmin(request);
 *   if (denied) return denied;
 */
export async function requireAdmin(
  request: NextRequest
): Promise<NextResponse | null> {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifySession(cookie);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
