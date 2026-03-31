# HGS Membership Registration — Design Spec

## Overview

Replace the current DOCX-download-and-email membership registration workflow with an interactive web form backed by Supabase (database + file storage) and Resend (confirmation emails). The page preserves all existing committee-authored text in both English and Greek.

## Current State

- **Page:** Markdown-rendered via `src/app/[locale]/[...slug]/page.tsx` at `/society/registration`
- **Content:** `content/en/The Society/Registration.md` and `content/el/The Society/Registration.md`
- **Workflow:** Download DOCX form, fill locally, email to `geographicalsocietyhellas@gmail.com`, pay via bank transfer
- **Form fields (DOCX):** Name, Surname, Email, Role/Capacity (Ιδιότητα), Degree/Diploma (optional)

## Target State

A dedicated page at `src/app/[locale]/society/registration/page.tsx` with structured content sections and an embedded interactive registration form component, following the same patterns as the conference page.

## Page Structure

### 1. Welcome Section
Board of Directors greeting — existing text verbatim from the markdown files.

### 2. Membership Fees Card
- Research staff: €20/year
- Students: €10/year
- Existing text about the importance of subscriptions.

### 3. Benefits & Privileges
The existing bullet-point lists from the markdown, styled as proper cards:
- Member benefits (6 items)
- Member privileges (3 items)
- Call-to-action text ("Become a member today...")

### 4. Registration Form (new component)
Interactive form component: `src/components/membership/registration-form.tsx`

**Core fields (required):**
| Field | Type | Validation |
|-------|------|------------|
| First Name / Όνομα | text | required, min 2 chars |
| Last Name / Επώνυμο | text | required, min 2 chars |
| Email | email | required, valid email |
| Member Type | select | `research_staff` or `student` |
| Role / Ιδιότητα | text | required (e.g. "PhD Candidate", "Professor") |

**Expandable "Additional Information" section (optional):**
| Field | Type | Validation |
|-------|------|------------|
| Degree / Diploma | text | optional |
| Affiliation / Institution | text | optional |
| Country | text input | optional |

**Receipt Upload (optional):**
- Accepts: PDF, JPEG, PNG, WebP
- Max size: 10 MB
- Uploaded to Supabase storage bucket `membership-receipts`
- File path format: `{timestamp}-{normalized-email}.{ext}`

**Consent:**
| Field | Type | Required |
|-------|------|----------|
| GDPR consent | checkbox | yes |
| Mailing list consent | checkbox | no |

### 5. Bank Details Card
IBAN, BIC/SWIFT, beneficiary reference — existing text from markdown.

### 6. Contact Section
Secretary email: `geographicalsocietyhellas@gmail.com`

## Supabase Schema

### New table: `membership_applications`

```sql
CREATE TABLE public.membership_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  member_type TEXT NOT NULL CHECK (member_type IN ('research_staff', 'student')),
  role TEXT NOT NULL,
  degree TEXT,
  affiliation TEXT,
  country TEXT,
  receipt_path TEXT,
  gdpr_consent BOOLEAN NOT NULL DEFAULT false,
  mailing_consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending'
);

ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts"
  ON public.membership_applications
  FOR INSERT
  WITH CHECK (true);
```

### New storage bucket: `membership-receipts`

- Private bucket (not public)
- RLS policy: allow anonymous uploads (same pattern as `payment-receipts`)

## Email Integration

Extend `src/app/api/send-email/route.ts` with a new email type: `membership`.

**Trigger:** After successful form submission + database insert.

**From:** `HGS <noreply@hellenic-geographical-society.com>`

**Content:**
- Confirmation of application received
- Summary of submitted details (name, email, member type, role)
- Bank transfer details (IBAN, BIC/SWIFT, reference format)
- Note that they will be contacted at their email once membership is confirmed

## Form Submission Flow

```
1. Client-side Zod validation
   ↓
2. Duplicate email check (ilike on membership_applications.email)
   ↓
3. If receipt file provided: upload to Supabase storage
   ↓
4. Insert into membership_applications table
   ↓
5. Fire-and-forget email send via /api/send-email (type: "membership")
   ↓
6. Success state with confirmation message
```

## Bilingual Support

All form labels, placeholders, validation messages, and static text are defined in a `membershipText` object with `en` and `el` keys, same pattern as `conferenceText` in the conference page.

## Files to Create/Modify

### New files:
1. `src/app/[locale]/society/registration/page.tsx` — dedicated page with structured content + form
2. `src/components/membership/registration-form.tsx` — interactive form component

### Modified files:
3. `src/app/api/send-email/route.ts` — add `membership` email type
4. `src/app/[locale]/[...slug]/page.tsx` — remove `["society", "registration"]` from `generateStaticParams` (now handled by dedicated page)

### Supabase migrations:
5. New table `membership_applications`
6. New storage bucket `membership-receipts` with upload policy

### Files to keep (no changes):
- Markdown content files remain in place (not rendered anymore for this route, but preserved as reference)
- DOCX files stay in `/public/` but are NOT linked from the new page

## Design Decisions

1. **Dedicated page vs. markdown + component:** Dedicated page gives full control over layout and allows mixing static content with interactive components, matching the conference page pattern.
2. **Separate table from conference registrations:** Membership applications are a different domain — different fields, different lifecycle, different admin needs.
3. **Separate storage bucket:** Clean separation of conference vs. membership receipts.
4. **Optional receipt upload:** Not everyone will have the receipt ready at registration time — they may pay after submitting the form.
5. **Expandable additional fields:** Core fields stay visible; optional fields (degree, affiliation, country) are in a collapsible section to keep the form approachable for the majority Greek audience while accommodating international applicants.
6. **Email as unique constraint:** Prevents duplicate applications, same pattern as conference forms.
