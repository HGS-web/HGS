import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/supabase-server";

/**
 * Resolve the authenticated Supabase Auth user for a conference API route.
 * Returns { user } on success or { denied } with a ready 401 response.
 */
export async function requireUser(): Promise<
  { user: User; denied: null } | { user: null; denied: NextResponse }
> {
  const user = await getAuthUser();
  if (!user || !user.email) {
    return {
      user: null,
      denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, denied: null };
}

/**
 * Same-origin check for mutating requests (belt-and-braces on top of
 * SameSite=Lax cookies). Browsers always send Origin on cross-site and
 * same-origin POST/PATCH/DELETE.
 */
export function checkOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const host = request.headers.get("host");
  try {
    if (new URL(origin).host !== host) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
