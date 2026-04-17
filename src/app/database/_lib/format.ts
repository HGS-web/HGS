import type { Organizer } from "./types";

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fullName(first: string | null | undefined, last: string | null | undefined): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (!f && !l) return "—";
  return `${l}${l && f ? ", " : ""}${f}`;
}

export function formatOrganizer(o: Organizer | null | undefined): string {
  if (!o) return "—";
  const name = fullName(o.firstName, o.lastName);
  return o.email ? `${name} <${o.email}>` : name;
}

export function extensionFromPath(path: string | null | undefined): string {
  if (!path) return "";
  const dot = path.lastIndexOf(".");
  if (dot === -1) return "";
  return path.slice(dot + 1).toLowerCase();
}

export function humanBool(v: boolean | null | undefined): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
}

export function truncate(s: string | null | undefined, max = 80): string {
  if (!s) return "—";
  const t = s.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
