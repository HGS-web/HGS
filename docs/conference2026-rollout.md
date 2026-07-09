# Conference 2026 — Registration Phase Rollout

Owner checklist for launching the registration platform (accounts, profiles,
abstract linking, receipt evaluation). Everything in code is already wired;
the steps below are the parts only you can do (Supabase dashboard, Vercel,
local import).

## 1. Supabase dashboard — database ✅ done 9 Jul 2026

1. Open **SQL Editor → New query**, paste the whole of
   [`scripts/conference2026/schema.sql`](../scripts/conference2026/schema.sql), run it once.
   It creates 6 tables (`people_conference2026`, `abstracts_conference2026`,
   `abstract_authors_conference2026`, `registrations_conference2026`,
   `payment_receipts_conference2026`, `author_claims_conference2026`) with
   RLS enabled and **no** anon/authenticated access — only the service role
   (our API routes) can touch them.
2. **Storage → New bucket**: name `payment-receipts-conference2026`,
   **private**, file size limit **10 MB**, allowed MIME types:
   `application/pdf, image/jpeg, image/png, image/webp`. No storage policies.

## 2. Supabase dashboard — Auth

E-mail verification is **ON** and comes FIRST: the visitor enters only
their e-mail address, receives one confirmation link (via the paid Resend
account — no daily cap, 5,000/month), and lands on the complete-registration
page with their imported details prefilled; the password is set there, last.
The platform sends only two kinds of e-mail: confirmation links and
password resets.

1. **Authentication → Sign In / Up → Email**: leave **"Confirm email" ON**
   (this is the toggle inside the Email provider panel — not
   "Secure email change", which can stay at its default).
2. **Authentication → URL Configuration**:
   - Site URL: `https://hellenic-geographical-society.com`
   - Redirect URLs: add `https://hellenic-geographical-society.com/auth/confirm`
     and, for local testing, the wildcard `http://localhost:3000/**`
     (entries must match exactly — a missing entry makes `{{ .RedirectTo }}`
     in the e-mail templates silently fall back to the Site URL).
3. **Project Settings → Auth → SMTP** (custom SMTP is required — the built-in
   sender only delivers to project team members):
   - Host `smtp.resend.com`, port `465`, user `resend`,
     password = the existing `RESEND_API_KEY`,
     sender `noreply@hellenic-geographical-society.com`,
     sender name `HGS Conference 2026`.
4. **Authentication → Rate Limits**: raise **"Rate limit for sending
   emails"** from the default (~30/hour) to **100 per hour** — peak
   registration days must not block signups.
5. **Authentication → Emails** — three templates, styled to match the
   membership e-mails (dark conference banner, white card — same design
   as `src/app/api/send-email/route.ts`). Outlook-safe: no border-radius,
   no secretariat contact box.

   **Confirm signup** (first confirmation request for an address) —
   subject `HGS Conference 2026 — Confirm your e-mail address`:

     ```html
     <!DOCTYPE html>
     <html lang="en">
     <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
     <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
         <tr><td align="center" style="padding:24px 16px;">
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;">
             <tr><td style="background:#1a1a1a;padding:20px 24px;">
               <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">13th International Conference of the Hellenic Geographical Society</h1>
               <p style="margin:4px 0 0;color:#aaaaaa;font-size:13px;font-family:Arial,Helvetica,sans-serif;">27&#8211;28 November 2026 &middot; Athens, Greece</p>
             </td></tr>
             <tr><td style="padding:24px;font-family:Arial,Helvetica,sans-serif;">
               <p style="margin:0 0 16px;font-size:14px;color:#111827;line-height:1.6;">Dear participant,</p>
               <p style="margin:0 0 16px;font-size:14px;color:#111827;line-height:1.6;">A registration for the conference was started with this e-mail address ({{ .Email }}). To confirm your address and fill in your registration details, please use the button below.</p>
               <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                 <tr><td align="center" style="padding:24px 0;">
                   <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                     <tr><td align="center" bgcolor="#1a1a1a" height="42" style="height:42px;padding:0 28px;">
                       <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email" style="display:inline-block;line-height:42px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">Confirm e-mail address and continue</a>
                     </td></tr>
                   </table>
                 </td></tr>
               </table>
               <p style="margin:0 0 16px;font-size:12px;color:#6b7280;line-height:1.6;">If the button does not work, copy and paste this address into your browser:<br>{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=email</p>
               <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">If you did not request this, you can safely ignore this message; no registration will be made without confirmation.</p>
               <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                 <tr><td style="padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;">Hellenic Geographical Society &middot; hellenic-geographical-society.com</td></tr>
               </table>
             </td></tr>
           </table>
         </td></tr>
       </table>
     </body>
     </html>
     ```

   **Magic Link** (sent instead of the above when the address was already
   verified once but the registration was not finished) — subject
   `HGS Conference 2026 — Continue your registration`: same HTML as
   Confirm signup with the two content paragraphs and button label
   replaced by:

     ```html
     <p style="margin:0 0 16px;font-size:14px;color:#111827;line-height:1.6;">You requested a link to continue your registration for the conference with this e-mail address ({{ .Email }}). Please use the button below.</p>
     ```
     button text: `Continue your registration`; closing note:
     ```html
     <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">If you did not request this, you can safely ignore this message.</p>
     ```

   **Reset password** — subject `HGS Conference 2026 — Password reset`:
   same HTML shell with the content replaced by:

     ```html
     <p style="margin:0 0 16px;font-size:14px;color:#111827;line-height:1.6;">A password reset was requested for your conference account ({{ .Email }}). To set a new password, please use the button below. The link is valid for a limited time and can be used once.</p>
     ```
     button href:
     `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery&next=/en/conference2026/reset-password`,
     button text: `Set a new password`; closing note: "If you did not
     request this, you can safely ignore this message."

