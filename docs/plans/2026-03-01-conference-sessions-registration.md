# Conference 2026 — Sessions & Registration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace both placeholder panels on `/conference2026` with (a) the 38 accepted thematic sessions as a modal list and (b) three stacked registration step-cards (Register / Abstract / Payment Receipt) backed by Supabase and Resend email.

**Architecture:** All session data is hardcoded in a static TypeScript file generated from `sessions.md`. The three form dialogs are client components using react-hook-form + zod, calling Supabase directly for data + storage, and firing a Next.js App Router API route to send Resend emails. The page itself stays a server component.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, @radix-ui/react-dialog (already installed), react-hook-form, zod, @hookform/resolvers, @supabase/supabase-js (already installed), resend

---

## Pre-flight checklist (do these first, once)

Before starting tasks:

1. **Run the Supabase SQL** — open your Supabase project → SQL Editor → paste and run the SQL from Task 0 below
2. **Add env vars to Vercel** — go to Vercel → Project Settings → Environment Variables, add:
   - `RESEND_API_KEY` — your Resend API key (from Resend dashboard → API Keys)
   - Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are already set (they should be from the existing `supabase-client.ts`)
3. **Add env var locally** — create or update `.env.local` at project root:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

---

## Task 0: Supabase SQL (run manually — no code to write)

Open Supabase → SQL Editor → New query → paste this entire block → Run:

```sql
-- ─────────────────────────────────────────────
-- 1. Registrations
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.registrations (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  first_name           TEXT        NOT NULL,
  last_name            TEXT        NOT NULL,
  email                TEXT        NOT NULL UNIQUE,
  affiliation          TEXT        NOT NULL,
  country              TEXT        NOT NULL,
  registration_type    TEXT        NOT NULL
    CHECK (registration_type IN ('regular', 'hgs_member', 'student', 'hgs_student')),
  abstract_intent      TEXT        NOT NULL DEFAULT 'none'
    CHECK (abstract_intent IN ('oral', 'poster', 'none')),
  dietary              TEXT        NOT NULL DEFAULT 'none'
    CHECK (dietary IN ('none', 'vegetarian', 'vegan', 'kosher', 'gluten_free', 'other')),
  dietary_other        TEXT,
  special_requirements TEXT        NOT NULL DEFAULT '',
  payment_confirmed    BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registrations_updated_at ON public.registrations;
CREATE TRIGGER trg_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations (email);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_registrations"
  ON public.registrations FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_registrations"
  ON public.registrations FOR SELECT TO anon USING (true);

-- ─────────────────────────────────────────────
-- 2. Abstracts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abstracts (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  first_name        TEXT        NOT NULL,
  last_name         TEXT        NOT NULL,
  email             TEXT        NOT NULL,
  affiliation       TEXT        NOT NULL,
  session_id        INTEGER,
  title             TEXT        NOT NULL,
  co_authors        TEXT        NOT NULL DEFAULT '',
  abstract_text     TEXT,
  file_path         TEXT,
  presentation_type TEXT        NOT NULL
    CHECK (presentation_type IN ('oral', 'poster')),
  CONSTRAINT abstracts_content_check
    CHECK (abstract_text IS NOT NULL OR file_path IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_abstracts_email ON public.abstracts (email);

ALTER TABLE public.abstracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_abstracts"
  ON public.abstracts FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_abstracts"
  ON public.abstracts FOR SELECT TO anon USING (true);

-- ─────────────────────────────────────────────
-- 3. Payment Receipts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email        TEXT        NOT NULL,
  receipt_type TEXT        NOT NULL
    CHECK (receipt_type IN ('conference', 'hgs_membership')),
  file_path    TEXT        NOT NULL,
  notes        TEXT        NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_email ON public.payment_receipts (email);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_payment_receipts"
  ON public.payment_receipts FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_payment_receipts"
  ON public.payment_receipts FOR SELECT TO anon USING (true);

-- ─────────────────────────────────────────────
-- 4. Storage: abstracts bucket
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'abstracts', 'abstracts', false, 10485760,
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anon_upload_abstracts"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'abstracts');

-- ─────────────────────────────────────────────
-- 5. Storage: payment-receipts bucket
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts', 'payment-receipts', false, 10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anon_upload_payment_receipts"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'payment-receipts');
```

**Verify:** In Supabase → Table Editor you should see `registrations`, `abstracts`, `payment_receipts`. In Storage you should see `abstracts` and `payment-receipts` buckets.

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm install)

**Step 1: Install packages**

```bash
npm install resend react-hook-form @hookform/resolvers zod
```

**Step 2: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds (no new errors introduced).

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install resend, react-hook-form, zod"
```

---

## Task 2: Add missing UI primitives

The HGS project is missing `Dialog`, `Input`, `Label`, `Textarea`, and `Select` UI components that the form dialogs need. The existing DenuChange project has these — adapt them for HGS's Tailwind v4 / plain class setup (no `cn` shadcn wrappers needed; keep it simple).

**Files:**
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/select.tsx`

**Step 1: Create `src/components/ui/dialog.tsx`**

```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={`fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ${className ?? ""}`}
      {...props}
    />
  )
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-black/10 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ${className ?? ""}`}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 text-black/40 hover:text-black/80 transition-colors">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 ${className ?? ""}`} {...props} />
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={`text-lg font-semibold text-black ${className ?? ""}`} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={`mt-1 text-sm text-black/50 ${className ?? ""}`} {...props} />
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose }
```

**Step 2: Create `src/components/ui/input.tsx`**

```tsx
import * as React from "react"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-black/30 focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 aria-[invalid=true]:border-red-400 ${className ?? ""}`}
      {...props}
    />
  )
)
Input.displayName = "Input"
```

