"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import type { AbstractDetail } from "@/lib/conference2026-types"

/** "33. Web Mapping…" → { number: "33", name: "Web Mapping…" } */
function splitSession(label: string) {
  const m = /^\s*(\d+)\.\s*(.*)$/.exec(label)
  return m ? { number: m[1], name: m[2] } : { number: null, name: label }
}

/** Placeholder affiliations ("-", "n/a", empty) should render as nothing. */
function cleanAffiliation(value: string | null): string | null {
  const trimmed = value?.trim() ?? ""
  if (!trimmed || /^(-+|n\/?a|none)$/i.test(trimmed)) return null
  return trimmed
}

/**
 * Full abstract detail (final session, complete author list, full text),
 * fetched on open — only linked authors can retrieve it.
 */
export function AbstractDetailDialog({
  abstractId,
  open,
  onOpenChange,
}: {
  abstractId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loaded, setLoaded] = useState<AbstractDetail | null>(null)
  const [failedId, setFailedId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !abstractId) return
    let cancelled = false
    fetch(`/api/conference2026/abstracts/${abstractId}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = (await res.json()) as AbstractDetail
        if (!cancelled) setLoaded(data)
      })
      .catch(() => {
        if (!cancelled) setFailedId(abstractId)
      })
    return () => { cancelled = true }
  }, [open, abstractId])

  // Only show data belonging to the currently requested abstract.
  const detail = loaded && loaded.id === abstractId ? loaded : null
  const error =
    failedId && failedId === abstractId ? "The abstract could not be loaded." : null

  const session = detail ? splitSession(detail.session_label) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        {/* Radix requires a DialogTitle; the loaded state supplies its own
            in the header, so this covers only the loading/error states. */}
        {!detail && (
          <DialogTitle className="px-6 pt-6 pb-2 text-base">
            {error ? "Abstract unavailable" : "Loading abstract…"}
          </DialogTitle>
        )}
        {error && <p className="text-sm text-red-600 pb-16 pt-2 text-center">{error}</p>}
        {!detail && !error && (
          <p className="text-sm text-black/40 pb-16 pt-2 text-center">Loading…</p>
        )}
        {detail && session && (
          <>
            {/* Header */}
            <DialogHeader className="!mb-0 space-y-3 border-b border-black/[0.07] px-6 pt-6 pb-5 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                {session.number && (
                  <span className="inline-block rounded-md bg-black px-2 py-0.5 text-[11px] font-semibold text-white">
                    Session {session.number}
                  </span>
                )}
                <span className="inline-block rounded-full border border-green-600/20 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                  {detail.evaluation === "reassigned" ? "Accepted · reassigned" : "Accepted"}
                </span>
              </div>
              <DialogTitle className="text-lg leading-snug">{detail.title}</DialogTitle>
              <DialogDescription asChild>
                <div className="text-xs text-black/45 leading-relaxed">
                  {session.name}
                  {detail.evaluation === "reassigned" && detail.session_original && (
                    <span className="block mt-1 text-black/35">
                      Reassigned from “{splitSession(detail.session_original).name}”.
                    </span>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-5 space-y-6">
              {/* Authors */}
              <section className="space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">
                  Authors
                </p>
                <ul className="space-y-2.5">
                  {detail.authors.map((author, i) => {
                    const affiliation = cleanAffiliation(author.affiliation)
                    return (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className={`mt-0.5 inline-block shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${author.role === "author" ? "bg-black text-white" : "border border-black/20 text-black/50"}`}>
                          {author.role === "author" ? "Author" : "Co-author"}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-black leading-snug">{author.name}</span>
                          {affiliation && (
                            <span className="block text-xs text-black/45 leading-snug">{affiliation}</span>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>

              {/* Abstract */}
              <section className="space-y-2 border-t border-black/[0.07] pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">
                  Abstract
                </p>
                <p className="text-sm text-black/70 leading-relaxed whitespace-pre-wrap">
                  {detail.abstract_text}
                </p>
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
