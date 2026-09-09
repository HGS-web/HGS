"use client";

import { useMemo, useState } from "react";
import { Download, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { presentationsCsv, type Presentation2026 } from "../_lib/presentations";
import { PresentationSummary } from "./PresentationSummary";

export function PaidPresentationsDialog({ presentations }: { presentations: Presentation2026[] }) {
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const visiblePresentations = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return presentations;
    return presentations.filter((p) => [
      p.code,
      p.title,
      p.session_label,
      ...p.authors.map((a) => a.name_as_listed),
      ...p.paid_authors.flatMap((a) => [a.name, a.email]),
    ].join(" ").toLocaleLowerCase().includes(search));
  }, [presentations, query]);

  function downloadCsv() {
    setExporting(true);
    setExportError(null);
    try {
      const blob = new Blob([presentationsCsv(visiblePresentations)], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hgs-2026-presentations-accepted-receipts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError("The list could not be exported. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dialog onOpenChange={(open) => {
      if (open) {
        setQuery("");
        setExportError(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-auto min-h-10 justify-start whitespace-normal py-2 text-left">
          <List aria-hidden="true" className="h-4 w-4 shrink-0" />
          Presentations with accepted receipts
          <span className="ml-1 tabular-nums text-black/60">({presentations.length})</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[94vw] sm:max-w-4xl">
        <DialogHeader className="pr-8">
          <DialogTitle>Presentations with accepted receipts</DialogTitle>
          <DialogDescription className="max-w-prose leading-relaxed text-black/60">
            At least one linked author or co-author has an accepted conference receipt.
            Each abstract is listed once. This records payment, not who will deliver the presentation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 border-b border-black/10 pb-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="paid-presentations-search" className="mb-1.5 block text-sm font-medium">Search presentations</label>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/60" />
              <Input
                id="paid-presentations-search"
                type="search"
                placeholder="Code, title, session or author"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button variant="outline" onClick={downloadCsv} disabled={visiblePresentations.length === 0 || exporting}>
            <Download aria-hidden="true" className="h-4 w-4" />
            {exporting ? "Exporting…" : query.trim() ? "Export filtered CSV" : "Export CSV"}
          </Button>
        </div>

        {exportError && <p role="alert" className="mt-3 text-sm text-red-700">{exportError}</p>}
        <p role="status" className="mt-4 text-xs tabular-nums text-black/60">
          {visiblePresentations.length} of {presentations.length} presentation{presentations.length === 1 ? "" : "s"}
        </p>

        {visiblePresentations.length === 0 ? (
          <div className="py-10 text-center">
            <h2 className="text-base font-semibold">
              {presentations.length === 0 ? "No qualifying presentations yet" : "No matching presentations"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-black/60">
              {presentations.length === 0
                ? "Presentations appear here when a linked author has an accepted conference receipt. Membership receipts and unresolved authorship claims do not count."
                : "Try another title, abstract code, session or author name."}
            </p>
            {query.trim() && <Button variant="outline" size="sm" className="mt-4" onClick={() => setQuery("")}>Clear search</Button>}
          </div>
        ) : (
          <ul className="divide-y divide-black/10">
            {visiblePresentations.map((presentation) => (
              <li key={presentation.id} className="py-6">
                <PresentationSummary presentation={presentation}>
                  <div className="rounded-lg bg-neutral-50 px-4 py-3">
                    <h4 className="text-xs font-medium text-green-800">
                      Accepted conference receipt · {presentation.paid_authors.length} registered author{presentation.paid_authors.length === 1 ? "" : "s"}
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {presentation.paid_authors.map((author) => (
                        <li key={author.person_id} className="flex flex-col gap-x-4 gap-y-0.5 text-sm sm:flex-row sm:justify-between">
                          <span className="min-w-0 break-words font-medium">{author.name}</span>
                          <span className="min-w-0 break-words text-black/60">{author.email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </PresentationSummary>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
