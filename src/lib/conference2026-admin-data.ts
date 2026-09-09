import "server-only";
import { fetchAllRows } from "@/lib/supabase-admin";
import type { Conference2026Data } from "@/app/database/_lib/types";

/** The dashboard and its exports must use the same complete set of author links. */
export async function loadConference2026Data(): Promise<Conference2026Data> {
  const [registrations, receipts, people, abstracts, authors, claims] = await Promise.all([
    fetchAllRows<Conference2026Data["registrations"][number]>("registrations_conference2026"),
    fetchAllRows<Conference2026Data["receipts"][number]>("payment_receipts_conference2026"),
    fetchAllRows<Conference2026Data["people"][number]>("people_conference2026"),
    fetchAllRows<Conference2026Data["abstracts"][number]>("abstracts_conference2026", { column: "code", ascending: true }),
    fetchAllRows<Conference2026Data["authors"][number]>("abstract_authors_conference2026", { column: "author_order", ascending: true }),
    fetchAllRows<Conference2026Data["claims"][number]>("author_claims_conference2026"),
  ]);
  return { registrations, receipts, people, abstracts, authors, claims };
}
