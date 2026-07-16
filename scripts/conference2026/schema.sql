-- ===========================================================================
-- HGS Conference 2026 — registration-phase schema
-- ===========================================================================
-- Run ONCE in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Access model: ALL tables below are service-role only. RLS is enabled with
-- zero policies and PostgREST grants are revoked from anon/authenticated, so
-- the only way in is through the website's server API routes (which verify
-- the Supabase Auth user first) and the /database admin dashboard.
--
-- Storage: create a PRIVATE bucket named  payment-receipts-conference2026
-- (Dashboard → Storage → New bucket): file size limit 10 MB, allowed MIME
-- types: application/pdf, image/jpeg, image/png, image/webp. No storage
-- policies — uploads/downloads use signed URLs issued by the API routes.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- People: every person that appears on a 2026 abstract (imported) or that
-- signs up during registration. Email is the primary/display address; it is
-- NULL only for unresolved duplicate-email cases flagged by the import.
-- ALL addresses a person is known by (incl. aliases from multi-email authors)
-- live in person_emails_conference2026 — lookups resolve through that table.
-- ---------------------------------------------------------------------------
create table public.people_conference2026 (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique,
  full_name          text not null,
  first_name         text,
  last_name          text,
  affiliation        text,
  affiliation_short  text,
  auth_user_id       uuid unique references auth.users (id) on delete set null,
  source             text not null default 'import'
                     check (source in ('import', 'signup')),
  needs_review       boolean not null default false,
  review_note        text,
  created_at         timestamptz not null default now(),
  constraint people_conference2026_email_lower
    check (email is null or email = lower(email))
);

-- ---------------------------------------------------------------------------
-- Person e-mails: every address a person is known by (added 2026-07 by the
-- person_emails_conference2026 migration). people.email stays the primary/
-- display address; this table is what the e-mail -> person lookup resolves
-- against, so authors who used several addresses match with any of them.
-- Rows come from the one-time backfill ('backfill'), registration signups
-- ('signup'), and scripts/conference2026/reconcile-authors.ts ('reconcile').
-- The migration backfilled one primary row per existing people.email.
-- ---------------------------------------------------------------------------
create table public.person_emails_conference2026 (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null
              references public.people_conference2026 (id) on delete cascade,
  email       text not null unique,
  is_primary  boolean not null default false,
  source      text not null default 'reconcile'
              check (source in ('backfill', 'signup', 'reconcile')),
  created_at  timestamptz not null default now(),
  constraint person_emails_conference2026_email_lower
    check (email = lower(email))
);
create index person_emails_conference2026_person_idx
  on public.person_emails_conference2026 (person_id);
create unique index person_emails_conference2026_primary_uniq
  on public.person_emails_conference2026 (person_id)
  where is_primary;

-- ---------------------------------------------------------------------------
-- Abstracts: the 422 evaluated abstracts. id = the original platform UUID
-- from Evaluated_Abstracts.xlsx, so the import is idempotent.
-- evaluation is stored VERBATIM; which statuses count as accepted is decided
-- in code (src/config/conference2026.ts → ACCEPTED_EVALUATIONS).
-- ---------------------------------------------------------------------------
create table public.abstracts_conference2026 (
  id                uuid primary key,
  code              text not null unique,          -- e.g. 'S_003'
  title             text not null,
  abstract_text     text not null,
  session_label     text not null,                 -- final session (Session_After_Evaluation)
  session_original  text,                          -- session as submitted (differs when reassigned)
  session_number    int,                           -- numeric prefix of session_label
  evaluation        text not null
                    check (evaluation in ('accepted', 'reassigned', 'not_evaluated')),
  co_authors_raw    text,                          -- original free-text blob, reference only
  created_at        timestamptz not null default now()
);
create index abstracts_conference2026_evaluation_idx
  on public.abstracts_conference2026 (evaluation);

-- ---------------------------------------------------------------------------
-- Author links: person × abstract with role. 'author' = the submitting
-- author (author_order 0); co-authors keep their listed order.
-- ---------------------------------------------------------------------------
create table public.abstract_authors_conference2026 (
  id                     uuid primary key default gen_random_uuid(),
  abstract_id            uuid not null
                         references public.abstracts_conference2026 (id) on delete cascade,
  person_id              uuid not null
                         references public.people_conference2026 (id),
  role                   text not null check (role in ('author', 'co_author')),
  is_submitter           boolean not null default false,
  author_order           int not null,
  name_as_listed         text not null,
  affiliation_as_listed  text,
  created_at             timestamptz not null default now(),
  unique (abstract_id, author_order),
  unique (abstract_id, person_id)
);
create index abstract_authors_conference2026_person_idx
  on public.abstract_authors_conference2026 (person_id);

