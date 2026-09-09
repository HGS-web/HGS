"use client";

import type { Receipt2026Row } from "../_lib/presentations";
import { PresentationSummary } from "./PresentationSummary";

export function ReceiptAbstracts({ receipt }: { receipt: Receipt2026Row }) {
  return (
    <section className="my-5 border-y border-black/10 py-5" aria-label="Linked abstracts">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">Linked abstracts</h2>
        <span className="text-sm tabular-nums text-black/60">{receipt.abstracts.length}</span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-black/60">
        Abstracts linked to {receipt.registrant_name} as an author or co-author.
      </p>

      {receipt.abstracts.length === 0 ? (
        <p className="mt-4 rounded-lg bg-neutral-50 p-4 text-sm leading-relaxed text-black/70">
          {receipt.person_id
            ? "No abstracts are currently linked to this registrant. If they are an author, their authorship link may still need to be resolved."
            : "The registration for this receipt is unavailable, so its abstracts cannot be identified."}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-black/10">
          {receipt.abstracts.map((abstract) => (
            <li key={abstract.id} className="py-5 last:pb-0">
              <PresentationSummary presentation={abstract} receiptHolderId={receipt.person_id} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs leading-relaxed text-black/60">
        {receipt.receipt_kind === "hgs_membership"
          ? "Membership receipts do not qualify an abstract for the presentations list. An accepted conference receipt is required."
          : receipt.status === "accepted"
            ? "This accepted conference receipt qualifies the linked abstracts for the presentations list."
            : "This receipt does not qualify these abstracts for the presentations list until it is accepted. Another linked author may already have an accepted conference receipt."}
      </p>
    </section>
  );
}
