"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import type { AbstractDetail } from "@/lib/conference2026-types"

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
    fetch(`/api/conference2026/abstracts/${abstractId}`)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {error && <p className="text-sm text-red-600 py-8 text-center">{error}</p>}
        {!detail && !error && (
          <p className="text-sm text-black/40 py-8 text-center">Loading…</p>
        )}
        {detail && (
          <>
            <DialogHeader>
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Session {detail.session_label}
              </p>
              <DialogTitle className="leading-snug">{detail.title}</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-1 pt-1">
                  {detail.evaluation === "reassigned" && detail.session_original && (
                    <p className="text-xs text-black/40">
                      Accepted — reassigned from “{detail.session_original}”.
                    </p>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1.5">
                  Authors
                </p>
                <ul className="space-y-1">
                  {detail.authors.map((author, i) => (
                    <li key={i} className="text-sm text-black/70 leading-snug">
                      <span className="font-medium text-black">{author.name}</span>
                      <span className={`ml-2 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold align-middle ${author.role === "author" ? "bg-black text-white" : "border border-black/20 text-black/50"}`}>
                        {author.role === "author" ? "Author" : "Co-author"}
                      </span>
                      {author.affiliation && (
                        <span className="block text-xs text-black/40">{author.affiliation}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1.5">
                  Abstract
                </p>
                <p className="text-sm text-black/70 leading-relaxed whitespace-pre-wrap">
                  {detail.abstract_text}
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
