"use client"

import { useState } from "react"
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

  return (
    <div>
      <p className="mt-3 text-sm text-black/60">
        The call for sessions has now closed. The following thematic sessions have been accepted.
      </p>

      <ol className="mt-4 space-y-1.5">
        {sessions.map((session) => (
          <li key={session.id}>
            <button
              onClick={() => setSelected(session)}
              className="w-full text-left text-sm text-black/70 hover:text-black transition-colors group flex items-start gap-2"
            >
              <span className="shrink-0 font-medium text-black/35 w-6 text-right tabular-nums">
                {session.id}.
              </span>
              <span className="group-hover:underline underline-offset-2">{session.title}</span>
            </button>
          </li>
        ))}
      </ol>

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
