"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2 } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { PasswordFields } from "@/components/conference/password-fields"
import type { Locale } from "@/config/site"

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    password_confirm: z.string(),
  })
  .refine((v) => v.password === v.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  })

type FormData = z.infer<typeof schema>

export function ResetPasswordForm({ locale }: { locale: Locale }) {
  const router = useRouter()
  const [sessionState, setSessionState] = useState<"checking" | "ok" | "missing">("checking")
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  // The recovery link (via /auth/confirm) must have established a session.
  useEffect(() => {
    let cancelled = false
    const supabase = getSupabaseBrowser()
    Promise.resolve()
      .then(() =>
        supabase
          ? supabase.auth.getUser().then(({ data }) => Boolean(data.user))
          : false
      )
      .then((ok) => { if (!cancelled) setSessionState(ok ? "ok" : "missing") })
      .catch(() => { if (!cancelled) setSessionState("missing") })
    return () => { cancelled = true }
  }, [])

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = getSupabaseBrowser()
    if (!supabase) { setServerError("Service unavailable. Please try again later."); return }

    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setServerError(
        error.message.includes("different from the old")
          ? "The new password must be different from your current password."
          : "Could not update the password. The link may have expired — please request a new one."
      )
      return
    }
    setDone(true)
    setTimeout(() => router.push(`/${locale}/conference2026/profile`), 1500)
  }

  if (sessionState === "checking") {
    return <p className="text-sm text-black/40 text-center py-10">Checking your reset link…</p>
  }

  if (sessionState === "missing") {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm text-center space-y-4">
        <h2 className="text-lg font-semibold text-black">Link invalid or expired</h2>
        <p className="text-sm text-black/50 leading-relaxed">
          This password-reset link is no longer valid. Please request a new one.
        </p>
        <Link
          href={`/${locale}/conference2026/forgot-password`}
          className="inline-block px-6 py-2 bg-black text-white text-sm rounded-full hover:bg-black/80 transition-colors"
        >
          Request a new link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <h2 className="text-lg font-semibold text-black">Password updated</h2>
        <p className="text-sm text-black/50">Taking you to your profile…</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordFields
          passwordProps={register("password")}
          confirmProps={register("password_confirm")}
          passwordError={errors.password?.message}
          confirmError={errors.password_confirm?.message}
          passwordLabel="New password"
          confirmLabel="Confirm new password"
        />

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
          {isSubmitting ? "Saving…" : "Set new password"}
        </button>
      </form>
    </div>
  )
}
