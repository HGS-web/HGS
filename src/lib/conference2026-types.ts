/**
 * Row types for the *_conference2026 tables (see scripts/conference2026/schema.sql).
 * Shared by the user API routes, the profile UI, and the /database admin dashboard.
 */

import type {
  EvaluationStatus,
  RegistrationType,
} from "@/config/conference2026";

export interface PersonConference2026 {
  id: string;
  email: string | null;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  affiliation: string | null;
  affiliation_short: string | null;
  auth_user_id: string | null;
  source: "import" | "signup";
  needs_review: boolean;
  review_note: string | null;
  created_at: string;
}

/** Row in person_emails_conference2026 — every address a person is known by. */
export interface PersonEmailConference2026 {
  id: string;
  person_id: string;
  email: string;
  is_primary: boolean;
  source: "backfill" | "signup" | "reconcile";
  created_at: string;
}

export interface AbstractConference2026 {
  id: string;
  code: string;
  title: string;
  abstract_text: string;
  session_label: string;
  session_original: string | null;
  session_number: number | null;
  evaluation: EvaluationStatus;
  co_authors_raw: string | null;
  created_at: string;
}

export type AbstractAuthorRole = "author" | "co_author";

export interface AbstractAuthorConference2026 {
  id: string;
  abstract_id: string;
  person_id: string;
  role: AbstractAuthorRole;
  is_submitter: boolean;
  author_order: number;
  name_as_listed: string;
  affiliation_as_listed: string | null;
  created_at: string;
}

export interface RegistrationConference2026 {
  id: string;
  user_id: string;
  person_id: string;
  email: string;
  first_name: string;
  last_name: string;
  affiliation: string;
  country: string;
  registration_type: RegistrationType;
  fee_label: string;
  fee_amount_eur: number;
  gdpr_consent: boolean;
  mailing_consent: boolean;
  created_at: string;
}

export type ReceiptKind = "conference" | "hgs_membership";
export type ReceiptStatus = "pending" | "accepted" | "declined";

export interface PaymentReceiptConference2026 {
  id: string;
  registration_id: string;
  user_id: string;
  receipt_kind: ReceiptKind;
  file_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  status: ReceiptStatus;
  user_notes: string | null;
  admin_notes: string | null;
  status_updated_at: string | null;
  created_at: string;
}

export type ClaimStatus = "pending" | "approved" | "rejected";

export interface AuthorClaimConference2026 {
  id: string;
  user_id: string;
  person_id: string;
  abstract_id: string;
  abstract_author_id: string | null;
  claimed_name: string;
  message: string | null;
  status: ClaimStatus;
  admin_note: string | null;
  decided_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API payload shapes
// ---------------------------------------------------------------------------

/** Abstract summary as shown in profiles / recognition / claims. */
export interface AbstractSummary {
  id: string;
  code: string;
  title: string;
  session_label: string;
  evaluation: EvaluationStatus;
  role: AbstractAuthorRole;
}

/** Full abstract detail (only served to linked authors). */
export interface AbstractDetail {
  id: string;
  code: string;
  title: string;
  abstract_text: string;
  session_label: string;
  session_original: string | null;
  evaluation: EvaluationStatus;
  authors: {
    name: string;
    affiliation: string | null;
    role: AbstractAuthorRole;
  }[];
}

/** GET /api/conference2026/me response. */
export interface MePayload {
  email: string;
  person: Pick<
    PersonConference2026,
    "id" | "full_name" | "first_name" | "last_name" | "affiliation"
  > | null;
  registration: RegistrationConference2026 | null;
  receipts: PaymentReceiptConference2026[];
  abstracts: AbstractSummary[];
  claims: (AuthorClaimConference2026 & { abstract_title: string | null })[];
}

/**
 * POST /api/conference2026/check-email response. Pre-auth, so deliberately
 * status-only: "ok" means a confirmation link may be requested. Person
 * recognition data is served post-verification via /me.
 */
export type CheckEmailResult = { status: "has_account" | "ok" };
