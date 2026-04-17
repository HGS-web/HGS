import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = new Set(["membership-receipts", "payment-receipts"]);
const SIGNED_URL_TTL_SECONDS = 300;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  let body: { bucket?: unknown; path?: unknown } = {};
  try {
    body = (await request.json()) as { bucket?: unknown; path?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bucket = typeof body.bucket === "string" ? body.bucket : "";
  const path = typeof body.path === "string" ? body.path : "";

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }
  if (!path || path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    console.error("[admin][file-url] sign error:", error);
    return NextResponse.json({ error: "Failed to sign URL" }, { status: 500 });
  }

  console.info(
    `[admin][file-url] signed bucket=${bucket} path=${path} ip=${getClientIp(request)}`,
  );
  return NextResponse.json({ url: data.signedUrl });
}
