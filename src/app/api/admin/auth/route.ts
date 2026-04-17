import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  clearSessionCookieAttributes,
  sessionCookieAttributes,
  signSession,
  verifySession,
} from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timingSafeStringEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const expected = process.env.HGS_ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let body: { password?: unknown } = {};
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";

  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") ?? "unknown";

  if (!timingSafeStringEqual(password, expected)) {
    await sleep(500);
    console.warn(`[admin][auth] failed login from ip=${ip} ua="${ua}"`);
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  console.info(`[admin][auth] successful login from ip=${ip} ua="${ua}"`);

  const token = await signSession();
  const res = NextResponse.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; ${sessionCookieAttributes()}`,
  );
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; ${clearSessionCookieAttributes()}`,
  );
  return res;
}

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifySession(cookie);
  if (!valid) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
