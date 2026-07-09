"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { decideClaim2026 } from "../_lib/api";
import type { AuthorClaimConference2026 } from "../_lib/types";

/**
 * Approve / reject an authorship claim. Approval re-points the claimed
 * author entry to the claimant's person, so the abstract shows up in
 * their profile.
 */
export function ClaimDecisionForm({
  claim,
  onSaved,
}: {
  claim: AuthorClaimConference2026;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(claim.admin_note ?? "");
  const [saving, setSaving] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (claim.status !== "pending") {
    return (
      <div className="mt-1 rounded-xl border border-black/10 bg-neutral-50 p-3 text-xs text-black/50">
        This claim was {claim.status}
        {claim.decided_at ? ` on ${new Date(claim.decided_at).toLocaleDateString("en-GB")}` : ""}.
      </div>
    );
  }

  async function decide(action: "approve" | "reject") {
    setSaving(action);
    setError(null);
    try {
      await decideClaim2026(claim.id, { action, admin_note: note || undefined });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-1 space-y-3 rounded-xl border border-black/10 bg-neutral-50 p-3">
      <div className="text-xs font-medium uppercase tracking-wider text-black/50">
        Decision
      </div>

      <Textarea
        rows={2}
        placeholder="Admin note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error && <div className="text-xs text-red-600">{error}</div>}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => void decide("approve")}
          disabled={saving !== null}
          className="bg-green-600 hover:bg-green-700"
        >
          {saving === "approve" ? "Approving…" : "Approve — link abstract"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void decide("reject")}
          disabled={saving !== null}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          {saving === "reject" ? "Rejecting…" : "Reject"}
        </Button>
      </div>
    </div>
  );
}
