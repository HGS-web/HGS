import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireUser } from "@/lib/user-guard";
import { resolvePersonForUser } from "@/lib/conference2026-me";
import type { AbstractDetail } from "@/lib/conference2026-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Full abstract detail (session, title, text, complete author list) —
 * served ONLY to people linked to the abstract. 404 otherwise, so the
 * route leaks nothing about other abstracts.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, denied } = await requireUser();
  if (denied) return denied;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();

  // Same resolution as the profile payload (auth link OR e-mail match), so
  // the abstracts a user can see in their profile are always openable.
  const person = await resolvePersonForUser(user);
  if (!person) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: myLink } = await supabase
    .from("abstract_authors_conference2026")
    .select("id")
    .eq("abstract_id", id)
    .eq("person_id", person.id)
    .maybeSingle();
  if (!myLink) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [{ data: abstract }, { data: authors }] = await Promise.all([
    supabase
      .from("abstracts_conference2026")
      .select(
        "id, code, title, abstract_text, session_label, session_original, evaluation"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("abstract_authors_conference2026")
      .select("name_as_listed, affiliation_as_listed, role, author_order")
      .eq("abstract_id", id)
      .order("author_order", { ascending: true }),
  ]);

  if (!abstract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload: AbstractDetail = {
    id: abstract.id,
    code: abstract.code,
    title: abstract.title,
    abstract_text: abstract.abstract_text,
    session_label: abstract.session_label,
    session_original: abstract.session_original,
    evaluation: abstract.evaluation,
    authors: (authors ?? []).map((a) => ({
      name: a.name_as_listed,
      affiliation: a.affiliation_as_listed,
      role: a.role,
    })),
  };

  return NextResponse.json(payload);
}
