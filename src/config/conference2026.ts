/**
 * Central configuration for the HGS Conference 2026 registration phase.
 *
 * Fee amounts and the fee period are display/snapshot values only — there is
 * deliberately NO date-based switching logic. When the early-bird period ends
 * (31 August 2026), the site owners flip CURRENT_FEE_PERIOD to "late" and
 * adjust the copy below.
 */

export type EvaluationStatus = "accepted" | "reassigned" | "not_evaluated";

/**
 * Which evaluation statuses count as "accepted" across the site (profiles,
 * recognition step, claims). "reassigned" abstracts are accepted abstracts
 * that were moved to a different session — they display as
 * "Accepted (reassigned)" with their final session.
 */
export const ACCEPTED_EVALUATIONS: readonly EvaluationStatus[] = [
  "accepted",
  "reassigned",
];

export function isAcceptedEvaluation(evaluation: string): boolean {
  return (ACCEPTED_EVALUATIONS as readonly string[]).includes(evaluation);
}

export type RegistrationType =
  | "regular"
  | "hgs_member"
  | "student"
  | "hgs_student";

export type FeePeriod = "early_bird" | "late";

/** Flipped manually by the site owners when the early-bird period ends. */
export const CURRENT_FEE_PERIOD: FeePeriod = "early_bird";

export const FEE_PERIOD_LABEL: Record<FeePeriod, string> = {
  early_bird: "Early bird",
  late: "Late",
};

export const CONFERENCE_FEES: Record<
  RegistrationType,
  { label: string; early_bird: number; late: number }
> = {
  regular: { label: "Regular", early_bird: 60, late: 80 },
  hgs_member: { label: "HGS Member", early_bird: 40, late: 50 },
  student: { label: "Student", early_bird: 20, late: 30 },
  hgs_student: { label: "HGS Student Member", early_bird: 10, late: 15 },
};

/** Fee snapshot for the current period, computed server-side at registration. */
export function currentFee(type: RegistrationType): {
  amountEur: number;
  label: string;
} {
  const fee = CONFERENCE_FEES[type];
  return {
    amountEur: fee[CURRENT_FEE_PERIOD],
    label: `${FEE_PERIOD_LABEL[CURRENT_FEE_PERIOD]} — ${fee.label}`,
  };
}

export const REGISTRATION_TYPES: RegistrationType[] = [
  "regular",
  "hgs_member",
  "student",
  "hgs_student",
];

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/** Private bucket for 2026 payment receipts (signed-URL access only). */
export const RECEIPTS_BUCKET = "payment-receipts-conference2026";

export const RECEIPT_ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Dates (display-only copy)
// ---------------------------------------------------------------------------

export const REGISTRATION_OPENED = "9 July 2026";
export const EARLY_BIRD_END = "31 August 2026";
export const LATE_REGISTRATION_END = "30 September 2026";

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export const SECRETARIAT_EMAIL = "ekarkani@geol.uoa.gr";

export const SUPPORT_MAILTO = `mailto:${SECRETARIAT_EMAIL}?subject=${encodeURIComponent(
  "HGS Conference 2026 – Registration Support"
)}&body=${encodeURIComponent(
  "Email used for registration:\n\nDescription of the issue:\n\n"
)}`;

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

export const NO_EMAIL_NOTE =
  "The current status of your registration, abstracts and payment is " +
  "available at any time in your profile. If you have authored or " +
  "co-authored an accepted abstract, please make sure your e-mail address " +
  "matches the one used during the abstract submission, so that your " +
  "abstracts are linked to your account automatically.";

/** Shown on the e-mail step, before the confirmation e-mail is sent. */
export const CONFIRM_EMAIL_NOTE =
  "A single confirmation e-mail will be sent to verify your address. " +
  "You fill in your registration details right after — anything already " +
  "known from your abstract submission is prefilled for you. No other " +
  "notification e-mails are sent by the platform.";

export const POLICY_NOTE =
  "In accordance with conference policy, accepted abstracts will be included " +
  "in the final conference programme only if at least one of their authors " +
  "has completed registration.";

export const EARLY_BIRD_NOTICE =
  `Registration is open. Early-bird fees apply from ${REGISTRATION_OPENED} ` +
  `until ${EARLY_BIRD_END}; registration at late fees remains possible until ` +
  `${LATE_REGISTRATION_END}.`;

export const FEE_MICROCOPY =
  `Early-bird fees apply until ${EARLY_BIRD_END}. After this date, late fees ` +
  "apply (Regular €80, HGS Member €50, Student €30, HGS Student Member €15).";

export const FORGOT_PASSWORD_GUIDANCE =
  "Enter the e-mail address you registered with. If an account exists, you " +
  "will receive an e-mail with a secure link to set a new password.";
