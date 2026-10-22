"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"

export interface FinderSession {
  id: string
  title: string
  organizers: string
  topic: string
  when: string
}

export interface FinderEntry {
  sessionId: string
  code: string
  title: string
  authors: string
}

const MAX_SESSIONS = 10
const MAX_PRESENTATIONS = 25
const SESSION_ID = /^\d{1,2}[ab]?$/

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function ResultHeading({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-black/40">
      {label}
      <span className="ml-1.5 font-normal normal-case tracking-normal">
        {count}
        {count > max && ` · showing the first ${max}`}
      </span>
    </p>
  )
}

export function PresentationFinder({
  locale,
  sessions,
  entries,
}: {
  locale: string
  sessions: FinderSession[]
  entries: FinderEntry[]
}) {
  const [query, setQuery] = useState("")

  const sessionIndex = useMemo(
    () =>
      sessions.map((s) => ({
        session: s,
        haystack: normalize(`session ${s.title} ${s.organizers} ${s.topic}`),
      })),
    [sessions]
  )
  const entryIndex = useMemo(
    () => entries.map((e) => ({ entry: e, haystack: normalize(`${e.title} ${e.authors}`) })),
    [entries]
  )
  const sessionById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions])

  const terms = normalize(query).split(/\s+/).filter(Boolean)
  const active = query.trim().length >= 1 && (query.trim().length >= 2 || SESSION_ID.test(query.trim()))

  // A bare session number ("7", "36a") matches that session and its presentations,
  // never other numbers in their text.
  const sessionMatches = active
    ? sessionIndex
        .filter((i) =>
          terms.every((t) => (SESSION_ID.test(t) ? i.session.id === t : i.haystack.includes(t)))
        )
        .map((i) => i.session)
    : []
  const presentationMatches = active
    ? entryIndex
        .filter((i) =>
          terms.every((t) => (SESSION_ID.test(t) ? i.entry.sessionId === t : i.haystack.includes(t)))
        )
        .map((i) => i.entry)
    : []

  return (
    <div>
      <label htmlFor="presentation-search" className="sr-only">
        Search sessions and presentations
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
        <input
          id="presentation-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by session, topic, organiser, title or author…"
          autoComplete="off"
          className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-11 text-sm text-black placeholder:text-black/35 focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/5 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-black/40 hover:bg-black/5 hover:text-black transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {active && (
        <div className="mt-4 space-y-5" aria-live="polite">
          {sessionMatches.length === 0 && presentationMatches.length === 0 && (
            <p className="px-2 py-3 text-sm text-black/50">Nothing matches “{query.trim()}”.</p>
          )}

          {sessionMatches.length > 0 && (
            <div>
              <ResultHeading label="Sessions" count={sessionMatches.length} max={MAX_SESSIONS} />
              <ul className="space-y-2">
                {sessionMatches.slice(0, MAX_SESSIONS).map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/${locale}/conference2026/program/${s.id}`}
                      className="flex items-start gap-3 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 hover:border-black/25 hover:bg-black/[0.04] transition-colors"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white tabular-nums">
                        {s.id}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-black leading-snug">{s.title}</span>
                        <span className="mt-1 block text-xs text-black/60 leading-relaxed">
                          <span className="text-black/40">Organisers: </span>
                          {s.organizers}
                        </span>
                        <span className="mt-1.5 inline-block rounded-full border border-black/10 bg-white px-2.5 py-0.5 text-[11px] text-black/55">
                          {s.topic}
                        </span>
                        <span className="mt-1.5 block text-[11px] text-black/40 leading-relaxed">{s.when}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {presentationMatches.length > 0 && (
            <div>
              <ResultHeading label="Presentations" count={presentationMatches.length} max={MAX_PRESENTATIONS} />
              <ul className="divide-y divide-black/[0.06] rounded-xl border border-black/10 bg-white">
                {presentationMatches.slice(0, MAX_PRESENTATIONS).map((m) => {
                  const session = sessionById.get(m.sessionId)
                  return (
                    <li key={m.code}>
                      <Link
                        href={`/${locale}/conference2026/program/${m.sessionId}#${m.code}`}
                        className="block px-4 py-3 hover:bg-black/[0.03] transition-colors"
                      >
                        <p className="text-sm font-medium text-black leading-snug">{m.title}</p>
                        <p className="mt-0.5 text-xs text-black/55 leading-relaxed">{m.authors}</p>
                        <p className="mt-1 text-[11px] text-black/40 leading-relaxed">
                          Session {m.sessionId}
                          {session && <> · {session.when}</>}
                        </p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
