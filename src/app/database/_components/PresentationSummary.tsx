"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { statusChip } from "../_lib/columns";
import { evaluationLabel, type Presentation2026 } from "../_lib/presentations";

export function PresentationSummary({
  presentation,
  receiptHolderId,
  children,
}: {
  presentation: Presentation2026;
  receiptHolderId?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-3">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="font-mono text-xs font-medium">{presentation.code}</span>
          {statusChip(presentation.evaluation, `Abstract: ${evaluationLabel(presentation.evaluation)}`)}
        </div>
        <h3 className="break-words text-base font-semibold leading-snug">{presentation.title}</h3>
        <p className="mt-1.5 break-words text-sm text-black/60">
          {presentation.session_label || "Session not assigned"}
        </p>
      </div>

      {children}

      <details className="group">
        <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-md text-sm font-medium text-black/70 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black [&::-webkit-details-marker]:hidden">
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 group-open:rotate-180" />
          Authors &amp; abstract
          <span className="sr-only"> for {presentation.code}</span>
        </summary>
        <div className="space-y-4 pb-1 pt-2">
          <ol className="space-y-2 text-sm" aria-label="Listed authors">
            {presentation.authors.map((author) => (
              <li key={author.id} className="break-words">
                <span className="font-medium">{author.name_as_listed}</span>
                {author.person_id === receiptHolderId && (
                  <span className="ml-2 text-xs font-medium text-black/60">Receipt holder</span>
                )}
                {author.affiliation_as_listed && (
                  <span className="block text-xs leading-relaxed text-black/60">{author.affiliation_as_listed}</span>
                )}
              </li>
            ))}
          </ol>
          <p className="max-w-prose whitespace-pre-wrap break-words text-sm leading-relaxed text-black/80">
            {presentation.abstract_text || "Abstract text is not available."}
          </p>
        </div>
      </details>
    </div>
  );
}
