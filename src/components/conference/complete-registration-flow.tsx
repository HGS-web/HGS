"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, MailCheck, UserCheck } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { PasswordFields } from "@/components/conference/password-fields"
import { ConsentFields } from "@/components/conference/consent-fields"
import { ClaimAbstracts, type ClaimCandidate } from "@/components/conference/claim-abstracts"
import {
  CONFERENCE_FEES,
  CURRENT_FEE_PERIOD,
  FEE_MICROCOPY,
  POLICY_NOTE,
  REGISTRATION_TYPES,
} from "@/config/conference2026"
import type { MePayload } from "@/lib/conference2026-types"
import type { Locale } from "@/config/site"

const schema = z
  .object({
    first_name: z.string().min(1, "Required"),
    last_name: z.string().min(1, "Required"),
    affiliation: z.string().min(1, "Required"),
    country: z.string().min(1, "Required"),
    registration_type: z.enum(["regular", "hgs_member", "student", "hgs_student"], {
      error: "Please select a registration type",
    }),
    password: z.string().min(8, "At least 8 characters"),
    password_confirm: z.string(),
    gdpr_consent: z.boolean().refine((v) => v === true, {
      message: "You must accept the data processing terms to proceed.",
    }),
    mailing_consent: z.boolean(),
  })
  .refine((v) => v.password === v.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  })

type FormData = z.infer<typeof schema>

/**
 * Final registration step, reached from the confirmation link with a live
 * session: the e-mail address is verified, so the imported person data is
 * shown and prefilled. The visitor completes what is missing, sets their
 * password (last), and submits.
 */
