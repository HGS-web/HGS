/**
 * HGS Conference 2026 — one-off import of the evaluated abstracts into the
 * *_conference2026 tables.
 *
 * Sources (repo root):
 *   - Evaluated_Abstracts.xlsx          (Sheet1) — authoritative for abstract
 *     content, final session and evaluation (422 rows expected)
 *   - Detailed_Abstract_Submissions.xlsx
 *       - All_Submissions — authoritative person × abstract links (852 rows)
 *       - Abstracts_421   — original session + submitter first/last names
 *
 * Usage (from the repo root, BEFORE registration launch):
 *   npx tsx scripts/conference2026/import.ts             # dry run + report
 *   npx tsx scripts/conference2026/import.ts --apply     # write to Supabase
 *
 * --apply requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 * .env.local (git-ignored) or in the environment.
 *
 * The import is idempotent: every row gets a deterministic id derived from
 * its natural key, and writes are upserts on the primary key. Re-running
 * after --apply produces zero changes. Do NOT re-run after registration has
 * opened — it would overwrite people fields with import-time values.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = resolve(__dirname, "..", "..");
const EVALUATED_XLSX = resolve(ROOT, "Evaluated_Abstracts.xlsx");
const DETAILED_XLSX = resolve(ROOT, "Detailed_Abstract_Submissions.xlsx");
const REPORT_PATH = resolve(__dirname, "import-report.json");

const EXPECTED = { abstracts: 422, links: 852 };

/**
 * Hand-verified data that contains personal information (e-mails) and
 * therefore lives OUTSIDE the repository, in the git-ignored
 * import-overrides.json next to this script (see import-overrides.example.json
 * for the structure):
 *
 * - known_shared_emails: e-mail addresses confirmed to be used by two
 *   different people in the submissions.
 * - email_abstract_coauthors: co-author lists for the abstracts submitted by
 *   e-mail (S_422–S_428 — their Evaluated ID column holds the literal
 *   "email" and they are absent from All_Submissions). Extracted BY HAND
 *   from the free-text Co-Authors blobs, which are comma-separated with
 *   commas inside parentheses, partially missing e-mails and one malformed
 *   entry — a parser would be riskier than eyes. The submitter of S_425
 *   listed himself as first co-author; the (abstract, person) dedupe below
 *   collapses that onto the submitter link.
 */
type Overrides = {
  known_shared_emails: string[];
  email_abstract_coauthors: Record<
    string,
    { name: string; email: string | null; affiliation: string | null }[]
  >;
};

function loadOverrides(): Overrides {
  const path = resolve(__dirname, "import-overrides.json");
  if (!existsSync(path)) {
    fail(
      `Missing ${path} — copy import-overrides.example.json to import-overrides.json ` +
        "and fill in the hand-verified values (it is git-ignored on purpose: personal data)."
    );
  }
  const parsed = JSON.parse(readFileSync(path, "utf8")) as Overrides;
  if (!Array.isArray(parsed.known_shared_emails) || !parsed.email_abstract_coauthors) {
    fail("import-overrides.json is malformed — see import-overrides.example.json");
  }
  return parsed;
}

const OVERRIDES = loadOverrides();
const KNOWN_SHARED_EMAILS = new Set(
  OVERRIDES.known_shared_emails.map((e) => e.toLowerCase())
);
const EMAIL_ABSTRACT_COAUTHORS = OVERRIDES.email_abstract_coauthors;

const APPLY = process.argv.includes("--apply");

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function normEmail(v: unknown): string | null {
  const s = String(v ?? "").trim().toLowerCase();
  return s.includes("@") ? s : null;
}

