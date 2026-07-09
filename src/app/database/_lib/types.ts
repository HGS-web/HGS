export interface MembershipApplication {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  member_type: "research_staff" | "student" | string;
  role: string | null;
  degree: string | null;
  affiliation: string | null;
  country: string | null;
  receipt_path: string | null;
  gdpr_consent: boolean;
  mailing_consent: boolean;
  created_at: string;
}

export interface Registration {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  affiliation: string;
  country: string;
  registration_type: "regular" | "hgs_member" | "student" | "hgs_student" | string;
  abstract_intent: "yes" | "no" | string;
  mailing_consent: boolean;
  gdpr_consent: boolean;
  created_at: string;
}

export interface Abstract {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  affiliation: string;
  session: string;
  title: string;
  co_authors: string;
  abstract_text: string;
  notes: string | null;
  created_at: string;
}

export interface Organizer {
  firstName: string;
  lastName: string;
  affiliation: string;
  email: string;
  country: string;
}

export interface ThematicSessionSubmission {
  id?: string;
  locale: "en" | "el" | string;
  organizer_primary: Organizer;
  organizer_secondary: Organizer | null;
  organizer_tertiary: Organizer | null;
  session_title: string;
  session_topic: string;
  session_summary: string;
  session_keywords: string[];
  additional_comments: string | null;
  created_at: string;
}

export interface PaymentReceipt {
  id?: string;
  email: string;
  receipt_type: "hgs_membership" | "conference" | string;
  file_path: string;
  notes: string | null;
  created_at: string;
}

export interface DashboardData {
  membership: {
    registrations: MembershipApplication[];
    receipts: PaymentReceipt[];
  };
  conference: {
    sessions: ThematicSessionSubmission[];
    abstracts: Abstract[];
    receipts: PaymentReceipt[];
  };
}

// Registration-phase (2026) rows — the canonical shapes live next to the
// user-facing code.
export type {
  PersonConference2026,
  AbstractConference2026,
  AbstractAuthorConference2026,
  RegistrationConference2026,
  PaymentReceiptConference2026,
  AuthorClaimConference2026,
} from "@/lib/conference2026-types";

import type {
  PersonConference2026 as _Person,
  AbstractConference2026 as _Abstract,
  AbstractAuthorConference2026 as _Author,
  RegistrationConference2026 as _Registration,
  PaymentReceiptConference2026 as _Receipt,
  AuthorClaimConference2026 as _Claim,
} from "@/lib/conference2026-types";

export interface Conference2026Data {
  registrations: _Registration[];
  receipts: _Receipt[];
  people: _Person[];
  abstracts: _Abstract[];
  authors: _Author[];
  claims: _Claim[];
}

export type SectionKey = "membership" | "conference" | "conference2026";

export type TabKey =
  | "membership-registrations"
  | "membership-receipts"
  | "conference-sessions"
  | "conference-abstracts"
  | "c26-registrations"
  | "c26-receipts"
  | "c26-people"
  | "c26-abstracts";

export type ExportTableKey =
  | "membership_applications"
  | "registrations"
  | "abstracts"
  | "thematic_session_submissions_2026"
  | "payment_receipts_membership"
  | "payment_receipts_conference"
  | "registrations_conference2026"
  | "payment_receipts_conference2026"
  | "people_conference2026"
  | "abstracts_conference2026"
  | "abstract_authors_conference2026"
  | "author_claims_conference2026";