-- ---------------------------------------------------------------------------
-- Registrations: strict solo — one auth user, one person, one registration.
-- fee_label / fee_amount_eur are snapshots computed server-side at submit
-- time from src/config/conference2026.ts.
-- ---------------------------------------------------------------------------
create table public.registrations_conference2026 (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references auth.users (id) on delete cascade,
  person_id          uuid not null unique references public.people_conference2026 (id),
  email              text not null,
  first_name         text not null,
  last_name          text not null,
  affiliation        text not null,
  country            text not null,
  registration_type  text not null
                     check (registration_type in ('regular', 'hgs_member', 'student', 'hgs_student')),
  fee_label          text not null,
  fee_amount_eur     numeric(6,2) not null,
  gdpr_consent       boolean not null check (gdpr_consent),
  mailing_consent    boolean not null default false,
  created_at         timestamptz not null default now(),
  constraint registrations_conference2026_email_lower
    check (email = lower(email))
);

-- ---------------------------------------------------------------------------
-- Payment receipts: uploaded to the private bucket payment-receipts-conference2026,
-- evaluated manually by admins in /database (pending → accepted / declined).
-- A declined receipt can be replaced (partial unique index), history is kept.
-- ---------------------------------------------------------------------------
create table public.payment_receipts_conference2026 (
  id                 uuid primary key default gen_random_uuid(),
  registration_id    uuid not null
                     references public.registrations_conference2026 (id) on delete cascade,
  user_id            uuid not null references auth.users (id) on delete cascade,
  receipt_kind       text not null check (receipt_kind in ('conference', 'hgs_membership')),
  file_path          text not null,
  file_name          text,
  mime_type          text,
  size_bytes         bigint,
  status             text not null default 'pending'
                     check (status in ('pending', 'accepted', 'declined')),
  user_notes         text,
  admin_notes        text,
  status_updated_at  timestamptz,
  created_at         timestamptz not null default now()
);
create unique index payment_receipts_conference2026_active_uniq
  on public.payment_receipts_conference2026 (registration_id, receipt_kind)
  where status <> 'declined';
create index payment_receipts_conference2026_status_idx
  on public.payment_receipts_conference2026 (status);

-- ---------------------------------------------------------------------------
-- Author claims: a registrant whose email did not match an imported person
-- claims to be an author/co-author of an accepted abstract. Reviewed by
-- admins in /database; approval re-points the matching author link to the
-- claimant's person row.
-- ---------------------------------------------------------------------------
create table public.author_claims_conference2026 (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  person_id           uuid not null references public.people_conference2026 (id),
  abstract_id         uuid not null references public.abstracts_conference2026 (id),
  abstract_author_id  uuid references public.abstract_authors_conference2026 (id),
  claimed_name        text not null,
  message             text,
  status              text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected')),
  admin_note          text,
  decided_at          timestamptz,
  created_at          timestamptz not null default now(),
  unique (user_id, abstract_id)
);
create index author_claims_conference2026_status_idx
  on public.author_claims_conference2026 (status);

-- ===========================================================================
-- RLS: deny everything to anon/authenticated on ALL conference tables.
-- No policies are created on purpose — with RLS enabled and zero policies,
-- API-key access is denied. The service role bypasses RLS. The REVOKEs also
-- close the default PostgREST grants.
-- ===========================================================================
alter table public.people_conference2026            enable row level security;
alter table public.person_emails_conference2026     enable row level security;
alter table public.abstracts_conference2026         enable row level security;
alter table public.abstract_authors_conference2026  enable row level security;
alter table public.registrations_conference2026     enable row level security;
alter table public.payment_receipts_conference2026  enable row level security;
alter table public.author_claims_conference2026     enable row level security;

revoke all on
  public.people_conference2026,
  public.person_emails_conference2026,
  public.abstracts_conference2026,
  public.abstract_authors_conference2026,
  public.registrations_conference2026,
  public.payment_receipts_conference2026,
  public.author_claims_conference2026
from anon, authenticated;
