"use client"

import { useCallback, useState } from "react"
import { Check, CheckCircle2, X } from "lucide-react"
import { ProfilePaymentCard } from "@/components/conference/profile-payment-card"
import { ProfileAbstractsCard } from "@/components/conference/profile-abstracts-card"
import { ProfileAccountCard } from "@/components/conference/profile-account-card"
import { ProfileCompleteRegistration } from "@/components/conference/profile-complete-registration"
import type { MePayload } from "@/lib/conference2026-types"
import type { Locale } from "@/config/site"

type Stage = "pay" | "review" | "confirmed"

function StepCircle({
  state,
  number,
}: {
  state: "done" | "current" | "upcoming"
  number: number
}) {
  if (state === "done") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    )
  }
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        state === "current" ? "bg-black text-white" : "bg-black/5 text-black/35"
      }`}
    >
      {number}
    </span>
  )
}

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
  const conferenceReceipt =
    me.receipts.find((r) => r.receipt_kind === "conference" && r.status !== "declined") ?? null
  const hasDeclinedReceipt =
    !conferenceReceipt &&
    me.receipts.some((r) => r.receipt_kind === "conference" && r.status === "declined")
  const isMemberRate =
    registration?.registration_type === "hgs_member" ||
    registration?.registration_type === "hgs_student"
  const hasMembershipReceipt = me.receipts.some(
    (r) => r.receipt_kind === "hgs_membership" && r.status !== "declined"
  )

  const stage: Stage = !conferenceReceipt
    ? "pay"
    : conferenceReceipt.status === "accepted"
      ? "confirmed"
      : "review"

  const displayName = registration
    ? `${registration.first_name} ${registration.last_name}`
    : me.person?.full_name ?? me.email

  const steps: { label: string; state: "done" | "current" | "upcoming" }[] = [
    { label: "Registration", state: "done" },
    {
      label: "Payment receipt",
      state: stage === "pay" ? "current" : "done",
    },
    {
      label: "Confirmation",
      state: stage === "confirmed" ? "done" : stage === "review" ? "current" : "upcoming",
    },
  ]

  return (
    <div className="space-y-5">
      {showWelcome && registration && (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
          <p className="flex-1 text-sm text-green-800 leading-relaxed">
            Your registration is complete. Welcome!
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

      {/* Identity + status */}
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">
                {registration.fee_label}
              </p>
              <p className="mt-0.5 text-lg font-semibold text-black">
                €{Number(registration.fee_amount_eur).toFixed(0)}
              </p>
            </div>
          )}
        </div>

        {registration && (
          <div className="mt-5 pt-5 border-t border-black/[0.07] space-y-4">
            {/* Step tracker */}
            <ol className="flex items-center gap-2">
              {steps.map((step, i) => (
                <li key={step.label} className="flex items-center gap-2 min-w-0 last:shrink-0 [&:not(:last-child)]:flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <StepCircle state={step.state} number={i + 1} />
                    <span
                      className={`truncate text-xs font-medium ${
                        step.state === "current"
                          ? "text-black"
                          : step.state === "done"
                            ? "text-black/60"
                            : "text-black/35"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <span className="h-px flex-1 min-w-4 bg-black/10" aria-hidden />
                  )}
                </li>
              ))}
            </ol>

            {/* One contextual next step — replaces the old banner pile */}
            {stage === "pay" && (
              <p className="text-sm text-black/70 leading-relaxed">
                {hasDeclinedReceipt ? (
                  <>
                    <span className="font-semibold text-red-600">Your receipt was declined.</span>{" "}
                    Please upload a new payment receipt in the{" "}
                    <a href="#payment" className="underline font-medium">Payment section</a>.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Next step:</span> transfer the
                    registration fee of{" "}
                    <span className="font-semibold">
                      €{Number(registration.fee_amount_eur).toFixed(0)}
                    </span>{" "}
                    and upload your payment receipt in the{" "}
                    <a href="#payment" className="underline font-medium">Payment section</a>.
                  </>
                )}
                {isMemberRate && !hasMembershipReceipt && (
                  <>
                    {" "}As you registered at an HGS member rate, please also
                    upload your membership receipt.
                  </>
                )}
              </p>
            )}
            {stage === "review" && (
              <p className="text-sm text-black/60 leading-relaxed">
                Your payment receipt is under review by the organising
                committee — no further action is needed for now.
                {isMemberRate && !hasMembershipReceipt && (
                  <>
                    {" "}One thing remains: as you registered at an HGS member
                    rate, please also upload your membership receipt in the{" "}
                    <a href="#payment" className="underline font-medium">Payment section</a>.
                  </>
                )}
              </p>
            )}
            {stage === "confirmed" && (
              <p className="text-sm text-green-800 leading-relaxed">
                Your participation is confirmed. We look forward to welcoming
                you in Athens on 27–28 November 2026.
              </p>
            )}
          </div>
        )}
      </div>

      {!registration && <ProfileCompleteRegistration me={me} onChanged={refresh} />}

      {registration && <ProfilePaymentCard me={me} onChanged={refresh} />}

      <ProfileAbstractsCard me={me} onChanged={refresh} />

      <ProfileAccountCard locale={locale} />
    </div>
  )
}
