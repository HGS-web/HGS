"use client";

import { useId, useMemo, useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkAuthor2026 } from "../_lib/api";
import type { Conference2026Data } from "../_lib/types";
import type { Receipt2026Row } from "../_lib/presentations";

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function nameKey(value: string) {
  return normalize(value).split(/\s+/).sort().join(" ");
}

export function LinkAbstractForm({ receipt, data, onLinked }: {
  receipt: Receipt2026Row;
  data: Conference2026Data;
  onLinked: () => void;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const candidates = useMemo(() => {
    const people = new Map(data.people.map((p) => [p.id, p]));
    const abstracts = new Map(data.abstracts.map((a) => [a.id, a]));
    const registered = new Set(data.registrations.map((r) => r.person_id));
    const linked = new Set(receipt.abstracts.map((a) => a.id));
    const search = normalize(query);
    const expectedName = nameKey(receipt.registrant_name);
    return data.authors.flatMap((author) => {
      const person = people.get(author.person_id);
      const abstract = abstracts.get(author.abstract_id);
      if (!person || !abstract || person.source !== "import" || person.auth_user_id ||
        registered.has(person.id) || linked.has(abstract.id)) return [];
      const sameName = nameKey(author.name_as_listed) === expectedName || nameKey(person.full_name) === expectedName;
      const matches = search
        ? normalize(`${author.name_as_listed} ${person.full_name} ${person.email ?? ""} ${abstract.code} ${abstract.title}`).includes(search)
        : sameName;
      return matches ? [{ author, person, abstract, sameName }] : [];
    }).sort((a, b) => Number(b.sameName) - Number(a.sameName) || a.abstract.code.localeCompare(b.abstract.code, "en", { numeric: true }));
  }, [data, receipt, query]);
  const visible = candidates.slice(0, 40);
  const selected = visible.find((candidate) => candidate.author.id === selectedId);

  async function handleLink() {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      await linkAuthor2026({
        registration_id: receipt.registration_id,
        author_id: selected.author.id,
        previous_person_id: selected.author.person_id,
      });
      onLinked();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The author could not be linked.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="mt-4 rounded-lg border border-black/10 bg-neutral-50">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Link a missing abstract</summary>
      <div className="space-y-4 px-4 pb-4">
        <p className="text-sm leading-relaxed text-black/60">
          An author may have used a different email when submitting. Select their listed author entry to connect it to {receipt.registrant_name} ({receipt.email}).
        </p>
        <div className="space-y-1.5">
          <label htmlFor={inputId} className="text-xs font-medium">Find an author or abstract</label>
          <Input id={inputId} value={query} disabled={saving}
            onChange={(event) => { setQuery(event.target.value); setSelectedId(null); setError(null); }}
            placeholder="Author name, email, abstract code or title" />
        </div>
        <p className="text-xs text-black/60">
          {query.trim() ? `${candidates.length} matching author entries` : "Possible matches by name — review the details before linking."}
        </p>
        {visible.length > 0 ? (
          <fieldset disabled={saving} className="max-h-72 space-y-2 overflow-y-auto">
            <legend className="sr-only">Listed author entry to link</legend>
            {visible.map(({ author, person, abstract }) => (
              <label key={author.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-black/10 bg-white p-3 has-[:checked]:border-primary">
                <input type="radio" name={inputId} value={author.id} checked={selectedId === author.id}
                  onChange={() => { setSelectedId(author.id); setError(null); }} className="mt-1 shrink-0" />
                <span className="min-w-0 space-y-1 break-words text-sm">
                  <span className="block font-medium">{author.name_as_listed}</span>
                  <span className="block text-xs text-black/60">{person.email ?? "No email recorded"} · {author.affiliation_as_listed || person.affiliation || "No affiliation recorded"}</span>
                  <span className="block"><span className="font-mono text-xs">{abstract.code}</span> — {abstract.title}</span>
                </span>
              </label>
            ))}
          </fieldset>
        ) : <p className="text-sm text-black/60">No unlinked author entries found. Try a surname or an abstract code.</p>}
        {candidates.length > visible.length && <p className="text-xs text-black/60">Showing the first 40 entries. Refine your search to find the author.</p>}
        {selected && <p className="text-sm">Link {selected.author.name_as_listed} on <strong>{selected.abstract.code}</strong> to {receipt.registrant_name}?</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="button" size="sm" disabled={!selected || saving} onClick={() => void handleLink()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          {saving ? "Linking…" : "Link selected author"}
        </Button>
        <p className="text-xs leading-relaxed text-black/60">Only imported author entries without an account or registration are available here.</p>
      </div>
    </details>
  );
}
