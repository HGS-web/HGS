"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ColumnDef } from "../_lib/columns";

type SortDir = "asc" | "desc";

interface Props<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  searchable?: (row: T) => string;
  onRowClick: (row: T) => void;
  emptyMessage?: string;
  rowKey: (row: T) => string;
}

export function DataTable<T>({
  columns,
  rows,
  searchable,
  onRowClick,
  emptyMessage = "No rows.",
  rowKey,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [query, setQuery] = useState("");

  const visibleRows = useMemo(() => {
    let out = rows;
    if (query.trim() && searchable) {
      const q = query.trim().toLowerCase();
      out = out.filter((r) => searchable(r).toLowerCase().includes(q));
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        const acc = col.accessor;
        out = [...out].sort((a, b) => {
          const av = acc(a);
          const bv = acc(b);
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (av < bv) return sortDir === "asc" ? -1 : 1;
          if (av > bv) return sortDir === "asc" ? 1 : -1;
          return 0;
        });
      }
    }
    return out;
  }, [rows, query, sortKey, sortDir, columns, searchable]);

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40" />
          <Input
            type="search"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search rows"
          />
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-neutral-50 text-left">
              {columns.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-black/60"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-black"
                    >
                      {col.header}
                      {active ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-black/50">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  tabIndex={0}
                  className="cursor-pointer border-b border-black/5 last:border-0 hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 align-top ${col.mono ? "font-mono text-xs" : ""} ${col.className ?? ""}`}
                    >
                      {col.cell ? col.cell(row) : (col.accessor(row) ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {visibleRows.length === 0 ? (
          <div className="rounded-xl border border-black/10 bg-white px-4 py-12 text-center text-sm text-black/50">
            {emptyMessage}
          </div>
        ) : (
          visibleRows.map((row) => (
            <button
              type="button"
              key={rowKey(row)}
              onClick={() => onRowClick(row)}
              className="block w-full rounded-xl border border-black/10 bg-white p-4 text-left hover:border-black/20 active:bg-neutral-50"
            >
              <div className="space-y-1.5">
                {columns.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-black/50">{col.header}</span>
                    <span
                      className={`text-right ${col.mono ? "font-mono" : ""}`}
                    >
                      {col.cell ? col.cell(row) : (col.accessor(row) ?? "—")}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="text-xs text-black/40 tabular-nums">
        {visibleRows.length} row{visibleRows.length === 1 ? "" : "s"}
        {query && rows.length !== visibleRows.length ? ` (filtered from ${rows.length})` : ""}
      </div>
    </div>
  );
}
