"use client"

import { useState } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PasswordFields({
  passwordProps,
  confirmProps,
  passwordError,
  confirmError,
  passwordLabel = "Password",
  confirmLabel = "Confirm password",
  passwordValue,
  confirmValue,
}: {
  passwordProps: UseFormRegisterReturn
  confirmProps: UseFormRegisterReturn
  passwordError?: string
  confirmError?: string
  passwordLabel?: string
  confirmLabel?: string
  /** When provided, the length hint and the match check react live. */
  passwordValue?: string
  confirmValue?: string
}) {
  const [show, setShow] = useState(false)

  const lengthOk = passwordValue !== undefined && passwordValue.length >= 8
  const liveMismatch =
    passwordValue !== undefined &&
    confirmValue !== undefined &&
    confirmValue.length > 0 &&
    confirmValue !== passwordValue
  const liveMatch =
    lengthOk && confirmValue !== undefined && confirmValue === passwordValue

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="pw-password">{passwordLabel} *</Label>
        <div className="relative">
          <Input
            id="pw-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            className="pr-10"
            {...passwordProps}
            aria-invalid={!!passwordError}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors cursor-pointer"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className={`text-xs ${lengthOk ? "text-green-700" : "text-black/40"}`}>
          {lengthOk ? "✓ At least 8 characters." : "At least 8 characters."}
        </p>
        {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pw-confirm">{confirmLabel} *</Label>
        <Input
          id="pw-confirm"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          {...confirmProps}
          aria-invalid={!!confirmError}
        />
        {(confirmError || liveMismatch) && (
          <p className="text-xs text-red-500">
            {confirmError ?? "Passwords do not match."}
          </p>
        )}
        {liveMatch && !confirmError && (
          <p className="text-xs text-green-700">✓ Passwords match.</p>
        )}
      </div>
    </>
  )
}
