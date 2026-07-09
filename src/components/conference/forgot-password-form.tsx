"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2 } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FORGOT_PASSWORD_GUIDANCE, SECRETARIAT_EMAIL } from "@/config/conference2026"
import type { Locale } from "@/config/site"

const schema = z.object({ email: z.string().email("Invalid email") })

type FormData = z.infer<typeof schema>

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams()
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const invalidLink = searchParams.get("error") === "invalid_link"

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = getSupabaseBrowser()
    if (!supabase) { setServerError("Service unavailable. Please try again later."); return }

    // Plain /auth/confirm — the e-mail template appends its own query
    // ({{ .RedirectTo }}?token_hash=…), and the route sends recovery
    // links to the reset-password page by type.
    await supabase.auth.resetPasswordForEmail(data.email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/confirm`,
    })
    // Always the same neutral outcome — no account-existence leak.
    setSent(true)
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <h2 className="text-lg font-semibold text-black">Check your inbox</h2>
        <p className="text-sm text-black/50 leading-relaxed">
          If an account exists for this e-mail address, a message with a secure
          link to set a new password is on its way. The link is valid for a
          limited time.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      {invalidLink && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          This password-reset link is invalid or has expired. Please request a
          new one below.
        </div>
      )}

      <p className="text-sm text-black/50 leading-relaxed mb-4">{FORGOT_PASSWORD_GUIDANCE}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fp-email">Email *</Label>
          <Input id="fp-email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

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
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-4 text-xs text-black/35 leading-relaxed">
        If you no longer have access to the e-mail address you registered with,
        please contact the conference secretariat at{" "}
        <a href={`mailto:${SECRETARIAT_EMAIL}`} className="underline">{SECRETARIAT_EMAIL}</a>.
      </p>
    </div>
  )
}
