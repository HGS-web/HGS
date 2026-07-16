/**
 * HGS Conference 2026 — reconcile multi-email author identities against the
 * hand-fixed Authors_Data_SNS.xlsx (repo root, git-ignored).
 *
 * The May import created one people_conference2026 row PER EMAIL, so authors
 * who used several addresses across submissions exist as several person rows,
 * each owning only part of their abstracts. The SNS sheet groups an author's
 * rows under one Auth_ID. This script:
 *
 *   1. clusters sheet rows into physical persons (union-find over Auth_ID,
 *      plus same-email-across-Auth_IDs — except known_shared_emails — plus
 *      the hand-confirmed same_person_groups override),
 *   2. resolves each cluster to existing DB person rows by e-mail,
 *   3. merges duplicates into one canonical row (author links, claims and
 *      registrations are re-pointed; the duplicates are deleted),
 *   4. writes every cluster e-mail into person_emails_conference2026 so any
 *      of an author's addresses resolves to the canonical person,
 *   5. repairs malformed e-mail strings (regex-extracts the embedded address),
 *   6. reports — but never auto-merges — fuzzy same-person suspects; confirm
 *      them in import-overrides.json (same_person_groups / do_not_merge) and
 *      re-run.
 *
 * Clusters with two auth-linked rows or two registrations are SKIPPED and
 * reported (a human must decide which account survives).
 *
 * Usage (from the repo root, AFTER the person_emails_conference2026
 * migration; deploy the alias-aware lookup code before --apply):
 *   npx tsx scripts/conference2026/reconcile-authors.ts             # dry run + report
 *   npx tsx scripts/conference2026/reconcile-authors.ts --apply     # backup, write, verify
 *   npx tsx scripts/conference2026/reconcile-authors.ts --emit-sql  # SQL fallback
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * Re-running after --apply is a no-op (every cluster then resolves to one
 * person and all alias rows already match).
 *
 * Do NOT re-run import.ts --apply after this script — it would upsert the
 * merged person rows back into existence.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = resolve(__dirname, "..", "..");
const SNS_XLSX = resolve(ROOT, "Authors_Data_SNS.xlsx");
const REPORT_PATH = resolve(__dirname, "reconcile-report.json");

const EXPECTED = { sheetRows: 846, authIds: 670, codes: 418 };
// Warn-only expectations (drift means the sheet changed — re-review).
const EXPECTED_SOFT = { multiEmailAuthIds: 56, malformedCells: 1, noEmailRows: 3 };

const APPLY = process.argv.includes("--apply");
const EMIT_SQL = process.argv.includes("--emit-sql");

type Overrides = {
  known_shared_emails: string[];
  same_person_groups?: string[][];
  do_not_merge?: string[][];
  /** Addresses that should win the canonical pick within their cluster
   *  (e.g. the university address) — never outranks an auth-linked or
   *  registered row, whose account e-mail must stay primary. */
  preferred_primary_emails?: string[];
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
  if (!Array.isArray(parsed.known_shared_emails)) {
    fail("import-overrides.json is malformed — see import-overrides.example.json");
  }
  return parsed;
}

const OVERRIDES = loadOverrides();
const KNOWN_SHARED_EMAILS = new Set(
  OVERRIDES.known_shared_emails.map((e) => e.toLowerCase())
);
const SAME_PERSON_GROUPS = OVERRIDES.same_person_groups ?? [];
const DO_NOT_MERGE = OVERRIDES.do_not_merge ?? [];
const PREFERRED_PRIMARY = new Set(
  (OVERRIDES.preferred_primary_emails ?? []).map((e) => e.toLowerCase())
);

// ---------------------------------------------------------------------------
// Small helpers (shared conventions with import.ts)
// ---------------------------------------------------------------------------

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

