import { NextResponse, type NextRequest } from "next/server";
import archiver from "archiver";
import * as XLSX from "xlsx";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Section = "membership" | "conference";

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) out[k] = "";
    else if (typeof v === "object") out[k] = JSON.stringify(v);
    else out[k] = v;
  }
  return out;
}

function sheetBuffer(rows: Record<string, unknown>[], sheetName: string): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows.map(serializeRow));
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function safeFileName(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(request: NextRequest) {
  const section = request.nextUrl.searchParams.get("section") as Section | null;
  if (section !== "membership" && section !== "conference") {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();

  const errors: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    console.error("[admin][export-zip] archive error:", err);
  });
  archive.on("warning", (err) => {
    console.warn("[admin][export-zip] archive warning:", err);
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      archive.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      archive.on("end", () => controller.close());
      archive.on("error", (err) => controller.error(err));

      (async () => {
        try {
          if (section === "membership") {
            const [regs, receipts] = await Promise.all([
              sb
                .from("membership_applications")
                .select("*")
                .order("created_at", { ascending: false }),
              sb
                .from("payment_receipts")
                .select("*")
                .eq("receipt_type", "hgs_membership")
                .order("created_at", { ascending: false }),
            ]);
            if (regs.error || receipts.error) throw regs.error ?? receipts.error;

            archive.append(
              sheetBuffer(regs.data ?? [], "Registrations"),
              { name: "membership-registrations.xlsx" },
            );
            archive.append(
              sheetBuffer(receipts.data ?? [], "Receipts"),
              { name: "membership-receipts.xlsx" },
            );

            for (const row of regs.data ?? []) {
              const path = (row as { receipt_path?: string }).receipt_path;
              const email = String((row as { email?: string }).email ?? "unknown");
              if (!path) continue;
              try {
                const { data, error } = await sb.storage
                  .from("membership-receipts")
                  .download(path);
                if (error || !data) throw error ?? new Error("empty download");
                const buf = Buffer.from(await data.arrayBuffer());
                const ext = path.split(".").pop() ?? "bin";
                archive.append(buf, {
                  name: `registration-receipts/${safeFileName(email)}.${ext}`,
                });
              } catch (e) {
                errors.push(
                  `membership-receipts/${path}: ${e instanceof Error ? e.message : String(e)}`,
                );
              }
            }

            for (const row of receipts.data ?? []) {
              const path = (row as { file_path?: string }).file_path;
              const email = String((row as { email?: string }).email ?? "unknown");
              if (!path) continue;
              try {
                const { data, error } = await sb.storage
                  .from("payment-receipts")
                  .download(path);
                if (error || !data) throw error ?? new Error("empty download");
                const buf = Buffer.from(await data.arrayBuffer());
                const ext = path.split(".").pop() ?? "bin";
                archive.append(buf, {
                  name: `payment-receipts/${safeFileName(email)}.${ext}`,
                });
              } catch (e) {
                errors.push(
                  `payment-receipts/${path}: ${e instanceof Error ? e.message : String(e)}`,
                );
              }
            }
          } else {
            const [sessions, abstracts, receipts] = await Promise.all([
              sb
                .from("thematic_session_submissions_2026")
                .select("*")
                .order("created_at", { ascending: false }),
              sb
                .from("abstracts")
                .select("*")
                .order("created_at", { ascending: false }),
              sb
                .from("payment_receipts")
                .select("*")
                .eq("receipt_type", "conference")
                .order("created_at", { ascending: false }),
            ]);
            if (sessions.error || abstracts.error || receipts.error) {
              throw sessions.error ?? abstracts.error ?? receipts.error;
            }

            archive.append(
              sheetBuffer(sessions.data ?? [], "ThematicSessions"),
              { name: "conference-thematic-sessions.xlsx" },
            );
            archive.append(
              sheetBuffer(abstracts.data ?? [], "Abstracts"),
              { name: "conference-abstracts.xlsx" },
            );
            archive.append(
              sheetBuffer(receipts.data ?? [], "Receipts"),
              { name: "conference-receipts.xlsx" },
            );

            for (const row of receipts.data ?? []) {
              const path = (row as { file_path?: string }).file_path;
              const email = String((row as { email?: string }).email ?? "unknown");
              if (!path) continue;
              try {
                const { data, error } = await sb.storage
                  .from("payment-receipts")
                  .download(path);
                if (error || !data) throw error ?? new Error("empty download");
                const buf = Buffer.from(await data.arrayBuffer());
                const ext = path.split(".").pop() ?? "bin";
                archive.append(buf, {
                  name: `payment-receipts/${safeFileName(email)}.${ext}`,
                });
              } catch (e) {
                errors.push(
                  `payment-receipts/${path}: ${e instanceof Error ? e.message : String(e)}`,
                );
              }
            }
          }

          const readme = [
            `HGS ${section === "membership" ? "Membership" : "Conference 2026"} export`,
            `Generated: ${new Date().toISOString()}`,
            "",
            errors.length === 0
              ? "All files included successfully."
              : `Errors (${errors.length}):\n${errors.map((e) => `- ${e}`).join("\n")}`,
          ].join("\n");
          archive.append(readme, { name: "README.txt" });

          await archive.finalize();
        } catch (err) {
          console.error("[admin][export-zip] fatal:", err);
          try {
            controller.error(err);
          } catch {
            /* already errored */
          }
        }
      })();
    },
    cancel() {
      archive.abort();
    },
  });

  const filename = `hgs-${section}-export-${today}.zip`;
  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
