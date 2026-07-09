import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkOrigin } from "@/lib/user-guard";
import { isAcceptedEvaluation } from "@/config/conference2026";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  first_name: z.string().min(1).max(200),
  last_name: z.string().min(2).max(200),
});

/** Lowercase, strip accents, transliterate Greek to Latin (rough), squeeze spaces. */
function normalizeForMatch(value: string): string {
  const greekMap: Record<string, string> = {
    α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th",
    ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p",
    ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps",
    ω: "o",
  };
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split("")
    .map((ch) => greekMap[ch] ?? ch)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return d[a.length][b.length];
}

/**
 * Candidate abstracts for an authorship claim, matched by name against the
 * listed authors of accepted abstracts. Returns at most 10 candidates with
 * title + session + listed author name only (programme-public data — no
 * e-mails, no abstract text). Deliberately unauthenticated: the register
 * flow uses it BEFORE the account is created (step 2 of 3).
 */
export async function POST(request: NextRequest) {
  const badOrigin = checkOrigin(request);
  if (badOrigin) return badOrigin;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const first = normalizeForMatch(parsed.data.first_name);
  const last = normalizeForMatch(parsed.data.last_name);

  const supabase = getSupabaseAdmin();
  const { data: links, error } = await supabase
    .from("abstract_authors_conference2026")
    .select(
      "id, name_as_listed, role, abstracts_conference2026 ( id, code, title, session_label, evaluation )"
    );
  if (error) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  const candidates: {
    abstract_id: string;
    abstract_author_id: string;
    code: string;
    title: string;
    session_label: string;
    name_as_listed: string;
    role: string;
  }[] = [];

  for (const link of links ?? []) {
    const a = link.abstracts_conference2026 as unknown as {
      id: string;
      code: string;
      title: string;
      session_label: string;
      evaluation: string;
    } | null;
    if (!a || !isAcceptedEvaluation(a.evaluation)) continue;

    const listed = normalizeForMatch(link.name_as_listed);
    const listedParts = listed.split(" ");
    const listedLast = listedParts[listedParts.length - 1] ?? "";

    // Surname within edit distance 2 AND first-name initial (or full first
    // name) present somewhere in the listed name.
    const surnameClose = levenshtein(listedLast, last) <= 2;
    const firstMatches =
      first.length > 0 &&
      (listed.includes(first) || listedParts.some((p) => p[0] === first[0]));
    if (surnameClose && firstMatches) {
      candidates.push({
        abstract_id: a.id,
        abstract_author_id: link.id,
        code: a.code,
        title: a.title,
        session_label: a.session_label,
        name_as_listed: link.name_as_listed,
        role: link.role,
      });
    }
  }

  return NextResponse.json({ candidates: candidates.slice(0, 10) });
}
