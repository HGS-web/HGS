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
import { Select } from "@/components/ui/select"

const schema = z.object({
  first_name:        z.string().min(1, "Required"),
  last_name:         z.string().min(1, "Required"),
  email:             z.string().email("Invalid email"),
  affiliation:       z.string().min(1, "Required"),
  country:           z.string().min(1, "Required"),
  registration_type: z.enum(["regular", "hgs_member", "student", "hgs_student"], {
    error: "Please select a registration type",
  }),
  abstract_intent:   z.enum(["yes", "no"]),
  mailing_consent:   z.boolean(),
  gdpr_consent:      z.boolean().refine(v => v === true, {
    message: "You must accept the data processing terms to proceed.",
  }),
})

type FormData = z.infer<typeof schema>

const SUPPORT_HREF = `mailto:ekarkani@geol.uoa.gr?subject=${encodeURIComponent("HGS Conference 2026 – Change Request")}&body=${encodeURIComponent("Email used for registration:\n\nDescription of change or issue:\n\n")}`

export function RegistrationDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen]               = useState(false)
  const [success, setSuccess]         = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [verifying, setVerifying]     = useState(false)
  const [verified, setVerified]       = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { abstract_intent: "no", mailing_consent: false, gdpr_consent: false },
    })

  const emailValue = watch("email")

  const verifyEmail = async () => {
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) return
    setVerifying(true)
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      first_name:        data.first_name,
      last_name:         data.last_name,
      email:             normalized,
      affiliation:       data.affiliation,
      country:           data.country,
      registration_type: data.registration_type,
      abstract_intent:   data.abstract_intent === "yes" ? "oral" : "none",
      mailing_consent:   data.mailing_consent,
      gdpr_consent:      data.gdpr_consent,
    }])

    if (error) { setServerError("Something went wrong. Please try again."); return }

    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "registration", ...data, email: normalized }),
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
            <button
              onClick={() => handleOpenChange(false)}
              className="px-6 py-2 bg-black text-white text-sm rounded-full hover:bg-black/80 transition-colors cursor-pointer"
            >
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
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm border border-black/15 rounded-lg hover:bg-black/5 disabled:opacity-40 transition-colors cursor-pointer"
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
                  <option value="regular">Regular — €60</option>
                  <option value="hgs_member">HGS Member — €40</option>
                  <option value="student">Student — €20</option>
                  <option value="hgs_student">HGS Student Member — €10</option>
                </Select>
                {errors.registration_type && <p className="text-xs text-red-500">{errors.registration_type.message}</p>}
                <p className="text-xs text-black/40">
                  Early bird rates apply until <strong className="text-black/50">31 August 2026</strong>. Fees increase after this date (Regular €80, HGS Member €50, Student €30, HGS Student Member €15).
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="r-intent">Will you submit an abstract?</Label>
                <Select id="r-intent" {...register("abstract_intent")}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </Select>
              </div>

              {/* GDPR consent – required */}
              <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 space-y-2.5">
                <p className="text-xs font-semibold text-black/60 uppercase tracking-wider">Data Protection (GDPR) *</p>
                <p className="text-xs text-black/50 leading-relaxed">
                  The Hellenic Geographical Society (HGS) collects and processes your personal data
                  for the purpose of organising the 13th International Conference and for the ongoing
                  records of the Society in connection with future events and activities. Your data will
                  not be shared with third parties. You have the right to access, correct, or request
                  deletion of your data at any time by contacting{" "}
                  <a href="mailto:ekarkani@geol.uoa.gr" className="underline">ekarkani@geol.uoa.gr</a>.
                </p>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register("gdpr_consent")}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-black"
                  />
                  <span className="text-xs text-black/70 leading-relaxed group-hover:text-black transition-colors">
                    I have read and consent to the processing of my personal data as described above.
                  </span>
                </label>
                {errors.gdpr_consent && (
                  <p className="text-xs text-red-500">{errors.gdpr_consent.message}</p>
                )}
              </div>

              {/* Mailing consent – optional */}
              <div className="space-y-1.5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register("mailing_consent")}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-black"
                  />
                  <span className="text-xs text-black/50 leading-relaxed group-hover:text-black/70 transition-colors">
                    I would like to receive updates about future HGS events, conferences, and announcements.
                  </span>
                </label>
                <p className="text-xs text-black/35 leading-relaxed pl-7">
                  You can change this preference at any time by contacting{" "}
                  <a href="mailto:ekarkani@geol.uoa.gr" className="underline">ekarkani@geol.uoa.gr</a>.
                </p>
              </div>

              {serverError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {isDuplicate ? (
                    <p>
                      A registration with this email already exists. To make changes, please{" "}
                      <a href={SUPPORT_HREF} className="underline font-medium">contact us</a>.
                    </p>
                  ) : (
                    <p>{serverError}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
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
