import type {
  AuthorClaimConference2026,
  Conference2026Data,
  DashboardData,
  ExportTableKey,
  PaymentReceiptConference2026,
  SectionKey,
} from "./types";

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
  const res = await fetch("/api/admin/data", { credentials: "include", cache: "no-store" });
  return json<DashboardData>(res);
}

export async function fetchConference2026Data(): Promise<Conference2026Data> {
  const res = await fetch("/api/admin/data2026", { credentials: "include", cache: "no-store" });
  return json<Conference2026Data>(res);
}

export async function updateReceipt2026(
  id: string,
  input: { status: "pending" | "accepted" | "declined"; admin_notes?: string },
): Promise<PaymentReceiptConference2026> {
  const res = await fetch(`/api/admin/receipts-2026/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const body = await json<{ ok: true; receipt: PaymentReceiptConference2026 }>(res);
  return body.receipt;
}

export async function decideClaim2026(
  id: string,
  input: { action: "approve" | "reject"; admin_note?: string },
): Promise<AuthorClaimConference2026> {
  const res = await fetch(`/api/admin/claims-2026/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const body = await json<{ ok: true; claim: AuthorClaimConference2026 }>(res);
  return body.claim;
}

export type AdminBucket =
  | "membership-receipts"
  | "payment-receipts"
  | "payment-receipts-conference2026";

export async function getSignedFileUrl(
  bucket: AdminBucket,
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
  bucket: AdminBucket,
  path: string,
): Promise<void> {
  const url = await getSignedFileUrl(bucket, path);
  window.open(url, "_blank", "noopener,noreferrer");
}
