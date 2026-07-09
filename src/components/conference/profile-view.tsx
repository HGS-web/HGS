"use client"

import { useCallback, useState } from "react"
import { CheckCircle2, X } from "lucide-react"
import { ProfilePaymentCard } from "@/components/conference/profile-payment-card"
import { ProfileAbstractsCard } from "@/components/conference/profile-abstracts-card"
import { ProfileAccountCard } from "@/components/conference/profile-account-card"
import { ProfileCompleteRegistration } from "@/components/conference/profile-complete-registration"
import type { MePayload } from "@/lib/conference2026-types"
import type { Locale } from "@/config/site"

export function ProfileView({
  initial,
  locale,
  welcome,
}: {
  initial: MePayload
  locale: Locale
  welcome: boolean
}) {
  const [me, setMe] = useState<MePayload>(initial)
  const [showWelcome, setShowWelcome] = useState(welcome)

  const refresh = useCallback(async () => {
    const res = await fetch("/api/conference2026/me")
    if (res.ok) setMe((await res.json()) as MePayload)
  }, [])

  const registration = me.registration
  const hasConferenceReceipt = me.receipts.some(
    (r) => r.receipt_kind === "conference" && r.status !== "declined"
  )
  const displayName = registration
    ? `${registration.first_name} ${registration.last_name}`
    : me.person?.full_name ?? me.email

  return (
    <div className="space-y-5">
      {showWelcome && registration && (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
          <p className="flex-1 text-sm text-green-800 leading-relaxed">
            Your registration is complete. Next step: transfer the registration
            fee and upload your payment receipt below.
          </p>
          <button
            type="button"
            onClick={() => setShowWelcome(false)}
            className="text-green-700/50 hover:text-green-800 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Identity */}
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-black tracking-tight">{displayName}</h1>
            <p className="mt-1 text-sm text-black/50">{me.email}</p>
            {registration && (
              <p className="mt-0.5 text-sm text-black/50">
                {registration.affiliation} · {registration.country}
              </p>
            )}
          </div>
          {registration && (
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black text-white px-3 py-1 text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Registered
              </span>
              <p className="mt-1.5 text-xs text-black/40">
                {registration.fee_label} · €{Number(registration.fee_amount_eur).toFixed(0)}
              </p>
            </div>
          )}
        </div>
      </div>

      {!registration && <ProfileCompleteRegistration me={me} onChanged={refresh} />}

      {registration && !hasConferenceReceipt && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-3.5">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Action required</span> — transfer
            the registration fee and upload your payment receipt below.
          </p>
        </div>
      )}

      {registration && <ProfilePaymentCard me={me} onChanged={refresh} />}

      <ProfileAbstractsCard me={me} onChanged={refresh} />

      <ProfileAccountCard locale={locale} />
    </div>
  )
}
