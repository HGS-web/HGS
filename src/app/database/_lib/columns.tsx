import type { ReactNode } from "react";
import type {
  Abstract,
  AbstractConference2026,
  AuthorClaimConference2026,
  MembershipApplication,
  PaymentReceipt,
  PaymentReceiptConference2026,
  PersonConference2026,
  RegistrationConference2026,
  ThematicSessionSubmission,
} from "./types";
import { formatDateTime, formatOrganizer, fullName, truncate } from "./format";

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number | null | undefined;
  cell?: (row: T) => ReactNode;
  mono?: boolean;
  className?: string;
}

const dateCol = <T extends { created_at: string }>(): ColumnDef<T> => ({
  key: "created_at",
  header: "Submitted",
  accessor: (r) => r.created_at,
  cell: (r) => <span className="font-mono text-xs tabular-nums">{formatDateTime(r.created_at)}</span>,
  className: "whitespace-nowrap",
});

export const membershipRegistrationsColumns: ColumnDef<MembershipApplication>[] = [
  {
    key: "name",
    header: "Name",
    accessor: (r) => `${r.last_name} ${r.first_name}`.toLowerCase(),
    cell: (r) => <span className="font-medium">{fullName(r.first_name, r.last_name)}</span>,
  },
  {
    key: "email",
    header: "Email",
    accessor: (r) => r.email,
    mono: true,
  },
  {
    key: "member_type",
    header: "Type",
    accessor: (r) => r.member_type,
    cell: (r) => (
      <span className="inline-flex rounded-full border border-black/10 bg-secondary px-2 py-0.5 text-xs">
        {r.member_type === "research_staff" ? "Research staff" : r.member_type === "student" ? "Student" : r.member_type}
      </span>
    ),
  },
  { key: "role", header: "Role", accessor: (r) => r.role ?? "—" },
  { key: "country", header: "Country", accessor: (r) => r.country ?? "—" },
  { key: "affiliation", header: "Affiliation", accessor: (r) => r.affiliation ?? "—", cell: (r) => <span className="max-w-[14rem] truncate inline-block align-bottom">{r.affiliation ?? "—"}</span> },
  dateCol<MembershipApplication>(),
];

export const membershipReceiptsColumns: ColumnDef<PaymentReceipt>[] = [
  { key: "email", header: "Email", accessor: (r) => r.email, mono: true },
  {
    key: "file",
    header: "File",
    accessor: (r) => r.file_path,
    cell: (r) => (
      <span className="font-mono text-xs text-black/60">{r.file_path?.split("/").pop() ?? "—"}</span>
    ),
  },
  { key: "notes", header: "Notes", accessor: (r) => r.notes ?? "—", cell: (r) => <span className="max-w-[18rem] truncate inline-block align-bottom">{truncate(r.notes, 60)}</span> },
  dateCol<PaymentReceipt>(),
];

export const conferenceSessionsColumns: ColumnDef<ThematicSessionSubmission>[] = [
  {
    key: "session_title",
    header: "Title",
    accessor: (r) => r.session_title,
    cell: (r) => <span className="font-medium">{truncate(r.session_title, 70)}</span>,
  },
  {
    key: "session_topic",
    header: "Topic",
    accessor: (r) => r.session_topic,
    cell: (r) => <span className="max-w-[12rem] truncate inline-block align-bottom">{truncate(r.session_topic, 40)}</span>,
  },
  {
    key: "organizer",
    header: "Primary organizer",
    accessor: (r) => `${r.organizer_primary?.lastName ?? ""} ${r.organizer_primary?.firstName ?? ""}`.toLowerCase(),
    cell: (r) => {
      const extras = [r.organizer_secondary, r.organizer_tertiary].filter(Boolean).length;
      return (
        <span>
          {formatOrganizer(r.organizer_primary)}
          {extras > 0 && (
            <span className="ml-2 inline-flex rounded-full border border-black/10 bg-secondary px-1.5 py-0.5 text-[10px] text-black/70">
              +{extras} co-organizer{extras > 1 ? "s" : ""}
            </span>
          )}
        </span>
      );
    },
  },
  { key: "locale", header: "Locale", accessor: (r) => r.locale, className: "uppercase text-xs font-mono" },
  dateCol<ThematicSessionSubmission>(),
];

