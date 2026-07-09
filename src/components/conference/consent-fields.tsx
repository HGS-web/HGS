"use client"

import type { UseFormRegisterReturn } from "react-hook-form"

/**
 * GDPR (required) + mailing (optional) consent blocks, shared by the
 * conference registration flow. Copy carried over from the original
 * registration dialog.
 */
export function ConsentFields({
  gdprProps,
  mailingProps,
  gdprError,
}: {
  gdprProps: UseFormRegisterReturn
  mailingProps: UseFormRegisterReturn
  gdprError?: string
}) {
  return (
    <>
      {/* GDPR consent – required */}
      <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 space-y-2.5">
        <p className="text-xs font-semibold text-black/60 uppercase tracking-wider">Data Protection (GDPR) *</p>
        <p className="text-xs text-black/50 leading-relaxed">
          The Hellenic Geographical Society (HGS) collects and processes your personal data
          for the purpose of organising the 13th International Conference and for the ongoing
          records of the Society in connection with future events and activities. Your data will
          not be shared with third parties. You have the right to access, correct, or request
          deletion of your data at any time by contacting{" "}
          <a href="mailto:geographicalsocietyhellas@gmail.com" className="underline">geographicalsocietyhellas@gmail.com</a>.
        </p>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            {...gdprProps}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-black"
          />
          <span className="text-xs text-black/70 leading-relaxed group-hover:text-black transition-colors">
            I have read and consent to the processing of my personal data as described above.
          </span>
        </label>
        {gdprError && <p className="text-xs text-red-500">{gdprError}</p>}
      </div>

      {/* Mailing consent – optional */}
      <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 space-y-2.5">
        <p className="text-xs font-semibold text-black/60 uppercase tracking-wider">Stay Updated</p>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            {...mailingProps}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-black"
          />
          <span className="text-xs text-black/50 leading-relaxed group-hover:text-black/70 transition-colors">
            I would like to receive updates about future HGS events, conferences, and announcements.
          </span>
        </label>
        <p className="text-xs text-black/35 leading-relaxed pl-7">
          You can change this preference at any time by contacting{" "}
          <a href="mailto:geographicalsocietyhellas@gmail.com" className="underline">geographicalsocietyhellas@gmail.com</a>.
        </p>
      </div>
    </>
  )
}
