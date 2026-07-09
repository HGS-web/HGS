"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { AbstractDetailDialog } from "@/components/conference/abstract-detail-dialog"
import { ClaimAbstracts, type ClaimCandidate } from "@/components/conference/claim-abstracts"
import { StatusChip } from "@/components/conference/status-chip"
import { POLICY_NOTE, SECRETARIAT_EMAIL } from "@/config/conference2026"
import type { MePayload } from "@/lib/conference2026-types"

export function ProfileAbstractsCard({
  me,
  onChanged,
}: {
  me: MePayload
  onChanged: () => void
}) {
  const [openAbstract, setOpenAbstract] = useState<string | null>(null)
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimSelection, setClaimSelection] = useState<ClaimCandidate[]>([])
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  const pendingClaims = me.claims.filter((c) => c.status === "pending")
  const rejectedClaims = me.claims.filter((c) => c.status === "rejected")

  const submitClaims = async () => {
    if (!claimSelection.length) return
    setClaimSubmitting(true)
    setClaimError(null)
    try {
      for (const candidate of claimSelection) {
        const res = await fetch("/api/conference2026/claims", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            abstract_id: candidate.abstract_id,
            abstract_author_id: candidate.abstract_author_id,
            claimed_name: me.person?.full_name ?? me.email,
          }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          // A duplicate claim already sits in the queue — that is success.
          if (body?.error === "claim_exists") continue
          throw new Error(
            body?.error === "registration_required"
              ? "Please complete your registration first, then submit the claim."
              : "The claim could not be submitted. Please try again."
          )
        }
      }
      setClaimOpen(false)
      setClaimSelection([])
      onChanged()
    } catch (err) {
      setClaimError((err as Error).message || "The claim could not be submitted. Please try again.")
    } finally {
      setClaimSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-black">My abstracts</h2>
        <button
          type="button"
          onClick={() => setClaimOpen(true)}
          className="text-xs text-black/50 underline hover:text-black transition-colors cursor-pointer"
        >
          Missing an abstract?
        </button>
      </div>

      {me.abstracts.length === 0 && pendingClaims.length === 0 && (
        <p className="text-sm text-black/50 leading-relaxed">
          No abstracts are linked to your profile. If you are an author or
          co-author of an accepted abstract,{" "}
          <button
            type="button"
            onClick={() => setClaimOpen(true)}
            className="underline hover:text-black transition-colors cursor-pointer"
          >
            submit a claim
          </button>{" "}
          and the organising committee will review it.
        </p>
      )}

      {me.abstracts.length > 0 && (
        <ul className="space-y-2">
          {me.abstracts.map((abstract) => (
            <li key={abstract.id}>
              <button
                type="button"
                onClick={() => setOpenAbstract(abstract.id)}
                className="w-full text-left rounded-xl border border-black/10 p-3.5 hover:bg-black/[0.02] hover:border-black/20 transition-colors cursor-pointer group"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${abstract.role === "author" ? "bg-black text-white" : "border border-black/20 text-black/50"}`}>
                        {abstract.role === "author" ? "Author" : "Co-author"}
                      </span>
                      <StatusChip
                        status="accepted"
                        label={abstract.evaluation === "reassigned" ? "Accepted (reassigned)" : "Accepted"}
                      />
                    </span>
                    <span className="block text-sm font-medium text-black leading-snug">
                      {abstract.title}
                    </span>
                    <span className="block text-xs text-black/40 mt-0.5">
                      {abstract.session_label}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-black/20 group-hover:text-black/50 transition-colors mt-1" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pendingClaims.length > 0 && (
        <div className="space-y-2">
          {pendingClaims.map((claim) => (
            <div key={claim.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
              <span className="flex items-center gap-2 flex-wrap mb-1">
                <StatusChip status="pending_review" />
              </span>
              <p className="text-sm font-medium text-black/70 leading-snug">
                {claim.abstract_title ?? "Abstract"}
              </p>
              <p className="text-xs text-black/45 mt-1 leading-relaxed">
                Your claim has been submitted and is pending review by the
                organising committee. Once approved, the abstract will appear
                in your profile.
              </p>
            </div>
          ))}
        </div>
      )}

      {rejectedClaims.length > 0 && (
        <p className="text-xs text-black/40 leading-relaxed">
          {rejectedClaims.length} claim{rejectedClaims.length > 1 ? "s were" : " was"} not
          approved — contact the secretariat at{" "}
          <a href={`mailto:${SECRETARIAT_EMAIL}`} className="underline">{SECRETARIAT_EMAIL}</a>{" "}
          if you believe this is an error.
        </p>
      )}

      <p className="text-xs text-black/35 leading-relaxed border-t border-black/5 pt-3">
        {POLICY_NOTE}
      </p>

      {/* Keyed by abstract id so state (loaded/failed) resets per abstract. */}
      <AbstractDetailDialog
        key={openAbstract ?? "closed"}
        abstractId={openAbstract}
        open={openAbstract !== null}
        onOpenChange={(open) => { if (!open) setOpenAbstract(null) }}
      />

      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Claim an accepted abstract</DialogTitle>
          </DialogHeader>
          <ClaimAbstracts
            firstName={me.person?.first_name ?? me.registration?.first_name ?? ""}
            lastName={me.person?.last_name ?? me.registration?.last_name ?? ""}
            selected={claimSelection}
            onToggle={(candidate, checked) =>
              setClaimSelection((prev) =>
                checked
                  ? [...prev.filter((c) => c.abstract_id !== candidate.abstract_id), candidate]
                  : prev.filter((c) => c.abstract_id !== candidate.abstract_id)
              )
            }
          />
          {claimError && <p className="text-xs text-red-500">{claimError}</p>}
          {claimSelection.length > 0 && (
            <button
              type="button"
              onClick={submitClaims}
              disabled={claimSubmitting}
              className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {claimSubmitting
                ? "Submitting…"
                : `Submit ${claimSelection.length} claim${claimSelection.length > 1 ? "s" : ""} for review`}
            </button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
