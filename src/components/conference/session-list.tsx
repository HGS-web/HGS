"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { sessions, type Session } from "@/data/sessions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function SessionModal({ session, open, onClose }: { session: Session; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <p className="text-xs font-medium text-black/40 uppercase tracking-wider mb-1">
            Session {session.id}
          </p>
          <DialogTitle className="text-lg leading-snug pr-6">
            {session.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1">Organizers</p>
            <p className="text-black/80">{session.organizers}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1">General Topic</p>
            <p className="text-black/80">{session.topic}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1">Abstract</p>
            <div className="text-black/70 leading-relaxed whitespace-pre-wrap">{session.abstract}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SessionList() {
  const [selected, setSelected] = useState<Session | null>(null)
  const pathname = usePathname()
  const locale = pathname?.split("/")[1] === "el" ? "el" : "en"

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <p className="mt-3 text-sm text-black/60">
        The call for sessions has now closed. The following sessions have been accepted.
      </p>

      <ol className="mt-4 space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {sessions.map((session) => (
          <li key={session.id}>
            <button
              onClick={() => setSelected(session)}
              className="w-full text-left rounded-xl border border-black/8 bg-black/[0.02] hover:bg-black/[0.05] hover:border-black/15 transition-colors cursor-pointer px-4 py-3 flex items-start gap-3 group"
            >
              <span className="shrink-0 text-xs font-semibold text-black/30 tabular-nums mt-0.5 w-5 text-right">
                {session.id}.
              </span>
              <span className="text-sm text-black/70 group-hover:text-black transition-colors leading-snug">
                {session.title}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <Link
        href={`/${locale}/conference2026/sessions`}
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-black/45 hover:text-black transition-colors self-end"
      >
        Browse all session details
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>

      {selected && (
        <SessionModal
          session={selected}
          open={true}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