function normText(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

/** Lowercase, strip accents/diacritics, collapse whitespace. */
function normName(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return d[m][n];
}

/** Surname = last whitespace token of the normalized full name. */
function surnameOf(fullName: string): string {
  const parts = normName(fullName).split(" ");
  return parts[parts.length - 1] ?? "";
}

/** Same-person heuristic: surnames within edit distance 2. */
function sameSurname(a: string, b: string): boolean {
  return levenshtein(surnameOf(a), surnameOf(b)) <= 2;
}

/** Deterministic UUID (v5-style, SHA-256 based) from a natural key. */
function uuidFromSeed(seed: string): string {
  const h = createHash("sha256").update(`hgs-conference2026:${seed}`).digest();
  const b = Buffer.from(h.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Best-effort split of "First Middle Last" → { first, last }. */
function splitName(fullName: string): { first: string | null; last: string | null } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return { first: fullName.trim() || null, last: null };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

function fail(msg: string): never {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Parse Evaluated_Abstracts.xlsx
// ---------------------------------------------------------------------------

type EvaluatedRow = {
  Id_Sub: string;
  ID: string;
  Title: string;
  Abstract: string;
  Session_After_Evaluation: string;
  Submitter: string;
  "Author Email": string;
  "Author Affiliation": string;
  "Co-Authors": string;
  Evaluation: string;
};

type AbstractRec = {
  id: string;
  code: string;
  title: string;
  abstract_text: string;
  session_label: string;
  session_original: string | null;
  session_number: number | null;
  evaluation: "accepted" | "reassigned" | "not_evaluated";
  co_authors_raw: string | null;
  /** true for S_422–S_428, which were submitted by e-mail (no platform UUID) */
  submitted_via_email: boolean;
  // submitter info from the Evaluated sheet, used for integrity fixes
  submitter_name: string;
  submitter_email: string | null;
  submitter_affiliation: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EVALUATION_MAP: Record<string, AbstractRec["evaluation"]> = {
  accepted: "accepted",
  reassigned: "reassigned",
  "not evaluated": "not_evaluated",
};

function parseEvaluated(): Map<string, AbstractRec> {
  if (!existsSync(EVALUATED_XLSX)) fail(`Missing ${EVALUATED_XLSX}`);
  const wb = XLSX.readFile(EVALUATED_XLSX);
  const rows = XLSX.utils.sheet_to_json<EvaluatedRow>(wb.Sheets["Sheet1"], {
    defval: null,
  });

  const abstracts = new Map<string, AbstractRec>();
  for (const row of rows) {
    const rawId = normText(row.ID);
    const code = normText(row.Id_Sub);
    if (!rawId || !code) continue; // blank tail rows

    // Email-submitted abstracts carry the literal "email" instead of a
    // platform UUID — give them a deterministic id derived from their code.
    const submittedViaEmail = !UUID_RE.test(rawId);
    const id = submittedViaEmail ? uuidFromSeed(`abstract:${code}`) : rawId;

    const evaluationRaw = normText(row.Evaluation)?.toLowerCase() ?? "";
    const evaluation = EVALUATION_MAP[evaluationRaw];
    if (!evaluation) fail(`Unknown Evaluation value "${row.Evaluation}" on ${code}`);

    const sessionLabel = normText(row.Session_After_Evaluation);
    if (!sessionLabel) fail(`Missing Session_After_Evaluation on ${code}`);
    const sessionNumber = /^(\d+)\./.test(sessionLabel)
      ? parseInt(sessionLabel.match(/^(\d+)\./)![1], 10)
      : null;

    if (abstracts.has(id)) fail(`Duplicate abstract ID ${id}`);
    abstracts.set(id, {
      id,
      code,
      title: normText(row.Title) ?? "",
      abstract_text: normText(row.Abstract) ?? "",
      session_label: sessionLabel,
      session_original: null, // filled from Abstracts_421
      session_number: sessionNumber,
      evaluation,
      co_authors_raw: normText(row["Co-Authors"]),
      submitted_via_email: submittedViaEmail,
      submitter_name: normText(row.Submitter) ?? "",
      submitter_email: normEmail(row["Author Email"]),
      submitter_affiliation: normText(row["Author Affiliation"]),
    });
  }
  return abstracts;
}

// ---------------------------------------------------------------------------
// Parse Detailed_Abstract_Submissions.xlsx
// ---------------------------------------------------------------------------

type LinkRow = {
  id_sub: string;
  platform_id: string | null;
  name: string;
  /** null only for hand-extracted co-authors of e-mail-submitted abstracts */
  email: string | null;
  affiliation: string | null;
  affiliation_short: string | null;
  is_submitter: boolean;
  author_order: number;
};

function parseAllSubmissions(): LinkRow[] {
  if (!existsSync(DETAILED_XLSX)) fail(`Missing ${DETAILED_XLSX}`);
  const wb = XLSX.readFile(DETAILED_XLSX);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets["All_Submissions"],
    { defval: null }
  );

  const links: LinkRow[] = [];
  for (const row of rows) {
    const idSub = normText(row["Id_Sub"]);
    const name = normText(row["Name"]);
    const email = normEmail(row["Author Email"]);
    const type = normText(row["Type"]);
    if (!idSub || !name || !type) continue;
    if (!email) fail(`All_Submissions row without email: ${idSub} / ${name}`);

    let isSubmitter = false;
    let order = 0;
    if (type === "submitter") {
      isSubmitter = true;
    } else {
      const m = type.match(/^Co-author_(\d+)$/);
      if (!m) fail(`Unknown Type "${type}" on ${idSub}`);
      order = parseInt(m[1], 10);
    }

    links.push({
      id_sub: idSub,
      platform_id: normText(row["Platform_ID"]),
      name,
      email,
      affiliation: normText(row["Author Affiliation"]),
      affiliation_short: normText(row["Affiliation_Short"]),
      is_submitter: isSubmitter,
      author_order: order,
    });
  }
  return links;
}

type SubmitterDetail = {
  first_name: string | null;
  last_name: string | null;
  session_original: string | null;
};

/** Abstracts_421: original session + submitter first/last names, by Id_Sub. */
function parseAbstracts421(): Map<string, SubmitterDetail> {
  const wb = XLSX.readFile(DETAILED_XLSX);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets["Abstracts_421"],
    { defval: null }
  );
  const out = new Map<string, SubmitterDetail>();
  for (const row of rows) {
    const idSub = normText(row["Id_Sub"]);
    const id = normText(row["ID"]);
    if (!idSub || !id) continue; // lookup-area / blank rows
    if (out.has(idSub)) continue;
    out.set(idSub, {
      first_name: normText(row["Author First Name"]),
      last_name: normText(row["Author Last Name"]),
      session_original: normText(row["Session"]),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Build people (dedupe by email, split confirmed shared emails)
// ---------------------------------------------------------------------------

type PersonRec = {
  id: string;
  email: string | null;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  affiliation: string | null;
  affiliation_short: string | null;
  source: "import";
  needs_review: boolean;
  review_note: string | null;
};

type Occurrence = LinkRow & { abstract_id: string };

type BuildResult = {
  people: Map<string, PersonRec>; // by person id
  personIdFor: (occ: Occurrence) => string;
  nameVariants: { email: string; names: string[] }[];
  reviewPeople: { email: string; kept: string; flagged: string[] }[];
};

function buildPeople(
  occurrences: Occurrence[],
  submitterDetails: Map<string, SubmitterDetail>
): BuildResult {
  const people = new Map<string, PersonRec>();
  const assignment = new Map<Occurrence, string>(); // occurrence -> person id
  const nameVariants: BuildResult["nameVariants"] = [];
  const reviewPeople: BuildResult["reviewPeople"] = [];

  // People without any email (hand-extracted blob co-authors): one person per
  // normalized name, not auto-matchable at registration (claimable instead).
  for (const occ of occurrences.filter((o) => !o.email)) {
    const personId = uuidFromSeed(`person-noemail:${normName(occ.name)}`);
    if (!people.has(personId)) {
      const split = splitName(occ.name);
      people.set(personId, {
        id: personId,
        email: null,
        full_name: occ.name,
        first_name: split.first,
        last_name: split.last,
        affiliation: occ.affiliation,
        affiliation_short: occ.affiliation_short,
        source: "import",
        needs_review: false,
        review_note:
          "No e-mail on record (co-author of an e-mail-submitted abstract).",
      });
    }
    assignment.set(occ, personId);
  }

  const byEmail = new Map<string, Occurrence[]>();
  for (const occ of occurrences) {
    if (!occ.email) continue;
    const list = byEmail.get(occ.email) ?? [];
    list.push(occ);
    byEmail.set(occ.email, list);
  }

  for (const [email, occs] of byEmail) {
    // Cluster occurrences into distinct persons by surname similarity.
    const clusters: Occurrence[][] = [];
    for (const occ of occs) {
      const cluster = clusters.find((c) => sameSurname(c[0].name, occ.name));
      if (cluster) cluster.push(occ);
      else clusters.push([occ]);
    }

    const isShared = clusters.length > 1 || KNOWN_SHARED_EMAILS.has(email);
    if (clusters.length > 1 && !KNOWN_SHARED_EMAILS.has(email)) {
      console.warn(
        `  ⚠ email ${email} clusters into ${clusters.length} distinct people: ` +
          clusters.map((c) => c[0].name).join(" | ")
      );
    }

    // The cluster containing a submitter row keeps the email.
    clusters.sort(
      (a, b) =>
        Number(b.some((o) => o.is_submitter)) -
        Number(a.some((o) => o.is_submitter))
    );

    clusters.forEach((cluster, idx) => {
      const keepsEmail = idx === 0;
      // Preferred spelling: submitter rows first, then most frequent, then longest.
      const submitterNames = cluster.filter((o) => o.is_submitter).map((o) => o.name);
      const counts = new Map<string, number>();
      for (const o of cluster) counts.set(o.name, (counts.get(o.name) ?? 0) + 1);
      const preferred =
        submitterNames[0] ??
        [...counts.entries()].sort(
          (a, b) => b[1] - a[1] || b[0].length - a[0].length
        )[0][0];

      const distinctNames = [...new Set(cluster.map((o) => o.name))];
      if (keepsEmail && distinctNames.length > 1) {
        nameVariants.push({ email, names: distinctNames });
      }

      // First/last: from Abstracts_421 when this person submitted, else split.
      const submitterOcc = cluster.find((o) => o.is_submitter);
      const detail = submitterOcc
        ? submitterDetails.get(submitterOcc.id_sub)
        : undefined;
      const split = splitName(preferred);

      const bestAffiliation =
        (submitterOcc ?? cluster.find((o) => o.affiliation))?.affiliation ?? null;
      const bestShort =
        (submitterOcc ?? cluster.find((o) => o.affiliation_short))
          ?.affiliation_short ?? null;

      const personId = keepsEmail
        ? uuidFromSeed(`person:${email}`)
        : uuidFromSeed(`person-review:${normName(preferred)}`);

      people.set(personId, {
        id: personId,
        email: keepsEmail ? email : null,
        full_name: preferred,
        first_name: detail?.first_name ?? split.first,
        last_name: detail?.last_name ?? split.last,
        affiliation: bestAffiliation,
        affiliation_short: bestShort,
        source: "import",
        needs_review: !keepsEmail,
        review_note: keepsEmail
          ? null
          : `Shared email ${email}: this person was separated from "${clusters[0][0].name}" and has no email on record.`,
      });

      for (const occ of cluster) assignment.set(occ, personId);
    });

    if (isShared && clusters.length > 1) {
      reviewPeople.push({
        email,
        kept: clusters[0][0].name,
        flagged: clusters.slice(1).map((c) => c[0].name),
      });
    }
  }

  return {
    people,
    personIdFor: (occ) => {
      const id = assignment.get(occ);
      if (!id) throw new Error(`No person assigned for ${occ.email}/${occ.name}`);
      return id;
    },
    nameVariants,
    reviewPeople,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`HGS Conference 2026 import — ${APPLY ? "APPLY" : "dry run"}\n`);

  // 1. Parse sources ---------------------------------------------------------
  const abstracts = parseEvaluated();
  const links = parseAllSubmissions();
  const submitterDetails = parseAbstracts421();

  console.log(`Parsed: ${abstracts.size} abstracts, ${links.length} author links`);
  if (abstracts.size !== EXPECTED.abstracts) {
    fail(`Expected ${EXPECTED.abstracts} abstracts, got ${abstracts.size}`);
  }
  if (links.length !== EXPECTED.links) {
    fail(`Expected ${EXPECTED.links} author links, got ${links.length}`);
  }

  // 2. Fill session_original from Abstracts_421 ------------------------------
  const byCode = new Map<string, AbstractRec>();
  for (const a of abstracts.values()) byCode.set(a.code, a);
  for (const [idSub, detail] of submitterDetails) {
    const a = byCode.get(idSub);
    if (a && detail.session_original) a.session_original = detail.session_original;
  }

  // 3. Resolve each link to an abstract --------------------------------------
  const unmatchedLinks: LinkRow[] = [];
  const occurrences: Occurrence[] = [];
  for (const link of links) {
    const abstract =
      (link.platform_id && abstracts.get(link.platform_id)) ||
      byCode.get(link.id_sub);
    if (!abstract) {
      unmatchedLinks.push(link);
      continue;
    }
    occurrences.push({ ...link, abstract_id: abstract.id });
  }
  if (unmatchedLinks.length) {
    console.warn(`  ⚠ ${unmatchedLinks.length} link rows match no abstract`);
  }

  // 4. Integrity: every abstract needs a submitter (order-0) link ------------
  const submittersSeen = new Set(
    occurrences.filter((o) => o.is_submitter).map((o) => o.abstract_id)
  );
  const synthesizedSubmitters: string[] = [];
  for (const a of abstracts.values()) {
    if (submittersSeen.has(a.id)) continue;
    if (!a.submitter_email || !a.submitter_name) {
      fail(`Abstract ${a.code} has no submitter link and no submitter info`);
    }
    occurrences.push({
      id_sub: a.code,
      platform_id: a.id,
      name: a.submitter_name,
      email: a.submitter_email,
      affiliation: a.submitter_affiliation,
      affiliation_short: null,
      is_submitter: true,
      author_order: 0,
      abstract_id: a.id,
    });
    synthesizedSubmitters.push(`${a.code} (${a.submitter_name} <${a.submitter_email}>)`);
  }
  if (synthesizedSubmitters.length) {
    console.warn(
      `  ⚠ synthesized ${synthesizedSubmitters.length} submitter link(s) from the Evaluated sheet:\n` +
        synthesizedSubmitters.map((s) => `      ${s}`).join("\n")
    );
  }

  // 4b. Co-authors of the e-mail-submitted abstracts (hand-extracted above).
  let blobCoauthorCount = 0;
  for (const [code, coauthors] of Object.entries(EMAIL_ABSTRACT_COAUTHORS)) {
    const abstract = byCode.get(code);
    if (!abstract) fail(`EMAIL_ABSTRACT_COAUTHORS references unknown code ${code}`);
    coauthors.forEach((ca, i) => {
      occurrences.push({
        id_sub: code,
        platform_id: abstract.id,
        name: ca.name,
        email: ca.email ? normEmail(ca.email) : null,
        affiliation: ca.affiliation,
        affiliation_short: null,
        is_submitter: false,
        author_order: i + 1,
        abstract_id: abstract.id,
      });
      blobCoauthorCount++;
    });
  }

  // 5. Build people -----------------------------------------------------------
  const { people, personIdFor, nameVariants, reviewPeople } = buildPeople(
    occurrences,
    submitterDetails
  );

  // 6. Build author-link rows (dedupe per abstract+person) --------------------
  type LinkRec = {
    id: string;
    abstract_id: string;
    person_id: string;
    role: "author" | "co_author";
    is_submitter: boolean;
    author_order: number;
    name_as_listed: string;
    affiliation_as_listed: string | null;
  };
  const linkRecs = new Map<string, LinkRec>(); // key: abstract_id:person_id
  const duplicateLinks: string[] = [];
  for (const occ of occurrences) {
    const personId = personIdFor(occ);
    const key = `${occ.abstract_id}:${personId}`;
    const existing = linkRecs.get(key);
    if (existing) {
      duplicateLinks.push(`${occ.id_sub}: ${occ.name} appears twice`);
      // keep the submitter / lowest-order row
      if (!existing.is_submitter && (occ.is_submitter || occ.author_order < existing.author_order)) {
        linkRecs.delete(key);
      } else {
        continue;
      }
    }
    linkRecs.set(key, {
      id: uuidFromSeed(`link:${occ.abstract_id}:${personId}`),
      abstract_id: occ.abstract_id,
      person_id: personId,
      role: occ.is_submitter ? "author" : "co_author",
      is_submitter: occ.is_submitter,
      author_order: occ.author_order,
      name_as_listed: occ.name,
      affiliation_as_listed: occ.affiliation,
      });
  }

  // Guard the unique (abstract_id, author_order) constraint.
  const orderSeen = new Set<string>();
  for (const rec of linkRecs.values()) {
    const key = `${rec.abstract_id}:${rec.author_order}`;
    if (orderSeen.has(key)) {
      fail(`Duplicate author_order ${rec.author_order} on abstract ${rec.abstract_id}`);
    }
    orderSeen.add(key);
  }

  // 7. Report -----------------------------------------------------------------
  const evaluationCounts: Record<string, number> = {};
  for (const a of abstracts.values()) {
    evaluationCounts[a.evaluation] = (evaluationCounts[a.evaluation] ?? 0) + 1;
  }

  const report = {
    generated_at: new Date().toISOString(),
    mode: APPLY ? "apply" : "dry-run",
    counts: {
      abstracts: abstracts.size,
      evaluation: evaluationCounts,
      people: people.size,
      people_with_email: [...people.values()].filter((p) => p.email).length,
      people_needing_review: [...people.values()].filter((p) => p.needs_review).length,
      author_links: linkRecs.size,
      synthesized_submitter_links: synthesizedSubmitters.length,
      blob_coauthor_links: blobCoauthorCount,
      duplicate_link_rows_collapsed: duplicateLinks.length,
      unmatched_link_rows: unmatchedLinks.length,
    },
    email_submitted_abstracts: [...abstracts.values()]
      .filter((a) => a.submitted_via_email)
      .map((a) => a.code)
      .sort(),
    name_variants: nameVariants,
    shared_email_review: reviewPeople,
    synthesized_submitters: synthesizedSubmitters,
    duplicate_links: duplicateLinks,
    unmatched_links: unmatchedLinks,
  };

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${REPORT_PATH}`);
  console.log(JSON.stringify(report.counts, null, 2));
  console.log(`Name-variant emails: ${nameVariants.length}`);
  console.log(`Shared-email splits (manual review): ${reviewPeople.length}`);
  for (const r of reviewPeople) {
    console.log(`  - ${r.email}: kept "${r.kept}", flagged ${r.flagged.map((f) => `"${f}"`).join(", ")}`);
  }

  if (!APPLY) {
    console.log("\nDry run — nothing written. Re-run with --apply to import.");
    return;
  }

  // 8. Write ------------------------------------------------------------------
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    fail("--apply needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local)");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function upsertBatched(table: string, rows: object[]) {
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await supabase.from(table).upsert(batch, { onConflict: "id" });
      if (error) fail(`${table} upsert failed: ${error.message}`);
    }
    console.log(`  ✓ ${table}: ${rows.length} rows upserted`);
  }

  console.log("\nWriting to Supabase…");
  await upsertBatched("people_conference2026", [...people.values()]);
  await upsertBatched(
    "abstracts_conference2026",
    [...abstracts.values()].map((a) => ({
      id: a.id,
      code: a.code,
      title: a.title,
      abstract_text: a.abstract_text,
      session_label: a.session_label,
      session_original: a.session_original,
      session_number: a.session_number,
      evaluation: a.evaluation,
      co_authors_raw: a.co_authors_raw,
    }))
  );
  await upsertBatched("abstract_authors_conference2026", [...linkRecs.values()]);

  // Verify counts server-side.
  for (const [table, expected] of [
    ["people_conference2026", people.size],
    ["abstracts_conference2026", abstracts.size],
    ["abstract_authors_conference2026", linkRecs.size],
  ] as const) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) fail(`${table} count check failed: ${error.message}`);
    const marker = count === expected ? "✓" : "⚠";
    console.log(`  ${marker} ${table}: ${count} rows in DB (expected ${expected})`);
  }

  console.log("\nDone.");
}

/** Minimal .env.local loader (KEY=VALUE lines, no expansion). */
function loadEnvLocal() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, raw] = m;
    if (process.env[k] !== undefined) continue;
    process.env[k] = raw.replace(/^["']|["']$/g, "");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
