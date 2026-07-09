"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { SECRETARIAT_EMAIL } from "@/config/conference2026"

export interface ClaimCandidate {
  abstract_id: string
  abstract_author_id: string
  code: string
  title: string
  session_label: string
  name_as_listed: string
  role: string
}

/**
 * Authorship-claim finder: searches the accepted abstracts by the person's
 * name and lets them tick the ones they are listed on. Selection handling is
 * up to the parent (stored locally in the register flow, submitted directly
 * from the profile).
 */
export function ClaimAbstracts({
  firstName,
  lastName,
  selected,
  onToggle,
}: {
  firstName: string
  lastName: string
  selected: ClaimCandidate[]
  onToggle: (candidate: ClaimCandidate, checked: boolean) => void
}) {
  const [candidates, setCandidates] = useState<ClaimCandidate[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSearch = firstName.trim().length > 0 && lastName.trim().length > 1

  const search = async () => {
    setSearching(true)
    setError(null)
    try {
      const res = await fetch("/api/conference2026/claims/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { candidates: ClaimCandidate[] }
      setCandidates(data.candidates)
    } catch {
      setError("Search failed. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-black/50 leading-relaxed">
        If you are an author or co-author of an accepted abstract, we can link
        it to your profile. We will search the accepted abstracts by your name;
        your selection will then be reviewed by the organising committee.
      </p>

      <button
        type="button"
        disabled={!canSearch || searching}
        onClick={search}
        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-black/15 rounded-lg hover:bg-black/5 disabled:opacity-40 transition-colors cursor-pointer"
      >
        <Search className="h-3.5 w-3.5" />
        {searching ? "Searching…" : "Find my abstracts"}
      </button>
      {!canSearch && (
        <p className="text-xs text-black/35">Fill in your first and last name above first.</p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {candidates !== null && candidates.length === 0 && (
        <p className="text-xs text-black/50 leading-relaxed">
          No accepted abstracts matching your name were found. If you believe
          this is an error, please contact the conference secretariat at{" "}
          <a href={`mailto:${SECRETARIAT_EMAIL}`} className="underline">{SECRETARIAT_EMAIL}</a>.
        </p>
      )}

      {candidates !== null && candidates.length > 0 && (
        <div className="space-y-2">
          {candidates.map((candidate) => {
            const checked = selected.some(
              (s) => s.abstract_id === candidate.abstract_id
            )
            return (
              <label
                key={candidate.abstract_author_id}
                className="flex items-start gap-3 rounded-xl border border-black/10 p-3 cursor-pointer hover:bg-black/[0.02] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onToggle(candidate, e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-black"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-black leading-snug">
                    {candidate.title}
                  </span>
                  <span className="block text-xs text-black/40 mt-0.5">
                    {candidate.session_label} · listed as {candidate.name_as_listed}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
