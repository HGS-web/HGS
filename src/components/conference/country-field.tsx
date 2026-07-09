"use client"

import { useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"

/**
 * The full ISO-3166 country list, derived from the runtime's own locale
 * data (Intl.DisplayNames) — nothing hand-written, nothing to maintain.
 * Probes every two-letter region code; unknown codes echo back unchanged
 * and are dropped, as are supranational pseudo-regions.
 */
function buildCountryList(): string[] {
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" })
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const skip = new Set(["EU", "EZ", "UN", "QO", "XA", "XB", "ZZ"])
    const names = new Set<string>()
    for (const a of letters) {
      for (const b of letters) {
        const code = a + b
        if (skip.has(code)) continue
        let name: string | undefined
        try { name = displayNames.of(code) } catch { continue }
        if (name && name !== code) names.add(name)
      }
    }
    return [...names].sort((x, y) => x.localeCompare(y))
  } catch {
    return [] // no Intl support → the field degrades to a plain text input
  }
}

/**
 * Searchable country input: typing filters the list, click or ↑/↓ + Enter
 * picks an entry. Free text is still accepted, so nobody is ever stuck.
 */
export function CountryField({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}) {
  const countries = useMemo(() => buildCountryList(), [])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const query = value.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!query) return countries
    // startsWith matches first, then substring matches
    const starts = countries.filter((c) => c.toLowerCase().startsWith(query))
    const contains = countries.filter(
      (c) => !c.toLowerCase().startsWith(query) && c.toLowerCase().includes(query)
    )
    return [...starts, ...contains]
  }, [countries, query])

  const pick = (name: string) => {
    onChange(name)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
      listRef.current?.children[Math.min(active + 1, filtered.length - 1)]?.scrollIntoView({ block: "nearest" })
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
      listRef.current?.children[Math.max(active - 1, 0)]?.scrollIntoView({ block: "nearest" })
    } else if (e.key === "Enter") {
      e.preventDefault()
      pick(filtered[Math.min(active, filtered.length - 1)])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="country-name"
        placeholder="Start typing to search…"
        value={value}
        aria-invalid={invalid}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg"
        >
          {filtered.map((country, i) => (
            <li key={country} role="option" aria-selected={country === value}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(country)}
                onMouseEnter={() => setActive(i)}
                className={`w-full cursor-pointer px-3 py-1.5 text-left text-sm transition-colors ${
                  i === active ? "bg-black/5 text-black" : "text-black/70"
                }`}
              >
                {country}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