**Step 3: Create `src/components/ui/label.tsx`**

```tsx
import * as React from "react"

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`text-sm font-medium text-black/70 ${className ?? ""}`}
      {...props}
    />
  )
}
```

**Step 4: Create `src/components/ui/textarea.tsx`**

```tsx
import * as React from "react"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-black/30 focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 resize-none ${className ?? ""}`}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"
```

**Step 5: Create `src/components/ui/select.tsx`**

```tsx
import * as React from "react"

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={`w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 aria-[invalid=true]:border-red-400 ${className ?? ""}`}
      {...props}
    />
  )
)
Select.displayName = "Select"
```

**Step 6: Verify TypeScript compiles**

```bash
npm run build
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/input.tsx src/components/ui/label.tsx src/components/ui/textarea.tsx src/components/ui/select.tsx
git commit -m "feat: add Dialog, Input, Label, Textarea, Select UI primitives"
```

---

## Task 3: Create sessions data file

Parse all 38 sessions from `sessions.md` into a typed TypeScript array.

**Files:**
- Create: `src/data/sessions.ts`

**Step 1: Write a one-off Node script to extract sessions**

Create a temporary file `scripts/parse-sessions.mjs` (delete after use):

```js
import { readFileSync } from "fs"

const text = readFileSync("sessions.md", "utf-8")

// Sessions start after the table of contents (line with "#1 Interdisciplinary...")
// Each session block starts with: #N Title
// Then blank line, Organisers: ..., blank, General topic: ..., blank, Abstract:, blank, text, blank

