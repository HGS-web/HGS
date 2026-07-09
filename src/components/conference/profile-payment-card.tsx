"use client"

import { useRef, useState } from "react"
import { Copy } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { FileSlot, validateSlotFile } from "@/components/conference/file-slot"
import { StatusChip } from "@/components/conference/status-chip"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  NO_EMAIL_NOTE,
  RECEIPTS_BUCKET,
  SECRETARIAT_EMAIL,
} from "@/config/conference2026"
import { siteConfig } from "@/config/site"
import type {
  MePayload,
  PaymentReceiptConference2026,
  ReceiptKind,
} from "@/lib/conference2026-types"

const STATUS_EXPLANATION: Record<string, string> = {
  pending:
    "Under review. Your receipt has been received and will be verified by the organising committee.",
  accepted: "Payment confirmed. No further action is required.",
  declined:
    "Your receipt could not be verified. Please upload a new receipt, or contact the conference secretariat if you believe this is an error.",
}

function ReceiptSlot({
  kind,
  label,
  hint,
  required,
  receipt,
  onUploaded,
}: {
  kind: ReceiptKind
  label: string
  hint?: string
  required?: boolean
  receipt: PaymentReceiptConference2026 | null
  onUploaded: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const locked = receipt?.status === "accepted"
  const showUpload = !locked && (!receipt || receipt.status === "declined" || receipt.status === "pending")

  const upload = async () => {
    if (!file) { setFileError("Please select a file first."); return }
    setUploading(true)
    setServerError(null)
    try {
      const initRes = await fetch("/api/conference2026/receipts/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt_kind: kind,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        }),
      })
      if (!initRes.ok) {
        const body = (await initRes.json().catch(() => null)) as { error?: string } | null
        throw new Error(
          body?.error === "registration_required"
            ? "Please complete your registration first."
            : body?.error === "receipt_accepted"
              ? "This receipt has already been accepted."
              : body?.error ?? "Upload could not be started."
        )
      }
      const { path, token } = (await initRes.json()) as { path: string; token: string }

      const supabase = getSupabaseBrowser()
      if (!supabase) throw new Error("Service unavailable.")
      const { error: uploadErr } = await supabase.storage
        .from(RECEIPTS_BUCKET)
        .uploadToSignedUrl(path, token, file)
      if (uploadErr) throw new Error("File upload failed. Please try again.")

      const completeRes = await fetch("/api/conference2026/receipts/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          receipt_kind: kind,
          file_name: file.name,
          user_notes: notes || undefined,
        }),
      })
      if (!completeRes.ok) throw new Error("The upload could not be recorded. Please try again.")

      setFile(null)
      setNotes("")
      onUploaded()
    } catch (err) {
      setServerError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const viewFile = async () => {
    if (!receipt) return
    // Open the tab synchronously inside the click gesture — popup blockers
    // reject window.open issued after an await.
    const win = window.open("about:blank", "_blank")
    if (win) win.opener = null
    try {
      const res = await fetch(`/api/conference2026/receipts/${receipt.id}/file`)
      if (!res.ok) throw new Error()
      const { url } = (await res.json()) as { url: string }
      if (win) win.location.href = url
      else window.location.href = url
    } catch {
      win?.close()
    }
  }

  return (
    <div className="rounded-xl border border-black/10 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-medium text-black">
          {label}
          {required ? " *" : ""}
          {hint && <span className="ml-1.5 font-normal text-black/40 text-xs">{hint}</span>}
        </p>
        {receipt && <StatusChip status={receipt.status} />}
      </div>

      {receipt && (
        <div className="text-xs text-black/50 space-y-1.5">
          <p>
            <button
              type="button"
              onClick={viewFile}
              className="underline hover:text-black transition-colors cursor-pointer"
            >
              {receipt.file_name ?? "View uploaded file"}
            </button>
            <span className="ml-2 text-black/35">
              uploaded {new Date(receipt.created_at).toLocaleDateString("en-GB")}
            </span>
          </p>
          <p className="leading-relaxed">{STATUS_EXPLANATION[receipt.status]}</p>
        </div>
      )}

      {showUpload && (
        <div className="space-y-3">
          {receipt?.status === "pending" && (
            <p className="text-xs text-black/40">
              Need to correct something? Uploading a new file replaces the one under review.
            </p>
          )}
          <FileSlot
            label={receipt ? "Upload a new receipt" : "Receipt file"}
            required={required && !receipt}
            file={file}
            error={fileError}
            fileRef={fileRef}
            onChange={(f) => {
              const err = validateSlotFile(f)
              setFileError(err)
              if (!err && f) setFile(f)
            }}
            onClear={() => { setFile(null); setFileError(null); if (fileRef.current) fileRef.current.value = "" }}
          />
          {file && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor={`notes-${kind}`}>
                  Notes <span className="font-normal text-black/40">(optional)</span>
                </Label>
                <Textarea
                  id={`notes-${kind}`}
                  rows={2}
                  placeholder="e.g. transfer reference number"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={upload}
                disabled={uploading}
                className="w-full py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {uploading ? "Uploading…" : "Submit receipt"}
              </button>
            </>
          )}
          {serverError && (
            <p className="text-xs text-red-600">
              {serverError}{" "}
              <a href={`mailto:${SECRETARIAT_EMAIL}`} className="underline">Contact us</a>{" "}
              if the issue persists.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function ProfilePaymentCard({
  me,
  onChanged,
}: {
  me: MePayload
  onChanged: () => void
}) {
  const [copied, setCopied] = useState(false)
  const registration = me.registration
  if (!registration) return null

  const activeReceipt = (kind: ReceiptKind) =>
    me.receipts.find((r) => r.receipt_kind === kind && r.status !== "declined") ??
    me.receipts.find((r) => r.receipt_kind === kind) ??
    null

  const isMemberRate =
    registration.registration_type === "hgs_member" ||
    registration.registration_type === "hgs_student"

  const copyIban = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.banking.iban)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div id="payment" className="scroll-mt-24 rounded-2xl border border-black/10 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-black">Payment</h2>

      <div className="rounded-xl bg-black/[0.02] border border-black/10 p-4 space-y-2 text-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-black/50">{registration.fee_label}</span>
          <span className="text-lg font-semibold text-black">
            €{Number(registration.fee_amount_eur).toFixed(0)}
          </span>
        </div>
        <div className="border-t border-black/5 pt-2 space-y-1 text-xs text-black/50">
          <p>
            <span className="text-black/35">Bank:</span> Piraeus Bank ·{" "}
            <span className="text-black/35">BIC:</span> {siteConfig.banking.bic}
          </p>
          <p className="flex items-center gap-1.5 flex-wrap">
            <span className="text-black/35">IBAN:</span>
            <span className="font-mono">{siteConfig.banking.iban}</span>
            <button
              type="button"
              onClick={copyIban}
              className="inline-flex items-center gap-1 text-black/40 hover:text-black transition-colors cursor-pointer"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied" : "Copy"}
            </button>
          </p>
          <p className="text-black/45 font-medium">
            Please use your full name as the transfer reference.
          </p>
        </div>
      </div>

      <ReceiptSlot
        kind="conference"
        label="Conference payment receipt"
        required
        receipt={activeReceipt("conference")}
        onUploaded={onChanged}
      />
      <ReceiptSlot
        kind="hgs_membership"
        label="HGS membership receipt"
        hint={isMemberRate ? "(required to confirm the HGS member rate)" : "(if registering at the HGS member rate)"}
        receipt={activeReceipt("hgs_membership")}
        onUploaded={onChanged}
      />

      <p className="text-xs text-black/35 leading-relaxed">{NO_EMAIL_NOTE}</p>
    </div>
  )
}
