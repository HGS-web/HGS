import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireUser, checkOrigin } from "@/lib/user-guard";
import {
  RECEIPTS_BUCKET,
  RECEIPT_ACCEPTED_MIME_TYPES,
  RECEIPT_MAX_BYTES,
} from "@/config/conference2026";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  receipt_kind: z.enum(["conference", "hgs_membership"]),
  file_name: z.string().min(1).max(300),
  mime_type: z.string().min(1).max(100),
  size_bytes: z.number().int().positive(),
});

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Start a receipt upload: validates the file metadata and the registration
 * state, then issues a signed upload URL for the private receipts bucket
 * (files up to 10 MB go browser → storage directly; Vercel cannot proxy them).
 */
export async function POST(request: NextRequest) {
  const badOrigin = checkOrigin(request);
  if (badOrigin) return badOrigin;

  const { user, denied } = await requireUser();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const input = parsed.data;

  if (!RECEIPT_ACCEPTED_MIME_TYPES.includes(input.mime_type)) {
    return NextResponse.json(
      { error: "Accepted formats: PDF, JPEG, PNG, WebP" },
      { status: 400 }
    );
  }
  if (input.size_bytes > RECEIPT_MAX_BYTES) {
    return NextResponse.json(
      { error: "File must be under 10 MB" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: registration } = await supabase
    .from("registrations_conference2026")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!registration) {
    return NextResponse.json(
      { error: "registration_required" },
      { status: 409 }
    );
  }

  // One active receipt per kind (declined ones may be replaced).
  const { data: active } = await supabase
    .from("payment_receipts_conference2026")
    .select("id, status")
    .eq("registration_id", registration.id)
    .eq("receipt_kind", input.receipt_kind)
    .neq("status", "declined")
    .maybeSingle();
  if (active && active.status === "accepted") {
    return NextResponse.json({ error: "receipt_accepted" }, { status: 409 });
  }

  const ext = EXT_BY_MIME[input.mime_type];
  const path = `${user.id}/${input.receipt_kind}-${Date.now()}.${ext}`;

  const { data: signed, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !signed) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  return NextResponse.json({
    path: signed.path,
    token: signed.token,
    replaces_pending: active?.status === "pending" ? active.id : null,
  });
}
