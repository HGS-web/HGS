import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  registration_id: z.string().uuid(),
  author_id: z.string().uuid(),
  previous_person_id: z.string().uuid(),
});

/** Admin correction of an imported author entry after identifying its registrant. */
export async function PATCH(request: NextRequest) {
  const deniedResponse = await requireAdmin(request);
  if (deniedResponse) return deniedResponse;
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { registration_id, author_id, previous_person_id } = input.data;
  const sb = getSupabaseAdmin();

  try {
    const [registration, author] = await Promise.all([
      sb.from("registrations_conference2026").select("person_id").eq("id", registration_id).maybeSingle(),
      sb.from("abstract_authors_conference2026").select("id, person_id, abstract_id").eq("id", author_id).maybeSingle(),
    ]);
    if (registration.error || author.error) throw registration.error ?? author.error;
    if (!registration.data || !author.data) {
      return NextResponse.json({ error: "Registration or author entry not found" }, { status: 404 });
    }
    const target = registration.data.person_id;
    if (author.data.person_id === target) return NextResponse.json({ ok: true });
    if (author.data.person_id !== previous_person_id) {
      return NextResponse.json({ error: "This author link has changed. Refresh and try again." }, { status: 409 });
    }

    const [source, sourceRegistration, existing] = await Promise.all([
      sb.from("people_conference2026").select("id, auth_user_id, source").eq("id", previous_person_id).maybeSingle(),
      sb.from("registrations_conference2026").select("id").eq("person_id", previous_person_id).maybeSingle(),
      sb.from("abstract_authors_conference2026").select("id").eq("person_id", target).eq("abstract_id", author.data.abstract_id).maybeSingle(),
    ]);
    if (source.error || sourceRegistration.error || existing.error) throw source.error ?? sourceRegistration.error ?? existing.error;
    if (!source.data || source.data.source !== "import" || source.data.auth_user_id || sourceRegistration.data) {
      return NextResponse.json({ error: "This author belongs to an account or registration. It requires a separate identity review." }, { status: 409 });
    }
    if (existing.data) {
      return NextResponse.json({ error: "This registrant is already linked to this abstract." }, { status: 409 });
    }

    // Compare the original person ID so another admin's correction cannot be overwritten.
    const { data, error } = await sb.from("abstract_authors_conference2026")
      .update({ person_id: target })
      .eq("id", author_id)
      .eq("person_id", previous_person_id)
      .select("id")
      .maybeSingle();
    if (error?.code === "23505") {
      return NextResponse.json({ error: "This registrant is already linked to this abstract." }, { status: 409 });
    }
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "This author link has changed. Refresh and try again." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin][author-links-2026] update failed:", error);
    return NextResponse.json({ error: "The author could not be linked. Please try again." }, { status: 500 });
  }
}
