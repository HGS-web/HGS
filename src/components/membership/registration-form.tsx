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
