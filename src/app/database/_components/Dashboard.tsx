"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTable } from "./DataTable";
import { DetailDialog } from "./DetailDialog";
import {
  exportXlsxUrl,
  exportZipUrl,
  fetchConference2026Data,
  fetchDashboardData,
  logout,
} from "../_lib/api";
import {
  c26AbstractsColumns,
  c26ClaimsColumns,
  c26PeopleColumns,
  c26ReceiptsColumns,
  c26RegistrationsColumns,
  conferenceAbstractsColumns,
  conferenceReceiptsColumns,
  conferenceSessionsColumns,
  membershipReceiptsColumns,
  membershipRegistrationsColumns,
  type Abstract2026Row,
  type Claim2026Row,
  type Person2026Row,
  type Receipt2026Row,
} from "../_lib/columns";
import { formatDateTime, formatOrganizer, fullName, humanBool } from "../_lib/format";
import { ReceiptStatusForm } from "./ReceiptStatusForm";
import { ClaimDecisionForm } from "./ClaimDecisionForm";
import type {
  Abstract,
  Conference2026Data,
  DashboardData,
  ExportTableKey,
  MembershipApplication,
  PaymentReceipt,
  RegistrationConference2026,
  SectionKey,
  TabKey,
  ThematicSessionSubmission,
} from "../_lib/types";

type SelectedRow =
  | { kind: "membership-registration"; row: MembershipApplication }
  | { kind: "membership-receipt"; row: PaymentReceipt }
  | { kind: "conference-session"; row: ThematicSessionSubmission }
  | { kind: "conference-abstract"; row: Abstract }
  | { kind: "conference-receipt"; row: PaymentReceipt }
  | { kind: "c26-registration"; row: RegistrationConference2026 }
  | { kind: "c26-receipt"; row: Receipt2026Row }
  | { kind: "c26-person"; row: Person2026Row }
  | { kind: "c26-abstract"; row: Abstract2026Row }
  | { kind: "c26-claim"; row: Claim2026Row };

const SECTION_LABEL: Record<SectionKey, string> = {
  membership: "HGS Membership",
  conference: "2026 Submissions",
  conference2026: "2026 Registration",
};

const TABS_BY_SECTION: Record<SectionKey, { key: TabKey; label: string }[]> = {
  membership: [
    { key: "membership-registrations", label: "Registrations" },
    { key: "membership-receipts", label: "Receipts" },
  ],
  conference: [
    { key: "conference-sessions", label: "Thematic Sessions" },
    { key: "conference-abstracts", label: "Abstracts" },
    { key: "conference-receipts", label: "Receipts" },
  ],
  conference2026: [
    { key: "c26-registrations", label: "Registrations" },
    { key: "c26-receipts", label: "Receipts" },
    { key: "c26-claims", label: "Claims" },
    { key: "c26-abstracts", label: "Abstracts" },
    { key: "c26-people", label: "People" },
  ],
};

const TAB_EXPORT_TABLE: Record<TabKey, ExportTableKey> = {
  "membership-registrations": "membership_applications",
  "membership-receipts": "payment_receipts_membership",
  "conference-sessions": "thematic_session_submissions_2026",
  "conference-abstracts": "abstracts",
  "conference-receipts": "payment_receipts_conference",
  "c26-registrations": "registrations_conference2026",
  "c26-receipts": "payment_receipts_conference2026",
  "c26-claims": "author_claims_conference2026",
  "c26-abstracts": "abstracts_conference2026",
  "c26-people": "people_conference2026",
};