const blocks = text.split(/\n(?=#\d+ )/).slice(1) // skip TOC section

const sessions = blocks.map((block) => {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean)

  // Title: first line, e.g. "#1 Interdisciplinary..."
  const titleMatch = lines[0].match(/^#\d+\s+(.+)$/)
  const title = titleMatch ? titleMatch[1].trim() : lines[0]
  const idMatch = lines[0].match(/^#(\d+)/)
  const id = idMatch ? parseInt(idMatch[1]) : 0

  // Organisers
  const orgLine = lines.find(l => l.startsWith("Organisers:") || l.startsWith("Organiser:"))
  const organizers = orgLine ? orgLine.replace(/^Organisers?:\s*/i, "").trim() : ""

  // General topic
  const topicLine = lines.find(l => l.startsWith("General topic:"))
  const topic = topicLine ? topicLine.replace(/^General topic:\s*/i, "").trim() : ""

  // Abstract: everything after "Abstract:" line
  const absIdx = lines.findIndex(l => l === "Abstract:")
  const abstract = absIdx >= 0 ? lines.slice(absIdx + 1).join("\n\n").trim() : ""

  return { id, title, organizers, topic, abstract }
})

const output = `// Auto-generated from sessions.md — do not edit manually
export interface Session {
  id: number
  title: string
  organizers: string
  topic: string
  abstract: string
}

export const sessions: Session[] = ${JSON.stringify(sessions, null, 2)}
`

process.stdout.write(output)
```

**Step 2: Run the script and save output**

```bash
node scripts/parse-sessions.mjs > src/data/sessions.ts
```

**Step 3: Review `src/data/sessions.ts`**

Open the file and check:
- 38 entries (id 1–38)
- Each has non-empty `title`, `organizers`, `topic`, `abstract`
- Fix any entries where the parser missed a field (edit directly in the .ts file)

Common issues to check manually:
- Sessions where organizers span multiple lines
- Sessions with unusual formatting

**Step 4: Delete the temp script**

```bash
rm scripts/parse-sessions.mjs
```

**Step 5: Verify TypeScript**

```bash
npm run build
```

Expected: Build succeeds.

**Step 6: Commit**

```bash
git add src/data/sessions.ts
git commit -m "feat: add sessions data (38 thematic sessions from sessions.md)"
```

---

## Task 4: Create SessionList component

The left panel component — numbered list + modal per session.

**Files:**
- Create: `src/components/conference/session-list.tsx`

**Step 1: Write the component**

```tsx
"use client"

import { useState } from "react"
import { sessions, type Session } from "@/data/sessions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function SessionModal({ session, open, onClose }: { session: Session; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <p className="text-xs font-medium text-black/40 uppercase tracking-wider mb-1">
            Session {session.id}
          </p>
          <DialogTitle className="text-lg leading-snug pr-6">
            {session.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1">Organizers</p>
            <p className="text-black/80">{session.organizers}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1">General Topic</p>
            <p className="text-black/80">{session.topic}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1">Abstract</p>
            <div className="text-black/70 leading-relaxed whitespace-pre-wrap">{session.abstract}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SessionList() {
  const [selected, setSelected] = useState<Session | null>(null)

  return (
    <div>
      <p className="mt-3 text-sm text-black/60">
        The call for sessions has now closed. The following thematic sessions have been accepted.
      </p>

      <ol className="mt-4 space-y-1.5">
        {sessions.map((session) => (
          <li key={session.id}>
            <button
              onClick={() => setSelected(session)}
              className="w-full text-left text-sm text-black/80 hover:text-black transition-colors group flex items-start gap-2"
            >
              <span className="shrink-0 font-medium text-black/40 w-6 text-right">
                {session.id}.
              </span>
              <span className="group-hover:underline underline-offset-2">{session.title}</span>
            </button>
          </li>
        ))}
      </ol>

      {selected && (
        <SessionModal
          session={selected}
          open={true}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
```

**Step 2: Verify TypeScript**

```bash
npm run build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/conference/session-list.tsx
git commit -m "feat: add SessionList component with modal per session"
```

---

## Task 5: Create the email API route

Next.js App Router API route using Resend. Sends from `noreply@hellenic-geographical-society.com`.

**Files:**
- Create: `src/app/api/send-email/route.ts`

**Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "HGS Conference 2026 <noreply@hellenic-geographical-society.com>"
const SUPPORT_EMAIL = "ekarkani@geol.uoa.gr"

const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("HGS Conference 2026 – Change Request / Issue")}&body=${encodeURIComponent("Type of request: [ Registration Change / Abstract Change / Payment Issue / Other ]\n\nEmail used for registration:\n\nDescription of change or issue:\n\nAdditional comments:\n\n")}`

function esc(str: string | undefined | null): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const BANNER = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;">
    <tr>
      <td style="padding:20px 24px;font-family:Arial,Helvetica,sans-serif;">
        <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">
          13th International Conference of the Hellenic Geographical Society
        </h1>
        <p style="margin:4px 0 0;color:#aaaaaa;font-size:13px;">
          27&#8211;28 November 2026 &middot; Athens, Greece
        </p>
      </td>
    </tr>
  </table>
`

const FOOTER = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
    <tr>
      <td style="padding:14px 16px;background:#f9fafb;font-size:13px;font-family:Arial,Helvetica,sans-serif;color:#374151;line-height:1.6;">
        If you need to make changes to your registration, abstract, or payment,
        please <a href="${SUPPORT_MAILTO}" style="color:#1a1a1a;font-weight:600;">contact us</a>.
      </td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
    <tr>
      <td style="padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
        Hellenic Geographical Society &middot; hellenic-geographical-society.com
      </td>
    </tr>
  </table>
`

function wrap(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;">
          <tr><td>${BANNER}</td></tr>
          <tr>
            <td style="padding:24px;font-family:Arial,Helvetica,sans-serif;">
              ${content}
              ${FOOTER}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const regTypeLabel: Record<string, string> = {
  regular:     "Regular (Early €60 / Late €80)",
  hgs_member:  "HGS Member (Early €40 / Late €50)",
  student:     "Student (Early €20 / Late €30)",
  hgs_student: "HGS Student Member (Early €10 / Late €15)",
}

const dietaryLabel: Record<string, string> = {
  none: "None", vegetarian: "Vegetarian", vegan: "Vegan",
  kosher: "Kosher", gluten_free: "Gluten-free", other: "Other",
}

function row(label: string, value: string, shaded = false) {
  const bg = shaded ? "background:#f9fafb;" : ""
  return `<tr style="${bg}">
    <td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;width:40%;font-size:14px;">${esc(label)}</td>
    <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:14px;word-break:break-word;">${esc(value)}</td>
  </tr>`
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: true }, { status: 200 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = await req.json()
  const { type, email } = data

  if (!email || !type) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  let subject: string
  let html: string

  if (type === "verify") {
    subject = "Email Verification – HGS Conference 2026"
    html = wrap(`
      <h2 style="margin:0 0 8px;font-size:16px;color:#111827;">Email Verification</h2>
      <p style="color:#374151;line-height:1.6;">
        This email confirms that <strong>${esc(email)}</strong> is the address you entered
        for the 13th International Conference of the Hellenic Geographical Society.
      </p>
      <p style="color:#374151;line-height:1.6;">
        If you received this, your email is correct. Return to the registration form to complete your submission.
      </p>
      <p style="color:#9ca3af;font-size:13px;">If you did not request this, you can safely ignore it.</p>
    `)
  } else if (type === "registration") {
    subject = "Registration Confirmed – HGS Conference 2026"
    html = wrap(`
      <h2 style="margin:0 0 8px;font-size:16px;color:#111827;">Hi ${esc(data.first_name)},</h2>
      <p style="color:#374151;line-height:1.6;">
        Thank you for registering for the <strong>13th International Conference of the Hellenic Geographical Society</strong>.
        Your registration has been recorded.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;table-layout:fixed;">
        ${row("Name", `${data.first_name} ${data.last_name}`, true)}
        ${row("Email", data.email)}
        ${row("Affiliation", data.affiliation, true)}
        ${row("Country", data.country)}
        ${row("Registration type", regTypeLabel[data.registration_type] ?? data.registration_type, true)}
        ${data.abstract_intent !== "none" ? row("Abstract intent", data.abstract_intent === "oral" ? "Oral presentation" : "Poster presentation") : ""}
        ${row("Dietary", data.dietary === "other" ? data.dietary_other : (dietaryLabel[data.dietary] ?? "None"), data.abstract_intent !== "none")}
        ${data.special_requirements ? row("Special requirements", data.special_requirements) : ""}
      </table>
      <p style="color:#374151;font-size:13px;line-height:1.6;">
        Bank transfer details for payment will be communicated separately.
        Abstract submission deadline: <strong>1 May 2026</strong>.
      </p>
    `)
  } else if (type === "abstract") {
    subject = "Abstract Received – HGS Conference 2026"
    html = wrap(`
      <h2 style="margin:0 0 8px;font-size:16px;color:#111827;">Hi ${esc(data.first_name)},</h2>
      <p style="color:#374151;line-height:1.6;">
        We have received your abstract for the <strong>13th International Conference of the Hellenic Geographical Society</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;table-layout:fixed;">
        ${row("Name", `${data.first_name} ${data.last_name}`, true)}
        ${row("Email", data.email)}
        ${row("Title", data.title, true)}
        ${data.co_authors ? row("Co-authors", data.co_authors) : ""}
        ${row("Session", data.session_title ?? `Session ${data.session_id}`, !!data.co_authors)}
        ${row("Presentation", data.presentation_type === "oral" ? "Oral presentation" : "Poster presentation", !data.co_authors)}
      </table>
      <p style="color:#374151;line-height:1.6;">
        Author notifications will be sent by <strong>1 July 2026</strong>.
      </p>
    `)
  } else if (type === "receipt") {
    subject = "Payment Receipt Received – HGS Conference 2026"
    html = wrap(`
      <p style="color:#374151;line-height:1.6;">
        We have received your payment receipt. Your registration will be confirmed within a few business days.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;table-layout:fixed;">
        ${row("Email", data.email, true)}
        ${row("Receipt type", data.receipt_type === "hgs_membership" ? "HGS Membership Payment" : "Conference Payment")}
        ${data.notes ? row("Notes", data.notes, true) : ""}
      </table>
    `)
  } else {
    return NextResponse.json({ error: "Unknown type" }, { status: 400 })
  }

  try {
    await resend.emails.send({ from: FROM, to: email, subject, html })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Resend error:", err)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
```

**Step 2: Verify TypeScript**

```bash
npm run build
```

Expected: Build succeeds. If `resend` types error, ensure the package was installed correctly in Task 1.

**Step 3: Commit**

```bash
git add src/app/api/send-email/route.ts
git commit -m "feat: add send-email API route using Resend"
```

---

## Task 6: Create RegistrationDialog

**Files:**
- Create: `src/components/conference/registration-dialog.tsx`

**Step 1: Write the component**

```tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Mail } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

const schema = z.object({
  first_name:           z.string().min(1, "Required"),
  last_name:            z.string().min(1, "Required"),
  email:                z.string().email("Invalid email"),
  affiliation:          z.string().min(1, "Required"),
  country:              z.string().min(1, "Required"),
  registration_type:    z.enum(["regular", "hgs_member", "student", "hgs_student"], { error: "Please select a type" }),
  abstract_intent:      z.enum(["oral", "poster", "none"]),
  dietary:              z.enum(["none", "vegetarian", "vegan", "kosher", "gluten_free", "other"]),
  dietary_other:        z.string().optional(),
  special_requirements: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const SUPPORT_HREF = `mailto:ekarkani@geol.uoa.gr?subject=${encodeURIComponent("HGS Conference 2026 – Change Request")}&body=${encodeURIComponent("Email used for registration:\n\nDescription of change or issue:\n\n")}`

export function RegistrationDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen]           = useState(false)
  const [success, setSuccess]     = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified]   = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { abstract_intent: "none", dietary: "none" },
    })

  const dietary    = watch("dietary")
  const emailValue = watch("email")

  const verifyEmail = async () => {
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) return
    setVerifying(true)
    try {
      await fetch("/api/send-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "verify", email: emailValue }),
      })
      setVerified(true)
    } catch { /* silent */ } finally { setVerifying(false) }
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    setIsDuplicate(false)
    const supabase = getSupabaseClient()
    if (!supabase) { setServerError("Service unavailable. Please try again later."); return }

    const normalized = data.email.trim().toLowerCase()
    const { data: existing } = await supabase
      .from("registrations").select("id").ilike("email", normalized).maybeSingle()

    if (existing) { setIsDuplicate(true); setServerError("duplicate"); return }

    const { error } = await supabase.from("registrations").insert([{
      ...data,
      email: normalized,
      dietary_other: data.dietary === "other" ? (data.dietary_other ?? "") : null,
      special_requirements: data.special_requirements ?? "",
    }])

    if (error) { setServerError("Something went wrong. Please try again."); return }

    fetch("/api/send-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "registration", ...data }),
    }).catch(() => {})

    setSuccess(true)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) { reset(); setSuccess(false); setServerError(null); setIsDuplicate(false); setVerified(false) }
    setOpen(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        {success ? (
          <div className="py-10 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
            <DialogTitle>Registration submitted!</DialogTitle>
            <p className="text-sm text-black/50 leading-relaxed">
              Thank you for registering. A confirmation email is on its way.
            </p>
            <button onClick={() => handleOpenChange(false)} className="px-6 py-2 bg-black text-white text-sm rounded-full hover:bg-black/80 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Register for the Conference</DialogTitle>
              <DialogDescription>
                13th HGS International Conference · 27–28 November 2026 · Athens
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="r-first">First Name *</Label>
                  <Input id="r-first" {...register("first_name")} aria-invalid={!!errors.first_name} />
                  {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-last">Last Name *</Label>
                  <Input id="r-last" {...register("last_name")} aria-invalid={!!errors.last_name} />
                  {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="r-email">Email *</Label>
                <div className="flex gap-2">
                  <Input id="r-email" type="email" className="flex-1" {...register("email")} aria-invalid={!!errors.email} />
                  <button
                    type="button"
                    disabled={verifying || !emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)}
                    onClick={verifyEmail}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm border border-black/15 rounded-lg hover:bg-black/5 disabled:opacity-40 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {verifying ? "Sending…" : "Verify"}
                  </button>
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                {verified && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verification email sent — check your inbox.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="r-aff">Affiliation *</Label>
                <Input id="r-aff" placeholder="University / Institution" {...register("affiliation")} aria-invalid={!!errors.affiliation} />
                {errors.affiliation && <p className="text-xs text-red-500">{errors.affiliation.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="r-country">Country *</Label>
                <Input id="r-country" {...register("country")} aria-invalid={!!errors.country} />
                {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="r-type">Registration Type *</Label>
                <Select id="r-type" {...register("registration_type")} aria-invalid={!!errors.registration_type}>
                  <option value="">Select…</option>
                  <option value="regular">Regular — Early €60 / Late €80</option>
                  <option value="hgs_member">HGS Member — Early €40 / Late €50</option>
                  <option value="student">Student — Early €20 / Late €30</option>
                  <option value="hgs_student">HGS Student Member — Early €10 / Late €15</option>
                </Select>
                {errors.registration_type && <p className="text-xs text-red-500">{errors.registration_type.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="r-intent">Abstract Submission</Label>
                <Select id="r-intent" {...register("abstract_intent")}>
                  <option value="none">Not submitting an abstract</option>
                  <option value="oral">Oral presentation</option>
                  <option value="poster">Poster presentation</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="r-dietary">Dietary Requirements</Label>
                <Select id="r-dietary" {...register("dietary")}>
                  <option value="none">None</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="kosher">Kosher</option>
                  <option value="gluten_free">Gluten-free</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              {dietary === "other" && (
                <div className="space-y-1.5">
                  <Label htmlFor="r-dietary-other">Please specify *</Label>
                  <Input id="r-dietary-other" {...register("dietary_other")} />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="r-special">Special Requirements <span className="font-normal text-black/40">(optional)</span></Label>
                <Textarea id="r-special" rows={2} placeholder="Accessibility needs, etc." {...register("special_requirements")} />
              </div>

              {serverError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {isDuplicate ? (
                    <p>A registration with this email already exists. To make changes, please <a href={SUPPORT_HREF} className="underline font-medium">contact us</a>.</p>
                  ) : (
                    <p>{serverError}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Submitting…" : "Submit Registration"}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Verify TypeScript**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/conference/registration-dialog.tsx
git commit -m "feat: add RegistrationDialog with Supabase + email"
```

---

## Task 7: Create AbstractDialog

**Files:**
- Create: `src/components/conference/abstract-dialog.tsx`

**Step 1: Write the component**

```tsx
"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, UploadCloud, X } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { sessions } from "@/data/sessions"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

const schema = z.object({
  email:             z.string().email("Invalid email"),
  title:             z.string().min(3, "Please enter the abstract title"),
  session_id:        z.string().min(1, "Please select a session"),
  co_authors:        z.string().optional(),
  presentation_type: z.enum(["oral", "poster"], { error: "Please select a presentation type" }),
  abstract_text:     z.string().optional(),
})

type FormData = z.infer<typeof schema>

function wordCount(t: string) { return t.trim() === "" ? 0 : t.trim().split(/\s+/).length }

const SUPPORT_HREF = `mailto:ekarkani@geol.uoa.gr?subject=${encodeURIComponent("HGS Conference 2026 – Change Request")}&body=${encodeURIComponent("Email used for registration:\n\nDescription of change or issue:\n\n")}`

export function AbstractDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen]               = useState(false)
  const [success, setSuccess]         = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [file, setFile]               = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { presentation_type: "oral", abstract_text: "" } })

  const abstractText = watch("abstract_text") ?? ""
  const words        = wordCount(abstractText)
  const overLimit    = words > 500

  const onSubmit = async (data: FormData) => {
    setServerError(null); setIsDuplicate(false)
    const supabase = getSupabaseClient()
    if (!supabase) { setServerError("Service unavailable."); return }

    const normalized = data.email.trim().toLowerCase()

    const { data: reg, error: regErr } = await supabase
      .from("registrations").select("first_name, last_name, affiliation")
      .ilike("email", normalized).maybeSingle()

    if (regErr) { setServerError(`Database error: ${regErr.message}`); return }
    if (!reg)   { setServerError("This email is not registered. Please register first."); return }

    const { data: existing } = await supabase
      .from("abstracts").select("id").ilike("email", normalized).maybeSingle()

    if (existing) { setIsDuplicate(true); setServerError("duplicate"); return }

    const hasText = (data.abstract_text ?? "").trim().length > 0
    if (!hasText && !file) { setServerError("Please provide abstract text or upload a file."); return }

    let file_path: string | null = null
    if (file) {
      const ext  = file.name.split(".").pop()
      const path = `${Date.now()}-${reg.last_name}_${reg.first_name}.${ext}`
      const { error: uploadErr } = await supabase.storage.from("abstracts").upload(path, file)
      if (uploadErr) { setServerError("File upload failed. Please try again."); return }
      file_path = path
    }

    const sessionId = parseInt(data.session_id)
    const session   = sessions.find(s => s.id === sessionId)

    const { error } = await supabase.from("abstracts").insert([{
      first_name: reg.first_name, last_name: reg.last_name,
      email: normalized, affiliation: reg.affiliation,
      session_id: sessionId,
      title: data.title, co_authors: data.co_authors ?? "",
      presentation_type: data.presentation_type,
      abstract_text: data.abstract_text?.trim() || null,
      file_path,
    }])

    if (error) { setServerError("Something went wrong. Please try again."); return }

    fetch("/api/send-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "abstract",
        first_name: reg.first_name, last_name: reg.last_name,
        affiliation: reg.affiliation, email: normalized,
        title: data.title, co_authors: data.co_authors,
        session_id: sessionId, session_title: session?.title,
        presentation_type: data.presentation_type,
      }),
    }).catch(() => {})

    setSuccess(true)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) { reset(); setSuccess(false); setServerError(null); setIsDuplicate(false); setFile(null) }
    setOpen(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        {success ? (
          <div className="py-10 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
            <DialogTitle>Abstract submitted!</DialogTitle>
            <p className="text-sm text-black/50 leading-relaxed">
              Thank you. A confirmation email is on its way. Author notifications by <strong>1 July 2026</strong>.
            </p>
            <button onClick={() => handleOpenChange(false)} className="px-6 py-2 bg-black text-white text-sm rounded-full hover:bg-black/80 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Submit Your Abstract</DialogTitle>
              <DialogDescription>Max 500 words · English · Deadline: 1 May 2026</DialogDescription>
            </DialogHeader>

            <div className="mb-3 p-3 bg-black/5 rounded-lg text-xs text-black/50 leading-relaxed">
              Type your abstract below <strong>or</strong> upload a file (.docx preferred).
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="a-email">Registration Email *</Label>
                <Input id="a-email" type="email" placeholder="Use the email you registered with" {...register("email")} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="a-title">Abstract Title *</Label>
                <Input id="a-title" {...register("title")} aria-invalid={!!errors.title} />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="a-session">Thematic Session *</Label>
                <Select id="a-session" {...register("session_id")} aria-invalid={!!errors.session_id}>
                  <option value="">Select a session…</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.id}. {s.title}</option>
                  ))}
                </Select>
                {errors.session_id && <p className="text-xs text-red-500">{errors.session_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="a-coauth">Co-authors <span className="font-normal text-black/40">(optional)</span></Label>
                <Input id="a-coauth" placeholder="e.g. Smith J., Doe A." {...register("co_authors")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="a-type">Presentation Type *</Label>
                <Select id="a-type" {...register("presentation_type")} aria-invalid={!!errors.presentation_type}>
                  <option value="oral">Oral presentation</option>
                  <option value="poster">Poster presentation</option>
                </Select>
                {errors.presentation_type && <p className="text-xs text-red-500">{errors.presentation_type.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="a-text">Abstract Text</Label>
                  <span className={`text-xs ${overLimit ? "text-red-500 font-medium" : "text-black/40"}`}>{words} / 500 words</span>
                </div>
                <Textarea id="a-text" rows={7} placeholder="Paste or type your abstract here (max 500 words)…" {...register("abstract_text")} aria-invalid={overLimit} />
                {overLimit && <p className="text-xs text-red-500">Abstract exceeds 500 words.</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Or Upload File <span className="font-normal text-black/40">(.docx / .pdf, max 10 MB)</span></Label>
                {file ? (
                  <div className="flex items-center gap-2 p-2 border border-black/10 rounded-lg text-sm">
                    <span className="flex-1 truncate">{file.name}</span>
                    <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = "" }} className="text-black/30 hover:text-black transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 border-2 border-dashed border-black/10 rounded-lg p-5 text-sm text-black/40 cursor-pointer hover:border-black/20 hover:bg-black/5 transition-colors">
                    <UploadCloud className="h-6 w-6" />
                    <span>Click to select file</span>
                    <input ref={fileRef} type="file" accept=".docx,.doc,.pdf" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>

              {serverError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {isDuplicate ? (
                    <p>An abstract has already been submitted with this email. To make changes, <a href={SUPPORT_HREF} className="underline font-medium">contact us</a>.</p>
                  ) : <p>{serverError}</p>}
                </div>
              )}

              <button type="submit" disabled={isSubmitting || overLimit} className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors">
                {isSubmitting ? "Submitting…" : "Submit Abstract"}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Verify TypeScript**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/conference/abstract-dialog.tsx
git commit -m "feat: add AbstractDialog with session select, file upload, Supabase"
```

---

## Task 8: Create PaymentDialog

**Files:**
- Create: `src/components/conference/payment-dialog.tsx`

**Step 1: Write the component**

```tsx
"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, UploadCloud, X } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

const schema = z.object({
  email:        z.string().email("Invalid email"),
  receipt_type: z.enum(["conference", "hgs_membership"], { error: "Please select receipt type" }),
  notes:        z.string().optional(),
})

type FormData = z.infer<typeof schema>

const ACCEPTED  = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 10 * 1024 * 1024

const SUPPORT_HREF = `mailto:ekarkani@geol.uoa.gr?subject=${encodeURIComponent("HGS Conference 2026 – Payment Issue")}&body=${encodeURIComponent("Email used for registration:\n\nDescription:\n\n")}`

export function PaymentDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen]               = useState(false)
  const [success, setSuccess]         = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [file, setFile]               = useState<File | null>(null)
  const [fileError, setFileError]     = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { receipt_type: "conference" } })

  const handleFile = (f: File | undefined) => {
    if (!f) return
    if (!ACCEPTED.includes(f.type))    { setFileError("Accepted: PDF, JPEG, PNG"); return }
    if (f.size > MAX_BYTES)            { setFileError("File must be under 10 MB"); return }
    setFileError(null); setFile(f)
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    if (!file) { setFileError("Please upload your payment receipt."); return }

    const supabase = getSupabaseClient()
    if (!supabase) { setServerError("Service unavailable."); return }

    const normalized = data.email.trim().toLowerCase()

    const { data: reg, error: regErr } = await supabase
      .from("registrations").select("email").ilike("email", normalized).maybeSingle()

    if (regErr) { setServerError(`Database error: ${regErr.message}`); return }
    if (!reg)   { setServerError("This email is not registered. Please register first."); return }

    const ext  = file.name.split(".").pop()
    const path = `${Date.now()}-${normalized.replace(/[@.]/g, "_")}-${data.receipt_type}.${ext}`

    const { error: uploadErr } = await supabase.storage.from("payment-receipts").upload(path, file)
    if (uploadErr) { setServerError("File upload failed. Please try again."); return }

    const { error } = await supabase.from("payment_receipts").insert([{
      email: normalized, receipt_type: data.receipt_type,
      file_path: path, notes: data.notes ?? "",
    }])

    if (error) { setServerError("Something went wrong. Please try again."); return }

    fetch("/api/send-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "receipt", email: normalized, receipt_type: data.receipt_type, notes: data.notes }),
    }).catch(() => {})

    setSuccess(true)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) { reset(); setSuccess(false); setServerError(null); setFile(null); setFileError(null) }
    setOpen(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        {success ? (
          <div className="py-10 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
            <DialogTitle>Receipt received!</DialogTitle>
            <p className="text-sm text-black/50 leading-relaxed">
              Your payment receipt has been uploaded. We will confirm your payment within a few business days.
            </p>
            <button onClick={() => handleOpenChange(false)} className="px-6 py-2 bg-black text-white text-sm rounded-full hover:bg-black/80 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Upload Payment Receipt</DialogTitle>
              <DialogDescription>PDF or image · max 10 MB</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
              <div className="space-y-1.5">
                <Label htmlFor="p-email">Registration Email *</Label>
                <Input id="p-email" type="email" placeholder="Use the email you registered with" {...register("email")} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-type">Receipt Type *</Label>
                <Select id="p-type" {...register("receipt_type")} aria-invalid={!!errors.receipt_type}>
                  <option value="conference">Conference Payment</option>
                  <option value="hgs_membership">HGS Membership Payment</option>
                </Select>
                {errors.receipt_type && <p className="text-xs text-red-500">{errors.receipt_type.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Payment Receipt *</Label>
                {file ? (
                  <div className="flex items-center gap-2 p-2 border border-black/10 rounded-lg text-sm">
                    <span className="flex-1 truncate">{file.name}</span>
                    <button type="button" onClick={() => { setFile(null); setFileError(null); if (fileRef.current) fileRef.current.value = "" }} className="text-black/30 hover:text-black transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 border-2 border-dashed border-black/10 rounded-lg p-6 text-sm text-black/40 cursor-pointer hover:border-black/20 hover:bg-black/5 transition-colors">
                    <UploadCloud className="h-6 w-6" />
                    <span>Click to select file</span>
                    <span className="text-xs">PDF, JPEG, PNG — max 10 MB</span>
                    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={e => handleFile(e.target.files?.[0])} />
                  </label>
                )}
                {fileError && <p className="text-xs text-red-500">{fileError}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-notes">Notes <span className="font-normal text-black/40">(optional)</span></Label>
                <Textarea id="p-notes" rows={2} placeholder="e.g. transfer reference number" {...register("notes")} />
              </div>

              {serverError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p>
                    {serverError === "duplicate"
                      ? <>A receipt has already been uploaded for this email. To make changes, <a href={SUPPORT_HREF} className="underline font-medium">contact us</a>.</>
                      : serverError}
                  </p>
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors">
                {isSubmitting ? "Uploading…" : "Upload Receipt"}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Verify TypeScript**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/conference/payment-dialog.tsx
git commit -m "feat: add PaymentDialog with receipt type select and file upload"
```

---

## Task 9: Wire everything into conference2026/page.tsx

Replace both placeholder panel contents with the new components.

**Files:**
- Modify: `src/app/[locale]/conference2026/page.tsx`

**Step 1: Add imports at the top of the file** (after existing imports)

```tsx
import { SessionList } from "@/components/conference/session-list"
import { RegistrationDialog } from "@/components/conference/registration-dialog"
import { AbstractDialog } from "@/components/conference/abstract-dialog"
import { PaymentDialog } from "@/components/conference/payment-dialog"
import { ClipboardList, FileText, Receipt } from "lucide-react"
```

**Step 2: Replace the Sessions panel content**

Find this block in `page.tsx`:

```tsx
{SESSIONS_OPEN ? (
  <>
    <p className="mt-3 text-sm text-black/60">
      Submit a session proposal for the 13th International Conference of the
      Hellenic Geographical Society (2026).
    </p>
    <ThematicSessionForm locale={validLocale} />
  </>
) : (
  <>
    <p className="mt-3 text-sm text-black/60">
      The call for sessions has now closed. Thank you to everyone who submitted a proposal.
    </p>
    <div className="mt-6 rounded-xl border border-dashed border-black/20 bg-black/5 p-4 text-sm text-black/50">
      Session submissions are no longer available.
    </div>
  </>
)}
```

Replace with:

```tsx
{SESSIONS_OPEN ? (
  <>
    <p className="mt-3 text-sm text-black/60">
      Submit a session proposal for the 13th International Conference of the
      Hellenic Geographical Society (2026).
    </p>
    <ThematicSessionForm locale={validLocale} />
  </>
) : (
  <SessionList />
)}
```

**Step 3: Replace the Abstracts panel content**

Find this block:

```tsx
<div className="min-w-0 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
  <h3 className="text-xl font-semibold text-black">Abstracts</h3>
  <p className="mt-3 text-sm text-black/60">
    The call for abstracts will open in early March 2026. This section is
    currently locked; please check back soon.
  </p>
  <div className="mt-6 rounded-xl border border-dashed border-black/20 bg-black/5 p-4 text-sm text-black/50">
    Abstract submissions are not yet available.
  </div>
</div>
```

Replace with:

```tsx
<div className="min-w-0 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
  <h3 className="text-xl font-semibold text-black">Abstracts & Registration</h3>
  <p className="mt-3 mb-5 text-sm text-black/60">
    Complete your participation in three steps.
  </p>

  <div className="flex flex-col gap-4">
    {/* Step 1 */}
    <div className="rounded-xl border border-black/10 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-black/5 shrink-0">
          <ClipboardList className="h-4 w-4 text-black/60" />
        </div>
        <span className="text-xs font-medium text-black/40 uppercase tracking-wider">Step 1</span>
      </div>
      <p className="text-sm font-semibold text-black mb-1">Register</p>
      <p className="text-xs text-black/50 mb-3">
        Fill in your details, select your registration category, and indicate whether you plan to submit an abstract.
      </p>
      <RegistrationDialog>
        <button className="w-full py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 transition-colors">
          Register Now
        </button>
      </RegistrationDialog>
    </div>

    {/* Step 2 */}
    <div className="rounded-xl border border-black/10 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-black/5 shrink-0">
          <FileText className="h-4 w-4 text-black/60" />
        </div>
        <span className="text-xs font-medium text-black/40 uppercase tracking-wider">Step 2</span>
      </div>
      <p className="text-sm font-semibold text-black mb-1">Submit Abstract</p>
      <p className="text-xs text-black/50 mb-3">
        Submit your abstract (max 500 words) and select your thematic session. Deadline: 1 May 2026.
      </p>
      <AbstractDialog>
        <button className="w-full py-2 border border-black/15 text-black text-sm font-medium rounded-full hover:bg-black/5 transition-colors">
          Submit Abstract
        </button>
      </AbstractDialog>
    </div>

    {/* Step 3 */}
    <div className="rounded-xl border border-black/10 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-black/5 shrink-0">
          <Receipt className="h-4 w-4 text-black/60" />
        </div>
        <span className="text-xs font-medium text-black/40 uppercase tracking-wider">Step 3</span>
      </div>
      <p className="text-sm font-semibold text-black mb-1">Upload Payment Receipt</p>
      <p className="text-xs text-black/50 mb-3">
        After completing your bank transfer, upload your Αποδεικτικό Πληρωμής. HGS members may upload a separate membership receipt.
      </p>
      <PaymentDialog>
        <button className="w-full py-2 border border-black/15 text-black text-sm font-medium rounded-full hover:bg-black/5 transition-colors">
          Upload Receipt
        </button>
      </PaymentDialog>
    </div>
  </div>

  <p className="mt-4 text-xs text-black/40 text-center">
    Steps 2 and 3 can be completed in any order or at a later date.
  </p>
</div>
```

**Step 4: Remove unused `ThematicSessionForm` import if SESSIONS_OPEN is false** — leave it in place since the flag may be toggled again later.

**Step 5: Final build check**

```bash
npm run build
```

Expected: Build succeeds with zero TypeScript errors.

**Step 6: Commit**

```bash
git add src/app/[locale]/conference2026/page.tsx
git commit -m "feat: wire SessionList and registration dialogs into conference2026 page"
```

---

## Task 10: Deploy and verify

**Step 1: Push to trigger Vercel deployment**

```bash
git push
```

**Step 2: Add `RESEND_API_KEY` to Vercel**

Vercel Dashboard → Project → Settings → Environment Variables → Add:
- Key: `RESEND_API_KEY`
- Value: your Resend API key
- Environments: Production, Preview

**Step 3: Verify in production**

1. Open `/conference2026`
2. Sessions panel: numbered list of 38 sessions appears; clicking one opens a modal
3. Register: fill form → submit → green checkmark + confirmation email received
4. Abstract: use same email → fill form, select session → submit → confirmation email
5. Payment: upload a test file → submit → confirmation email

**Step 4: Verify Supabase tables have data**

Supabase → Table Editor → check `registrations`, `abstracts`, `payment_receipts` rows.

---

## Checklist summary

- [ ] Task 0: Supabase SQL run and verified
- [ ] Task 1: Dependencies installed
- [ ] Task 2: UI primitives created
- [ ] Task 3: sessions.ts generated and reviewed
- [ ] Task 4: SessionList component
- [ ] Task 5: Email API route
- [ ] Task 6: RegistrationDialog
- [ ] Task 7: AbstractDialog
- [ ] Task 8: PaymentDialog
- [ ] Task 9: page.tsx wired up
- [ ] Task 10: Deployed and verified end-to-end
