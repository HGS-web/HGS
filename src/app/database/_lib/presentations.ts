import type {
  AbstractAuthorConference2026,
  AbstractConference2026,
  Conference2026Data,
  PaymentReceiptConference2026,
  RegistrationConference2026,
} from "./types";

export interface PaidAuthor2026 {
  person_id: string;
  name: string;
  email: string;
}

export interface Presentation2026 extends AbstractConference2026 {
  authors: AbstractAuthorConference2026[];
  paid_authors: PaidAuthor2026[];
}

export interface Receipt2026Row extends PaymentReceiptConference2026 {
  email: string;
  registrant_name: string;
  person_id: string | null;
  abstracts: Presentation2026[];
}

/** Join by canonical person IDs, including author links resolved through claims. */
export function buildPresentationData(data: Conference2026Data) {
  const registrations = new Map(data.registrations.map((r) => [r.id, r]));
  const paidRegistrations = new Map<string, RegistrationConference2026>();
  for (const receipt of data.receipts) {
    if (receipt.receipt_kind !== "conference" || receipt.status !== "accepted") continue;
    const registration = registrations.get(receipt.registration_id);
    if (registration) paidRegistrations.set(registration.person_id, registration);
  }

  const authorsByAbstract = new Map<string, AbstractAuthorConference2026[]>();
  for (const author of data.authors) {
    const authors = authorsByAbstract.get(author.abstract_id) ?? [];
    authors.push(author);
    authorsByAbstract.set(author.abstract_id, authors);
  }

  const abstractsByPerson = new Map<string, Presentation2026[]>();
  const paidPresentations: Presentation2026[] = [];
  const sortedAbstracts = [...data.abstracts].sort((a, b) =>
    a.code.localeCompare(b.code, "en", { numeric: true }),
  );

  for (const abstract of sortedAbstracts) {
    const authors = [...(authorsByAbstract.get(abstract.id) ?? [])].sort(
      (a, b) => a.author_order - b.author_order,
    );
    const linkedPeople = new Set<string>();
    const paidAuthors: PaidAuthor2026[] = [];
    for (const author of authors) {
      if (linkedPeople.has(author.person_id)) continue;
      linkedPeople.add(author.person_id);
      const registration = paidRegistrations.get(author.person_id);
      if (registration) {
        paidAuthors.push({
          person_id: author.person_id,
          name: `${registration.first_name} ${registration.last_name}`.trim() || author.name_as_listed,
          email: registration.email,
        });
      }
    }

    const presentation: Presentation2026 = { ...abstract, authors, paid_authors: paidAuthors };
    for (const personId of linkedPeople) {
      const abstracts = abstractsByPerson.get(personId) ?? [];
      abstracts.push(presentation);
      abstractsByPerson.set(personId, abstracts);
    }
    // Inclusion is based on receipt acceptance, independently of abstract evaluation.
    if (paidAuthors.length > 0) paidPresentations.push(presentation);
  }

  const receipts: Receipt2026Row[] = data.receipts.map((receipt) => {
    const registration = registrations.get(receipt.registration_id);
    return {
      ...receipt,
      email: registration?.email ?? "—",
      registrant_name: registration
        ? `${registration.first_name} ${registration.last_name}`.trim()
        : "Registration unavailable",
      person_id: registration?.person_id ?? null,
      abstracts: registration ? abstractsByPerson.get(registration.person_id) ?? [] : [],
    };
  });

  return { receipts, paidPresentations };
}

export function evaluationLabel(evaluation: AbstractConference2026["evaluation"]) {
  return evaluation === "reassigned"
    ? "Accepted (reassigned)"
    : evaluation === "accepted"
      ? "Accepted"
      : "Not evaluated";
}

/** A row per abstract, matching the filtered list; BOM preserves Greek in Excel. */
export function presentationsCsv(presentations: Presentation2026[]): string {
  const rows = [
    ["Abstract code", "Title", "Session", "Abstract evaluation", "All authors", "Authors with accepted conference receipts", "Registered author names", "Registered author emails"],
    ...presentations.map((p) => [
      p.code,
      p.title,
      p.session_label,
      evaluationLabel(p.evaluation),
      p.authors.map((a) => a.name_as_listed).join("; "),
      String(p.paid_authors.length),
      p.paid_authors.map((a) => a.name).join("; "),
      p.paid_authors.map((a) => a.email).join("; "),
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map((value) => {
    // Quoting CSV alone does not prevent spreadsheet formula interpretation.
    const safe = /^[\s]*[=+\-@]|^[\t\r\n]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
}
