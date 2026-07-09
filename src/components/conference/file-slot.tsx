"use client"

import { UploadCloud, X } from "lucide-react"
import { Label } from "@/components/ui/label"

export const FILE_SLOT_ACCEPTED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]
export const FILE_SLOT_MAX_BYTES = 10 * 1024 * 1024

/**
 * Single-file upload slot (PDF/JPEG/PNG/WebP, ≤10 MB), extracted from the
 * original payment dialog.
 */
export function FileSlot({
  label, hint, required, file, error, fileRef, onChange, onClear,
}: {
  label: string
  hint?: string
  required?: boolean
  file: File | null
  error: string | null
  fileRef: React.RefObject<HTMLInputElement | null>
  onChange: (f: File | undefined) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}{required ? " *" : " "}
        {hint && <span className="font-normal text-black/40">{hint}</span>}
      </Label>
      {file ? (
        <div className="flex items-center gap-2 p-2 border border-black/10 rounded-lg text-sm">
          <span className="flex-1 truncate">{file.name}</span>
          <button
            type="button"
            onClick={onClear}
            className="text-black/30 hover:text-black transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 border-2 border-dashed border-black/10 rounded-lg p-5 text-sm text-black/40 cursor-pointer hover:border-black/20 hover:bg-black/5 transition-colors">
          <UploadCloud className="h-6 w-6" />
          <span>Click to select file</span>
          <span className="text-xs">PDF, JPEG, PNG, WebP — max 10 MB</span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={e => onChange(e.target.files?.[0])}
          />
        </label>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function validateSlotFile(f: File | undefined): string | null {
  if (!f) return null
  if (!FILE_SLOT_ACCEPTED.includes(f.type)) return "Accepted: PDF, JPEG, PNG, WebP"
  if (f.size > FILE_SLOT_MAX_BYTES) return "File must be under 10 MB"
  return null
}
