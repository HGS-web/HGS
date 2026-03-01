"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, UploadCloud, X } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const schema = z.object({
  email: z.string().email("Invalid email"),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const ACCEPTED  = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 10 * 1024 * 1024

const SUPPORT_HREF = `mailto:ekarkani@geol.uoa.gr?subject=${encodeURIComponent("HGS Conference 2026 – Payment Issue")}&body=${encodeURIComponent("Email used for registration:\n\nDescription:\n\n")}`

function FileSlot({
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
          <span className="text-xs">PDF, JPEG, PNG — max 10 MB</span>
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

export function PaymentDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen]               = useState(false)
  const [success, setSuccess]         = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const [confFile, setConfFile]         = useState<File | null>(null)
  const [confError, setConfError]       = useState<string | null>(null)
  const [hgsFile, setHgsFile]           = useState<File | null>(null)
  const [hgsError, setHgsError]         = useState<string | null>(null)

  const confRef = useRef<HTMLInputElement>(null)
  const hgsRef  = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const validateFile = (f: File | undefined, setFile: (f: File | null) => void, setError: (e: string | null) => void) => {
    if (!f) return
    if (!ACCEPTED.includes(f.type)) { setError("Accepted: PDF, JPEG, PNG"); return }
    if (f.size > MAX_BYTES)         { setError("File must be under 10 MB"); return }
    setError(null)
    setFile(f)
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null)

    if (!confFile) { setConfError("Please upload your conference payment receipt."); return }

    const supabase = getSupabaseClient()
    if (!supabase) { setServerError("Service unavailable."); return }

    const normalized = data.email.trim().toLowerCase()

    const { data: reg, error: regErr } = await supabase
      .from("registrations").select("email").ilike("email", normalized).maybeSingle()

    if (regErr) { setServerError(`Database error: ${regErr.message}`); return }
    if (!reg)   { setServerError("This email is not registered. Please register first."); return }

    const uploadAndInsert = async (file: File, receiptType: "conference" | "hgs_membership") => {
      const ext  = file.name.split(".").pop()
      const path = `${Date.now()}-${normalized.replace(/[@.]/g, "_")}-${receiptType}.${ext}`
      const { error: uploadErr } = await supabase.storage.from("payment-receipts").upload(path, file)
      if (uploadErr) throw new Error("File upload failed. Please try again.")
      const { error } = await supabase.from("payment_receipts").insert([{
        email:        normalized,
        receipt_type: receiptType,
        file_path:    path,
        notes:        data.notes ?? "",
      }])
      if (error) throw new Error("Something went wrong. Please try again.")
    }

    try {
      await uploadAndInsert(confFile, "conference")
      if (hgsFile) await uploadAndInsert(hgsFile, "hgs_membership")
    } catch (err) {
      setServerError((err as Error).message)
      return
    }

    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "receipt",
        email: normalized,
        receipt_type: hgsFile ? "conference + hgs_membership" : "conference",
        notes: data.notes,
      }),
    }).catch(() => {})

    setSuccess(true)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      reset()
      setSuccess(false); setServerError(null)
      setConfFile(null); setConfError(null)
      setHgsFile(null);  setHgsError(null)
    }
    setOpen(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        {success ? (
          <div className="py-10 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
            <DialogTitle>Receipt received!</DialogTitle>
            <p className="text-sm text-black/50 leading-relaxed">
              Your payment receipt has been uploaded. We will confirm your payment within a few business days.
            </p>
            <button
              onClick={() => handleOpenChange(false)}
              className="px-6 py-2 bg-black text-white text-sm rounded-full hover:bg-black/80 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Upload Payment Receipt</DialogTitle>
              <DialogDescription>
                PDF or image · max 10 MB per file
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
              <div className="space-y-1.5">
                <Label htmlFor="p-email">Registration Email *</Label>
                <Input
                  id="p-email"
                  type="email"
                  placeholder="Use the email you registered with"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <FileSlot
                label="Conference Payment Receipt"
                required
                file={confFile}
                error={confError}
                fileRef={confRef}
                onChange={f => validateFile(f, setConfFile, setConfError)}
                onClear={() => { setConfFile(null); setConfError(null); if (confRef.current) confRef.current.value = "" }}
              />

              <FileSlot
                label="HGS Membership Receipt"
                hint="(if registering at the HGS member rate)"
                file={hgsFile}
                error={hgsError}
                fileRef={hgsRef}
                onChange={f => validateFile(f, setHgsFile, setHgsError)}
                onClear={() => { setHgsFile(null); setHgsError(null); if (hgsRef.current) hgsRef.current.value = "" }}
              />

              <div className="space-y-1.5">
                <Label htmlFor="p-notes">
                  Notes{" "}
                  <span className="font-normal text-black/40">(optional)</span>
                </Label>
                <Textarea
                  id="p-notes"
                  rows={2}
                  placeholder="e.g. transfer reference number"
                  {...register("notes")}
                />
              </div>

              {serverError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p>
                    {serverError}{" — "}
                    <a href={SUPPORT_HREF} className="underline font-medium">contact us</a> if the issue persists.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting ? "Uploading…" : "Upload Receipt"}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
