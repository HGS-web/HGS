"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ConsentFields } from "@/components/conference/consent-fields"
import { CountryField } from "@/components/conference/country-field"
import {
  CONFERENCE_FEES,
  CURRENT_FEE_PERIOD,
  FEE_MICROCOPY,
  REGISTRATION_TYPES,
} from "@/config/conference2026"
import type { MePayload } from "@/lib/conference2026-types"

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  affiliation: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  registration_type: z.enum(["regular", "hgs_member", "student", "hgs_student"], {
    error: "Please select a registration type",
  }),
  gdpr_consent: z.boolean().refine((v) => v === true, {
    message: "You must accept the data processing terms to proceed.",
  }),
  mailing_consent: z.boolean(),
})

type FormData = z.infer<typeof schema>

/**
 * Shown when an account exists but the registration was never completed
 * (e.g. the register flow was interrupted after account creation).
 */
export function ProfileCompleteRegistration({
  me,
  onChanged,
}: {
  me: MePayload
  onChanged: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        first_name: me.person?.first_name ?? "",
        last_name: me.person?.last_name ?? "",
        affiliation: me.person?.affiliation ?? "",
        gdpr_consent: false,
        mailing_consent: false,
      },
    })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const res = await fetch("/api/conference2026/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok || res.status === 409) {
      onChanged()
      return
    }
    setServerError("Something went wrong. Please try again.")
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-semibold text-black">Complete your registration</h2>
        <p className="mt-1 text-sm text-black/50 leading-relaxed">
          Your account was created, but your conference registration has not
          been completed yet. Please fill in the details below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cr-first">First Name *</Label>
            <Input id="cr-first" {...register("first_name")} aria-invalid={!!errors.first_name} />
            {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cr-last">Last Name *</Label>
            <Input id="cr-last" {...register("last_name")} aria-invalid={!!errors.last_name} />
            {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cr-aff">Affiliation *</Label>
          <Input id="cr-aff" placeholder="University / Institution" {...register("affiliation")} aria-invalid={!!errors.affiliation} />
          {errors.affiliation && <p className="text-xs text-red-500">{errors.affiliation.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cr-country">Country *</Label>
          <input type="hidden" {...register("country")} />
          <CountryField
            id="cr-country"
            value={watch("country") ?? ""}
            onChange={(v) => setValue("country", v, { shouldDirty: true })}
            invalid={!!errors.country}
          />
          {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cr-type">Registration Type *</Label>
          <Select id="cr-type" {...register("registration_type")} aria-invalid={!!errors.registration_type}>
            <option value="">Select…</option>
            {REGISTRATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {CONFERENCE_FEES[type].label} — €{CONFERENCE_FEES[type][CURRENT_FEE_PERIOD]}
              </option>
            ))}
          </Select>
          {errors.registration_type && <p className="text-xs text-red-500">{errors.registration_type.message}</p>}
          <p className="text-xs text-black/40">{FEE_MICROCOPY}</p>
        </div>

        <ConsentFields
          gdprProps={register("gdpr_consent")}
          mailingProps={register("mailing_consent")}
          gdprError={errors.gdpr_consent?.message}
        />

        {serverError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isSubmitting ? "Submitting…" : "Complete registration"}
        </button>
      </form>
    </div>
  )
}
