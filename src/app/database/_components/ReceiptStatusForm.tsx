"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateReceipt2026 } from "../_lib/api";
import type { PaymentReceiptConference2026 } from "../_lib/types";

/**
 * Admin evaluation of a 2026 payment receipt: editable status + notes.
 * Rendered inside the DetailDialog for receipt rows.
 */
export function ReceiptStatusForm({
  receipt,
  onSaved,
}: {
  receipt: PaymentReceiptConference2026;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<PaymentReceiptConference2026["status"]>(receipt.status);
  const [notes, setNotes] = useState(receipt.admin_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateReceipt2026(receipt.id, { status, admin_notes: notes });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-1 space-y-3 rounded-xl border border-black/10 bg-neutral-50 p-3">
      <div className="text-xs font-medium uppercase tracking-wider text-black/50">
        Evaluation
      </div>

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Receipt status">
        {(["pending", "accepted", "declined"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={status === s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              status === s
                ? s === "accepted"
                  ? "border-green-600 bg-green-600 text-white"
                  : s === "declined"
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-amber-500 bg-amber-500 text-white"
                : "border-black/10 bg-white text-black/60 hover:border-black/25"
            }`}
          >
            {s === "pending" ? "Pending" : s === "accepted" ? "Accepted" : "Declined"}
          </button>
        ))}
      </div>

      <Textarea
        rows={2}
        placeholder="Admin notes (visible to admins only)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {error && <div className="text-xs text-red-600">{error}</div>}

      <Button size="sm" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save evaluation"}
      </Button>
    </div>
  );
}