export function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [data2026, setData2026] = useState<Conference2026Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<SectionKey>("membership");
  const [tab, setTab] = useState<TabKey>("membership-registrations");
  const [selected, setSelected] = useState<SelectedRow | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const d = await fetchDashboardData();
      setData(d);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load data";
      setError(msg);
      if (msg === "Unauthorized" || msg === "HTTP 401") {
        router.replace("/database/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  const load2026 = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const d = await fetchConference2026Data();
      setData2026(d);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load data";
      setError(msg);
      if (msg === "Unauthorized" || msg === "HTTP 401") {
        router.replace("/database/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  function switchSection(next: SectionKey) {
    if (next === section) return;
    setSection(next);
    setTab(TABS_BY_SECTION[next][0].key);
    // Registration-phase data is fetched lazily on first open.
    if (next === "conference2026" && !data2026) void load2026();
  }

  function refresh() {
    if (section === "conference2026") void load2026(true);
    else void load(true);
  }

  async function handleLogout() {
    await logout();
    router.replace("/database/login");
    router.refresh();
  }

  const tabsForSection = TABS_BY_SECTION[section];

  // Registration-phase rows enriched with joins from sibling tables.
  const c26 = useMemo(() => {
    if (!data2026) return null;
    const regById = new Map(data2026.registrations.map((r) => [r.id, r]));
    const regByUser = new Map(data2026.registrations.map((r) => [r.user_id, r]));
    const abstractById = new Map(data2026.abstracts.map((a) => [a.id, a]));

    const authorsByAbstract = new Map<string, typeof data2026.authors>();
    const abstractCountByPerson = new Map<string, number>();
    for (const author of data2026.authors) {
      const list = authorsByAbstract.get(author.abstract_id) ?? [];
      list.push(author);
      authorsByAbstract.set(author.abstract_id, list);
      abstractCountByPerson.set(
        author.person_id,
        (abstractCountByPerson.get(author.person_id) ?? 0) + 1,
      );
    }

    const receipts: Receipt2026Row[] = data2026.receipts.map((r) => ({
      ...r,
      email: regById.get(r.registration_id)?.email ?? "—",
    }));
    const claims: Claim2026Row[] = data2026.claims.map((c) => ({
      ...c,
      email: regByUser.get(c.user_id)?.email ?? "—",
      abstract_title: abstractById.get(c.abstract_id)?.title ?? "—",
    }));
    const people: Person2026Row[] = data2026.people.map((p) => ({
      ...p,
      abstract_count: abstractCountByPerson.get(p.id) ?? 0,
    }));
    const abstracts: Abstract2026Row[] = data2026.abstracts.map((a) => {
      const authors = [...(authorsByAbstract.get(a.id) ?? [])].sort(
        (x, y) => x.author_order - y.author_order,
      );
      return {
        ...a,
        submitter_name:
          authors.find((x) => x.is_submitter)?.name_as_listed ?? "—",
        author_count: authors.length,
        authors_display: authors
          .map(
            (x) =>
              `${x.is_submitter ? "Author" : "Co-author"}: ${x.name_as_listed}${x.affiliation_as_listed ? ` (${x.affiliation_as_listed})` : ""}`,
          )
          .join("\n"),
      };
    });

    return { registrations: data2026.registrations, receipts, claims, people, abstracts };
  }, [data2026]);

  const activeTable = useMemo(() => {
    const rowClick = <T,>(row: T, kind: SelectedRow["kind"]) => {
      setSelected({ kind, row } as SelectedRow);
    };

    if (tab.startsWith("c26-")) {
      if (!c26) return null;
      switch (tab) {
        case "c26-registrations":
          return (
            <DataTable<RegistrationConference2026>
              columns={c26RegistrationsColumns}
              rows={c26.registrations}
              rowKey={(r) => r.id}
              searchable={(r) =>
                `${r.first_name} ${r.last_name} ${r.email} ${r.affiliation} ${r.country} ${r.registration_type}`
              }
              onRowClick={(r) => rowClick(r, "c26-registration")}
              emptyMessage="No registrations yet."
            />
          );
        case "c26-receipts":
          return (
            <DataTable<Receipt2026Row>
              columns={c26ReceiptsColumns}
              rows={c26.receipts}
              rowKey={(r) => r.id}
              searchable={(r) =>
                `${r.email} ${r.receipt_kind} ${r.status} ${r.file_name ?? ""} ${r.user_notes ?? ""} ${r.admin_notes ?? ""}`
              }
              onRowClick={(r) => rowClick(r, "c26-receipt")}
              emptyMessage="No receipts yet."
            />
          );
        case "c26-claims":
          return (
            <DataTable<Claim2026Row>
              columns={c26ClaimsColumns}
              rows={c26.claims}
              rowKey={(r) => r.id}
              searchable={(r) =>
                `${r.claimed_name} ${r.email} ${r.abstract_title} ${r.status}`
              }
              onRowClick={(r) => rowClick(r, "c26-claim")}
              emptyMessage="No authorship claims."
            />
          );
        case "c26-abstracts":
          return (
            <DataTable<Abstract2026Row>
              columns={c26AbstractsColumns}
              rows={c26.abstracts}
              rowKey={(r) => r.id}
              searchable={(r) =>
                `${r.code} ${r.title} ${r.session_label} ${r.evaluation} ${r.submitter_name} ${r.authors_display}`
              }
              onRowClick={(r) => rowClick(r, "c26-abstract")}
              emptyMessage="No abstracts imported yet."
            />
          );
        case "c26-people":
          return (
            <DataTable<Person2026Row>
              columns={c26PeopleColumns}
              rows={c26.people}
              rowKey={(r) => r.id}
              searchable={(r) =>
                `${r.full_name} ${r.email ?? ""} ${r.affiliation ?? ""} ${r.source}`
              }
              onRowClick={(r) => rowClick(r, "c26-person")}
              emptyMessage="No people imported yet."
            />
          );
      }
    }

    if (!data) return null;

    switch (tab) {
      case "membership-registrations": {
        const rows = data.membership.registrations;
        return (
          <DataTable<MembershipApplication>
            columns={membershipRegistrationsColumns}
            rows={rows}
            rowKey={(r) => `${r.email}-${r.created_at}`}
            searchable={(r) =>
              `${r.first_name} ${r.last_name} ${r.email} ${r.affiliation ?? ""} ${r.country ?? ""} ${r.role ?? ""}`
            }
            onRowClick={(r) => rowClick(r, "membership-registration")}
            emptyMessage="No membership applications yet."
          />
        );
      }
      case "membership-receipts": {
        const rows = data.membership.receipts;
        return (
          <DataTable<PaymentReceipt>
            columns={membershipReceiptsColumns}
            rows={rows}
            rowKey={(r) => `${r.email}-${r.file_path}-${r.created_at}`}
            searchable={(r) => `${r.email} ${r.notes ?? ""} ${r.file_path}`}
            onRowClick={(r) => rowClick(r, "membership-receipt")}
            emptyMessage="No membership receipts yet."
          />
        );
      }
      case "conference-sessions": {
        const rows = data.conference.sessions;
        return (
          <DataTable<ThematicSessionSubmission>
            columns={conferenceSessionsColumns}
            rows={rows}
            rowKey={(r) => `${r.session_title}-${r.created_at}`}
            searchable={(r) =>
              `${r.session_title} ${r.session_topic} ${formatOrganizer(r.organizer_primary)} ${(r.session_keywords ?? []).join(" ")}`
            }
            onRowClick={(r) => rowClick(r, "conference-session")}
            emptyMessage="No thematic session submissions."
          />
        );
      }
      case "conference-abstracts": {
        const rows = data.conference.abstracts;
        return (
          <DataTable<Abstract>
            columns={conferenceAbstractsColumns}
            rows={rows}
            rowKey={(r) => `${r.email}-${r.title}-${r.created_at}`}
            searchable={(r) =>
              `${r.title} ${r.first_name} ${r.last_name} ${r.email} ${r.affiliation} ${r.session} ${r.co_authors ?? ""}`
            }
            onRowClick={(r) => rowClick(r, "conference-abstract")}
            emptyMessage="No abstracts yet."
          />
        );
      }
      case "conference-receipts": {
        const rows = data.conference.receipts;
        return (
          <DataTable<PaymentReceipt>
            columns={conferenceReceiptsColumns}
            rows={rows}
            rowKey={(r) => `${r.email}-${r.file_path}-${r.created_at}`}
            searchable={(r) => `${r.email} ${r.notes ?? ""} ${r.file_path}`}
            onRowClick={(r) => rowClick(r, "conference-receipt")}
            emptyMessage="No conference receipts yet."
          />
        );
      }
    }
  }, [data, c26, tab]);

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/en" className="flex items-center gap-2 shrink-0" aria-label="HGS home">
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="hidden font-semibold tracking-tight sm:inline">HGS Database</span>
          </Link>

          <nav className="ml-2 flex-1 overflow-x-auto" aria-label="Section">
            <div className="inline-flex rounded-full border border-black/10 bg-neutral-50 p-1">
              {(Object.keys(SECTION_LABEL) as SectionKey[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => switchSection(s)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm sm:px-4",
                    section === s
                      ? "bg-primary text-primary-foreground"
                      : "text-black/70 hover:text-black",
                  )}
                  aria-pressed={section === s}
                >
                  {SECTION_LABEL[s]}
                </button>
              ))}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={refreshing}
              className="hidden sm:inline-flex"
            >
              {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">Refresh</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Tab strip + section-level export */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-1.5" role="tablist">
            {tabsForSection.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                  tab === t.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-black/10 bg-white text-black/70 hover:border-black/20 hover:text-black",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={exportXlsxUrl(TAB_EXPORT_TABLE[tab])} download>
                <FileSpreadsheet className="h-3.5 w-3.5" /> Export Excel
              </a>
            </Button>
            <Button asChild size="sm">
              <a href={exportZipUrl(section)} download>
                <Download className="h-3.5 w-3.5" /> Download ZIP
              </a>
            </Button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {activeTable}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <DetailDialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        {...(selected ? detailProps(selected) : emptyDetailProps())}
        actions={
          selected?.kind === "c26-receipt" ? (
            <ReceiptStatusForm
              receipt={selected.row}
              onSaved={() => {
                setSelected(null);
                void load2026(true);
              }}
            />
          ) : selected?.kind === "c26-claim" ? (
            <ClaimDecisionForm
              claim={selected.row}
              onSaved={() => {
                setSelected(null);
                void load2026(true);
              }}
            />
          ) : undefined
        }
      />
    </>
  );
}

function emptyDetailProps() {
  return { title: "", fields: [] };
}

function detailProps(sel: SelectedRow): {
  title: string;
  subtitle?: string;
  fields: Array<{ label: string; value: unknown }>;
  files?: Array<{
    bucket: "membership-receipts" | "payment-receipts" | "payment-receipts-conference2026";
    path: string;
    label?: string;
  }>;
} {
  switch (sel.kind) {
    case "c26-registration": {
      const r = sel.row;
      return {
        title: fullName(r.first_name, r.last_name),
        subtitle: r.email,
        fields: [
          { label: "Email", value: r.email },
          { label: "Registration type", value: r.fee_label },
          { label: "Fee", value: `€${Number(r.fee_amount_eur).toFixed(2)}` },
          { label: "Affiliation", value: r.affiliation },
          { label: "Country", value: r.country },
          { label: "GDPR consent", value: humanBool(r.gdpr_consent) },
          { label: "Mailing consent", value: humanBool(r.mailing_consent) },
          { label: "Registered", value: formatDateTime(r.created_at) },
        ],
      };
    }
    case "c26-receipt": {
      const r = sel.row;
      return {
        title: "Payment receipt (2026)",
        subtitle: r.email,
        fields: [
          { label: "Email", value: r.email },
          { label: "Kind", value: r.receipt_kind === "conference" ? "Conference" : "HGS Membership" },
          { label: "Status", value: r.status },
          { label: "User notes", value: r.user_notes },
          { label: "Admin notes", value: r.admin_notes },
          { label: "Status updated", value: r.status_updated_at ? formatDateTime(r.status_updated_at) : null },
          { label: "Uploaded", value: formatDateTime(r.created_at) },
        ],
        files: [
          {
            bucket: "payment-receipts-conference2026",
            path: r.file_path,
            label: r.file_name ?? r.file_path.split("/").pop(),
          },
        ],
      };
    }
    case "c26-person": {
      const r = sel.row;
      return {
        title: r.full_name,
        subtitle: r.email ?? "no e-mail on record",
        fields: [
          { label: "Email", value: r.email },
          { label: "First name", value: r.first_name },
          { label: "Last name", value: r.last_name },
          { label: "Affiliation", value: r.affiliation },
          { label: "Source", value: r.source === "import" ? "Imported from submissions" : "Created at signup" },
          { label: "Has account", value: humanBool(Boolean(r.auth_user_id)) },
          { label: "Abstracts", value: r.abstract_count },
          { label: "Needs review", value: humanBool(r.needs_review) },
          { label: "Review note", value: r.review_note },
        ],
      };
    }
    case "c26-abstract": {
      const r = sel.row;
      return {
        title: r.title,
        subtitle: `${r.code} · ${r.submitter_name}`,
        fields: [
          { label: "Code", value: r.code },
          {
            label: "Evaluation",
            value:
              r.evaluation === "reassigned"
                ? "Accepted (reassigned)"
                : r.evaluation === "accepted"
                  ? "Accepted"
                  : "Not evaluated",
          },
          { label: "Session (final)", value: r.session_label },
          {
            label: "Session (as submitted)",
            value: r.session_original && r.session_original !== r.session_label ? r.session_original : null,
          },
          { label: "Authors", value: r.authors_display },
          { label: "Abstract", value: r.abstract_text },
        ],
      };
    }
    case "c26-claim": {
      const r = sel.row;
      return {
        title: `Claim by ${r.claimed_name}`,
        subtitle: r.email,
        fields: [
          { label: "Claimant email", value: r.email },
          { label: "Claimed name", value: r.claimed_name },
          { label: "Abstract", value: r.abstract_title },
          { label: "Message", value: r.message },
          { label: "Status", value: r.status },
          { label: "Admin note", value: r.admin_note },
          { label: "Decided", value: r.decided_at ? formatDateTime(r.decided_at) : null },
          { label: "Submitted", value: formatDateTime(r.created_at) },
        ],
      };
    }
    case "membership-registration": {
      const r = sel.row;
      return {
        title: fullName(r.first_name, r.last_name),
        subtitle: r.email,
        fields: [
          { label: "Email", value: r.email },
          { label: "Member type", value: r.member_type === "research_staff" ? "Research staff" : r.member_type === "student" ? "Student" : r.member_type },
          { label: "Role", value: r.role },
          { label: "Degree", value: r.degree },
          { label: "Affiliation", value: r.affiliation },
          { label: "Country", value: r.country },
          { label: "GDPR consent", value: humanBool(r.gdpr_consent) },
          { label: "Mailing consent", value: humanBool(r.mailing_consent) },
          { label: "Submitted", value: formatDateTime(r.created_at) },
        ],
        files: r.receipt_path
          ? [{ bucket: "membership-receipts", path: r.receipt_path, label: "Membership receipt" }]
          : undefined,
      };
    }
    case "membership-receipt":
    case "conference-receipt": {
      const r = sel.row;
      return {
        title: "Payment receipt",
        subtitle: r.email,
        fields: [
          { label: "Email", value: r.email },
          { label: "Type", value: r.receipt_type === "hgs_membership" ? "HGS Membership" : r.receipt_type === "conference" ? "Conference 2026" : r.receipt_type },
          { label: "Notes", value: r.notes },
          { label: "Submitted", value: formatDateTime(r.created_at) },
        ],
        files: [{ bucket: "payment-receipts", path: r.file_path, label: r.file_path.split("/").pop() }],
      };
    }
    case "conference-session": {
      const r = sel.row;
      return {
        title: r.session_title,
        subtitle: r.session_topic,
        fields: [
          { label: "Locale", value: r.locale?.toUpperCase() },
          { label: "Primary organizer", value: formatOrganizer(r.organizer_primary) },
          { label: "Secondary organizer", value: r.organizer_secondary ? formatOrganizer(r.organizer_secondary) : null },
          { label: "Tertiary organizer", value: r.organizer_tertiary ? formatOrganizer(r.organizer_tertiary) : null },
          { label: "Keywords", value: r.session_keywords },
          { label: "Summary", value: r.session_summary },
          { label: "Additional comments", value: r.additional_comments },
          { label: "Submitted", value: formatDateTime(r.created_at) },
        ],
      };
    }
    case "conference-abstract": {
      const r = sel.row;
      return {
        title: r.title,
        subtitle: fullName(r.first_name, r.last_name),
        fields: [
          { label: "Author", value: fullName(r.first_name, r.last_name) },
          { label: "Email", value: r.email },
          { label: "Affiliation", value: r.affiliation },
          { label: "Session", value: r.session },
          { label: "Co-authors", value: r.co_authors || null },
          { label: "Abstract", value: r.abstract_text },
          { label: "Notes", value: r.notes },
          { label: "Submitted", value: formatDateTime(r.created_at) },
        ],
      };
    }
  }
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-9 w-full max-w-sm animate-pulse rounded-lg bg-black/5" />
      <div className="rounded-xl border border-black/10 bg-white">
        <div className="divide-y divide-black/5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="grid grid-cols-6 gap-4 px-4 py-4">
              <div className="h-3 animate-pulse rounded bg-black/5 col-span-2" />
              <div className="h-3 animate-pulse rounded bg-black/5" />
              <div className="h-3 animate-pulse rounded bg-black/5" />
              <div className="h-3 animate-pulse rounded bg-black/5" />
              <div className="h-3 animate-pulse rounded bg-black/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
