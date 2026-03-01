"use client"

import { useState, useRef } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, UploadCloud, X, UserPlus } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { sessions } from "@/data/sessions"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

const coAuthorSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name:  z.string().min(1, "Required"),
  email:      z.string().email("Invalid email"),
})

const schema = z.object({
  email:         z.string().email("Invalid email"),
  title:         z.string().min(3, "Please enter the abstract title"),
  session_id:    z.string().min(1, "Please select a session"),
  co_authors:    z.array(coAuthorSchema).default([]),
  abstract_text: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function wordCount(t: string) {
  return t.trim() === "" ? 0 : t.trim().split(/\s+/).length
}

const SUPPORT_HREF = `mailto:ekarkani@geol.uoa.gr?subject=${encodeURIComponent("HGS Conference 2026 – Change Request")}&body=${encodeURIComponent("Email used for registration:\n\nDescription of change or issue:\n\n")}`

export function AbstractDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen]               = useState(false)
  const [success, setSuccess]         = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [file, setFile]               = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, reset, control, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { abstract_text: "", co_authors: [] },
    })

  const { fields, append, remove } = useFieldArray({ control, name: "co_authors" })

  const abstractText = watch("abstract_text") ?? ""
  const words        = wordCount(abstractText)
  const overLimit    = words > 500

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    setIsDuplicate(false)
    const supabase = getSupabaseClient()
    if (!supabase) { setServerError("Service unavailable."); return }

    const normalized = data.email.trim().toLowerCase()

    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select("first_name, last_name, affiliation")
      .ilike("email", normalized)
      .maybeSingle()

    if (regErr) { setServerError(`Database error: ${regErr.message}`); return }
    if (!reg)   { setServerError("This email is not registered. Please register first."); return }

    const { data: existing } = await supabase
      .from("abstracts").select("id").ilike("email", normalized).maybeSingle()

    if (existing) { setIsDuplicate(true); setServerError("duplicate"); return }

    const hasText = (data.abstract_text ?? "").trim().length > 0
    if (!hasText && !file) { setServerError("Please provide abstract text or upload a file."); return }

    let file_path: string | null = null
    if (file) {
      const ext  = file.name.split(".").pop()
      const path = `${Date.now()}-${reg.last_name}_${reg.first_name}.${ext}`
      const { error: uploadErr } = await supabase.storage.from("abstracts").upload(path, file)
      if (uploadErr) { setServerError("File upload failed. Please try again."); return }
      file_path = path
    }

    const sessionId = parseInt(data.session_id)
    const session   = sessions.find(s => s.id === sessionId)

    const { data: inserted, error } = await supabase.from("abstracts").insert([{
      first_name:    reg.first_name,
      last_name:     reg.last_name,
      email:         normalized,
      affiliation:   reg.affiliation,
      session_id:    sessionId,
      title:         data.title,
      abstract_text: data.abstract_text?.trim() || null,
      file_path,
    }]).select("id").single()

    if (error || !inserted) { setServerError("Something went wrong. Please try again."); return }

    if (data.co_authors.length > 0) {
      const { error: coAuthErr } = await supabase.from("abstract_co_authors").insert(
        data.co_authors.map(ca => ({
          abstract_id: inserted.id,
          first_name:  ca.first_name,
          last_name:   ca.last_name,
          email:       ca.email,
        }))
      )
      if (coAuthErr) { setServerError("Something went wrong saving co-authors. Please try again."); return }
    }

    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "abstract",
        first_name: reg.first_name,
        last_name:  reg.last_name,
        affiliation: reg.affiliation,
        email: normalized,
        title: data.title,
        co_authors: data.co_authors,
        session_id: sessionId,
        session_title: session?.title,
      }),
    }).catch(() => {})

    setSuccess(true)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) { reset(); setSuccess(false); setServerError(null); setIsDuplicate(false); setFile(null) }
    setOpen(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        {success ? (
          <div className="py-10 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
            <DialogTitle>Abstract submitted!</DialogTitle>
            <p className="text-sm text-black/50 leading-relaxed">
              Thank you. A confirmation email is on its way.
              Author notifications by <strong>1 July 2026</strong>.
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
              <DialogTitle>Submit Your Abstract</DialogTitle>
              <DialogDescription>Max 500 words · English · Deadline: 1 May 2026</DialogDescription>
            </DialogHeader>

            <div className="mb-3 p-3 bg-black/5 rounded-lg text-xs text-black/50 leading-relaxed">
              Type your abstract below <strong>or</strong> upload a file (.docx preferred).
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="a-email">Registration Email *</Label>
                <Input id="a-email" type="email" placeholder="Use the email you registered with" {...register("email")} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="a-title">Abstract Title *</Label>
                <Input id="a-title" {...register("title")} aria-invalid={!!errors.title} />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="a-session">Thematic Session *</Label>
                <Select id="a-session" {...register("session_id")} aria-invalid={!!errors.session_id}>
                  <option value="">Select a session…</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.id}. {s.title}</option>
                  ))}
                </Select>
                {errors.session_id && <p className="text-xs text-red-500">{errors.session_id.message}</p>}
              </div>

              {/* Co-authors */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    Co-authors{" "}
                    <span className="font-normal text-black/40">(optional)</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => append({ first_name: "", last_name: "", email: "" })}
                    className="flex items-center gap-1.5 text-xs text-black/50 hover:text-black border border-black/15 rounded-lg px-2.5 py-1.5 hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add co-author
                  </button>
                </div>

                {fields.length > 0 && (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="rounded-xl border border-black/8 bg-black/[0.02] p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-black/40">Co-author {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-black/30 hover:text-black transition-colors cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor={`ca-fn-${index}`} className="text-xs">First Name *</Label>
                            <Input
                              id={`ca-fn-${index}`}
                              {...register(`co_authors.${index}.first_name`)}
                              aria-invalid={!!errors.co_authors?.[index]?.first_name}
                            />
                            {errors.co_authors?.[index]?.first_name && (
                              <p className="text-xs text-red-500">{errors.co_authors[index]!.first_name!.message}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`ca-ln-${index}`} className="text-xs">Last Name *</Label>
                            <Input
                              id={`ca-ln-${index}`}
                              {...register(`co_authors.${index}.last_name`)}
                              aria-invalid={!!errors.co_authors?.[index]?.last_name}
                            />
                            {errors.co_authors?.[index]?.last_name && (
                              <p className="text-xs text-red-500">{errors.co_authors[index]!.last_name!.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`ca-em-${index}`} className="text-xs">Email *</Label>
                          <Input
                            id={`ca-em-${index}`}
                            type="email"
                            {...register(`co_authors.${index}.email`)}
                            aria-invalid={!!errors.co_authors?.[index]?.email}
                          />
                          {errors.co_authors?.[index]?.email && (
                            <p className="text-xs text-red-500">{errors.co_authors[index]!.email!.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="a-text">Abstract Text</Label>
                  <span className={`text-xs ${overLimit ? "text-red-500 font-medium" : "text-black/40"}`}>
                    {words} / 500 words
                  </span>
                </div>
                <Textarea
                  id="a-text"
                  rows={7}
                  placeholder="Paste or type your abstract here (max 500 words)…"
                  {...register("abstract_text")}
                  aria-invalid={overLimit}
                />
                {overLimit && <p className="text-xs text-red-500">Abstract exceeds 500 words.</p>}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Or Upload File{" "}
                  <span className="font-normal text-black/40">(.docx / .pdf, max 10 MB)</span>
                </Label>
                {file ? (
                  <div className="flex items-center gap-2 p-2 border border-black/10 rounded-lg text-sm">
                    <span className="flex-1 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = "" }}
                      className="text-black/30 hover:text-black transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 border-2 border-dashed border-black/10 rounded-lg p-5 text-sm text-black/40 cursor-pointer hover:border-black/20 hover:bg-black/5 transition-colors">
                    <UploadCloud className="h-6 w-6" />
                    <span>Click to select file</span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".docx,.doc,.pdf"
                      className="sr-only"
                      onChange={e => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>

              {serverError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {isDuplicate ? (
                    <p>
                      An abstract has already been submitted with this email. To make changes, please{" "}
                      <a href={SUPPORT_HREF} className="underline font-medium">contact us</a>.
                    </p>
                  ) : (
                    <p>{serverError}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || overLimit}
                className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting ? "Submitting…" : "Submit Abstract"}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
