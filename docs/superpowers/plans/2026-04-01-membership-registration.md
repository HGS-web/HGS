# HGS Membership Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the DOCX-download membership registration with an interactive form backed by Supabase and Resend email.

**Architecture:** Dedicated page at `/society/registration` with bilingual static content (preserved from the committee's original text) and an embedded `MembershipForm` component. Form submissions go to a new `membership_applications` Supabase table; receipt uploads go to a new `membership-receipts` storage bucket. Confirmation emails are sent via the existing `/api/send-email` route with a new `membership` type.

**Tech Stack:** Next.js 15, React 19, react-hook-form + Zod, Supabase (postgres + storage), Resend, Tailwind CSS, Radix UI primitives (existing in project).

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/app/[locale]/society/registration/page.tsx` | Dedicated membership page with bilingual content + form |
| Create | `src/components/membership/registration-form.tsx` | Interactive membership registration form component |
| Modify | `src/app/api/send-email/route.ts` | Add `membership` email type |
| Modify | `src/app/[locale]/[...slug]/page.tsx` | Remove `["society", "registration"]` from `generateStaticParams` |

Supabase migrations (applied via MCP, not file-based):
- New table: `membership_applications`
- New storage bucket: `membership-receipts` with upload RLS policy

---

### Task 1: Create the membership registration form component

**Files:**
- Create: `src/components/membership/registration-form.tsx`

This component follows the same patterns as `src/components/conference/registration-dialog.tsx` and `src/components/conference/payment-dialog.tsx` but is an inline form (not a dialog) embedded directly in the page.

- [ ] **Step 1: Create the component file**

```tsx
"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, UploadCloud, X, ChevronDown } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

const schema = z.object({
  first_name:      z.string().min(2, "Required"),
  last_name:       z.string().min(2, "Required"),
  email:           z.string().email("Invalid email"),
  member_type:     z.enum(["research_staff", "student"], {
    error: "Please select a membership type",
  }),
  role:            z.string().min(1, "Required"),
  degree:          z.string().optional(),
  affiliation:     z.string().optional(),
  country:         z.string().optional(),
  mailing_consent: z.boolean(),
  gdpr_consent:    z.boolean().refine(v => v === true, {
    message: "You must accept the data processing terms to proceed.",
  }),
})

type FormData = z.infer<typeof schema>

const ACCEPTED  = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 10 * 1024 * 1024

const SUPPORT_HREF = `mailto:geographicalsocietyhellas@gmail.com?subject=${encodeURIComponent("HGS Membership – Issue")}&body=${encodeURIComponent("Email used for registration:\n\nDescription:\n\n")}`

const text = {
  en: {
    title: "Membership Application",
    desc: "Fill in the form below to apply for membership of the Hellenic Geographical Society.",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    memberType: "Membership Type",
    memberTypeSelect: "Select\u2026",
    researchStaff: "Research Staff \u2014 \u20AC20/year",
    student: "Student \u2014 \u20AC10/year",
    role: "Capacity / Role",
    rolePlaceholder: "e.g. PhD Candidate, Professor, Researcher",
    additionalInfo: "Additional Information",
    degree: "Degree / Diploma",
    degreePlaceholder: "e.g. MSc Geography",
    affiliation: "Affiliation / Institution",
    affiliationPlaceholder: "e.g. National & Kapodistrian University of Athens",
    country: "Country",
    countryPlaceholder: "e.g. Greece",
    receipt: "Payment Receipt",
    receiptHint: "(optional \u2014 you may upload it later)",
    gdprTitle: "Data Protection (GDPR)",
    gdprText: "The Hellenic Geographical Society (HGS) collects and processes your personal data for the purpose of managing memberships and for the ongoing records of the Society in connection with future events and activities. Your data will not be shared with third parties. You have the right to access, correct, or request deletion of your data at any time by contacting",
    gdprConsent: "I have read and consent to the processing of my personal data as described above.",
    mailingTitle: "Stay Updated",
    mailingConsent: "I would like to receive updates about future HGS events, conferences, and announcements.",
    mailingNote: "You can change this preference at any time by contacting",
    submit: "Submit Application",
    submitting: "Submitting\u2026",
    successTitle: "Application submitted!",
    successText: "Thank you for applying to become a member of the Hellenic Geographical Society. A confirmation email is on its way.",
    successClose: "Close",
    duplicateError: "A membership application with this email already exists. To make changes, please",
    contactUs: "contact us",
    fileClick: "Click to select file",
    fileTypes: "PDF, JPEG, PNG \u2014 max 10 MB",
    fileAccepted: "Accepted: PDF, JPEG, PNG",
    fileSize: "File must be under 10 MB",
    uploading: "Uploading\u2026",
  },
  el: {
    title: "\u0391\u03AF\u03C4\u03B7\u03C3\u03B7 \u0395\u03B3\u03B3\u03C1\u03B1\u03C6\u03AE\u03C2",
    desc: "\u03A3\u03C5\u03BC\u03C0\u03BB\u03B7\u03C1\u03CE\u03C3\u03C4\u03B5 \u03C4\u03B7\u03BD \u03C0\u03B1\u03C1\u03B1\u03BA\u03AC\u03C4\u03C9 \u03C6\u03CC\u03C1\u03BC\u03B1 \u03B3\u03B9\u03B1 \u03BD\u03B1 \u03B3\u03AF\u03BD\u03B5\u03C4\u03B5 \u03BC\u03AD\u03BB\u03BF\u03C2 \u03C4\u03B7\u03C2 \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE\u03C2 \u0393\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1\u03C2.",
    firstName: "\u038C\u03BD\u03BF\u03BC\u03B1",
    lastName: "\u0395\u03C0\u03CE\u03BD\u03C5\u03BC\u03BF",
    email: "Email",
    memberType: "\u03A4\u03CD\u03C0\u03BF\u03C2 \u03A3\u03C5\u03BD\u03B4\u03C1\u03BF\u03BC\u03AE\u03C2",
    memberTypeSelect: "\u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5\u2026",
    researchStaff: "\u0395\u03C1\u03B5\u03C5\u03BD\u03B7\u03C4\u03B9\u03BA\u03CC \u03C0\u03C1\u03BF\u03C3\u03C9\u03C0\u03B9\u03BA\u03CC \u2014 20\u20AC/\u03AD\u03C4\u03BF\u03C2",
    student: "\u03A6\u03BF\u03B9\u03C4\u03B7\u03C4\u03AD\u03C2 \u2014 10\u20AC/\u03AD\u03C4\u03BF\u03C2",
    role: "\u0399\u03B4\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1",
    rolePlaceholder: "\u03C0.\u03C7. \u03A5\u03C0\u03BF\u03C8\u03AE\u03C6\u03B9\u03BF\u03C2 \u0394\u03B9\u03B4\u03AC\u03BA\u03C4\u03C9\u03C1, \u039A\u03B1\u03B8\u03B7\u03B3\u03B7\u03C4\u03AE\u03C2, \u0395\u03C1\u03B5\u03C5\u03BD\u03B7\u03C4\u03AE\u03C2",
    additionalInfo: "\u03A0\u03C1\u03CC\u03C3\u03B8\u03B5\u03C4\u03B5\u03C2 \u03A0\u03BB\u03B7\u03C1\u03BF\u03C6\u03BF\u03C1\u03AF\u03B5\u03C2",
    degree: "\u03A0\u03C4\u03C5\u03C7\u03AF\u03BF / \u0394\u03AF\u03C0\u03BB\u03C9\u03BC\u03B1",
    degreePlaceholder: "\u03C0.\u03C7. MSc \u0393\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03AF\u03B1",
    affiliation: "\u03A6\u03BF\u03C1\u03AD\u03B1\u03C2 / \u038A\u03B4\u03C1\u03C5\u03BC\u03B1",
    affiliationPlaceholder: "\u03C0.\u03C7. \u0395\u03B8\u03BD\u03B9\u03BA\u03CC \u03BA\u03B1\u03B9 \u039A\u03B1\u03C0\u03BF\u03B4\u03B9\u03C3\u03C4\u03C1\u03B9\u03B1\u03BA\u03CC \u03A0\u03B1\u03BD\u03B5\u03C0\u03B9\u03C3\u03C4\u03AE\u03BC\u03B9\u03BF \u0391\u03B8\u03B7\u03BD\u03CE\u03BD",
    country: "\u03A7\u03CE\u03C1\u03B1",
    countryPlaceholder: "\u03C0.\u03C7. \u0395\u03BB\u03BB\u03AC\u03B4\u03B1",
    receipt: "\u0391\u03C0\u03CC\u03B4\u03B5\u03B9\u03BE\u03B7 \u03A0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AE\u03C2",
    receiptHint: "(\u03C0\u03C1\u03BF\u03B1\u03B9\u03C1\u03B5\u03C4\u03B9\u03BA\u03CC \u2014 \u03BC\u03C0\u03BF\u03C1\u03B5\u03AF\u03C4\u03B5 \u03BD\u03B1 \u03C4\u03BF \u03B1\u03BD\u03B5\u03B2\u03AC\u03C3\u03B5\u03C4\u03B5 \u03B1\u03C1\u03B3\u03CC\u03C4\u03B5\u03C1\u03B1)",
    gdprTitle: "\u03A0\u03C1\u03BF\u03C3\u03C4\u03B1\u03C3\u03AF\u03B1 \u0394\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD (GDPR)",
    gdprText: "\u0397 \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE \u0393\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1 (\u0395\u0393\u0395) \u03C3\u03C5\u03BB\u03BB\u03AD\u03B3\u03B5\u03B9 \u03BA\u03B1\u03B9 \u03B5\u03C0\u03B5\u03BE\u03B5\u03C1\u03B3\u03AC\u03B6\u03B5\u03C4\u03B1\u03B9 \u03C4\u03B1 \u03C0\u03C1\u03BF\u03C3\u03C9\u03C0\u03B9\u03BA\u03AC \u03C3\u03B1\u03C2 \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03B1 \u03B3\u03B9\u03B1 \u03C4\u03B7 \u03B4\u03B9\u03B1\u03C7\u03B5\u03AF\u03C1\u03B9\u03C3\u03B7 \u03C4\u03C9\u03BD \u03BC\u03B5\u03BB\u03CE\u03BD \u03BA\u03B1\u03B9 \u03B3\u03B9\u03B1 \u03C4\u03BF \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF \u03C4\u03B7\u03C2 \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1\u03C2 \u03C3\u03B5 \u03C3\u03C7\u03AD\u03C3\u03B7 \u03BC\u03B5 \u03BC\u03B5\u03BB\u03BB\u03BF\u03BD\u03C4\u03B9\u03BA\u03AD\u03C2 \u03B5\u03BA\u03B4\u03B7\u03BB\u03CE\u03C3\u03B5\u03B9\u03C2 \u03BA\u03B1\u03B9 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2. \u03A4\u03B1 \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03B1 \u03C3\u03B1\u03C2 \u03B4\u03B5\u03BD \u03B8\u03B1 \u03BA\u03BF\u03B9\u03BD\u03BF\u03C0\u03BF\u03B9\u03B7\u03B8\u03BF\u03CD\u03BD \u03C3\u03B5 \u03C4\u03C1\u03AF\u03C4\u03BF\u03C5\u03C2. \u0388\u03C7\u03B5\u03C4\u03B5 \u03C4\u03BF \u03B4\u03B9\u03BA\u03B1\u03AF\u03C9\u03BC\u03B1 \u03C0\u03C1\u03CC\u03C3\u03B2\u03B1\u03C3\u03B7\u03C2, \u03B4\u03B9\u03CC\u03C1\u03B8\u03C9\u03C3\u03B7\u03C2 \u03AE \u03B4\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE\u03C2 \u03C4\u03C9\u03BD \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD \u03C3\u03B1\u03C2 \u03B1\u03BD\u03AC \u03C0\u03AC\u03C3\u03B1 \u03C3\u03C4\u03B9\u03B3\u03BC\u03AE \u03B5\u03C0\u03B9\u03BA\u03BF\u03B9\u03BD\u03C9\u03BD\u03CE\u03BD\u03C4\u03B1\u03C2 \u03C3\u03C4\u03BF",
    gdprConsent: "\u0388\u03C7\u03C9 \u03B4\u03B9\u03B1\u03B2\u03AC\u03C3\u03B5\u03B9 \u03BA\u03B1\u03B9 \u03C3\u03C5\u03BD\u03B1\u03B9\u03BD\u03CE \u03C3\u03C4\u03B7\u03BD \u03B5\u03C0\u03B5\u03BE\u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1 \u03C4\u03C9\u03BD \u03C0\u03C1\u03BF\u03C3\u03C9\u03C0\u03B9\u03BA\u03CE\u03BD \u03BC\u03BF\u03C5 \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD \u03CC\u03C0\u03C9\u03C2 \u03C0\u03B5\u03C1\u03B9\u03B3\u03C1\u03AC\u03C6\u03B5\u03C4\u03B1\u03B9 \u03C0\u03B1\u03C1\u03B1\u03C0\u03AC\u03BD\u03C9.",
    mailingTitle: "\u0395\u03BD\u03B7\u03BC\u03AD\u03C1\u03C9\u03C3\u03B7",
    mailingConsent: "\u0398\u03B1 \u03AE\u03B8\u03B5\u03BB\u03B1 \u03BD\u03B1 \u03BB\u03B1\u03BC\u03B2\u03AC\u03BD\u03C9 \u03B5\u03BD\u03B7\u03BC\u03B5\u03C1\u03CE\u03C3\u03B5\u03B9\u03C2 \u03B3\u03B9\u03B1 \u03BC\u03B5\u03BB\u03BB\u03BF\u03BD\u03C4\u03B9\u03BA\u03AD\u03C2 \u03B5\u03BA\u03B4\u03B7\u03BB\u03CE\u03C3\u03B5\u03B9\u03C2, \u03C3\u03C5\u03BD\u03AD\u03B4\u03C1\u03B9\u03B1 \u03BA\u03B1\u03B9 \u03B1\u03BD\u03B1\u03BA\u03BF\u03B9\u03BD\u03CE\u03C3\u03B5\u03B9\u03C2 \u03C4\u03B7\u03C2 \u0395\u0393\u0395.",
    mailingNote: "\u039C\u03C0\u03BF\u03C1\u03B5\u03AF\u03C4\u03B5 \u03BD\u03B1 \u03B1\u03BB\u03BB\u03AC\u03BE\u03B5\u03C4\u03B5 \u03B1\u03C5\u03C4\u03AE\u03BD \u03C4\u03B7\u03BD \u03C0\u03C1\u03BF\u03C4\u03AF\u03BC\u03B7\u03C3\u03B7 \u03B1\u03BD\u03AC \u03C0\u03AC\u03C3\u03B1 \u03C3\u03C4\u03B9\u03B3\u03BC\u03AE \u03B5\u03C0\u03B9\u03BA\u03BF\u03B9\u03BD\u03C9\u03BD\u03CE\u03BD\u03C4\u03B1\u03C2 \u03C3\u03C4\u03BF",
    submit: "\u03A5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE \u0391\u03AF\u03C4\u03B7\u03C3\u03B7\u03C2",
    submitting: "\u03A5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE\u2026",
    successTitle: "\u0397 \u03B1\u03AF\u03C4\u03B7\u03C3\u03B7 \u03C5\u03C0\u03BF\u03B2\u03BB\u03AE\u03B8\u03B7\u03BA\u03B5!",
    successText: "\u0395\u03C5\u03C7\u03B1\u03C1\u03B9\u03C3\u03C4\u03BF\u03CD\u03BC\u03B5 \u03B3\u03B9\u03B1 \u03C4\u03B7\u03BD \u03B1\u03AF\u03C4\u03B7\u03C3\u03AE \u03C3\u03B1\u03C2 \u03BD\u03B1 \u03B3\u03AF\u03BD\u03B5\u03C4\u03B5 \u03BC\u03AD\u03BB\u03BF\u03C2 \u03C4\u03B7\u03C2 \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE\u03C2 \u0393\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1\u03C2. \u0388\u03BD\u03B1 email \u03B5\u03C0\u03B9\u03B2\u03B5\u03B2\u03B1\u03AF\u03C9\u03C3\u03B7\u03C2 \u03B8\u03B1 \u03C3\u03B1\u03C2 \u03B1\u03C0\u03BF\u03C3\u03C4\u03B1\u03BB\u03B5\u03AF \u03C3\u03CD\u03BD\u03C4\u03BF\u03BC\u03B1.",
    successClose: "\u039A\u03BB\u03B5\u03AF\u03C3\u03B9\u03BC\u03BF",
    duplicateError: "\u03A5\u03C0\u03AC\u03C1\u03C7\u03B5\u03B9 \u03AE\u03B4\u03B7 \u03B1\u03AF\u03C4\u03B7\u03C3\u03B7 \u03BC\u03B5 \u03B1\u03C5\u03C4\u03CC \u03C4\u03BF email. \u0393\u03B9\u03B1 \u03B1\u03BB\u03BB\u03B1\u03B3\u03AD\u03C2, \u03C0\u03B1\u03C1\u03B1\u03BA\u03B1\u03BB\u03BF\u03CD\u03BC\u03B5",
    contactUs: "\u03B5\u03C0\u03B9\u03BA\u03BF\u03B9\u03BD\u03C9\u03BD\u03AE\u03C3\u03C4\u03B5 \u03BC\u03B1\u03B6\u03AF \u03BC\u03B1\u03C2",
    fileClick: "\u039A\u03BB\u03B9\u03BA \u03B3\u03B9\u03B1 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF\u03C5",
    fileTypes: "PDF, JPEG, PNG \u2014 \u03BC\u03AD\u03B3. 10 MB",
    fileAccepted: "\u0391\u03C0\u03BF\u03B4\u03B5\u03BA\u03C4\u03AC: PDF, JPEG, PNG",
    fileSize: "\u03A4\u03BF \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03BA\u03AC\u03C4\u03C9 \u03B1\u03C0\u03CC 10 MB",
    uploading: "\u039C\u03B5\u03C4\u03B1\u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7\u2026",
  },
}

type Locale = "en" | "el"

export function MembershipForm({ locale }: { locale: Locale }) {
  const t = text[locale]
  const [success, setSuccess]         = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [showExtra, setShowExtra]     = useState(false)

  const [receiptFile, setReceiptFile]   = useState<File | null>(null)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const receiptRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { mailing_consent: false, gdpr_consent: false },
    })

  const validateFile = (f: File | undefined) => {
    if (!f) return
    if (!ACCEPTED.includes(f.type)) { setReceiptError(t.fileAccepted); return }
    if (f.size > MAX_BYTES)         { setReceiptError(t.fileSize); return }
    setReceiptError(null)
    setReceiptFile(f)
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    setIsDuplicate(false)

    const supabase = getSupabaseClient()
    if (!supabase) { setServerError("Service unavailable. Please try again later."); return }

    const normalized = data.email.trim().toLowerCase()

    // Duplicate check
    const { data: existing } = await supabase
      .from("membership_applications").select("id").ilike("email", normalized).maybeSingle()
    if (existing) { setIsDuplicate(true); setServerError("duplicate"); return }

    // Upload receipt if provided
    let receiptPath: string | null = null
    if (receiptFile) {
      const ext  = receiptFile.name.split(".").pop()
      const path = `${Date.now()}-${normalized.replace(/[@.]/g, "_")}.${ext}`
      const { error: uploadErr } = await supabase.storage.from("membership-receipts").upload(path, receiptFile)
      if (uploadErr) { setServerError("File upload failed. Please try again."); return }
      receiptPath = path
    }

    // Insert application
    const { error } = await supabase.from("membership_applications").insert([{
      first_name:      data.first_name,
      last_name:       data.last_name,
      email:           normalized,
      member_type:     data.member_type,
      role:            data.role,
      degree:          data.degree || null,
      affiliation:     data.affiliation || null,
      country:         data.country || null,
      receipt_path:    receiptPath,
      gdpr_consent:    data.gdpr_consent,
      mailing_consent: data.mailing_consent,
    }])

    if (error) { setServerError("Something went wrong. Please try again."); return }

    // Send confirmation email (fire-and-forget)
    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "membership",
        email: normalized,
        first_name: data.first_name,
        last_name: data.last_name,
        member_type: data.member_type,
        role: data.role,
      }),
    }).catch(() => {})

    setSuccess(true)
  }

  const handleReset = () => {
    reset()
    setSuccess(false)
    setServerError(null)
    setIsDuplicate(false)
    setReceiptFile(null)
    setReceiptError(null)
    setShowExtra(false)
  }

  if (success) {
    return (
      <div className="py-10 text-center space-y-4">
        <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
        <h3 className="text-xl font-semibold text-black">{t.successTitle}</h3>
        <p className="text-sm text-black/50 leading-relaxed max-w-md mx-auto">{t.successText}</p>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-black text-white text-sm rounded-full hover:bg-black/80 transition-colors cursor-pointer"
        >
          {t.successClose}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="m-first">{t.firstName} *</Label>
          <Input id="m-first" {...register("first_name")} aria-invalid={!!errors.first_name} />
          {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-last">{t.lastName} *</Label>
          <Input id="m-last" {...register("last_name")} aria-invalid={!!errors.last_name} />
          {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="m-email">{t.email} *</Label>
        <Input id="m-email" type="email" {...register("email")} aria-invalid={!!errors.email} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      {/* Member type */}
      <div className="space-y-1.5">
        <Label htmlFor="m-type">{t.memberType} *</Label>
        <Select id="m-type" {...register("member_type")} aria-invalid={!!errors.member_type}>
          <option value="">{t.memberTypeSelect}</option>
          <option value="research_staff">{t.researchStaff}</option>
          <option value="student">{t.student}</option>
        </Select>
        {errors.member_type && <p className="text-xs text-red-500">{errors.member_type.message}</p>}
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <Label htmlFor="m-role">{t.role} *</Label>
        <Input id="m-role" placeholder={t.rolePlaceholder} {...register("role")} aria-invalid={!!errors.role} />
        {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
      </div>

      {/* Expandable additional info */}
      <div className="rounded-xl border border-black/10 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExtra(!showExtra)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-black/60 hover:bg-black/[0.02] transition-colors cursor-pointer"
        >
          {t.additionalInfo}
          <ChevronDown className={`h-4 w-4 transition-transform ${showExtra ? "rotate-180" : ""}`} />
        </button>
        {showExtra && (
          <div className="px-4 pb-4 space-y-4 border-t border-black/10">
            <div className="space-y-1.5 pt-4">
              <Label htmlFor="m-degree">{t.degree}</Label>
              <Input id="m-degree" placeholder={t.degreePlaceholder} {...register("degree")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-affiliation">{t.affiliation}</Label>
              <Input id="m-affiliation" placeholder={t.affiliationPlaceholder} {...register("affiliation")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-country">{t.country}</Label>
              <Input id="m-country" placeholder={t.countryPlaceholder} {...register("country")} />
            </div>
          </div>
        )}
      </div>

      {/* Receipt upload */}
      <div className="space-y-1.5">
        <Label>
          {t.receipt}{" "}
          <span className="font-normal text-black/40">{t.receiptHint}</span>
        </Label>
        {receiptFile ? (
          <div className="flex items-center gap-2 p-2 border border-black/10 rounded-lg text-sm">
            <span className="flex-1 truncate">{receiptFile.name}</span>
            <button
              type="button"
              onClick={() => { setReceiptFile(null); setReceiptError(null); if (receiptRef.current) receiptRef.current.value = "" }}
              className="text-black/30 hover:text-black transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 border-2 border-dashed border-black/10 rounded-lg p-5 text-sm text-black/40 cursor-pointer hover:border-black/20 hover:bg-black/5 transition-colors">
            <UploadCloud className="h-6 w-6" />
            <span>{t.fileClick}</span>
            <span className="text-xs">{t.fileTypes}</span>
            <input
              ref={receiptRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={e => validateFile(e.target.files?.[0])}
            />
          </label>
        )}
        {receiptError && <p className="text-xs text-red-500">{receiptError}</p>}
      </div>

      {/* GDPR consent */}
      <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 space-y-2.5">
        <p className="text-xs font-semibold text-black/60 uppercase tracking-wider">{t.gdprTitle} *</p>
        <p className="text-xs text-black/50 leading-relaxed">
          {t.gdprText}{" "}
          <a href="mailto:geographicalsocietyhellas@gmail.com" className="underline">geographicalsocietyhellas@gmail.com</a>.
        </p>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" {...register("gdpr_consent")} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-black" />
          <span className="text-xs text-black/70 leading-relaxed group-hover:text-black transition-colors">{t.gdprConsent}</span>
        </label>
        {errors.gdpr_consent && <p className="text-xs text-red-500">{errors.gdpr_consent.message}</p>}
      </div>

      {/* Mailing consent */}
      <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 space-y-2.5">
        <p className="text-xs font-semibold text-black/60 uppercase tracking-wider">{t.mailingTitle}</p>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" {...register("mailing_consent")} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-black" />
          <span className="text-xs text-black/50 leading-relaxed group-hover:text-black/70 transition-colors">{t.mailingConsent}</span>
        </label>
        <p className="text-xs text-black/35 leading-relaxed pl-7">
          {t.mailingNote}{" "}
          <a href="mailto:geographicalsocietyhellas@gmail.com" className="underline">geographicalsocietyhellas@gmail.com</a>.
        </p>
      </div>

      {/* Error display */}
      {serverError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {isDuplicate ? (
            <p>{t.duplicateError} <a href={SUPPORT_HREF} className="underline font-medium">{t.contactUs}</a>.</p>
          ) : (
            <p>{serverError}{" \u2014 "}<a href={SUPPORT_HREF} className="underline font-medium">{t.contactUs}</a></p>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {isSubmitting ? t.submitting : t.submit}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd "/c/Users/alexl/Projects/Github Repos/HGS-web/HGS" && npx next build 2>&1 | head -30`

This will fail because the page importing it doesn't exist yet — that's expected. Verify no TypeScript errors in this component specifically.

- [ ] **Step 3: Commit**

```bash
git add src/components/membership/registration-form.tsx
git commit -m "Add membership registration form component"
```

---

### Task 2: Create the dedicated membership registration page

**Files:**
- Create: `src/app/[locale]/society/registration/page.tsx`

This page replaces the markdown-rendered registration page with a structured layout containing the committee's original text and the new interactive form.

- [ ] **Step 1: Create the page file**

```tsx
import { Mail } from "lucide-react"
import { FadeIn, FadeInView } from "@/components/ui/motion"
import { MembershipForm } from "@/components/membership/registration-form"
import { siteConfig, type Locale } from "@/config/site"

interface PageProps {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "el" }]
}

const pageText = {
  en: {
    title: "Registration",
    welcomeGreeting: "Dear Member,",
    welcomeBody: "The Board of Directors of the Hellenic Geographical Society welcomes you to the Greek geographical community.",
    welcomeInvite: "On behalf of the Board of Directors, we invite you to become a member of the Hellenic Geographical Society. To complete your registration, please fill in the membership application form below.",
    paymentInvite: "We also invite you to pay or renew your membership fee via bank transfer to the HGS account at Piraeus Bank.",
    subscriptionNote: "These subscriptions are vital to the Society\u2019s operations, growth, and long-term sustainability. They also enable us to organise events and to promote the geographical sciences. We sincerely thank you for your support of this effort. By maintaining your membership, you contribute to the advancement of the Hellenic Geographical Society\u2019s initiatives for the benefit of the Greek geographical community.",
    closing: "With geographical regards,",
    closingFrom: "The Board of Directors",
    closingOrg: "Hellenic Geographical Society",
    feesTitle: "Membership Fees",
    feesAnnual: "Annual membership:",
    feeResearch: "Research staff: \u20AC20",
    feeStudent: "Students: \u20AC10",
    benefitsTitle: "Member Benefits",
    benefitsIntro: "As a member of the Hellenic Geographical Society, you will be able to:",
    benefits: [
      "Stay informed about Scientific Events & International Conferences",
      "Access Authoritative Studies",
      "Collaborate with People Who Share Your Interests",
      "Promote Education",
      "Strengthen Geographical Knowledge & Environmental Awareness",
      "Support Research & Innovation",
    ],
    cta1: "Become a member today and actively contribute to the development and dissemination of geographical knowledge in Greece and worldwide!",
    cta2: "Let us shape the future of geography together!",
    cta3: "Join the geographical community!",
    privilegesTitle: "Member Privileges",
    privilegesIntro: "Current members of the Hellenic Geographical Society are entitled to the following benefits:",
    privileges: [
      "Reduced Registration Fee for participation in HGS conferences and other scientific events in which the Society takes part",
      "Free Attendance at Workshops and Lectures organised by the Society, offering access to informative events at no cost",
      "Voting Rights in elections, allowing you to contribute to shaping the future of the Society",
    ],
    bankTitle: "Banking Information",
    bankIban: "IBAN",
    bankBic: "BIC / SWIFT",
    bankRef: "Reference",
    bankRefValue: "Membership HGS + year",
    contactTitle: "Contact",
    contactText: "For any clarification or questions, you may contact the Secretary of the Hellenic Geographical Society at:",
    thankYou: "We sincerely thank you for your participation and ongoing support.",
    thankYouClosing: "With your contribution, the Hellenic Geographical Society continues to promote geographical science and strengthen the scientific community.",
  },
  el: {
    title: "\u0395\u03B3\u03B3\u03C1\u03B1\u03C6\u03AE",
    welcomeGreeting: "",
    welcomeBody: "\u03A4\u03BF \u0394\u03B9\u03BF\u03B9\u03BA\u03B7\u03C4\u03B9\u03BA\u03CC \u03A3\u03C5\u03BC\u03B2\u03BF\u03CD\u03BB\u03B9\u03BF \u03C4\u03B7\u03C2 \u0395\u0393\u0395 \u03C3\u03B1\u03C2 \u03BA\u03B1\u03BB\u03C9\u03C3\u03BF\u03C1\u03AF\u03B6\u03B5\u03B9 \u03C3\u03C4\u03B7\u03BD \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE \u03BA\u03BF\u03B9\u03BD\u03CC\u03C4\u03B7\u03C4\u03B1.",
    welcomeInvite: "\u0395\u03BA \u03BC\u03AD\u03C1\u03BF\u03C5\u03C2 \u03C4\u03BF\u03C5 \u0394\u03B9\u03BF\u03B9\u03BA\u03B7\u03C4\u03B9\u03BA\u03BF\u03CD \u03A3\u03C5\u03BC\u03B2\u03BF\u03C5\u03BB\u03AF\u03BF\u03C5, \u03C3\u03B1\u03C2 \u03C0\u03C1\u03BF\u03C3\u03BA\u03B1\u03BB\u03BF\u03CD\u03BC\u03B5 \u03BD\u03B1 \u03B3\u03AF\u03BD\u03B5\u03C4\u03B5 \u03BC\u03AD\u03BB\u03B7 \u03C4\u03B7\u03C2 \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE\u03C2 \u0393\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1\u03C2. \u0393\u03B9\u03B1 \u03C4\u03B7\u03BD \u03B5\u03B3\u03B3\u03C1\u03B1\u03C6\u03AE \u03C3\u03B1\u03C2, \u03C0\u03B1\u03C1\u03B1\u03BA\u03B1\u03BB\u03B5\u03AF\u03C3\u03C4\u03B5 \u03BD\u03B1 \u03C3\u03C5\u03BC\u03C0\u03BB\u03B7\u03C1\u03CE\u03C3\u03B5\u03C4\u03B5 \u03C4\u03B7\u03BD \u03C0\u03B1\u03C1\u03B1\u03BA\u03AC\u03C4\u03C9 \u03C6\u03CC\u03C1\u03BC\u03B1 \u03BC\u03AD\u03BB\u03BF\u03C5\u03C2.",
    paymentInvite: "\u03A3\u03B1\u03C2 \u03BA\u03B1\u03BB\u03BF\u03CD\u03BC\u03B5 \u03BD\u03B1 \u03C0\u03BB\u03B7\u03C1\u03CE\u03C3\u03B5\u03C4\u03B5, \u03BA\u03B1\u03B9 \u03BD\u03B1 \u03B1\u03BD\u03B1\u03BD\u03B5\u03CE\u03C3\u03B5\u03C4\u03B5 \u03C4\u03B7 \u03C3\u03C5\u03BD\u03B4\u03C1\u03BF\u03BC\u03AE, \u03C3\u03B1\u03C2 \u03BC\u03AD\u03C3\u03C9 \u03C4\u03C1\u03B1\u03C0\u03B5\u03B6\u03B9\u03BA\u03AE\u03C2 \u03BC\u03B5\u03C4\u03B1\u03C6\u03BF\u03C1\u03AC\u03C2 \u03C3\u03C4\u03BF\u03BD \u03BB\u03BF\u03B3\u03B1\u03C1\u03B9\u03B1\u03C3\u03BC\u03CC \u03C4\u03B7\u03C2 \u0395\u0393\u0395 \u03C3\u03C4\u03B7\u03BD \u03A4\u03C1\u03AC\u03C0\u03B5\u03B6\u03B1 \u03A0\u03B5\u03B9\u03C1\u03B1\u03B9\u03CE\u03C2.",
    subscriptionNote: "\u039F\u03B9 \u03C3\u03C5\u03BD\u03B4\u03C1\u03BF\u03BC\u03AD\u03C2 \u03B1\u03C5\u03C4\u03AD\u03C2 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03B6\u03C9\u03C4\u03B9\u03BA\u03AE\u03C2 \u03C3\u03B7\u03BC\u03B1\u03C3\u03AF\u03B1\u03C2 \u03B3\u03B9\u03B1 \u03C4\u03B7 \u03BB\u03B5\u03B9\u03C4\u03BF\u03C5\u03C1\u03B3\u03AF\u03B1, \u03C4\u03B7\u03BD \u03B1\u03BD\u03AC\u03C0\u03C4\u03C5\u03BE\u03B7 \u03BA\u03B1\u03B9 \u03C4\u03B7 \u03B4\u03B9\u03B1\u03C3\u03C6\u03AC\u03BB\u03B9\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03B2\u03B9\u03C9\u03C3\u03B9\u03BC\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2 \u03C4\u03B7\u03C2 \u0395\u0393\u0395. \u0395\u03C0\u03AF\u03C3\u03B7\u03C2, \u03B5\u03C0\u03B9\u03C4\u03C1\u03AD\u03C0\u03BF\u03C5\u03BD \u03C4\u03B7\u03BD \u03B4\u03B9\u03BF\u03C1\u03B3\u03AC\u03BD\u03C9\u03C3\u03B7 \u03B5\u03BA\u03B4\u03B7\u03BB\u03CE\u03C3\u03B5\u03C9\u03BD \u03BA\u03B1\u03B9 \u03C4\u03B7\u03BD \u03C0\u03C1\u03BF\u03CE\u03B8\u03B7\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u03B5\u03C0\u03B9\u03C3\u03C4\u03AE\u03BC\u03B7\u03C2. \u03A3\u03B1\u03C2 \u03B5\u03C5\u03C7\u03B1\u03C1\u03B9\u03C3\u03C4\u03BF\u03CD\u03BC\u03B5 \u03B8\u03B5\u03C1\u03BC\u03AC \u03C0\u03BF\u03C5 \u03C3\u03C4\u03B7\u03C1\u03AF\u03B6\u03B5\u03C4\u03B5 \u03B1\u03C5\u03C4\u03AE\u03BD \u03C4\u03B7\u03BD \u03C0\u03C1\u03BF\u03C3\u03C0\u03AC\u03B8\u03B5\u03B9\u03B1. \u039C\u03B5 \u03C4\u03B7\u03BD \u03B5\u03B3\u03B3\u03C1\u03B1\u03C6\u03AE \u03C3\u03B1\u03C2, \u03C3\u03C5\u03BC\u03B2\u03AC\u03BB\u03BB\u03B5\u03C4\u03B5 \u03C3\u03C4\u03B7\u03BD \u03C5\u03C0\u03BF\u03C3\u03C4\u03AE\u03C1\u03B9\u03BE\u03B7 \u03C4\u03C9\u03BD \u03B4\u03C1\u03AC\u03C3\u03B5\u03C9\u03BD \u03C4\u03B7\u03C2 \u0395\u0393\u0395 \u03C0\u03C1\u03BF\u03C2 \u03CC\u03C6\u03B5\u03BB\u03BF\u03C2 \u03C4\u03B7\u03C2 \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE\u03C2 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u03BA\u03BF\u03B9\u03BD\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2!",
    closing: "\u039C\u03B5 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03BF\u03CD\u03C2 \u03C7\u03B1\u03B9\u03C1\u03B5\u03C4\u03B9\u03C3\u03BC\u03BF\u03CD\u03C2,",
    closingFrom: "\u03A4\u03BF \u0394\u03B9\u03BF\u03B9\u03BA\u03B7\u03C4\u03B9\u03BA\u03CC \u03A3\u03C5\u03BC\u03B2\u03BF\u03CD\u03BB\u03B9\u03BF",
    closingOrg: "\u03C4\u03B7\u03C2 \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE\u03C2 \u0393\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u0395\u03C4\u03B1\u03B9\u03C1\u03AF\u03B1\u03C2",
    feesTitle: "\u03A3\u03C5\u03BD\u03B4\u03C1\u03BF\u03BC\u03AD\u03C2",
    feesAnnual: "\u0395\u03B3\u03B3\u03C1\u03B1\u03C6\u03AE \u03C3\u03C4\u03B7\u03BD \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1 \u03B3\u03B9\u03B1 \u03AD\u03BD\u03B1 \u03C7\u03C1\u03CC\u03BD\u03BF:",
    feeResearch: "\u0395\u03C1\u03B5\u03C5\u03BD\u03B7\u03C4\u03B9\u03BA\u03CC \u03C0\u03C1\u03BF\u03C3\u03C9\u03C0\u03B9\u03BA\u03CC: 20\u20AC",
    feeStudent: "\u03A6\u03BF\u03B9\u03C4\u03B7\u03C4\u03AD\u03C2: 10\u20AC",
    benefitsTitle: "\u03A0\u03BB\u03B5\u03BF\u03BD\u03B5\u03BA\u03C4\u03AE\u03BC\u03B1\u03C4\u03B1 \u039C\u03AD\u03BB\u03BF\u03C5\u03C2",
    benefitsIntro: "\u03A9\u03C2 \u03BC\u03AD\u03BB\u03BF\u03C2 \u03C4\u03B7\u03C2 \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE\u03C2 \u0393\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1\u03C2 \u03B8\u03B1 \u03AD\u03C7\u03B5\u03C4\u03B5 \u03C4\u03B7 \u03B4\u03C5\u03BD\u03B1\u03C4\u03CC\u03C4\u03B7\u03C4\u03B1 \u03BD\u03B1:",
    benefits: [
      "\u0395\u03BD\u03B7\u03BC\u03B5\u03C1\u03C9\u03B8\u03B5\u03AF\u03C4\u03B5 \u03B3\u03B9\u03B1 \u03B5\u03C0\u03B9\u03C3\u03C4\u03B7\u03BC\u03BF\u03BD\u03B9\u03BA\u03AD\u03C2 \u03B5\u03BA\u03B4\u03B7\u03BB\u03CE\u03C3\u03B5\u03B9\u03C2 & \u03B4\u03B9\u03B5\u03B8\u03BD\u03AE \u03C3\u03C5\u03BD\u03AD\u03B4\u03C1\u03B9\u03B1",
      "\u0391\u03C0\u03BF\u03BA\u03C4\u03AE\u03C3\u03B5\u03C4\u03B5 \u03C0\u03C1\u03CC\u03C3\u03B2\u03B1\u03C3\u03B7 \u03C3\u03B5 \u03AD\u03B3\u03BA\u03C1\u03B9\u03C4\u03B5\u03C2 \u03BC\u03B5\u03BB\u03AD\u03C4\u03B5\u03C2",
      "\u03A3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03B5\u03AF\u03C4\u03B5 \u03BC\u03B5 \u03AC\u03C4\u03BF\u03BC\u03B1 \u03BC\u03B5 \u03BA\u03BF\u03B9\u03BD\u03AC \u03B5\u03BD\u03B4\u03B9\u03B1\u03C6\u03AD\u03C1\u03BF\u03BD\u03C4\u03B1",
      "\u03A0\u03C1\u03BF\u03C9\u03B8\u03AE\u03C3\u03B5\u03C4\u03B5 \u03C4\u03B7\u03BD \u03B5\u03BA\u03C0\u03B1\u03AF\u03B4\u03B5\u03C5\u03C3\u03B7",
      "\u0395\u03BD\u03B9\u03C3\u03C7\u03CD\u03C3\u03B5\u03C4\u03B5 \u03C4\u03B7 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE \u03B3\u03BD\u03CE\u03C3\u03B7 & \u03C4\u03B7\u03BD \u03C0\u03B5\u03C1\u03B9\u03B2\u03B1\u03BB\u03BB\u03BF\u03BD\u03C4\u03B9\u03BA\u03AE \u03B5\u03C5\u03B1\u03B9\u03C3\u03B8\u03B7\u03C4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7",
      "\u03A3\u03C4\u03B7\u03C1\u03AF\u03BE\u03B5\u03C4\u03B5 \u03C4\u03B7\u03BD \u03AD\u03C1\u03B5\u03C5\u03BD\u03B1 & \u03BA\u03B1\u03B9\u03BD\u03BF\u03C4\u03BF\u03BC\u03AF\u03B1",
    ],
    cta1: "\u0393\u03AF\u03BD\u03B5\u03C4\u03B5 \u03BC\u03AD\u03BB\u03BF\u03C2 \u03C3\u03AE\u03BC\u03B5\u03C1\u03B1 \u03BA\u03B1\u03B9 \u03C3\u03C5\u03BC\u03B2\u03AC\u03BB\u03BB\u03B5\u03C4\u03B5 \u03B5\u03BD\u03B5\u03C1\u03B3\u03AC \u03C3\u03C4\u03B7\u03BD \u03B1\u03BD\u03AC\u03C0\u03C4\u03C5\u03BE\u03B7 \u03BA\u03B1\u03B9 \u03C4\u03B7 \u03B4\u03B9\u03AC\u03B4\u03BF\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u03B3\u03BD\u03CE\u03C3\u03B7\u03C2, \u03C3\u03C4\u03B7\u03BD \u0395\u03BB\u03BB\u03AC\u03B4\u03B1 \u03BA\u03B1\u03B9 \u03C0\u03B1\u03B3\u03BA\u03BF\u03C3\u03BC\u03AF\u03C9\u03C2!",
    cta2: "\u0391\u03C2 \u03C7\u03C4\u03AF\u03C3\u03BF\u03C5\u03BC\u03B5 \u03BC\u03B1\u03B6\u03AF \u03C4\u03BF \u03BC\u03AD\u03BB\u03BB\u03BF\u03BD \u03C4\u03B7\u03C2 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03AF\u03B1\u03C2!",
    cta3: "\u0393\u03AF\u03BD\u03B5\u03C4\u03B5 \u03BC\u03AD\u03BB\u03BF\u03C2 \u03C4\u03B7\u03C2 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u03BA\u03BF\u03B9\u03BD\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2!",
    privilegesTitle: "\u03A0\u03B1\u03C1\u03BF\u03C7\u03AD\u03C2 \u039C\u03B5\u03BB\u03CE\u03BD",
    privilegesIntro: "\u03A4\u03B1 \u03B5\u03BD\u03AE\u03BC\u03B5\u03C1\u03B1 \u03BC\u03AD\u03BB\u03B7 \u03C4\u03B7\u03C2 \u0395\u0393\u0395, \u03AD\u03C7\u03BF\u03C5\u03BD \u03C4\u03B9\u03C2 \u03C0\u03B1\u03C1\u03B1\u03BA\u03AC\u03C4\u03C9 \u03C0\u03B1\u03C1\u03BF\u03C7\u03AD\u03C2:",
    privileges: [
      "\u039C\u03B5\u03B9\u03C9\u03BC\u03AD\u03BD\u03BF \u03BA\u03CC\u03C3\u03C4\u03BF\u03C2 \u03B5\u03B3\u03B3\u03C1\u03B1\u03C6\u03AE\u03C2 \u03B3\u03B9\u03B1 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03BF\u03C7\u03AE \u03C3\u03C4\u03B1 \u03C3\u03C5\u03BD\u03AD\u03B4\u03C1\u03B9\u03B1 \u03C4\u03B7\u03C2 \u0395\u0393\u0395, \u03BA\u03B1\u03B8\u03CE\u03C2 \u03BA\u03B1\u03B9 \u03C3\u03B5 \u03AC\u03BB\u03BB\u03B5\u03C2 \u03B5\u03C0\u03B9\u03C3\u03C4\u03B7\u03BC\u03BF\u03BD\u03B9\u03BA\u03AD\u03C2 \u03B5\u03BA\u03B4\u03B7\u03BB\u03CE\u03C3\u03B5\u03B9\u03C2 \u03C3\u03C4\u03B9\u03C2 \u03BF\u03C0\u03BF\u03AF\u03B5\u03C2 \u03B7 \u0395\u0393\u0395 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03AD\u03C7\u03B5\u03B9",
      "\u0394\u03C9\u03C1\u03B5\u03AC\u03BD \u03C0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03CD\u03B8\u03B7\u03C3\u03B7 \u03B7\u03BC\u03B5\u03C1\u03AF\u03B4\u03C9\u03BD \u03BA\u03B1\u03B9 \u03B4\u03B9\u03B1\u03BB\u03AD\u03BE\u03B5\u03C9\u03BD \u03B3\u03B9\u03B1 \u03C0\u03C1\u03CC\u03C3\u03B2\u03B1\u03C3\u03B7 \u03C7\u03C9\u03C1\u03AF\u03C2 \u03B5\u03C0\u03B9\u03B2\u03AC\u03C1\u03C5\u03BD\u03C3\u03B7 \u03C3\u03C4\u03B9\u03C2 \u03B5\u03BD\u03B7\u03BC\u03B5\u03C1\u03C9\u03C4\u03B9\u03BA\u03AD\u03C2 \u03B7\u03BC\u03B5\u03C1\u03AF\u03B4\u03B5\u03C2 \u03BA\u03B1\u03B9 \u03B4\u03B9\u03B1\u03BB\u03AD\u03BE\u03B5\u03B9\u03C2 \u03C0\u03BF\u03C5 \u03B4\u03B9\u03BF\u03C1\u03B3\u03B1\u03BD\u03CE\u03BD\u03B5\u03B9 \u03B7 \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1",
      "\u0394\u03B9\u03BA\u03B1\u03AF\u03C9\u03BC\u03B1 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03BF\u03C7\u03AE\u03C2 \u03C3\u03C4\u03B9\u03C2 \u03B5\u03BA\u03BB\u03BF\u03B3\u03B9\u03BA\u03AD\u03C2 \u03B4\u03B9\u03B1\u03B4\u03B9\u03BA\u03B1\u03C3\u03AF\u03B5\u03C2 \u03BA\u03B1\u03B9 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03AE \u03C3\u03C4\u03B7 \u03B4\u03B9\u03B1\u03BC\u03CC\u03C1\u03C6\u03C9\u03C3\u03B7 \u03C4\u03BF\u03C5 \u03BC\u03AD\u03BB\u03BB\u03BF\u03BD\u03C4\u03BF\u03C2 \u03C4\u03B7\u03C2 \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1\u03C2",
    ],
    bankTitle: "\u03A0\u03BB\u03B7\u03C1\u03BF\u03C6\u03BF\u03C1\u03AF\u03B5\u03C2 \u03A0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AE\u03C2",
    bankIban: "IBAN",
    bankBic: "BIC / SWIFT",
    bankRef: "\u03A0\u03BB\u03B7\u03C1\u03BF\u03C6\u03BF\u03C1\u03AF\u03B5\u03C2 \u03B3\u03B9\u03B1 \u03C4\u03BF\u03BD \u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03CD\u03C7\u03BF",
    bankRefValue: "\u03A3\u03C5\u03BD\u03B4\u03C1\u03BF\u03BC\u03AE \u0395\u0393\u0395 + \u03AD\u03C4\u03BF\u03C2",
    contactTitle: "\u0395\u03C0\u03B9\u03BA\u03BF\u03B9\u03BD\u03C9\u03BD\u03AF\u03B1",
    contactText: "\u0393\u03B9\u03B1 \u03BF\u03C0\u03BF\u03B9\u03B1\u03B4\u03AE\u03C0\u03BF\u03C4\u03B5 \u03B4\u03B9\u03B5\u03C5\u03BA\u03C1\u03AF\u03BD\u03B9\u03C3\u03B7 \u03AE \u03B1\u03C0\u03BF\u03C1\u03AF\u03B1, \u03BC\u03C0\u03BF\u03C1\u03B5\u03AF\u03C4\u03B5 \u03BD\u03B1 \u03B5\u03C0\u03B9\u03BA\u03BF\u03B9\u03BD\u03C9\u03BD\u03AE\u03C3\u03B5\u03C4\u03B5 \u03BC\u03B5 \u03C4\u03BF\u03BD \u03B3\u03C1\u03B1\u03BC\u03BC\u03B1\u03C4\u03AD\u03B1 \u03C4\u03B7\u03C2 \u0395\u0393\u0395 \u03C3\u03C4\u03BF:",
    thankYou: "\u03A3\u03B1\u03C2 \u03B5\u03C5\u03C7\u03B1\u03C1\u03B9\u03C3\u03C4\u03BF\u03CD\u03BC\u03B5 \u03B8\u03B5\u03C1\u03BC\u03AC \u03B3\u03B9\u03B1 \u03C4\u03B7 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03BF\u03C7\u03AE \u03BA\u03B1\u03B9 \u03C4\u03B7 \u03C3\u03C5\u03BD\u03B5\u03C7\u03AE \u03C5\u03C0\u03BF\u03C3\u03C4\u03AE\u03C1\u03B9\u03BE\u03AE \u03C3\u03B1\u03C2.",
    thankYouClosing: "\u039C\u03B5 \u03C4\u03B7 \u03B4\u03B9\u03BA\u03AE \u03C3\u03B1\u03C2 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03AE, \u03B7 \u0395\u0393\u0395 \u03C3\u03C5\u03BD\u03B5\u03C7\u03AF\u03B6\u03B5\u03B9 \u03BD\u03B1 \u03C0\u03C1\u03BF\u03AC\u03B3\u03B5\u03B9 \u03C4\u03B7 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE \u03B5\u03C0\u03B9\u03C3\u03C4\u03AE\u03BC\u03B7 \u03BA\u03B1\u03B9 \u03BD\u03B1 \u03B5\u03BD\u03B4\u03C5\u03BD\u03B1\u03BC\u03CE\u03BD\u03B5\u03B9 \u03C4\u03B7\u03BD \u03B5\u03C0\u03B9\u03C3\u03C4\u03B7\u03BC\u03BF\u03BD\u03B9\u03BA\u03AE \u03BA\u03BF\u03B9\u03BD\u03CC\u03C4\u03B7\u03C4\u03B1.",
  },
}

export default async function MembershipRegistrationPage({ params }: PageProps) {
  const { locale } = await params
  const validLocale = (locale === "el" ? "el" : "en") as Locale
  const t = pageText[validLocale]

  return (
    <>
      {/* Welcome */}
      <section className="relative pt-32 pb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-black tracking-tight">
                {t.title}
              </h1>
            </div>
            <div className="max-w-3xl mx-auto space-y-4 text-black/70 leading-relaxed">
              {t.welcomeGreeting && <p className="font-medium text-black">{t.welcomeGreeting}</p>}
              <p>{t.welcomeBody}</p>
              <p>{t.welcomeInvite}</p>
              <p>{t.paymentInvite}</p>
              <p>{t.subscriptionNote}</p>
              <div className="pt-4">
                <p className="italic text-black/60">{t.closing}</p>
                <p className="font-medium text-black">{t.closingFrom}</p>
                <p className="text-black/60">{t.closingOrg}</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Fees + Benefits + Privileges */}
      <section className="py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeInView delay={0.1}>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Fees */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-black mb-4">{t.feesTitle}</h3>
                <p className="text-sm font-medium text-black/70 mb-3">{t.feesAnnual}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-black/5">
                    <span className="text-sm text-black/70">{t.feeResearch.split(":")[0]}</span>
                    <span className="text-sm font-semibold text-black">{t.feeResearch.split(":")[1]?.trim() || "\u20AC20"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-black/70">{t.feeStudent.split(":")[0]}</span>
                    <span className="text-sm font-semibold text-black">{t.feeStudent.split(":")[1]?.trim() || "\u20AC10"}</span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-black mb-4">{t.benefitsTitle}</h3>
                <p className="text-sm text-black/60 mb-3">{t.benefitsIntro}</p>
                <ul className="space-y-2">
                  {t.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-black/70">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-black/30 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeInView>

          {/* CTA */}
          <FadeInView delay={0.12}>
            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm text-center space-y-2">
              <p className="text-sm font-semibold italic text-black/70">{t.cta1}</p>
              <p className="text-sm font-semibold italic text-black/70">{t.cta2}</p>
              <p className="text-sm font-semibold italic text-black/70">{t.cta3}</p>
            </div>
          </FadeInView>

          {/* Privileges */}
          <FadeInView delay={0.14}>
            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-black mb-4">{t.privilegesTitle}</h3>
              <p className="text-sm text-black/60 mb-3">{t.privilegesIntro}</p>
              <ul className="space-y-2">
                {t.privileges.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-black/70">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-black/30 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Registration Form + Bank Details */}
      <section className="py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeInView delay={0.16}>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Form */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <MembershipForm locale={validLocale} />
              </div>

              {/* Bank Details */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-black mb-4">{t.bankTitle}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black/50">{t.bankIban}</span>
                      <span className="font-mono text-black/80 text-xs">{siteConfig.banking.iban}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/50">{t.bankBic}</span>
                      <span className="font-mono text-black/80 text-xs">{siteConfig.banking.bic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/50">{t.bankRef}</span>
                      <span className="text-black/80 text-xs font-medium">{t.bankRefValue}</span>
                    </div>
                  </div>
                </div>

                {/* Thank you note */}
                <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                  <p className="text-sm text-black/60 leading-relaxed">{t.thankYou}</p>
                  <p className="text-sm text-black/60 leading-relaxed mt-2">{t.thankYouClosing}</p>
                </div>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Contact */}
      <section className="py-6 pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeInView delay={0.2}>
            <div className="p-8 rounded-2xl border border-black/10 bg-white shadow-sm text-center">
              <h3 className="text-xl font-semibold text-black mb-4">{t.contactTitle}</h3>
              <p className="text-black/60 mb-6">{t.contactText}</p>
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-full hover:bg-black/90 transition-all"
              >
                <Mail className="h-4 w-4" />
                {siteConfig.email}
              </a>
            </div>
          </FadeInView>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\[locale\]/society/registration/page.tsx
git commit -m "Add dedicated membership registration page"
```

---

### Task 3: Remove registration slug from catch-all page

**Files:**
- Modify: `src/app/[locale]/[...slug]/page.tsx` (line 18)

- [ ] **Step 1: Remove the `["society", "registration"]` entry from `generateStaticParams`**

In `src/app/[locale]/[...slug]/page.tsx`, remove the line:
```tsx
    ["society", "registration"],
```

from the `slugs` array (line 18). The dedicated page at `src/app/[locale]/society/registration/page.tsx` now handles this route.

- [ ] **Step 2: Commit**

```bash
git add src/app/\[locale\]/\[...slug\]/page.tsx
git commit -m "Remove society/registration from catch-all page routes"
```

---

### Task 4: Add membership email type to send-email route

**Files:**
- Modify: `src/app/api/send-email/route.ts`

- [ ] **Step 1: Add the membership type label mapping**

After the existing `regTypeLabel` object (around line 82), add:

```typescript
const memberTypeLabel: Record<string, string> = {
  research_staff: "Research Staff — €20/year",
  student:        "Student — €10/year",
}
```

- [ ] **Step 2: Add the membership email handler**

Before the `else` block at the end of the type chain (before `} else {` around line 211), add:

```typescript
  } else if (type === "membership") {
    subject = "Membership Application Received – Hellenic Geographical Society"
    html = wrap(`
      <h2 style="margin:0 0 8px;font-size:16px;color:#111827;font-family:Arial,Helvetica,sans-serif;">Hi ${esc(data.first_name)},</h2>
      <p style="color:#374151;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        Thank you for applying to become a member of the <strong>Hellenic Geographical Society</strong>.
        Your application has been received and is being processed.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;table-layout:fixed;">
        ${row("Name", `${data.first_name} ${data.last_name}`, true)}
        ${row("Email", data.email)}
        ${row("Membership type", memberTypeLabel[data.member_type] ?? data.member_type, true)}
        ${row("Role", data.role)}
      </table>
      <p style="color:#374151;font-size:13px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        Please complete your payment via bank transfer using the details below:
      </p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;table-layout:fixed;">
        ${row("IBAN", "GR9801720440005044113342752", true)}
        ${row("BIC / SWIFT", "PIRBGRAA")}
        ${row("Reference", "Membership HGS + year", true)}
      </table>
      <p style="color:#374151;font-size:13px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        Once we receive your membership form and proof of payment, we will contact you at the email address provided to confirm your membership.
      </p>
    `)
```

- [ ] **Step 3: Verify the file has no syntax errors**

Run: `cd "/c/Users/alexl/Projects/Github Repos/HGS-web/HGS" && npx tsc --noEmit src/app/api/send-email/route.ts 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/send-email/route.ts
git commit -m "Add membership email type to send-email route"
```

---

### Task 5: Build verification and smoke test

**Files:** None (verification only)

- [ ] **Step 1: Run the Next.js build**

```bash
cd "/c/Users/alexl/Projects/Github Repos/HGS-web/HGS" && npx next build
```

Expected: Build succeeds with no errors. The page `/en/society/registration` and `/el/society/registration` should appear in the output as statically generated pages.

- [ ] **Step 2: Fix any build errors**

If the build fails, fix the issues and re-run.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "Fix build issues for membership registration"
```

---

### Task 6: Supabase migration — create table and bucket

This task must be done via the Supabase MCP tools, NOT file-based migrations.

- [ ] **Step 1: Apply the table migration**

Use `mcp__claude_ai_Supabase__apply_migration` with project_id `zcclgyucpjbxudrzlkfl`:

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

CREATE POLICY "Allow anonymous select by email"
  ON public.membership_applications
  FOR SELECT
  USING (true);
```

- [ ] **Step 2: Create storage bucket and policies**

Use `mcp__claude_ai_Supabase__execute_sql`:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('membership-receipts', 'membership-receipts', false);
```

Then create RLS policies for the bucket:

```sql
CREATE POLICY "Allow anonymous membership receipt uploads"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'membership-receipts');
```

- [ ] **Step 3: Verify**

Use `mcp__claude_ai_Supabase__execute_sql`:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'membership_applications';
```

```sql
SELECT name FROM storage.buckets WHERE name = 'membership-receipts';
```

Both should return one row.