export const conferenceAbstractsColumns: ColumnDef<Abstract>[] = [
  {
    key: "title",
    header: "Title",
    accessor: (r) => r.title,
    cell: (r) => <span className="font-medium">{truncate(r.title, 70)}</span>,
  },
  {
    key: "name",
    header: "Author",
    accessor: (r) => `${r.last_name} ${r.first_name}`.toLowerCase(),
    cell: (r) => fullName(r.first_name, r.last_name),
  },
  { key: "email", header: "Email", accessor: (r) => r.email, mono: true },
  {
    key: "affiliation",
    header: "Affiliation",
    accessor: (r) => r.affiliation,
    cell: (r) => <span className="max-w-[14rem] truncate inline-block align-bottom">{r.affiliation}</span>,
  },
  {
    key: "session",
    header: "Session",
    accessor: (r) => r.session,
    cell: (r) => <span className="max-w-[12rem] truncate inline-block align-bottom text-xs text-black/70">{truncate(r.session, 40)}</span>,
  },
  dateCol<Abstract>(),
];

export const conferenceReceiptsColumns: ColumnDef<PaymentReceipt>[] = membershipReceiptsColumns;

// ---------------------------------------------------------------------------
// Registration phase (2026)
// ---------------------------------------------------------------------------

/** Rows enriched client-side with data joined from sibling tables. */
export type Receipt2026Row = PaymentReceiptConference2026 & { email: string };
export type Claim2026Row = AuthorClaimConference2026 & {
  email: string;
  abstract_title: string;
};
export type Person2026Row = PersonConference2026 & { abstract_count: number };
export type Abstract2026Row = AbstractConference2026 & {
  submitter_name: string;
  author_count: number;
  authors_display: string;
};

const STATUS_CHIP_CLASSES: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-green-200 bg-green-50 text-green-700",
  approved: "border-green-200 bg-green-50 text-green-700",
  declined: "border-red-200 bg-red-50 text-red-600",
  rejected: "border-red-200 bg-red-50 text-red-600",
  reassigned: "border-blue-200 bg-blue-50 text-blue-700",
  not_evaluated: "border-black/10 bg-black/5 text-black/50",
};

