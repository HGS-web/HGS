"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, LogOut } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { PasswordFields } from "@/components/conference/password-fields"
import { SECRETARIAT_EMAIL } from "@/config/conference2026"
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

export function ProfileAccountCard({ locale }: { locale: Locale }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const changePassword = async (data: FormData) => {
    setServerError(null)
    setSaved(false)
    const supabase = getSupabaseBrowser()
    if (!supabase) { setServerError("Service unavailable."); return }
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setServerError(
        error.message.includes("different from the old")
          ? "The new password must be different from your current password."
          : "The password could not be updated. Please try again."
      )
      return
    }
    reset()
    setSaved(true)
  }

  const logout = async () => {
    const supabase = getSupabaseBrowser()
    if (supabase) await supabase.auth.signOut()
    router.push(`/${locale}/conference2026/login`)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-black">Account</h2>

      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm text-black/60 underline hover:text-black transition-colors cursor-pointer"
        >
          Change password
        </button>

        {open && (
          <form onSubmit={handleSubmit(changePassword)} className="mt-3 space-y-3 max-w-sm">
            <PasswordFields
              passwordProps={register("password")}
              confirmProps={register("password_confirm")}
              passwordError={errors.password?.message}
              confirmError={errors.password_confirm?.message}
              passwordLabel="New password"
              confirmLabel="Confirm new password"
            />
            {serverError && <p className="text-xs text-red-500">{serverError}</p>}
            {saved && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Password updated.
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>

      <p className="text-xs text-black/40 leading-relaxed">
        Questions about your registration or data? Contact the conference
        secretariat at{" "}
        <a href={`mailto:${SECRETARIAT_EMAIL}`} className="underline">{SECRETARIAT_EMAIL}</a>.
        For data-protection requests, write to{" "}
        <a href="mailto:geographicalsocietyhellas@gmail.com" className="underline">geographicalsocietyhellas@gmail.com</a>.
      </p>

      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-1.5 px-4 py-2 text-sm border border-black/15 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
      >
        <LogOut className="h-3.5 w-3.5" />
        Log out
      </button>
    </div>
  )
}
