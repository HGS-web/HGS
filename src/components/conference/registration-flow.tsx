"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, CheckCircle2, UserCheck } from "lucide-react"
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
  NO_EMAIL_NOTE,
  POLICY_NOTE,
  REGISTRATION_TYPES,
} from "@/config/conference2026"
import type { CheckEmailResult } from "@/lib/conference2026-types"
import type { Locale } from "@/config/site"

const schema = z
  .object({
    email: z.string().email("Invalid email"),
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

const STEPS = ["Email", "Details", "Account"] as const

export function RegistrationFlow({ locale }: { locale: Locale }) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<CheckEmailResult | null>(null)
  const [wantsClaim, setWantsClaim] = useState(false)
  const [claims, setClaims] = useState<ClaimCandidate[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  // Remembers what recognition prefilled, so switching to a different email
  // clears another person's details instead of carrying them over.
  const [prefill, setPrefill] = useState<{
    email: string
    first_name: string
    last_name: string
    affiliation: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gdpr_consent: false, mailing_consent: false },
  })

  const email = watch("email") ?? ""
  const firstName = watch("first_name") ?? ""
  const lastName = watch("last_name") ?? ""

  const recognized = checkResult?.status === "known_person" ? checkResult : null

  // -------------------------------------------------------------- step 1 --
  const continueFromEmail = async () => {
    setServerError(null)
    if (!(await trigger("email"))) return
    setChecking(true)
    try {
      const res = await fetch("/api/conference2026/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (!res.ok) throw new Error()
      const result = (await res.json()) as CheckEmailResult
      setCheckResult(result)
      const normalizedEmail = email.trim().toLowerCase()

      // Clear a previous recognition's prefill when the email changed and the
      // user hasn't overwritten the fields themselves.
      if (prefill && prefill.email !== normalizedEmail) {
        if (getValues("first_name") === prefill.first_name) setValue("first_name", "")
        if (getValues("last_name") === prefill.last_name) setValue("last_name", "")
        if (getValues("affiliation") === prefill.affiliation) setValue("affiliation", "")
        setPrefill(null)
      }

      if (result.status === "known_person") {
        if (result.person.first_name) setValue("first_name", result.person.first_name)
        if (result.person.last_name) setValue("last_name", result.person.last_name)
        if (result.person.affiliation) setValue("affiliation", result.person.affiliation)
        setPrefill({
          email: normalizedEmail,
          first_name: result.person.first_name ?? "",
          last_name: result.person.last_name ?? "",
          affiliation: result.person.affiliation ?? "",
        })
        setStep(2)
      } else if (result.status === "new") {
        setStep(2)
      }
      // has_account: stay on step 1 and show the sign-in notice
    } catch {
      setServerError("Something went wrong. Please try again.")
    } finally {
      setChecking(false)
    }
  }

  // -------------------------------------------------------------- step 2 --
  const continueFromDetails = async () => {
    setServerError(null)
    const ok = await trigger([
      "first_name",
      "last_name",
      "affiliation",
      "country",
      "registration_type",
    ])
    if (ok) setStep(3)
  }

  // -------------------------------------------------------------- step 3 --
  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = getSupabaseBrowser()
    if (!supabase) { setServerError("Service unavailable. Please try again later."); return }

    const normalizedEmail = data.email.trim().toLowerCase()

    // 1. Create the account (or sign in if it already exists with this password).
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: data.password,
    })
    if (signUpError) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: data.password,
      })
      if (signInError) {
        // Distinguish "account exists" from other signup failures
        // (rate limits, server-side password policy, outages).
        setServerError(
          /already( been)? registered/i.test(signUpError.message)
            ? "An account already exists for this e-mail address. Please sign in instead."
            : `The account could not be created: ${signUpError.message}. Please try again or contact the conference secretariat.`
        )
        return
      }
    } else if (!signUpData.session) {
      setServerError(
        "The account could not be activated automatically. Please contact the conference secretariat."
      )
      return
    }

    // 2. Create the registration (server computes the fee from the type).
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
      // The account exists at this point — the profile offers a
      // complete-registration path, so point the user there.
      setServerError(
        "Your account was created, but the registration could not be completed. " +
          "Please check your connection, then open your profile and complete it from there."
      )
      return
    }

    if (res.status === 409) {
      // Already registered — the profile is the source of truth.
      router.push(`/${locale}/conference2026/profile`)
      return
    }
    if (!res.ok) {
      setServerError(
        "Your account was created, but the registration could not be completed. " +
          "Please open your profile and try again from there."
      )
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
      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3
          const active = step === n
          const done = step > n
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-black text-white"
                    : done
                      ? "bg-green-100 text-green-700"
                      : "bg-black/5 text-black/35"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className={`text-xs font-medium ${active ? "text-black" : "text-black/40"}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="w-6 border-t border-black/10" />}
            </li>
          )
        })}
      </ol>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ------------------------------------------------ STEP 1: EMAIL -- */}
        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="r-email">Email *</Label>
              <Input
                id="r-email"
                type="email"
                autoComplete="email"
                placeholder="Use the e-mail address your abstracts were submitted with, if any"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              <p className="text-xs text-black/40 leading-relaxed">
                Your e-mail address identifies your account and links your
                accepted abstracts to your registration.
              </p>
            </div>

            {checkResult?.status === "has_account" && (
              <div className="text-sm text-black/70 bg-black/[0.03] border border-black/10 rounded-lg px-3 py-2.5">
                An account already exists for this e-mail address.{" "}
                <Link
                  href={`/${locale}/conference2026/login?email=${encodeURIComponent(email)}`}
                  className="underline font-medium"
                >
                  Sign in
                </Link>{" "}
                to view or complete your registration.
              </div>
            )}

            {serverError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {serverError}
              </div>
            )}

            <button
              type="button"
              onClick={continueFromEmail}
              disabled={checking}
              className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {checking ? "Checking…" : "Continue"}
            </button>

            <p className="text-sm text-black/50 text-center">
              Already registered?{" "}
              <Link href={`/${locale}/conference2026/login`} className="underline hover:text-black transition-colors">
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* ---------------------------------------------- STEP 2: DETAILS -- */}
        {step === 2 && (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs text-black/60">
                {email}
              </span>
              <button
                type="button"
                onClick={() => { setStep(1); setCheckResult(null); setClaims([]); setWantsClaim(false) }}
                className="text-xs text-black/40 underline hover:text-black transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>

            {recognized && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3.5 space-y-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
                  <UserCheck className="h-4 w-4" />
                  Welcome back, {recognized.person.full_name}.
                </p>
                <p className="text-xs text-green-800/70 leading-relaxed">
                  We found your details from the abstract submission phase.
                  Please review and complete them below.
                </p>
                {recognized.abstracts.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-medium text-green-800/80">
                      You are listed on {recognized.abstracts.length} accepted abstract{recognized.abstracts.length > 1 ? "s" : ""}:
                    </p>
                    {recognized.abstracts.map((a) => (
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
                )}
                <p className="text-[11px] text-green-800/50 leading-relaxed">
                  Not you? Please check that you entered your own e-mail
                  address, or contact the conference secretariat.
                </p>
              </div>
            )}

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
                {feeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
              {errors.registration_type && <p className="text-xs text-red-500">{errors.registration_type.message}</p>}
              <p className="text-xs text-black/40">{FEE_MICROCOPY}</p>
            </div>

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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep(1); setCheckResult(null); setClaims([]); setWantsClaim(false) }}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm border border-black/15 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={continueFromDetails}
                className="flex-1 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 transition-colors cursor-pointer"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* ---------------------------------------- STEP 3: ACCOUNT + GDPR -- */}
        {step === 3 && (
          <>
            <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3">
              <p className="text-xs text-black/50 leading-relaxed">{NO_EMAIL_NOTE}</p>
            </div>

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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm border border-black/15 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting ? "Creating account…" : "Create account & complete registration"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
