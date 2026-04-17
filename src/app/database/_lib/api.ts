import type { DashboardData, ExportTableKey, SectionKey } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function login(password: string): Promise<void> {
  const res = await fetch("/api/admin/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ password }),
  });
  await json<{ ok: true }>(res);
}

export async function logout(): Promise<void> {
  await fetch("/api/admin/auth", { method: "DELETE", credentials: "include" });
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch("/api/admin/data", { credentials: "include" });
  return json<DashboardData>(res);
}

export async function getSignedFileUrl(
  bucket: "membership-receipts" | "payment-receipts",
  path: string,
): Promise<string> {
  const res = await fetch("/api/admin/file-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ bucket, path }),
  });
  const body = await json<{ url: string }>(res);
  return body.url;
}

export function exportXlsxUrl(table: ExportTableKey): string {
  return `/api/admin/export/xlsx?table=${encodeURIComponent(table)}`;
}

export function exportZipUrl(section: SectionKey): string {
  return `/api/admin/export/zip?section=${encodeURIComponent(section)}`;
}

export async function downloadFile(
  bucket: "membership-receipts" | "payment-receipts",
  path: string,
): Promise<void> {
  const url = await getSignedFileUrl(bucket, path);
  window.open(url, "_blank", "noopener,noreferrer");
}