## 3. Vercel

No new environment variables are needed (the platform uses the existing
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`; recovery e-mails go through Supabase's SMTP,
so `RESEND_API_KEY` stays for the membership form only).

## 4. Import the evaluated abstracts ✅ done 9 Jul 2026 (728 people / 422 abstracts / 856 links verified)

> The source Excel files, `Exports_DB/`, `Tasks/`, the import report and
> `import-overrides.json` contain personal data and are **git-ignored — the
> repository is public, never commit them**.

1. Create `.env.local` at the repo root (git-ignored) with:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...        # Project Settings → API
   SUPABASE_SERVICE_ROLE_KEY=...       # Project Settings → API (service_role)
   ```

2. Make sure `scripts/conference2026/import-overrides.json` exists (it holds
   the hand-verified shared-e-mail case and the co-authors of the
   e-mail-submitted abstracts; structure in `import-overrides.example.json`).

3. Dry run and review the report:

   ```
   npx tsx scripts/conference2026/import.ts
   ```

   Expected counts: **422 abstracts** (373 accepted / 48 reassigned /
   1 not_evaluated), **728 people** (722 with e-mail), **856 author links**
   (852 rows from All_Submissions, minus 11 that belong to withdrawn
   submissions, minus 2 duplicate collapses, plus 7 synthesized submitters
   for the e-mail-submitted abstracts S_422–S_428, plus 10 hand-verified
   co-authors). The report (`scripts/conference2026/import-report.json`)
   also lists:
   - `shared_email_review`: one e-mail address is used by two different
     people; the submitter keeps it, the other person is flagged
     `needs_review` with no e-mail — resolve manually if they register.
   - `unmatched_links`: 11 rows belonging to 6 submissions (S_055, S_125,
     S_172, S_190, S_387, S_411) that are absent from the evaluated set —
     dropped on purpose; eyeball once to confirm they were withdrawn.
   - The 1 `not_evaluated` abstract — decide its status with the committee.

4. Apply (idempotent; safe to re-run until launch, do NOT re-run after
   registrations begin):

   ```
   npx tsx scripts/conference2026/import.ts --apply
   ```

5. Verify in `/database` → **2026 Registration** section: People / Abstracts
   tab counts match the report.

## 5. Verify end-to-end (production or `npm run dev`)

- **Security probe** (both must be denied):

  ```
  curl "$SUPABASE_URL/rest/v1/people_conference2026?select=*" -H "apikey: $ANON_KEY"
  ```

- **Recognized author**: enter an e-mail from the import → confirmation
  e-mail arrives → click the link → greeted by name with abstracts and role
  badges, details prefilled → complete country/type, set password → profile
  shows abstracts; click one → full detail (final session, authors, text;
  reassigned ones say "Accepted (reassigned)").
- **Unknown attendee**: enter a fresh e-mail → confirm → empty details form
  with the claim option → claims find abstracts by name → claim shows
  "Pending review" → approve it in `/database` → abstract appears in the
  profile.
- **No data before verification**: typing someone's e-mail on the register
  page must reveal nothing about them — names/abstracts appear only after
  the link is clicked.
- **Interrupted completion**: confirm the link but close before submitting →
  enter the same e-mail on the register page again → a new link arrives
  ("Continue your registration") → complete page again, prefill intact.
- **Cross-device**: request the link on one browser, open it on another →
  the second device shows the complete page; the first can be closed.
- **Password reset**: Forgot password → e-mail arrives (via Resend SMTP) →
  link → set new password → old one fails.
- **Receipt**: upload a PDF in the profile → `/database` → Receipts → open
  row → set **Accepted**/**Declined** + note → profile reflects it; declined
  allows re-upload.
- **Strict solo**: a second registration or second active receipt of the
  same kind is refused.
- **Membership form** (unchanged flow) still sends its confirmation e-mail.

## 6. When early bird ends (after 31 Aug 2026)

Flip `CURRENT_FEE_PERIOD` from `"early_bird"` to `"late"` in
[`src/config/conference2026.ts`](../src/config/conference2026.ts) and update
the display copy in the same file (and the fee-table header on the
conference page). No other logic depends on dates.

## Notes

- Which evaluation statuses count as "accepted" is the single constant
  `ACCEPTED_EVALUATIONS` in `src/config/conference2026.ts`
  (currently `['accepted', 'reassigned']`).
- Password resets are self-serve; if someone loses access to their e-mail,
  handle it via the secretariat (the profile shows the address used).
- ✅ Done 9 Jul 2026: the legacy anon RLS policies on `registrations`,
  `abstracts`, `payment_receipts`, `thematic_session_submissions_2026` and
  the old storage buckets were dropped (migration
  `drop_dead_submission_phase_anon_policies`). The membership-form policies
  are untouched and that flow still works.
- E-mail budget: Resend paid plan, 5,000/month, no daily cap. Expected use:
  one confirmation per signup plus occasional resends and password resets —
  well within budget even in peak weeks.
