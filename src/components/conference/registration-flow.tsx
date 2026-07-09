"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { MailCheck } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CONFIRM_EMAIL_NOTE } from "@/config/conference2026"
import type { CheckEmailResult } from "@/lib/conference2026-types"
import type { Locale } from "@/config/site"

const schema = z.object({
  email: z.string().email("Invalid email"),
})

type FormData = z.infer<typeof schema>

const STEPS = ["Email", "Confirm", "Details"] as const

/** Where Supabase sends the user after they click the confirmation link. */
function confirmRedirectUrl() {
  return `${window.location.origin}/auth/confirm`
}

/**
 * Verify-first registration, step 1 of 3: the visitor enters only their
 * e-mail address and receives a confirmation link. Everything else —
 * recognition, prefilled details, claims, password — happens on the
 * /register/complete page, AFTER the address is verified.
 */
export function RegistrationFlow({ locale }: { locale: Locale }) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [sending, setSending] = useState(false)
  const [hasAccount, setHasAccount] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [expiredLink, setExpiredLink] = useState(false)
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const {
    register,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const email = watch("email") ?? ""

  // A signed-in visitor has already verified their address — send them
  // straight to the completion page (it forwards to the profile when the
  // registration already exists).
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(`/${locale}/conference2026/register/complete`)
    })
  }, [locale, router])

  // Arriving from an invalid/expired confirmation link (/auth/confirm).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("error") === "confirm_invalid") setExpiredLink(true)
  }, [])

  const sendConfirmation = async (address: string) => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return "Service unavailable. Please try again later."
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: confirmRedirectUrl(),
      },
    })
    if (!error) return null
    return /rate|seconds/i.test(error.message)
      ? "A confirmation e-mail was requested very recently. Please wait a minute before trying again."
      : "The confirmation e-mail could not be sent. Please try again or contact the conference secretariat."
  }

  const continueFromEmail = async () => {
    setServerError(null)
    setHasAccount(false)
    if (!(await trigger("email"))) return
    setSending(true)
    try {
      const address = email.trim().toLowerCase()
      const res = await fetch("/api/conference2026/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address }),
      })
      if (!res.ok) throw new Error()
      const result = (await res.json()) as CheckEmailResult

      if (result.status === "has_account") {
        setHasAccount(true)
        return
      }

      const sendError = await sendConfirmation(address)
      if (sendError) {
        setServerError(sendError)
        return
      }
      setExpiredLink(false)
      setResendState("idle")
      setStep(2)
    } catch {
      setServerError("Something went wrong. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const resendConfirmation = async () => {
    setResendState("sending")
    const sendError = await sendConfirmation(email.trim().toLowerCase())
    setResendState(sendError ? "error" : "sent")
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2 mb-6">
        {STEPS.map((label, i) => {
          const n = i + 1
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

      {/* ------------------------------------------------ STEP 1: EMAIL -- */}
      {step === 1 && (
        <div className="space-y-4">
          {expiredLink && (
            <div className="text-sm text-black/70 bg-black/[0.03] border border-black/10 rounded-lg px-3 py-2.5">
              That confirmation link is invalid or has expired. Enter your
              e-mail address below to receive a new one.
            </div>
          )}

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

          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3">
            <p className="text-xs text-black/50 leading-relaxed">{CONFIRM_EMAIL_NOTE}</p>
          </div>

          {hasAccount && (
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
            disabled={sending}
            className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {sending ? "Sending…" : "Continue"}
          </button>

          <p className="text-sm text-black/50 text-center">
            Already registered?{" "}
            <Link href={`/${locale}/conference2026/login`} className="underline hover:text-black transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      )}

      {/* ---------------------------------------- STEP 2: CHECK YOUR INBOX -- */}
      {step === 2 && (
        <div className="space-y-4 text-center py-2">
          <MailCheck className="mx-auto h-8 w-8 text-black/60" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-black">Confirm your e-mail address</p>
            <p className="text-sm text-black/55 leading-relaxed">
              A confirmation e-mail has been sent to{" "}
              <span className="font-medium text-black/75">{email.trim().toLowerCase()}</span>.
              Please follow the link in it to verify your address and fill in
              your registration details.
            </p>
          </div>
          <p className="text-xs text-black/40 leading-relaxed">
            You can close this page — the link continues your registration on
            whichever device you open it. If the e-mail does not arrive within
            a few minutes, please check your spam folder.
          </p>
          <div className="pt-1">
            {resendState === "sent" ? (
              <p className="text-xs text-green-700">A new confirmation e-mail has been sent.</p>
            ) : (
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={resendState === "sending"}
                className="text-xs underline text-black/50 hover:text-black disabled:opacity-50 transition-colors cursor-pointer"
              >
                {resendState === "sending"
                  ? "Sending…"
                  : resendState === "error"
                    ? "Sending failed — try again"
                    : "Resend the confirmation e-mail"}
              </button>
            )}
          </div>
          <p className="text-xs text-black/40">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="underline hover:text-black transition-colors cursor-pointer"
            >
              Use a different e-mail address
            </button>
          </p>
        </div>
      )}
    </div>
  )
}
