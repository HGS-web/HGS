"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"

export interface FinderSession {
  when: string
}

export interface FinderEntry {
  sessionId: string
  code: string
  title: string
  authors: string
}

const MAX_RESULTS = 25

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export function PresentationFinder({
  locale,
  sessions,
  entries,
}: {
  locale: string
  sessions: Record<string, FinderSession>
  entries: FinderEntry[]
}) {
  const [query, setQuery] = useState("")

  const index = useMemo(
    () => entries.map((e) => ({ entry: e, haystack: normalize(`${e.title} ${e.authors}`) })),
    [entries]
  )

  const terms = normalize(query).split(/\s+/).filter(Boolean)
  const active = query.trim().length >= 2
  const matches = active
    ? index.filter((i) => terms.every((t) => i.haystack.includes(t))).map((i) => i.entry)
    : []

  return (
    <div>
      <label htmlFor="presentation-search" className="sr-only">
        Search presentations by title or author
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
        <input
          id="presentation-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search presentations by title or author…"
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
        <div className="mt-3" aria-live="polite">
          {matches.length === 0 ? (
            <p className="px-2 py-3 text-sm text-black/50">No presentations match “{query.trim()}”.</p>
          ) : (
            <>
              <p className="px-2 pb-2 text-xs text-black/40">
                {matches.length} {matches.length === 1 ? "presentation" : "presentations"}
                {matches.length > MAX_RESULTS && ` · showing the first ${MAX_RESULTS}`}
              </p>
              <ul className="divide-y divide-black/[0.06] rounded-xl border border-black/10 bg-white">
                {matches.slice(0, MAX_RESULTS).map((m) => {
                  const session = sessions[m.sessionId]
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
            </>
          )}
        </div>
      )}
    </div>
  )
}
