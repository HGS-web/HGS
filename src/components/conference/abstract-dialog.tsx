"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, X, UserPlus } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { sessions } from "@/data/sessions"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

const coAuthorSchema = z.object({
  first_name:  z.string().min(1, "Required"),
  last_name:   z.string().min(1, "Required"),
  email:       z.string().email("Invalid email"),
  affiliation: z.string().min(1, "Required"),
})

const schema = z.object({
  first_name:    z.string().min(1, "Required"),
  last_name:     z.string().min(1, "Required"),
  email:         z.string().email("Invalid email"),
  affiliation:   z.string().min(1, "Required"),
  title:         z.string().min(3, "Please enter the abstract title"),
  session_id:    z.string().min(1, "Please select a session"),
  co_authors:    z.array(coAuthorSchema),
  abstract_text: z.string().min(1, "Please enter your abstract text"),
  notes:         z.string(),
})

type FormData = z.infer<typeof schema>
type CoAuthorData = z.infer<typeof coAuthorSchema>

function wordCount(t: string) {
  return t.trim() === "" ? 0 : t.trim().split(/\s+/).length
}

const SUPPORT_HREF = `mailto:ekarkani@geol.uoa.gr?subject=${encodeURIComponent("HGS Conference 2026 – Change Request")}&body=${encodeURIComponent("Email used for registration:\n\nDescription of change or issue:\n\n")}`

// ─── Co-Author Dialog ──────────────────────────────────────────────────────

function CoAuthorDialog({ onAdd }: { onAdd: (ca: CoAuthorData) => void }) {
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CoAuthorData>({ resolver: zodResolver(coAuthorSchema) })

  const handleAdd = (data: CoAuthorData) => {
    onAdd(data)
    reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) reset(); setOpen(val) }}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-black/50 hover:text-black border border-black/15 rounded-lg px-2.5 py-1.5 hover:bg-black/5 transition-colors cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add co-author
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Co-author</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.stopPropagation(); return handleSubmit(handleAdd)(e) }} className="space-y-3 mt-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="ca-fn" className="text-xs">First Name *</Label>
              <Input id="ca-fn" {...register("first_name")} aria-invalid={!!errors.first_name} />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ca-ln" className="text-xs">Last Name *</Label>
              <Input id="ca-ln" {...register("last_name")} aria-invalid={!!errors.last_name} />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ca-em" className="text-xs">Email *</Label>
            <Input id="ca-em" type="email" {...register("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="ca-af" className="text-xs">Affiliation *</Label>
            <Input id="ca-af" placeholder="University / Institution" {...register("affiliation")} aria-invalid={!!errors.affiliation} />
            {errors.affiliation && <p className="text-xs text-red-500">{errors.affiliation.message}</p>}
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 transition-colors cursor-pointer"
          >
            Add Co-author
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Abstract Form (inline) ────────────────────────────────────────────────

export function AbstractForm() {
  const [success, setSuccess]         = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isDuplicate, setIsDuplicate] = useState(false)

  const { register, handleSubmit, watch, reset, control, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { abstract_text: "", notes: "", co_authors: [] },
    })

  const { fields, append, remove } = useFieldArray({ control, name: "co_authors" })

  const abstractText = watch("abstract_text") ?? ""
  const words        = wordCount(abstractText)
  const overLimit    = words > 300

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    setIsDuplicate(false)
    const supabase = getSupabaseClient()
    if (!supabase) { setServerError("Service unavailable."); return }

    const normalized = data.email.trim().toLowerCase()

    const { data: existing } = await supabase
      .from("abstracts").select("id").ilike("email", normalized).maybeSingle()

    if (existing) { setIsDuplicate(true); setServerError("duplicate"); return }

    const sessionId    = parseInt(data.session_id)
    const session      = sessions.find(s => s.id === sessionId)
    const sessionLabel = session ? `${session.id}. ${session.title}` : String(sessionId)

    const coAuthorsText = data.co_authors.length > 0
      ? data.co_authors.map(ca => `${ca.first_name} ${ca.last_name} (${ca.email}, ${ca.affiliation})`).join("; ")
      : ""

    const { error } = await supabase.from("abstracts").insert([{
      first_name:    data.first_name,
      last_name:     data.last_name,
      email:         normalized,
      affiliation:   data.affiliation,
      session:       sessionLabel,
      title:         data.title,
      co_authors:    coAuthorsText,
      abstract_text: data.abstract_text.trim(),
      notes:         data.notes.trim(),
    }]).select("id").single()

    if (error) { setServerError("Something went wrong. Please try again."); return }

    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:        "abstract",
        first_name:  data.first_name,
        last_name:   data.last_name,
        affiliation: data.affiliation,
        email:       normalized,
        title:       data.title,
        co_authors:  data.co_authors,
        session:     sessionLabel,
      }),
    }).catch(() => {})

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="py-8 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <p className="text-base font-semibold text-black">Abstract submitted!</p>
        <p className="text-sm text-black/50 leading-relaxed">
          Thank you. A confirmation email is on its way.
          Author notifications by <strong>1 July 2026</strong>.
        </p>
        <button
          onClick={() => { reset(); setSuccess(false); setServerError(null); setIsDuplicate(false) }}
          className="px-6 py-2 bg-black text-white text-sm rounded-full hover:bg-black/80 transition-colors cursor-pointer"
        >
          Submit another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">

      {/* Author */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="a-first">First Name *</Label>
          <Input id="a-first" {...register("first_name")} aria-invalid={!!errors.first_name} />
          {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-last">Last Name *</Label>
          <Input id="a-last" {...register("last_name")} aria-invalid={!!errors.last_name} />
          {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="a-email">Email *</Label>
        <Input id="a-email" type="email" {...register("email")} aria-invalid={!!errors.email} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="a-aff">Affiliation *</Label>
        <Input id="a-aff" placeholder="University / Institution" {...register("affiliation")} aria-invalid={!!errors.affiliation} />
        {errors.affiliation && <p className="text-xs text-red-500">{errors.affiliation.message}</p>}
      </div>

      {/* Abstract details */}
      <div className="space-y-1.5">
        <Label htmlFor="a-title">Abstract Title *</Label>
        <Input id="a-title" {...register("title")} aria-invalid={!!errors.title} />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="a-session">Session *</Label>
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
          <CoAuthorDialog onAdd={(ca) => append(ca)} />
        </div>

        {fields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-1.5 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs"
              >
                <span className="text-black/70">
                  {field.first_name} {field.last_name}
                  <span className="text-black/40 ml-1">· {field.affiliation}</span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="ml-0.5 text-black/30 hover:text-black transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Abstract text */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="a-text">Abstract Text *</Label>
          <span className={`text-xs ${overLimit ? "text-red-500 font-medium" : "text-black/40"}`}>
            {words} / 300 words
          </span>
        </div>
        <Textarea
          id="a-text"
          rows={6}
          placeholder="Paste or type your abstract here (max 300 words)…"
          {...register("abstract_text")}
          aria-invalid={overLimit || !!errors.abstract_text}
        />
        {overLimit && <p className="text-xs text-red-500">Abstract exceeds 300 words.</p>}
        {!overLimit && errors.abstract_text && <p className="text-xs text-red-500">{errors.abstract_text.message}</p>}
      </div>

      {/* Additional notes */}
      <div className="space-y-1.5">
        <Label htmlFor="a-notes">
          Additional Notes{" "}
          <span className="font-normal text-black/40">(optional)</span>
        </Label>
        <Textarea
          id="a-notes"
          rows={3}
          placeholder="Any additional information for the scientific committee…"
          {...register("notes")}
        />
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
  )
}
