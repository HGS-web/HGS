"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, CheckCircle2, CreditCard, FileText, Settings, X } from "lucide-react"
import { ProfilePaymentCard } from "@/components/conference/profile-payment-card"
import { ProfileAbstractsCard } from "@/components/conference/profile-abstracts-card"
import { ProfileAccountCard } from "@/components/conference/profile-account-card"
import { ProfileCompleteRegistration } from "@/components/conference/profile-complete-registration"
import type { MePayload } from "@/lib/conference2026-types"
import type { Locale } from "@/config/site"

type Stage = "pay" | "review" | "confirmed"
type Tab = "payment" | "abstracts" | "account"

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
  const router = useRouter()
  // router.refresh supplies a new payload while preserving form/tab state.
  const me = initial
  const [showWelcome, setShowWelcome] = useState(welcome)

  const refresh = useCallback(() => router.refresh(), [router])

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

  // Default to the tab with a pending action; abstracts once payment is settled.
  const [tab, setTab] = useState<Tab>(stage === "confirmed" ? "abstracts" : "payment")

  const pendingClaims = me.claims.filter((c) => c.status === "pending").length

  const displayName = registration
    ? `${registration.first_name} ${registration.last_name}`
    : me.person?.full_name ?? me.email

  const steps: { label: string; state: "done" | "current" | "upcoming" }[] = useMemo(
    () => [
      { label: "Registration", state: "done" },
      { label: "Payment receipt", state: stage === "pay" ? "current" : "done" },
      {
        label: "Confirmation",
        state: stage === "confirmed" ? "done" : stage === "review" ? "current" : "upcoming",
      },
    ],
    [stage]
  )

  const goToPayment = () => setTab("payment")

  const tabs: { id: Tab; label: string; icon: typeof CreditCard; badge?: number; dot?: boolean }[] = [
    { id: "payment", label: "Payment", icon: CreditCard, dot: stage === "pay" },
    {
      id: "abstracts",
      label: "Abstracts",
      icon: FileText,
      badge: me.abstracts.length || undefined,
      dot: pendingClaims > 0,
    },
    { id: "account", label: "Account", icon: Settings },
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

      {/* Identity + progress */}
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

            {/* One contextual next step */}
            {stage === "pay" && (
              <p className="text-sm text-black/70 leading-relaxed">
                {hasDeclinedReceipt ? (
                  <>
                    <span className="font-semibold text-red-600">Your receipt was declined.</span>{" "}
                    Please upload a new one in the{" "}
                    <button type="button" onClick={goToPayment} className="underline font-medium hover:text-black cursor-pointer">
                      Payment tab
                    </button>.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Next step:</span> transfer the
                    registration fee of{" "}
                    <span className="font-semibold">
                      €{Number(registration.fee_amount_eur).toFixed(0)}
                    </span>{" "}
                    and upload your receipt in the{" "}
                    <button type="button" onClick={goToPayment} className="underline font-medium hover:text-black cursor-pointer">
                      Payment tab
                    </button>.
                  </>
                )}
                {isMemberRate && !hasMembershipReceipt && (
                  <> A membership receipt is also required for your HGS member rate.</>
                )}
              </p>
            )}
            {stage === "review" && (
              <p className="text-sm text-black/60 leading-relaxed">
                Your payment receipt is under review by the organising
                committee — no further action is needed for now.
                {isMemberRate && !hasMembershipReceipt && (
                  <>
                    {" "}One item remains: please also upload your membership
                    receipt in the{" "}
                    <button type="button" onClick={goToPayment} className="underline font-medium hover:text-black cursor-pointer">
                      Payment tab
                    </button>.
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

      {registration && (
        <>
          {/* Tab strip */}
          <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white p-1 shadow-sm">
            {tabs.map((t) => {
              const active = tab === t.id
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    active ? "bg-black text-white" : "text-black/55 hover:text-black hover:bg-black/[0.03]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                  {t.badge !== undefined && (
                    <span className={`rounded-full px-1.5 text-[10px] font-semibold ${active ? "bg-white/20 text-white" : "bg-black/10 text-black/50"}`}>
                      {t.badge}
                    </span>
                  )}
                  {t.dot && !active && (
                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                  )}
                </button>
              )
            })}
          </div>

          {tab === "payment" && <ProfilePaymentCard me={me} onChanged={refresh} />}
          {tab === "abstracts" && <ProfileAbstractsCard me={me} onChanged={refresh} />}
          {tab === "account" && <ProfileAccountCard locale={locale} />}
        </>
      )}

      {/* Before registration is completed, abstracts still show (claims live here too). */}
      {!registration && <ProfileAbstractsCard me={me} onChanged={refresh} />}
      {!registration && <ProfileAccountCard locale={locale} />}
    </div>
  )
}