/** Deterministic UUID (v5-style, SHA-256 based) from a natural key. */
function uuidFromSeed(seed: string): string {
  const h = createHash("sha256").update(`hgs-conference2026:${seed}`).digest();
  const b = Buffer.from(h.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function fail(msg: string): never {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

/**
 * Extract the e-mail address embedded in a raw cell/column value. Handles the
 * export artifact where a name with parentheses leaked into the e-mail cell
 * (e.g. "betty) charalampopoulou (b.charalampopoulou@…"). `malformed` is true
 * when the stored value is not exactly the clean address.
 */
function extractEmail(raw: unknown): { email: string | null; malformed: boolean } {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return { email: null, malformed: false };
  const m = s.match(EMAIL_RE);
  if (!m) return { email: null, malformed: true };
  return { email: m[0], malformed: m[0] !== s };
}

// ---------------------------------------------------------------------------
// Parse Authors_Data_SNS.xlsx (sheet "Data")
// ---------------------------------------------------------------------------

type SheetRow = {
  auth_id: string;
  code: string; // Id_Sub, matches abstracts_conference2026.code
  name: string;
  email: string | null; // extracted, lowercased
  raw_email: string | null;
  malformed: boolean;
  is_submitter: boolean;
};

function parseSheet(): SheetRow[] {
  if (!existsSync(SNS_XLSX)) fail(`Missing ${SNS_XLSX}`);
  const wb = XLSX.readFile(SNS_XLSX);
  const ws = wb.Sheets["Data"];
  if (!ws) fail(`${SNS_XLSX} has no "Data" sheet`);
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

  const rows: SheetRow[] = [];
  for (const r of raw) {
    const authId = String(r["Auth_ID"] ?? "").trim();
    if (!authId) continue; // pivot-residue rows on the right side of the sheet
    const code = String(r["Id_Sub"] ?? "").trim();
    const name = String(r["Name"] ?? "").trim();
    const type = String(r["Type"] ?? "").trim();
    if (!code || !name) fail(`Sheet row for ${authId} is missing Id_Sub or Name`);
    if (!/^submitter$/i.test(type) && !/^co-author_\d+$/i.test(type)) {
      fail(`Sheet row ${authId}/${code} has unexpected Type "${type}"`);
    }
    const { email, malformed } = extractEmail(r["Author Email"]);
    rows.push({
      auth_id: authId,
      code,
      name,
      email,
      raw_email: r["Author Email"] === null ? null : String(r["Author Email"]).trim(),
      malformed,
      is_submitter: /^submitter$/i.test(type),
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Union-find clustering of Auth_IDs into physical persons
// ---------------------------------------------------------------------------

class DSU {
  private parent = new Map<string, string>();
  find(x: string): string {
    let root = this.parent.get(x) ?? x;
    if (root !== x) {
      root = this.find(root);
      this.parent.set(x, root);
    }
    return root;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(rb, ra);
  }
}

type Cluster = {
  key: string; // representative (lowest) Auth_ID
  authIds: string[];
  names: string[]; // distinct, in sheet order
  emails: string[]; // distinct extracted e-mails
  submitterEmails: Set<string>; // e-mails seen on submitter rows
  codes: Set<string>; // all Id_Subs this person is on
};

function buildClusters(rows: SheetRow[]): Cluster[] {
  const dsu = new DSU();
  const allAuthIds = new Set(rows.map((r) => r.auth_id));

  // Rule B: the same address under two Auth_IDs is the same person — except
  // for addresses two different people genuinely shared.
  const byEmail = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.email || KNOWN_SHARED_EMAILS.has(r.email)) continue;
    let set = byEmail.get(r.email);
    if (!set) byEmail.set(r.email, (set = new Set()));
    set.add(r.auth_id);
  }
  for (const ids of byEmail.values()) {
    const [first, ...rest] = [...ids];
    for (const other of rest) dsu.union(first, other);
  }

  // Rule C: hand-confirmed groups.
  for (const group of SAME_PERSON_GROUPS) {
    for (const id of group) {
      if (!allAuthIds.has(id)) fail(`same_person_groups references unknown Auth_ID ${id}`);
    }
    for (let i = 1; i < group.length; i++) dsu.union(group[0], group[i]);
  }

  // Contradiction guard: a do_not_merge pair must not end up in one cluster.
  for (const [a, b] of DO_NOT_MERGE) {
    if (allAuthIds.has(a) && allAuthIds.has(b) && dsu.find(a) === dsu.find(b)) {
      fail(`do_not_merge pair ${a}/${b} was unioned by the data — resolve the contradiction`);
    }
  }

  const byRoot = new Map<string, SheetRow[]>();
  for (const r of rows) {
    const root = dsu.find(r.auth_id);
    let list = byRoot.get(root);
    if (!list) byRoot.set(root, (list = []));
    list.push(r);
  }

  const clusters: Cluster[] = [];
  for (const list of byRoot.values()) {
    const authIds = [...new Set(list.map((r) => r.auth_id))].sort();
    const names: string[] = [];
    for (const r of list) if (!names.includes(r.name)) names.push(r.name);
    const emails = [...new Set(list.flatMap((r) => (r.email ? [r.email] : [])))].sort();
    clusters.push({
      key: authIds[0],
      authIds,
      names,
      emails,
      submitterEmails: new Set(
        list.filter((r) => r.is_submitter && r.email).map((r) => r.email as string)
      ),
      codes: new Set(list.map((r) => r.code)),
    });
  }
  clusters.sort((a, b) => a.key.localeCompare(b.key));
  return clusters;
}

// ---------------------------------------------------------------------------
// DB state
// ---------------------------------------------------------------------------

type DbPerson = {
  id: string;
  email: string | null;
  full_name: string;
  auth_user_id: string | null;
  needs_review: boolean;
  created_at: string;
};
type DbLink = {
  id: string;
  abstract_id: string;
  person_id: string;
  role: string;
  is_submitter: boolean;
  author_order: number;
  created_at: string;
};
type DbClaim = {
  id: string;
  person_id: string;
  abstract_id: string;
  abstract_author_id: string | null;
  status: string;
};
type DbRegistration = { id: string; user_id: string; person_id: string };
type DbAlias = {
  id: string;
  person_id: string;
  email: string;
  is_primary: boolean;
  source: string;
};
type DbAbstract = { id: string; code: string };

type DbState = {
  people: DbPerson[];
  links: DbLink[];
  claims: DbClaim[];
  registrations: DbRegistration[];
  aliases: DbAlias[];
  abstracts: DbAbstract[];
};

type SupabaseLike = {
  from(table: string): any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

async function fetchAll<T>(
  supabase: SupabaseLike,
  table: string,
  columns: string
): Promise<T[]> {
  const PAGE = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) fail(`${table} fetch failed: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function loadDbState(supabase: SupabaseLike): Promise<DbState> {
  const [people, links, claims, registrations, aliases, abstracts] = await Promise.all([
    fetchAll<DbPerson>(
      supabase,
      "people_conference2026",
      "id, email, full_name, auth_user_id, needs_review, created_at"
    ),
    fetchAll<DbLink>(
      supabase,
      "abstract_authors_conference2026",
      "id, abstract_id, person_id, role, is_submitter, author_order, created_at"
    ),
    fetchAll<DbClaim>(
      supabase,
      "author_claims_conference2026",
      "id, person_id, abstract_id, abstract_author_id, status"
    ),
    fetchAll<DbRegistration>(
      supabase,
      "registrations_conference2026",
      "id, user_id, person_id"
    ),
    fetchAll<DbAlias>(
      supabase,
      "person_emails_conference2026",
      "id, person_id, email, is_primary, source"
    ),
    fetchAll<DbAbstract>(supabase, "abstracts_conference2026", "id, code"),
  ]);
  if (aliases.length === 0) {
    fail(
      "person_emails_conference2026 is empty — apply the migration/backfill first " +
        "(see scripts/conference2026/schema.sql)."
    );
  }
  return { people, links, claims, registrations, aliases, abstracts };
}

// ---------------------------------------------------------------------------
// Plan (pure): resolve clusters against the DB and derive ordered operations
// ---------------------------------------------------------------------------

type Op =
  | { kind: "fix_person_email"; person_id: string; from: string | null; to: string }
  | { kind: "repoint_claim_link"; claim_id: string; to_link_id: string }
  | { kind: "delete_author_link"; link_id: string }
  | { kind: "repoint_author_link"; link_id: string; to_person_id: string }
  | { kind: "repoint_claim_person"; claim_id: string; to_person_id: string }
  | { kind: "repoint_registration"; registration_id: string; to_person_id: string }
  | {
      kind: "update_alias";
      alias_id: string;
      set: { person_id?: string; is_primary?: boolean; email?: string };
    }
  | {
      kind: "insert_alias";
      row: { id: string; person_id: string; email: string; is_primary: boolean; source: "reconcile" };
    }
  | { kind: "delete_person"; person_id: string };

type ClusterPlan = {
  cluster: Cluster;
  canonical: DbPerson;
  merged: DbPerson[];
  ops: Op[];
};

type Plan = {
  emailFixOps: Op[]; // people.email string repairs, run before everything
  clusterPlans: ClusterPlan[];
  conflicts: {
    key: string;
    names: string[];
    emails: string[];
    reason: string;
    people: { id: string; email: string | null; auth_user_id: string | null; registration_id: string | null }[];
  }[];
  unmatched: { key: string; names: string[]; emails: string[] }[];
  sharedEmailGuardHits: { email: string; cluster: string; attached: boolean }[];
};

function buildPlan(clusters: Cluster[], db: DbState): Plan {
  const personById = new Map(db.people.map((p) => [p.id, p]));
  const aliasByEmail = new Map<string, DbAlias>();
  for (const a of db.aliases) {
    const { email } = extractEmail(a.email);
    if (email) aliasByEmail.set(email, a);
  }
  const personByEmail = new Map<string, DbPerson>();
  for (const p of db.people) {
    const { email } = extractEmail(p.email);
    if (email && !personByEmail.has(email)) personByEmail.set(email, p);
  }
  // Alias rows take precedence (post-merge they point at the canonical).
  const resolveEmail = (email: string): DbPerson | null => {
    const alias = aliasByEmail.get(email);
    if (alias) return personById.get(alias.person_id) ?? null;
    return personByEmail.get(email) ?? null;
  };
  const regByPerson = new Map(db.registrations.map((r) => [r.person_id, r]));
  const claimPersonIds = new Set(db.claims.map((c) => c.person_id));

  // people.email string repairs (global, independent of clustering).
  const emailFixOps: Op[] = [];
  const takenEmails = new Set<string>();
  for (const p of db.people) if (p.email) takenEmails.add(p.email);
  for (const p of db.people) {
    if (!p.email) continue;
    const { email } = extractEmail(p.email);
    if (email && email !== p.email && !takenEmails.has(email)) {
      emailFixOps.push({ kind: "fix_person_email", person_id: p.id, from: p.email, to: email });
    }
  }

  const clusterPlans: ClusterPlan[] = [];
  const conflicts: Plan["conflicts"] = [];
  const unmatched: Plan["unmatched"] = [];
  const sharedEmailGuardHits: Plan["sharedEmailGuardHits"] = [];

  for (const cluster of clusters) {
    // Resolve candidates. Shared e-mails only attach their DB row when the
    // surname matches this cluster (keeps e.g. Kallini's cluster off the row
    // of the person who kept the shared address).
    const candidates = new Map<string, DbPerson>();
    const clusterEmails: string[] = []; // e-mails this cluster may own alias rows for
    for (const email of cluster.emails) {
      const person = resolveEmail(email);
      if (KNOWN_SHARED_EMAILS.has(email)) {
        const attached =
          !!person &&
          cluster.names.some((n) => levenshtein(surnameOf(n), surnameOf(person.full_name)) <= 2);
        sharedEmailGuardHits.push({ email, cluster: cluster.key, attached });
        if (attached && person) {
          candidates.set(person.id, person);
          clusterEmails.push(email);
        }
        continue;
      }
      clusterEmails.push(email);
      if (person) candidates.set(person.id, person);
    }

    // Name+abstract corroborated fallback for clusters whose e-mails are all
    // unknown to the DB: attach the NULL-e-mail person with the exact same
    // normalized name who is already linked to one of the cluster's abstracts
    // (the hand-extracted co-authors of the e-mail-submitted abstracts).
    if (candidates.size === 0) {
      const clusterAbstractIds = new Set(
        db.abstracts.filter((a) => cluster.codes.has(a.code)).map((a) => a.id)
      );
      const nameSet = new Set(cluster.names.map((n) => normName(n)));
      const matches = db.people.filter(
        (p) =>
          !p.email &&
          nameSet.has(normName(p.full_name)) &&
          db.links.some((l) => l.person_id === p.id && clusterAbstractIds.has(l.abstract_id))
      );
      if (matches.length === 1) candidates.set(matches[0].id, matches[0]);
    }

    if (candidates.size === 0) {
      unmatched.push({ key: cluster.key, names: cluster.names, emails: cluster.emails });
      continue;
    }

    const members = [...candidates.values()];
    const authLinked = members.filter((p) => p.auth_user_id);
    const regHolders = members.filter((p) => regByPerson.has(p.id));
    let conflictReason: string | null = null;
    if (authLinked.length >= 2) conflictReason = "two auth-linked person rows";
    else if (regHolders.length >= 2) conflictReason = "two registrations";
    else if (
      authLinked.length === 1 &&
      regHolders.length === 1 &&
      authLinked[0].id !== regHolders[0].id
    ) {
      conflictReason = "auth-linked row and registration on different rows";
    }
    if (conflictReason) {
      conflicts.push({
        key: cluster.key,
        names: cluster.names,
        emails: cluster.emails,
        reason: conflictReason,
        people: members.map((p) => ({
          id: p.id,
          email: p.email,
          auth_user_id: p.auth_user_id,
          registration_id: regByPerson.get(p.id)?.id ?? null,
        })),
      });
      continue;
    }

    // Canonical survivor: deterministic total order (lexicographic key —
    // auth-linked > registered > claim-referenced > preferred-primary >
    // submitter-email > oldest).
    const score = (p: DbPerson): string =>
      [
        p.auth_user_id ? 0 : 1,
        regByPerson.has(p.id) ? 0 : 1,
        claimPersonIds.has(p.id) ? 0 : 1,
        p.email && PREFERRED_PRIMARY.has(extractEmail(p.email).email ?? "") ? 0 : 1,
        p.email && cluster.submitterEmails.has(extractEmail(p.email).email ?? "") ? 0 : 1,
        p.created_at,
        p.id,
      ].join("|");
    members.sort((a, b) => score(a).localeCompare(score(b)));
    const canonical = members[0];
    const merged = members.slice(1);
    const memberIds = new Set(members.map((p) => p.id));
    const mergedIds = new Set(merged.map((p) => p.id));

    const ops: Op[] = [];

    // a. Author links: per abstract, the best link survives and is re-pointed;
    //    redundant links lose their claim references first, then go.
    const clusterLinks = db.links.filter((l) => memberIds.has(l.person_id));
    const byAbstract = new Map<string, DbLink[]>();
    for (const l of clusterLinks) {
      let list = byAbstract.get(l.abstract_id);
      if (!list) byAbstract.set(l.abstract_id, (list = []));
      list.push(l);
    }
    for (const links of byAbstract.values()) {
      links.sort((a, b) => {
        if (a.is_submitter !== b.is_submitter) return a.is_submitter ? -1 : 1;
        if (a.author_order !== b.author_order) return a.author_order - b.author_order;
        if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
        return a.id < b.id ? -1 : 1;
      });
      const [winner, ...losers] = links;
      for (const loser of losers) {
        for (const claim of db.claims) {
          if (claim.abstract_author_id === loser.id) {
            ops.push({ kind: "repoint_claim_link", claim_id: claim.id, to_link_id: winner.id });
          }
        }
        ops.push({ kind: "delete_author_link", link_id: loser.id });
      }
      if (winner.person_id !== canonical.id) {
        ops.push({ kind: "repoint_author_link", link_id: winner.id, to_person_id: canonical.id });
      }
    }

    // b. Claims of merged persons.
    for (const claim of db.claims) {
      if (mergedIds.has(claim.person_id)) {
        ops.push({ kind: "repoint_claim_person", claim_id: claim.id, to_person_id: canonical.id });
      }
    }

    // c. Registration of a merged person (at most one — see conflict rules).
    for (const reg of db.registrations) {
      if (mergedIds.has(reg.person_id)) {
        ops.push({ kind: "repoint_registration", registration_id: reg.id, to_person_id: canonical.id });
      }
    }

    // d. Alias rows: every cluster e-mail resolves to the canonical.
    // A NULL-e-mail canonical (hand-extracted co-author) gets its primary
    // address from the sheet first.
    let canonicalPrimary = extractEmail(canonical.email).email;
    if (!canonicalPrimary && clusterEmails.length > 0) {
      const preferred =
        clusterEmails.find((e) => cluster.submitterEmails.has(e)) ?? clusterEmails[0];
      if (!takenEmails.has(preferred)) {
        ops.push({ kind: "fix_person_email", person_id: canonical.id, from: null, to: preferred });
        canonicalPrimary = preferred;
      }
    }
    for (const email of clusterEmails) {
      const desiredPrimary = email === canonicalPrimary;
      const existing = aliasByEmail.get(email);
      if (existing) {
        const set: { person_id?: string; is_primary?: boolean; email?: string } = {};
        if (existing.person_id !== canonical.id) set.person_id = canonical.id;
        if (existing.is_primary !== desiredPrimary) set.is_primary = desiredPrimary;
        if (existing.email !== email) set.email = email; // repairs malformed strings
        if (Object.keys(set).length > 0) {
          ops.push({ kind: "update_alias", alias_id: existing.id, set });
        }
      } else {
        ops.push({
          kind: "insert_alias",
          row: {
            id: uuidFromSeed(`person-email:${email}`),
            person_id: canonical.id,
            email,
            is_primary: desiredPrimary,
            source: "reconcile",
          },
        });
      }
    }

    // e. Delete the merged person rows (their alias rows were re-pointed in d;
    //    execute() re-checks that nothing references them before deleting).
    for (const p of merged) {
      ops.push({ kind: "delete_person", person_id: p.id });
    }

    if (merged.length > 0 || ops.length > 0) {
      clusterPlans.push({ cluster, canonical, merged, ops });
    }
  }

  return { emailFixOps, clusterPlans, conflicts, unmatched, sharedEmailGuardHits };
}

// ---------------------------------------------------------------------------
// Fuzzy same-person suspects (report-only)
// ---------------------------------------------------------------------------

type Suspect = {
  a: { key: string; name: string; emails: string[] };
  b: { key: string; name: string; emails: string[] };
  reason: string;
};

function suspectedDuplicates(clusters: Cluster[]): Suspect[] {
  const suppressed = new Set<string>();
  for (const [a, b] of DO_NOT_MERGE) suppressed.add([a, b].sort().join("|"));
  const inGroup = (c: Cluster, id: string) => c.authIds.includes(id);

  const out: Suspect[] = [];
  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const a = clusters[i];
      const b = clusters[j];
      if (
        DO_NOT_MERGE.some(
          ([x, y]) => (inGroup(a, x) && inGroup(b, y)) || (inGroup(a, y) && inGroup(b, x))
        )
      ) {
        continue;
      }
      let reason: string | null = null;
      outer: for (const na of a.names) {
        for (const nb of b.names) {
          if (levenshtein(normName(na), normName(nb)) <= 2) {
            reason = `names "${na}" ~ "${nb}"`;
            break outer;
          }
        }
      }
      if (!reason) {
        outer: for (const ea of a.emails) {
          for (const eb of b.emails) {
            const la = ea.split("@")[0];
            const lb = eb.split("@")[0];
            if (la === lb) {
              reason = `same e-mail local part "${la}"`;
              break outer;
            }
            if (
              la.length >= 6 &&
              lb.length >= 6 &&
              levenshtein(la, lb) <= 2 &&
              levenshtein(surnameOf(a.names[0]), surnameOf(b.names[0])) <= 2
            ) {
              reason = `similar e-mails "${ea}" ~ "${eb}"`;
              break outer;
            }
          }
        }
      }
      if (reason) {
        out.push({
          a: { key: a.key, name: a.names[0], emails: a.emails },
          b: { key: b.key, name: b.names[0], emails: b.emails },
          reason,
        });
      }
    }
  }
  return out;
}

/**
 * Addresses whose domain is a near-miss of a generic mail provider (typo
 * watchlist). Institutional domains are deliberately not checked — Greek
 * academic domains are short and legitimately close to one another.
 */
function typoDomainWatchlist(clusters: Cluster[]): { email: string; near: string }[] {
  const COMMON = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
  const out: { email: string; near: string }[] = [];
  const seen = new Set<string>();
  for (const c of clusters) {
    for (const email of c.emails) {
      if (seen.has(email)) continue;
      seen.add(email);
      const domain = email.split("@")[1] ?? "";
      for (const common of COMMON) {
        if (domain !== common && levenshtein(domain, common) <= 2) {
          out.push({ email, near: common });
          break;
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

function opTouches(op: Op): { table: string; id: string } | null {
  switch (op.kind) {
    case "fix_person_email":
    case "delete_person":
      return { table: "people_conference2026", id: op.person_id };
    case "repoint_claim_link":
    case "repoint_claim_person":
      return { table: "author_claims_conference2026", id: op.claim_id };
    case "delete_author_link":
    case "repoint_author_link":
      return { table: "abstract_authors_conference2026", id: op.link_id };
    case "repoint_registration":
      return { table: "registrations_conference2026", id: op.registration_id };
    case "update_alias":
      return { table: "person_emails_conference2026", id: op.alias_id };
    case "insert_alias":
      return null; // no pre-image
  }
}

async function writeBackup(allOps: Op[], supabase: SupabaseLike): Promise<string> {
  const byTable = new Map<string, Set<string>>();
  for (const op of allOps) {
    const touch = opTouches(op);
    if (!touch) continue;
    let set = byTable.get(touch.table);
    if (!set) byTable.set(touch.table, (set = new Set()));
    set.add(touch.id);
  }
  const preImages: Record<string, unknown[]> = {};
  for (const [table, ids] of byTable) {
    const rows: unknown[] = [];
    const idList = [...ids];
    for (let i = 0; i < idList.length; i += 200) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .in("id", idList.slice(i, i + 200));
      if (error) fail(`backup fetch for ${table} failed: ${error.message}`);
      rows.push(...(data ?? []));
    }
    preImages[table] = rows;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = resolve(__dirname, `reconcile-backup-${stamp}.json`);
  writeFileSync(
    path,
    JSON.stringify({ generated_at: new Date().toISOString(), pre_images: preImages, ops: allOps }, null, 2)
  );
  return path;
}

async function applyOp(op: Op, supabase: SupabaseLike): Promise<void> {
  const run = async (q: Promise<{ error: { message: string } | null }>) => {
    const { error } = await q;
    if (error) fail(`${op.kind} failed (${JSON.stringify(op)}): ${error.message}`);
  };
  switch (op.kind) {
    case "fix_person_email":
      return run(
        supabase.from("people_conference2026").update({ email: op.to }).eq("id", op.person_id)
      );
    case "repoint_claim_link":
      return run(
        supabase
          .from("author_claims_conference2026")
          .update({ abstract_author_id: op.to_link_id })
          .eq("id", op.claim_id)
      );
    case "delete_author_link":
      return run(
        supabase.from("abstract_authors_conference2026").delete().eq("id", op.link_id)
      );
    case "repoint_author_link":
      return run(
        supabase
          .from("abstract_authors_conference2026")
          .update({ person_id: op.to_person_id })
          .eq("id", op.link_id)
      );
    case "repoint_claim_person":
      return run(
        supabase
          .from("author_claims_conference2026")
          .update({ person_id: op.to_person_id })
          .eq("id", op.claim_id)
      );
    case "repoint_registration":
      return run(
        supabase
          .from("registrations_conference2026")
          .update({ person_id: op.to_person_id })
          .eq("id", op.registration_id)
      );
    case "update_alias":
      return run(
        supabase.from("person_emails_conference2026").update(op.set).eq("id", op.alias_id)
      );
    case "insert_alias":
      return run(supabase.from("person_emails_conference2026").insert(op.row));
    case "delete_person":
      return run(supabase.from("people_conference2026").delete().eq("id", op.person_id));
  }
}

async function execute(plan: Plan, supabase: SupabaseLike): Promise<void> {
  for (const op of plan.emailFixOps) await applyOp(op, supabase);

  for (const cp of plan.clusterPlans) {
    // Safety: nothing may still reference the rows we are about to delete.
    const mergedIds = cp.merged.map((p) => p.id);
    const deletes = cp.ops.filter((o) => o.kind === "delete_person");
    for (const op of cp.ops) {
      if (op.kind === "delete_person") continue;
      await applyOp(op, supabase);
    }
    if (deletes.length > 0) {
      for (const [table, column] of [
        ["person_emails_conference2026", "person_id"],
        ["abstract_authors_conference2026", "person_id"],
        ["author_claims_conference2026", "person_id"],
        ["registrations_conference2026", "person_id"],
      ] as const) {
        const { data, error } = await supabase
          .from(table)
          .select("id")
          .in(column, mergedIds);
        if (error) fail(`pre-delete check on ${table} failed: ${error.message}`);
        if ((data ?? []).length > 0) {
          fail(
            `pre-delete check: ${table} still references merged persons of cluster ${cp.cluster.key}`
          );
        }
      }
      for (const op of deletes) await applyOp(op, supabase);
    }
    console.log(
      `  ✓ ${cp.cluster.key} (${cp.cluster.names[0]}): ${cp.ops.length} ops, ` +
        `${cp.merged.length} row(s) merged into ${cp.canonical.id}`
    );
  }
}

async function verifyApply(plan: Plan, pre: DbState, supabase: SupabaseLike): Promise<void> {
  console.log("\nVerifying…");
  const post = await loadDbState(supabase);
  const deleted = plan.clusterPlans.reduce((n, cp) => n + cp.merged.length, 0);
  const deletedLinks = plan.clusterPlans.reduce(
    (n, cp) => n + cp.ops.filter((o) => o.kind === "delete_author_link").length,
    0
  );
  const checks: [string, number, number][] = [
    ["people", pre.people.length - deleted, post.people.length],
    ["author links", pre.links.length - deletedLinks, post.links.length],
    ["registrations", pre.registrations.length, post.registrations.length],
    ["claims", pre.claims.length, post.claims.length],
    [
      "auth-linked people",
      pre.people.filter((p) => p.auth_user_id).length,
      post.people.filter((p) => p.auth_user_id).length,
    ],
  ];
  let ok = true;
  for (const [label, expected, actual] of checks) {
    const marker = expected === actual ? "✓" : "⚠";
    if (expected !== actual) ok = false;
    console.log(`  ${marker} ${label}: ${actual} (expected ${expected})`);
  }

  const postAlias = new Map(post.aliases.map((a) => [a.email, a]));
  const postLinksByPerson = new Map<string, Set<string>>();
  for (const l of post.links) {
    let set = postLinksByPerson.get(l.person_id);
    if (!set) postLinksByPerson.set(l.person_id, (set = new Set()));
    set.add(l.abstract_id);
  }
  const preLinksByPerson = new Map<string, Set<string>>();
  for (const l of pre.links) {
    let set = preLinksByPerson.get(l.person_id);
    if (!set) preLinksByPerson.set(l.person_id, (set = new Set()));
    set.add(l.abstract_id);
  }
  for (const cp of plan.clusterPlans) {
    const canonicalLinks = postLinksByPerson.get(cp.canonical.id) ?? new Set();
    const preUnion = new Set<string>();
    for (const p of [cp.canonical, ...cp.merged]) {
      for (const a of preLinksByPerson.get(p.id) ?? []) preUnion.add(a);
    }
    for (const abstractId of preUnion) {
      if (!canonicalLinks.has(abstractId)) {
        ok = false;
        console.log(`  ⚠ ${cp.cluster.key}: abstract ${abstractId} lost during merge`);
      }
    }
    for (const op of cp.ops) {
      if (op.kind === "insert_alias" || op.kind === "update_alias") {
        const email = op.kind === "insert_alias" ? op.row.email : op.set.email;
        if (!email) continue;
        const alias = postAlias.get(email);
        if (!alias || alias.person_id !== cp.canonical.id) {
          ok = false;
          console.log(`  ⚠ ${cp.cluster.key}: alias ${email} does not resolve to the canonical`);
        }
      }
    }
  }

  // Every abstract touched by a link deletion still has a submitter link.
  const touchedAbstracts = new Set<string>();
  const preLinkById = new Map(pre.links.map((l) => [l.id, l]));
  for (const cp of plan.clusterPlans) {
    for (const op of cp.ops) {
      if (op.kind === "delete_author_link") {
        const link = preLinkById.get(op.link_id);
        if (link) touchedAbstracts.add(link.abstract_id);
      }
    }
  }
  const submitterByAbstract = new Set(
    post.links.filter((l) => l.is_submitter).map((l) => l.abstract_id)
  );
  for (const abstractId of touchedAbstracts) {
    if (!submitterByAbstract.has(abstractId)) {
      ok = false;
      console.log(`  ⚠ abstract ${abstractId} has no submitter link left`);
    }
  }

  console.log(ok ? "  ✓ all verification checks passed" : "  ⚠ VERIFICATION FAILED — inspect above");
  if (!ok) process.exit(1);
}

// ---------------------------------------------------------------------------
// SQL emission (--emit-sql): ordered statements in one transaction
// ---------------------------------------------------------------------------

function sqlLit(v: string | number | boolean | null): string {
  if (v === null) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${v.replace(/'/g, "''")}'`;
}

function opToSql(op: Op): string {
  switch (op.kind) {
    case "fix_person_email":
      return `update public.people_conference2026 set email = ${sqlLit(op.to)} where id = ${sqlLit(op.person_id)};`;
    case "repoint_claim_link":
      return `update public.author_claims_conference2026 set abstract_author_id = ${sqlLit(op.to_link_id)} where id = ${sqlLit(op.claim_id)};`;
    case "delete_author_link":
      return `delete from public.abstract_authors_conference2026 where id = ${sqlLit(op.link_id)};`;
    case "repoint_author_link":
      return `update public.abstract_authors_conference2026 set person_id = ${sqlLit(op.to_person_id)} where id = ${sqlLit(op.link_id)};`;
    case "repoint_claim_person":
      return `update public.author_claims_conference2026 set person_id = ${sqlLit(op.to_person_id)} where id = ${sqlLit(op.claim_id)};`;
    case "repoint_registration":
      return `update public.registrations_conference2026 set person_id = ${sqlLit(op.to_person_id)} where id = ${sqlLit(op.registration_id)};`;
    case "update_alias": {
      const sets = Object.entries(op.set)
        .map(([k, v]) => `${k} = ${sqlLit(v as string | boolean)}`)
        .join(", ");
      return `update public.person_emails_conference2026 set ${sets} where id = ${sqlLit(op.alias_id)};`;
    }
    case "insert_alias":
      return (
        `insert into public.person_emails_conference2026 (id, person_id, email, is_primary, source)\n` +
        `values (${sqlLit(op.row.id)}, ${sqlLit(op.row.person_id)}, ${sqlLit(op.row.email)}, ${sqlLit(op.row.is_primary)}, ${sqlLit(op.row.source)})\n` +
        `on conflict (email) do nothing;`
      );
    case "delete_person":
      return `delete from public.people_conference2026 where id = ${sqlLit(op.person_id)};`;
  }
}

function emitSql(allOps: Op[]): void {
  const path = resolve(__dirname, "reconcile-data-01.sql");
  const body = [
    "-- Generated by reconcile-authors.ts --emit-sql — a snapshot of the live DB",
    "-- state at generation time. Run promptly and in one go.",
    "begin;",
    ...allOps.map(opToSql),
    "commit;",
  ].join("\n");
  writeFileSync(path, body + "\n");
  console.log(`  wrote ${path} (${Math.round(Buffer.byteLength(body, "utf8") / 1024)} KB)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const rows = parseSheet();
  const authIds = new Set(rows.map((r) => r.auth_id));
  const codes = new Set(rows.map((r) => r.code));
  if (rows.length !== EXPECTED.sheetRows) {
    fail(`Sheet has ${rows.length} author rows, expected ${EXPECTED.sheetRows}`);
  }
  if (authIds.size !== EXPECTED.authIds) {
    fail(`Sheet has ${authIds.size} Auth_IDs, expected ${EXPECTED.authIds}`);
  }
  if (codes.size !== EXPECTED.codes) {
    fail(`Sheet has ${codes.size} Id_Subs, expected ${EXPECTED.codes}`);
  }
  const malformedCells = rows.filter((r) => r.malformed);
  const noEmailRows = rows.filter((r) => !r.email && !r.malformed);
  if (malformedCells.length !== EXPECTED_SOFT.malformedCells) {
    console.warn(`⚠ ${malformedCells.length} malformed e-mail cells (expected ${EXPECTED_SOFT.malformedCells})`);
  }
  if (noEmailRows.length !== EXPECTED_SOFT.noEmailRows) {
    console.warn(`⚠ ${noEmailRows.length} rows without e-mail (expected ${EXPECTED_SOFT.noEmailRows})`);
  }

  const clusters = buildClusters(rows);
  const multiEmail = clusters.filter((c) => c.emails.length > 1);
  if (multiEmail.length < EXPECTED_SOFT.multiEmailAuthIds - 5) {
    console.warn(
      `⚠ only ${multiEmail.length} multi-e-mail clusters (expected ≈${EXPECTED_SOFT.multiEmailAuthIds}+)`
    );
  }

  // DB connection is needed even for the dry run — the plan is a diff.
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (.env.local)");
  }
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as SupabaseLike;

  const db = await loadDbState(supabase);
  const codeSet = new Set(db.abstracts.map((a) => a.code));
  const sheetCodesMissing = [...codes].filter((c) => !codeSet.has(c)).sort();
  if (sheetCodesMissing.length > 0) {
    fail(`Sheet Id_Subs missing from the DB: ${sheetCodesMissing.join(", ")}`);
  }
  const dbOnlyAbstracts = db.abstracts
    .filter((a) => !codes.has(a.code))
    .map((a) => a.code)
    .sort();

  const plan = buildPlan(clusters, db);
  const suspects = suspectedDuplicates(clusters);
  const watchlist = typoDomainWatchlist(clusters);

  const allOps = [...plan.emailFixOps, ...plan.clusterPlans.flatMap((cp) => cp.ops)];
  const opCounts: Record<string, number> = {};
  for (const op of allOps) opCounts[op.kind] = (opCounts[op.kind] ?? 0) + 1;

  const report = {
    generated_at: new Date().toISOString(),
    mode: APPLY ? "apply" : EMIT_SQL ? "emit-sql" : "dry-run",
    counts: {
      sheet_rows: rows.length,
      auth_ids: authIds.size,
      clusters: clusters.length,
      multi_email_clusters: multiEmail.length,
      clusters_merging: plan.clusterPlans.filter((cp) => cp.merged.length > 0).length,
      people_to_delete: plan.clusterPlans.reduce((n, cp) => n + cp.merged.length, 0),
      conflicts_skipped: plan.conflicts.length,
      unmatched_clusters: plan.unmatched.length,
      suspected_duplicates: suspects.length,
      ops: opCounts,
      ops_total: allOps.length,
    },
    merges: plan.clusterPlans
      .filter((cp) => cp.merged.length > 0)
      .map((cp) => ({
        cluster: cp.cluster.key,
        auth_ids: cp.cluster.authIds,
        name: cp.cluster.names[0],
        name_variants: cp.cluster.names.slice(1),
        emails: cp.cluster.emails,
        canonical: { id: cp.canonical.id, email: cp.canonical.email },
        merged: cp.merged.map((p) => ({ id: p.id, email: p.email, needs_review: p.needs_review })),
        abstracts: [...cp.cluster.codes].sort(),
      })),
    alias_only_clusters: plan.clusterPlans
      .filter((cp) => cp.merged.length === 0)
      .map((cp) => ({ cluster: cp.cluster.key, name: cp.cluster.names[0], ops: cp.ops })),
    email_fixes: plan.emailFixOps,
    conflicts: plan.conflicts,
    unmatched_clusters: plan.unmatched,
    shared_email_guard_hits: plan.sharedEmailGuardHits,
    malformed_email_cells: malformedCells.map((r) => ({
      auth_id: r.auth_id,
      code: r.code,
      raw: r.raw_email,
      extracted: r.email,
    })),
    no_email_rows: noEmailRows.map((r) => ({ auth_id: r.auth_id, name: r.name, code: r.code })),
    db_abstracts_not_in_sheet: dbOnlyAbstracts,
    suspected_duplicates: suspects,
    typo_domain_watchlist: watchlist,
  };

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${REPORT_PATH}`);
  console.log(JSON.stringify(report.counts, null, 2));
  if (plan.conflicts.length > 0) {
    console.log(`Conflicts (skipped, need a human): ${plan.conflicts.map((c) => `${c.key} ${c.names[0]} — ${c.reason}`).join("; ")}`);
  }
  console.log(`Suspected duplicates to review: ${suspects.length} (see report)`);

  if (EMIT_SQL) {
    emitSql(allOps);
    return;
  }
  if (!APPLY) {
    console.log("\nDry run — nothing written. Re-run with --apply to reconcile.");
    return;
  }
  if (allOps.length === 0) {
    console.log("\nNothing to do — already reconciled.");
    return;
  }

  const backupPath = await writeBackup(allOps, supabase);
  console.log(`\nBackup written to ${backupPath}`);
  console.log("Applying…");
  await execute(plan, supabase);
  await verifyApply(plan, db, supabase);
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