export function statusChip(status: string, label?: string): ReactNode {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${STATUS_CHIP_CLASSES[status] ?? "border-black/10 bg-black/5 text-black/60"}`}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

export const c26RegistrationsColumns: ColumnDef<RegistrationConference2026>[] = [
  {
    key: "name",
    header: "Name",
    accessor: (r) => `${r.last_name} ${r.first_name}`.toLowerCase(),
    cell: (r) => <span className="font-medium">{fullName(r.first_name, r.last_name)}</span>,
  },
  { key: "email", header: "Email", accessor: (r) => r.email, mono: true },
  {
    key: "registration_type",
    header: "Type",
    accessor: (r) => r.registration_type,
    cell: (r) => (
      <span className="inline-flex rounded-full border border-black/10 bg-secondary px-2 py-0.5 text-xs">
        {r.fee_label}
      </span>
    ),
  },
  {
    key: "fee",
    header: "Fee",
    accessor: (r) => Number(r.fee_amount_eur),
    cell: (r) => <span className="tabular-nums">€{Number(r.fee_amount_eur).toFixed(0)}</span>,
  },
  { key: "country", header: "Country", accessor: (r) => r.country },
  dateCol<RegistrationConference2026>(),
];

export const c26ReceiptsColumns: ColumnDef<Receipt2026Row>[] = [
  { key: "email", header: "Email", accessor: (r) => r.email, mono: true },
  {
    key: "kind",
    header: "Kind",
    accessor: (r) => r.receipt_kind,
    cell: (r) => (r.receipt_kind === "conference" ? "Conference" : "HGS Membership"),
  },
  {
    key: "status",
    header: "Status",
    accessor: (r) => r.status,
    cell: (r) => statusChip(r.status),
  },
  {
    key: "file",
    header: "File",
    accessor: (r) => r.file_name ?? r.file_path,
    cell: (r) => (
      <span className="font-mono text-xs text-black/60">
        {r.file_name ?? r.file_path.split("/").pop()}
      </span>
    ),
  },
  dateCol<Receipt2026Row>(),
];

export const c26PeopleColumns: ColumnDef<Person2026Row>[] = [
  {
    key: "name",
    header: "Name",
    accessor: (r) => r.full_name.toLowerCase(),
    cell: (r) => (
      <span className="font-medium">
        {r.full_name}
        {r.needs_review && (
          <span className="ml-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
            review
          </span>
        )}
      </span>
    ),
  },
  { key: "email", header: "Email", accessor: (r) => r.email ?? "—", mono: true },
  {
    key: "affiliation",
    header: "Affiliation",
    accessor: (r) => r.affiliation ?? "—",
    cell: (r) => <span className="max-w-[16rem] truncate inline-block align-bottom">{r.affiliation ?? "—"}</span>,
  },
  {
    key: "abstracts",
    header: "Abstracts",
    accessor: (r) => r.abstract_count,
    cell: (r) => <span className="tabular-nums">{r.abstract_count}</span>,
  },
  {
    key: "source",
    header: "Source",
    accessor: (r) => r.source,
    cell: (r) => (
      <span className="inline-flex rounded-full border border-black/10 bg-secondary px-2 py-0.5 text-xs">
        {r.source === "import" ? "Imported" : "Signup"}
      </span>
    ),
  },
];

export const c26AbstractsColumns: ColumnDef<Abstract2026Row>[] = [
  { key: "code", header: "Code", accessor: (r) => r.code, mono: true, className: "whitespace-nowrap" },
  {
    key: "title",
    header: "Title",
    accessor: (r) => r.title,
    cell: (r) => <span className="font-medium">{truncate(r.title, 70)}</span>,
  },
  { key: "submitter", header: "Submitter", accessor: (r) => r.submitter_name },
  {
    key: "session",
    header: "Session",
    accessor: (r) => r.session_label,
    cell: (r) => (
      <span className="max-w-[12rem] truncate inline-block align-bottom text-xs text-black/70">
        {truncate(r.session_label, 40)}
      </span>
    ),
  },
  {
    key: "evaluation",
    header: "Evaluation",
    accessor: (r) => r.evaluation,
    cell: (r) => statusChip(r.evaluation, r.evaluation === "accepted" ? "Accepted" : r.evaluation === "reassigned" ? "Accepted (reassigned)" : "Not evaluated"),
  },
  {
    key: "authors",
    header: "Authors",
    accessor: (r) => r.author_count,
    cell: (r) => <span className="tabular-nums">{r.author_count}</span>,
  },
];

export const c26ClaimsColumns: ColumnDef<Claim2026Row>[] = [
  {
    key: "claimed_name",
    header: "Claimant",
    accessor: (r) => r.claimed_name.toLowerCase(),
    cell: (r) => <span className="font-medium">{r.claimed_name}</span>,
  },
  { key: "email", header: "Email", accessor: (r) => r.email, mono: true },
  {
    key: "abstract",
    header: "Abstract",
    accessor: (r) => r.abstract_title,
    cell: (r) => <span className="max-w-[18rem] truncate inline-block align-bottom">{truncate(r.abstract_title, 60)}</span>,
  },
  {
    key: "status",
    header: "Status",
    accessor: (r) => r.status,
    cell: (r) => statusChip(r.status),
  },
  dateCol<Claim2026Row>(),
];
