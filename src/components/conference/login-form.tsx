"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NO_EMAIL_NOTE } from "@/config/conference2026"
import type { Locale } from "@/config/site"

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Required"),
})

type FormData = z.infer<typeof schema>

export function LoginForm({ locale }: { locale: Locale }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { email: searchParams.get("email") ?? "" },
    })

  // Already signed in → straight to the profile.
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(`/${locale}/conference2026/profile`)
    })
  }, [locale, router])

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const supabase = getSupabaseBrowser()
    if (!supabase) { setServerError("Service unavailable. Please try again later."); return }

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    })
    if (error) {
      setServerError("Incorrect email or password.")
      return
    }
    router.push(`/${locale}/conference2026/profile`)
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="l-email">Email *</Label>
          <Input id="l-email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="l-password">Password *</Label>
          <Input id="l-password" type="password" autoComplete="current-password" {...register("password")} aria-invalid={!!errors.password} />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
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
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-5 space-y-2 border-t border-black/5 pt-4 text-sm">
        <p>
          <Link
            href={`/${locale}/conference2026/forgot-password`}
            className="text-black/60 underline hover:text-black transition-colors"
          >
            Forgot your password?
          </Link>
        </p>
        <p className="text-black/50">
          No account yet?{" "}
          <Link
            href={`/${locale}/conference2026/register`}
            className="underline hover:text-black transition-colors"
          >
            Register for the conference
          </Link>
        </p>
      </div>

      <p className="mt-4 text-xs text-black/35 leading-relaxed">{NO_EMAIL_NOTE}</p>
    </div>
  )
}
