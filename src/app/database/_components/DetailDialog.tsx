"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { downloadFile } from "../_lib/api";
import { formatDateTime, humanBool } from "../_lib/format";

interface FileRef {
  bucket: "membership-receipts" | "payment-receipts";
  path: string;
  label?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  fields: Array<{ label: string; value: unknown }>;
  files?: FileRef[];
}

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") return <span className="text-black/40">—</span>;
  if (typeof value === "boolean") return humanBool(value);
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return <span className="font-mono text-xs tabular-nums">{formatDateTime(value)}</span>;
    return value;
  }
  if (typeof value === "number") return <span className="tabular-nums">{value}</span>;
  if (Array.isArray(value)) return <span className="font-mono text-xs">{value.map((v) => String(v)).join(", ")}</span>;
  if (typeof value === "object") {
    return (
      <pre className="whitespace-pre-wrap break-words rounded-md bg-neutral-50 p-2 text-xs font-mono">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return String(value);
}

export function DetailDialog({ open, onOpenChange, title, subtitle, fields, files }: Props) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(file: FileRef) {
    setError(null);
    setDownloading(file.path);
    try {
      await downloadFile(file.bucket, file.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8 text-left">{title}</DialogTitle>
          {subtitle && <DialogDescription className="text-left">{subtitle}</DialogDescription>}
        </DialogHeader>

        {files && files.length > 0 && (
          <div className="my-3 space-y-2 rounded-xl border border-black/10 bg-neutral-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wider text-black/50">
              Attached files
            </div>
            {files.map((file) => (
              <div key={file.path} className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1 font-mono truncate" title={file.path}>
                  {file.label ?? file.path.split("/").pop()}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file)}
                  disabled={downloading === file.path}
                  className="shrink-0"
                >
                  {downloading === file.path ? (
                    <>
                      <ExternalLink className="mr-1 h-3 w-3" /> Opening…
                    </>
                  ) : (
                    <>
                      <Download className="mr-1 h-3 w-3" /> Download
                    </>
                  )}
                </Button>
              </div>
            ))}
            {error && <div className="text-xs text-red-600">{error}</div>}
          </div>
        )}

        <dl className="divide-y divide-black/5">
          {fields.map((field) => (
            <div key={field.label} className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="text-xs font-medium uppercase tracking-wider text-black/50 sm:pt-0.5">
                {field.label}
              </dt>
              <dd className="min-w-0 break-words text-sm">{renderValue(field.value)}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