export function CompleteRegistrationFlow({ me, locale }: { me: MePayload; locale: Locale }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [wantsClaim, setWantsClaim] = useState(false)
  const [claims, setClaims] = useState<ClaimCandidate[]>([])

  const recognized = me.person !== null && me.abstracts.length > 0

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: me.person?.first_name ?? "",
      last_name: me.person?.last_name ?? "",
      affiliation: me.person?.affiliation ?? "",
      gdpr_consent: false,
      mailing_consent: false,
    },
  })

  const firstName = watch("first_name") ?? ""
  const lastName = watch("last_name") ?? ""

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = getSupabaseBrowser()
    if (!supabase) { setServerError("Service unavailable. Please try again later."); return }

    // 1. Set the password on the verified account.
    const { error: passwordError } = await supabase.auth.updateUser({
      password: data.password,
    })
    if (passwordError) {
      setServerError(
        /session|expired|missing/i.test(passwordError.message)
          ? "Your session has expired. Please request a new confirmation link from the registration page."
          : `The password could not be set: ${passwordError.message}`
      )
      return
    }

    // 2. Create the registration (the server computes the fee from the type).
    let res: Response
    try {
      res = await fetch("/api/conference2026/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          affiliation: data.affiliation,
          country: data.country,
          registration_type: data.registration_type,
          gdpr_consent: data.gdpr_consent,
          mailing_consent: data.mailing_consent,
          claims: claims.map((c) => ({
            abstract_id: c.abstract_id,
            abstract_author_id: c.abstract_author_id,
            claimed_name: `${data.first_name} ${data.last_name}`.trim(),
          })),
        }),
      })
    } catch {
      setServerError("The registration could not be submitted. Please check your connection and try again.")
      return
    }

    if (res.status === 409) {
      router.push(`/${locale}/conference2026/profile`)
      return
    }
    if (!res.ok) {
      setServerError("Something went wrong. Please try again.")
      return
    }

    router.push(`/${locale}/conference2026/profile?welcome=1`)
  }

  const feeOptions = REGISTRATION_TYPES.map((type) => ({
    value: type,
    label: `${CONFERENCE_FEES[type].label} — €${CONFERENCE_FEES[type][CURRENT_FEE_PERIOD]}`,
  }))

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Verified address */}
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
          <MailCheck className="h-4 w-4 shrink-0 text-green-700" />
          <p className="text-sm text-green-800">
            <span className="font-medium">{me.email}</span> — e-mail address verified
          </p>
        </div>

        {/* Recognition */}
        {recognized && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3.5 space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
              <UserCheck className="h-4 w-4" />
              Welcome back, {me.person!.full_name}.
            </p>
            <p className="text-xs text-green-800/70 leading-relaxed">
              We found your details from the abstract submission phase.
              Please review and complete them below.
            </p>
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-medium text-green-800/80">
                You are listed on {me.abstracts.length} accepted abstract{me.abstracts.length > 1 ? "s" : ""}:
              </p>
              {me.abstracts.map((a) => (
                <p key={a.id} className="text-xs text-green-800/70 leading-snug">
                  <span className={`mr-1.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${a.role === "author" ? "bg-green-700 text-white" : "border border-green-700/40 text-green-800"}`}>
                    {a.role === "author" ? "Author" : "Co-author"}
                  </span>
                  {a.title}
                  {a.evaluation === "reassigned" && (
                    <span className="text-green-800/50"> (accepted — reassigned)</span>
                  )}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Details — prefilled where the submission data knows them */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cr-first">First Name *</Label>
            <Input id="cr-first" {...register("first_name")} aria-invalid={!!errors.first_name} />
            {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cr-last">Last Name *</Label>
            <Input id="cr-last" {...register("last_name")} aria-invalid={!!errors.last_name} />
            {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cr-aff">Affiliation *</Label>
          <Input id="cr-aff" placeholder="University / Institution" {...register("affiliation")} aria-invalid={!!errors.affiliation} />
          {errors.affiliation && <p className="text-xs text-red-500">{errors.affiliation.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cr-country">Country *</Label>
          <Input id="cr-country" {...register("country")} aria-invalid={!!errors.country} />
          {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cr-type">Registration Type *</Label>
          <Select id="cr-type" {...register("registration_type")} aria-invalid={!!errors.registration_type}>
            <option value="">Select…</option>
            {feeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          {errors.registration_type && <p className="text-xs text-red-500">{errors.registration_type.message}</p>}
          <p className="text-xs text-black/40">{FEE_MICROCOPY}</p>
        </div>

        {/* Claims — only for verified addresses the import does not know */}
        {!recognized && (
          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={wantsClaim}
                onChange={(e) => { setWantsClaim(e.target.checked); if (!e.target.checked) setClaims([]) }}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-black"
              />
              <span className="text-xs text-black/70 leading-relaxed group-hover:text-black transition-colors">
                I am an author or co-author of an accepted abstract
              </span>
            </label>
            {wantsClaim && (
              <ClaimAbstracts
                firstName={firstName}
                lastName={lastName}
                selected={claims}
                onToggle={(candidate, checked) =>
                  setClaims((prev) =>
                    checked
                      ? [...prev.filter((c) => c.abstract_id !== candidate.abstract_id), candidate]
                      : prev.filter((c) => c.abstract_id !== candidate.abstract_id)
                  )
                }
              />
            )}
          </div>
        )}

        <p className="text-xs text-black/45 leading-relaxed rounded-xl border border-black/10 bg-black/[0.02] p-3">
          {POLICY_NOTE}
        </p>

        {/* Password — set last, on the verified account */}
        <PasswordFields
          passwordProps={register("password")}
          confirmProps={register("password_confirm")}
          passwordError={errors.password?.message}
          confirmError={errors.password_confirm?.message}
        />

        <ConsentFields
          gdprProps={register("gdpr_consent")}
          mailingProps={register("mailing_consent")}
          gdprError={errors.gdpr_consent?.message}
        />

        {claims.length > 0 && (
          <p className="text-xs text-black/45 leading-relaxed">
            <CheckCircle2 className="inline h-3.5 w-3.5 mr-1 text-black/30" />
            {claims.length} authorship claim{claims.length > 1 ? "s" : ""} will be
            submitted for review by the organising committee.
          </p>
        )}

        {serverError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isSubmitting ? "Completing registration…" : "Complete registration"}
        </button>
      </form>
    </div>
  )
}
