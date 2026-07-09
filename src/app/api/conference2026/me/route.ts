import { NextResponse } from "next/server";
import { requireUser } from "@/lib/user-guard";
import { buildMePayload } from "@/lib/conference2026-me";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Profile bundle for the logged-in user. */
export async function GET() {
  const { user, denied } = await requireUser();
  if (denied) return denied;

  return NextResponse.json(await buildMePayload(user));
}
