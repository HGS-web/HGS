import "server-only";
import * as XLSX from "xlsx";
import { buildPresentationData, evaluationLabel, type Presentation2026 } from "@/app/database/_lib/presentations";
import type { Conference2026Data } from "@/app/database/_lib/types";

const PRESENTATION_HEADERS = [
  "Abstract code", "Title", "Session", "Abstract evaluation", "All authors",
  "Authors with accepted conference receipts", "Registered author names",
  "Registered author emails", "Abstract text",
];
const RECEIPT_HEADERS = [
  "Registrant", "Email", "Receipt kind", "Receipt status", "Abstract count",
  "Abstract codes", "Abstract titles", "Sessions", "Abstract evaluations",
  "File name", "User notes", "Admin notes", "Submitted", "Status updated",
  "Receipt ID", "Registration ID", "Person ID", "User ID", "File path", "MIME type", "Size bytes",
];

function presentationRow(p: Presentation2026): Record<string, string | number> {
  return {
    "Abstract code": p.code,
    Title: p.title,
    Session: p.session_label,
    "Abstract evaluation": evaluationLabel(p.evaluation),
    "All authors": p.authors.map((a) => a.name_as_listed).join("; "),
    "Authors with accepted conference receipts": p.paid_authors.length,
    "Registered author names": p.paid_authors.map((a) => a.name).join("; "),
    "Registered author emails": p.paid_authors.map((a) => a.email).join("; "),
    "Abstract text": p.abstract_text,
  };
}

function appendSheet(wb: XLSX.WorkBook, name: string, rows: Record<string, unknown>[], header: string[]) {
  const ws = XLSX.utils.json_to_sheet(rows, { header });
  ws["!cols"] = header.map((key) => ({
    wch: /title|text/i.test(key) ? 70 : /name|author|email|session|note/i.test(key) ? 40 : 24,
  }));
  if (ws["!ref"]) ws["!autofilter"] = { ref: ws["!ref"] };
  XLSX.utils.book_append_sheet(wb, ws, name);
}

/** One receipt per summary row; detailed links and paid presentations have their own sheets. */
export function conference2026ReceiptsWorkbook(data: Conference2026Data): XLSX.WorkBook {
  const { receipts, paidPresentations } = buildPresentationData(data);
  const wb = XLSX.utils.book_new();
  appendSheet(wb, "Receipts", receipts.map((r) => ({
    Registrant: r.registrant_name,
    Email: r.email,
    "Receipt kind": r.receipt_kind === "conference" ? "Conference" : "HGS Membership",
    "Receipt status": r.status,
    "Abstract count": r.abstracts.length,
    "Abstract codes": r.abstracts.map((a) => a.code).join("; "),
    "Abstract titles": r.abstracts.map((a) => `${a.code}: ${a.title}`).join("\n"),
    Sessions: r.abstracts.map((a) => `${a.code}: ${a.session_label}`).join("\n"),
    "Abstract evaluations": r.abstracts.map((a) => `${a.code}: ${evaluationLabel(a.evaluation)}`).join("\n"),
    "File name": r.file_name ?? "",
    "User notes": r.user_notes ?? "",
    "Admin notes": r.admin_notes ?? "",
    Submitted: r.created_at,
    "Status updated": r.status_updated_at ?? "",
    "Receipt ID": r.id,
    "Registration ID": r.registration_id,
    "Person ID": r.person_id ?? "",
    "User ID": r.user_id,
    "File path": r.file_path,
    "MIME type": r.mime_type ?? "",
    "Size bytes": r.size_bytes ?? "",
  })), RECEIPT_HEADERS);
  appendSheet(wb, "Receipt abstracts", receipts.flatMap((r) => r.abstracts.map((p) => ({
    "Receipt ID": r.id,
    Registrant: r.registrant_name,
    Email: r.email,
    "Receipt kind": r.receipt_kind === "conference" ? "Conference" : "HGS Membership",
    "Receipt status": r.status,
    ...presentationRow(p),
  }))), ["Receipt ID", "Registrant", "Email", "Receipt kind", "Receipt status", ...PRESENTATION_HEADERS]);
  appendSheet(wb, "Paid presentations", paidPresentations.map(presentationRow), PRESENTATION_HEADERS);
  return wb;
}
