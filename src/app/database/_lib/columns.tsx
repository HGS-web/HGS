import type { ReactNode } from "react";
import type {
  Abstract,
  MembershipApplication,
  PaymentReceipt,
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
